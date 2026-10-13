import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  FiEye, FiEdit2, FiTrash2, FiThumbsUp, FiUserCheck, FiPlus, FiClock, FiList, FiUsers,
  FiMoreHorizontal, FiCheckCircle, FiArrowUp, FiArrowDown, FiMinus, FiPlay, FiRotateCcw,
  FiX, FiExternalLink, FiFilter, FiSearch,
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import axiosInstance from '../../../../utils/axios';
import Navbar from '../../../Navbar';
import { RefreshButton, DropdownFilter, CollapsibleFilters, SearchButton, ClearButton, TeamFilter } from '../../../common/filters';
import Loader from '../../../common/loader/Loader';
import Pagination from '../../../common/Pagination';
import { useAuth } from '../../../../context/AuthContext';
import { getTaskPermissions } from '../../../../utils/permissions';
import { tasksBasePath } from '../../../../utils/admin';
import useFiltersPanel from '../../../../hooks/useFiltersPanel';
import '../../../../styles/components.css';
import './index.css';
import TaskViewModeSwitch from '../shared/TaskViewModeSwitch';
import TaskAssigneeFilter from '../shared/TaskAssigneeFilter';
import useTasksServerQuery from '../shared/useTasksServerQuery';
import StatusUpdateModal from '../view/StatusUpdateModal';
import { isStatusActionAvailable } from '../view/taskStatusConfig';
import {
  TASK_DEPARTMENT_OPTIONS,
  TASK_PROJECT_PROGRAM_OPTIONS,
} from '../shared/taskFilterOptions';

const DONE_STATUSES = ['completed', 'closed', 'cancelled'];
const INITIAL_VISIBLE = 3;
const DAY_MS = 86400000;

const GROUP_BY_OPTIONS = [
  { value: 'urgency', label: 'Urgency' },
  { value: 'status', label: 'Status' },
  { value: 'priority', label: 'Priority' },
];

