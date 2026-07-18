import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import notificationSocket from '../utils/notifications/socket';
import axiosInstance from '../utils/axios';
import { playNotificationSound, enableNotificationSound, disableNotificationSound, toggleNotificationSound, isSoundEnabled } from '../utils/notifications/audio';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { user, permissions } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);

  // Get JWT token - try multiple sources
  const getToken = useCallback(() => {
    // Try localStorage first (if stored separately)
    const storedToken = localStorage.getItem('jwt_token') || localStorage.getItem('token');
    if (storedToken) {
      return storedToken;
    }

    // Try to get from cookies (if accessible)
    // Note: httpOnly cookies can't be accessed from JS, so this might not work
    // If token is in httpOnly cookie, we need backend to provide it via API
    const cookies = document.cookie.split(';');
    const jwtCookie = cookies.find(cookie => cookie.trim().startsWith('jwt='));
    if (jwtCookie) {
      return jwtCookie.split('=')[1];
    }

    return null;
  }, []);

  // Event handlers for notifications
  const handleNewNotification = useCallback((notification) => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔔 New notification received:', notification);
    console.log('Notification ID:', notification.id);
    console.log('Notification title:', notification.title);
    setNotifications(prev => {
      // Check if notification already exists to avoid duplicates
      const exists = prev.some(n => n.id === notification.id);
      if (exists) {
        console.log('⚠️ Notification already exists, skipping duplicate');
        return prev;
      }
      return [notification, ...prev];
    });
    setUnreadCount(prev => prev + 1);
    
    // Play notification sound if enabled
    playNotificationSound();
    
    // Show browser notification if permission granted
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
    
    console.log('✅ Notification added to state');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }, []);

  const handleUnreadCount = useCallback((data) => {
    console.log('📊 Unread count update received:', data.count);
    setUnreadCount(data.count || 0);
  }, []);

  // Connect to WebSocket when user is logged in
  useEffect(() => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔄 NotificationContext: WebSocket connection effect');
    console.log('User ID:', user?.id || 'none');
    console.log('User exists:', !!user);
    
    if (user?.id) {
      // Small delay to ensure token is stored after login
      const connectTimeout = setTimeout(() => {
        const token = getToken();
        console.log('Token check:', {
          hasToken: !!token,
          tokenLength: token?.length || 0,
          tokenPreview: token ? `${token.substring(0, 20)}...` : 'none',
        });
        
        if (token) {
          console.log('✅ Connecting to WebSocket with token...');
          notificationSocket.connect(token);
          
          // Set up event listeners AFTER connection is established
          // Listen for connection event to set up listeners
          const setupListeners = () => {
            console.log('🔧 Setting up event listeners for notifications...');
            notificationSocket.on('new_notification', handleNewNotification);
            notificationSocket.on('unread_count', handleUnreadCount);
            console.log('✅ Event listeners registered:');
            console.log('  - new_notification');
            console.log('  - unread_count');
          };
          
          // Set up listeners immediately (socket might already be connected)
          setupListeners();
          
          // Also set up on connect event (in case connection happens later)
          notificationSocket.on('connect', () => {
            console.log('🔌 Socket connected, ensuring event listeners are set up...');
            setupListeners();
          });
        } else {
          // Token not found - this shouldn't happen if login was successful
          // Token should be stored in localStorage during login
          console.error('❌ No JWT token found for WebSocket connection.');
          console.error('Token sources checked:');
          console.error('  - jwt_token:', !!localStorage.getItem('jwt_token'));
          console.error('  - token:', !!localStorage.getItem('token'));
          console.error('  - cookies:', document.cookie.includes('jwt='));
          console.error('Please login again or check if token was stored during login.');
          // Don't connect without token - backend requires it
        }
      }, 100); // Small delay to ensure token is available

      return () => {
        clearTimeout(connectTimeout);
        // Clean up event listeners
        console.log('🧹 Cleaning up event listeners...');
        notificationSocket.off('new_notification', handleNewNotification);
        notificationSocket.off('unread_count', handleUnreadCount);
      };
    } else {
      console.log('👋 User not logged in, disconnecting WebSocket...');
      notificationSocket.disconnect();
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user, getToken, handleNewNotification, handleUnreadCount]);

  // Fetch notifications from API
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
        // Deduplicate notifications by ID to avoid duplicate keys
        const fetchedNotifications = response.data.data || [];
        console.log('fetchedNotifications', fetchedNotifications);
        setNotifications(prev => {
          const existingIds = new Set(prev.map(n => n.id));
          const newNotifications = fetchedNotifications.filter(n => !existingIds.has(n.id));
          return [...newNotifications, ...prev];
        });
        return response.data;
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!user?.id) return;

    try {
      const response = await axiosInstance.get('/notifications/unread-count', {
        params: { user_id: user.id },
      });

      if (response.data.success) {
        setUnreadCount(response.data.count || 0);
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  }, [user]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId) => {
    if (!user?.id) return;

    try {
      const response = await axiosInstance.post(`/notifications/${notificationId}/mark-read`, {
        user_id: user.id,
      });

      if (response.data.success) {
        setNotifications(prev =>
          prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  }, [user]);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    if (!user?.id) return;

    try {
      const response = await axiosInstance.post('/notifications/mark-all-read', {
        user_id: user.id,
      });

      if (response.data.success) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  }, [user]);

  // Load initial data
  useEffect(() => {
    // Helper to check permission safely
    const hasAccess = () => {
      if (!user?.id) return false;
      if (permissions?.super_admin) return true;
      
      // Check notifications.list_view
      const path = 'notifications.list_view';
      const parts = path.split('.');
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

  // Initialize sound preference on mount
  useEffect(() => {
    const enabled = isSoundEnabled();
    setSoundEnabled(enabled);
  }, []);

  // Request browser notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      // Optionally request permission (commented out to avoid annoying users)
      // Notification.requestPermission();
    }
  }, []);

  // Enable notification sound (must be called on user interaction)
  const enableSound = useCallback(async () => {
    try {
      const success = await enableNotificationSound();
      if (success) {
        setSoundEnabled(true);
      }
      return success;
    } catch (error) {
      console.error('Error enabling sound:', error);
      setSoundEnabled(false);
      return false;
    }
  }, []);

  // Disable notification sound
  const disableSound = useCallback(() => {
    disableNotificationSound();
    setSoundEnabled(false);
  }, []);

  // Toggle notification sound
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

