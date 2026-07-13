import { useEffect, useState, useCallback } from 'react';

export type AlertSound = 'critical' | 'warning' | 'info' | 'sos' | 'sla_breach';

interface AudioAlertsConfig {
  enabled: boolean;
  volume: number;
}

export const useAudioAlerts = () => {
  const [config, setConfig] = useState<AudioAlertsConfig>({
    enabled: true,
    volume: 0.7,
  });

  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);

  useEffect(() => {
    // Initialize Web Audio API with proper error handling
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      
      if (!AudioContextClass) {
        console.warn('Web Audio API not available in this browser');
        return;
      }

      const ctx = new AudioContextClass();
      setAudioContext(ctx);

      return () => {
        ctx.close().catch(() => {
          // Ignore close errors
        });
      };
    } catch (error) {
      console.warn('Failed to initialize Audio Context:', error);
      setConfig((prev) => ({ ...prev, enabled: false }));
    }
  }, []);

  const playTone = useCallback(
    (frequency: number, duration: number, volume: number = config.volume) => {
      if (!audioContext || !config.enabled) return;

      try {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(
          0.01,
          audioContext.currentTime + duration
        );

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);
      } catch (error) {
        console.warn('Failed to play audio tone:', error);
      }
    },
    [audioContext, config]
  );

  const playAlert = useCallback(
    (type: AlertSound) => {
      if (!config.enabled) return;

      switch (type) {
        case 'critical':
          // Urgent alarm - rapid high-low beeps
          playTone(1200, 0.15, config.volume);
          setTimeout(() => playTone(800, 0.15, config.volume), 200);
          setTimeout(() => playTone(1200, 0.15, config.volume), 400);
          setTimeout(() => playTone(800, 0.15, config.volume), 600);
          break;

        case 'sos':
          // SOS pattern - distinctive triple beep
          playTone(1400, 0.2, config.volume);
          setTimeout(() => playTone(1400, 0.2, config.volume), 300);
          setTimeout(() => playTone(1400, 0.2, config.volume), 600);
          break;

        case 'sla_breach':
          // SLA breach - continuous ascending tone
          playTone(600, 0.3, config.volume);
          setTimeout(() => playTone(800, 0.3, config.volume), 350);
          setTimeout(() => playTone(1000, 0.3, config.volume), 700);
          break;

        case 'warning':
          // Warning - double beep
          playTone(900, 0.2, config.volume);
          setTimeout(() => playTone(900, 0.2, config.volume), 300);
          break;

        case 'info':
          // Info - single soft beep
          playTone(600, 0.15, config.volume * 0.7);
          break;
      }
    },
    [config, playTone]
  );

  const setVolume = useCallback((volume: number) => {
    setConfig((prev) => ({ ...prev, volume: Math.max(0, Math.min(1, volume)) }));
  }, []);

  const toggleEnabled = useCallback(() => {
    setConfig((prev) => ({ ...prev, enabled: !prev.enabled }));
  }, []);

  return {
    playAlert,
    enabled: config.enabled,
    volume: config.volume,
    setVolume,
    toggleEnabled,
  };
};
