import { useEffect, useRef } from 'react';
import {
  APP_NOTIFICATION_EVENT,
  matchesNotification,
} from '../utils/notifications/events';

/**
 * Auto-refresh a list (or any data) when a matching live notification arrives.
 * Only runs while the consuming page/component is mounted.
 *
 * @param {() => void|Promise<void>} onRefresh - typically fetchList
 * @param {object} [options]
 * @param {string|string[]} [options.types] - notification.type values to match
 * @param {string|RegExp|(string|RegExp)[]} [options.linkIncludes] - match notification.link
 * @param {(notification: object) => boolean} [options.match] - custom matcher
 * @param {number} [options.debounceMs=600] - coalesce bursts of notifications
 * @param {boolean} [options.enabled=true]
 * @param {any[]} [options.deps=[]] - rebind listener when these change (e.g. filters)
 *
 * @example
 * useNotificationListRefresh(fetchDonations, {
 *   types: ['donation'],
 * });
 *
 * @example
 * import { NotificationRefreshPresets } from '../utils/notifications/events';
 * useNotificationListRefresh(fetchDonors, NotificationRefreshPresets.donors);
 */
export default function useNotificationListRefresh(onRefresh, options = {}) {
  const {
    types,
    linkIncludes,
    match,
    debounceMs = 600,
    enabled = true,
    deps = [],
  } = options;

  const onRefreshRef = useRef(onRefresh);
  const rulesRef = useRef({ types, linkIncludes, match });
  const timerRef = useRef(null);

  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  useEffect(() => {
    rulesRef.current = { types, linkIncludes, match };
  }, [types, linkIncludes, match]);

  useEffect(() => {
    if (!enabled || typeof onRefresh !== 'function') return undefined;

    const scheduleRefresh = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        try {
          onRefreshRef.current?.();
        } catch (err) {
          console.error('Notification list refresh failed:', err);
        }
      }, debounceMs);
    };

    const handler = (event) => {
      const notification = event?.detail;
      if (!matchesNotification(notification, rulesRef.current)) return;
      scheduleRefresh();
    };

    window.addEventListener(APP_NOTIFICATION_EVENT, handler);
    return () => {
      window.removeEventListener(APP_NOTIFICATION_EVENT, handler);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, debounceMs, ...deps]);
}
