import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiEye, FiEdit2, FiTrash2, FiThumbsUp, FiUserCheck, FiSearch, FiPlus, FiChevronDown, FiClock, FiList, FiUsers, FiMoreHorizontal, FiClipboard, FiColumns } from 'react-icons/fi';
import { toast } from 'react-toastify';
import axiosInstance from '../../../../utils/axios';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import Loader from '../../../common/loader/Loader';
import Pagination from '../../../common/Pagination';
import ActionMenu from '../../../common/ActionMenu';
import SearchableMultiSelect from '../../../common/SearchableMultiSelect';
import { useAuth } from '../../../../context/AuthContext';
import { getTaskPermissions } from '../../../../utils/permissions';
import { tasksBasePath } from '../../../../utils/admin';
import '../../../../styles/components.css';
import './index.css';
import TaskKanbanBoard from '../kanban/TaskKanbanBoard';

const TasksList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, permissions } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [categoryCounts, setCategoryCounts] = useState({
    assigned_to_me: 0,
    assigned_to_team: 0,
    other_tasks: 0
  });
  const [filters, setFilters] = useState({
    search: '',
    department: '', // Default to empty string for "All Departments"
    status: '',
    priority: '',
    user_name: '' // User name search filter (like User Management)
  });
  const [viewType, setViewType] = useState(() => {
    const saved = localStorage.getItem('tasks_view_type');
    return saved || 'list';
  });
  const [searchInput, setSearchInput] = useState('');
  const [isSearchPending, setIsSearchPending] = useState(false);
  const [myApprovals, setMyApprovals] = useState([]);
  const [activeTab, setActiveTab] = useState('assigned_to_me');
  const [approvalsLoaded, setApprovalsLoaded] = useState(false);
  const [hasInteractedWithApprovals, setHasInteractedWithApprovals] = useState(false);
  const [showApprovalBanner, setShowApprovalBanner] = useState(false);

  const currentUserId = user?.id ? Number(user.id) : null;

  const isManager = useMemo(() => {
    const role = String(user?.role || '').toLowerCase();
    return [
      'dept_head',
      'manager',
      'assistant_manager',
      'team_lead',
      'coordinator'
    ].includes(role);
  }, [user?.role]);

  // Check if user is Department Head or Manager (for hiding reassign in list)
  const isDeptHeadOrManager = useMemo(() => {
    const role = String(user?.role || '').toLowerCase();
    return ['dept_head', 'manager'].includes(role);
  }, [user?.role]);

  const debouncedSearch = useMemo(() => {
    let timeout;
    const fn = (value) => {
      if (timeout) clearTimeout(timeout);
      setIsSearchPending(true);
      timeout = setTimeout(() => {
        setFilters((prev) => ({ ...prev, search: value }));
        setIsSearchPending(false);
      }, 600);
    };
    fn.cancel = () => timeout && clearTimeout(timeout);
    return fn;
  }, []);

  const handleSearchInputChange = useCallback((value) => {
    setSearchInput(value);
    debouncedSearch(value);
  }, [debouncedSearch]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters.search, filters.department, filters.status, filters.priority, filters.user_name]);

  useEffect(() => {
    return () => {
      if (debouncedSearch.cancel) debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  const filterConfig = [
    { key: 'search', type: 'text', placeholder: isSearchPending ? 'Searching...' : 'Search tasks...', value: searchInput, width: '250px' },
    {
      key: 'department',
      type: 'select',
      placeholder: 'All Departments',
      value: filters.department,
      label: 'Department',
      options: [
        'store',
        'procurements',
        'accounts_and_finance',
        'program',
        'it',
        'hr',
        'marketing',
        'audio_video',
        'fund_raising',
        'admin'
      ].map((dept) => ({ value: dept, label: dept.split('_').map(w => w[0].toUpperCase() + w.slice(1)).join(' ') }))
    },
    {
      key: 'status',
      type: 'select',
      placeholder: 'All Statuses',
      value: filters.status,
      label: 'Status',
      options: [
        'open',
        'in_progress',
        'pending_approval',
        'approved',
        'rejected',
        'completed',
        'closed',
        'cancelled'
      ].map((s) => ({ value: s, label: s.split('_').map(w => w[0].toUpperCase() + w.slice(1)).join(' ') }))
    },
    {
      key: 'priority',
      type: 'select',
      placeholder: 'All Priorities',
      value: filters.priority,
      label: 'Priority',
      options: ['low', 'medium', 'high', 'critical'].map((p) => ({ value: p, label: p[0].toUpperCase() + p.slice(1) }))
    }
  ];

  const tasksRouteBase = useMemo(() => tasksBasePath(), []);

  const taskPerms = useMemo(
    () => getTaskPermissions(permissions || {}, user?.department, user?.role),
    [permissions, user?.department, user?.role],
  );

  const hoverText = (action) => {
    if (action === 'create' && !taskPerms.canCreate) return 'You do not have permission to create tasks';
    if (action === 'view' && !taskPerms.canViewDetail) return 'You do not have permission to view tasks';
    if (action === 'update' && !taskPerms.canUpdate) return 'You do not have permission to edit tasks';
    if (action === 'delete' && !taskPerms.canDelete) return 'You do not have permission to delete tasks';
    if (action === 'assign' && !taskPerms.canAssign) return 'You do not have permission to assign tasks';
    if (action === 'approve' && !taskPerms.canApprove) return 'You do not have permission to approve tasks';
    if (action === 'complete' && !taskPerms.canComplete) return 'You do not have permission to complete tasks';
    if (action === 'edit_completed' && !taskPerms.canEditCompleted) return 'You do not have permission to edit completed tasks';
    return action === 'create' ? 'Add new' : '';
  };

  const multiSelectParams = useMemo(() => ({ active: true }), []);

  const isTaskAssignedToCurrentUser = useCallback(
    (task) => {
      if (!currentUserId || !task) return false;

      // Check if assigned
      const ids = Array.isArray(task.assigned_user_ids) ? task.assigned_user_ids : [];
      const metaIds = Array.isArray(task.assigned_users_meta)
        ? task.assigned_users_meta.map((m) => m?.user_id)
        : [];
      const allIds = [...ids, ...metaIds]
        .map((v) => Number(v))
        .filter((n) => Number.isInteger(n) && n > 0);
      return allIds.includes(currentUserId);
    },
    [currentUserId]
  );

  const isTaskAssignedToTeam = useCallback(
    (task) => {
      if (!user?.department || !task) return false;

      // Check if any assignee is from current user's department
      const meta = Array.isArray(task.assigned_users_meta) ? task.assigned_users_meta : [];
      return meta.some((m) => m?.department === user.department && Number(m?.user_id) !== currentUserId);
    },
    [user?.department, currentUserId]
  );

  const myTasks = useMemo(
    () => Array.isArray(tasks) ? tasks.filter((t) => isTaskAssignedToCurrentUser(t)) : [],
    [tasks, isTaskAssignedToCurrentUser]
  );

  const teamTasks = useMemo(() => {
    if (!isManager || !user?.department) return [];
    // Tasks assigned to team members (and NOT assigned to current user)
    return Array.isArray(tasks) ? tasks.filter((t) => !isTaskAssignedToCurrentUser(t) && isTaskAssignedToTeam(t)) : [];
  }, [tasks, isTaskAssignedToCurrentUser, isTaskAssignedToTeam, user?.department, isManager]);

  // Load approvals immediately for all logged-in users
  const fetchApprovals = useCallback(async () => {
    // Only fetch approvals if we have a current user
    if (!currentUserId) {
      return;
    }

    let cancelled = false;
    try {
      const res = await axiosInstance.get('/tasks/approvals/my');
      const data = Array.isArray(res.data?.data) ? res.data.data : [];
      if (!cancelled) {
        setMyApprovals(data);
        setApprovalsLoaded(true);
      }
    } catch {
      if (!cancelled) {
        setMyApprovals([]);
        setApprovalsLoaded(true); // Mark as loaded even on error to prevent retries
      }
    }
    return () => {
      cancelled = true;
    };
  }, [currentUserId]);

  const approvalRequestsForUser = useMemo(() => {
    if (!currentUserId) return [];
    if (!Array.isArray(myApprovals) || myApprovals.length === 0) return [];

    const results = [];
    myApprovals.forEach((approval) => {
      const taskIdNum = Number(approval.task_id);
      if (!Number.isInteger(taskIdNum)) {
        return;
      }
      // Use the task object attached directly to the approval record
      const task = approval.task;
      if (!task) {
        return;
      }
      const workflow = String(task.workflow_type || '').toLowerCase();
      if (workflow !== 'approval_required') {
        return;
      }
      const approverIds = Array.isArray(approval.approval_required_user_ids)
        ? approval.approval_required_user_ids
          .map((v) => Number(v))
          .filter((v) => Number.isInteger(v) && v > 0)
        : [];
      if (approverIds.length > 0 && !approverIds.includes(currentUserId)) {
        return;
      }
      const approvalsMeta = Array.isArray(approval.approvals_meta)
        ? approval.approvals_meta
        : [];
      const myMeta = approvalsMeta.find(
        (m) => m && Number(m.user_id) === Number(currentUserId),
      );
      const myDecision = myMeta
        ? String(myMeta.decision || 'pending').toLowerCase()
        : 'pending';
      const statusLower = String(approval.approval_status || '').toLowerCase();

      // Check if overall task is already fully approved or closed
      const isTaskFullyApproved = statusLower === 'approved' || statusLower === 'closed';

      // Include tasks where:
      // 1. Task is NOT fully approved/closed AND status is pending_approval OR rejected AND user hasn't acted yet
      // 2. User has already made a decision (approved/rejected) - show for visibility
      let isPendingAction = false;
      if (!isTaskFullyApproved && myDecision === 'pending') {
        if (statusLower === 'pending_approval' || statusLower === 'rejected') {
          isPendingAction = true;
        }
      }
      const hasUserActed = myDecision !== 'pending';

      // Only include task if it needs action OR user has already participated
      if (!isPendingAction && !hasUserActed) {
        return;
      }

      // Enrich task with approval status for UI display
      results.push({
        ...task,
        _approvalStatus: statusLower,
        _myDecision: myDecision,
        _isPendingAction: isPendingAction,
        _isTaskFullyApproved: isTaskFullyApproved,
      });
    });

    // Sort: pending actions first, then completed approvals
    return results.sort((a, b) => {
      if (a._isPendingAction && !b._isPendingAction) return -1;
      if (!a._isPendingAction && b._isPendingAction) return 1;
      return 0;
    });
  }, [myApprovals, currentUserId]);

  const approvalTasks = useMemo(() => {
    return Array.isArray(approvalRequestsForUser) ? approvalRequestsForUser : [];
  }, [approvalRequestsForUser]);

  const otherTasks = useMemo(() => {
    if (!currentUserId) return Array.isArray(tasks) ? tasks : [];

    // Get regular other tasks (not assigned to current user or team AND not an approval task for this user)
    const regularOtherTasks = Array.isArray(tasks) ? tasks.filter((t) => {
      const assignedToMe = isTaskAssignedToCurrentUser(t);
      if (assignedToMe) return false;

      const assignedToTeam = isManager && isTaskAssignedToTeam(t);
      if (assignedToTeam) return false;

      // Also exclude tasks that are in approvalTasks
      const isApprovalTask = approvalTasks.some(at => Number(at.id) === Number(t.id));
      if (isApprovalTask) return false;

      return true;
    }) : [];

    return regularOtherTasks;
  }, [tasks, isTaskAssignedToCurrentUser, isTaskAssignedToTeam, currentUserId, isManager, approvalTasks]);

  useEffect(() => {
    if (activeTab === 'approval_tasks' && approvalTasks.length === 0) {
      setActiveTab('assigned_to_me');
    }
  }, [approvalTasks.length, activeTab]);

  // Optimized: Use /tasks/list for initial load, /tasks/search only when search filters are applied
  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      setError('');
      try {
        const scopedFilters = {
          ...filters,
          department: filters.department,
          status: viewType === 'kanban' ? '' : filters.status // Ignore status filter for kanban
        };

        // Always use strict backend filtering if a department is selected in the dropdown.
        // This ensures that clicking "Program Tasks" in sidebar OR selecting "Program" from dropdown
        // shows ONLY tasks belonging to that department.
        const isStrictFilter = !!scopedFilters.department;

        // Check if user-applied search filters are active
        // Only use /tasks/search when user actively searches or filters by status/priority/user_name
        // For kanban, ignore status filter
        const hasUserAppliedFilters =
          filters.search ||
          (viewType !== 'kanban' && filters.status) ||
          filters.priority ||
          filters.user_name;

        // Use very large page size for Kanban view to show all tasks
        const effectivePageSize = viewType === 'kanban' ? 1000 : pageSize;
        const effectivePage = viewType === 'kanban' ? 1 : currentPage;

        let res;

        if (hasUserAppliedFilters) {
          // Use POST /tasks/search when user applies search/status/priority/user_name filters
          const payload = {
            pagination: { page: effectivePage, pageSize: effectivePageSize, sortField, sortOrder },
            filters: scopedFilters,
            strictDepartment: isStrictFilter
          };
          res = await axiosInstance.post('/tasks/search', payload);
        } else {
          // Use GET /tasks/list for default loading
          const params = {
            page: effectivePage,
            pageSize: effectivePageSize,
            sortField,
            sortOrder,
            department: scopedFilters.department || undefined,
            user_name: scopedFilters.user_name || undefined,
            strictDepartment: isStrictFilter
          };
          res = await axiosInstance.get('/tasks/list', { params });
        }

        const list = res.data.data || [];
        setTasks(list);
        setTotalItems(res.data.pagination?.total || 0);
        setTotalPages(res.data.pagination?.totalPages || 1);
        if (res.data.categoryCounts) {
          setCategoryCounts(res.data.categoryCounts);
        }
      } catch (e) {
        setError(e.response?.data?.message || 'Failed to fetch tasks.');
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, [currentPage, pageSize, sortField, sortOrder, filters.search, filters.department, filters.status, filters.priority, filters.user_name, taskPerms.reportScope, user?.department, viewType]);

  // Reset approvalsLoaded when we navigate to this page to refresh data
  useEffect(() => {
    setApprovalsLoaded(false);
  }, [location.pathname]);

  // Load approvals immediately for all logged-in users
  useEffect(() => {
    fetchApprovals();
  }, [fetchApprovals]);

  // Persist view type to localStorage
  useEffect(() => {
    localStorage.setItem('tasks_view_type', viewType);
  }, [viewType]);

  const handleFilterChange = (key, value) => {
    if (key === 'search') {
      handleSearchInputChange(value);
    } else {
      setFilters((prev) => ({ ...prev, [key]: value }));
    }
  };
  const clearAllFilters = () => {
    setSearchInput('');
    setFilters({ search: '', department: '', status: '', priority: '', user_name: '' });
    setCurrentPage(1);
  };

  const formatDate = (d) => {
    if (!d) return '-';
    const date = new Date(d);
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
  };

  const capitalize = (s) => s ? s.split('_').map(w => w[0].toUpperCase() + w.slice(1)).join(' ') : '';

  const isTaskOverdue = (task) => {
    if (!task || !task.due_date) return false;
    const due = new Date(task.due_date);
    if (Number.isNaN(due.getTime())) return false;
    const now = new Date();
    const status = String(task.status || '').toLowerCase();
    if (['completed', 'closed', 'cancelled'].includes(status)) return false;

    // A task becomes overdue only after 12:00 PM (noon) on the due date.
    const dueNoon = new Date(due);
    dueNoon.setHours(12, 0, 0, 0);

    return now > dueNoon;
  };

  const getDueInfo = (rawDate, statusRaw) => {
    if (!rawDate) return null;
    const due = new Date(rawDate);
    if (Number.isNaN(due.getTime())) return null;
    const now = new Date();
    const status = String(statusRaw || '').toLowerCase();
    if (['completed', 'closed', 'cancelled'].includes(status)) {
      return null;
    }

    // A task becomes overdue ONLY after 12:00 PM (noon) on the due date.
    const dueNoon = new Date(due);
    dueNoon.setHours(12, 0, 0, 0);

    const startOfDueDay = new Date(due);
    startOfDueDay.setHours(0, 0, 0, 0);
    const startOfNowDay = new Date(now);
    startOfNowDay.setHours(0, 0, 0, 0);

    if (now > dueNoon) {
      const diffMs = startOfNowDay.getTime() - startOfDueDay.getTime();
      const overdueDays = Math.round(diffMs / 86400000);

      if (overdueDays === 0) {
        return { label: 'Overdue today', variant: 'warning' };
      }
      return {
        label: `-${overdueDays} days`,
        variant: 'danger',
      };
    } else {
      const diffMs = startOfDueDay.getTime() - startOfNowDay.getTime();
      const diffDays = Math.round(diffMs / 86400000);

      if (diffDays === 0) {
        return { label: 'Due today', variant: 'warning' };
      }
      return {
        label: `In ${diffDays} days`,
        variant: 'normal',
      };
    }
  };

  const getStatusBadge = (statusRaw) => {
    const status = String(statusRaw || '').toLowerCase();
    const statusClassMap = {
      pending: 'status-pending',
      pending_approval: 'status-pink',
      draft: 'status-pending',
      failed: 'status-failed',
      rejected: 'status-failed',
      completed: 'status-completed',
      approved: 'status-approved',
      registered: 'status-registered',
      open: 'status-registered',
      in_progress: 'status-pending',
      cancelled: 'status-failed',
      closed: 'status-closed'
    };
    const cls = statusClassMap[status] || 'status-registered';
    const label = capitalize(status) || 'Pending';
    return <span className={`task-status-badge ${cls}`}>{label}</span>;
  };

  const renderAssignees = (t) => {
    const meta = Array.isArray(t.assigned_users_meta) ? t.assigned_users_meta : [];
    if (meta.length === 0) {
      return <span className="person-badge">-</span>;
    }

    const getInitials = (displayName) => {
      if (!displayName) return '?';
      const parts = String(displayName).trim().split(/\s+/).filter(Boolean);
      if (parts.length === 0) return '?';
      if (parts.length === 1) return parts[0][0].toUpperCase();
      const first = parts[0][0] || '';
      const last = parts[parts.length - 1][0] || '';
      return `${first}${last}`.toUpperCase();
    };

    const avatarPalette = [
      '#bfdbfe',
      '#fecaca',
      '#bbf7d0',
      '#fef3c7',
      '#e9d5ff',
      '#bae6fd',
      '#f5d0fe',
      '#fed7aa'
    ];

    const getAvatarColor = (displayName) => {
      const base = String(displayName || '').trim();
      if (!base) return avatarPalette[0];
      let hash = 0;
      for (let i = 0; i < base.length; i += 1) {
        hash = (hash + base.charCodeAt(i) * (i + 1)) >>> 0;
      }
      const idx = hash % avatarPalette.length;
      return avatarPalette[idx];
    };

    const maxAvatars = 3;
    const extraCount = meta.length - maxAvatars;
    const details = assigneeDetailsCache[t.id];

    const getDisplayName = (user, info) => {
      if (info?.name) return info.name;
      if (user?.name) return user.name;
      if (user?.department) return String(user.department).replace(/_/g, ' ');
      if (user?.email) {
        const local = String(user.email).split('@')[0];
        return local || 'User';
      }
      return 'User';
    };

    return (
      <div className="task-card-assignees-group">
        <div className="avatar-stack">
          {meta.slice(0, maxAvatars).map((user, idx) => {
            const info =
              Array.isArray(details) && details.length > 0
                ? details.find((d) => d.id === user.user_id)
                : null;
            const displayName = getDisplayName(user, info);
            const initials = getInitials(displayName);
            const colorBase = displayName;
            const isOpen = openAssigneeTaskId === t.id && openAssigneeUserId === user.user_id;
            return (
              <div
                key={user.user_id || idx}
                className="tasks-assignee-trigger"
                onClick={(e) => handleAssigneeClick(e, t, user.user_id)}
              >
                <div
                  className="avatar-circle"
                  title={displayName || 'User'}
                  style={{ zIndex: meta.length - idx, backgroundColor: getAvatarColor(colorBase) }}
                >
                  {initials}
                </div>
                {isOpen && (
                  <div className="tasks-assignee-popover">
                    {info ? (
                      <ul className="tasks-assignee-list">
                        <li className="tasks-assignee-list-item">
                          <div className="tasks-assignee-name">{info.name}</div>
                          {info.department && (
                            <div className="tasks-assignee-department">
                              {capitalize(info.department)}
                            </div>
                          )}
                        </li>
                      </ul>
                    ) : (
                      <div className="tasks-assignee-empty">No assignee details</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {extraCount > 0 && (
            <div className="avatar-circle avatar-extra" style={{ zIndex: 0 }}>
              +{extraCount}
            </div>
          )}
        </div>
        <span className="assignee-text-label">
          {meta.length === 1 ? 'Single User' : 'Multiple Users'}
        </span>
      </div>
    );
  };

  const [openAssigneeTaskId, setOpenAssigneeTaskId] = useState(null);
  const [openAssigneeUserId, setOpenAssigneeUserId] = useState(null);
  const [assigneeDetailsCache, setAssigneeDetailsCache] = useState({});
  const [reassignTask, setReassignTask] = useState(null);
  const [reassignUsers, setReassignUsers] = useState([]);
  const [reassignSaving, setReassignSaving] = useState(false);
  const [reassignError, setReassignError] = useState('');

  useEffect(() => {
    const close = () => {
      setOpenAssigneeTaskId(null);
      setOpenAssigneeUserId(null);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const handleAssigneeClick = async (e, task, userId) => {
    e.preventDefault();
    e.stopPropagation();
    const idsFromAssigned = Array.isArray(task.assigned_user_ids)
      ? task.assigned_user_ids.filter((n) => Number.isInteger(n) && n > 0)
      : [];
    const idsFromMeta = Array.isArray(task.assigned_users_meta)
      ? task.assigned_users_meta.map((m) => m?.user_id).filter((n) => Number.isInteger(n) && n > 0)
      : [];
    const uniqueIds = Array.from(new Set([...(idsFromAssigned || []), ...(idsFromMeta || [])]));
    if (uniqueIds.length === 0) {
      setOpenAssigneeTaskId(task.id);
      setOpenAssigneeUserId(userId || null);
      setAssigneeDetailsCache((prev) => ({ ...prev, [task.id]: [] }));
      return;
    }
    if (!assigneeDetailsCache[task.id]) {
      try {
        const query = uniqueIds.map((id) => `ids=${encodeURIComponent(id)}`).join('&');
        const byIds = await axiosInstance.get(`/users/by-ids${query ? `?${query}` : ''}`);
        const users = Array.isArray(byIds.data) ? byIds.data : [];
        const deptMap = {};
        if (Array.isArray(task.assigned_users_meta)) {
          task.assigned_users_meta.forEach((m) => { if (m?.user_id) deptMap[m.user_id] = m.department; });
        }
        const details = users.map((u) => ({
          id: u.id,
          name: (`${u.first_name || ''} ${u.last_name || ''}`).trim() || u.email || `User #${u.id}`,
          department: deptMap[u.id] || ''
        }));
        setAssigneeDetailsCache((prev) => ({ ...prev, [task.id]: details }));
      } catch {
        setAssigneeDetailsCache((prev) => ({ ...prev, [task.id]: [] }));
      }
    }
    setOpenAssigneeTaskId(task.id);
    setOpenAssigneeUserId(userId || null);
  };

  const handleOpenReassign = (task) => {
    setReassignTask(task);
    setReassignUsers([]);
    setReassignError('');
  };

  const handleCloseReassign = () => {
    if (reassignSaving) return;
    setReassignTask(null);
    setReassignUsers([]);
    setReassignError('');
  };

  const handleReassignSubmit = async () => {
    if (!reassignTask) return;
    if (!Array.isArray(reassignUsers) || reassignUsers.length === 0) {
      setReassignError('Please select at least one user');
      return;
    }
    const ids = reassignUsers
      .map((u) => Number(u.id))
      .filter((n) => Number.isInteger(n) && n > 0);
    if (ids.length === 0) {
      setReassignError('Please select at least one valid user');
      return;
    }
    const meta = reassignUsers.map((u) => ({
      user_id: Number(u.id),
      department: u.department || user?.department || '',
    }));
    const primary = reassignUsers[0];
    const name =
      (`${primary.first_name || ''} ${primary.last_name || ''}`).trim() ||
      primary.email ||
      `User #${primary.id}`;
    setReassignSaving(true);
    setReassignError('');
    try {
      const res = await axiosInstance.post(`/tasks/${reassignTask.id}/reassign`, {
        assignee_name: name,
        assigned_users: ids,
        assigned_users_meta: meta,
      });
      const updated = res.data?.data || null;
      if (updated) {
        setTasks((prev) => prev.map((t) => (t.id === updated.id ? { ...t, ...updated } : t)));
      }
      toast.success('Task reassigned.');
      setReassignTask(null);
      setReassignUsers([]);
    } catch (e) {
      const msg = e.response?.data?.message || 'Failed to reassign task.';
      setReassignError(msg);
      toast.error(msg);
    } finally {
      setReassignSaving(false);
    }
  };

  const deleteTask = async (task) => {
    const ok = window.confirm('Delete this task?');
    if (!ok) return;
    try {
      await axiosInstance.delete(`/tasks/${task.id}`);
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
      setTotalItems((prev) => Math.max(prev - 1, 0));
      toast.success('Task deleted.');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to delete task.');
    }
  };

  const getActionMenuItems = (task) => {
    const status = String(task.status).toLowerCase();
    const canViewDetail = taskPerms.canViewDetail === true;
    const canUpdate = taskPerms.canUpdate === true;
    const canDelete = taskPerms.canDelete === true;
    const canEditCompleted = taskPerms.canEditCompleted === true;

    // Hide reassign action in list for Department Head and Manager roles
    // (it's already available in Quick Actions for these roles)
    const showReassignInList = taskPerms.canAssign === true && !isDeptHeadOrManager;

    return [
      {
        icon: <FiEye />,
        label: 'View',
        color: '#45cc49ff',
        onClick: canViewDetail ? () => navigate(`${tasksRouteBase}/view/${task.id}`) : undefined,
        visible: true,
        disabled: !canViewDetail,
        title: !canViewDetail ? hoverText('view') : 'View'
      },
      {
        icon: <FiEdit2 />,
        label: 'Edit',
        color: '#1e92f1ff',
        onClick: ((status !== 'completed' || canEditCompleted) && canUpdate) ? () => navigate(`${tasksRouteBase}/update/${task.id}`) : undefined,
        visible: true,
        disabled: (status === 'completed' && !canEditCompleted) || !canUpdate,
        title: !canUpdate ? hoverText('update') : (status === 'completed' && !canEditCompleted ? hoverText('edit_completed') : 'Edit')
      },
      {
        icon: <FiTrash2 />,
        label: 'Delete',
        color: '#f4291bff',
        onClick: canDelete ? () => deleteTask(task) : undefined,
        visible: true,
        disabled: !canDelete,
        title: !canDelete ? hoverText('delete') : 'Delete'
      }
    ];
  };

  const renderTaskCard = (t) => {
    const status = String(t.status || '').toLowerCase();
    const canUpdate = taskPerms.canUpdate === true;
    const isAssignee = isTaskAssignedToCurrentUser(t);
    const canChangeAsAssignee =
      isAssignee && (taskPerms.canUpdate === true || taskPerms.canComplete === true);

    return (
      <div key={t.id} className={`task-card task-card--${status} ${isTaskOverdue(t) ? 'tasks-row--overdue' : ''}`}>
        <div className={`task-card-status-bar status-bg-${status}`}>
          <span>{capitalize(status)}</span>
        </div>
        <div className="task-card-content">
          <div className="task-card-main">
            <div className="task-card-header-row">
              <h3 className="task-card-title">{t.title}</h3>
              <span className={`priority-badge priority-${t.priority} mobile-priority`}>{capitalize(t.priority)}</span>
            </div>

            <div className="task-card-meta">
              <div className="task-card-meta-left">
                <span className="task-card-dept">
                  {Array.isArray(t.assigned_users_meta) && t.assigned_users_meta.length > 0
                    ? [...new Set(t.assigned_users_meta.map(m => m.department).filter(Boolean))]
                      .map(d => capitalize(d))
                      .join(', ')
                    : capitalize(t.department)}
                </span>
                <div className="task-card-assignee-mobile">
                  {/* <span className="assignee-label">Assignee: </span> */}
                  {renderAssignees(t)}
                </div>
              </div>

              <div className="task-card-actions-mobile">
                <ActionMenu actions={getActionMenuItems(t)} trigger={<FiMoreHorizontal className="more-icon" />} />
              </div>
            </div>
          </div>

          <div className="task-card-badges desktop-only">
            <span className={`priority-badge priority-${t.priority}`}>{capitalize(t.priority)}</span>
            {getStatusBadge(t.status)}
            {(canUpdate || canChangeAsAssignee) && (
              <div className="tasks-quick-status">
                <select
                  value=""
                  onChange={(e) => {
                    const value = e.target.value;
                    if (!value) return;
                    handleQuickStatusChange(t, value);
                  }}
                  disabled={statusUpdatingId === t.id}
                >
                  <option value="">Quick status...</option>
                  <option value="in_progress">Start</option>
                  <option value="completed">Complete</option>
                  <option value="open">Reopen</option>
                </select>
              </div>
            )}
          </div>

          <div className="task-card-right desktop-only">
            <div className="task-card-dates">
              <div className="date-row">
                <span>Started on:</span>
                <span>{formatDate(t.start_date)}</span>
              </div>
              <div className="date-row due-date">
                <span>{formatDate(t.due_date)}</span>
                {getDueInfo(t.due_date, t.status) && (
                  <span className={`overdue-text overdue-${getDueInfo(t.due_date, t.status).variant}`}>
                    {getDueInfo(t.due_date, t.status).label.startsWith('-') ? '→ ' : ''}
                    {getDueInfo(t.due_date, t.status).label.replace('-', '').replace('In ', '')}
                  </span>
                )}
              </div>
              <div className="task-date-tooltip">
                <div className="tooltip-item">
                  <span className="tooltip-label">Created:</span>
                  <span className="tooltip-value">{formatDate(t.created_at)}</span>
                </div>
                <div className="tooltip-item">
                  <span className="tooltip-label">Started:</span>
                  <span className="tooltip-value">{formatDate(t.start_date)}</span>
                </div>
                <div className="tooltip-item">
                  <span className="tooltip-label">Due:</span>
                  <span className="tooltip-value">{formatDate(t.due_date)}</span>
                </div>
              </div>
            </div>
            <div className="task-card-actions">
              <button
                className="task-action-icon view"
                title={hoverText('view')}
                onClick={taskPerms.canViewDetail ? () => navigate(`${tasksRouteBase}/view/${t.id}`) : undefined}
                disabled={!taskPerms.canViewDetail}
              >
                <FiEye />
              </button>
              <button
                className="task-action-icon edit"
                title={hoverText('update')}
                onClick={((status !== 'completed' || taskPerms.canEditCompleted) && taskPerms.canUpdate) ? () => navigate(`${tasksRouteBase}/update/${t.id}`) : undefined}
                disabled={(status === 'completed' && !taskPerms.canEditCompleted) || !taskPerms.canUpdate}
              >
                <FiEdit2 />
              </button>
              <button
                className="task-action-icon delete"
                title={hoverText('delete')}
                onClick={taskPerms.canDelete ? () => deleteTask(t) : undefined}
                disabled={!taskPerms.canDelete}
              >
                <FiTrash2 />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const [selectedTaskIds, setSelectedTaskIds] = useState([]);
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);

  const isSelected = (id) => selectedTaskIds.includes(id);
  const toggleSelected = (id) => {
    setSelectedTaskIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };
  const clearSelection = () => setSelectedTaskIds([]);

  const handleSelectAll = (group) => {
    const ids = group.map((t) => t.id);
    const allSelected = ids.every((id) => selectedTaskIds.includes(id));
    if (allSelected) {
      setSelectedTaskIds((prev) => prev.filter((id) => !ids.includes(id)));
    } else {
      setSelectedTaskIds((prev) => Array.from(new Set([...prev, ...ids])));
    }
  };

  const handleQuickStatusChange = async (task, nextStatus) => {
    const canUpdate = taskPerms.canUpdate === true;
    const isAssignee = isTaskAssignedToCurrentUser(task);
    const canChangeAsAssignee =
      isAssignee && (taskPerms.canUpdate === true || taskPerms.canComplete === true);
    if (!canUpdate && !canChangeAsAssignee) {
      toast.error(hoverText('update') || 'You do not have permission to update tasks');
      return;
    }
    setStatusUpdatingId(task.id);
    try {
      const payload = { status: nextStatus, notes: '' };
      const res = await axiosInstance.post(
        `/tasks/${task.id}/status-transition`,
        payload
      );
      const updated = res.data?.data || null;
      if (updated) {
        setTasks((prev) => prev.map((t) => (t.id === updated.id ? { ...t, ...updated } : t)));
      } else {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === task.id
              ? {
                ...t,
                status: nextStatus,
              }
              : t
          )
        );
      }
      toast.success('Status updated.');
    } catch (e) {
      const msg = e.response?.data?.message || 'Failed to update status.';
      toast.error(msg);
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const handleBulkStatusChange = async (nextStatus) => {
    if (!selectedTaskIds.length) return;
    if (!window.confirm(`Change status of ${selectedTaskIds.length} task(s)?`)) {
      return;
    }
    const canUpdate = taskPerms.canUpdate === true;
    if (!canUpdate) {
      toast.error(hoverText('update'));
      return;
    }
    setBulkUpdating(true);
    try {
      await Promise.all(
        selectedTaskIds.map((id) =>
          axiosInstance
            .post(`/tasks/${id}/status-transition`, { status: nextStatus, notes: '' })
            .catch(() => null)
        )
      );
      setTasks((prev) =>
        prev.map((t) =>
          selectedTaskIds.includes(t.id)
            ? {
              ...t,
              status: nextStatus,
            }
            : t
        )
      );
      toast.success('Statuses updated.');
      clearSelection();
    } catch {
      toast.error('Failed to update some tasks.');
    } finally {
      setBulkUpdating(false);
    }
  };

  const sortOptions = [
    { value: 'title', label: 'Title' },
    { value: 'priority', label: 'Priority' },
    { value: 'status', label: 'Status' },
    { value: 'department', label: 'Department' },
    { value: 'due_date', label: 'Due Date' },
    { value: 'created_at', label: 'Created' }
  ];

  return (
    <>
      <Navbar />
      <Loader loading={loading} />
      <div className="tasks-list-wrapper">
        {viewType === 'kanban' ? (
          <TaskKanbanBoard
            tasks={tasks}
            filters={filters}
            onFilterChange={(key, value) => handleFilterChange(key, value)}
            onClearFilters={clearAllFilters}
            loading={loading}
            user={user}
            permissions={permissions}
            searchInput={searchInput}
            isSearchPending={isSearchPending}
            handleSearchInputChange={handleSearchInputChange}
            approvalTasks={approvalTasks}
            viewType={viewType}
            setViewType={setViewType}
          />
        ) : (
          <div className="list-content">
            <div className="tasks-filter-container">
              <div className="tasks-filter-main">
                <div className="filter-item search-item">
                  <FiSearch className="filter-icon" />
                  <input
                    type="text"
                    placeholder={isSearchPending ? 'Searching...' : 'Search tasks...'}
                    value={searchInput}
                    onChange={(e) => handleSearchInputChange(e.target.value)}
                  />
                </div>

                <div className="filter-item search-item">
                  <FiSearch className="filter-icon" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={filters.user_name}
                    onChange={(e) => setFilters(prev => ({ ...prev, user_name: e.target.value }))}
                  />
                </div>

                <div className="filter-item select-item">
                  <FiUsers className="filter-icon" />
                  <select
                    value={filters.department === null ? '' : filters.department}
                    onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value }))}
                  >
                    <option value="">Department</option>
                    {filterConfig[1].options.map(opt => (
                      <option key={opt.value} value={opt.value} style={{ textTransform: 'uppercase' }}>{opt.label}</option>
                    ))}
                  </select>
                  <FiChevronDown className="chevron-icon" />
                </div>

                <div className="filter-item select-item">
                  <FiClock className="filter-icon" />
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  >
                    <option value="">Status</option>
                    {filterConfig[2].options.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <FiChevronDown className="chevron-icon" />
                </div>

                <div className="filter-item select-item">
                  <FiList className="filter-icon" />
                  <select
                    value={filters.priority}
                    onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                  >
                    <option value="">Priority</option>
                    {filterConfig[3].options.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <FiChevronDown className="chevron-icon" />
                </div>

                <button className="filter-clear-btn" onClick={clearAllFilters} disabled={loading}>
                  Clear
                </button>
              </div>

              <button
                className="tasks-add-btn"
                onClick={taskPerms.canCreate ? () => navigate(`${tasksRouteBase}/add`, { state: { defaultDepartment: user?.department } }) : undefined}
                disabled={!taskPerms.canCreate}
                title={hoverText('create')}
              >
                <FiPlus />
              </button>
           <div className="view-toggle-container">
              <button
                className={`view-toggle-btn ${viewType === 'list' ? 'active' : ''}`}
                onClick={() => setViewType('list')}
                title="List View"
              >
                <FiList /> List
              </button>
              <button
                className={`view-toggle-btn ${viewType === 'kanban' ? 'active' : ''}`}
                onClick={() => setViewType('kanban')}
                title="Kanban Board"
              >
                <FiColumns /> Kanban
              </button>
            </div>
            </div>
              {/* Approval Banner - Only shown if there are actual pending approvals */}
              {(() => {
                try {
                  if (!approvalsLoaded) return null; // Wait until approvals are loaded
                  if (!Array.isArray(approvalRequestsForUser)) return null;
                  
                  const pendingApprovals = approvalRequestsForUser.filter(t => t && t._isPendingAction === true);
                  if (!pendingApprovals || pendingApprovals.length === 0) return null;
                  
                  return (
                    <div className="approval-wrapper">
                      {/* Show either compact pill OR expanded banner */}
                      {!showApprovalBanner ? (
                        <div className="approval-pill-container">
                          <button 
                            className="approval-pill"
                            onClick={() => setShowApprovalBanner(true)}
                          >
                            <div className="approval-pill-content">
                              <span className="approval-pill-text">Pending Your Approval</span>
                              <div className="approval-pill-icon-wrapper">
                                <div className="approval-pill-icon">
                                  <FiClipboard />
                                </div>
                                <span className="approval-pill-count">{pendingApprovals.length}</span>
                              </div>
                            </div>
                          </button>
                        </div>
                      ) : (
                        <div className="tasks-approval-banner">
                          <div className="tasks-approval-pill">
                            <div className="tasks-approval-header">
                              <span className="tasks-approval-label">Approval requests</span>
                              <button 
                                className="approval-close-btn"
                                onClick={() => setShowApprovalBanner(false)}
                              >
                                ✕
                              </button>
                            </div>
                            <ul className="tasks-approval-list">
                              {pendingApprovals.map((t) => (
                                <li
                                  key={t.id}
                                  className="tasks-approval-item"
                                  onClick={taskPerms.canView ? () => navigate(`${tasksRouteBase}/view/${t.id}`) : undefined}
                                >
                                  <div className="tasks-approval-item-main">
                                    <span className="tasks-approval-title">
                                      {t.title || `Task #${t.id}`}
                                    </span>
                                    <span className="tasks-approval-sub">
                                      Pending your review
                                      {(t.priority || t.due_date) && (
                                        <>
                                          {' • '}
                                          {t.priority ? capitalize(t.priority) : null}
                                          {t.priority && t.due_date ? ' • ' : ''}
                                          {t.due_date ? `Due ${formatDate(t.due_date)}` : null}
                                        </>
                                      )}
                                    </span>
                                  </div>
                                  <span className="tasks-approval-meta">View</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                } catch (error) {
                  // Silently fail if there's an error with approval banner
                  return null;
                }
              })()}
              {error && <div className="status-message status-message--error">{error}</div>}

              <div className="task-card-list">
                <div className="task-tabs-container">
                  <div className="task-tabs">
                    <button
                      className={`task-tab-btn ${activeTab === 'assigned_to_me' ? 'active active--mine' : ''}`}
                      onClick={() => setActiveTab('assigned_to_me')}
                    >
                      <FiUserCheck className="tab-icon" />
                      <span className="tab-text"> Assign to me</span>
                      <span className="tab-count">{myTasks.length}</span>
                    </button>
                    <button
                      className={`task-tab-btn ${activeTab === 'other_tasks' ? 'active active--other' : ''}`}
                      onClick={() => setActiveTab('other_tasks')}
                    >
                      <FiList className="tab-icon" />
                      <span className="tab-text">Assign to other</span>
                      <span className="tab-count">{otherTasks.length}</span>
                    </button>
                    {isManager && (
                      <button
                        className={`task-tab-btn ${activeTab === 'assigned_to_team' ? 'active active--team' : ''}`}
                        onClick={() => setActiveTab('assigned_to_team')}
                      >
                        <FiUsers className="tab-icon" />
                        <span className="tab-text">Assign to team</span>
                        <span className="tab-count">{teamTasks.length}</span>
                      </button>
                    )}
                    {approvalTasks.length > 0 && (
                      <button
                        className={`task-tab-btn ${activeTab === 'approval_tasks' ? 'active active--approval' : ''}`}
                        onClick={() => setActiveTab('approval_tasks')}
                      >
                        <FiThumbsUp className="tab-icon" />
                        <span className="tab-text">Approval Tasks</span>
                        <span className="tab-count">{approvalTasks.length}</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="tab-content-wrapper">
                  {activeTab === 'assigned_to_me' && (
                    <div className="tasks-group fade-in">
                      {myTasks.length > 0 ? (
                        myTasks.map((t) => renderTaskCard(t))
                      ) : (
                        <div className="empty-tab-state">
                          <FiUserCheck className="empty-icon" />
                          <p>No tasks assigned to you at the moment.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'assigned_to_team' && isManager && (
                    <div className="tasks-group fade-in">
                      {teamTasks.length > 0 ? (
                        teamTasks.map((t) => renderTaskCard(t))
                      ) : (
                        <div className="empty-tab-state">
                          <FiUsers className="empty-icon" />
                          <p>No tasks assigned to your team members.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'approval_tasks' && (
                    <div className="tasks-group fade-in">
                      {approvalTasks.length > 0 ? (
                        approvalTasks.map((t) => renderTaskCard(t))
                      ) : (
                        <div className="empty-tab-state">
                          <FiThumbsUp className="empty-icon" />
                          <p>No approval tasks found.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'other_tasks' && (
                    <div className="tasks-group fade-in">
                      {otherTasks.length > 0 ? (
                        otherTasks.map((t) => renderTaskCard(t))
                      ) : (
                        <div className="empty-tab-state">
                          <FiList className="empty-icon" />
                          <p>No other tasks found.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              {totalItems > 0 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  pageSize={pageSize}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={(n) => { setPageSize(n); setCurrentPage(1); }}
                  onSortChange={(f, o) => { setSortField(f); setSortOrder(o); setCurrentPage(1); }}
                  sortField={sortField}
                  sortOrder={sortOrder}
                  sortOptions={sortOptions}
                />
              )}
            </div>
        )}
      </div>
    </>
  );
};

export default TasksList;