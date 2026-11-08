# Backward-compatibility bridge: MediGuard AI now uses Groq LLaMA-3 by default
from app.ml.groq_assistant import GroqHealthAssistant, groq_assistant, SAFETY_DISCLAIMER

GeminiHealthAssistant = GroqHealthAssistant
gemini_assistant = groq_assistant

__all__ = ["GeminiHealthAssistant", "gemini_assistant", "groq_assistant", "SAFETY_DISCLAIMER"]
