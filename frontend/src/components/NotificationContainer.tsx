import React from 'react';
import Notification from './Notification';
import type { NotificationItem } from '../hooks/useNotification';

interface NotificationContainerProps {
  notifications: NotificationItem[];
  onRemove: (id: string) => void;
}

const NotificationContainer: React.FC<NotificationContainerProps> = ({
  notifications,
  onRemove
}) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map((notification, index) => (
        <div
          key={notification.id}
          style={{
            transform: `translateY(${index * 10}px)`,
            zIndex: 1000 - index
          }}
        >
          <Notification
            type={notification.type}
            message={notification.message}
            duration={notification.duration}
            onClose={() => onRemove(notification.id)}
          />
        </div>
      ))}
    </div>
  );
};

export default NotificationContainer;