import React, { useCallback, useMemo, useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  FiCalendar,
  FiClipboard,
  FiClock,
  FiFolder,
  FiGitBranch,
  FiPlus,
} from 'react-icons/fi';
import axiosInstance from '../../../../utils/axios';
import { toast } from 'react-toastify';
import Navbar from '../../../Navbar';
import FormInput from '../../../common/FormInput';
import SearchableMultiSelect from '../../../common/SearchableMultiSelect';
import { useAuth } from '../../../../context/AuthContext';
import { getTaskPermissions } from '../../../../utils/permissions';
import { tasksBasePath } from '../../../../utils/admin';
import TaskPendingAttachments, {
  uploadPendingTaskAttachments,
} from '../shared/TaskPendingAttachments';
import MovAssignmentPicker from '../shared/MovAssignmentPicker';
import '../../../../styles/variables.css';
import './index.css';
/* ------------------------------------------------------------------ */
/* Small presentational helpers                                        */
/* ------------------------------------------------------------------ */

// The "=" icon used on the priority pill
const EqualsIcon = ({ className = '' }) => (
  <span className={`pill-equals-icon ${className}`} aria-hidden="true">=</span>
);

const formatPillDate = (value) => {
  if (!value) return '';
  const d = new Date(`${value}T00:00:00`);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const getInitials = (u) => {
  const a = (u?.first_name || '').trim()[0] || '';
  const b = (u?.last_name || '').trim()[0] || '';
  const initials = `${a}${b}`.toUpperCase();
  return initials || (u?.email || '?')[0].toUpperCase();
};

const userDisplayName = (u) =>
  `${u?.first_name || ''} ${u?.last_name || ''}`.trim() || u?.email || `User #${u?.id}`;

/* A pill that shows "Due date" / "Start date" text but is backed by a real
   <input type="date"> (invisible, covers the pill) so values still work. */
const DatePill = ({ name, value, onChange, icon: Icon, placeholder, title, showDot = false }) => {
  const inputRef = useRef(null);

  const openPicker = () => {
    const el = inputRef.current;
    if (!el) return;
    if (typeof el.showPicker === 'function') {
      try {
        el.showPicker();
        return;
      } catch (_) {
        /* fall through */
      }
    }
    el.focus();
    el.click();
  };

  return (
    <div
      className={`pill-input-wrapper task-pill-date ${value ? 'is-filled' : 'is-empty'}`}
      onClick={openPicker}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openPicker();
        }
      }}
      role="button"
      tabIndex={0}
      title={title}
    >
      <Icon className="pill-icon" />
      <span className={`pill-text ${value ? '' : 'is-placeholder'}`}>
        {value ? formatPillDate(value) : placeholder}
      </span>
      {!value && showDot && <span className="pill-dot" />}
      <input
        ref={inputRef}
        type="date"
        name={name}
        value={value}
        onChange={onChange}
        className="pill-native-date"
        tabIndex={-1}
        aria-label={title}
      />
    </div>
  );
};

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
      {label && (
        <label className="form-label">
          {label}
          {required && <span className="required-mark">*</span>}
        </label>
      )}
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

  const isProgramValue = !!value && !projects.includes(value);
  const LeadIcon = isProgramValue ? FiClipboard : FiFolder;

  return (
    <div className="form-group" ref={containerRef}>
      <div className="task-custom-select-container">
        <div
          className={`task-custom-select-display ${isOpen ? 'is-open' : ''} ${error ? 'has-error' : ''} ${value ? 'is-filled has-clear' : 'is-empty'}`}
          onClick={handleToggle}
        >
          <span className="task-custom-select-leading">
            <LeadIcon className="task-custom-select-field-icon" />
            <span className={`task-custom-select-value ${!value ? 'is-placeholder' : ''}`}>
              {value || 'Project'}
            </span>
          </span>
          {!value && <span className="pill-dot" />}
          <span className="task-custom-select-arrow">▼</span>
        </div>

        {value && (
          <button
            type="button"
            className="task-custom-select-clear-btn"
            onClick={handleClear}
            aria-label="Clear project"
          >
            ✕
          </button>
        )}

        {isOpen && (
          <div className="task-custom-select-dropdown">
            <div className="task-custom-select-dropdown-header">
              <span className="task-custom-select-dropdown-title">
                {selectionStep === 'category' ? 'Select Category' : projectCategory}
              </span>
              {selectionStep === 'item' && (
                <button type="button" className="task-custom-select-back-link" onClick={handleBack}>
                  ← Back
                </button>
              )}
            </div>

            <div className="task-custom-select-options-list">
              {selectionStep === 'category' ? (
                <>
                  <button type="button" className="task-custom-select-option" onClick={() => handleCategorySelect('Projects')}>
                    <span className="task-custom-select-option-label">
                      <FiFolder className="task-custom-select-option-icon" /> Projects
                    </span>
                    <span className="task-custom-select-option-arrow">›</span>
                  </button>
                  <button type="button" className="task-custom-select-option" onClick={() => handleCategorySelect('Programs')}>
                    <span className="task-custom-select-option-label">
                      <FiClipboard className="task-custom-select-option-icon" /> Programs
                    </span>
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

/* ------------------------------------------------------------------ */
/* Main component                                                      */
/* ------------------------------------------------------------------ */

const AddTask = ({
  isModal = false,
  onClose,
  onSaved,
  defaultDepartment,
} = {}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, permissions } = useAuth();

  // Get default department from navigation state if available
  const defaultDept =
    defaultDepartment || location.state?.defaultDepartment || user?.department || '';

  const emptyForm = () => ({
    title: '',
    description: '',
    department: defaultDept,
    priority: 'medium',
    workflow_type: 'standard',
    task_type: 'one_time',
    recurrence_frequency: '',
    custom_recurrence_days: '',
    start_date: '',
    due_date: '',
    project_name: '',
    recurrence_rule: '',
    recurrence_next_date: '',
    recurrence_end_type: 'never',
    recurrence_end_date: '',
    recurrence_end_occurrences: '',
    approval_required: false
  });

  const [form, setForm] = useState(emptyForm);

  const isAdmin = useMemo(() => {
    const r = String(user?.role || '').toLowerCase();
    return r === 'super_admin' || r === 'admin';
  }, [user?.role]);

  const departmentOptions = [
    { value: 'admin', label: 'Admin' },
    { value: 'program', label: 'Program' },
    { value: 'store', label: 'Store' },
    { value: 'procurements', label: 'Procurements' },
    { value: 'accounts_and_finance', label: 'Accounts & Finance' },
    { value: 'fund_raising', label: 'Fund Raising' },
    { value: 'it', label: 'IT' },
    { value: 'hr', label: 'HR' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'audio_video', label: 'Audio Video' },
    { value: 'meal', label: 'Meal' },
  ];

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [assignedUsers, setAssignedUsers] = useState([]);
  const [assignedUserDepartments, setAssignedUserDepartments] = useState({});
  const [approverUsers, setApproverUsers] = useState([]);
  const [movItems, setMovItems] = useState([{ text: '', user_id: null }]);
  const [pendingAttachments, setPendingAttachments] = useState([]);
  const [createAnother, setCreateAnother] = useState(false);
  const attachmentsRef = useRef(null);
  const formRef = useRef(null);
  const titleRef = useRef(null);

  const taskPerms = useMemo(
    () => getTaskPermissions(permissions || {}, user?.department, user?.role),
    [permissions, user?.department, user?.role],
  );

  const multiSelectParams = useMemo(() => ({ active: true }), []);

  // Ctrl/Cmd + Enter submits the form (matches the "Ctrl ↵" hint on the button)
  useEffect(() => {
    const onKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (!submitting && taskPerms.canCreate) {
          formRef.current?.requestSubmit();
        }
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [submitting, taskPerms.canCreate]);

  // Custom search function for assignees
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

  const handleProjectChange = (e) => {
    setForm(prev => ({ ...prev, project_name: e.target.value }));
  };

  const createTitle = taskPerms.canCreate ? 'Create Task' : 'You do not have permission to create tasks';

  const formatDepartment = (dept) => {
    if (!dept) return '';
    return String(dept)
      .split('_')
      .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ''))
      .join(' ');
  };

  // Department shown in the header chip (same rule used on submit)
  const currentDepartment = isAdmin
    ? (form.department || 'admin')
    : (user?.department || 'admin');
  const currentDepartmentLabel =
    departmentOptions.find((d) => d.value === currentDepartment)?.label ||
    formatDepartment(currentDepartment);

  const handleMovChange = (index, value) => {
    setMovItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], text: value };
      return next;
    });
  };
  const handleMovAdd = () => {
    const defaultUserId =
      assignedUsers.length === 1 ? assignedUsers[0].id : null;
    setMovItems((prev) => [...prev, { text: '', user_id: defaultUserId }]);
  };
  const handleMovRemove = (index) => {
    setMovItems((prev) => prev.filter((_, i) => i !== index));
  };
  const handleMovUserChange = (index, userId) => {
    setMovItems((prev) => prev.map((item, itemIndex) => (
      itemIndex === index ? { ...item, user_id: userId } : item
    )));
  };
  const handleMovAssignAll = (userId) => {
    setMovItems((prev) => prev.map((item) => ({ ...item, user_id: userId })));
  };

  // Single task assignee → all MOVs belong to them (no per-MOV picker).
  useEffect(() => {
    if (assignedUsers.length !== 1) return;
    const soleId = assignedUsers[0].id;
    setMovItems((prev) =>
      prev.map((item) =>
        Number(item.user_id) === Number(soleId) ? item : { ...item, user_id: soleId },
      ),
    );
  }, [assignedUsers]);

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

  const handleBack = useCallback(() => {
    if (isModal) {
      onClose?.();
      return;
    }
    navigate(`${tasksBasePath()}/list`); // Navigate back to tasks list at /tasks/list
  }, [isModal, navigate, onClose]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const next = {
      ...form,
      [name]: type === 'checkbox' ? checked : value
    };

    // Auto-calculate due date when start_date or recurrence_frequency changes
    if ((name === 'start_date' || name === 'recurrence_frequency') && next.task_type === 'recurring') {
      const calculatedDueDate = calculateDueDate(next.start_date, next.recurrence_frequency);
      if (calculatedDueDate) {
        next.due_date = calculatedDueDate;
      }
    }

    setForm(next);

    if (name === 'custom_recurrence_days') {
      syncFromTaskType(next);
    }
  };
  const syncFromTaskType = (next) => {
    const tt = next.task_type;
    const freq = next.recurrence_frequency;
    let wt = next.workflow_type;
    let rr = next.recurrence_rule;
    if (tt === 'approval_based') wt = 'approval_required';
    if (tt === 'one_time' || tt === 'project_linked') {
      wt = 'standard';
      rr = '';
    }
    if (tt === 'recurring') {
      wt = 'standard';
      if (freq === 'other') {
        rr = next.custom_recurrence_days ? `${next.custom_recurrence_days} days` : '';
      } else {
        rr = freq || '';
      }
    }
    setForm((prev) => ({ ...prev, workflow_type: wt, recurrence_rule: rr }));
  };
  const handleSelectChange = (e) => {
    const { name, value } = e.target;
    let next = { ...form, [name]: value };

    // If switching frequency to other, clear custom days
    if (name === 'recurrence_frequency' && value !== 'other') {
      next.custom_recurrence_days = '';
    }

    // Automatically set start_date to today if priority is 'critical'
    if (name === 'priority' && value === 'critical') {
      const today = new Date().toISOString().split('T')[0];
      next.start_date = today;
    }

    setForm(next);
    if (name === 'task_type' || name === 'recurrence_frequency' || name === 'custom_recurrence_days') {
      syncFromTaskType(next);
    }
  };

  // Used by "Create another after this"
  const resetForm = () => {
    setForm(emptyForm());
    setError('');
    setAssignedUsers([]);
    setAssignedUserDepartments({});
    setApproverUsers([]);
    setMovItems([{ text: '', user_id: null }]);
    setPendingAttachments([]);
    setTimeout(() => titleRef.current?.focus(), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    // For admins, use the department selected in the form.
    // For regular users, use their own department.
    const department = isAdmin ? (form.department || 'admin') : (user?.department || 'admin');
    const validationErrors = [];
    if (!form.title || !form.title.trim()) {
      validationErrors.push('Task title is required.');
    }
    if (!department) {
      validationErrors.push('Department is required.');
    }
    if (!form.task_type) {
      validationErrors.push('Task type is required.');
    }
    if (!form.workflow_type) {
      validationErrors.push('Workflow type is required.');
    }
    if (!form.priority) {
      validationErrors.push('Priority is required.');
    }
    if (!form.start_date) {
      validationErrors.push('Start date is required.');
    }
    if (!form.due_date) {
      validationErrors.push('Due date is required.');
    }
    if (!assignedUsers || assignedUsers.length === 0) {
      validationErrors.push('At least one assignee is required.');
    }
    const movItemsCleanForValidation = Array.isArray(movItems)
      ? movItems
        .map((item) => ({ ...item, text: String(item.text || '').trim() }))
        .filter((item) => item.text.length > 0)
      : [];
    if (form.workflow_type === 'approval_required') {
      if (!approverUsers || approverUsers.length === 0) {
        validationErrors.push('At least one approver is required for approval-required tasks.');
      }
    }
    if (form.task_type === 'recurring') {
      if (!form.recurrence_frequency) {
        validationErrors.push('Recurring frequency is required for recurring tasks.');
      }
    }
    if (validationErrors.length > 0) {
      const msg = validationErrors.join(' ');
      setError(msg);
      toast.error(msg);
      return;
    }
    const start = Date.now();
    setSubmitting(true);
    let createdTaskId = null;
    let createdTaskData = null;
    try {
      const movItemsClean = movItemsCleanForValidation;

      // Do NOT encode MOV into description - send it separately via mov_checklist field
      const titleTrimmed = String(form.title || '').trim();
      const descriptionTrimmed = String(form.description || '').trim();
      const payload = {
        title: titleTrimmed,
        description: descriptionTrimmed || titleTrimmed,
        department,
        priority: form.priority || undefined,
        workflow_type: form.workflow_type || undefined,
        task_type: form.task_type || undefined,
        start_date: form.start_date || undefined,
        due_date: form.due_date || undefined,
        assigned_users:
          assignedUsers && assignedUsers.length > 0
            ? assignedUsers.map((u) => u.id)
            : undefined,
        assigned_users_meta:
          assignedUsers && assignedUsers.length > 0
            ? assignedUsers.map((u) => ({
              user_id: u.id,
              department:
                assignedUserDepartments[u.id] ||
                u.department ||
                department ||
                'admin'
            }))
            : undefined,
        project_name: form.project_name || undefined,
        recurrence_rule: form.recurrence_rule || undefined,
        recurrence_next_date: form.recurrence_next_date || undefined,
        recurrence_end_type: form.recurrence_end_type || undefined,
        recurrence_end_date: form.recurrence_end_date || undefined,
        recurrence_end_occurrences: form.recurrence_end_occurrences ? parseInt(form.recurrence_end_occurrences) : undefined,
        approval_required: !!form.approval_required,
        approval_required_user_ids:
          approverUsers && approverUsers.length > 0
            ? approverUsers.map((u) => u.id)
            : undefined,
        mov_checklist: movItemsClean.map(text => ({
          text: text.text,
          checked: false,
          checked_by_id: null,
          checked_at: null,
        })),
        mov_assignments: movItemsClean.map((item, mov_index) => ({
          mov_index,
          user_id: assignedUsers.length === 1 ? assignedUsers[0].id : item.user_id,
        })),
      };
      const res = await axiosInstance.post('/tasks', payload);
      createdTaskData = res?.data?.data || null;
      createdTaskId = createdTaskData?.id;
      toast.success('Task created. Assignment emails will send if configured.');

      if (createdTaskId) {
        const toUpload =
          attachmentsRef.current?.collectForSubmit?.() || pendingAttachments;
        if (toUpload.length > 0) {
          const { uploaded, failed } = await uploadPendingTaskAttachments({
            axiosInstance,
            taskId: createdTaskId,
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
                ? 'Task created, but failed to upload 1 attachment.'
                : `Task created, but failed to upload ${failed} attachments.`,
            );
          }
        }
      }
    } catch (e2) {
      setError(e2.response?.data?.message || 'Failed to create task.');
      toast.error(e2.response?.data?.message || 'Failed to create task.');
    } finally {
      const elapsed = Date.now() - start;
      if (elapsed < 4000) {
        await new Promise((resolve) => setTimeout(resolve, 4000 - elapsed));
      }
      setSubmitting(false);

      // "Create another after this" → keep the form open with a clean slate
      if (createdTaskId && createAnother) {
        if (isModal) {
          onSaved?.(createdTaskData || { id: createdTaskId });
        }
        resetForm();
        return;
      }

      if (createdTaskId && isModal) {
        onSaved?.(createdTaskData || { id: createdTaskId });
        onClose?.();
        return;
      }
      if (createdTaskId) {
        navigate(`${tasksBasePath()}/view/${createdTaskId}`, { replace: true }); // Replace history entry so back goes to list
      }
    }
  };

  return (
    <>
      {!isModal && <Navbar />}
      <div className={isModal ? 'add-task-modal-backdrop' : 'add-task-page'}>
        <div className="add-task-card add-task-card--popup">

          {/* Header: [Department chip] › New task                    ✕ */}
          <div className="task-form-modal-header">
            <div className="task-form-breadcrumb">
              <span className="task-form-dept-chip">{currentDepartmentLabel} Department</span>
              <span className="task-form-breadcrumb-sep">›</span>
              <h2 className="task-form-modal-title">
                {isModal ? 'New task' : 'Add Task'}
              </h2>
            </div>
            <button
              type="button"
              className="task-form-modal-close"
              onClick={handleBack}
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          {error && <div className="add-task-error">{error}</div>}

          {submitting && (
            <div className="add-task-submitting-overlay">
              Creating task, please wait...
            </div>
          )}

          <form ref={formRef} onSubmit={handleSubmit} className="add-task-form">
            <div className="add-task-body">

              {/* Main Title & Description */}
              <div className="task-title-section">
                <input
                  ref={titleRef}
                  type="text"
                  name="title"
                  className="task-title-input"
                  placeholder="What needs to be done?"
                  value={form.title}
                  onChange={handleChange}
                  required
                  autoFocus
                />
                <textarea
                  name="description"
                  className="task-desc-input"
                  placeholder="Add details, links or instructions for the assignee..."
                  value={form.description}
                  onChange={handleChange}
                  rows={2}
                />
              </div>

              {/* Meta Pills Row */}
              <div className="task-meta-pills">
                <div className={`task-pill-assignee task-popup-assignee-field ${assignedUsers.length > 0 ? 'is-filled' : 'is-empty'}`}>
                  {assignedUsers.length > 0 && (
                    <span
                      className="assignee-avatar"
                      aria-hidden="true"
                      title={assignedUsers.map((u) => `${u.first_name || ''} ${u.last_name || ''}`.trim()).join(', ')}
                    >
                      {assignedUsers.length === 1 ? getInitials(assignedUsers[0]) : assignedUsers.length}
                    </span>
                  )}
                  <SearchableMultiSelect
                    label=""
                    onSearch={searchAssignees}
                    onSelect={(users) => setAssignedUsers(users)}
                    onClear={() => setAssignedUsers([])}
                    value={assignedUsers}
                    displayKey="first_name"
                    valueKey="id"
                    allowResearch={true}
                    debounceDelay={500}
                    minSearchLength={2}
                    placeholder="Assignee"
                    renderOption={(user) => (
                      <div className="assign-user-option">
                        <div className="assign-user-name">{user.first_name} {user.last_name}</div>
                        <div className="assign-user-email">{user.email}</div>
                      </div>
                    )}
                  />
                </div>
                <ProjectProgramSelect
                  value={form.project_name}
                  onChange={handleProjectChange}
                />

                <div className={`task-pill-priority priority-${form.priority || 'medium'}`}>
                  <TaskFormSelect
                    name="priority"
                    label=""
                    value={form.priority}
                    onChange={handleSelectChange}
                    icon={EqualsIcon}
                    defaultOptionText="Priority"
                    options={['low', 'medium', 'high', 'critical'].map((p) => ({
                      value: p,
                      label: p[0].toUpperCase() + p.slice(1)
                    }))}
                  />
                </div>

                 <DatePill
                  name="start_date"
                  value={form.start_date}
                  onChange={handleChange}
                  icon={FiClock}
                  placeholder="Start date"
                  title="Start Date"
                />

                <DatePill
                  name="due_date"
                  value={form.due_date}
                  onChange={handleChange}
                  icon={FiCalendar}
                  placeholder="Due date"
                  title="Due Date"
                  showDot
                />



                <TaskFormSelect
                  name="task_type"
                  label=""
                  value={form.task_type}
                  onChange={handleSelectChange}
                  icon={FiPlus}
                  defaultOptionText="Task Type"
                  options={[
                    { value: 'one_time', label: 'One-time' },
                    { value: 'recurring', label: 'Recurring' },
                    { value: 'project_linked', label: 'Project-linked' }
                  ]}
                />

                <TaskFormSelect
                  name="workflow_type"
                  label=""
                  value={form.workflow_type}
                  onChange={handleSelectChange}
                  icon={FiGitBranch}
                  defaultOptionText="Workflow"
                  options={[
                    { value: 'standard', label: 'Standard workflow' },
                    { value: 'approval_required', label: 'Approval required' },
                  ]}
                />

              </div>

              {assignedUsers.length > 1 && (
                <div className="popup-assignee-summary">
                  <span className="popup-assignee-count">
                    {'\u2713'} {assignedUsers.length} users selected
                  </span>
                  {assignedUsers.map((u) => (
                    <span key={u.id} className="popup-assignee-chip">
                      <span className="chip-avatar">{getInitials(u)}</span>
                      <span className="chip-name">{userDisplayName(u)}</span>
                      <span className="chip-dept">
                        {formatDepartment(
                          assignedUserDepartments[u.id] || u.department || form.department || ''
                        )}
                      </span>
                    </span>
                  ))}
                </div>
              )}

              {/* Recurring Conditional Block */}
              {form.task_type === 'recurring' && (
                <div className="add-task-conditional-block">
                  <TaskFormSelect
                    name="recurrence_frequency"
                    label="Frequency"
                    value={form.recurrence_frequency}
                    onChange={handleSelectChange}
                    showDefaultOption
                    options={['daily', 'weekly', 'monthly', 'quarterly', 'annually', 'other'].map(f => ({ value: f, label: f[0].toUpperCase() + f.slice(1) }))}
                  />
                  {form.recurrence_frequency === 'other' && (
                    <FormInput
                      name="custom_recurrence_days"
                      label="Days"
                      type="number"
                      min="1"
                      value={form.custom_recurrence_days}
                      onChange={handleChange}
                    />
                  )}
                  <TaskFormSelect
                    name="recurrence_end_type"
                    label="End After"
                    value={form.recurrence_end_type}
                    onChange={handleSelectChange}
                    options={[
                      { value: 'never', label: 'Indefinitely' },
                      { value: 'on_date', label: 'On specific date' },
                      { value: 'after_occurrences', label: 'After occurrences' }
                    ]}
                  />
                  {form.recurrence_end_type === 'on_date' && (
                    <FormInput
                      name="recurrence_end_date"
                      label="End Date"
                      type="date"
                      value={form.recurrence_end_date}
                      onChange={handleChange}
                    />
                  )}
                  {form.recurrence_end_type === 'after_occurrences' && (
                    <FormInput
                      name="recurrence_end_occurrences"
                      label="Occurrences"
                      type="number"
                      min="1"
                      value={form.recurrence_end_occurrences}
                      onChange={handleChange}
                    />
                  )}
                </div>
              )}

              {/* Approver Conditional Block */}
              {form.workflow_type === 'approval_required' && (
                <div className="add-task-conditional-block add-task-conditional-block--full">
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
                    placeholder="Select approvers..."
                    renderOption={(user) => (
                      <div className="assign-user-option">
                        <div className="assign-user-name">{user.first_name} {user.last_name}</div>
                        <div className="assign-user-email">{user.email}</div>
                      </div>
                    )}
                  />
                </div>
              )}

              {/* Done When Section (MOV) */}
              <div className="done-when-section">
                <div className="done-when-header">
                  Done when... <span>Means of verification the assignee must tick off</span>
                </div>

                {movItems.map((item, index) => (
                  <div key={index} className="done-when-input-wrapper">
                    <span className="done-when-checkbox" aria-hidden="true" />
                    <input
                      type="text"
                      value={item.text}
                      onChange={(e) => handleMovChange(index, e.target.value)}
                      placeholder="e.g. Photo of all cameras live on the DVR uploaded"
                    />
                    {assignedUsers.length > 1 && (
                      <MovAssignmentPicker
                        assignedUsers={assignedUsers}
                        userId={item.user_id}
                        onChange={(userId) => handleMovUserChange(index, userId)}
                        onAssignAll={handleMovAssignAll}
                        disabled={submitting || !taskPerms.canCreate}
                      />
                    )}
                    {movItems.length > 1 && (
                      <button
                        type="button"
                        className="done-when-remove-btn"
                        onClick={() => handleMovRemove(index)}
                        title="Remove"
                        aria-label="Remove condition"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}

                <button type="button" className="done-when-add-btn" onClick={handleMovAdd}>
                  <FiPlus /> Add condition
                </button>
              </div>

              {/* Attachments */}
              <div className="attachment-dropzone">
                <TaskPendingAttachments
                  ref={attachmentsRef}
                  items={pendingAttachments}
                  onChange={setPendingAttachments}
                  disabled={submitting || !taskPerms.canCreate}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="add-task-footer">
              <label className="footer-checkbox-label">
                <input
                  type="checkbox"
                  checked={createAnother}
                  onChange={(e) => setCreateAnother(e.target.checked)}
                />
                Create another after this
              </label>

              <div className="footer-actions">
                <button
                  type="button"
                  className="add-task-cancel-btn"
                  onClick={handleBack}
                >
                  Cancel
                </button>
                <button
                  className="add-task-submit"
                  type="submit"
                  disabled={submitting || !taskPerms.canCreate}
                  title={createTitle}
                >
                  {submitting ? 'Submitting...' : 'Create task'}
                </button>
              </div>
            </div>

          </form>
        </div>
      </div>
    </>
  );
};

export default AddTask;
