/**
 * Shared notification event bus for list auto-refresh and other module reactions.
 * NotificationContext dispatches; list pages subscribe via useNotificationListRefresh.
 */

export const APP_NOTIFICATION_EVENT = 'app-notification-received';

/** Mirror backend NotificationType values */
export const NotificationTypes = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
  DONATION: 'donation',
  TASK: 'task',
  SYSTEM: 'system',
};

/**
 * Reusable match presets for common modules.
 * Extend this as you wire more listing pages.
 */
export const NotificationRefreshPresets = {
  donations: {
    types: [NotificationTypes.DONATION],
  },
  /** All tasking realtime events (assignment, approver, status, comment, mention) */
  tasks: {
    types: [NotificationTypes.TASK],
  },
};

/**
 * Broadcast a live notification to any mounted listeners (list pages, etc.).
 * @param {object} notification
 */
export function dispatchAppNotification(notification) {
  if (typeof window === 'undefined' || !notification) return;
  window.dispatchEvent(
    new CustomEvent(APP_NOTIFICATION_EVENT, { detail: notification }),
  );
}

/**
 * Check whether a notification matches refresh rules.
 *
 * @param {object} notification
 * @param {object} rules
 * @param {string|string[]} [rules.types]
 * @param {string|RegExp|(string|RegExp)[]} [rules.linkIncludes]
 * @param {(n: object) => boolean} [rules.match]
 * @returns {boolean}
 */
export function matchesNotification(notification, rules = {}) {
  if (!notification) return false;

  const { types, linkIncludes, match } = rules;

  if (typeof match === 'function' && !match(notification)) {
    return false;
  }

  if (types != null) {
    const allowed = (Array.isArray(types) ? types : [types]).map((t) =>
      String(t).toLowerCase(),
    );
    const type = String(notification.type || '').toLowerCase();
    if (!allowed.includes(type)) return false;
  }

  if (linkIncludes != null) {
    const link = String(notification.link || '');
    const patterns = Array.isArray(linkIncludes)
      ? linkIncludes
      : [linkIncludes];
    const ok = patterns.some((pattern) => {
      if (pattern instanceof RegExp) return pattern.test(link);
      return link.includes(String(pattern));
    });
    if (!ok) return false;
  }

  return true;
}
