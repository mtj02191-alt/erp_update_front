import { io } from 'socket.io-client';
import {
  isAuthFailureMessage,
  isOnLoginPage,
  redirectToLogin,
} from '../authSession';

class NotificationSocket {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.currentToken = null;
    this.currentUrl = null;
    this.appListeners = new Map(); // event -> Set of callbacks
    this.authFailed = false;
  }

  connect(token) {
    if (!token) {
      // Missing token while app thinks user is logged in → send to login
      if (localStorage.getItem('user_data') && !isOnLoginPage()) {
        this.handleAuthFailure('No JWT token for notifications WebSocket');
      }
      return;
    }

    // Already connected with same token
    if (this.socket?.connected && this.currentToken === token) {
      return;
    }

    this.authFailed = false;
    this.currentToken = token;

    const wsUrl =
      import.meta.env.VITE_WS_URL ||
      import.meta.env.VITE_API_URL ||
      'http://localhost:3000';
    const cleanUrl = String(wsUrl).replace(/\/$/, '');
    const socketUrl = `${cleanUrl}/ws_notifications`;
    this.currentUrl = socketUrl;

    if (this.socket) {
      try {
        this.socket.removeAllListeners();
        this.socket.disconnect();
      } catch (_) {
        /* ignore */
      }
      this.socket = null;
      this.isConnected = false;
    }

    this.socket = io(socketUrl, {
      auth: { token },
      withCredentials: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
      transports: ['websocket', 'polling'],
      forceNew: true,
      autoConnect: true,
      path: '/socket.io/',
    });

    this.setupCoreHandlers();
    this.reattachAppListeners();
  }

  handleAuthFailure(reason) {
    if (this.authFailed) return;
    this.authFailed = true;
    this.disconnect();
    redirectToLogin(reason || 'Notifications auth failed');
  }

  setupCoreHandlers() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.authFailed = false;
      console.log('Notifications WS connected', this.socket.id);
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      console.log('Notifications WS disconnected:', reason);
      // Server drops the socket when JWT is missing/invalid
      if (
        reason === 'io server disconnect' &&
        localStorage.getItem('user_data') &&
        !isOnLoginPage()
      ) {
        this.handleAuthFailure('Notifications socket unauthorized');
      }
    });

    this.socket.on('connect_error', (error) => {
      this.reconnectAttempts += 1;
      const message = error?.message || '';
      if (isAuthFailureMessage(message)) {
        this.handleAuthFailure(`Notifications WS auth error: ${message}`);
        return;
      }
      // After repeated failures with a stale token, force re-login
      if (
        this.reconnectAttempts >= this.maxReconnectAttempts &&
        localStorage.getItem('user_data') &&
        !isOnLoginPage()
      ) {
        this.handleAuthFailure('Notifications WS reconnect exhausted');
        return;
      }
      console.warn(
        'Notifications WS connect_error:',
        message,
        this.currentUrl,
      );
    });

    this.socket.on('exception', (payload) => {
      const message = payload?.message || payload?.error || '';
      if (isAuthFailureMessage(message)) {
        this.handleAuthFailure(`Notifications WS exception: ${message}`);
      }
    });
  }

  reattachAppListeners() {
    if (!this.socket) return;
    for (const [event, callbacks] of this.appListeners.entries()) {
      for (const cb of callbacks) {
        this.socket.on(event, cb);
      }
    }
  }

  on(event, callback) {
    if (!callback) return;
    if (!this.appListeners.has(event)) {
      this.appListeners.set(event, new Set());
    }
    this.appListeners.get(event).add(callback);
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event, callback) {
    const set = this.appListeners.get(event);
    if (set && callback) {
      set.delete(callback);
      if (set.size === 0) this.appListeners.delete(event);
    }
    if (this.socket && callback) {
      this.socket.off(event, callback);
    }
  }

  emit(event, data) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    }
  }

  disconnect() {
    if (this.socket) {
      try {
        this.socket.removeAllListeners();
        this.socket.disconnect();
      } catch (_) {
        /* ignore */
      }
    }
    this.socket = null;
    this.isConnected = false;
    this.currentToken = null;
  }

  getConnectionStatus() {
    return Boolean(this.socket?.connected || this.isConnected);
  }
}

export default new NotificationSocket();
