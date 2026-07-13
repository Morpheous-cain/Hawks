import { useEffect, useState } from 'react';
import { toast } from '@/hooks/use-toast';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'critical';
  timestamp: Date;
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const playNotificationSound = (type: 'info' | 'warning' | 'critical') => {
    if (!soundEnabled) return;
    
    try {
      // Check if AudioContext is available
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) {
        console.warn('AudioContext not supported in this browser');
        return;
      }
      
      // Create audio context for notification beeps
      const audioContext = new AudioContextClass();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Different frequencies for different alert types
      const frequencies = {
        info: 800,
        warning: 1000,
        critical: 1200,
      };
      
      oscillator.frequency.value = frequencies[type];
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.warn('Failed to play notification sound:', error);
    }
  };

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
    };

    setNotifications(prev => [newNotification, ...prev].slice(0, 50));
    
    playNotificationSound(notification.type);
    
    toast({
      title: notification.title,
      description: notification.message,
      variant: notification.type === 'critical' ? 'destructive' : 'default',
    });
  };

  const clearNotifications = () => setNotifications([]);

  return {
    notifications,
    addNotification,
    clearNotifications,
    soundEnabled,
    setSoundEnabled,
  };
};
