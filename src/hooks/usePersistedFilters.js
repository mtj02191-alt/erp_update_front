import { useState, useCallback, useRef } from 'react';

export const STORAGE_PREFIX = 'pf:';

/**
 * Removes all persisted filter entries from sessionStorage.
 * Call this on logout to ensure no stale filters remain.
 */
export function clearAllPersistedFilters() {
  const keysToRemove = [];
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key && key.startsWith(STORAGE_PREFIX)) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((k) => sessionStorage.removeItem(k));
}

function readStorage(key, fallback) {
  try {
    const raw = sessionStorage.getItem(STORAGE_PREFIX + key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key, value) {
  try {
    sessionStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  } catch {
    /* quota exceeded — silently ignore */
  }
}

function removeStorage(key) {
  try {
    sessionStorage.removeItem(STORAGE_PREFIX + key);
  } catch {
    /* ignore */
  }
}

/**
 * Drop-in replacement for useState that persists to sessionStorage.
 * Each page should use a unique `storageKey` so filters don't leak across pages.
 *
 * Usage:
 *   const [filters, setFilters, clearFilters] = usePersistedFilters('donations-online-list', initialFilters);
 *
 * - `setFilters` works exactly like a normal setState (value or updater fn).
 * - `clearFilters()` resets to `defaultValue` AND removes from sessionStorage.
 */
export default function usePersistedFilters(storageKey, defaultValue) {
  const defaultRef = useRef(defaultValue);

  const [state, setStateRaw] = useState(() => readStorage(storageKey, defaultValue));

  const setState = useCallback(
    (valueOrUpdater) => {
      setStateRaw((prev) => {
        const next =
          typeof valueOrUpdater === 'function' ? valueOrUpdater(prev) : valueOrUpdater;
        writeStorage(storageKey, next);
        return next;
      });
    },
    [storageKey],
  );

  const clearState = useCallback(() => {
    removeStorage(storageKey);
    setStateRaw(defaultRef.current);
  }, [storageKey]);

  return [state, setState, clearState];
}
