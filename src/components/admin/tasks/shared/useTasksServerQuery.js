import { useCallback, useEffect, useState } from 'react';
import axiosInstance from '../../../../utils/axios';
import usePersistedFilters from '../../../../hooks/usePersistedFilters';
import { buildTasksSearchPayload, EMPTY_TASK_FILTERS } from './taskListQuery';

export default function useTasksServerQuery({
  storagePrefix = 'tasks-list',
  defaultPageSize = 30,
  defaultSortField = 'created_at',
  activeTab,
  assignedUser,
  refreshNonce = 0,
}) {
  const [paginationState, setPaginationState] = usePersistedFilters(
    `${storagePrefix}:pagination`,
    {
      currentPage: 1,
      pageSize: defaultPageSize,
      sortField: defaultSortField,
      sortOrder: 'DESC',
    },
  );
  const [tempFilters, setTempFilters, clearTempFilters] = usePersistedFilters(
    `${storagePrefix}:temp`,
    EMPTY_TASK_FILTERS,
  );
  const [appliedFilters, setAppliedFilters, clearAppliedFilters] = usePersistedFilters(
    `${storagePrefix}:applied`,
    EMPTY_TASK_FILTERS,
  );

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [categoryCounts, setCategoryCounts] = useState({
    assigned_to_me: 0,
    assigned_to_team: 0,
    other_tasks: 0,
  });
  const [localRefreshNonce, setLocalRefreshNonce] = useState(0);

  const { currentPage, pageSize, sortField, sortOrder } = paginationState;

  const setCurrentPage = useCallback(
    (value) => {
      setPaginationState((prev) => ({
        ...prev,
        currentPage: typeof value === 'function' ? value(prev.currentPage) : value,
      }));
    },
    [setPaginationState],
  );

  const setPageSize = useCallback(
    (value) => {
      setPaginationState((prev) => ({ ...prev, pageSize: value, currentPage: 1 }));
    },
    [setPaginationState],
  );

  const handleSortChange = useCallback(
    (field, order) => {
      setPaginationState((prev) => ({
        ...prev,
        sortField: field,
        sortOrder: order,
        currentPage: 1,
      }));
    },
    [setPaginationState],
  );

  const handleFilterChange = useCallback(
    (key, value) => {
      setTempFilters((prev) => ({ ...prev, [key]: value }));
    },
    [setTempFilters],
  );

  const handleApplyFilters = useCallback(() => {
    const filtersChanged = JSON.stringify(appliedFilters) !== JSON.stringify(tempFilters);
    if (filtersChanged) {
      setAppliedFilters(tempFilters);
      setCurrentPage(1);
    } else {
      setLocalRefreshNonce((n) => n + 1);
    }
  }, [appliedFilters, tempFilters, setAppliedFilters, setCurrentPage]);

  const handleClearFilters = useCallback(() => {
    clearTempFilters();
    clearAppliedFilters();
    setCurrentPage(1);
  }, [clearTempFilters, clearAppliedFilters, setCurrentPage]);

  const refresh = useCallback(() => {
    setLocalRefreshNonce((n) => n + 1);
  }, []);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const assigneeId = assignedUser?.id ? Number(assignedUser.id) : undefined;
      const payload = buildTasksSearchPayload({
        currentPage,
        pageSize,
        sortField,
        sortOrder,
        appliedFilters,
        assigneeId,
        activeTab,
      });
      const res = await axiosInstance.post('/tasks/search', payload);
      setTasks(Array.isArray(res.data?.data) ? res.data.data : []);
      setTotalItems(res.data?.pagination?.total || 0);
      setTotalPages(res.data?.pagination?.totalPages || 1);
      if (res.data?.categoryCounts) {
        setCategoryCounts(res.data.categoryCounts);
      }
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to fetch tasks.');
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    pageSize,
    sortField,
    sortOrder,
    appliedFilters,
    assignedUser?.id,
    activeTab,
  ]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks, refreshNonce, localRefreshNonce]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, assignedUser?.id, setCurrentPage]);

  return {
    tasks,
    setTasks,
    loading,
    error,
    totalItems,
    totalPages,
    categoryCounts,
    currentPage,
    pageSize,
    sortField,
    sortOrder,
    tempFilters,
    appliedFilters,
    handleFilterChange,
    handleApplyFilters,
    handleClearFilters,
    setCurrentPage,
    setPageSize,
    handleSortChange,
    refresh,
  };
}
