/**
 * Offline-mode network routing.
 * - Whitelisted DMS URLs → IndexedDB (handled in handlers.js)
 * - Essential online URLs → still hit the server (login, sync)
 * - Everything else → blocked (no backend call)
 */

function requestPath(config) {
  return (config.url || '').split('?')[0];
}

function requestMethod(config) {
  return (config.method || 'get').toLowerCase();
}

/** Must reach the server even when offline mode is on (credential check, sync). */
export function mustReachServerWhenOffline(config) {
  const method = requestMethod(config);
  const url = requestPath(config);

  if (method === 'post' && url === '/auth/login') return true;
  if (method === 'post' && url === '/dms/sync/offline') return true;

  return false;
}

export function createOfflineBlockedError(config, message) {
  const error = new Error(message);
  error.response = {
    data: {
      success: false,
      message,
      code: 'OFFLINE_MODE_BLOCKED',
    },
    status: 503,
    statusText: 'Service Unavailable',
    headers: { 'x-dms-offline': '1', 'x-dms-offline-blocked': '1' },
  };
  error.config = config;
  return error;
}

export const OFFLINE_BLOCKED_MESSAGE =
  'This action is not available while offline mode is on.';
