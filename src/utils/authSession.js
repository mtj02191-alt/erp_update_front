/**
 * Shared session-expiry handling for HTTP + WebSocket auth failures.
 * Redirects to the login page (/) instead of leaving the user on a broken screen.
 */

let redirectingToLogin = false;

export const isOnLoginPage = () => {
  if (typeof window === 'undefined') return true;
  const path = window.location.pathname;
  return path === '/' || path === '/login';
};

export const clearAuthStorage = () => {
  try {
    localStorage.removeItem('user_data');
    localStorage.removeItem('user_permissions');
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('token');
  } catch (_) {
    /* ignore */
  }
};

/**
 * Clear auth data and hard-redirect to login once.
 * @returns {boolean} true if a redirect was initiated
 */
export const redirectToLogin = (reason = 'Session expired') => {
  if (typeof window === 'undefined') return false;
  if (isOnLoginPage() || redirectingToLogin) return false;

  redirectingToLogin = true;
  console.warn(`${reason}. Clearing auth data and redirecting to login.`);
  clearAuthStorage();

  setTimeout(() => {
    // App Login route is `/` (same page users mean by "login page")
    window.location.href = '/';
  }, 50);
  return true;
};

export const isAuthFailureMessage = (message = '') => {
  const msg = String(message || '').toLowerCase();
  return (
    msg.includes('no token') ||
    msg.includes('invalid token') ||
    msg.includes('jwt expired') ||
    msg.includes('token expired') ||
    msg.includes('unauthorized') ||
    msg.includes('session expired') ||
    msg.includes('jwt malformed')
  );
};

export const createSilentAuthError = (message = 'Session expired. Please login again.') => {
  const err = new Error(message);
  err.isAuthRedirect = true;
  err.silent = true;
  return err;
};
