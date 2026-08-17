/**
 * Normalize axios config before serving from IndexedDB.
 * Only runs when offline mode is on and the URL is whitelisted.
 * Online requests are never touched.
 */

function cloneRequestData(data) {
  if (data == null) return data;
  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch {
      return data;
    }
  }
  if (typeof data === 'object') {
    return Array.isArray(data) ? [...data] : { ...data };
  }
  return data;
}

export function prepareOfflineConfig(config) {
  const method = (config.method || 'get').toLowerCase();
  const url = (config.url || '').split('?')[0];
  const prepared = { ...config };

  if (method === 'post' && url === '/donations/search' && prepared.data) {
    const body = cloneRequestData(prepared.data);
    if (body && typeof body === 'object' && body.filters) {
      body.filters = { ...body.filters };
      // Strip route-level server defaults; IndexedDB holds locally created records only.
      if (body.filters.donation_source === 'website') {
        delete body.filters.donation_source;
      }
      if (body.filters._donation_source_not === 'website') {
        delete body.filters._donation_source_not;
      }
      delete body.filters._offline_local_only;
      prepared.data = body;
    }
  }

  return prepared;
}
