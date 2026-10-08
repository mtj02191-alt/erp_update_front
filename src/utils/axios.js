import axios from 'axios';
import { getOfflineMode } from '../offline/mode';
import { canHandleOffline, handleOfflineRequest } from '../offline/handlers';
import { prepareOfflineConfig } from '../offline/prepareOfflineRequest';
import {
  mustReachServerWhenOffline,
  createOfflineBlockedError,
  OFFLINE_BLOCKED_MESSAGE,
} from '../offline/networkPolicy';
import {
  createSilentAuthError,
  isOnLoginPage,
  redirectToLogin,
} from './authSession';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Add a request interceptor to handle CORS preflight
axiosInstance.interceptors.request.use(
  (config) => {
    if (getOfflineMode()) {
      if (canHandleOffline(config)) {
        config.adapter = async (cfg) => {
          const prepared = prepareOfflineConfig(cfg);
          try {
            const payload = await handleOfflineRequest(prepared);
            return {
              data: payload,
              status: 200,
              statusText: 'OK',
              headers: { 'x-dms-offline': '1' },
              config: prepared,
            };
          } catch (err) {
            const error = new Error(err?.message || 'Offline request failed');
            error.response = {
              data: {
                success: false,
                message: err?.message || 'Offline request failed',
              },
              status: 400,
              statusText: 'Bad Request',
              headers: { 'x-dms-offline': '1' },
            };
            error.config = prepared;
            throw error;
          }
        };
      } else if (!mustReachServerWhenOffline(config)) {
        config.adapter = async (cfg) => {
          throw createOfflineBlockedError(cfg, OFFLINE_BLOCKED_MESSAGE);
        };
      }
      // else: login / sync — pass through to the server unchanged
    }

    // Ensure credentials are included
    config.withCredentials = true;

    // Let the browser set multipart boundary (required for file uploads)
    if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    // Add CORS headers for preflight requests
    if (config.method === 'options') {
      config.headers['Access-Control-Allow-Origin'] = window.location.origin;
      config.headers['Access-Control-Allow-Credentials'] = 'true';
    }

    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  },
);

let initialLoadComplete = false;
let authContextHandlingInitialLoad = false;

// Mark initial load as complete after a delay to allow AuthContext to handle initial auth checks
if (typeof window !== 'undefined') {
  if (isOnLoginPage()) {
    initialLoadComplete = true;
  } else {
    setTimeout(() => {
      initialLoadComplete = true;
    }, 5000);
  }
}

// Export function to mark that AuthContext is handling initial load
export const setAuthContextHandlingInitialLoad = (handling) => {
  authContextHandlingInitialLoad = handling;
};

const shouldSkipAuthRedirect = (url = '') => {
  // Wrong password / login failures must not bounce the login form.
  const skipExact = ['/auth/login', '/auth/register', '/auth/forgot-password'];
  return skipExact.some((endpoint) => url.includes(endpoint));
};

const handleUnauthorized = (error) => {
  const url = error.config?.url || '';
  if (shouldSkipAuthRedirect(url)) {
    return Promise.reject(error);
  }

  // During boot, let AuthContext own the first /auth/me failure.
  if (
    !initialLoadComplete ||
    authContextHandlingInitialLoad ||
    isOnLoginPage()
  ) {
    return Promise.reject(createSilentAuthError());
  }

  redirectToLogin('Session expired (401 Unauthorized)');
  return Promise.reject(createSilentAuthError());
};

// Add a response interceptor to handle errors
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const status = error.response.status;
      const errorCode = error.response.data?.code || error.response.data?.error;
      const url = error.config?.url || '';
      const isAuthEndpoint = ['/auth/me', '/auth/logout', '/auth/refresh'].some(
        (endpoint) => url.includes(endpoint),
      );

      // Any authenticated API 401 (expired/missing cookie/token) → login
      if (status === 401) {
        return handleUnauthorized(error);
      }

      // Legacy /auth/me 404 NOT_FOUND session expiry
      if (
        isAuthEndpoint &&
        (status === 404 || errorCode === 'NOT_FOUND') &&
        initialLoadComplete &&
        !authContextHandlingInitialLoad &&
        !isOnLoginPage()
      ) {
        redirectToLogin('Session expired (404 NOT_FOUND)');
        return Promise.reject(createSilentAuthError());
      }
    }

    if (
      !error.response ||
      (error.response.status !== 401 && error.response.status !== 404)
    ) {
      console.error('Response error:', {
        message: error.message,
        code: error.code,
        response: error.response
          ? {
              status: error.response.status,
              statusText: error.response.statusText,
              headers: error.response.headers,
              data: error.response.data,
            }
          : 'No response',
        config: {
          url: error.config?.url,
          method: error.config?.method,
          baseURL: error.config?.baseURL,
        },
      });
    }

    return Promise.reject(error);
  },
);

export default axiosInstance;

// Program application overview API: import from `./programApplicationOverviewApi.js`
// (not re-exported here to avoid circular dependency: that module imports this file).
