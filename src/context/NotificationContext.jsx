import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import notificationSocket from '../utils/notifications/socket';
import axiosInstance from '../utils/axios';
import {
  playNotificationSound,
  enableNotificationSound,
  disableNotificationSound,
  toggleNotificationSound,
  isSoundEnabled,
} from '../utils/notifications/audio';
import { dispatchAppNotification } from '../utils/notifications/events';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { user, permissions } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const handlersRef = useRef({ onNew: null, onUnread: null });
  const liveSeenIdsRef = useRef(new Set());

  const getToken = useCallback(() => {
    const storedToken =
      localStorage.getItem('jwt_token') || localStorage.getItem('token');
    if (storedToken) return storedToken;

    const cookies = document.cookie.split(';');
    const jwtCookie = cookies.find((cookie) =>
      cookie.trim().startsWith('jwt='),
    );
    if (jwtCookie) return jwtCookie.split('=')[1];
    return null;
  }, []);

  const handleNewNotification = useCallback((notification) => {
    if (!notification?.id) return;
    if (liveSeenIdsRef.current.has(notification.id)) return;
    liveSeenIdsRef.current.add(notification.id);

    setNotifications((prev) => {
      if (prev.some((n) => n.id === notification.id)) return prev;
      return [notification, ...prev];
    });
    setUnreadCount((prev) => prev + 1);
    playNotificationSound();

    // Notify mounted list pages / modules (auto-refresh, etc.)
    dispatchAppNotification(notification);

    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/assets/images/program_logos/MTJF new Logo-01.png',
          tag: `notification-${notification.id}`,
          requireInteraction: false,
        });
      } catch (error) {
        console.warn('Failed to show browser notification:', error);
      }
    }
  }, []);

  const handleUnreadCount = useCallback((data) => {
    const count = Number(data?.count);
    setUnreadCount(Number.isFinite(count) ? count : 0);
  }, []);

  // Keep refs for stable cleanup
  useEffect(() => {
    handlersRef.current = {
      onNew: handleNewNotification,
      onUnread: handleUnreadCount,
    };
  }, [handleNewNotification, handleUnreadCount]);

  // Connect / disconnect WebSocket with the logged-in user
  useEffect(() => {
    if (!user?.id) {
      notificationSocket.off('new_notification', handlersRef.current.onNew);
      notificationSocket.off('unread_count', handlersRef.current.onUnread);
      notificationSocket.disconnect();
      liveSeenIdsRef.current.clear();
      setNotifications([]);
      setUnreadCount(0);
      return undefined;
    }

    const token = getToken();
    if (!token) {
      console.error('No JWT token for notifications WebSocket');
      return undefined;
    }

    notificationSocket.connect(token);
    notificationSocket.on('new_notification', handleNewNotification);
    notificationSocket.on('unread_count', handleUnreadCount);

    return () => {
      notificationSocket.off('new_notification', handleNewNotification);
      notificationSocket.off('unread_count', handleUnreadCount);
    };
  }, [user?.id, getToken, handleNewNotification, handleUnreadCount]);

  const fetchNotifications = useCallback(async (page = 1, pageSize = 10) => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const response = await axiosInstance.get('/notifications', {
        params: {
          user_id: user.id,
          page,
          pageSize,
        },
      });

      if (response.data.success) {
        const fetchedNotifications = response.data.data || [];
        setNotifications((prev) => {
          const existingIds = new Set(prev.map((n) => n.id));
          const newOnes = fetchedNotifications.filter(
            (n) => !existingIds.has(n.id),
          );
          return [...newOnes, ...prev];
        });
        return response.data;
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchUnreadCount = useCallback(async () => {
    if (!user?.id) return;

    try {
      const response = await axiosInstance.get('/notifications/unread-count');
      if (response.data.success) {
        const count =
          response.data.data?.count ??
          response.data.count ??
          0;
        setUnreadCount(Number(count) || 0);
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  }, [user]);

  const markAsRead = useCallback(async (notificationId) => {
    if (!user?.id) return;

    try {
      const response = await axiosInstance.patch(
        `/notifications/${notificationId}/read`,
      );

      if (response.data.success) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, is_read: true } : n,
          ),
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  }, [user]);

  const markAllAsRead = useCallback(async () => {
    if (!user?.id) return;

    try {
      const response = await axiosInstance.post('/notifications/mark-all-read');

      if (response.data.success) {
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, is_read: true })),
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  }, [user]);

  useEffect(() => {
    const hasAccess = () => {
      if (!user?.id) return false;
      if (permissions?.super_admin) return true;

      const parts = 'notifications.list_view'.split('.');
      let current = permissions;
      for (const part of parts) {
        if (!current || typeof current !== 'object') return false;
        current = current[part];
      }
      return current === true;
    };

    if (user?.id) {
      fetchUnreadCount();
    }
    if (hasAccess()) {
      fetchNotifications();
    }
  }, [user, permissions, fetchNotifications, fetchUnreadCount]);

  useEffect(() => {
    setSoundEnabled(isSoundEnabled());
  }, []);

  const enableSound = useCallback(async () => {
    try {
      const success = await enableNotificationSound();
      if (success) setSoundEnabled(true);
      return success;
    } catch (error) {
      console.error('Error enabling sound:', error);
      setSoundEnabled(false);
      return false;
    }
  }, []);

  const disableSound = useCallback(() => {
    disableNotificationSound();
    setSoundEnabled(false);
  }, []);

  const toggleSound = useCallback(async () => {
    try {
      const newState = await toggleNotificationSound();
      setSoundEnabled(newState);
      return newState;
    } catch (error) {
      console.error('Error toggling sound:', error);
      return soundEnabled;
    }
  }, [soundEnabled]);

  const value = {
    notifications,
    unreadCount,
    loading,
    soundEnabled,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    enableSound,
    disableSound,
    toggleSound,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};
