import asyncio
import copy
import json
import logging
import os
import re
from datetime import datetime
from typing import Any, Dict, List, Optional
import uuid

import pymongo
from app.config import settings

logger = logging.getLogger("mediguard.database")

COLLECTION_NAMES = [
    "users",
    "patients",
    "devices",
    "vital_readings",
    "patient_baselines",
    "risk_assessments",
    "alerts",
    "caregiver_responses",
    "medications",
    "audit_logs",
    "notifications",
]


class ResilientCollection:
    """In-memory async collection with JSON persistence fallback."""
    def __init__(self, name: str, db_parent: "ResilientDatabase"):
        self.name = name
        self.db = db_parent
        self.documents: List[Dict[str, Any]] = []
        self.indexes: List[Dict[str, Any]] = []

    def _matches(self, doc: Dict[str, Any], query: Dict[str, Any]) -> bool:
        if not query:
            return True
        for key, expected in query.items():
            if key == "$or":
                return any(self._matches(doc, subq) for subq in expected)
            if key == "$and":
                return all(self._matches(doc, subq) for subq in expected)

            # Nested dot notation support
            val = doc
            parts = key.split(".")
            for part in parts:
                if isinstance(val, dict) and part in val:
                    val = val[part]
                else:
                    val = None
                    break

            if isinstance(expected, dict):
                for op, op_val in expected.items():
                    if op == "$eq" and val != op_val:
                        return False
                    if op == "$ne" and val == op_val:
                        return False
                    if op == "$gt" and (val is None or val <= op_val):
                        return False
                    if op == "$gte" and (val is None or val < op_val):
                        return False
                    if op == "$lt" and (val is None or val >= op_val):
                        return False
                    if op == "$lte" and (val is None or val > op_val):
                        return False
                    if op == "$in" and val not in op_val:
                        return False
                    if op == "$nin" and val in op_val:
                        return False
                    if op == "$regex":
                        pattern = op_val
                        if not val or not re.search(pattern, str(val), re.IGNORECASE):
                            return False
            else:
                if val != expected:
                    return False
        return True

    async def create_index(self, keys: Any, **kwargs):
        self.indexes.append({"keys": keys, "kwargs": kwargs})
        return True

    async def find_one(self, query: Optional[Dict[str, Any]] = None, projection: Optional[Dict[str, Any]] = None) -> Optional[Dict[str, Any]]:
        query = query or {}
        for doc in self.documents:
            if self._matches(doc, query):
                res = copy.deepcopy(doc)
                if projection and projection.get("_id") == 0:
                    res.pop("_id", None)
                return res
        return None

    class QueryCursor:
        def __init__(self, collection: "ResilientCollection", query: Dict[str, Any]):
            self.collection = collection
            self.query = query or {}
            self._sort_field: Optional[str] = None
            self._sort_dir: int = 1
            self._skip: int = 0
            self._limit: Optional[int] = None

        def sort(self, key_or_list: Any, direction: int = 1):
            if isinstance(key_or_list, list):
                if len(key_or_list) > 0:
                    self._sort_field = key_or_list[0][0]
                    self._sort_dir = key_or_list[0][1]
            elif isinstance(key_or_list, str):
                self._sort_field = key_or_list
                self._sort_dir = direction
            return self

        def skip(self, n: int):
            self._skip = n
            return self

        def limit(self, n: int):
            self._limit = n
            return self

        async def to_list(self, length: Optional[int] = None) -> List[Dict[str, Any]]:
            matched = [
                copy.deepcopy(doc)
                for doc in self.collection.documents
                if self.collection._matches(doc, self.query)
            ]
            if self._sort_field:
                reverse = self._sort_dir == -1
                def sort_key(d):
                    v = d.get(self._sort_field)
                    if v is None:
                        return ""
                    return str(v)
                matched.sort(key=sort_key, reverse=reverse)

            start = self._skip
            if self._limit is not None:
                end = start + self._limit
                matched = matched[start:end]
            elif length is not None:
                matched = matched[start : start + length]
            else:
                matched = matched[start:]
            return matched

        def __aiter__(self):
            async def _gen():
                docs = await self.to_list()
                for d in docs:
                    yield d
            return _gen()

    def find(self, query: Optional[Dict[str, Any]] = None, projection: Optional[Dict[str, Any]] = None) -> QueryCursor:
        return self.QueryCursor(self, query or {})

    async def insert_one(self, document: Dict[str, Any]):
        doc = copy.deepcopy(document)
        if "_id" not in doc:
            doc["_id"] = str(uuid.uuid4())
        self.documents.append(doc)
        self.db.schedule_save()
        class InsertResult:
            def __init__(self, inserted_id):
                self.inserted_id = inserted_id
        return InsertResult(doc["_id"])

    async def insert_many(self, documents: List[Dict[str, Any]]):
        ids = []
        for d in documents:
            res = await self.insert_one(d)
            ids.append(res.inserted_id)
        class InsertManyResult:
            def __init__(self, inserted_ids):
                self.inserted_ids = inserted_ids
        return InsertManyResult(ids)

    async def update_one(self, query: Dict[str, Any], update: Dict[str, Any], upsert: bool = False):
        modified_count = 0
        target = None
        for doc in self.documents:
            if self._matches(doc, query):
                target = doc
                break

        if target is not None:
            if "$set" in update:
                for k, v in update["$set"].items():
                    target[k] = copy.deepcopy(v)
            if "$unset" in update:
                for k in update["$unset"]:
                    target.pop(k, None)
            if "$inc" in update:
                for k, v in update["$inc"].items():
                    target[k] = target.get(k, 0) + v
            modified_count = 1
            self.db.schedule_save()
        elif upsert:
            new_doc = copy.deepcopy(query)
            if "$set" in update:
                new_doc.update(copy.deepcopy(update["$set"]))
            await self.insert_one(new_doc)
            modified_count = 1

        class UpdateResult:
            def __init__(self, modified_count):
                self.modified_count = modified_count
                self.matched_count = 1 if target else 0
        return UpdateResult(modified_count)

    async def delete_one(self, query: Dict[str, Any]):
        idx_to_remove = None
        for i, doc in enumerate(self.documents):
            if self._matches(doc, query):
                idx_to_remove = i
                break
        deleted_count = 0
        if idx_to_remove is not None:
            self.documents.pop(idx_to_remove)
            deleted_count = 1
            self.db.schedule_save()

        class DeleteResult:
            def __init__(self, deleted_count):
                self.deleted_count = deleted_count
        return DeleteResult(deleted_count)

    async def count_documents(self, query: Dict[str, Any]) -> int:
        return sum(1 for doc in self.documents if self._matches(doc, query))


