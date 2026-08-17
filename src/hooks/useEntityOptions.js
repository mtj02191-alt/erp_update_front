import { useCallback, useEffect, useState } from 'react';
import axiosInstance from '../utils/axios';
import { LOOKUP_ENDPOINTS } from '../config/lookupConfig';

/**
 * Fetch slim { value, label } options from GET /{module}/options.
 *
 * @param {string} entityKey - key in LOOKUP_ENDPOINTS (e.g. 'appeals')
 * @param {{ params?: object, enabled?: boolean }} [options]
 * @returns {{ options: Array<{value:string,label:string}>, loading: boolean, error: Error|null, refetch: Function }}
 */
export default function useEntityOptions(entityKey, { params = {}, enabled = true } = {}) {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const endpoint = LOOKUP_ENDPOINTS[entityKey];

  const fetchOptions = useCallback(async () => {
    if (!enabled || !endpoint) {
      setOptions([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await axiosInstance.get(endpoint, { params });
      if (res.data?.success) {
        setOptions(Array.isArray(res.data.data) ? res.data.data : []);
      } else {
        setOptions([]);
      }
    } catch (err) {
      setError(err);
      setOptions([]);
    } finally {
      setLoading(false);
    }
  }, [enabled, endpoint, JSON.stringify(params)]);

  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  return { options, loading, error, refetch: fetchOptions };
}

/**
 * Fetch multiple entity option lists in parallel.
 *
 * @param {string[]} entityKeys
 * @param {{ enabled?: boolean }} [options]
 */
export function useMultipleEntityOptions(entityKeys, { enabled = true } = {}) {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const keys = Array.isArray(entityKeys) ? entityKeys.join(',') : '';

  const fetchAll = useCallback(async () => {
    if (!enabled || !entityKeys?.length) {
      setData({});
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const entries = await Promise.all(
        entityKeys.map(async (key) => {
          const endpoint = LOOKUP_ENDPOINTS[key];
          if (!endpoint) return [key, []];
          try {
            const res = await axiosInstance.get(endpoint);
            const list = res.data?.success && Array.isArray(res.data.data)
              ? res.data.data
              : [];
            return [key, list];
          } catch {
            return [key, []];
          }
        }),
      );
      setData(Object.fromEntries(entries));
    } catch (err) {
      setError(err);
      setData({});
    } finally {
      setLoading(false);
    }
  }, [enabled, keys]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { data, loading, error, refetch: fetchAll };
}
