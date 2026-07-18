import { io } from 'socket.io-client';

class NotificationSocket {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  connect(token) {
    try {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🔌 NotificationSocket.connect() called');
      console.log('Token provided:', !!token);
      console.log('Token length:', token?.length || 0);
      
      if (this.socket?.connected) {
        console.log('⚠️ Socket already connected, skipping...');
        console.log('Current socket ID:', this.socket.id);
        console.log('Current namespace:', this.socket.nsp?.name || 'unknown'); 
        return;
      }

      if (!token) {
        console.error('❌ No token provided for WebSocket connection');
        console.error('Cannot connect without authentication token');
        return;
      }

      const wsUrl = import.meta.env.VITE_WS_URL || import.meta.env.VITE_API_URL || 'http://localhost:3000';
      
      // Remove trailing slash if present
      const cleanUrl = wsUrl.replace(/\/$/, '');
      const socketUrl = `${cleanUrl}/ws_notifications`;
      
      // Store for error handling
      this.currentToken = token;
      this.currentUrl = socketUrl;
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📡 WebSocket Connection Configuration:');
      console.log('Base URL:', cleanUrl);
      console.log('Full Socket URL:', socketUrl);
      console.log('Namespace: /ws_notifications');
      console.log('Token available:', !!token);
      console.log('Token length:', token?.length || 0);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      // Connect to namespace - Socket.IO will handle the namespace automatically
      // The URL format should be: http://localhost:3000/notifications
      // Socket.IO will append /socket.io/?EIO=4&transport=websocket&ns=/notifications
      console.log('🔌 Creating Socket.IO connection to:', socketUrl); 
      
      // Disconnect any existing socket first
      if (this.socket) {
        console.log('⚠️ Disconnecting existing socket before creating new one...');
        try {
          this.socket.disconnect();
        } catch (e) {
          console.warn('Error disconnecting existing socket:', e);
        }
        this.socket = null;
      }
      console.log("socketUrl", socketUrl);
      this.socket = io(socketUrl, {
        auth: {
          token: token
        },
        withCredentials: true, // Send cookies automatically
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: this.maxReconnectAttempts,
        transports: ['websocket', 'polling'], // Try websocket first, fallback to polling
        forceNew: true, // Force new connection
        autoConnect: true,
        path: '/socket.io/', // Socket.IO path
      });
      
      console.log('✅ Socket.IO client instance created');
      console.log('📊 Socket details:', {
        id: this.socket.id || 'not connected yet',
        namespace: this.socket.nsp?.name || 'checking...',
        connected: this.socket.connected,
      });
      console.log('⏳ Waiting for connection to establish...');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      this.setupEventHandlers();
    } catch (error) {
      console.error('❌ Error in connect():', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      this.isConnected = false;
      
      // Clean up on error
      if (this.socket) {
        try {
          this.socket.disconnect();
        } catch (disconnectError) {
          console.error('Error disconnecting socket:', disconnectError);
        }
        this.socket = null;
      }
    }
  }

  setupEventHandlers() {
    try {
      if (!this.socket) {
        console.warn('Cannot setup event handlers: socket is null');
        return;
      }

      this.socket.on('connect', () => {
        try {
          console.log('✅ Connected to notifications WebSocket');
          console.log('📊 Connection details:', {
            socketId: this.socket.id,
            namespace: this.socket.nsp?.name || 'unknown',
            transport: this.socket.io?.engine?.transport?.name || 'unknown',
            connected: this.socket.connected,
            url: this.socket.io?.uri || 'unknown',
          });
          this.isConnected = true;
          this.reconnectAttempts = 0;
        } catch (error) {
          console.error('Error in connect handler:', error);
        }
      });

      this.socket.on('disconnect', (reason) => {
        try {
          console.log('❌ Disconnected from notifications:', reason);
          this.isConnected = false;
        } catch (error) {
          console.error('Error in disconnect handler:', error);
        }
      });

      this.socket.on('connect_error', (error) => {
        try {
          console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.error('❌ WebSocket connection error');
          console.error('Error message:', error.message);
          console.error('Error type:', error.type || 'unknown');
          console.error('Error details:', error);
          console.error('Connection URL:', this.currentUrl || 'unknown');
          console.error('Attempted namespace:', this.socket?.nsp?.name || 'unknown');
          console.error('Socket ID:', this.socket?.id || 'none');
          console.error('Reconnection attempt:', this.reconnectAttempts + 1);
          this.reconnectAttempts++;
          
          if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.error('❌ Max reconnection attempts reached');
            console.error('Troubleshooting:');
            console.error('1. Check backend server is running on port 3000');
            console.error('2. Check JWT token exists:', !!this.currentToken);
            console.error('3. Check CORS configuration in gateway');
            console.error('4. Verify namespace /notifications is correct');
            console.error('5. Check backend logs for connection attempts');
            console.error('6. Verify URL format: http://localhost:3000/notifications');
            console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          }
        } catch (handlerError) {
          console.error('Error in connect_error handler:', handlerError);
        }
      });
    } catch (error) {
      console.error('❌ Error in setupEventHandlers():', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
  }

  on(event, callback) {
    try {
      if (this.socket) {
        this.socket.on(event, callback);
      } else {
        console.warn('Cannot add event listener: socket is null');
      }
    } catch (error) {
      console.error('❌ Error in on():', error);
      console.error('Event:', event);
      console.error('Error message:', error.message);
    }
  }

  off(event, callback) {
    try {
      if (this.socket) {
        this.socket.off(event, callback);
      } else {
        console.warn('Cannot remove event listener: socket is null');
      }
    } catch (error) {
      console.error('❌ Error in off():', error);
      console.error('Event:', event);
      console.error('Error message:', error.message);
    }
  }

  emit(event, data) {
    try {
      if (this.socket?.connected) {
        this.socket.emit(event, data);
      } else {
        console.warn('Socket not connected, cannot emit:', event);
      }
    } catch (error) {
      console.error('❌ Error in emit():', error);
      console.error('Event:', event);
      console.error('Data:', data);
      console.error('Error message:', error.message);
    }
  }

  disconnect() {
    try {
      if (this.socket) {
        this.socket.disconnect();
        this.socket = null;
        this.isConnected = false;
        console.log('Socket disconnected successfully');
      }
    } catch (error) {
      console.error('❌ Error in disconnect():', error);
      console.error('Error message:', error.message);
      // Force cleanup on error
      this.socket = null;
      this.isConnected = false;
    }
  }

  getConnectionStatus() {
    try {
      return this.isConnected;
    } catch (error) {
      console.error('❌ Error in getConnectionStatus():', error);
      return false;
    }
  }
}

export default new NotificationSocket();

