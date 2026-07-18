import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import { toast } from 'react-toastify';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import Loader from '../../../common/loader/Loader';
import FormInput from '../../../common/FormInput';
import FormTextarea from '../../../common/FormTextarea';
import { useAuth } from '../../../../context/AuthContext';
import { getTaskPermissions } from '../../../../utils/permissions';
import { tasksBasePath } from '../../../../utils/admin';
import { splitDescriptionAndMov } from '../../../../utils/movEncoding';
import PrimaryButton from '../../../common/buttons/primary';
import TaskActionBar from './TaskActionBar';
import TimeTracker from './TimeTracker';
import ProgressUpdate from './ProgressUpdate';
import StatusUpdateModal from './StatusUpdateModal';
import QuickActionModal from './QuickActionModal';
import { STATUS_TRANSITION_MAP, QUICK_ACTION_LABEL_MAP } from './taskStatusConfig';
import '../../../../styles/variables.css';
import './index.css';

const ViewTask = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, permissions } = useAuth();
  const [task, setTask] = useState(null);

  const [assignedUsersMeta, setAssignedUsersMeta] = useState([]);
  const [usersById, setUsersById] = useState({});
  const [usersFetchInProgress, setUsersFetchInProgress] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attachment, setAttachment] = useState({ file: null });
  const [attachmentDescription, setAttachmentDescription] = useState('');
  const [comment, setComment] = useState({ content: '' });
  const [savingAttachment, setSavingAttachment] = useState(false);
  const [savingComment, setSavingComment] = useState(false);
  const [relatedTasks, setRelatedTasks] = useState([]);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showProgressHistory, setShowProgressHistory] = useState(false);
  const [approvalState, setApprovalState] = useState(null);
  const [approvalLoaded, setApprovalLoaded] = useState(false);
  const [approvalLoading, setApprovalLoading] = useState(true);

  const getAttachmentHref = (urlStr) => {
    if (!urlStr) return '#';
    if (urlStr.startsWith('http://') || urlStr.startsWith('https://')) {
      return urlStr;
    }
    const base = axiosInstance.defaults.baseURL || '';
    const normalizedBase = base.replace(/\/$/, '');
    return `${normalizedBase}${urlStr}`;
  };

  useEffect(() => {
    setShowFullDescription(false);
  }, [task?.id]);

  useEffect(() => {
    let cancelled = false;
    const fetch = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await axiosInstance.get(`/tasks/${id}`);
        const t = res.data.data;
        if (!cancelled) {
          setTask(t);
          setAssignedUsersMeta(Array.isArray(t.assigned_users_meta) ? t.assigned_users_meta : []);
          // Note: approval data is now lazy-loaded only when needed
        }
      } catch (e) {
        if (!cancelled) {
          setError(e.response?.data?.message || 'Failed to load task.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    fetch();
    return () => {
      cancelled = true;
    };
  }, [id]);

  // Optimized user resolution - CONDITIONAL API CALL
  // The /users/by-ids API is ONLY called when:
  // 1. Task has assigned users (assigned_user_ids)
  // 2. Approval data is loaded AND task has approvers
  // 3. Task has reassignment activities

  useEffect(() => {
    if (!task) return;

    const resolveUsers = async () => {
      // Collect all user IDs that need to be resolved
      const idsFromAssigned = Array.isArray(task.assigned_user_ids)
        ? task.assigned_user_ids.filter((n) => Number.isInteger(n) && n > 0)
        : [];
      const idsFromMeta = Array.isArray(task.assigned_users_meta)
        ? task.assigned_users_meta
            .map((m) => m?.user_id)
            .filter((n) => Number.isInteger(n) && n > 0)
        : [];
      
      const idsFromApprovers = Array.isArray(task.approval_required_user_ids)
        ? task.approval_required_user_ids
            .map((n) => Number(n))
            .filter((n) => Number.isInteger(n) && n > 0)
        : [];

      const approvalsMetaRaw = Array.isArray(approvalState?.approvals_meta)
        ? approvalState.approvals_meta
        : [];
      const approvalMetaIds = approvalsMetaRaw
        .map((m) => (m && m.user_id ? Number(m.user_id) : null))
        .filter((n) => Number.isInteger(n) && n > 0);

      // Only include reassignment IDs if there are activities
      const reassignmentIds = [];
      if (Array.isArray(task.activities) && task.activities.length > 0) {
        task.activities.forEach((a) => {
          if (!a || a.action !== 'reassigned') return;
          const details = a.details;
          if (Array.isArray(details)) {
            details.forEach((d) => {
              if (!d || d.user_id == null) return;
              const num = Number(d.user_id);
              if (Number.isInteger(num) && num > 0) reassignmentIds.push(num);
            });
          } else if (details && typeof details === 'object') {
            const fromIds = Array.isArray(details.from_assigned_user_ids) ? details.from_assigned_user_ids : [];
            const toIds = Array.isArray(details.to_assigned_user_ids) ? details.to_assigned_user_ids : [];
            [...fromIds, ...toIds].forEach((idVal) => {
              const num = Number(idVal);
              if (Number.isInteger(num) && num > 0) reassignmentIds.push(num);
            });
          }
        });
      }

      // NOTE: created_by_id and reported_by_id are NOT included here because
      // the backend already returns task.created_by and task.reported_by as full user objects
      // via leftJoinAndSelect in the findOne method

      const allNeededIds = Array.from(
        new Set([
          ...idsFromAssigned,
          ...idsFromMeta,
          ...idsFromApprovers,
          ...approvalMetaIds,
          ...reassignmentIds,
        ]),
      ).filter((n) => n != null && Number.isInteger(n) && n > 0);

      // Only fetch if there are missing IDs that we don't already have cached
      const missingIds = allNeededIds.filter(id => !usersById[id]);

      if (missingIds.length > 0 && !usersFetchInProgress) {
        setUsersFetchInProgress(true);
        try {
          const query = missingIds.map((idVal) => `ids=${encodeURIComponent(idVal)}`).join('&');
          const res = await axiosInstance.get(`/users/by-ids?${query}`);
          const usersArray = Array.isArray(res.data) ? res.data : [];
          setUsersById(prev => {
            const next = { ...prev };
            usersArray.forEach(u => {
              if (u && u.id) next[Number(u.id)] = u;
            });
            return next;
          });
        } catch (err) {
          console.error('Failed to resolve users', err);
        } finally {
          setUsersFetchInProgress(false);
        }
      }
    };

    resolveUsers();
  }, [task?.id, approvalState]); // Only re-run when task ID changes or approval state is loaded

  // Lazy load approval data only when needed (with force option)
  const loadApprovalData = useCallback(async (force = false) => {
    if (!force && (approvalLoaded || approvalLoading)) return;
    
    setApprovalLoading(true);
    try {
      const approvalRes = await axiosInstance.get(`/tasks/${id}/approval`);
      setApprovalState(approvalRes.data?.data || null);
      setApprovalLoaded(true);
    } catch {
      setApprovalState(null);
      setApprovalLoaded(true);
    } finally {
      setApprovalLoading(false);
    }
  }, [id, approvalLoading]);

  const assignedUsers = useMemo(() => {
    if (!task || !Array.isArray(task.assigned_user_ids)) return [];
    return task.assigned_user_ids
      .map(id => usersById[Number(id)])
      .filter(Boolean);
  }, [task?.assigned_user_ids, usersById]);

  const capitalize = (s) => {
    if (!s) return '';
    return String(s).split('_').map(w => w[0] ? w[0].toUpperCase() + w.slice(1) : '').join(' ');
  };
  const formatDate = (d) => d ? new Date(d).toLocaleString() : '-';

  const parseAsLocal = (dateInput) => {
    if (!dateInput) return new Date(NaN);
    if (dateInput instanceof Date) return new Date(dateInput);
    
    // If it's a date string from backend (YYYY-MM-DD), parse as local midnight
    if (typeof dateInput === 'string' && dateInput.includes('-') && !dateInput.includes('T') && !dateInput.includes(':')) {
      const [year, month, day] = dateInput.split('-').map(Number);
      return new Date(year, month - 1, day);
    }
    return new Date(dateInput);
  };

  const formatDateOnly = (date) => {
    if (!date) return 'N/A';
    // Use string parsing to avoid timezone shift for "YYYY-MM-DD" dates
    const d = parseAsLocal(date);
    if (Number.isNaN(d.getTime())) return 'N/A';
    
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTaskId = (t) => {
    if (!t) return '-';
    if (t.code) return `#${t.code}`;
    const rawId = t.id != null ? String(t.id) : '';
    if (!rawId) return '-';
    const padded = rawId.padStart(4, '0');
    return `#TASK-${padded}`;
  };

  const getDueInfo = (rawDate, statusRaw) => {
    if (!rawDate) return null;
    const dueObj = parseAsLocal(rawDate);
    if (Number.isNaN(dueObj.getTime())) return null;
    const now = new Date();
    const sLower = String(statusRaw || '').toLowerCase();
    if (['completed', 'closed', 'cancelled'].includes(sLower)) return null;

    // A task becomes overdue ONLY after 12:00 PM (noon) on the due date.
    const dueNoon = new Date(dueObj);
    dueNoon.setHours(12, 0, 0, 0);

    const startOfDueDay = new Date(dueObj);
    startOfDueDay.setHours(0, 0, 0, 0);
    const startOfNowDay = new Date(now);
    startOfNowDay.setHours(0, 0, 0, 0);

    if (now > dueNoon) {
      const diffMs = startOfNowDay.getTime() - startOfDueDay.getTime();
      const overdueDays = Math.round(diffMs / 86400000);
      
      if (overdueDays === 0) {
        return { label: 'Overdue today', variant: 'warning' };
      }
      return { label: `Overdue by ${overdueDays} day${overdueDays === 1 ? '' : 's'}`, variant: 'danger' };
    } else {
      const diffMs = startOfDueDay.getTime() - startOfNowDay.getTime();
      const diffDays = Math.round(diffMs / 86400000);

      if (diffDays === 0) {
        return { label: 'Due today', variant: 'warning' };
      }
      return { label: `Due in ${diffDays} day${diffDays === 1 ? '' : 's'}`, variant: 'normal' };
    }
  };
  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);
  const getUserDisplayName = (u) => {
    if (!u) return '-';
    const full = `${u.first_name || ''} ${u.last_name || ''}`.trim();
    if (full) return full;
    if (u.email) return u.email;
    if (u.id) return `User #${u.id}`;
    return '-';
  };
  const getUserNameFromId = (idVal) => {
    const num = Number(idVal);
    if (!Number.isFinite(num) || num <= 0) return '-';
    const userObj = usersById[num];
    if (userObj) return getUserDisplayName(userObj);
    return `User #${num}`;
  };
  const getStatusBadge = (sVal) => {
    const statusStr = String(sVal || '').toLowerCase();
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
      closed: 'status-closed',
    };
    const cls = statusClassMap[statusStr] || 'status-registered';
    const normalized = statusStr ? statusStr.replace(/_/g, ' ') : 'pending';
    const label = normalized.toUpperCase();
    return <span className={`status-badge ${cls}`}>{label}</span>;
  };

  const getTaskTypeValue = (t) => {
    if (!t) return 'one_time';
    const hasRecurrence = t.recurrence_rule || t.recurrence_next_date;
    const hasProject = t.project_id || t.project_name;
    if (hasRecurrence) return 'recurring';
    if (hasProject) return 'project_linked';
    return 'one_time';
  };

  const taskTypeValueFromBackend = String(task?.task_type || '').toLowerCase();
  const inferredTaskTypeValue = getTaskTypeValue(task);
  const taskTypeValueFinal = taskTypeValueFromBackend || inferredTaskTypeValue;
  const isRecurringTask = taskTypeValueFinal === 'recurring';
  const taskTypeLabel =
    taskTypeValueFinal === 'recurring'
      ? 'Recurring Task'
      : taskTypeValueFinal === 'project_linked'
      ? 'Project-linked Task'
      : 'One-time Task';

  const isApprovalWorkflow =
    String(task?.workflow_type || '').toLowerCase() === 'approval_required';
  const statusLower = String(task?.status || '').toLowerCase();

  const approvalRequiredIds = Array.isArray(task?.approval_required_user_ids)
    ? task.approval_required_user_ids
        .map((n) => Number(n))
        .filter((n) => Number.isInteger(n) && n > 0)
    : [];

  const approvalsMetaRaw = Array.isArray(approvalState?.approvals_meta)
    ? approvalState.approvals_meta
    : [];
  const approvalsMeta = approvalsMetaRaw;

  const currentUserId = Number(user?.id) || 0;
  const isCurrentUserApprover =
    currentUserId > 0 && approvalRequiredIds.includes(currentUserId);
  const isApproverView = isApprovalWorkflow && isCurrentUserApprover;

  const approvalRows = approvalRequiredIds.map((idVal) => {
    const meta = approvalsMeta.find(
      (m) => m && Number(m.user_id) === Number(idVal),
    );
    const decisionRaw = meta?.decision || 'pending';
    let decision = String(decisionRaw || 'pending').toLowerCase();
    if (
      isApprovalWorkflow &&
      (statusLower === 'approved' || statusLower === 'closed') &&
      (!meta || decision === 'pending')
    ) {
      decision = 'approved';
    }
    let decisionLabel = 'Pending';
    if (decision === 'approved') decisionLabel = 'Approved';
    else if (decision === 'rejected') decisionLabel = 'Rejected';
    return {
      id: idVal,
      name: getUserNameFromId(idVal),
      decision,
      decisionLabel,
    };
  });

  const hasApprovalPanel =
    isApprovalWorkflow && approvalRequiredIds && approvalRequiredIds.length > 0;

  // Auto-load approval data whenever task is loaded and workflow is approval_required
  useEffect(() => {
    if (task) {
      const isApproval = String(task.workflow_type).toLowerCase() === 'approval_required';
      if (isApproval) {
        loadApprovalData(true);
      } else {
        setApprovalLoading(false);
      }
    }
  }, [task?.id]);

  const showCompletedDate =
    !!task?.completed_date &&
    ((!isApprovalWorkflow &&
      ['completed', 'closed', 'cancelled'].includes(statusLower)) ||
      (isApprovalWorkflow &&
        [
          'completed',
          'pending_approval',
          'approved',
          'rejected',
          'closed',
          'cancelled',
        ].includes(statusLower)));

  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusModalAction, setStatusModalAction] = useState(null);
  const [statusActionLoading, setStatusActionLoading] = useState(false);

  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [quickActionOpen, setQuickActionOpen] = useState(false);
  const [quickActionKey, setQuickActionKey] = useState(null);
  const [currentUserHasActedOnApproval, setCurrentUserHasActedOnApproval] =
    useState(false);

  const isTaskOverdueAfterToday = () => {
    if (!task || !task.due_date) return false;
    const dueVal = parseAsLocal(task.due_date);
    if (Number.isNaN(dueVal.getTime())) return false;
    const now = new Date();
    const statusVal = String(task.status || '').toLowerCase();
    if (['completed', 'closed', 'cancelled'].includes(statusVal)) return false;

    // Red banner should only appear AFTER the due date (next day onwards)
    const startOfNextDay = new Date(dueVal);
    startOfNextDay.setDate(startOfNextDay.getDate() + 1);
    startOfNextDay.setHours(0, 0, 0, 0);

    return now.getTime() >= startOfNextDay.getTime();
  };

  const isTaskOverdueToday = () => {
    if (!task || !task.due_date) return false;
    const dueVal = parseAsLocal(task.due_date);
    if (Number.isNaN(dueVal.getTime())) return false;
    const now = new Date();
    const statusVal = String(task.status || '').toLowerCase();
    if (['completed', 'closed', 'cancelled'].includes(statusVal)) return false;

    // Amber warning if it's past 12 PM on the due date today.
    const dueNoon = new Date(dueVal);
    dueNoon.setHours(12, 0, 0, 0);

    const startOfDueDay = new Date(dueVal);
    startOfDueDay.setHours(0, 0, 0, 0);
    const startOfNowDay = new Date(now);
    startOfNowDay.setHours(0, 0, 0, 0);

    return (
      startOfDueDay.getTime() === startOfNowDay.getTime() &&
      now.getTime() > dueNoon.getTime()
    );
  };

  const isTaskDueTodayBeforeNoon = () => {
    if (!task || !task.due_date) return false;
    const dueVal = parseAsLocal(task.due_date);
    if (Number.isNaN(dueVal.getTime())) return false;
    const now = new Date();
    const statusVal = String(task.status || '').toLowerCase();
    if (['completed', 'closed', 'cancelled'].includes(statusVal)) return false;

    const dueNoon = new Date(dueVal);
    dueNoon.setHours(12, 0, 0, 0);

    const startOfDueDay = new Date(dueVal);
    startOfDueDay.setHours(0, 0, 0, 0);
    const startOfNowDay = new Date(now);
    startOfNowDay.setHours(0, 0, 0, 0);

    return (
      startOfDueDay.getTime() === startOfNowDay.getTime() &&
      now.getTime() <= dueNoon.getTime()
    );
  };

  const renderReminderBanner = (title, message, isWarning = false) => (
    <div className={`overdue-reminder${isWarning ? ' overdue-reminder--warning' : ''}`}>
      <div className="overdue-reminder-icon">!</div>
      <div className="overdue-reminder-content">
        <div className="overdue-reminder-title">{title}</div>
        <div className="overdue-reminder-text">{message}</div>
      </div>
    </div>
  );

  const taskRouteBase = useMemo(() => tasksBasePath(), []);

  const taskPerms = useMemo(
    () => getTaskPermissions(permissions || {}, user?.department, user?.role),
    [permissions, user?.department, user?.role],
  );
  const canApprove = taskPerms.canApprove === true;

  const renderRecurrenceInfo = () => {
    if (task?.task_type !== 'recurring' || !task?.recurrence_rule) return null;

    const info = task.recurrence_info;
    if (!info) return null;

    const { upcomingDates, lastDate, remainingCount } = info;
    const rule = task.recurrence_rule;

    return (
      <div className="recurrence-card-container">
        <div className="recurrence-card">
          <div className="recurrence-card-body">
            <div className="recurrence-icon-box">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
                <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                <path d="M16 16h5v5" />
              </svg>
            </div>
            <div className="recurrence-content">
              <div className="recurrence-main-info">
                <h4 className="recurrence-title-text">
                  Recurring Task <span className="recurrence-dot-separator"></span> Every <strong>{rule}</strong>
                </h4>
                <div className="recurrence-status-row">
                  {task.recurrence_end_type === 'on_date' && (
                    <span className="recurrence-end-info">
                      Ends on <strong>{formatDateOnly(lastDate)}</strong>
                    </span>
                  )}
                  {task.recurrence_end_type === 'after_occurrences' && (
                    <span className="recurrence-end-info">
                      Ends after <strong>{task.recurrence_end_occurrences}</strong> total occurrences
                    </span>
                  )}
                  {task.recurrence_end_type === 'never' && (
                    <span className="recurrence-end-info">
                      Repeats Indefinitely
                    </span>
                  )}
                  {remainingCount !== null && (
                    <span className="recurrence-count-badge">
                      {remainingCount} Remaining
                    </span>
                  )}
                </div>
              </div>

              {upcomingDates && upcomingDates.length > 0 && (
                <div className="recurrence-upcoming">
                  <span className="upcoming-title">Upcoming Dates</span>
                  <div className="upcoming-pills">
                    {upcomingDates.map((d, i) => (
                      <span key={i} className="upcoming-pill">
                        {formatDateOnly(d)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };
  const canCreate = taskPerms.canCreate === true;
  const canUpdate = taskPerms.canUpdate === true;
  const canView = taskPerms.canView === true;
  const canInteractWithNotes = canUpdate || canCreate || canView;
  const canDeleteAttachment = canUpdate || canCreate;

  const primaryAssigneeName =
    assignedUsers && assignedUsers.length > 0
      ? getUserDisplayName(assignedUsers[0])
      : '';

  const isCurrentUserAssignee = useMemo(() => {
    if (!user || !Array.isArray(assignedUsers)) return false;
    return assignedUsers.some((u) => u && Number(u.id) === Number(user.id));
  }, [user, assignedUsers]);

  const canEditMovChecklist = useMemo(() => {
    if (!task || !user) return false;
    
    // Check if task is in a terminal or approval state where MOV cannot be edited
    // MOV editing is blocked when task is:
    // - Completed/Closed/Cancelled/Rejected (terminal states)
    // - Pending Approval/Approved (approval workflow states, should be read-only)
    const sVal = String(task.status || '').toLowerCase();
    if (['completed', 'closed', 'cancelled', 'rejected', 'pending_approval', 'approved'].includes(sVal)) return false;
    
    // ROLE-BASED RESTRICTION: Task creators CANNOT interact with MOV checkboxes
    // Only assignees can check/uncheck MOV items
    const isTaskCreator = Number(task.created_by_id) === Number(user?.id);
    if (isTaskCreator) {
      return false; // Block task creators from MOV interaction
    }
    
    // Check if user is assignee
    const isAssignee = Array.isArray(task.assigned_user_ids) && task.assigned_user_ids.includes(user?.id);
    
    // ONLY assignees can check/uncheck MOV items (with view permission)
    // Task creators, admins, dept leaders, and others CANNOT modify MOV checkboxes
    if (isAssignee) {
      return taskPerms?.canView === true;
    }
    
    return false;
  }, [task, user, taskPerms]);

  const canChangeStatusInline = useMemo(() => {
    if (!task || !user || !isCurrentUserAssignee) return false;
    const sVal = String(task.status || '').toLowerCase();
    return !['pending_approval', 'completed', 'closed', 'cancelled'].includes(sVal);
  }, [task, user, isCurrentUserAssignee]);

  const handleInlineStatusChange = async (nextStatus) => {
    if (!canChangeStatusInline) return;
    const normalizedNext = String(nextStatus || '').toLowerCase();
    const current = String(task?.status || '').toLowerCase();
    if (!normalizedNext || normalizedNext === current) {
      setStatusDropdownOpen(false);
      return;
    }
    setStatusActionLoading(true);
    setError('');
    try {
      const payload = { status: normalizedNext, notes: '' };
      await axiosInstance.post(`/tasks/${id}/status-transition`, payload);
      const refreshed = await axiosInstance.get(`/tasks/${id}`);
      const updatedTask = refreshed.data?.data || null;
      if (updatedTask) {
        setTask(updatedTask);
      }
      toast.success('Status updated.');
    } catch (e) {
      const msg = e.response?.data?.message || 'Failed to update status.';
      setError(msg);
      toast.error(msg);
    } finally {
      setStatusActionLoading(false);
      setStatusDropdownOpen(false);
    }
  };

  const handleAttachmentChange = (e) => {
    const file = e.target.files && e.target.files[0];
    setAttachment({ file: file || null });
  };

  const handleCommentChange = (e) => {
    const { name, value } = e.target;
    setComment((prev) => ({ ...prev, [name]: value }));
  };

  const addAttachment = async (e) => {
    e.preventDefault();
    setSavingAttachment(true);
    setError('');
    try {
      if (!attachment.file) {
        setSavingAttachment(false);
        setError('Please select a file to upload.');
        toast.error('Please select a file to upload.');
        return;
      }
      const formData = new FormData();
      formData.append('file', attachment.file);
      const res = await axiosInstance.post(
        `/tasks/${id}/attachments/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      setTask((prev) => ({ ...prev, attachments: [...(prev.attachments || []), res.data.data] }));
      setAttachment({ file: null });
      toast.success('Attachment added.');
    } catch (e2) {
      setError(e2.response?.data?.message || 'Failed to add attachment.');
      toast.error(e2.response?.data?.message || 'Failed to add attachment.');
    } finally {
      setSavingAttachment(false);
    }
  };

  const addComment = async (e) => {
    e.preventDefault();
    setSavingComment(true);
    setError('');
    try {
      const res = await axiosInstance.post(`/tasks/${id}/comments`, comment);
      setTask((prev) => ({ ...prev, comments: [...(prev.comments || []), res.data.data] }));
      setComment({ content: '' });
      toast.success('Comment added.');
    } catch (e2) {
      setError(e2.response?.data?.message || 'Failed to add comment.');
      toast.error(e2.response?.data?.message || 'Failed to add comment.');
    } finally {
      setSavingComment(false);
    }
  };

  const handleStatusActionClick = async (action) => {
    // Do NOT load approval data on button click
    // Approval data will be loaded only when user submits the form with a note
    setStatusModalAction(action);
    setStatusModalOpen(true);
  };

  const handleStatusUpdated = async (updated) => {
    if (updated && Array.isArray(updated.activities)) {
      setTask(updated);
    } else {
      // If we don't have full data with activities, re-fetch the entire task
      try {
        const res = await axiosInstance.get(`/tasks/${id}`);
        const fullTask = res.data?.data;
        if (fullTask) {
          setTask(fullTask);
        }
      } catch (e) {
        console.error('Failed to re-fetch task after status update', e);
        // Fallback to manual status update if fetch fails
        if (updated) {
          setTask(updated);
        } else {
          const action = statusModalAction;
          const nextStatus = STATUS_TRANSITION_MAP[action];
          if (nextStatus) {
            setTask((prev) => ({
              ...prev,
              status: nextStatus,
            }));
          }
        }
      }
    }
    // Load approval data ONLY after user submits an approval action with a note
    // This ensures /tasks/:id/approval is called only on actual submission (not on button click)
    if (statusModalAction === 'APPROVE' || statusModalAction === 'REJECT' || statusModalAction === 'SUBMIT_APPROVAL') {
      // Mark that current user has acted on approval
      if (statusModalAction === 'APPROVE' || statusModalAction === 'REJECT') {
        setCurrentUserHasActedOnApproval(true);
      }
      // Reset approval loaded state and force a fresh data fetch
      setApprovalLoaded(false);
      await loadApprovalData(true);
    }
  };

  const handleQuickAction = (key) => {
    setQuickActionKey(key);
    setQuickActionOpen(true);
  };

  const handleRemoveAttachment = async (attachmentId) => {
    if (!canDeleteAttachment) return;
    if (!window.confirm('Are you sure you want to remove this attachment?')) {
      return;
    }
    setError('');
    try {
      await axiosInstance.delete(`/tasks/${id}/attachments/${attachmentId}`);
      setTask((prev) => ({
        ...prev,
        attachments: (prev.attachments || []).filter(
          (att) => att.id !== attachmentId
        ),
      }));
      toast.success('Attachment removed.');
    } catch (e2) {
      const msg =
        e2.response?.data?.message || 'Failed to remove attachment.';
      setError(msg);
      toast.error(msg);
    }
  };

  useEffect(() => {
    if (!task || !task.project_id) {
      setRelatedTasks([]);
      return;
    }
    const fetchRelated = async () => {
      setRelatedLoading(true);
      try {
        const payload = {
          pagination: {
            page: 1,
            pageSize: 5,
            sortField: 'created_at',
            sortOrder: 'DESC',
          },
          filters: {
            project_id: task.project_id,
          },
        };
        const res = await axiosInstance.post('/tasks/search', payload);
        const list = Array.isArray(res.data?.data) ? res.data.data : [];
        const filtered = list.filter(
          (t) => t && t.id !== task.id && t.project_id === task.project_id
        );
        setRelatedTasks(filtered);
      } catch {
        setRelatedTasks([]);
      } finally {
        setRelatedLoading(false);
      }
    };
    fetchRelated();
  }, [task]);

  const dependencies = Array.isArray(task?.dependencies) ? task.dependencies : [];

  const allAttachments = useMemo(() => task?.attachments || [], [task?.attachments]);

  const initialAttachments = useMemo(() => {
    return allAttachments.filter((a) => a.is_initial === true);
  }, [allAttachments]);

  const activityAttachments = useMemo(() => {
    return allAttachments.filter((a) => a.is_initial !== true);
  }, [allAttachments]);

  const statusLabel = String(task?.status || '')
    .toUpperCase()
    .replace(/_/g, ' ');

  const inlineStatusOptions = useMemo(() => {
    const currentStatus = String(task?.status || '').toLowerCase();
    if (currentStatus === 'closed') {
      return [
        { value: 'closed', label: 'Closed' },
      ];
    }
    if (currentStatus === 'approved') {
      return [
        { value: 'approved', label: 'Approved' },
      ];
    }
    return [
      { value: 'open', label: 'Open' },
      { value: 'in_progress', label: 'In Progress' },
      { value: 'completed', label: 'Completed' },
    ];
  }, [task?.status]);

  const dueInfo = getDueInfo(task?.due_date, task?.status);

  const reassignmentActivities = useMemo(() => {
    if (!task || !Array.isArray(task.activities)) return [];
    return [...task.activities]
      .filter((a) => a && a.action === 'reassigned')
      .sort((a, b) => {
        const ad = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bd = b.created_at ? new Date(b.created_at).getTime() : 0;
        return ad - bd;
      });
  }, [task?.activities]);

  const progressActivities = useMemo(() => {
    if (!task || !Array.isArray(task.activities)) return [];

    const currentTaskProgress = Number(task.progress) || 0;

    // 1. Filter and identify progress-related activities
    const progressRelated = task.activities.filter((a) => {
      if (!a) return false;
      const actionStr = String(a.action || '').toLowerCase();
      const detailObj = a.details && typeof a.details === 'object' ? a.details : {};
      
      const isProgressAction = 
        actionStr === 'progress_updated' || 
        actionStr === 'progress_update' || 
        actionStr === 'update_progress' || 
        actionStr.includes('progress');

      const hasProgressValue = detailObj && detailObj.progress != null;
      const notesMatch = typeof detailObj.notes === 'string' && 
        detailObj.notes.toLowerCase().includes('checklist items completed');

      return isProgressAction || hasProgressValue || notesMatch;
    });

    // 2. Apply business rules:
    const uniqueProgressMap = new Map();
    const resets = [];

    progressRelated.forEach((a) => {
      const detailObj = a.details || {};
      const progValue = Number(detailObj.progress);
      const isReset = String(detailObj.notes || '').toLowerCase().includes('reset');

      if (isReset) {
        resets.push(a);
        return;
      }

      // Rule: Hide entries higher than current progress
      if (progValue > currentTaskProgress) return;

      // Rule: Keep only the latest entry for this progress level
      const existing = uniqueProgressMap.get(progValue);
      if (!existing || (Number(a.id) > Number(existing.id))) {
        uniqueProgressMap.set(progValue, a);
      }
    });

    const listToReturn = [...Array.from(uniqueProgressMap.values()), ...resets];

    // 3. Sort by ID descending (latest first)
    return listToReturn.sort((a, b) => {
      const aid = Number(a.id) || 0;
      const bid = Number(b.id) || 0;
      return bid - aid;
    });
  }, [task?.activities, task?.progress]);

  useEffect(() => {
    if (
      !task ||
      !user ||
      !Array.isArray(approvalState?.approvals_meta)
    ) {
      setCurrentUserHasActedOnApproval(false);
      return;
    }
    const myMeta = approvalState.approvals_meta.find(
      (m) => m && Number(m.user_id) === Number(user.id),
    );
    const decision = myMeta
      ? String(myMeta.decision || 'pending').toLowerCase()
      : 'pending';
    setCurrentUserHasActedOnApproval(
      decision === 'approved' || decision === 'rejected',
    );
  }, [task, user?.id, approvalState]);

  useEffect(() => {
    if (progressActivities.length > 0) {
      setShowProgressHistory(true);
    }
  }, [progressActivities.length]);

  const backDeptForLoading = user?.department || (task && task.department);

  if (!task && !loading) {
    return (
      <>
        <Navbar />
        <div className="view-wrapper task-view-wrapper">
          <PageHeader 
            title="View Task"
            showBackButton={true}
            onBackClick={handleBack}
          />
          <div className="view-content">
            <div className="status-message status-message--error">{error || 'Task not found'}</div>
          </div>
        </div>
      </>
    );
  }

  const { baseDescription, movItems: movFromDescription } = splitDescriptionAndMov(
    task?.description || '',
  );
  const rawDescription = String(baseDescription || '').trim();
  const movLinesFromField = Array.isArray(task?.mov_items)
    ? task.mov_items
        .map((t) => String(t || '').trim())
        .filter((t) => t.length > 0)
    : [];
  const movLines =
    movLinesFromField.length > 0
      ? movLinesFromField
      : movFromDescription && movFromDescription.length > 0
      ? movFromDescription
      : [];
  const shouldTruncateDescription = rawDescription.length > 200;
  const descriptionMidpoint = shouldTruncateDescription
    ? Math.floor(rawDescription.length / 2)
    : rawDescription.length;
  const descriptionFirstHalf = rawDescription.slice(0, descriptionMidpoint);
  const descriptionSecondHalf = rawDescription.slice(descriptionMidpoint);

  return (
    <>
      <Navbar />
      <Loader loading={loading} />
      <div className="view-wrapper task-view-wrapper">
        <PageHeader 
          title="Task Details"
          showBackButton={true}
          onBackClick={handleBack}
          showEdit={!loading && task && taskPerms.canUpdate === true}
          editPath={!loading && task ? `${taskRouteBase}/update/${task.id}` : ''}
        />
        {!loading && task && (
          <div className="view-content2">
            {error && <div className="status-message status-message--error">{error}</div>}

            <div className="task-receipt-page">
            <div className="receipt-container">
              <div className="receipt-header">
                <div className="receipt-title">
                  <div className="receipt-logo">📋</div>
                  <div>
                    <h1>{task.title || 'Task Title'}</h1>
                  </div>
                </div>
                <div className="task-id">{formatTaskId(task)}</div>
              </div>
              <div className="task-view-status-actions-row">
                <div className="task-view-status-banner-inline">
                  <div className="task-view-status-banner-main">
                    <strong>Task Status:</strong>
                    {canChangeStatusInline ? (
                      <div className="status-dropdown">
                        <button
                          type="button"
                          className="status-dropdown-toggle"
                          onClick={() => setStatusDropdownOpen((prev) => !prev)}
                          disabled={statusActionLoading}
                        >
                          <span className="status-dropdown-label">{statusLabel}</span>
                          <span className="status-dropdown-arrow">▾</span>
                        </button>
                        {statusDropdownOpen && (
                          <div className="status-dropdown-menu">
                            {inlineStatusOptions.map((opt) => {
                              const isActive =
                                String(task.status || '').toLowerCase() === opt.value;
                              return (
                                <button
                                  key={opt.value}
                                  type="button"
                                  className={`status-dropdown-item${
                                    isActive ? ' status-dropdown-item--active' : ''
                                  }`}
                                  onClick={() => handleInlineStatusChange(opt.value)}
                                  disabled={statusActionLoading}
                                >
                                  <span
                                    className={`status-dropdown-check${
                                      isActive ? ' status-dropdown-check--checked' : ''
                                    }`}
                                  />
                                  <span className="status-dropdown-item-label">
                                    {opt.label}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="receipt-status-badge">{statusLabel}</span>
                    )}
                  </div>
                </div>

                <TaskActionBar
                  taskId={task.id}
                  currentStatus={task.status}
                  permissions={taskPerms}
                  userDepartment={user?.department}
                  taskDepartment={task.department}
                  workflowType={task.workflow_type}
                  userRole={user?.role}
                  isAssignee={isCurrentUserAssignee}
                  currentUserId={user?.id}
                  createdByUserId={task.created_by_id}
                  reportedById={task.reported_by_id}
                  approvalRequiredUserIds={task.approval_required_user_ids}
                  approvalsMeta={approvalState?.approvals_meta}
                  currentUserHasActedOnApproval={currentUserHasActedOnApproval}
                  approvalLoading={approvalLoading}
                  onStatusAction={handleStatusActionClick}
                  onQuickAction={handleQuickAction}
                  disabled={statusActionLoading}
                  align="top"
                />
              </div>

              {renderRecurrenceInfo()}

              <div className="receipt-body">
                {isTaskOverdueAfterToday() ? (
                  renderReminderBanner(
                    'Task is overdue',
                    primaryAssigneeName
                      ? `Hi ${primaryAssigneeName}, this task is now overdue. Please review and complete it as soon as possible.`
                      : 'This task is now overdue. Please review and complete it as soon as possible.'
                  )
                ) : isTaskOverdueToday() ? (
                  renderReminderBanner(
                    'Overdue Today',
                    primaryAssigneeName
                      ? `Hi ${primaryAssigneeName}, This task will become overdue today at 12:00 PM. Please review and complete it as soon as possible.`
                      : 'This task will become overdue today at 12:00 PM. Please review and complete it as soon as possible.',
                    true
                  )
                ) : isTaskDueTodayBeforeNoon() ? (
                  renderReminderBanner(
                    'Due Today',
                    primaryAssigneeName
                      ? `Hi ${primaryAssigneeName}, this task will become overdue today at 12:00 PM. Please review and complete it as soon as possible.`
                      : 'This task will become overdue today at 12:00 PM. Please review and complete it as soon as possible.',
                    true
                  )
                ) : null}

                <div className="view-section">
                  <h3 className="view-section-title">
                    <span>📝</span> Description
                  </h3>
                  <div className="view-grid">
                    <div className="view-item task-description-item">
                      {rawDescription ? (
                        <span className="view-item-value task-description-text">
                          {shouldTruncateDescription ? (
                            showFullDescription ? (
                              <>
                                {rawDescription}{' '}
                                <button
                                  type="button"
                                  className="task-description-read-more"
                                  onClick={() => setShowFullDescription(false)}
                                >
                                  View Less
                                </button>
                              </>
                            ) : (
                              <>
                                {descriptionFirstHalf}
                                {descriptionSecondHalf && '... '}
                                {descriptionSecondHalf && (
                                  <button
                                    type="button"
                                    className="task-description-read-more"
                                    onClick={() => setShowFullDescription(true)}
                                  >
                                    Read More
                                  </button>
                                )}
                              </>
                            )
                          ) : (
                            rawDescription
                          )}
                        </span>
                      ) : (
                        <span className="view-item-value task-description-text">-</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="view-section">
                  <h3 className="view-section-title">
                    <span>✅</span> {isApproverView
                      ? 'Progress & Means of Verification'
                      : 'Check the box to update progress'}
                  </h3>
                    <div className="view-grid task-progress-layout">
                    <div className="view-item task-progress-item">
                      {movLines.length > 0 ? (
                        <ProgressUpdate
                          taskId={task.id}
                          currentProgress={task.progress || 0}
                          lastProgressNotes={task.last_progress_notes}
                          movLines={movLines}
                          canEdit={canEditMovChecklist}
                          currentUser={user}
                          progressActivities={task.activities || []}
                          onUpdate={(progress, notes, updatedTask) => {
                            if (updatedTask) {
                              setTask(updatedTask);
                            } else {
                              setTask((prev) => ({
                                ...prev,
                                progress,
                                last_progress_notes: notes,
                              }));
                            }
                            setShowProgressHistory(true);
                          }}
                        />
                      ) : (
                        <div className="task-progress-empty">
                          No Means of Verification (MOV) checklist items have been defined for this
                          task.
                        </div>
                      )}
                    </div>
                    {(showProgressHistory || progressActivities.length > 0) && (
                      <div className="view-item">
                        <div className="task-progress-history">
                          <div className="task-progress-history-title">
                            🔄 Progress history
                          </div>
                          {progressActivities.length > 0 ? (
                            <ul className="task-progress-history-list">
                              {progressActivities.map((a) => {
                                const when =
                                  a && a.created_at
                                    ? formatDateOnly(a.created_at)
                                    : '';
                                const details =
                                  a && a.details && typeof a.details === 'object'
                                    ? a.details
                                    : {};
                                const value =
                                  details && details.progress != null
                                    ? `${details.progress}%`
                                    : '';
                                const notes =
                                  details && typeof details.notes === 'string'
                                    ? details.notes
                                        .replace(/\s*\[indices:[\d,]+\]/, '')
                                        .replace(/\s*\[ownership:[^\]]+\]/, '')
                                        .trim()
                                    : '';
                                const performer =
                                  a && a.performed_by ? a.performed_by : null;
                                const author =
                                  (performer &&
                                    (performer.name ||
                                      performer.full_name ||
                                      performer.username ||
                                      performer.email)) ||
                                  'System';
                                return (
                                  <li
                                    key={a.id}
                                    className="task-progress-history-item"
                                  >
                                    <div className="task-progress-history-header">
                                      <span className="task-progress-history-author">
                                        {author}
                                      </span>
                                      <span className="task-progress-history-date">
                                        {when}
                                      </span>
                                    </div>
                                    <div className="task-progress-history-body">
                                      {value && (
                                        <span className="task-progress-history-progress">
                                          {value}
                                        </span>
                                      )}
                                      {notes && (
                                        <span className="task-progress-history-notes">
                                          {notes}
                                        </span>
                                      )}
                                    </div>
                                  </li>
                                );
                              })}
                            </ul>
                          ) : (
                            <div className="task-progress-history-empty">
                              No progress history yet.
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {initialAttachments.length > 0 && (
                  <div className="view-section">
                    <h3 className="view-section-title">
                      <span>📎</span> Task Attachments (Initial)
                    </h3>
                    <div className="view-grid">
                      <div className="view-item task-attachments-item">
                        <ul className="attachments-list">
                          {initialAttachments.map((a) => {
                            const rawType = a.file_type || '';
                            const shortType = rawType.includes('/')
                              ? rawType.split('/')[1]
                              : rawType;
                            const shortUpper = shortType
                              ? shortType.toUpperCase()
                              : 'FILE';
                            return (
                              <li key={a.id} className="attachments-item">
                                <div className="attachment-main">
                                  <div className="attachment-header">
                                    <div className="attachment-icon">
                                      {shortUpper}
                                    </div>
                                    <div className="attachment-text">
                                      <div className="attachment-name">
                                        {a.file_name}
                                      </div>
                                      {a.description && (
                                        <div className="attachment-description" style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
                                          {a.description}
                                        </div>
                                      )}
                                      <div className="attachment-type">
                                        {rawType}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="attachment-actions">
                                    <a
                                      href={getAttachmentHref(a.file_url)}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="attachment-open-button"
                                    >
                                      View
                                    </a>
                                    {canDeleteAttachment && (
                                      <button
                                        type="button"
                                        className="attachment-remove-button"
                                        onClick={() => handleRemoveAttachment(a.id)}
                                      >
                                        ×
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                <div className="view-layout">
                  <div className="view-layout-main">
                    <div
                      className={`view-section${
                        isApproverView ? ' view-section--approver-secondary' : ''
                      }`}
                    >
                      <h3 className="view-section-title">
                        <span>ℹ️</span> Task Information
                      </h3>
                      <div className="view-grid view-grid--info">
                        <div className="view-item">
                          <span className="view-item-label">Status</span>
                          <span className="view-item-value">{getStatusBadge(task.status)}</span>
                        </div> 
                        <div className="view-item">
                          <span className="view-item-label">Priority</span>
                          <span className="view-item-value">
                            <span className={`priority-badge priority-badge--${String(task.priority || '').toLowerCase() || 'low'}`}>
                              {capitalize(task.priority)}
                            </span>
                          </span>
                        </div>
                        <div className="view-item">
                          <span className="view-item-label">Task Type</span>
                          <span className="view-item-value">{taskTypeLabel}</span>
                        </div>
                        <div className="view-item">
                          <span className="view-item-label">Workflow</span>
                          <span className="view-item-value">{capitalize(task.workflow_type)}</span>
                        </div>
                        <div className="view-item">
                          <span className="view-item-label">Created By</span>
                          <span className="view-item-value">{getUserDisplayName(task.created_by)}</span>
                        </div>
                        <div className="view-item">
                          <span className="view-item-label">Project/Program</span>
                          <span className="view-item-value">{task.project_name || '-'}</span>
                        </div>
                        {isApprovalWorkflow &&
                          ['approved', 'rejected'].includes(String(task?.status || '').toLowerCase()) &&
                          task?.approved_by && (
                            <div className="view-item">
                              <span className="view-item-label">
                                {String(task?.status || '').toLowerCase() === 'rejected' ? 'Rejected By' : 'Approved By'}
                              </span>
                              <span className="view-item-value">{getUserDisplayName(task.approved_by)}</span>
                            </div>
                          )}
                      </div>
                    </div>

                    <div
                      className={`view-section${
                        isApproverView ? ' view-section--approver-secondary' : ''
                      }`}
                    >
                      <h3 className="view-section-title">
                        <span>📅</span> Timeline
                      </h3>
                      <div className="view-grid view-grid--info">
                        <div className="view-item">
                          <span className="view-item-label">Created Date</span>
                          <span className="view-item-value">{formatDateOnly(task.created_at)}</span>
                        </div>
                        <div className="view-item">
                          <span className="view-item-label">Start Date</span>
                          <span className="view-item-value">{formatDateOnly(task.start_date)}</span>
                        </div>
                        <div className="view-item">
                          <span className="view-item-label">Due Date</span>
                          <span className="view-item-value">
                            {formatDateOnly(task.due_date)}
                            {dueInfo && (
                              <span
                                className={`task-due-badge task-due-badge--${dueInfo.variant}`}
                              >
                                {dueInfo.label}
                              </span>
                            )}
                          </span>
                        </div>
                        {showCompletedDate && (
                          <div className="view-item">
                            <span className="view-item-label">Completed Date</span>
                            <span className="view-item-value">
                              {formatDateOnly(task.completed_date)}
                            </span>
                          </div>
                        )}
                        {isRecurringTask && (
                          <>
                            <div className="view-item">
                              <span className="view-item-label">Recurrence</span>
                              <span className="view-item-value">
                                {task.recurrence_rule
                                  ? task.recurrence_rule.includes(' days')
                                    ? `Every ${task.recurrence_rule}`
                                    : task.recurrence_rule[0].toUpperCase() + task.recurrence_rule.slice(1)
                                  : '-'}
                              </span>
                            </div>
                            <div className="view-item">
                              <span className="view-item-label">Next Recurrence</span>
                              <span className="view-item-value">{formatDateOnly(task.recurrence_next_date)}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {!isApproverView && dependencies.length > 0 && (
                      <div className="view-section">
                        <h3 className="view-section-title">
                          <span>🔗</span> Dependencies
                        </h3>
                        <div className="view-grid">
                          <div className="view-item">
                            <ul className="dependencies-list">
                              {dependencies.map((dep) => {
                                const key = dep.id || dep.task_id || dep;
                                const title = dep.title || dep.name || `Task #${key}`;
                                const depStatusLabel = dep.status ? capitalize(dep.status) : '';
                                return (
                                  <li key={key} className="dependencies-item">
                                    <span className="dependencies-title">{title}</span>
                                    {depStatusLabel && (
                                      <span className="dependencies-status">
                                        {depStatusLabel}
                                      </span>
                                    )}
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="view-section">
                      <h3 className="view-section-title">
                        <span>👥</span> Team & Assignment
                        </h3>
                      <div className="team-assignment">
                        <div className="team-assignment-main">
                          <span className="team-assignment-label">Assigned:</span>
                          {assignedUsers && assignedUsers.length > 0 ? (
                            <div className="team-assignment-pill-list">
                              {assignedUsers.map((u) => {
                                const meta = assignedUsersMeta.find(
                                  (m) => m?.user_id === u.id,
                                );
                                const deptLabel = meta?.department
                                  ? meta.department
                                      .split('_')
                                      .map((w) =>
                                        w ? w[0].toUpperCase() + w.slice(1) : '',
                                      )
                                      .join(' ')
                                  : '';
                                const nameLabel = getUserDisplayName(u);
                                const fullLabel = deptLabel
                                  ? `${nameLabel} - ${deptLabel}`
                                  : nameLabel;
                                const initials = (() => {
                                  const full = nameLabel || '';
                                  const parts = full.split(' ').filter(Boolean);
                                  if (parts.length === 0) return '';
                                  if (parts.length === 1) {
                                    return parts[0][0].toUpperCase();
                                  }
                                  return `${parts[0][0]}${
                                    parts[parts.length - 1][0]
                                  }`.toUpperCase();
                                })();
                                return (
                                  <div
                                    key={u.id}
                                    className="team-assignment-pill-row"
                                  >
                                    <div className="team-assignment-avatar">
                                      <span className="team-assignment-avatar-initial">
                                        {initials}
                                      </span>
                                    </div>
                                    <span className="team-assignment-pill">
                                      {fullLabel}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <span className="person-badge">-</span>
                          )}
                        </div>
                        <div className="team-assignment-meta">
                          <div className="collaboration-summary">
                            <span className="collaboration-count">
                              {assignedUsers.length}
                            </span>
                            <span className="collaboration-label">
                              {assignedUsers.length === 1
                                ? 'Person assigned'
                                : 'People assigned'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    {hasApprovalPanel && (
                      <div
                        className={`view-section${
                          isApproverView ? ' view-section--approver-primary' : ''
                        }`}
                      >
                        <h3 className="view-section-title">
                          <span>🛡️</span> Approval
                        </h3>
                        <div className="view-grid">
                          <div className="view-item">
                            <span className="view-item-label">Approvers</span>
                            <span className="view-item-value">
                              <ul className="approval-list">
                                {approvalRows.map((row) => (
                                  <li key={row.id} className="approval-list-item">
                                    <span className="approval-list-name">
                                      {row.name}
                                    </span>
                                    <span
                                      className={`approval-status-badge approval-status-badge--${row.decision}`}
                                    >
                                      {row.decisionLabel}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                    {!isApproverView && reassignmentActivities.length > 0 && (
                      <div className="view-section">
                        <h3 className="view-section-title">
                          <span>🔄</span> Reassignment History
                        </h3>
                        <div className="reassignment-list">
                          {reassignmentActivities.map((act, index) => {
                            const rawDetails = act.details;
                            let fromItems = [];
                            let toItems = [];

                            if (Array.isArray(rawDetails)) {
                              fromItems = rawDetails.filter((d) => d && d.type === 'from');
                              toItems = rawDetails.filter((d) => d && d.type === 'to');
                            } else if (rawDetails && typeof rawDetails === 'object') {
                              const fromIds = Array.isArray(rawDetails.from_assigned_user_ids)
                                ? rawDetails.from_assigned_user_ids
                                : [];
                              const fromMeta = Array.isArray(rawDetails.from_assigned_users_meta)
                                ? rawDetails.from_assigned_users_meta
                                : [];
                              const toIds = Array.isArray(rawDetails.to_assigned_user_ids)
                                ? rawDetails.to_assigned_user_ids
                                : [];
                              const toMeta = Array.isArray(rawDetails.to_assigned_users_meta)
                                ? rawDetails.to_assigned_users_meta
                                : [];

                              fromItems = fromIds.map((fromId) => {
                                const meta = fromMeta.find((m) => m && Number(m.user_id) === Number(fromId));
                                return {
                                  type: 'from',
                                  user_id: fromId,
                                  department: meta?.department || null,
                                };
                              });

                              toItems = toIds.map((toId) => {
                                const meta = toMeta.find((m) => m && Number(m.user_id) === Number(toId));
                                return {
                                  type: 'to',
                                  user_id: toId,
                                  department: meta?.department || null,
                                };
                              });
                            }

                            const formatDept = (dept) => {
                              if (!dept) return '';
                              return String(dept)
                                .split('_')
                                .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ''))
                                .join(' ');
                            };

                            const fromLabel =
                              fromItems.length > 0
                                ? fromItems
                                    .map((i) => {
                                      const deptLabel = formatDept(i.department);
                                      const nameLabel = getUserNameFromId(i.user_id);
                                      return `${nameLabel}${deptLabel ? ` • ${deptLabel}` : ''}`;
                                    })
                                    .join(', ')
                                : '-';

                            const toLabel =
                              toItems.length > 0
                                ? toItems
                                    .map((i) => {
                                      const deptLabel = formatDept(i.department);
                                      const nameLabel = getUserNameFromId(i.user_id);
                                      return `${nameLabel}${deptLabel ? ` • ${deptLabel}` : ''}`;
                                    })
                                    .join(', ')
                                : '-';

                            const performer = act && act.performed_by ? act.performed_by : null;
                            const byLabel =
                              (performer &&
                                (performer.name ||
                                  performer.full_name ||
                                  performer.username ||
                                  performer.email)) ||
                              '-';

                            const when = act.created_at ? formatDateOnly(act.created_at) : '-';

                            return (
                              <div key={act.id || index} className="reassignment-row">
                                <div className="reassignment-timestamp">
                                  {when}
                                </div>
                                <div className="reassignment-details">
                                  <div className="reassignment-line">
                                    <span className="reassignment-label">From:</span>
                                    <span className="reassignment-value">{fromLabel}</span>
                                  </div>
                                  <div className="reassignment-line">
                                    <span className="reassignment-label">To:</span>
                                    <span className="reassignment-value">{toLabel}</span>
                                  </div>
                                  <div className="reassignment-line">
                                    <span className="reassignment-label">By:</span>
                                    <span className="reassignment-value">{byLabel}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="view-layout-side">
                    {!isApproverView && (
                      <TimeTracker taskId={task.id} taskStatus={task.status} />
                    )}

                    <div className="task-notes-panel">
                      {/* <div
                        className={`view-section${
                          isApproverView ? ' view-section--approver-primary' : ''
                        }`}
                      >
                         <div className="activity-attachments-section">
                          <h3 className="view-section-title">
                            <span>📂</span> Activity Attachments
                          </h3>
                          <div className="view-grid">
                            <div className="view-item task-attachments-item">
                              <ul className="attachments-list">
                                {activityAttachments.map((a) => {
                                  const rawType = a.file_type || '';
                                  const shortType = rawType.includes('/')
                                    ? rawType.split('/')[1]
                                    : rawType;
                                  const shortUpper = shortType
                                    ? shortType.toUpperCase()
                                    : 'FILE';
                                  return (
                                    <li key={a.id} className="attachments-item">
                                      <div className="attachment-main">
                                        <div className="attachment-header">
                                          <div className="attachment-icon">
                                            {shortUpper}
                                          </div>
                                          <div className="attachment-text">
                                            <div className="attachment-name">
                                              {a.file_name}
                                            </div>
                                            {a.description && (
                                              <div className="attachment-description" style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
                                                {a.description}
                                              </div>
                                            )}
                                            <div className="attachment-type">
                                              {rawType}
                                            </div>
                                          </div>
                                        </div>
                                        <div className="attachment-actions">
                                          <a
                                            href={getAttachmentHref(a.file_url)}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="attachment-open-button"
                                          >
                                            View
                                          </a>
                                          {canDeleteAttachment && (
                                            <button
                                              type="button"
                                              className="attachment-remove-button"
                                              onClick={() => handleRemoveAttachment(a.id)}
                                            >
                                              ×
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    </li>
                                  );
                                })}
                                {activityAttachments.length === 0 && <li>No activity attachments</li>}
                              </ul>
                            </div>
                          </div>
                        </div> 
                        {!isApproverView && (
                          <form onSubmit={addAttachment} className="task-attachments-form">
                            <div className="task-attachments-input-container">
                              <div className="form-group">
                                 <label className="form-label">File</label>
                                <input
                                  type="file"
                                  className="form-input task-file-input"
                                  onChange={handleAttachmentChange}
                                  disabled={!canInteractWithNotes || savingAttachment}
                                />
                              </div>
                            </div>
                            <div className="form-actions task-attachments-actions">
                              <PrimaryButton
                                type="submit"
                                disabled={savingAttachment || !canInteractWithNotes}
                                loading={savingAttachment}
                                loadingText="Adding..."
                                className="task-attachment-upload-btn"
                              >
                                Upload Attachment
                              </PrimaryButton>
                            </div>
                          </form>
                        )} 
                      </div> */}

                      <div
                        className={`view-section task-comments-panel${
                          isApproverView ? ' view-section--approver-secondary' : ''
                        }`}
                      >
                        <h3 className="view-section-title">
                          <span>💬</span> {isApproverView ? 'Comments & Activity' : 'Comments & Activity'}
                        </h3>
                        <div className="view-grid">
                          <div className="view-item task-comments-item">
                            <ul className="comments-list">
                              {(task.comments || []).map((c) => {
                                const hasAuthor = !!c.author;
                                const authorName = hasAuthor ? getUserDisplayName(c.author) : 'System';
                                const initial = authorName && authorName !== 'System' ? authorName.charAt(0).toUpperCase() : 'S';
                                const commentTypeClass = hasAuthor ? 'comment-item--user' : 'comment-item--system';
                                return (
                                  <li key={c.id} className={`comment-item ${commentTypeClass}`}>
                                    <div className="comment-avatar">
                                      <span className="comment-avatar-initial">
                                        {initial}
                                      </span>
                                    </div>
                                    <div className="comment-body">
                                      <div className="comment-header">
                                        <span className="comment-author">
                                          {authorName}
                                        </span>
                                        <span className="comment-date">
                                          {formatDateOnly(c.created_at)}
                                        </span>
                                      </div>
                                      <div className="comment-content">
                                        {c.content}
                                      </div>
                                    </div>
                                  </li>
                                );
                              })}
                              {(!task.comments || task.comments.length === 0) && <li>No comments</li>}
                            </ul>
                          </div>
                        </div>
                        {!isApproverView && (
                          <form onSubmit={addComment} className="task-comments-form">
                            <FormTextarea
                              placeholder="Add Comment"
                              name="content"
                              value={comment.content}
                              onChange={handleCommentChange}
                              disabled={!canInteractWithNotes}
                            />
                            <div className="form-actions">
                              <PrimaryButton
                                type="submit"
                                disabled={savingComment || !canInteractWithNotes}
                                loading={savingComment}
                                loadingText="Posting...."
                              >
                                Post Comment
                              </PrimaryButton>
                            </div>
                          </form>
                        )}
                      </div>

                      {!isApproverView && (relatedLoading || relatedTasks.length > 0) && (
                        <div className="view-section">
                          <h3 className="view-section-title">
                            <span>🔗</span> Related tasks
                          </h3>
                          <div className="view-grid">
                            <div className="view-item">
                              {relatedLoading && (
                                <div className="status-message">
                                  Loading related tasks...
                                </div>
                              )}
                              {!relatedLoading && relatedTasks.length > 0 && (
                                <ul className="related-tasks-list">
                                  {relatedTasks.map((t) => (
                                    <li
                                      key={t.id}
                                      className="related-task-item"
                                      onClick={() =>
                                        navigate(`${taskRouteBase}/view/${t.id}`)
                                      }
                                    >
                                      <div className="related-task-main">
                                        <div className="related-task-title">
                                          {t.title}
                                        </div>
                                        <div className="related-task-meta">
                                          <span className="related-task-status">
                                            {getStatusBadge(t.status)}
                                          </span>
                                          <span className="related-task-dept">
                                            {capitalize(t.department)}
                                          </span>
                                        </div>
                                      </div>
                                    </li>
                                  ))}
                                </ul>
                              )}
                              {!relatedLoading && relatedTasks.length === 0 && (
                                <div className="status-message">
                                  No related tasks
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="receipt-footer">
                  <div>MTJ Foundation • Task Management System</div>
                  <div className="metadata">
                    <span>Task ID: {formatTaskId(task)}</span>
                    <span>
                      Department: {Array.isArray(task.assigned_users_meta) && task.assigned_users_meta.length > 0
                        ? [...new Set(task.assigned_users_meta.map(m => m ? m.department : null).filter(Boolean))]
                            .map(d => capitalize(d))
                            .join(', ')
                        : capitalize(task.department)}
                    </span>
                    <span>
                      Last updated:{' '}
                      {formatDate(task.updated_at || task.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <StatusUpdateModal
            isOpen={statusModalOpen}
            taskId={task.id}
            action={statusModalAction}
            onClose={() => {
              setStatusModalOpen(false);
              setStatusModalAction(null);
            }}
            onUpdated={(updated) => {
              if (
                statusModalAction === 'APPROVE' ||
                statusModalAction === 'REJECT'
              ) {
                setCurrentUserHasActedOnApproval(true);
              }
              handleStatusUpdated(updated);
              setStatusActionLoading(false);
            }}
          />

          <QuickActionModal
            isOpen={quickActionOpen}
            taskId={task.id}
            actionKey={quickActionKey}
            userDepartment={user?.department}
            taskRouteBase={taskRouteBase}
            onClose={() => {
              setQuickActionOpen(false);
              setQuickActionKey(null);
            }}
            onCompleted={(actionKey, updatedTask) => {
              if (updatedTask) {
                setTask(updatedTask);
              }
            }}
          />
        </div>
        )}
      </div>
    </>
  );
};

export default ViewTask;
