export const EMPTY_TASK_FILTERS = {
  search: '',
  department: '',
  project_name: '',
  status: '',
  priority: '',
};

export function mapActiveTabToViewType(activeTab) {
  const map = {
    assigned_to_me: 'assigned',
    assigned_to_team: 'assigned_to_team',
    other_tasks: 'other_tasks',
    approval_tasks: 'approval_tasks',
  };
  return map[activeTab] || 'assigned';
}

export function buildTasksSearchPayload({
  currentPage,
  pageSize,
  sortField,
  sortOrder,
  appliedFilters,
  assigneeId,
  activeTab,
}) {
  const filters = {
    search: appliedFilters.search || undefined,
    department: appliedFilters.department || undefined,
    project_name: appliedFilters.project_name || undefined,
    status: appliedFilters.status || undefined,
    priority: appliedFilters.priority || undefined,
    view_type: mapActiveTabToViewType(activeTab),
  };

  if (assigneeId) {
    filters.assignee_id = assigneeId;
  }

  return {
    pagination: {
      page: currentPage,
      pageSize,
      sortField,
      sortOrder,
    },
    filters,
  };
}