class ResilientDatabase:
    """Async resilient document database with disk persistence."""
    def __init__(self, filepath: str = "data/mediguard_db.json"):
        self.filepath = filepath
        self.collections: Dict[str, ResilientCollection] = {}
        for name in COLLECTION_NAMES:
            self.collections[name] = ResilientCollection(name, self)
        self._load_from_disk()

    def __getitem__(self, name: str) -> ResilientCollection:
        if name not in self.collections:
            self.collections[name] = ResilientCollection(name, self)
        return self.collections[name]

    def _load_from_disk(self):
        try:
            if os.path.exists(self.filepath):
                with open(self.filepath, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    for col_name, docs in data.items():
                        if col_name in self.collections:
                            self.collections[col_name].documents = docs
                logger.info(f"Loaded resilient database snapshot from {self.filepath}")
        except Exception as e:
            logger.warning(f"Could not load database snapshot: {e}")

    def schedule_save(self):
        try:
            os.makedirs(os.path.dirname(self.filepath) or ".", exist_ok=True)
            data = {name: col.documents for name, col in self.collections.items()}
            with open(self.filepath, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2, default=str)
        except Exception as e:
            logger.warning(f"Could not save database snapshot: {e}")


class MongoAsyncCollectionWrapper:
    """Wraps PyMongo sync collection to provide async interface."""
    def __init__(self, collection: pymongo.collection.Collection):
        self.collection = collection

    async def create_index(self, *args, **kwargs):
        return await asyncio.to_thread(self.collection.create_index, *args, **kwargs)

    async def find_one(self, *args, **kwargs):
        res = await asyncio.to_thread(self.collection.find_one, *args, **kwargs)
        if res and "_id" in res:
            res["_id"] = str(res["_id"])
        return res

    class AsyncCursor:
        def __init__(self, cursor):
            self.cursor = cursor

        def sort(self, *args, **kwargs):
            self.cursor.sort(*args, **kwargs)
            return self

        def skip(self, *args, **kwargs):
            self.cursor.skip(*args, **kwargs)
            return self

        def limit(self, *args, **kwargs):
            self.cursor.limit(*args, **kwargs)
            return self

        async def to_list(self, length: Optional[int] = None) -> List[Dict[str, Any]]:
            def _fetch():
                c = self.cursor
                if length is not None:
                    c = c.limit(length)
                docs = list(c)
                for d in docs:
                    if "_id" in d:
                        d["_id"] = str(d["_id"])
                return docs
            return await asyncio.to_thread(_fetch)

        def __aiter__(self):
            async def _gen():
                docs = await self.to_list()
                for d in docs:
                    yield d
            return _gen()

    def find(self, *args, **kwargs) -> AsyncCursor:
        cursor = self.collection.find(*args, **kwargs)
        return self.AsyncCursor(cursor)

    async def insert_one(self, document: Dict[str, Any]):
        doc = copy.deepcopy(document)
        res = await asyncio.to_thread(self.collection.insert_one, doc)
        class InsertResult:
            def __init__(self, inserted_id):
                self.inserted_id = str(inserted_id)
        return InsertResult(res.inserted_id)

    async def insert_many(self, documents: List[Dict[str, Any]]):
        docs = copy.deepcopy(documents)
        res = await asyncio.to_thread(self.collection.insert_many, docs)
        class InsertManyResult:
            def __init__(self, inserted_ids):
                self.inserted_ids = [str(x) for x in res.inserted_ids]
        return InsertManyResult(res.inserted_ids)

    async def update_one(self, *args, **kwargs):
        return await asyncio.to_thread(self.collection.update_one, *args, **kwargs)

    async def delete_one(self, *args, **kwargs):
        return await asyncio.to_thread(self.collection.delete_one, *args, **kwargs)

    async def count_documents(self, *args, **kwargs) -> int:
        return await asyncio.to_thread(self.collection.count_documents, *args, **kwargs)


class DatabaseManager:
    """Manages connection to MongoDB Atlas or the Resilient Fallback DB."""
    def __init__(self):
        self.is_connected_to_mongo: bool = False
        self.mongo_client: Optional[pymongo.MongoClient] = None
        self.db: Any = None
        self.db_type: str = "resilient_fallback"

    async def connect(self):
        uri = settings.MONGODB_URI
        can_connect = False
        if uri:
            # Fast socket check if connecting to localhost to avoid long DNS/TCP timeout
            if "localhost" in uri or "127.0.0.1" in uri:
                import socket
                try:
                    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                    s.settimeout(0.15)
                    can_connect = (s.connect_ex(("127.0.0.1", 27017)) == 0)
                    s.close()
                except Exception:
                    can_connect = False
            else:
                can_connect = True

        if can_connect:
            try:
                logger.info(f"Connecting to MongoDB URI: {uri}...")
                client = pymongo.MongoClient(uri, serverSelectionTimeoutMS=1000, connectTimeoutMS=1000)
                await asyncio.to_thread(client.admin.command, "ping")
                self.mongo_client = client
                self.is_connected_to_mongo = True
                self.db_type = "mongodb"
                raw_db = client[settings.MONGODB_DB_NAME]
                
                # Create wrapper collections
                self.db = {
                    name: MongoAsyncCollectionWrapper(raw_db[name])
                    for name in COLLECTION_NAMES
                }
                logger.info("Successfully connected to live MongoDB database!")
                await self._init_indexes()
                return
            except Exception as e:
                logger.warning(f"MongoDB connection failed ({e}). Activating Resilient Document Store fallback.")

        # Fallback
        self.is_connected_to_mongo = False
        self.db_type = "resilient_fallback"
        self.db = ResilientDatabase(filepath="data/mediguard_db.json")
        await self._init_indexes()
        logger.info("MediGuard Resilient Document Store is active and ready.")

    async def _init_indexes(self):
        try:
            # Patients: patient_id unique
            await self.db["patients"].create_index("patient_id", unique=True)
            # Users: email unique
            await self.db["users"].create_index("email", unique=True)
            # Vital readings: patient_id and timestamp
            await self.db["vital_readings"].create_index([("patient_id", 1), ("timestamp", -1)])
            # Alerts: patient_id, severity, status
            await self.db["alerts"].create_index([("patient_id", 1), ("status", 1)])
            await self.db["alerts"].create_index([("created_at", -1)])
            # Risk assessments: patient_id and timestamp
            await self.db["risk_assessments"].create_index([("patient_id", 1), ("timestamp", -1)])
            # Devices: device_id unique, patient_id
            await self.db["devices"].create_index("device_id", unique=True)
            await self.db["devices"].create_index("patient_id")
            # Caregiver responses: alert_id, patient_id
            await self.db["caregiver_responses"].create_index("alert_id")
            # Audit logs: timestamp desc
            await self.db["audit_logs"].create_index([("timestamp", -1)])
        except Exception as e:
            logger.warning(f"Index creation note: {e}")

    def get_collection(self, name: str):
        if isinstance(self.db, dict):
            if name not in self.db:
                # Wrap on the fly if needed
                raw_db = self.mongo_client[settings.MONGODB_DB_NAME]
                self.db[name] = MongoAsyncCollectionWrapper(raw_db[name])
            return self.db[name]
        return self.db[name]

    async def close(self):
        if self.mongo_client:
            self.mongo_client.close()
            logger.info("MongoDB connection closed.")


db_manager = DatabaseManager()

def get_collection(name: str):
    return db_manager.get_collection(name)
