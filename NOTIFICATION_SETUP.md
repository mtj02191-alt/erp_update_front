# Notification System - Frontend Implementation Complete ✅

## Files Created

### 1. WebSocket Service
- **File**: `src/utils/notifications/socket.js`
- **Purpose**: Manages WebSocket connection to backend
- **Features**: Auto-reconnection, connection status tracking

### 2. Notification Context
- **File**: `src/context/NotificationContext.jsx`
- **Purpose**: Global state management for notifications
- **Features**: 
  - Fetches notifications from API
  - Listens for real-time WebSocket events
  - Manages unread count
  - Mark as read functionality

### 3. Notification Bell Component
- **File**: `src/components/common/NotificationBell/index.jsx`
- **CSS**: `src/components/common/NotificationBell/NotificationBell.css`
- **Purpose**: UI component for displaying notifications
- **Features**:
  - Bell icon with unread badge
  - Dropdown with notification list
  - Mark all as read button
  - Click to navigate to notification link

## Files Updated

### 1. Backend - Auth Controller
- **File**: `ddr_server/src/auth/auth.controller.ts`
- **Change**: Now returns `token` in login response (for WebSocket)

### 2. Frontend - Auth Context
- **File**: `src/context/AuthContext.jsx`
- **Changes**:
  - Stores JWT token in localStorage on login
  - Clears JWT token on logout
  - All localStorage clear operations updated

### 3. Frontend - Axios Interceptor
- **File**: `src/utils/axios.js`
- **Change**: Clears JWT token on session expiration

### 4. Frontend - App.jsx
- **File**: `src/App.jsx`
- **Change**: Added `NotificationProvider` wrapper

### 5. Frontend - Navbar
- **File**: `src/components/Navbar.jsx`
- **Change**: Added `NotificationBell` component

## Environment Variables

### Frontend (`.env`)
```env
VITE_API_URL=http://localhost:3000
VITE_WS_URL=http://localhost:3000
```

**Note**: If `VITE_WS_URL` is not set, it will use `VITE_API_URL` as fallback.

### Backend (`.env`)
```env
JWT_SECRET=your-secret-key
```

## How It Works

### 1. Login Flow
1. User logs in → Backend returns token in response
2. `AuthContext` stores token in `localStorage` as `jwt_token`
3. `NotificationContext` detects user login
4. WebSocket connects using stored token

### 2. WebSocket Connection
- Connects to: `{VITE_WS_URL}/notifications`
- Sends token in `auth.token`
- Backend verifies token and joins user to room: `user_{userId}`

### 3. Real-time Notifications
- Backend emits `new_notification` event → Frontend receives it
- Backend emits `unread_count` event → Frontend updates badge
- Frontend can emit `mark_as_read` → Backend updates status

### 4. REST API Integration
- `GET /notifications` - Fetch notifications list
- `GET /notifications/unread-count` - Get unread count
- `POST /notifications/:id/mark-read` - Mark as read
- `POST /notifications/mark-all-read` - Mark all as read

## Testing

### 1. Test WebSocket Connection
Open browser console after login:
```javascript
// Check connection status
console.log('Socket connected:', notificationSocket.getConnectionStatus());
```

### 2. Test Notification Creation
Create a notification from backend (e.g., when donation is created):
- Should appear in notification bell
- Badge count should update
- Click notification to mark as read

### 3. Test Mark as Read
- Click on a notification → Should mark as read
- Click "Mark all as read" → All notifications marked as read
- Badge count should decrease

## Troubleshooting

### WebSocket Not Connecting
1. Check browser console for errors
2. Verify `jwt_token` is in localStorage: `localStorage.getItem('jwt_token')`
3. Check backend logs for connection errors
4. Verify `VITE_WS_URL` is set correctly

### Notifications Not Appearing
1. Check WebSocket connection status
2. Verify user is logged in
3. Check backend notification creation
4. Check browser console for errors

### Token Issues
- Token is stored in `localStorage` as `jwt_token`
- Token is also in httpOnly cookie (for REST API)
- WebSocket uses token from localStorage
- If token missing, check login response includes `token` field

## API Endpoints Reference

### REST Endpoints
```
GET    /notifications?user_id={id}&page=1&pageSize=10
GET    /notifications/unread-count?user_id={id}
POST   /notifications/:id/mark-read
POST   /notifications/mark-all-read
```

### WebSocket Events

**Client → Server:**
- `mark_as_read` - Mark notification as read
- `get_unread_count` - Request unread count

**Server → Client:**
- `new_notification` - New notification received
- `unread_count` - Unread count update

## Next Steps

1. ✅ All files created
2. ✅ All integrations complete
3. ⏳ Test the system
4. ⏳ Verify notifications appear when donations are created
5. ⏳ Test on production environment

## Notes

- WebSocket automatically reconnects on disconnect
- Notifications are stored in context state
- Unread count updates in real-time
- Token is stored securely in localStorage (for WebSocket only)
- REST API uses httpOnly cookies (more secure)

