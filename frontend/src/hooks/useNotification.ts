import { useState, useCallback } from 'react';

export interface NotificationItem {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

export const useNotification = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const showNotification = useCallback((
    type: NotificationItem['type'], 
    message: string, 
    duration?: number
  ) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const notification: NotificationItem = {
      id,
      type,
      message,
      duration
    };

    setNotifications(prev => [...prev, notification]);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Convenience methods
  const showSuccess = useCallback((message: string, duration?: number) => {
    showNotification('success', message, duration);
  }, [showNotification]);

  const showError = useCallback((message: string, duration?: number) => {
    showNotification('error', message, duration);
  }, [showNotification]);

  const showWarning = useCallback((message: string, duration?: number) => {
    showNotification('warning', message, duration);
  }, [showNotification]);

  const showInfo = useCallback((message: string, duration?: number) => {
    showNotification('info', message, duration);
  }, [showNotification]);

  return {
    notifications,
    showNotification,
    removeNotification,
    clearAllNotifications,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };
};