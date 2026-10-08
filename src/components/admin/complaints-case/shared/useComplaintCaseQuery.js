import { useCallback, useEffect, useState } from 'react';
import axiosInstance from '../../../../utils/axios';
import usePersistedFilters from '../../../../hooks/usePersistedFilters';

const EMPTY_FILTERS = {
  search: '',
  complaint_workflow_status: '',
  complaint_category: '',
  department: '',
};

export default function useComplaintCaseQuery({
  storagePrefix = 'complaints-case-list',
  defaultPageSize = 10,
} = {}) {
  const [filters, setFilters, clearFilters] = usePersistedFilters(
    `${storagePrefix}:filters`,
    EMPTY_FILTERS,
  );
  const [paginationState, setPaginationState] = usePersistedFilters(
    `${storagePrefix}:pagination`,
    { page: 1, pageSize: defaultPageSize },
  );

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [statusCounts, setStatusCounts] = useState({});
  const [pagination, setPagination] = useState({ page: 1, pageSize: defaultPageSize, total: 0, totalPages: 0 });

  const setFilter = useCallback(
    (key, value) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
      setPaginationState((prev) => ({ ...prev, page: 1 }));
    },
    [setFilters, setPaginationState],
  );

  const setPage = useCallback(
    (page) => setPaginationState((prev) => ({ ...prev, page })),
    [setPaginationState],
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axiosInstance.post('/tickets/case/search', {
        pagination: {
          page: paginationState.page,
          pageSize: paginationState.pageSize,
          sortField: 'created_at',
          sortOrder: 'DESC',
        },
        filters,
      });
      const payload = response.data || {};
      setData(payload.data || []);
      setStatusCounts(payload.statusCounts || {});
      setPagination(payload.pagination || {
        page: paginationState.page,
        pageSize: paginationState.pageSize,
        total: 0,
        totalPages: 0,
      });
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load complaints');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [filters, paginationState.page, paginationState.pageSize]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    filters,
    setFilter,
    clearFilters,
    page: paginationState.page,
    setPage,
    pageSize: paginationState.pageSize,
    pagination,
    statusCounts,
    refresh: fetchData,
  };
}
