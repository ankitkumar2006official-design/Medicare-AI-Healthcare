import React, { useRef, useEffect, useState } from 'react';
import { Activity, Radio, Eye } from 'lucide-react';

export default function ECGLeadCanvas({
  heartRate = 75,
  spo2 = 98,
  respRate = 16,
  height = 140,
  leadName = 'Lead II',
  patientId = null,
}) {
  const canvasRef = useRef(null);
  const [activeChannel, setActiveChannel] = useState('ecg'); // ecg, pleth, resp

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let x = 0;
    const speed = 2.2; // pixels per frame
    const sweepWidth = 12; // gap size behind the sweep head

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = height;
    const midY = h / 2;

    // Draw background ECG grid
    const drawGrid = () => {
      ctx.fillStyle = '#061320';
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = '#0e2b44';
      ctx.lineWidth = 0.5;

      // Small grid lines (every 10px)
      for (let gx = 0; gx < w; gx += 10) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, h);
        ctx.stroke();
      }
      for (let gy = 0; gy < h; gy += 10) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(w, gy);
        ctx.stroke();
      }

      // Major grid lines (every 50px)
      ctx.strokeStyle = '#164264';
      ctx.lineWidth = 1;
      for (let gx = 0; gx < w; gx += 50) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, h);
        ctx.stroke();
      }
      for (let gy = 0; gy < h; gy += 50) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(w, gy);
        ctx.stroke();
      }
    };

    drawGrid();

    // Physiological waveform synthesizer
    let phase = 0;
    let lastY = midY;

    const render = () => {
      // Calculate rate frequency
      const bpm = Math.max(30, Math.min(200, heartRate || 75));
      const periodSec = 60 / bpm;
      const phaseDelta = (1 / 60) / periodSec; // 60 fps normalized

      phase = (phase + phaseDelta) % 1.0;

      let yOffset = 0;

      if (activeChannel === 'ecg') {
        // Authentic Lead II P-QRS-T complex
        if (phase < 0.12) {
          yOffset = 0; // Baseline
        } else if (phase >= 0.12 && phase < 0.20) {
          // P-wave (atrial depolarization)
          const pProgress = (phase - 0.12) / 0.08;
          yOffset = -10 * Math.sin(pProgress * Math.PI);
        } else if (phase >= 0.20 && phase < 0.28) {
          yOffset = 0; // PR segment
        } else if (phase >= 0.28 && phase < 0.30) {
          // Q-wave (small downward)
          yOffset = 5;
        } else if (phase >= 0.30 && phase < 0.34) {
          // R-spike (sharp tall upward ventricular depolarization)
          const rProgress = (phase - 0.30) / 0.04;
          yOffset = -48 * Math.sin(rProgress * Math.PI);
        } else if (phase >= 0.34 && phase < 0.37) {
          // S-wave (downward plunge)
          const sProgress = (phase - 0.34) / 0.03;
          yOffset = 14 * Math.sin(sProgress * Math.PI);
        } else if (phase >= 0.37 && phase < 0.46) {
          yOffset = 0; // ST segment
        } else if (phase >= 0.46 && phase < 0.62) {
          // T-wave (ventricular repolarization)
          const tProgress = (phase - 0.46) / 0.16;
          yOffset = -16 * Math.sin(tProgress * Math.PI);
        } else {
          yOffset = 0; // Isoelectric resting
        }
      } else if (activeChannel === 'pleth') {
        // SpO2 Photoplethysmogram (Dicrotic notch pulse wave)
        const plethPhase = phase;
        if (plethPhase < 0.25) {
          const up = plethPhase / 0.25;
          yOffset = -35 * Math.sin(up * (Math.PI / 2));
        } else if (plethPhase < 0.45) {
          const down = (plethPhase - 0.25) / 0.20;
          yOffset = -35 + down * 18; // Dicrotic dip
        } else if (plethPhase < 0.55) {
          const notch = (plethPhase - 0.45) / 0.10;
          yOffset = -17 - 6 * Math.sin(notch * Math.PI); // Dicrotic wave rebound
        } else {
          const rest = (plethPhase - 0.55) / 0.45;
          yOffset = -17 * (1 - rest);
        }
      } else {
        // Respiration capnograph wave (slower)
        const respFreq = (respRate || 16) / 60;
        const respTime = (Date.now() / 1000) * respFreq * 2 * Math.PI;
        yOffset = -25 * Math.sin(respTime);
      }

      // Add mild physiological noise jitter
      const jitter = (Math.random() - 0.5) * 1.2;
      const currentY = midY + yOffset + jitter;

      // Clear upcoming area ahead of the sweep head
      ctx.fillStyle = '#061320';
      ctx.fillRect(x, 0, sweepWidth, h);

      // Re-draw minor grid in cleared slice
      ctx.strokeStyle = '#0e2b44';
      ctx.lineWidth = 0.5;
      for (let gy = 0; gy < h; gy += 10) {
        ctx.beginPath();
        ctx.moveTo(x, gy);
        ctx.lineTo(x + sweepWidth, gy);
        ctx.stroke();
      }

      // Draw phosphorescent green trace
      ctx.beginPath();
      ctx.moveTo(Math.max(0, x - speed), lastY);
      ctx.lineTo(x, currentY);

      if (activeChannel === 'ecg') {
        ctx.strokeStyle = '#10B981'; // Phosphor green
        ctx.shadowColor = '#059669';
        ctx.shadowBlur = 4;
        ctx.lineWidth = 2.0;
      } else if (activeChannel === 'pleth') {
        ctx.strokeStyle = '#06B6D4'; // Cyan
        ctx.shadowColor = '#0891B2';
        ctx.shadowBlur = 4;
        ctx.lineWidth = 2.0;
      } else {
        ctx.strokeStyle = '#F59E0B'; // Amber
        ctx.shadowColor = '#D97706';
        ctx.shadowBlur = 4;
        ctx.lineWidth = 2.0;
      }

      ctx.stroke();
      ctx.shadowBlur = 0; // reset

      lastY = currentY;
      x = (x + speed) % w;

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [heartRate, spo2, respRate, height, activeChannel]);

  return (
    <div className="bg-[#061320] rounded-xl border border-slate-800 p-3 shadow-inner relative overflow-hidden">
      {/* Top Telemetry Header */}
      <div className="flex items-center justify-between text-xs text-slate-400 mb-2 border-b border-slate-800/80 pb-2">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span className="font-mono font-bold text-emerald-400 uppercase tracking-widest text-[11px]">
            {activeChannel === 'ecg' ? 'ECG LEAD II' : activeChannel === 'pleth' ? 'SPO2 PLETH' : 'RESP CAPNO'}
          </span>
          <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
            25 mm/s &bull; 10 mm/mV &bull; Filter: Diagnostic
          </span>
        </div>

        {/* Channel Selector */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setActiveChannel('ecg')}
            className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold transition-colors ${
              activeChannel === 'ecg'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Lead II
          </button>
          <button
            onClick={() => setActiveChannel('pleth')}
            className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold transition-colors ${
              activeChannel === 'pleth'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Pleth
          </button>
          <button
            onClick={() => setActiveChannel('resp')}
            className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold transition-colors ${
              activeChannel === 'resp'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Resp
          </button>
        </div>
      </div>

      {/* Sweep Canvas */}
      <div className="relative">
        <canvas ref={canvasRef} style={{ width: '100%', height: `${height}px` }} />

        {/* Live Heart Rate Overlay */}
        <div className="absolute right-3 bottom-2 bg-slate-900/80 backdrop-blur-sm border border-slate-800 px-2.5 py-1 rounded text-right pointer-events-none">
          <div className="text-[9px] uppercase font-bold text-slate-400">Heart Rate</div>
          <div className="text-xl font-mono font-bold text-emerald-400 leading-tight">
            {heartRate ? Math.round(heartRate) : '--'}
            <span className="text-[9px] font-normal text-slate-400 ml-1">BPM</span>
          </div>
        </div>
      </div>
    </div>
  );
}
