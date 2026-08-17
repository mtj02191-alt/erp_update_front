const OFFLINE_MODE_KEY = 'dms_offline_mode';

export function getOfflineMode() {
  return localStorage.getItem(OFFLINE_MODE_KEY) === 'true';
}

export function setOfflineMode(enabled) {
  localStorage.setItem(OFFLINE_MODE_KEY, enabled ? 'true' : 'false');
  window.dispatchEvent(
    new CustomEvent('dms-offline-mode-changed', { detail: { enabled } }),
  );
}
