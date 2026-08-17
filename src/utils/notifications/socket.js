import { io } from 'socket.io-client';

class NotificationSocket {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.currentToken = null;
    this.currentUrl = null;
    this.appListeners = new Map(); // event -> Set of callbacks
  }

  connect(token) {
    if (!token) {
      console.error('NotificationSocket: no token provided');
      return;
    }

    // Already connected with same token
    if (this.socket?.connected && this.currentToken === token) {
      return;
    }

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

  setupCoreHandlers() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      console.log('Notifications WS connected', this.socket.id);
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      console.log('Notifications WS disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      this.reconnectAttempts += 1;
      console.error(
        'Notifications WS connect_error:',
        error.message,
        this.currentUrl,
      );
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