const capitalize = (s) => (s ? s.split('_').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ') : '');

const formatDate = (d) => {
  if (!d) return '-';
  const date = new Date(d);
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
};

const formatShortDate = (d) => {
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

const formatLongDate = (d) => {
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

const formatTaskId = (t) => {
  const id = t?.id;
  if (id == null) return '#—';
  return `#${String(id).padStart(5, '0')}`;
};

const startOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

// A task becomes overdue only after 12:00 PM (noon) on the due date.
const isTaskOverdue = (task) => {
  if (!task || !task.due_date) return false;
  const due = new Date(task.due_date);
  if (Number.isNaN(due.getTime())) return false;
  const status = String(task.status || '').toLowerCase();
  if (DONE_STATUSES.includes(status)) return false;
  const dueNoon = new Date(due);
  dueNoon.setHours(12, 0, 0, 0);
  return new Date() > dueNoon;
};

const getDueMeta = (task) => {
  const status = String(task?.status || '').toLowerCase();
  if (DONE_STATUSES.includes(status)) {
    const when = task.completed_date || task.updated_at;
    return { kind: 'done', text: when ? formatShortDate(when) : capitalize(status), days: 0 };
  }
  if (!task?.due_date) return { kind: 'none', text: 'No due date', days: 0 };
  const due = new Date(task.due_date);
  if (Number.isNaN(due.getTime())) return { kind: 'none', text: 'No due date', days: 0 };

  const now = new Date();
  const dueNoon = new Date(due);
  dueNoon.setHours(12, 0, 0, 0);
  const dayDiff = Math.round((startOfDay(now).getTime() - startOfDay(due).getTime()) / DAY_MS);

  if (now > dueNoon) {
    if (dayDiff <= 0) return { kind: 'overdue', text: 'Overdue today', days: 0 };
    return { kind: 'overdue', text: `${dayDiff} day${dayDiff === 1 ? '' : 's'} late`, days: dayDiff };
  }
  const ahead = -dayDiff;
  if (ahead <= 0) return { kind: 'today', text: 'Today', days: 0 };
  return { kind: 'upcoming', text: formatShortDate(due), days: ahead };
};

const getAvatarColor = (displayName) => {
  const palette = ['#bfdbfe', '#fecaca', '#bbf7d0', '#fef3c7', '#e9d5ff', '#bae6fd', '#f5d0fe', '#fed7aa'];
  const base = String(displayName || '').trim();
  if (!base) return palette[0];
  let hash = 0;
  for (let i = 0; i < base.length; i += 1) {
    hash = (hash + base.charCodeAt(i) * (i + 1)) >>> 0;
  }
  return palette[hash % palette.length];
};

const getInitials = (displayName) => {
  if (!displayName) return '?';
  const parts = String(displayName).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return `${parts[0][0] || ''}${parts[parts.length - 1][0] || ''}`.toUpperCase();
};

const URGENCY_GROUPS = [
  { key: 'today', label: 'Due today', color: '#f59e0b' },
  { key: 'upcoming', label: 'Upcoming', color: '#2f4bd8' },
  { key: 'overdue', label: 'Overdue', color: '#e5383b' },
  { key: 'completed', label: 'Completed', color: '#16a34a' },
];

const STATUS_GROUP_COLORS = {
  open: '#2f6bff',
  in_progress: '#f59e0b',
  pending_approval: '#9333ea',
  approved: '#14b8a6',
  rejected: '#e5383b',
  completed: '#16a34a',
  closed: '#6b7280',
  cancelled: '#e5383b',
};

const PRIORITY_GROUPS = [
  { key: 'critical', label: 'Critical', color: '#b91c1c' },
  { key: 'high', label: 'High', color: '#e5383b' },
  { key: 'medium', label: 'Medium', color: '#f59e0b' },
  { key: 'low', label: 'Low', color: '#16a34a' },
];

const TasksList = ({ viewMode = 'kanban', onViewModeChange, refreshNonce = 0 }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, permissions } = useAuth();
  const { filtersOpen, toggleFilters } = useFiltersPanel();

  const [assignedUser, setAssignedUser] = useState(null);
  const [myApprovals, setMyApprovals] = useState([]);
  const [activeTab, setActiveTab] = useState('assigned_to_me');
  const [approvalsLoaded, setApprovalsLoaded] = useState(false);

  const [openAssigneeTaskId, setOpenAssigneeTaskId] = useState(null);
  const [openAssigneeUserId, setOpenAssigneeUserId] = useState(null);
  const [assigneeDetailsCache, setAssigneeDetailsCache] = useState({});
  const [userNamesById, setUserNamesById] = useState({});
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);
  const [approvalModal, setApprovalModal] = useState(null);

  // New UI state
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [groupBy, setGroupBy] = useState('urgency');
  const [expandedGroups, setExpandedGroups] = useState({});
  const [openCompleted, setOpenCompleted] = useState({});

  const {
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
    handleFilterChange,
    handleApplyFilters,
    handleClearFilters,
    setCurrentPage,
    setPageSize,
    handleSortChange,
    refresh,
  } = useTasksServerQuery({
    storagePrefix: 'tasks-list',
    defaultPageSize: 10,
    defaultSortField: 'created_at',
    activeTab,
    assignedUser,
    refreshNonce,
  });

  const currentUserId = user?.id ? Number(user.id) : null;

  const isManager = useMemo(() => {
    const role = String(user?.role || '').toLowerCase();
    return ['dept_head', 'manager', 'assistant_manager', 'team_lead', 'coordinator'].includes(role);
  }, [user?.role]);

  const statusFilterOptions = useMemo(
    () => [
      'open', 'in_progress', 'pending_approval', 'approved',
      'rejected', 'completed', 'closed', 'cancelled',
    ].map((s) => ({ value: s, label: capitalize(s) })),
    [],
  );

  const priorityFilterOptions = useMemo(
    () => ['low', 'medium', 'high', 'critical'].map((p) => ({
      value: p,
      label: p[0].toUpperCase() + p.slice(1),
    })),
    [],
  );

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

  const isTaskAssignedToCurrentUser = useCallback(
    (task) => {
      if (!currentUserId || !task) return false;
      const ids = Array.isArray(task.assigned_user_ids) ? task.assigned_user_ids : [];
      const metaIds = Array.isArray(task.assigned_users_meta)
        ? task.assigned_users_meta.map((m) => m?.user_id)
        : [];
      const allIds = [...ids, ...metaIds]
        .map((v) => Number(v))
        .filter((n) => Number.isInteger(n) && n > 0);
      return allIds.includes(currentUserId);
    },
    [currentUserId],
  );

  const canEditTaskByCurrentUser = useCallback(
    (task) => {
      if (!task) return false;
      const isCreator = currentUserId != null && Number(task.created_by_id) === currentUserId;
      const isAssignee = isTaskAssignedToCurrentUser(task);
      if (isAssignee && !isCreator) return false;
      const status = String(task.status || '').toLowerCase();
      const canEditCompleted = taskPerms.canEditCompleted === true;
      return taskPerms.canUpdate === true && (status !== 'completed' || canEditCompleted);
    },
    [currentUserId, isTaskAssignedToCurrentUser, taskPerms.canEditCompleted, taskPerms.canUpdate],
  );

  const canDeleteTaskByCurrentUser = useCallback(
    (task) => {
      if (!task) return false;
      const isCreator = currentUserId != null && Number(task.created_by_id) === currentUserId;
      const isAssignee = isTaskAssignedToCurrentUser(task);
      if (isAssignee && !isCreator) return false;
      return taskPerms.canDelete === true;
    },
    [currentUserId, isTaskAssignedToCurrentUser, taskPerms.canDelete],
  );

  const fetchApprovals = useCallback(async () => {
    if (!currentUserId) return undefined;

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
        setApprovalsLoaded(true);
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
      if (!Number.isInteger(taskIdNum)) return;
      const task = approval.task;
      if (!task) return;
      const workflow = String(task.workflow_type || '').toLowerCase();
      if (workflow !== 'approval_required') return;
      const approverIds = Array.isArray(approval.approval_required_user_ids)
        ? approval.approval_required_user_ids
          .map((v) => Number(v))
          .filter((v) => Number.isInteger(v) && v > 0)
        : [];
      if (approverIds.length > 0 && !approverIds.includes(currentUserId)) return;
      const approvalsMeta = Array.isArray(approval.approvals_meta) ? approval.approvals_meta : [];
      const myMeta = approvalsMeta.find((m) => m && Number(m.user_id) === Number(currentUserId));
      const myDecision = myMeta ? String(myMeta.decision || 'pending').toLowerCase() : 'pending';
      const statusLower = String(approval.approval_status || '').toLowerCase();
      const isTaskFullyApproved = statusLower === 'approved' || statusLower === 'closed';

      let isPendingAction = false;
      if (!isTaskFullyApproved && myDecision === 'pending') {
        if (statusLower === 'pending_approval' || statusLower === 'rejected') {
          isPendingAction = true;
        }
      }
      const hasUserActed = myDecision !== 'pending';
      if (!isPendingAction && !hasUserActed) return;

      results.push({
        ...task,
        approval_required_user_ids: approverIds,
        approvals_meta: approvalsMeta,
        _approvalStatus: statusLower,
        _myDecision: myDecision,
        _isPendingAction: isPendingAction,
        _isTaskFullyApproved: isTaskFullyApproved,
      });
    });

    return results.sort((a, b) => {
      if (a._isPendingAction && !b._isPendingAction) return -1;
      if (!a._isPendingAction && b._isPendingAction) return 1;
      return 0;
    });
  }, [myApprovals, currentUserId]);

  const approvalTasks = useMemo(
    () => (Array.isArray(approvalRequestsForUser) ? approvalRequestsForUser : []),
    [approvalRequestsForUser],
  );

  const approvalTabTotalCount = useMemo(() => {
    const totalFromCategory = Number(categoryCounts?.approval_tasks ?? 0);
    return Number.isFinite(totalFromCategory) ? totalFromCategory : 0;
  }, [categoryCounts]);

  const pendingApprovalIds = useMemo(() => {
    const ids = new Set();
    approvalTasks.forEach((task) => {
      if (task?._isPendingAction) ids.add(Number(task?.id ?? task?.task_id));
    });
    return ids;
  }, [approvalTasks]);

  const displayedApprovalTasks = useMemo(() => {
    if (activeTab !== 'approval_tasks') return tasks;
    return [...tasks].sort((a, b) => {
      const aPending = pendingApprovalIds.has(Number(a?.id));
      const bPending = pendingApprovalIds.has(Number(b?.id));
      if (aPending === bPending) return 0;
      return aPending ? -1 : 1;
    });
  }, [activeTab, tasks, pendingApprovalIds]);

  useEffect(() => {
    fetchApprovals();
  }, [fetchApprovals, refreshNonce]);

  useEffect(() => {
    setApprovalsLoaded(false);
  }, [location.pathname]);

  // Close the popovers / menus on outside click
  useEffect(() => {
    const close = () => {
      setOpenAssigneeTaskId(null);
      setOpenAssigneeUserId(null);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  useEffect(() => {
    if (openMenuId == null) return undefined;
    const onDocClick = (e) => {
      if (e.target.closest?.('.tlx-menu')) return;
      setOpenMenuId(null);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [openMenuId]);

  // Resolve assignee names for the visible tasks
  useEffect(() => {
    const taskRows = Array.isArray(tasks) ? tasks : [];
    const userIds = Array.from(new Set(
      taskRows.flatMap((task) => [
        task.created_by_id,
        ...(Array.isArray(task.assigned_user_ids) ? task.assigned_user_ids : []),
        ...(Array.isArray(task.assigned_users_meta)
          ? task.assigned_users_meta.map((meta) => meta?.user_id)
          : []),
      ])
        .map((value) => Number(value))
        .filter((value) => Number.isInteger(value) && value > 0),
    ));

    if (userIds.length === 0) return undefined;

    let cancelled = false;
    const refreshAssigneeDetails = async () => {
      try {
        const query = userIds.map((userId) => `ids=${encodeURIComponent(userId)}`).join('&');
        const response = await axiosInstance.get(`/users/by-ids?${query}`);
        const users = Array.isArray(response.data) ? response.data : [];
        if (cancelled) return;

        const usersById = new Map(users.map((resolvedUser) => [Number(resolvedUser.id), resolvedUser]));
        setUserNamesById((previous) => {
          const next = { ...previous };
          users.forEach((resolvedUser) => {
            next[Number(resolvedUser.id)] = (`${resolvedUser.first_name || ''} ${resolvedUser.last_name || ''}`).trim()
              || resolvedUser.email
              || `User #${resolvedUser.id}`;
          });
          return next;
        });
        setAssigneeDetailsCache((previous) => {
          const next = { ...previous };
          taskRows.forEach((task) => {
            const taskUserIds = Array.from(new Set([
              ...(Array.isArray(task.assigned_user_ids) ? task.assigned_user_ids : []),
              ...(Array.isArray(task.assigned_users_meta)
                ? task.assigned_users_meta.map((meta) => meta?.user_id)
                : []),
            ]))
              .map((value) => Number(value))
              .filter((value) => Number.isInteger(value) && value > 0);
            next[task.id] = taskUserIds
              .map((userId) => usersById.get(userId))
              .filter(Boolean)
              .map((resolvedUser) => ({
                id: resolvedUser.id,
                name: (`${resolvedUser.first_name || ''} ${resolvedUser.last_name || ''}`).trim()
                  || resolvedUser.email
                  || `User #${resolvedUser.id}`,
                department: resolvedUser.department || '',
              }));
          });
          return next;
        });
      } catch {
        // Keep task metadata as a fallback when the refresh fails.
      }
    };

    refreshAssigneeDetails();
    return () => {
      cancelled = true;
    };
  }, [tasks]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
    setSelectedTaskId(null);
  };

  const handleClearAll = () => {
    setAssignedUser(null);
    handleClearFilters();
    setActiveTab('assigned_to_me');
    setSelectedTaskId(null);
  };

  const getTaskDeptLabel = (t) => {
    const assignedMeta = Array.isArray(t.assigned_users_meta) ? t.assigned_users_meta : [];
    const currentUserDetails = assigneeDetailsCache[t.id];
    const currentUsersById = new Map(
      Array.isArray(currentUserDetails)
        ? currentUserDetails.map((details) => [Number(details.id), details])
        : [],
    );
    const isTaskCreator = currentUserId != null && Number(t.created_by_id) === currentUserId;
    const visibleMeta = isTaskCreator
      ? assignedMeta
      : assignedMeta.filter((m) => Number(m?.user_id) === currentUserId);
    const depts = [...new Set(
      visibleMeta
        .map((meta) => currentUsersById.get(Number(meta?.user_id))?.department || meta?.department)
        .filter(Boolean),
    )];
    if (depts.length > 0) return depts.map((d) => capitalize(d)).join(', ');
    return capitalize(t.department) || '—';
  };

  const getAssigneeNames = (t) => {
    const details = assigneeDetailsCache[t.id];
    if (Array.isArray(details) && details.length > 0) return details.map((d) => d.name);
    const meta = Array.isArray(t.assigned_users_meta) ? t.assigned_users_meta : [];
    return meta.map((m) => m?.name || 'User');
  };

  /* ---------- Assignee popover (unchanged behaviour) ---------- */
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
          department: deptMap[u.id] || '',
        }));
        setAssigneeDetailsCache((prev) => ({ ...prev, [task.id]: details }));
      } catch {
        setAssigneeDetailsCache((prev) => ({ ...prev, [task.id]: [] }));
      }
    }
    setOpenAssigneeTaskId(task.id);
    setOpenAssigneeUserId(userId || null);
  };

  const renderAssignees = (t) => {
    const meta = Array.isArray(t.assigned_users_meta) ? t.assigned_users_meta : [];
    if (meta.length === 0) {
      return <span className="tl-person-badge">—</span>;
    }

    const maxAvatars = 3;
    const extraCount = meta.length - maxAvatars;
    const details = assigneeDetailsCache[t.id];

    const getDisplayName = (u, info) => {
      if (info?.name) return info.name;
      if (u?.name) return u.name;
      if (u?.department) return String(u.department).replace(/_/g, ' ');
      if (u?.email) return String(u.email).split('@')[0] || 'User';
      return 'User';
    };

    const renderPopover = (info) => (
      <div className="tl-tasks-assignee-popover">
        {info ? (
          <ul className="tl-tasks-assignee-list">
            <li className="tl-tasks-assignee-list-item">
              <div className="tl-tasks-assignee-name">{info.name}</div>
              {info.department && (
                <div className="tl-tasks-assignee-department">
                  department: {capitalize(info.department)}
                </div>
              )}
            </li>
          </ul>
        ) : (
          <div className="tl-tasks-assignee-empty">No assignee details</div>
        )}
      </div>
    );

    if (meta.length === 1) {
      const u = meta[0];
      const info = Array.isArray(details) && details.length > 0
        ? details.find((d) => d.id === u.user_id)
        : null;
      const displayName = getDisplayName(u, info);
      const isOpen = openAssigneeTaskId === t.id && openAssigneeUserId === u.user_id;
      return (
        <div className="tl-tasks-list-assignment-cell">
          <div className="tl-tasks-assignee-trigger" onClick={(e) => handleAssigneeClick(e, t, u.user_id)}>
            <span className="tl-tasks-list-assignment-name" title={displayName}>{displayName}</span>
            {isOpen && renderPopover(info)}
          </div>
        </div>
      );
    }

    return (
      <div className="tl-tasks-list-assignment-cell">
        <div className="tl-task-card-assignees-group">
          <div className="tl-avatar-stack">
            {meta.slice(0, maxAvatars).map((u, idx) => {
              const info = Array.isArray(details) && details.length > 0
                ? details.find((d) => d.id === u.user_id)
                : null;
              const displayName = getDisplayName(u, info);
              const isOpen = openAssigneeTaskId === t.id && openAssigneeUserId === u.user_id;
              return (
                <div
                  key={u.user_id || idx}
                  className="tl-tasks-assignee-trigger"
                  onClick={(e) => handleAssigneeClick(e, t, u.user_id)}
                >
                  <div
                    className="tl-avatar-circle"
                    title={displayName || 'User'}
                    style={{ zIndex: meta.length - idx, backgroundColor: getAvatarColor(displayName) }}
                  >
                    {getInitials(displayName)}
                  </div>
                  {isOpen && renderPopover(info)}
                </div>
              );
            })}
            {extraCount > 0 && (
              <div className="tl-avatar-circle tl-avatar-extra" style={{ zIndex: 0 }}>+{extraCount}</div>
            )}
          </div>
        </div>
      </div>
    );
  };

  /* ---------- Mutations ---------- */
  const deleteTask = async (task) => {
    const ok = window.confirm('Delete this task?');
    if (!ok) return;
    try {
      await axiosInstance.delete(`/tasks/${task.id}`);
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
      if (selectedTaskId === task.id) setSelectedTaskId(null);
      refresh();
      toast.success('Task deleted.');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to delete task.');
    }
  };

  const handleQuickStatusChange = async (task, nextStatus, statusAction = null, actionContext = null) => {
    const canUpdate = taskPerms.canUpdate === true;
    const isAssignee = isTaskAssignedToCurrentUser(task);
    const canChangeAsAssignee =
      isAssignee && (taskPerms.canUpdate === true || taskPerms.canComplete === true);
    const canPerformTransition = statusAction
      ? isStatusActionAvailable(statusAction, actionContext || {})
      : canUpdate || canChangeAsAssignee;
    if (!canPerformTransition) {
      toast.error(hoverText('update') || 'You do not have permission to update tasks');
      return;
    }
    setStatusUpdatingId(task.id);
    try {
      const res = await axiosInstance.post(`/tasks/${task.id}/status-transition`, {
        status: nextStatus,
        notes: '',
      });
      const updated = res.data?.data || null;
      if (updated) {
        setTasks((prev) => prev.map((t) => (t.id === updated.id ? { ...t, ...updated } : t)));
      } else {
        setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t)));
      }
      toast.success('Status updated.');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to update status.');
    } finally {
      setStatusUpdatingId(null);
    }
  };

  /* ---------- Row action menu items (same rules as before) ---------- */
  const getActionMenuItems = (task) => {
    const status = String(task.status).toLowerCase();
    const canViewDetail = taskPerms.canViewDetail === true;
    const canUpdate = taskPerms.canUpdate === true;
    const canDelete = canDeleteTaskByCurrentUser(task);
    const canEditThisTask = canEditTaskByCurrentUser(task);
    const canEditCompleted = taskPerms.canEditCompleted === true;
    const isAssignee = isTaskAssignedToCurrentUser(task);
    const canChangeAsAssignee =
      isAssignee && (taskPerms.canUpdate === true || taskPerms.canComplete === true);
    const canChangeStatus = canUpdate || canChangeAsAssignee;

    return [
      {
        icon: <FiEye />,
        label: 'View',
        color: '#16a34a',
        onClick: canViewDetail ? () => navigate(`${tasksRouteBase}/view/${task.id}`) : undefined,
        visible: true,
        disabled: !canViewDetail,
        title: !canViewDetail ? hoverText('view') : 'View',
      },
      {
        icon: <FiEdit2 />,
        label: 'Edit',
        color: '#1e92f1',
        onClick: ((status !== 'completed' || canEditCompleted) && canEditThisTask)
          ? () => navigate(`${tasksRouteBase}/update/${task.id}`)
          : undefined,
        visible: true,
        disabled: (status === 'completed' && !canEditCompleted) || !canEditThisTask,
        title: !canEditThisTask
          ? 'You cannot edit this task as an assignee.'
          : (status === 'completed' && !canEditCompleted ? hoverText('edit_completed') : 'Edit'),
      },
      {
        icon: <FiPlay />,
        label: 'Start',
        color: '#2563eb',
        onClick: canChangeStatus ? () => handleQuickStatusChange(task, 'in_progress') : undefined,
        visible: canChangeStatus,
        disabled: !canChangeStatus || statusUpdatingId === task.id,
        title: 'Start',
      },
      {
        icon: <FiCheckCircle />,
        label: 'Complete',
        color: '#16a34a',
        onClick: canChangeStatus ? () => handleQuickStatusChange(task, 'completed') : undefined,
        visible: canChangeStatus,
        disabled: !canChangeStatus || statusUpdatingId === task.id,
        title: 'Complete',
      },
      {
        icon: <FiRotateCcw />,
        label: 'Reopen',
        color: '#ca8a04',
        onClick: canChangeStatus ? () => handleQuickStatusChange(task, 'open') : undefined,
        visible: canChangeStatus,
        disabled: !canChangeStatus || statusUpdatingId === task.id,
        title: 'Reopen',
      },
      {
        icon: <FiTrash2 />,
        label: 'Delete',
        color: '#e5383b',
        onClick: canDelete ? () => deleteTask(task) : undefined,
        visible: true,
        disabled: !canDelete,
        title: !canDelete
          ? (canEditThisTask ? hoverText('delete') : 'You cannot delete this task as an assignee.')
          : 'Delete',
        divider: true,
      },
    ];
  };

  const renderRowMenu = (t) => {
    const isOpen = openMenuId === t.id;
    const items = getActionMenuItems(t).filter((i) => i.visible);
    return (
      <div className="tlx-menu" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className={`tlx-menu__btn ${isOpen ? 'is-open' : ''}`}
          aria-haspopup="menu"
          aria-expanded={isOpen}
          aria-label="Task actions"
          title="Actions"
          onClick={(e) => {
            e.stopPropagation();
            setOpenMenuId((id) => (id === t.id ? null : t.id));
          }}
        >
          <FiMoreHorizontal />
        </button>
        {isOpen && (
          <div className="tlx-menu__list" role="menu">
            {items.map((item) => (
              <React.Fragment key={item.label}>
                {item.divider && <div className="tlx-menu__divider" />}
                <button
                  type="button"
                  role="menuitem"
                  className="tlx-menu__item"
                  title={item.title}
                  disabled={item.disabled}
                  onClick={() => {
                    setOpenMenuId(null);
                    if (!item.disabled && item.onClick) item.onClick();
                  }}
                >
                  <span className="tlx-menu__icon" style={{ color: item.color }}>{item.icon}</span>
                  {item.label}
                </button>
              </React.Fragment>
            ))}
          </div>
        )}
      </div>
    );
  };

  /* ---------- Grouping ---------- */
  const groups = useMemo(() => {
    const rows = Array.isArray(displayedApprovalTasks) ? displayedApprovalTasks : [];
    let defs = [];
    let pick = () => '';

    if (groupBy === 'status') {
      const present = Array.from(new Set(rows.map((t) => String(t.status || '').toLowerCase())));
      defs = present.map((s) => ({
        key: s, label: capitalize(s) || 'No status', color: STATUS_GROUP_COLORS[s] || '#64748b',
      }));
      pick = (t) => String(t.status || '').toLowerCase();
    } else if (groupBy === 'priority') {
      defs = PRIORITY_GROUPS;
      pick = (t) => String(t.priority || 'medium').toLowerCase();
    } else {
      defs = URGENCY_GROUPS;
      pick = (t) => {
        const kind = getDueMeta(t).kind;
        if (kind === 'done') return 'completed';
        if (kind === 'overdue') return 'overdue';
        if (kind === 'today') return 'today';
        return 'upcoming';
      };
    }

    return defs
      .map((def) => ({ ...def, tasks: rows.filter((t) => pick(t) === def.key) }))
      .filter((g) => g.tasks.length > 0);
  }, [displayedApprovalTasks, groupBy]);

  const selectedTask = useMemo(() => {
    if (selectedTaskId == null) return null;
    return (Array.isArray(displayedApprovalTasks) ? displayedApprovalTasks : [])
      .find((t) => t.id === selectedTaskId) || null;
  }, [selectedTaskId, displayedApprovalTasks]);

  useEffect(() => {
    if (selectedTaskId == null) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setSelectedTaskId(null);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [selectedTaskId]);

  /* ---------- Row ---------- */
  const renderPriorityIcon = (priority) => {
    const p = String(priority || 'medium').toLowerCase();
    let content = <FiMinus aria-hidden />;
    if (p === 'critical') content = <span className="tlx-prio__bang" aria-hidden>!</span>;
    else if (p === 'high') content = <FiArrowUp aria-hidden />;
    else if (p === 'low') content = <FiArrowDown aria-hidden />;
    return (
      <span className={`tlx-prio tlx-prio--${p}`} title={`${capitalize(p)} priority`}>
        {content}
      </span>
    );
  };

  const renderStatusPill = (t) => {
    const status = String(t.status || '').toLowerCase();
    return (
      <span className={`tlx-status tlx-status--${status || 'pending'}`}>
        {capitalize(status) || 'Pending'}
      </span>
    );
  };

  const renderTaskRow = (t) => {
    const due = getDueMeta(t);
    const selected = selectedTaskId === t.id;
    const needsAction = activeTab === 'approval_tasks' && pendingApprovalIds.has(Number(t.id));
    return (
      <div
        key={t.id}
        role="button"
        tabIndex={0}
        aria-pressed={selected}
        className={`tlx-row ${selected ? 'is-selected' : ''} ${due.kind === 'overdue' ? 'is-overdue' : ''}`}
        onClick={() => setSelectedTaskId(t.id)}
        onKeyDown={(e) => {
          if (e.target !== e.currentTarget) return;
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setSelectedTaskId(t.id);
          }
        }}
      >
        {renderPriorityIcon(t.priority)}
        <div className="tlx-row__main">
          <span className="tlx-row__title" dir="auto" title={t.title}>{t.title}</span>
          {needsAction && <span className="tlx-row__flag">Needs your approval</span>}
        </div>
        <div className="tlx-row__assignees">{renderAssignees(t)}</div>
        {renderStatusPill(t)}
        <span className={`tlx-due tlx-due--${due.kind}`}>{due.text}</span>
        {renderRowMenu(t)}
      </div>
    );
  };

  const renderGroup = (g) => {
    const isCompletedGroup = groupBy === 'urgency' && g.key === 'completed';
    const open = isCompletedGroup ? openCompleted[g.key] === true : true;
    const expanded = expandedGroups[`${groupBy}:${g.key}`] === true;
    const visible = expanded ? g.tasks : g.tasks.slice(0, INITIAL_VISIBLE);
    const hiddenCount = g.tasks.length - visible.length;

    if (isCompletedGroup) {
      return (
        <section key={g.key} className={`tlx-group tlx-group--collapsible ${open ? 'is-open' : ''}`}>
          <button
            type="button"
            className="tlx-group__collapse"
            onClick={() => setOpenCompleted((prev) => ({ ...prev, [g.key]: !open }))}
          >
            <span className="tlx-group__dot" style={{ background: g.color }} />
            <span className="tlx-group__label">{g.label}</span>
            <span className="tlx-group__count">{g.tasks.length}</span>
            <span className="tlx-group__toggle">{open ? 'Collapse' : 'Expand'}</span>
          </button>
          {open && (
            <div className="tlx-group__rows">
              {visible.map(renderTaskRow)}
              {g.tasks.length > INITIAL_VISIBLE && (
                <button
                  type="button"
                  className="tlx-more"
                  onClick={() => setExpandedGroups((prev) => ({ ...prev, [`${groupBy}:${g.key}`]: !expanded }))}
                >
                  {expanded ? 'Show less' : `Show ${hiddenCount} more ${g.label.toLowerCase()}`}
                </button>
              )}
            </div>
          )}
        </section>
      );
    }

    return (
      <section key={g.key} className="tlx-group">
        <header className="tlx-group__header">
          <span className="tlx-group__dot" style={{ background: g.color }} />
          <span className="tlx-group__label">{g.label}</span>
          <span className="tlx-group__count">{g.tasks.length}</span>
        </header>
        <div className="tlx-group__rows">
          {visible.map(renderTaskRow)}
        </div>
        {g.tasks.length > INITIAL_VISIBLE && (
          <button
            type="button"
            className="tlx-more"
            onClick={() => setExpandedGroups((prev) => ({ ...prev, [`${groupBy}:${g.key}`]: !expanded }))}
          >
            {expanded ? 'Show less' : `Show ${hiddenCount} more ${g.label.toLowerCase()}`}
          </button>
        )}
      </section>
    );
  };

  /* ---------- Detail panel ---------- */
  const renderDetailPanel = () => {
    if (!selectedTask) return null;
    const t = selectedTask;
    const due = getDueMeta(t);
    const names = getAssigneeNames(t);
    const status = String(t.status || '').toLowerCase();
    const priority = String(t.priority || 'medium').toLowerCase();
    const canViewDetail = taskPerms.canViewDetail === true;
    const canEditThisTask = canEditTaskByCurrentUser(t);
    const canUpdate = taskPerms.canUpdate === true;
    const canChangeAsAssignee =
      isTaskAssignedToCurrentUser(t) && (taskPerms.canUpdate === true || taskPerms.canComplete === true);
    const canChangeStatus = canUpdate || canChangeAsAssignee;
    const busy = statusUpdatingId === t.id;
    const workflow = String(t.workflow_type || '').toLowerCase();
    const isApprovalWorkflow = workflow === 'approval_required';
    const isAssignee = isTaskAssignedToCurrentUser(t);
    const isAdminRole = ['admin', 'super_admin'].includes(String(user?.role || '').toLowerCase());
    const approvalTask = approvalRequestsForUser.find((approval) => Number(approval.id) === Number(t.id));
    const hasPendingApproval = approvalsLoaded && approvalTask?._isPendingAction === true;
    const approvalContext = {
      permissions: taskPerms,
      userDepartment: user?.department,
      taskDepartment: t.department,
      userRole: user?.role,
      isAssignee,
      workflowType: workflow,
      currentStatus: status,
      currentUserId,
      createdByUserId: t.created_by_id,
      reportedById: t.reported_to_id,
      approvalRequiredUserIds: t.approval_required_user_ids,
      approvalsMeta: approvalTask?.approvals_meta || [],
      currentUserHasActedOnApproval: !hasPendingApproval,
    };
    const canReviewApproval =
      isApprovalWorkflow &&
      ['pending_approval', 'rejected'].includes(status) &&
      hasPendingApproval &&
      isStatusActionAvailable('APPROVE', approvalContext) &&
      isStatusActionAvailable('REJECT', approvalContext);
    const canStartTask =
      canChangeStatus &&
      ['open', 'assigned'].includes(status) &&
      isStatusActionAvailable('START', approvalContext);
    const canCompleteTask =
      canChangeStatus &&
      status === 'in_progress' &&
      isStatusActionAvailable('COMPLETE', approvalContext);
    const canReopenTask =
      canChangeStatus &&
      status === 'blocked' &&
      isStatusActionAvailable('REOPEN_IN_PROGRESS', approvalContext);
    const canSubmitApproval =
      isApprovalWorkflow &&
      status === 'completed' &&
      isAssignee &&
      !isAdminRole &&
      isStatusActionAvailable('SUBMIT_APPROVAL', approvalContext);
    const canCloseTask =
      (status === 'approved' || (status === 'completed' && !isApprovalWorkflow)) &&
      isStatusActionAvailable('CLOSE', approvalContext);

    const rawChecklist = Array.isArray(t.checklist) ? t.checklist : (Array.isArray(t.done_when) ? t.done_when : []);
    const checklist = rawChecklist.map((item) => (
      typeof item === 'string'
        ? { text: item, done: false }
        : { text: item?.text || item?.title || item?.label || '', done: Boolean(item?.done || item?.completed || item?.checked) }
    )).filter((i) => i.text);
    const doneCount = checklist.filter((i) => i.done).length;

    let heroNumber = null;
    let heroTitle = '';
    let heroSub = '';
    if (due.kind === 'overdue') {
      heroNumber = due.days === 0 ? '!' : String(due.days);
      heroTitle = due.days === 0 ? 'overdue today' : `day${due.days === 1 ? '' : 's'} overdue`;
      heroSub = `Was due ${formatLongDate(t.due_date)}`;
    } else if (due.kind === 'today') {
      heroNumber = '0';
      heroTitle = 'Due today';
      heroSub = formatLongDate(t.due_date);
    } else if (due.kind === 'upcoming') {
      heroNumber = String(due.days);
      heroTitle = `day${due.days === 1 ? '' : 's'} left`;
      heroSub = `Due ${formatLongDate(t.due_date)}`;
    } else if (due.kind === 'done') {
      heroNumber = '✓';
      heroTitle = capitalize(status);
      heroSub = due.text !== capitalize(status) ? `On ${due.text}` : '';
    } else {
      heroNumber = '–';
      heroTitle = 'No due date';
    }

    return (
      <aside className="tlx-panel" aria-label="Task details">
        <div className="tlx-panel__top">
          <span className="tlx-panel__id">ID-{String(t.id).padStart(4, '0')}</span>
          <div className="tlx-panel__top-actions">
            <button
              type="button"
              className="tlx-panel__link"
              disabled={!canViewDetail}
              title={!canViewDetail ? hoverText('view') : 'Open full page'}
              onClick={canViewDetail ? () => navigate(`${tasksRouteBase}/view/${t.id}`) : undefined}
            >
              Open full page <FiExternalLink aria-hidden />
            </button>
            <button
              type="button"
              className="tlx-panel__close"
              aria-label="Close details"
              onClick={() => setSelectedTaskId(null)}
            >
              <FiX />
            </button>
          </div>
        </div>

        <h2 className="tlx-panel__title" dir="auto">{t.title}</h2>

        <div className={`tlx-hero tlx-hero--${due.kind}`}>
          <span className="tlx-hero__number">{heroNumber}</span>
          <div className="tlx-hero__text">
            <strong>{heroTitle}</strong>
            {heroSub && <span>{heroSub}</span>}
          </div>
        </div>

        <dl className="tlx-fields">
          <div><dt>Status</dt><dd className={`tlx-fields__status tlx-fields__status--${status}`}>{capitalize(status) || 'Pending'}</dd></div>
          <div><dt>Priority</dt><dd className={`tlx-fields__prio tlx-fields__prio--${priority}`}>{capitalize(priority)}</dd></div>
          <div><dt>Assignee</dt><dd>{names.length ? names.join(', ') : '—'}</dd></div>
          <div><dt>Created by</dt><dd>{t.created_by_name
            || t.created_by?.name
            || t.creator_name
            || userNamesById[Number(t.created_by_id)]
            || (Number(t.created_by_id) === currentUserId
              ? (`${user?.first_name || ''} ${user?.last_name || ''}`).trim() || user?.name || user?.email
              : '')
            || '—'}</dd></div>
          <div><dt>Department</dt><dd>{getTaskDeptLabel(t)}</dd></div>
          {t.project_name && <div><dt>Project</dt><dd>{t.project_name}</dd></div>}
          <div><dt>Start</dt><dd>{formatDate(t.start_date)}</dd></div>
          <div><dt>Due</dt><dd className={due.kind === 'overdue' ? 'tlx-fields__late' : ''}>{formatDate(t.due_date)}</dd></div>
        </dl>

        {checklist.length > 0 && (
          <div className="tlx-checklist">
            <div className="tlx-checklist__head">
              <strong>Done when…</strong>
              <span>{doneCount} / {checklist.length}</span>
            </div>
            <ul>
              {checklist.map((item, idx) => (
                <li key={`${item.text}-${idx}`}>
                  <input type="checkbox" checked={item.done} readOnly aria-label={item.text} />
                  <span>{item.text}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {t.description && <p className="tlx-panel__desc">{t.description}</p>}

        <div className="tlx-panel__footer">
          {canStartTask && (
            <button type="button" className="tlx-btn" disabled={busy} onClick={() => handleQuickStatusChange(t, 'in_progress', 'START', approvalContext)}>
              <FiPlay aria-hidden /> Start
            </button>
          )}
          {canCompleteTask && (
            <button type="button" className="tlx-btn tlx-btn--primary" disabled={busy} onClick={() => handleQuickStatusChange(t, 'completed', 'COMPLETE', approvalContext)}>
              <FiCheckCircle aria-hidden /> Complete
            </button>
          )}
          {canSubmitApproval && (
            <button type="button" className="tlx-btn tlx-btn--primary" onClick={() => setApprovalModal({ taskId: t.id, action: 'SUBMIT_APPROVAL' })}>
              Submit for approval
            </button>
          )}
          {canReviewApproval && (
            <>
              <button type="button" className="tlx-btn tlx-btn--primary" onClick={() => setApprovalModal({ taskId: t.id, action: 'APPROVE' })}>
                Approve
              </button>
              <button type="button" className="tlx-btn" onClick={() => setApprovalModal({ taskId: t.id, action: 'REJECT' })}>
                Reject
              </button>
            </>
          )}
          {canCloseTask && (
            <button type="button" className="tlx-btn" disabled={busy} onClick={() => handleQuickStatusChange(t, 'closed', 'CLOSE', approvalContext)}>
              Close task
            </button>
          )}
          {canReopenTask && (
            <button type="button" className="tlx-btn" disabled={busy} onClick={() => handleQuickStatusChange(t, 'in_progress', 'REOPEN_IN_PROGRESS', approvalContext)}>
              <FiRotateCcw aria-hidden /> Reopen
            </button>
          )}
          {canEditThisTask && (
            <button
              type="button"
              className="tlx-btn"
              onClick={() => navigate(`${tasksRouteBase}/update/${t.id}`)}
            >
              <FiEdit2 aria-hidden /> Edit
            </button>
          )}
        </div>
        {approvalModal?.taskId === t.id && (
          <StatusUpdateModal
            isOpen
            taskId={t.id}
            action={approvalModal.action}
            onClose={() => setApprovalModal(null)}
            onUpdated={(updated) => {
              if (updated?.id) {
                setTasks((previous) => previous.map((item) => (
                  Number(item.id) === Number(updated.id) ? { ...item, ...updated } : item
                )));
              } else {
                refresh();
              }
              fetchApprovals();
            }}
          />
        )}
      </aside>
    );
  };

  const sortOptions = [
    { value: 'title', label: 'Title' },
    { value: 'priority', label: 'Priority' },
    { value: 'status', label: 'Status' },
    { value: 'department', label: 'Department' },
    { value: 'due_date', label: 'Due Date' },
    { value: 'created_at', label: 'Created' },
  ];

  const pendingBadgeCount = approvalsLoaded ? pendingApprovalIds.size : 0;

  const scopeTabs = [
    { key: 'assigned_to_me', label: 'Mine', title: 'Assigned to me', Icon: FiUserCheck, count: categoryCounts.assigned_to_me, show: true },
    { key: 'other_tasks', label: 'Assigned by me', title: 'Assigned by me', Icon: FiList, count: categoryCounts.other_tasks, show: true },
    { key: 'assigned_to_team', label: 'Team', title: 'Assigned to team', Icon: FiUsers, count: categoryCounts.assigned_to_team, show: isManager },
  ].filter((tab) => tab.show);

  const emptyStates = {
    assigned_to_me: [FiUserCheck, 'No tasks assigned to you at the moment.'],
    assigned_to_team: [FiUsers, 'No tasks assigned to your team members.'],
    approval_tasks: [FiThumbsUp, 'No approval tasks found.'],
    other_tasks: [FiList, 'No tasks assigned by you found.'],
  };
  const [EmptyIcon, emptyText] = emptyStates[activeTab] || emptyStates.assigned_to_me;

  return (
    <>
      <Navbar />
      <Loader loading={loading} />
      <div className="tlx-page">
        <div className="tlx-layout">
          <div className="tlx-main">
            <div className="tlx-module-nav">
              <div className="tlx-module-nav__tabs" role="tablist" aria-label="Task sections">
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab !== 'approval_tasks'}
                  className={`tlx-module-nav__tab ${activeTab !== 'approval_tasks' ? 'is-active' : ''}`}
                  onClick={() => handleTabChange(activeTab === 'approval_tasks' ? 'assigned_to_me' : activeTab)}
                >
                  Tasks
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'approval_tasks'}
                  className={`tlx-module-nav__tab ${activeTab === 'approval_tasks' ? 'is-active' : ''}`}
                  onClick={() => handleTabChange('approval_tasks')}
                >
                  Approvals
                  {(pendingBadgeCount || approvalTabTotalCount) > 0 && (
                    <span className="tlx-module-nav__count">
                      {pendingBadgeCount || approvalTabTotalCount}
                    </span>
                  )}
                </button>
              </div>
              <button
                type="button"
                className="tlx-add"
                onClick={taskPerms.canCreate
                  ? () => navigate(`${tasksRouteBase}/add`, { state: { defaultDepartment: user?.department } })
                  : undefined}
                disabled={!taskPerms.canCreate}
                title={hoverText('create')}
              >
                <FiPlus aria-hidden />
                <span>New task</span>
              </button>
            </div>

            <div className="tlx-head">
              <h1 className="tlx-head__title">Tasks</h1>
              <div className="tlx-scope" role="tablist" aria-label="Task scope">
                {scopeTabs.map(({ key, label, title, Icon, count, badge }) => (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    aria-selected={activeTab === key}
                    className={`tlx-scope__btn ${activeTab === key ? 'is-active' : ''}`}
                    onClick={() => handleTabChange(key)}
                    title={title}
                  >
                    <Icon aria-hidden />
                    <span className="tlx-scope__label">{label}</span>
                    <span className="tlx-scope__count">{count ?? 0}</span>
                    {badge > 0 && (
                      <span className="tl-approval-pending-badge" title={`${badge} pending approval`}>{badge}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="tlx-toolbar">
              <div className="tlx-toolbar__search">
                <FiSearch aria-hidden />
                <input
                  type="search"
                  value={tempFilters.search || ''}
                  onChange={(event) => handleFilterChange('search', event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') handleApplyFilters();
                  }}
                  placeholder="Filter..."
                  aria-label="Filter tasks"
                />
              </div>

              <button
                type="button"
                className={`tlx-chip ${filtersOpen ? 'is-active' : ''}`}
                onClick={toggleFilters}
                aria-expanded={filtersOpen}
              >
                <FiFilter aria-hidden />
                {filtersOpen ? 'Hide filters' : 'Filters'}
              </button>

              <label className="tlx-chip tlx-chip--select">
                <span>Group:</span>
                <select value={groupBy} onChange={(e) => setGroupBy(e.target.value)} aria-label="Group tasks by">
                  {GROUP_BY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </label>

              <div className="tlx-toolbar__right">
                <TaskViewModeSwitch value={viewMode} onChange={onViewModeChange} />
              </div>
            </div>

            <CollapsibleFilters open={filtersOpen}>
              <div className="filters-section tlx-filters">
                <div className="tlx-filter-assignee">
                  <TaskAssigneeFilter
                    value={assignedUser}
                    onSelect={setAssignedUser}
                    onClear={() => setAssignedUser(null)}
                    placeholder="Filter by assignee..."
                  />
                </div>
                <DropdownFilter
                  filterKey="department"
                  label="Department"
                  data={TASK_DEPARTMENT_OPTIONS}
                  filters={tempFilters}
                  onFilterChange={handleFilterChange}
                  placeholder="All Departments"
                />
                <DropdownFilter
                  filterKey="project_name"
                  label="Project / Program"
                  data={TASK_PROJECT_PROGRAM_OPTIONS}
                  filters={tempFilters}
                  onFilterChange={handleFilterChange}
                  placeholder="All Projects/Programs"
                />
                <DropdownFilter
                  filterKey="status"
                  label="Status"
                  data={statusFilterOptions}
                  filters={tempFilters}
                  onFilterChange={handleFilterChange}
                  placeholder="All Statuses"
                />
                <DropdownFilter
                  filterKey="priority"
                  label="Priority"
                  data={priorityFilterOptions}
                  filters={tempFilters}
                  onFilterChange={handleFilterChange}
                  placeholder="All Priorities"
                />
                <div className="tlx-filter-team">
                  <TeamFilter
                    filters={tempFilters}
                    onFilterChange={handleFilterChange}
                    label="Team / Report"
                  />
                </div>
                <div className="filters-actions">
                  <SearchButton onClick={handleApplyFilters} loading={loading} />
                  <ClearButton onClick={handleClearAll} disabled={loading} />
                  <RefreshButton onClick={refresh} loading={loading} />
                </div>
              </div>
            </CollapsibleFilters>

            {error && <div className="tl-status-message tl-status-message--error">{error}</div>}

            <div className="tlx-groups">
              {groups.length > 0 ? (
                groups.map(renderGroup)
              ) : (
                <div className="tl-empty-tab-state">
                  <EmptyIcon className="tl-empty-icon" />
                  <p>{emptyText}</p>
                </div>
              )}
            </div>

            {totalItems > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
                onSortChange={handleSortChange}
                sortField={sortField}
                sortOrder={sortOrder}
                sortOptions={sortOptions}
              />
            )}
          </div>

          {selectedTask && (
            <>
              <div className="tlx-backdrop" onClick={() => setSelectedTaskId(null)} aria-hidden />
              {renderDetailPanel()}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default TasksList;
