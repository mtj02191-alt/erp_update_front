import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiAlignJustify, FiClipboard, FiFlag, FiGitBranch, FiPlus, FiTrash2 } from 'react-icons/fi';
import axiosInstance from '../../../../utils/axios';
import { toast } from 'react-toastify';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import FormInput from '../../../common/FormInput';
import FormTextarea from '../../../common/FormTextarea';
import { useAuth } from '../../../../context/AuthContext';
import { getTaskPermissions } from '../../../../utils/permissions';
import { tasksBasePath } from '../../../../utils/admin';
import { splitDescriptionAndMov } from '../../../../utils/movEncoding';
import SearchableMultiSelect from '../../../common/SearchableMultiSelect';
import TaskPendingAttachments, {
  uploadPendingTaskAttachments,
} from '../shared/TaskPendingAttachments';
import MovAssignmentPicker from '../shared/MovAssignmentPicker';
import '../../../../styles/variables.css';
import './index.css';

const TaskFormSelect = ({
  name,
  label,
  value,
  options,
  onChange,
  error,
  required = false,
  disabled = false,
  showDefaultOption = false,
  defaultOptionText = null,
  icon: Icon,
  iconClassName = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const handleSelect = (optionValue) => {
    onChange({ target: { name, value: optionValue } });
    setIsOpen(false);
  };

  const getDisplayLabel = () => {
    const selectedOption = options.find(opt =>
      (typeof opt === 'string' ? opt : opt.value) === value
    );
    if (selectedOption) {
      return typeof selectedOption === 'string' ? selectedOption : selectedOption.label;
    }
    return defaultOptionText || `Select ${label}`;
  };

  return (
    <div className="form-group" ref={containerRef}>
      <label className="form-label">
        {label}
        {required && <span className="required-mark">*</span>}
      </label>
      <div className="task-custom-select-container">
        <div
          className={`task-custom-select-display ${isOpen ? 'is-open' : ''} ${error ? 'has-error' : ''} ${disabled ? 'is-disabled' : ''}`}
          onClick={handleToggle}
        >
          <span className="task-custom-select-leading">
            {Icon && (
              <Icon className={`task-custom-select-field-icon ${iconClassName}`} />
            )}
            <span className={`task-custom-select-value ${!value ? 'is-placeholder' : ''}`}>
              {getDisplayLabel()}
            </span>
          </span>
          <span className="task-custom-select-arrow">▼</span>
        </div>

        {isOpen && (
          <div className="task-custom-select-dropdown">
            {showDefaultOption && (
              <button
                type="button"
                className={`task-custom-select-option ${!value ? 'is-selected' : ''}`}
                onClick={() => handleSelect('')}
              >
                {defaultOptionText || `Select ${label}`}
              </button>
            )}
            {options.map((option) => {
              const optValue = typeof option === 'string' ? option : option.value;
              const optLabel = typeof option === 'string' ? option : option.label;
              return (
                <button
                  key={optValue}
                  type="button"
                  className={`task-custom-select-option ${value === optValue ? 'is-selected' : ''}`}
                  onClick={() => handleSelect(optValue)}
                >
                  {optLabel}
                </button>
              );
            })}
          </div>
        )}
      </div>
      {error && <span className="form-error">{error}</span>}
    </div>
  );
};

const ProjectProgramSelect = ({ value, onChange, error }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectionStep, setSelectionStep] = useState('category');
  const [projectCategory, setProjectCategory] = useState('');
  const containerRef = useRef(null);

  const projects = [
    'MTJ Foundation',
    'Al-Hassanain College',
    'Al-Hassanain School',
    'Al-Hassanain Mudrasa',
    'Aas Lab',
    'Aas Clinics'
  ];

  const programs = [
    'General',
    'Health',
    'Education',
    'Clean Water',
    'Apna Ghar',
    'Disaster Relief',
    'KASB Skill Development',
    'Seeds of Change',
    'Qurbani Barai Mustehqeen',
    'Aaslab',
    'Community Service'
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!value) {
      setSelectionStep('category');
      setProjectCategory('');
    } else if (selectionStep === 'category') {
      if (projects.includes(value)) {
        setProjectCategory('Projects');
        setSelectionStep('item');
      } else if (programs.includes(value)) {
        setProjectCategory('Programs');
        setSelectionStep('item');
      }
    }
  }, [value]);

  const handleToggle = () => setIsOpen(!isOpen);

  const handleCategorySelect = (category) => {
    setProjectCategory(category);
    setSelectionStep('item');
    setIsOpen(true);
  };

  const handleItemSelect = (item) => {
    onChange({ target: { name: 'project_name', value: item } });
    setIsOpen(false);
  };

  const handleBack = (e) => {
    e.stopPropagation();
    setSelectionStep('category');
    setProjectCategory('');
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange({ target: { name: 'project_name', value: '' } });
    setSelectionStep('category');
    setProjectCategory('');
    setIsOpen(false);
  };

  const getDisplayValue = () => {
    if (value) {
      const isProject = projects.includes(value);
      return `${isProject ? '📁' : '📋'} ${value}`;
    }
    return '';
  };

  return (
    <div className="form-group" ref={containerRef}>
      <label className="form-label">
        Project/Program <span className="required-mark">*</span>
      </label>
      <div className="task-custom-select-container">
        <div
          className={`task-custom-select-display ${isOpen ? 'is-open' : ''} ${error ? 'has-error' : ''}`}
          onClick={handleToggle}
        >
          {value ? (
            <span className="task-custom-select-value">{getDisplayValue()}</span>
          ) : (
            <span className="task-custom-select-placeholder">Select Project or Program</span>
          )}
          <span className="task-custom-select-arrow">▼</span>
        </div>

        {value && (
          <button type="button" className="task-custom-select-clear-btn" onClick={handleClear}>❌</button>
        )}

        {isOpen && (
          <div className="task-custom-select-dropdown">
            <div className="task-custom-select-dropdown-header">
              <span className="task-custom-select-dropdown-title">
                {selectionStep === 'category' ? 'Select Category' : projectCategory}
              </span>
              {selectionStep === 'item' && (
                <button type="button" className="task-custom-select-back-link" onClick={handleBack}>
                  ◀ Back
                </button>
              )}
            </div>

            <div className="task-custom-select-options-list">
              {selectionStep === 'category' ? (
                <>
                  <button type="button" className="task-custom-select-option" onClick={() => handleCategorySelect('Projects')}>
                    <span><span className="task-custom-select-option-icon">📁</span> Projects</span>
                    <span className="task-custom-select-option-arrow">›</span>
                  </button>
                  <button type="button" className="task-custom-select-option" onClick={() => handleCategorySelect('Programs')}>
                    <span><span className="task-custom-select-option-icon">📋</span> Programs</span>
                    <span className="task-custom-select-option-arrow">›</span>
                  </button>
                </>
              ) : (
                (projectCategory === 'Projects' ? projects : programs).map(item => (
                  <button
                    key={item}
                    type="button"
                    className={`task-custom-select-option ${value === item ? 'is-selected' : ''}`}
                    onClick={() => handleItemSelect(item)}
                  >
                    {item}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
      {error && <span className="form-error">{error}</span>}
    </div>
  );
};

const UpdateTask = ({
  taskId: taskIdProp,
  isModal = false,
  onClose,
  onSaved,
} = {}) => {
  const navigate = useNavigate();
  const { id: routeId } = useParams();
  const id = taskIdProp ?? routeId;
  const { user, permissions } = useAuth();
  const [form, setForm] = useState({
    title: '',
    description: '',
    department: '',
    priority: '',
    status: '',
    workflow_type: '',
    task_type: '',
    recurrence_frequency: '',
    custom_recurrence_days: '',
    start_date: '',
    due_date: '',
    project_id: '',
    project_name: '',
    recurrence_rule: '',
    recurrence_next_date: '',
    recurrence_end_type: 'never',
    recurrence_end_date: '',
    recurrence_end_occurrences: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [originalStatus, setOriginalStatus] = useState('');
  const [originalWorkflowType, setOriginalWorkflowType] = useState('');
  const [assignedUsers, setAssignedUsers] = useState([]);
  const [assignedUserDepartments, setAssignedUserDepartments] = useState({});
  const [reportedByUsers, setReportedByUsers] = useState([]);
  const [approverUsers, setApproverUsers] = useState([]);
  const [movItems, setMovItems] = useState([{ text: '', user_id: null }]);
  const [pendingAttachments, setPendingAttachments] = useState([]);
  const [existingAttachments, setExistingAttachments] = useState([]);
  const [removingAttachmentId, setRemovingAttachmentId] = useState(null);
  const attachmentsRef = useRef(null);

  const formatDepartment = (dept) => {
    if (!dept) return '';
    return String(dept)
      .split('_')
      .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ''))
      .join(' ');
  };

  const taskRouteBase = useMemo(() => tasksBasePath(), []);

  const handleBack = useCallback(() => {
    if (isModal) {
      onClose?.();
      return;
    }
    navigate(`${taskRouteBase}/list`); // Navigate to tasks list at /tasks/list instead of previous page
  }, [isModal, navigate, onClose, taskRouteBase]);

  const taskPerms = useMemo(
    () => getTaskPermissions(permissions || {}, user?.department, user?.role),
    [permissions, user?.department, user?.role],
  );
  const multiSelectParams = useMemo(() => ({ active: true }), []);


  // Custom search function for assignees - allows self-assignment
  const searchAssignees = useMemo(() => {
    return async (searchTerm) => {
      try {
        const response = await axiosInstance.get('/users/options', {
          params: { search: searchTerm, active: true }
        });
        const users = response.data.data || response.data || [];
        // Allow assigning to self
        return users;
      } catch (err) {
        console.error('Search error:', err);
        return [];
      }
    };
  }, []);

  const canEditCompleted = taskPerms.canEditCompleted === true;

  const editTitle =
    String(form.status).toLowerCase() === 'completed' && !canEditCompleted
      ? 'Your role cannot edit completed tasks'
      : 'Save Changes';

  const handleMovChange = (index, value) => {
      next[index] = { ...next[index], text: value };
    setMovItems((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleMovAdd = () => {
    setMovItems((prev) => [...prev, { text: '', user_id: null }]);
  };

  const handleMovRemove = (index) => {
      const handleMovUserChange = (index, userId) => {
        setMovItems((prev) => prev.map((item, itemIndex) => (
          itemIndex === index ? { ...item, user_id: userId } : item
        )));
      };
    setMovItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Auto-calculate due date based on recurrence frequency
  const calculateDueDate = (startDate, frequency) => {
    if (!startDate || !frequency) return '';

    const start = new Date(startDate);
    if (isNaN(start.getTime())) return '';

    const dueDate = new Date(start);

    switch (frequency) {
      case 'daily':
        dueDate.setDate(dueDate.getDate() + 1);
        break;
      case 'weekly':
        dueDate.setDate(dueDate.getDate() + 7);
        break;
      case 'monthly':
        dueDate.setMonth(dueDate.getMonth() + 1);
        break;
      case 'quarterly':
        dueDate.setMonth(dueDate.getMonth() + 3);
        break;
      case 'annually':
        dueDate.setFullYear(dueDate.getFullYear() + 1);
        break;
      case 'other':
        // For custom days, add the custom_recurrence_days
        const customDays = parseInt(form.custom_recurrence_days) || 1;
        dueDate.setDate(dueDate.getDate() + customDays);
        break;
      default:
        return '';
    }

    // Format as YYYY-MM-DD
    return dueDate.toISOString().split('T')[0];
  };

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await axiosInstance.get(`/tasks/${id}?include_all_mov=true`);
        const t = res.data.data;
        const { baseDescription, movItems: movFromDescription } = splitDescriptionAndMov(
          t.description || '',
        );
        setForm({
          title: t.title || '',
          description: baseDescription || '',
          department: t.department || '',
          priority: t.priority || '',
          status: t.status || '',
          workflow_type: t.workflow_type || '',
          task_type: t.task_type || '',
          start_date: t.start_date ? t.start_date.slice(0, 10) : '',
          due_date: t.due_date ? t.due_date.slice(0, 10) : '',
          project_id: t.project_id || '',
          project_name: t.project_name || '',
          recurrence_rule: t.recurrence_rule || '',
          recurrence_next_date: t.recurrence_next_date ? t.recurrence_next_date.slice(0, 10) : '',
          recurrence_frequency: [
            'daily',
            'weekly',
            'monthly',
            'quarterly',
            'annually'
          ].includes(t.recurrence_rule)
            ? t.recurrence_rule
            : t.recurrence_rule ? 'other' : '',
          custom_recurrence_days: t.recurrence_rule && ![
            'daily',
            'weekly',
            'monthly',
            'quarterly',
            'annually'
          ].includes(t.recurrence_rule)
            ? t.recurrence_rule.replace(' days', '')
            : '',
          recurrence_end_type: t.recurrence_end_type || 'never',
          recurrence_end_date: t.recurrence_end_date ? t.recurrence_end_date.slice(0, 10) : '',
          recurrence_end_occurrences: t.recurrence_end_occurrences || ''
        });
        const existingMovItems = Array.isArray(t.mov_items)
          ? t.mov_items
            .map((text) => String(text || '').trim())
            .filter((text) => text.length > 0)
          : [];
        const combinedMovItems =
          existingMovItems.length > 0
            ? existingMovItems
            : movFromDescription && movFromDescription.length > 0
              ? movFromDescription
              : [];
        const persistedMovAssignments = Array.isArray(t.mov_assignments)
          ? t.mov_assignments
          : [];
        setMovItems(
          combinedMovItems.length > 0
            ? combinedMovItems.map((text, index) => ({
              text,
              user_id: persistedMovAssignments.find(
                (item) => Number(item.mov_index) === index,
              )?.user_id ?? null,
            }))
            : [{ text: '', user_id: null }],
        );
        setExistingAttachments(Array.isArray(t.attachments) ? t.attachments : []);

        const idsFromAssigned = Array.isArray(t.assigned_user_ids)
          ? t.assigned_user_ids.filter((n) => Number.isInteger(n) && n > 0)
          : [];
        const idsFromMeta = Array.isArray(t.assigned_users_meta)
          ? t.assigned_users_meta
            .map((m) => (m && m.user_id ? m.user_id : null))
            .filter((n) => Number.isInteger(n) && n > 0)
          : [];
        const idsFromApprovers = Array.isArray(t.approval_required_user_ids)
          ? t.approval_required_user_ids.filter(
            (n) => Number.isInteger(Number(n)) && Number(n) > 0
          )
          : [];
        const uniqueIds = Array.from(
          new Set([
            ...(idsFromAssigned || []),
            ...(idsFromMeta || []),
            ...idsFromApprovers
          ])
        );

        const deptMap = {};
        if (Array.isArray(t.assigned_users_meta)) {
          t.assigned_users_meta.forEach((m) => {
            if (m && m.user_id) deptMap[m.user_id] = m.department;
          });
        }
        setAssignedUserDepartments(deptMap);

        if (uniqueIds.length > 0) {
          try {
            const query = uniqueIds
              .map((idVal) => `ids=${encodeURIComponent(idVal)}`)
              .join('&');
            const byIds = await axiosInstance.get(
              `/users/by-ids${query ? `?${query}` : ''}`
            );
            const usersArray = Array.isArray(byIds.data) ? byIds.data : [];
            const assignedSet = new Set(idsFromAssigned.map((v) => Number(v)));
            setAssignedUsers(
              usersArray.filter((u) => assignedSet.has(Number(u.id)))
            );
            const approverSet = new Set(
              idsFromApprovers.map((v) => Number(v))
            );
            setApproverUsers(
              usersArray.filter((u) => approverSet.has(Number(u.id)))
            );
          } catch {
            setAssignedUsers(idsFromAssigned.map((idVal) => ({ id: idVal })));
            setApproverUsers(
              idsFromApprovers.map((idVal) => ({ id: Number(idVal) }))
            );
          }
        } else {
          setAssignedUsers([]);
        }

        if (t.reported_by) {
          setReportedByUsers([t.reported_by]);
        } else {
          setReportedByUsers([]);
        }
        setOriginalStatus(t.status || '');
        setOriginalWorkflowType(t.workflow_type || 'standard');
      } catch (e) {
        setError(e.response?.data?.message || 'Failed to load task.');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  const statusOptions = useMemo(() => {
    const s = originalStatus;
    const w = originalWorkflowType;
    let allowed = [];

    switch (s) {
      case 'draft':
        allowed = ['open'];
        break;
      case 'open':
        allowed = ['in_progress', 'cancelled'];
        break;
      case 'in_progress':
        allowed = ['completed', 'cancelled'];
        break;
      case 'completed':
        allowed =
          w === 'approval_required'
            ? ['pending_approval', 'in_progress']
            : ['closed', 'in_progress'];
        break;
      case 'pending_approval':
        allowed = ['approved', 'rejected', 'closed', 'in_progress'];
        break;
      case 'approved':
        allowed = ['closed'];
        break;
      case 'rejected':
        allowed = ['in_progress', 'cancelled'];
        break;
      case 'closed':
      case 'cancelled':
        allowed = ['open'];
        break;
      default:
        allowed = [];
    }
    if (!allowed.includes(s) && s) allowed.push(s);
    return allowed.map((status) => ({
      value: status,
      label: status
        .split('_')
        .map((w) => w[0].toUpperCase() + w.slice(1))
        .join(' ')
    }));
  }, [originalStatus, originalWorkflowType]);

  const getAttachmentHref = (urlStr) => {
    if (!urlStr) return '#';
    if (urlStr.startsWith('http://') || urlStr.startsWith('https://')) {
      return urlStr;
    }
    const base = axiosInstance.defaults.baseURL || '';
    return `${base.replace(/\/$/, '')}${urlStr}`;
  };

  const handleRemoveExistingAttachment = async (attachmentId) => {
    if (!window.confirm('Remove this attachment?')) return;
    setRemovingAttachmentId(attachmentId);
    try {
      await axiosInstance.delete(`/tasks/${id}/attachments/${attachmentId}`);
      setExistingAttachments((prev) =>
        prev.filter((a) => a.id !== attachmentId),
      );
      toast.success('Attachment removed.');
    } catch (err) {
      toast.error(
        err.response?.data?.message || 'Failed to remove attachment.',
      );
    } finally {
      setRemovingAttachmentId(null);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const next = { ...prev, [name]: value };

      // Auto-calculate due date when start_date or recurrence_frequency changes
      if ((name === 'start_date' || name === 'recurrence_frequency') && prev.task_type === 'recurring') {
        const startDate = name === 'start_date' ? value : prev.start_date;
        const frequency = name === 'recurrence_frequency' ? value : prev.recurrence_frequency;
        const calculatedDueDate = calculateDueDate(startDate, frequency);
        if (calculatedDueDate) {
          next.due_date = calculatedDueDate;
        }
      }

      if (name === 'custom_recurrence_days') {
        next.recurrence_rule = value ? `${value} days` : '';
      }
      return next;
    });
  };

  const handleSelectChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const next = { ...prev, [name]: value };

      // Auto-calculate due date when recurrence_frequency changes
      if (name === 'recurrence_frequency' && prev.task_type === 'recurring') {
        const calculatedDueDate = calculateDueDate(prev.start_date, value);
        if (calculatedDueDate) {
          next.due_date = calculatedDueDate;
        }
      }

      if (name === 'recurrence_frequency') {
        if (value === 'other') {
          next.recurrence_rule = next.custom_recurrence_days ? `${next.custom_recurrence_days} days` : '';
        } else {
          next.recurrence_rule = value || '';
          next.custom_recurrence_days = '';
        }
      }
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const movItemsClean = Array.isArray(movItems)
        ? movItems
          .map((item) => ({ ...item, text: String(item.text || '').trim() }))
          .filter((item) => item.text.length > 0)
        : [];
      if (movItemsClean.length === 0) {
        const msg =
          'At least one Means of Verification (MOV) item is required for every task.';
        setError(msg);
        toast.error(msg);
        setSaving(false);
        return;
      }

      // FIXED: Do NOT encode MOV into description - send it separately via mov_items field
      const payload = {
        title: form.title || undefined,
        description: form.description || undefined,
        priority: form.priority || undefined,
        status: form.status || undefined,
        workflow_type: form.workflow_type || undefined,
        task_type: form.task_type || undefined,
        start_date: form.start_date || undefined,
        due_date: form.due_date || undefined,
        project_name: form.project_name || undefined,
        assigned_users: assignedUsers && assignedUsers.length > 0
          ? assignedUsers.map((u) => u.id)
          : undefined,
        assigned_users_meta:
          assignedUsers && assignedUsers.length > 0
            ? assignedUsers.map((u) => ({
              user_id: u.id,
              department:
                assignedUserDepartments[u.id] ||
                form.department ||
                'admin'
            }))
            : undefined,
        approval_required_user_ids:
          approverUsers && approverUsers.length > 0
            ? approverUsers.map((u) => u.id)
            : undefined,
        reported_by_id:
          Array.isArray(reportedByUsers) && reportedByUsers.length > 0
            ? reportedByUsers[0].id
            : undefined,
        recurrence_rule:
          form.task_type === 'recurring' ? form.recurrence_rule || undefined : undefined,
        recurrence_next_date:
          form.task_type === 'recurring' ? form.recurrence_next_date || undefined : undefined,
        recurrence_end_type: form.recurrence_end_type || undefined,
        recurrence_end_date: form.recurrence_end_date || undefined,
        recurrence_end_occurrences: form.recurrence_end_occurrences ? parseInt(form.recurrence_end_occurrences) : undefined,
        mov_items: movItemsClean.map((item) => item.text),
        mov_assignments: movItemsClean.map((item, mov_index) => ({
          mov_index,
          user_id: assignedUsers.length === 1 ? assignedUsers[0].id : item.user_id,
        })),
      };
      const res = await axiosInstance.patch(`/tasks/${id}`, payload);
      const updatedTask = res?.data?.data || null;
      toast.success('Task updated. Email notification will be sent if configured.');

      const toUpload =
        attachmentsRef.current?.collectForSubmit?.() || pendingAttachments;
      if (toUpload.length > 0) {
        const { uploaded, failed } = await uploadPendingTaskAttachments({
          axiosInstance,
          taskId: id,
          items: toUpload,
          isInitial: true,
        });
        if (uploaded > 0) {
          toast.success(
            uploaded === 1
              ? 'Attachment uploaded successfully.'
              : `${uploaded} attachments uploaded successfully.`,
          );
        }
        if (failed > 0) {
          toast.error(
            failed === 1
              ? 'Task updated, but failed to upload 1 attachment.'
              : `Task updated, but failed to upload ${failed} attachments.`,
          );
        }
      }

      if (isModal) {
        onSaved?.(updatedTask || { id: Number(id) });
        onClose?.();
        return;
      }
      navigate(`${taskRouteBase}/view/${id}`, { replace: true });
    } catch (e2) {
      setError(e2.response?.data?.message || 'Failed to update task.');
      toast.error(e2.response?.data?.message || 'Failed to update task.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        {!isModal && <Navbar />}
        <div className="add-task-page">
          <div className={`add-task-card${isModal ? ' add-task-card--modal' : ''}`}>
            {isModal ? (
              <div className="task-form-modal-header">
                <h2 className="task-form-modal-title">Update Task</h2>
                <button
                  type="button"
                  className="task-form-modal-close"
                  onClick={handleBack}
                  aria-label="Close"
                >
                  Ã—
                </button>
              </div>
            ) : (
              <PageHeader title="Update Task" showBackButton={true} onBackClick={handleBack} />
            )}
            <div className="status-message">Loading task...</div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {!isModal && <Navbar />}
      <div className="add-task-page">
        <div className={`add-task-card${isModal ? ' add-task-card--modal' : ''}`}>
          {isModal ? (
            <div className="task-form-modal-header">
              <h2 className="task-form-modal-title">Update Task</h2>
              <button
                type="button"
                className="task-form-modal-close"
                onClick={handleBack}
                aria-label="Close"
              >
                Ã—
              </button>
            </div>
          ) : (
            <PageHeader title="Update Task" showBackButton={true} onBackClick={handleBack} />
          )}
          {error && <div className="status-message status-message--error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="add-task-section add-task-section--compact">
              <div className="add-task-section-title">1. Basic Details</div>
              <div className="add-task-grid-2">
                <ProjectProgramSelect
                  value={form.project_name}
                  onChange={(e) => {
                    setForm((prev) => ({ ...prev, project_name: e.target.value }));
                  }}
                />
                <FormInput
                  name="title"
                  label="Task Title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="Enter task title"
                />
              </div>
              <div className="add-task-description-wrap">
                <FormTextarea
                  name="description"
                  label="Description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Enter a brief description of the task..."
                  rows={3}
                  maxLength={500}
                />
                <div className="add-task-char-count">
                  {(form.description || '').length}/500
                </div>
              </div>
            </div>

            <div className="add-task-section add-task-section--compact" style={{ marginBottom: '0.85rem' }}>
              <div className="add-task-section-title">2. Task Setup</div>
              <div className="add-task-setup-grid add-task-setup-grid--update">
                <TaskFormSelect
                  name="status"
                  label="Status"
                  value={form.status}
                  onChange={handleChange}
                  icon={FiFlag}
                  iconClassName="task-custom-select-field-icon--status"
                  options={statusOptions}
                />
                <div className="add-task-setup-assignees">
                  <SearchableMultiSelect
                    label="Assigned Users"
                    onSearch={searchAssignees}
                    onSelect={(users) => setAssignedUsers(users)}
                    onClear={() => setAssignedUsers([])}
                    value={assignedUsers}
                    displayKey="first_name"
                    valueKey="id"
                    allowResearch={true}
                    debounceDelay={500}
                    minSearchLength={2}
                    placeholder="Select users..."
                    renderOption={(user) => (
                      <div className="assign-user-option">
                        <div className="assign-user-name">
                          {user.first_name} {user.last_name}
                        </div>
                        <div className="assign-user-email">{user.email}</div>
                        {user.department && (
                          <div className="assign-user-meta">
                            {user.department} â€¢ {user.role || 'User'}
                          </div>
                        )}
                      </div>
                    )}
                  />
                </div>
                <TaskFormSelect
                  name="workflow_type"
                  label="Workflow Type"
                  value={form.workflow_type}
                  onChange={handleChange}
                  icon={FiGitBranch}
                  iconClassName="task-custom-select-field-icon--workflow"
                  options={['standard', 'approval_required'].map((w) => ({
                    value: w,
                    label: w
                      .split('_')
                      .map((x) => x[0].toUpperCase() + x.slice(1))
                      .join(' ')
                  }))}
                />
                {form.workflow_type === 'approval_required' && (
                  <div className="add-task-conditional-block">
                    <SearchableMultiSelect
                      label="Approvers"
                      apiEndpoint="/users/options"
                      apiParams={multiSelectParams}
                      onSelect={(users) => setApproverUsers(users)}
                      onClear={() => setApproverUsers([])}
                      value={approverUsers}
                      displayKey="first_name"
                      valueKey="id"
                      allowResearch={true}
                      debounceDelay={500}
                      minSearchLength={2}
                      renderOption={(user) => (
                        <div className="assign-user-option">
                          <div className="assign-user-name">
                            {user.first_name} {user.last_name}
                          </div>
                          <div className="assign-user-email">
                            {user.email}
                          </div>
                          {user.department && (
                            <div className="assign-user-meta">
                              {user.department} â€¢ {user.role || 'User'}
                            </div>
                          )}
                        </div>
                      )}
                    />
                  </div>
                )}
                <TaskFormSelect
                  name="priority"
                  label="Priority"
                  value={form.priority}
                  onChange={handleChange}
                  icon={FiAlignJustify}
                  iconClassName="task-custom-select-field-icon--priority"
                  options={['low', 'medium', 'high', 'critical'].map((p) => ({
                    value: p,
                    label: p[0].toUpperCase() + p.slice(1)
                  }))}
                />
                <TaskFormSelect
                  name="task_type"
                  label="Task Type"
                  value={form.task_type}
                  onChange={handleChange}
                  icon={FiClipboard}
                  iconClassName="task-custom-select-field-icon--task-type"
                  options={[
                    { value: 'one_time', label: 'One-time task' },
                    { value: 'recurring', label: 'Recurring task' },
                    { value: 'project_linked', label: 'Project-linked task' }
                  ]}
                />
              </div>
              {form.task_type === 'recurring' && (
                <div className="add-task-conditional-block">
                  <div className="add-task-grid-2">
                    <TaskFormSelect
                      name="recurrence_frequency"
                      label="Recurring Frequency"
                      value={form.recurrence_frequency}
                      onChange={handleSelectChange}
                      showDefaultOption
                      options={['daily', 'weekly', 'monthly', 'quarterly', 'annually', 'other'].map(
                        (f) => ({
                          value: f,
                          label: f[0].toUpperCase() + f.slice(1)
                        })
                      )}
                    />
                    {form.recurrence_frequency === 'other' && (
                      <FormInput
                        name="custom_recurrence_days"
                        label="Custom Recurrence Days"
                        type="number"
                        min="1"
                        value={form.custom_recurrence_days}
                        onChange={handleChange}
                        placeholder="Enter number of days"
                        required
                      />
                    )}
                  </div>
                  <div className="recurrence-end-section" style={{ marginTop: '0.75rem' }}>
                    <div className="add-task-conditional-label">End Condition</div>
                    <div className="add-task-grid-2">
                      <TaskFormSelect
                        name="recurrence_end_type"
                        label="End After"
                        value={form.recurrence_end_type}
                        onChange={handleSelectChange}
                        options={[
                          { value: 'never', label: 'Indefinitely (No end date)' },
                          { value: 'on_date', label: 'On specific date' },
                          { value: 'after_occurrences', label: 'After number of occurrences' }
                        ]}
                      />
                      {form.recurrence_end_type === 'on_date' && (
                        <FormInput
                          name="recurrence_end_date"
                          label="End Date"
                          type="date"
                          value={form.recurrence_end_date}
                          onChange={handleChange}
                          required
                        />
                      )}
                      {form.recurrence_end_type === 'after_occurrences' && (
                        <FormInput
                          name="recurrence_end_occurrences"
                          label="Number of Occurrences"
                          type="number"
                          min="1"
                          value={form.recurrence_end_occurrences}
                          onChange={handleChange}
                          required
                        />
                      )}
                    </div>
                  </div>
                </div>
              )}

              {assignedUsers.length > 0 && (
                <div className="add-task-assignees-summary-compact">
                  <div className="assign-users-hint">
                    {'\u2713'} {assignedUsers.length}{' '}
                    {assignedUsers.length === 1 ? 'user selected' : 'users selected'}
                  </div>
                  <div className="assign-users-summary">
                    <div className="assign-users-summary-label">
                      Selected Assignees:
                    </div>
                    {assignedUsers.map((u) => (
                      <div
                        key={u.id}
                        className="assign-users-row"
                      >
                        <div className="assign-users-row-col">
                          <FormInput
                            name={`user_${u.id}_label`}
                            label=""
                            value={
                              `${u.first_name || ''} ${u.last_name || ''}`.trim() ||
                              u.email ||
                              `User #${u.id}`
                            }
                            onChange={() => { }}
                            disabled
                          />
                        </div>
                        <div className="assign-users-row-col">
                          <FormInput
                            name={`dept_${u.id}`}
                            label=""
                            value={formatDepartment(
                              assignedUserDepartments[u.id] ||
                              u.department ||
                              form.department ||
                              ''
                            )}
                            onChange={() => { }}
                            disabled
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="add-task-split-row">
              <div className="add-task-section add-task-section--compact add-task-section--schedule">
                <div className="add-task-section-title">3. Schedule</div>
                <div className="add-task-grid-1">
                  <FormInput
                    name="start_date"
                    label="Start Date"
                    type="date"
                    value={form.start_date}
                    onChange={handleChange}
                  />
                  <FormInput
                    name="due_date"
                    label={form.task_type === 'recurring' ? 'Due Date (of first task) - Auto-calculated' : 'Due Date'}
                    type="date"
                    value={form.due_date}
                    onChange={handleChange}
                    disabled={form.task_type === 'recurring' && form.recurrence_frequency}
                    placeholder={form.task_type === 'recurring' ? 'Select frequency to auto-calculate' : undefined}
                  />
                </div>
              </div>

              <div className="add-task-section add-task-section--compact add-task-section--mov">
                <div className="add-task-section-title">4. Means of Verification (MOV)</div>
                {movItems.map((item, index) => (
                  <div key={index} className="mov-item-row">
                    <FormInput
                      name={`mov_item_${index}`}
                      label={index === 0 ? 'MOV Item' : ''}
                      value={item.text}
                      onChange={(e) => handleMovChange(index, e.target.value)}
                      placeholder="Define a clear, specific, and measurable verification point"
                    />
                    <MovAssignmentPicker
                      assignedUsers={assignedUsers}
                      userId={assignedUsers.length === 1 ? assignedUsers[0].id : item.user_id}
                      onChange={(userId) => handleMovUserChange(index, userId)}
                      disabled={saving || !taskPerms.canUpdate}
                    />
                    {movItems.length > 1 && (
                      <button
                        type="button"
                        className="mov-item-remove-button"
                        onClick={() => handleMovRemove(index)}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <div className="mov-hint">
                  MOV items should be clear and measurable.
                </div>
                <div className="mov-actions">
                  <button
                    type="button"
                    className="mov-item-add-button"
                    onClick={handleMovAdd}
                  >
                    <FiPlus /> Add MOV Item
                  </button>
                </div>
              </div>
            </div>

            <div className="add-task-section add-task-section--compact" style={{ marginBottom: '0.85rem' }}>
              {existingAttachments.length > 0 && (
                <div className="task-existing-attachments" style={{ marginBottom: '1rem' }}>
                  <div className="add-task-section-title">Current attachments</div>
                  <ul className="task-pending-attachments__list">
                    {existingAttachments.map((a) => {
                      const displayName = a.description || a.file_name;
                      return (
                        <li key={a.id} className="task-pending-attachments__item">
                          <div className="task-pending-attachments__item-main">
                            <strong>{displayName}</strong>
                            {a.description &&
                              a.file_name &&
                              a.description !== a.file_name && (
                                <span>{a.file_name}</span>
                              )}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <a
                              href={getAttachmentHref(a.file_url)}
                              target="_blank"
                              rel="noreferrer"
                              style={{ fontSize: '0.85rem', color: '#2563eb' }}
                            >
                              View
                            </a>
                            <button
                              type="button"
                              className="task-pending-attachments__remove"
                              onClick={() => handleRemoveExistingAttachment(a.id)}
                              disabled={
                                removingAttachmentId === a.id ||
                                saving ||
                                (String(form.status).toLowerCase() === 'completed' &&
                                  !canEditCompleted)
                              }
                              title="Remove"
                            >
                              <FiTrash2 />
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              <TaskPendingAttachments
                ref={attachmentsRef}
                items={pendingAttachments}
                onChange={setPendingAttachments}
                title={
                  existingAttachments.length > 0
                    ? 'Add more attachments'
                    : 'Attachments'
                }
                disabled={saving || (String(form.status).toLowerCase() === 'completed' && !canEditCompleted)}
              />
            </div>

            <div className="add-task-footer add-task-footer--actions">
              <button
                type="button"
                className="add-task-cancel-btn"
                onClick={handleBack}
              >
                Cancel
              </button>
              <button
                className="add-task-submit primary-button"
                type="submit"
                disabled={saving || (String(form.status).toLowerCase() === 'completed' && !canEditCompleted)}
                title={editTitle}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default UpdateTask;
