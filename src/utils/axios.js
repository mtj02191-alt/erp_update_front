import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

// Add a request interceptor to handle CORS preflight
axiosInstance.interceptors.request.use(
  (config) => {
    // Ensure credentials are included
    config.withCredentials = true;
    
    // Add CORS headers for preflight requests
    if (config.method === 'options') {
      config.headers['Access-Control-Allow-Origin'] = window.location.origin;
      config.headers['Access-Control-Allow-Credentials'] = 'true';
    }
    
    // // Log the request details
    // console.log('Making request:', {
    //   url: config.url,
    //   method: config.method,
    //   baseURL: config.baseURL,
    //   headers: config.headers,
    //   withCredentials: config.withCredentials,
    //   origin: window.location.origin
    // });
    
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Track redirect state to prevent multiple redirects
let redirectingToLogin = false;
let initialLoadComplete = false;
let authContextHandlingInitialLoad = false;

// Mark initial load as complete after a delay to allow AuthContext to handle initial auth checks
// This prevents premature redirects during page refresh
if (typeof window !== 'undefined') {
  // Check if we're already on login page
  const isLoginPage = window.location.pathname === '/';
  
  if (isLoginPage) {
    // If on login page, mark as complete immediately
    initialLoadComplete = true;
  } else {
    // Wait longer for initial auth check to complete (5 seconds)
    // This gives AuthContext enough time to handle the initial check
    setTimeout(() => {
      initialLoadComplete = true;
    }, 5000);
  }
}

// Export function to mark that AuthContext is handling initial load
export const setAuthContextHandlingInitialLoad = (handling) => {
  authContextHandlingInitialLoad = handling;
};

// Add a response interceptor to handle errors
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle session expiration and unauthorized errors
    if (error.response) {
      const status = error.response.status;
      const errorCode = error.response.data?.code || error.response.data?.error;
      const url = error.config?.url || '';
      
      // Only handle auth-related endpoints for 404/401 errors
      const authEndpoints = ['/auth/me', '/auth/logout', '/auth/refresh'];
      const isAuthEndpoint = authEndpoints.some(endpoint => url.includes(endpoint));
      
      // Skip handling if it's not an auth endpoint
      if (!isAuthEndpoint) {
        return Promise.reject(error);
      }
      
      // Check if we're on login page
      const isLoginPage = window.location?.pathname === '/';
      
      // Handle 401 Unauthorized - always treat as session expired (except during initial load)
      if (status === 401) {
        // Only redirect if initial load is complete AND AuthContext is not handling it
        if (initialLoadComplete && !authContextHandlingInitialLoad && !isLoginPage && !redirectingToLogin) {
          console.warn('Session expired (401 Unauthorized). Clearing auth data and redirecting to login.');
          redirectingToLogin = true;
          
          // Clear authentication data
          localStorage.removeItem('user_data');
          localStorage.removeItem('user_permissions');
          localStorage.removeItem('jwt_token');
          
          // Use a small delay to ensure localStorage is cleared
          setTimeout(() => {
            window.location.href = '/';
          }, 100);
        }
        
        return Promise.reject(new Error('Session expired. Please login again.'));
      }
      
      // Handle 404 NOT_FOUND - only redirect after initial load and if not on login page
      if (status === 404 || errorCode === 'NOT_FOUND') {
        // During initial load or if AuthContext is handling it, let AuthContext manage the redirect
        // Only redirect if:
        // 1. Initial load is complete (5 seconds passed)
        // 2. AuthContext is NOT handling initial load
        // 3. Not already on login page
        // 4. Not already redirecting
        if (initialLoadComplete && !authContextHandlingInitialLoad && !isLoginPage && !redirectingToLogin) {
          console.warn('Session expired (404 NOT_FOUND). Clearing auth data and redirecting to login.');
          redirectingToLogin = true;
          
          // Clear authentication data
          localStorage.removeItem('user_data');
          localStorage.removeItem('user_permissions');
          localStorage.removeItem('jwt_token');
          
          // Use a small delay to ensure localStorage is cleared
          setTimeout(() => {
            window.location.href = '/';
          }, 100);
        }
        
        // Always reject, but let AuthContext handle the initial load case
        return Promise.reject(error);
      }
    }
    
    // Log other errors for debugging (but only if not already handled)
    if (!error.response || (error.response.status !== 401 && error.response.status !== 404)) {
      console.error('Response error:', {
        message: error.message,
        code: error.code,
        response: error.response ? {
          status: error.response.status,
          statusText: error.response.statusText,
          headers: error.response.headers,
          data: error.response.data
        } : 'No response',
        config: {
          url: error.config?.url,
          method: error.config?.method,
          baseURL: error.config?.baseURL,
          headers: error.config?.headers,
          withCredentials: error.config?.withCredentials,
          origin: window.location.origin
        }
      });
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;

// Program application overview API: import from `./programApplicationOverviewApi.js`
// (not re-exported here to avoid circular dependency: that module imports this file). 