import { useEffect } from 'react';

/**
 * Re-run fetch when offline mode toggles or local queue changes.
 * Same API call as online — only the data source switches via axios.
 */
export default function useOfflineDataRefresh(onRefresh, deps = []) {
  useEffect(() => {
    const refresh = () => onRefresh();
    window.addEventListener('dms-offline-queue-changed', refresh);
    window.addEventListener('dms-offline-mode-changed', refresh);
    window.addEventListener('dms-offline-data-cleared', refresh);
    return () => {
      window.removeEventListener('dms-offline-queue-changed', refresh);
      window.removeEventListener('dms-offline-mode-changed', refresh);
      window.removeEventListener('dms-offline-data-cleared', refresh);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
