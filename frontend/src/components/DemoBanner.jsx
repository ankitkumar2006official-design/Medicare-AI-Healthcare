import React from 'react';
import { useAuth, DEMO_CREDENTIALS } from '../context/AuthContext';
import { useWebSocket } from '../context/WebSocketContext';
import { AlertCircle, Sliders, Shield, Zap } from 'lucide-react';

export default function DemoBanner({ onOpenSimulator }) {
  const { user, switchDemoRole } = useAuth();
  const { isConnected } = useWebSocket();

  return (
    <div className="bg-slate-900 border-b border-slate-800 text-white px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center space-x-2">
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-hospital-teal text-white">
          Hackathon Demo Mode
        </span>
        <span className="text-slate-400 hidden sm:inline">
          Operation Ward Zero: Home-to-Ward Telemetry & AI Safety Engine
        </span>
        <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full ${isConnected ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`}></span>
          <span className="text-[11px] font-medium">{isConnected ? 'IoT Stream Live' : 'Connecting Stream...'}</span>
        </span>
      </div>

      <div className="flex items-center space-x-2">
        <span className="text-slate-400 hidden md:inline">Quick Role Switcher:</span>
        <div className="flex space-x-1">
          {DEMO_CREDENTIALS.map((cred) => (
            <button
              key={cred.role}
              onClick={() => switchDemoRole(cred.role)}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                user?.role === cred.role
                  ? 'bg-hospital-teal text-white shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {cred.label.split(' ')[0]}
            </button>
          ))}
        </div>

        <button
          onClick={onOpenSimulator}
          className="ml-2 inline-flex items-center space-x-1 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 px-2.5 py-1 rounded text-[11px] font-semibold transition-colors"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>IoT Simulator Hub</span>
        </button>
      </div>
    </div>
  );
}
