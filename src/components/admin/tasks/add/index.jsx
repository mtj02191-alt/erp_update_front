import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import { toast } from 'react-toastify';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import FormInput from '../../../common/FormInput';
import FormTextarea from '../../../common/FormTextarea';
import SearchableMultiSelect from '../../../common/SearchableMultiSelect';
import { useAuth } from '../../../../context/AuthContext';
import { getTaskPermissions } from '../../../../utils/permissions';
import { tasksBasePath } from '../../../../utils/admin';
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
          <span className={`task-custom-select-value ${!value ? 'is-placeholder' : ''}`}>
            {getDisplayLabel()}
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
          <button type="button" className="task-custom-select-clear-btn" onClick={handleClear}>✕</button>
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

const AddTask = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, permissions } = useAuth();

  // Get default department from navigation state if available
  const defaultDept = location.state?.defaultDepartment || user?.department || '';

  const [form, setForm] = useState({
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
  const [reportedByUsers, setReportedByUsers] = useState([]);
  const [approverUsers, setApproverUsers] = useState([]);
  const [movItems, setMovItems] = useState(['']);
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [attachmentDescription, setAttachmentDescription] = useState('');
  const [showAttachment, setShowAttachment] = useState(false);
  const [showAttachmentTrigger, setShowAttachmentTrigger] = useState(false);

  const taskPerms = useMemo(
    () => getTaskPermissions(permissions || {}, user?.department, user?.role),
    [permissions, user?.department, user?.role],
  );
  
  const multiSelectParams = useMemo(() => ({ active: true }), []);
  
  // Custom search function for assignees - excludes the logged-in user (task creator)
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
  const userDisplayName = (u) => {
    const name = `${u?.first_name || ''} ${u?.last_name || ''}`.trim();
    return name || u?.email || '';
  };
  const formatDepartment = (dept) => {
    if (!dept) return '';
    return String(dept)
      .split('_')
      .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ''))
      .join(' ');
  };
  const handleMovChange = (index, value) => {
    setMovItems((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };
  const handleMovAdd = () => {
    setMovItems((prev) => [...prev, '']);
  };
  const handleMovRemove = (index) => {
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
    if (!form.description || !form.description.trim()) {
      validationErrors.push('Description is required.');
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
          .map((text) => String(text || '').trim())
          .filter((text) => text.length > 0)
      : [];
    if (movItemsCleanForValidation.length === 0) {
      validationErrors.push(
        'At least one Means of Verification (MOV) item is required for every task.'
      );
    }
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
    try {
      const movItemsClean = movItemsCleanForValidation;
      
      // FIXED: Do NOT encode MOV into description - send it separately via mov_checklist field
      const payload = {
        title: form.title,
        description: form.description || undefined,
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
        reported_by_id:
          Array.isArray(reportedByUsers) && reportedByUsers.length > 0
            ? reportedByUsers[0].id
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
          text,
          checked: false,
          checked_by_id: null,
          checked_at: null
        }))
      };
      const res = await axiosInstance.post('/tasks', payload);
      createdTaskId = res?.data?.data?.id;
      toast.success('Task created. Assignment emails will send if configured.');

      if (createdTaskId && showAttachment && attachmentFile) {
        try {
          const formData = new FormData();
          formData.append('file', attachmentFile);
          formData.append('is_initial', 'true');
          if (attachmentDescription) {
            formData.append('description', attachmentDescription);
          }
          await axiosInstance.post(
            `/tasks/${createdTaskId}/attachments/upload`,
            formData,
            {
              headers: {
                'Content-Type': 'multipart/form-data'
              }
            }
          );
          toast.success('Attachment uploaded successfully.');
        } catch (attErr) {
          console.error('Attachment upload error:', attErr);
          toast.error('Task created, but failed to upload attachment.');
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
      if (createdTaskId) {
        navigate(`${tasksBasePath()}/view/${createdTaskId}`);
      }
    }
  };

  return (
    <>
      <Navbar />
      <div className="add-task-page">
        <div className="add-task-card">
          <PageHeader title="Add Task" showBackButton={true} />
          {error && <div className="status-message status-message--error">{error}</div>}
          {submitting && (
            <div className="add-task-submitting-overlay">
              Creating task, please wait...
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="add-task-section">
              <div className="add-task-section-title">1. Basic Details</div>
              <div className="add-task-grid-2">
                 <ProjectProgramSelect
                  value={form.project_name}
                  onChange={handleProjectChange}
                />
                <FormInput name="title" label="Task title" value={form.title} onChange={handleChange} required />
               
              </div>
              <div className="add-task-grid-1">
                <FormTextarea
                  name="description"
                  label="Description"
                  value={form.description}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="add-task-section">
              <div className="add-task-section-title">2. Means of Verification (MOV)</div>
              <div className="add-task-grid-1">
                {movItems.map((value, index) => (
                  <div key={index} className="mov-item-row">
                    <FormInput
                      name={`mov_item_${index}`}
                      label={index === 0 ? 'MOV item' : ''}
                      value={value}
                      onChange={(e) => handleMovChange(index, e.target.value)}
                      placeholder="Define a clear, specific, and measurable verification point"
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
                <div className="mov-actions">
                  <button
                    type="button"
                    className="mov-item-add-button"
                    onClick={handleMovAdd}
                  >
                    + Add MOV item
                  </button>
                </div>
              </div>
            </div>

            <div className="add-task-section">
              <div className="add-task-section-title">3. Task Configuration</div>
              <div className="add-task-grid-2">
                 <TaskFormSelect
                  name="priority"
                  label="Priority"
                  value={form.priority}
                  onChange={handleSelectChange}
                  options={['low', 'medium', 'high', 'critical'].map((p) => ({
                    value: p,
                    label: p[0].toUpperCase() + p.slice(1)
                  }))}
                  required
                />
                <TaskFormSelect
                  name="workflow_type"
                  label="Workflow Type"
                  value={form.workflow_type}
                  onChange={handleSelectChange}
                  options={['standard', 'approval_required'].map((w) => ({
                    value: w,
                    label: w
                      .split('_')
                      .map((x) => x[0].toUpperCase() + x.slice(1))
                      .join(' ')
                  }))}
                  required
                />
                {form.workflow_type === 'approval_required' && (
                <div className="add-task-grid-1" style={{ marginTop: '1rem' }}>
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
                            {user.department} • {user.role || 'User'}
                          </div>
                        )}
                      </div>
                    )}
                  />
                </div>
              )}
                <TaskFormSelect
                  name="task_type"
                  label="Task Type"
                  value={form.task_type}
                  onChange={handleSelectChange}
                  options={[
                    { value: 'one_time', label: 'One-time task' },
                    { value: 'recurring', label: 'Recurring task' },
                    { value: 'project_linked', label: 'Project-linked task' }
                  ]}
                  required
                />
              </div>
              
              {form.task_type === 'recurring' && (
                <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #f3f4f6' }}>
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
                      required
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
                  
                  <div className="recurrence-end-section" style={{ marginTop: '1rem' }}>
                    <div className="form-label" style={{ fontWeight: 'bold', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#6b7280' }}>END CONDITION</div>
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
            </div>

            <div className="add-task-section">
              <div className="add-task-section-title">4. Assignment</div>
              <div className="add-task-grid-1">
                <SearchableMultiSelect
                  label="Assign Users"
                  onSearch={searchAssignees}
                  onSelect={(users) => setAssignedUsers(users)}
                  onClear={() => setAssignedUsers([])}
                  value={assignedUsers}
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
                          {user.department} • {user.role || 'User'}
                        </div>
                      )}
                    </div>
                  )}
                  placeholder="Select users to assign"
                />
                {assignedUsers.length > 0 && (
                  <div className="assign-users-hint">
                    {'\u2713'} {assignedUsers.length}{' '}
                    {assignedUsers.length === 1 ? 'user selected' : 'users selected'}
                  </div>
                )}
              </div>
              {assignedUsers.length > 0 && (
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
                          value={userDisplayName(u)}
                          onChange={() => {}}
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
                              user?.department ||
                              ''
                          )}
                          onChange={() => {}}
                          disabled
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="add-task-section">
              <div className="add-task-section-title">5. Schedule</div>
              <div className="add-task-grid-2">
                <FormInput
                  name="start_date"
                  label="Start Date"
                  type="date"
                  value={form.start_date}
                  onChange={handleChange}
                  required
                />
                <FormInput
                  name="due_date"
                  label={form.task_type === 'recurring' ? 'Due Date (of first task) - Auto-calculated' : 'Due Date'}
                  type="date"
                  value={form.due_date}
                  onChange={handleChange}
                  disabled={form.task_type === 'recurring' && form.recurrence_frequency}
                  required
                  placeholder={form.task_type === 'recurring' ? 'Select frequency to auto-calculate' : undefined}
                />
              </div>
              
              {/* {form.task_type === 'recurring' && (
                <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #f3f4f6' }}>
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
                      required
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
                  
                  <div className="recurrence-end-section" style={{ marginTop: '1rem' }}>
                    <div className="form-label" style={{ fontWeight: 'bold', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#6b7280' }}>END CONDITION</div>
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
              )} */}
            </div>

            <div className="add-task-section">
              <div className="add-task-section-title">6. Attachments</div>
              <div className="add-task-attachment-toggle">
                {!showAttachmentTrigger ? (
                  <div
                    className="attachment-prompt-wrapper"
                    onClick={() => setShowAttachmentTrigger(true)}
                  >
                    <span className="attachment-prompt-icon">📎</span>
                    <span className="attachment-prompt-text">
                      Click here if you want to add an initial attachment
                    </span>
                  </div>
                ) : (
                  <div className="add-task-grid-1">
                    <button
                      type="button"
                      className="mov-item-add-button"
                      style={{ width: 'fit-content', marginBottom: '1rem' }}
                      onClick={() => {
                        if (showAttachment) {
                          setAttachmentFile(null);
                          setAttachmentDescription('');
                        }
                        setShowAttachment(!showAttachment);
                      }}
                    >
                      {showAttachment ? '- Remove Attachment' : '+ Add Attachment'}
                    </button>
                    
                    {showAttachment && (
                      <div className="add-task-grid-2">
                        <div className="form-group">
                          <label className="form-label">File</label>
                          <input
                            type="file"
                            className="form-input"
                            onChange={(e) => setAttachmentFile(e.target.files[0] || null)}
                          />
                        </div>
                        <FormInput
                          name="attachmentDescription"
                          label="Attachment Description"
                          value={attachmentDescription}
                          onChange={(e) => setAttachmentDescription(e.target.value)}
                          placeholder="Optional notes about this file"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="add-task-footer">
              <button
                className="add-task-submit primary-button"
                type="submit"
                disabled={submitting || !taskPerms.canCreate}
                title={createTitle}
              >
                {submitting ? 'Submitting....' : 'Create Task'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default AddTask;