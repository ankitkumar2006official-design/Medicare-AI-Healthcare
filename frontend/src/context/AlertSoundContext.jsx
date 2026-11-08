import React, { createContext, useContext, useState, useRef, useEffect } from 'react';

const AlertSoundContext = createContext(null);

export const AlertSoundProvider = ({ children }) => {
  const [isMuted, setIsMuted] = useState(() => {
    return localStorage.getItem('mediguard_muted') === 'true';
  });
  const audioCtxRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('mediguard_muted', isMuted ? 'true' : 'false');
  }, [isMuted]);

  const initAudio = () => {
    if (!audioCtxRef.current) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioCtxRef.current = new AudioContext();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  };

  const playTone = (freq, duration, type = 'sine', startTimeOffset = 0) => {
    if (isMuted) return;
    try {
      initAudio();
      if (!audioCtxRef.current) return;
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime + startTimeOffset);

      gain.gain.setValueAtTime(0.001, ctx.currentTime + startTimeOffset);
      gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + startTimeOffset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startTimeOffset + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + startTimeOffset);
      osc.stop(ctx.currentTime + startTimeOffset + duration + 0.05);
    } catch (e) {
      console.warn('Audio playback not allowed yet without user interaction:', e);
    }
  };

  // Hospital standard alarm sound patterns
  const playCriticalAlarm = () => {
    if (isMuted) return;
    // IEC 60601-1-8 3-pulse urgent burst: C5 - E5 - G5
    playTone(523.25, 0.15, 'triangle', 0.0);
    playTone(659.25, 0.15, 'triangle', 0.2);
    playTone(783.99, 0.25, 'triangle', 0.4);
  };

  const playWarningChime = () => {
    if (isMuted) return;
    playTone(587.33, 0.18, 'sine', 0.0);
    playTone(880.00, 0.22, 'sine', 0.22);
  };

  const toggleMute = () => {
    setIsMuted((prev) => !prev);
  };

  return (
    <AlertSoundContext.Provider
      value={{
        isMuted,
        toggleMute,
        playCriticalAlarm,
        playWarningChime,
      }}
    >
      {children}
    </AlertSoundContext.Provider>
  );
};

export const useAlertSound = () => useContext(AlertSoundContext);
