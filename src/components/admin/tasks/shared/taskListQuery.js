export const EMPTY_TASK_FILTERS = {
  search: '',
  department: '',
  project_name: '',
  status: '',
  priority: '',
  team_filter: 'all',
  team_filter_user_id: '',
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

  const teamMode = String(appliedFilters.team_filter || 'all').trim().toLowerCase();
  filters.team_filter = teamMode;
  if (teamMode === 'user' && appliedFilters.team_filter_user_id) {
    filters.team_filter_user_id = appliedFilters.team_filter_user_id;
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
