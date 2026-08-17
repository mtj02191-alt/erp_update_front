import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { toast } from 'react-toastify';
import { getOfflineMode, setOfflineMode } from '../offline/mode';
import { countPendingQueue, countAllOfflineRecords, clearAllOfflineData } from '../offline/db';
import { syncOfflineQueue } from '../offline/syncService';

const OfflineContext = createContext(null);

export const OfflineProvider = ({ children }) => {
  const [offlineMode, setOfflineModeState] = useState(() => getOfflineMode());
  const [networkOnline, setNetworkOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  );
  const [pendingCount, setPendingCount] = useState(0);
  const [localCacheCount, setLocalCacheCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const refreshPendingCount = useCallback(async () => {
    try {
      const [pending, cached] = await Promise.all([
        countPendingQueue(),
        countAllOfflineRecords(),
      ]);
      setPendingCount(pending);
      setLocalCacheCount(cached);
    } catch {
      setPendingCount(0);
      setLocalCacheCount(0);
    }
  }, []);

  useEffect(() => {
    refreshPendingCount();
  }, [refreshPendingCount, offlineMode]);

  useEffect(() => {
    const onOnline = () => setNetworkOnline(true);
    const onOffline = () => setNetworkOnline(false);
    const onMode = (e) => setOfflineModeState(!!e.detail?.enabled);
    const onQueue = () => refreshPendingCount();
    const onCleared = () => refreshPendingCount();

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    window.addEventListener('dms-offline-mode-changed', onMode);
    window.addEventListener('dms-offline-queue-changed', onQueue);
    window.addEventListener('dms-offline-data-cleared', onCleared);

    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('dms-offline-mode-changed', onMode);
      window.removeEventListener('dms-offline-queue-changed', onQueue);
      window.removeEventListener('dms-offline-data-cleared', onCleared);
    };
  }, [refreshPendingCount]);

  const toggleOfflineMode = useCallback((enabled) => {
    const next = typeof enabled === 'boolean' ? enabled : !getOfflineMode();
    setOfflineMode(next);
    setOfflineModeState(next);
    if (next) {
      toast.info('Offline mode enabled — changes save locally until you sync.');
    } else {
      toast.info('Online mode — requests go to the server.');
    }
  }, []);

  const syncNow = useCallback(async () => {
    if (!networkOnline) {
      toast.error('No network connection. Connect to the internet to sync.');
      return { success: false };
    }
    if (pendingCount === 0) {
      toast.info('No pending offline changes to sync.');
      return { success: true, synced: 0 };
    }
    setIsSyncing(true);
    try {
      const result = await syncOfflineQueue();
      await refreshPendingCount();
      if (result.failed > 0) {
        toast.warn(
          result.message || `Synced ${result.synced}; ${result.failed} failed`,
        );
      } else {
        toast.success(result.message || `Synced ${result.synced} record(s)`);
      }
      return result;
    } catch (err) {
      const msg =
        err.response?.data?.message || err.message || 'Sync failed';
      toast.error(msg);
      return { success: false, error: msg };
    } finally {
      setIsSyncing(false);
    }
  }, [networkOnline, pendingCount, refreshPendingCount]);

  const clearOfflineCache = useCallback(async () => {
    if (localCacheCount === 0) {
      toast.info('No offline data to clear.');
      return { success: true, cleared: 0 };
    }
    setIsClearing(true);
    try {
      await clearAllOfflineData();
      await refreshPendingCount();
      toast.success('Offline cache cleared.');
      return { success: true };
    } catch (err) {
      const msg = err?.message || 'Failed to clear offline cache';
      toast.error(msg);
      return { success: false, error: msg };
    } finally {
      setIsClearing(false);
    }
  }, [localCacheCount, refreshPendingCount]);

  return (
    <OfflineContext.Provider
      value={{
        offlineMode,
        networkOnline,
        pendingCount,
        localCacheCount,
        isSyncing,
        isClearing,
        toggleOfflineMode,
        syncNow,
        clearOfflineCache,
        refreshPendingCount,
      }}
    >
      {children}
    </OfflineContext.Provider>
  );
};

export const useOffline = () => {
  const ctx = useContext(OfflineContext);
  if (!ctx) {
    throw new Error('useOffline must be used within OfflineProvider');
  }
  return ctx;
};
