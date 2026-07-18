/**
 * Utilities for parsing backend timestamp strings like:
 * "2026-01-22 06:15:48.28107"
 *
 * Notes:
 * - Backend stores timestamps in UTC (e.g., 06:15 UTC = 11:15 PKT)
 * - Backend string has a space separator and may include microseconds.
 * - We normalize and parse as UTC, then convert to user's local timezone for display.
 */

function normalizeBackendTimestamp(ts) {
  if (!ts || typeof ts !== 'string') return null;

  // Handle both formats:
  // 1. "2026-01-22 06:15:48.28107" (space-separated, no timezone)
  // 2. "2026-01-22T01:15:48.281Z" (ISO format with Z)
  let normalized = ts.trim();

  // If already has 'Z' or timezone, use as-is
  if (normalized.includes('Z') || normalized.match(/[+-]\d{2}:\d{2}$/)) {
    return normalized;
  }

  // Convert "YYYY-MM-DD HH:mm:ss.ffffff" -> "YYYY-MM-DDTHH:mm:ss.fff"
  normalized = normalized.replace(' ', 'T');

  // Reduce microseconds to milliseconds if present
  // e.g. ".28107" -> ".281"
  normalized = normalized.replace(/(\.\d{3})\d+$/, '$1');

  return normalized;
}

function parseBackendDate(ts) {
  const normalized = normalizeBackendTimestamp(ts);
  if (!normalized) return null;

  // If it doesn't have timezone indicator, append 'Z' to indicate UTC
  const utcString = normalized.endsWith('Z') || normalized.match(/[+-]\d{2}:\d{2}$/) 
    ? normalized 
    : normalized + 'Z';
  
  const d = new Date(utcString);
  
  if (Number.isNaN(d.getTime())) return null;
  
  return d;
}

/**
 * Returns date like "9/24/2025" (based on user's locale settings).
 */
export function getDate(ts) {
  const d = parseBackendDate(ts);
  if (!d) return '-';
  return d.toLocaleDateString();
}

/**
 * Returns time like "11:43 AM"
 * Database stores UTC time, we add 5 hours for Pakistan time (UTC+5)
 * 
 * Note: This adds 5 hours to the parsed UTC date to display Pakistan time.
 */
export function getTime(ts) {
  const d = parseBackendDate(ts);
  if (!d) return '-';

  // Add 5 hours to the date object for Pakistan timezone (UTC+5)
  // Using the approach: setHours(getHours() + 5) as specified
  const pakistanDate = new Date(d);
  pakistanDate.setHours(pakistanDate.getHours());

  // Format using Pakistan locale
  return pakistanDate.toLocaleTimeString("en-PK", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

