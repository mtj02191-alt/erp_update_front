import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiEye,
  FiEdit2,
  FiMessageSquare,
  FiPaperclip,
  FiPlus,
  FiSearch,
  FiUsers,
  FiList,
  FiMoreVertical,
  FiTrash2,
  FiChevronDown,
  FiChevronUp,
  FiChevronRight,
  FiClock,
  FiCheckSquare,
  FiSquare,
  FiSettings,
  FiDroplet,
  FiCornerDownRight,
  FiCheck,
  FiX,
  FiFilter,
  FiUserCheck,
  FiArrowUp,
  FiArrowDown,
  FiGrid,
  FiColumns,
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import axiosInstance from '../../../../utils/axios';
import { getTaskPermissions } from '../../../../utils/permissions';
import { tasksBasePath } from '../../../../utils/admin';
import './index.css';

// Convert HSL to hex color string
const hslToHex = (h, s, l) => {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
};

// Fixed status columns as requested
const KANBAN_COLUMNS = [
  { id: 1, name: 'Open', status: 'open', color: '#077af5' },
  { id: 2, name: 'In Progress', status: 'in_progress', color: '#fccf3a' },
  // { id: 3, name: 'Blocked', status: 'blocked', color: '#f87171' },
  { id: 4, name: 'Pending Approval', status: 'pending_approval', color: '#A281C7' },
  { id: 5, name: 'Approved', status: 'approved', color: '#61C0AA' },
  { id: 6, name: 'Rejected', status: 'rejected', color: '#f10a1d' },
  { id: 7, name: 'Completed', status: 'completed', color: '#0feb42' },
  { id: 8, name: 'Closed', status: 'closed', color: '#6b7280' },
  { id: 9, name: 'Cancelled', status: 'cancelled', color: '#f10a1d' },
];

const TaskKanbanBoard = ({
  tasks,
  filters,
  onFilterChange,
  onClearFilters,
  loading,
  user,
  permissions,
  searchInput,
  isSearchPending,
  handleSearchInputChange,
  approvalTasks,
  viewType,
  setViewType,
}) => {
  const navigate = useNavigate();
  const [draggedTask, setDraggedTask] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const [openMenuTaskId, setOpenMenuTaskId] = useState(null);
  const [deletingTaskId, setDeletingTaskId] = useState(null);
  const menuRef = useRef(null);
  const columnSelectorRef = useRef(null);
  const colorBarRef = useRef(null);
  const [openSubMenu, setOpenSubMenu] = useState(null); // 'color' | 'move' | null

  // Card colors stored in localStorage: { [taskId]: colorValue }
  const [cardColors, setCardColors] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('kanban_card_colors') || '{}');
    } catch { return {}; }
  });

  const setCardColor = (taskId, color) => {
    setCardColors((prev) => {
      const next = { ...prev };
      if (color) {
        next[taskId] = color;
      } else {
        delete next[taskId];
      }
      localStorage.setItem('kanban_card_colors', JSON.stringify(next));
      return next;
    });
    setOpenSubMenu(null);
  };

  const handleColorBarClick = (taskId, e) => {
    e.stopPropagation();
    const bar = colorBarRef.current;
    if (!bar) return;
    const rect = bar.getBoundingClientRect();
    // Clamp x within 0..width so edges give 0 and 360 degrees
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width - 1));
    const hue = Math.round((x / rect.width) * 360);
    const hex = hslToHex(hue, 80, 50);
    setCardColor(taskId, hex);
  };

  const handleMoveToStatus = async (task, targetStatus) => {
    if (String(task.status).toLowerCase() === String(targetStatus).toLowerCase()) {
      setOpenSubMenu(null);
      return;
    }
    try {
      setUpdatingStatus(task.id);
      await axiosInstance.post(`/tasks/${task.id}/status-transition`, { status: targetStatus, notes: '' });
      toast.success('Task moved successfully');
      window.location.reload();
    } catch (error) {
      console.error('Failed to move task', error);
      toast.error(error.response?.data?.message || 'Failed to move task');
    } finally {
      setUpdatingStatus(null);
      setOpenSubMenu(null);
    }
  };

  // Column visibility state — all columns visible by default
  const [visibleColumns, setVisibleColumns] = useState(() =>
    new Set(KANBAN_COLUMNS.map((c) => c.status))
  );
  const [showColumnSelector, setShowColumnSelector] = useState(false);

  // ─── Category Filter State ───
  const [activeCategory, setActiveCategory] = useState('assigned_to_me');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const categoryDropdownRef = useRef(null);

  const currentUserId = useMemo(() => (user?.id ? Number(user.id) : null), [user?.id]);

  const isManager = useMemo(() => {
    const role = String(user?.role || '').toLowerCase();
    return ['dept_head', 'manager', 'assistant_manager', 'team_lead', 'coordinator'].includes(role);
  }, [user?.role]);

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
    [currentUserId]
  );

  const isTaskAssignedToTeam = useCallback(
    (task) => {
      if (!user?.department || !task) return false;
      const meta = Array.isArray(task.assigned_users_meta) ? task.assigned_users_meta : [];
      return meta.some(
        (m) => m?.department === user.department && Number(m?.user_id) !== currentUserId
      );
    },
    [user?.department, currentUserId]
  );

  // Category-filtered task source — replaces `tasks` as input to getTasksForColumn
  const categoryFilteredTasks = useMemo(() => {
    if (activeCategory === 'approval_tasks') {
      return Array.isArray(approvalTasks) ? approvalTasks : [];
    }
    if (!Array.isArray(tasks)) return [];

    if (activeCategory === 'assigned_to_me') {
      return tasks.filter((t) => isTaskAssignedToCurrentUser(t));
    }
    if (activeCategory === 'assigned_to_team') {
      if (!isManager || !user?.department) return [];
      return tasks.filter((t) => !isTaskAssignedToCurrentUser(t) && isTaskAssignedToTeam(t));
    }
    if (activeCategory === 'other_tasks') {
      const approvalTaskIds = new Set(
        (Array.isArray(approvalTasks) ? approvalTasks : []).map((at) => Number(at.id))
      );
      return tasks.filter((t) => {
        if (isTaskAssignedToCurrentUser(t)) return false;
        if (isManager && isTaskAssignedToTeam(t)) return false;
        if (approvalTaskIds.has(Number(t.id))) return false;
        return true;
      });
    }
    return tasks;
  }, [tasks, approvalTasks, activeCategory, isTaskAssignedToCurrentUser, isTaskAssignedToTeam, isManager, user?.department]);

  // Pre-compute category counts for the dropdown badges
  const categoryCounts = useMemo(() => {
    const allTasks = Array.isArray(tasks) ? tasks : [];
    const approvalList = Array.isArray(approvalTasks) ? approvalTasks : [];
    const assignedToMe = allTasks.filter((t) => isTaskAssignedToCurrentUser(t)).length;
    const assignedToTeam = isManager
      ? allTasks.filter((t) => !isTaskAssignedToCurrentUser(t) && isTaskAssignedToTeam(t)).length
      : 0;
    const approvalIds = new Set(approvalList.map((at) => Number(at.id)));
    const otherTasks = allTasks.filter((t) => {
      if (isTaskAssignedToCurrentUser(t)) return false;
      if (isManager && isTaskAssignedToTeam(t)) return false;
      if (approvalIds.has(Number(t.id))) return false;
      return true;
    }).length;
    return {
      assigned_to_me: assignedToMe,
      assigned_to_team: assignedToTeam,
      other_tasks: otherTasks,
      approval_tasks: approvalList.length,
    };
  }, [tasks, approvalTasks, isTaskAssignedToCurrentUser, isTaskAssignedToTeam, isManager]);

  const CATEGORY_OPTIONS = [
    { key: 'assigned_to_me', label: 'Assigned to Me', icon: <FiUserCheck /> },
    { key: 'assigned_to_team', label: 'Assigned to Team', icon: <FiUsers />, managerOnly: true },
    { key: 'other_tasks', label: 'Assign to Other', icon: <FiList /> },
    { key: 'approval_tasks', label: 'Approval Tasks', icon: <FiCheckSquare /> },
  ];

  const activeCategoryLabel = CATEGORY_OPTIONS.find((c) => c.key === activeCategory)?.label || 'Category';

  // ─── Board Menu State ───
  const [showBoardMenu, setShowBoardMenu] = useState(false);
  const boardMenuRef = useRef(null);
  const boardColorBarRef = useRef(null);

  const [boardSortOrder, setBoardSortOrder] = useState(() =>
    localStorage.getItem('kanban_sort_order') || 'newest'
  );

  const [boardBgColor, setBoardBgColor] = useState(() => {
    try {
      return localStorage.getItem('kanban_board_bg') || '';
    } catch { return ''; }
  });

  const handleBoardSortChange = (order) => {
    setBoardSortOrder(order);
    localStorage.setItem('kanban_sort_order', order);
  };

  const handleBoardColorBarClick = (e) => {
    e.stopPropagation();
    const bar = boardColorBarRef.current;
    if (!bar) return;
    const rect = bar.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width - 1));
    const hue = Math.round((x / rect.width) * 360);
    const hex = hslToHex(hue, 70, 45);
    setBoardBgColor(hex);
    localStorage.setItem('kanban_board_bg', hex);
  };

  const clearBoardBgColor = () => {
    setBoardBgColor('');
    localStorage.removeItem('kanban_board_bg');
  };

  const taskPerms = getTaskPermissions(permissions || {}, user?.department, user?.role);
  
  const filterConfig = useMemo(() => [
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
  ], [filters.department, filters.status, filters.priority]);
  
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

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuTaskId(null);
      }
      if (columnSelectorRef.current && !columnSelectorRef.current.contains(event.target)) {
        setShowColumnSelector(false);
      }
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target)) {
        setShowCategoryDropdown(false);
      }
      if (boardMenuRef.current && !boardMenuRef.current.contains(event.target)) {
        setShowBoardMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getTasksForColumn = useCallback((status) => {
    if (!Array.isArray(categoryFilteredTasks)) {
      return [];
    }
    let columnTasks = categoryFilteredTasks.filter((t) => String(t.status).toLowerCase() === String(status).toLowerCase());
    
    // Apply task search filter
    if (filters.search) {
      columnTasks = columnTasks.filter(t => 
        t.title.toLowerCase().includes(filters.search.toLowerCase())
      );
    }
    // Apply user name filter
    if (filters.user_name) {
      const searchUser = filters.user_name.toLowerCase();
      columnTasks = columnTasks.filter(t => {
        const assignedNames = (t.assigned_users_meta || []).map(u => (u.name || '').toLowerCase());
        return assignedNames.some(name => name.includes(searchUser));
      });
    }
    // Apply department filter — match by assignee department (as shown on cards) or task department
    if (filters.department) {
      const filterDept = String(filters.department).toLowerCase();
      columnTasks = columnTasks.filter(t => {
        // Check assignee departments first (matches getDepartments display logic)
        if (Array.isArray(t.assigned_users_meta) && t.assigned_users_meta.length > 0) {
          return t.assigned_users_meta.some(u => 
            String(u.department || '').toLowerCase() === filterDept
          );
        }
        // Fall back to task.department
        return String(t.department || '').toLowerCase() === filterDept;
      });
    }
    // Apply status filter — only show tasks matching the selected status
    if (filters.status) {
      columnTasks = columnTasks.filter(t => 
        String(t.status).toLowerCase() === String(filters.status).toLowerCase()
      );
    }
    // Apply priority filter
    if (filters.priority) {
      columnTasks = columnTasks.filter(t => 
        String(t.priority).toLowerCase() === String(filters.priority).toLowerCase()
      );
    }
    
    // Apply sort order
    columnTasks.sort((a, b) => {
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();
      return boardSortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    return columnTasks;
  }, [categoryFilteredTasks, filters.search, filters.user_name, filters.department, filters.status, filters.priority, boardSortOrder]);

  const formatDate = (d) => {
    if (!d) return '-';
    const date = new Date(d);
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
  };

  const capitalize = (s) =>
    s ? s.split('_').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ') : '';

  const isTaskOverdue = (task) => {
    if (!task || !task.due_date) return false;
    const due = new Date(task.due_date);
    if (Number.isNaN(due.getTime())) return false;
    const now = new Date();
    const status = String(task.status || '').toLowerCase();
    if (['completed', 'closed', 'cancelled', 'approved'].includes(status)) return false;
    const dueNoon = new Date(due);
    dueNoon.setHours(12, 0, 0, 0);
    return now > dueNoon;
  };

  const handleDragStart = (e, task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', task.id.toString());
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, targetColumn) => {
    e.preventDefault();
    if (!draggedTask || draggedTask.status === targetColumn.status) {
      setDraggedTask(null);
      return;
    }
    try {
      setUpdatingStatus(draggedTask.id);
      const payload = { status: targetColumn.status, notes: '' };
      await axiosInstance.post(`/tasks/${draggedTask.id}/status-transition`, payload);
      toast.success('Task status updated');
      window.location.reload();
    } catch (error) {
      console.error('Failed to update task status', error);
      toast.error(error.response?.data?.message || 'Failed to update task status');
    } finally {
      setDraggedTask(null);
      setUpdatingStatus(null);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) {
      return;
    }
    try {
      setDeletingTaskId(taskId);
      await axiosInstance.delete(`/tasks/${taskId}`);
      toast.success('Task deleted successfully');
      window.location.reload();
    } catch (error) {
      console.error('Failed to delete task', error);
      toast.error(error.response?.data?.message || 'Failed to delete task');
    } finally {
      setDeletingTaskId(null);
      setOpenMenuTaskId(null);
    }
  };

  const getAssigneeNames = (task) => {
    if (!Array.isArray(task.assigned_users_meta) || task.assigned_users_meta.length === 0) {
      return 'Unassigned';
    }
    return task.assigned_users_meta.map((u) => u.name || 'User').join(', ');
  };

  const getDepartments = (task) => {
    if (Array.isArray(task.assigned_users_meta) && task.assigned_users_meta.length > 0) {
      return [...new Set(task.assigned_users_meta.map((m) => m.department).filter(Boolean))]
        .map((d) => capitalize(d))
        .join(', ');
    }
    return capitalize(task.department);
  };

  const toggleMenu = (taskId) => {
    setOpenMenuTaskId(openMenuTaskId === taskId ? null : taskId);
    setOpenSubMenu(null);
  };

  const toggleColumnVisibility = (status) => {
    setVisibleColumns((prev) => {
      const next = new Set(prev);
      if (next.has(status)) {
        // Prevent hiding the last visible column
        if (next.size > 1) next.delete(status);
      } else {
        next.add(status);
      }
      return next;
    });
  };

  const toggleAllColumns = () => {
    if (visibleColumns.size === KANBAN_COLUMNS.length) {
      // All visible → show only first column
      setVisibleColumns(new Set([KANBAN_COLUMNS[0].status]));
    } else {
      setVisibleColumns(new Set(KANBAN_COLUMNS.map((c) => c.status)));
    }
  };

  // Check if any filter is currently active
  const hasActiveFilters = useMemo(() => {
    return !!(filters.search || filters.user_name || filters.department || filters.status || filters.priority);
  }, [filters.search, filters.user_name, filters.department, filters.status, filters.priority]);

  // Pre-compute task counts per column for the selector and board rendering
  const columnTaskCounts = useMemo(() => {
    const counts = {};
    KANBAN_COLUMNS.forEach((col) => {
      counts[col.status] = getTasksForColumn(col.status).length;
    });
    return counts;
  }, [getTasksForColumn]);

  // Columns to display: respect manual toggle, and auto-hide empty columns when filters are active
  const visibleKanbanColumns = useMemo(() => {
    return KANBAN_COLUMNS.filter((c) => {
      // Respect manual column visibility toggle
      if (!visibleColumns.has(c.status)) return false;
      // When filters are active, hide columns with zero matching tasks
      if (hasActiveFilters && columnTaskCounts[c.status] === 0) return false;
      return true;
    });
  }, [visibleColumns, hasActiveFilters, columnTaskCounts]);

  return (
    <div className="kanban-container">
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
              value={filters.user_name || ''}
              onChange={(e) => onFilterChange('user_name', e.target.value)}
            />
          </div>
          <div className="filter-item select-item">
            <FiUsers className="filter-icon" />
            <select
              value={filters.department === null ? '' : filters.department}
              onChange={(e) => onFilterChange('department', e.target.value)}
            >
              <option value="">Department</option>
              {filterConfig[0].options.map(opt => (
                <option key={opt.value} value={opt.value} style={{ textTransform: 'uppercase' }}>{opt.label}</option>
              ))}
            </select>
            <FiChevronDown className="chevron-icon" />
          </div>

          <div className="filter-item select-item">
            <FiClock className="filter-icon" />
            <select
              value={filters.status}
              onChange={(e) => onFilterChange('status', e.target.value)}
            >
              <option value="">Status</option>
              {filterConfig[1].options.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <FiChevronDown className="chevron-icon" />
          </div>

          <div className="filter-item select-item">
            <FiList className="filter-icon" />
            <select
              value={filters.priority}
              onChange={(e) => onFilterChange('priority', e.target.value)}
            >
              <option value="">Priority</option>
              {filterConfig[2].options.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <FiChevronDown className="chevron-icon" />
          </div>

          <button className="filter-clear-btn" onClick={onClearFilters} disabled={loading}>
            Clear
          </button>

        {/* <button
          className="tasks-add-btn"
          onClick={taskPerms.canCreate ? () => navigate(`${tasksBasePath()}/add`, { state: { defaultDepartment: user?.department } }) : undefined}
          disabled={!taskPerms.canCreate}
          title={hoverText('create')}
        >
          <FiPlus />
        </button> */}   
        
        </div>
      <div className="kanban-toolbar-row">
        {/* ─── Category Dropdown ─── */}
        <div className="kanban-category-dropdown" ref={categoryDropdownRef}>
          <button
            className="kanban-category-btn"
            onClick={() => setShowCategoryDropdown((v) => !v)}
          >
            <FiFilter className="category-icon" />
            <span className="category-active-label">{activeCategoryLabel}</span>
            <span className="category-count-badge">{categoryCounts[activeCategory] ?? 0}</span>
            {showCategoryDropdown ? <FiChevronUp /> : <FiChevronDown />}
          </button>
          {showCategoryDropdown && (
            <div className="kanban-category-menu">
              <div className="category-menu-header">
                <span>Filter by category</span>
              </div>
              <div className="category-menu-list">
                {CATEGORY_OPTIONS.filter((opt) => !opt.managerOnly || isManager).map((opt) => {
                  const isActive = activeCategory === opt.key;
                  const count = categoryCounts[opt.key] ?? 0;
                  return (
                    <button
                      key={opt.key}
                      className={`category-menu-item ${isActive ? 'active' : ''}`}
                      onClick={() => {
                        setActiveCategory(opt.key);
                        setShowCategoryDropdown(false);
                      }}
                    >
                      <span className="category-menu-icon">{opt.icon}</span>
                      <span className="category-menu-label">{opt.label}</span>
                      <span className={`category-menu-count ${count === 0 ? 'empty' : ''}`}>{count}</span>
                      {isActive && <FiCheck className="category-menu-check" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ─── Board Settings Menu ─── */}
        <div className="kanban-board-menu" ref={boardMenuRef}>
          <button
            className="kanban-board-menu-btn"
            onClick={() => setShowBoardMenu((v) => !v)}
            title="Board settings"
          >
            <FiGrid />
          </button>
          {showBoardMenu && (
            <div className="kanban-board-menu-dropdown">
              {/* ─── Background Color Section ─── */}
              <div className="board-menu-section">
                <div className="board-menu-section-header">
                  <FiDroplet className="board-menu-section-icon" />
                  <span>Background Color</span>
                  {boardBgColor && (
                    <button className="board-menu-clear-btn" onClick={clearBoardBgColor}>
                      <FiX /> Clear
                    </button>
                  )}
                </div>
                {boardBgColor && (
                  <div className="board-color-preview" style={{ backgroundColor: boardBgColor }}>
                    <span className="board-color-hex">{boardBgColor}</span>
                  </div>
                )}
                <div className="board-color-bar-wrapper">
                  <div
                    ref={boardColorBarRef}
                    className="board-color-bar"
                    onClick={handleBoardColorBarClick}
                  />
                  {boardBgColor && (
                    <div
                      className="board-color-bar-indicator"
                      style={{
                        left: `${(() => {
                          const hex = boardBgColor;
                          const r = parseInt(hex.slice(1,3),16)/255;
                          const g = parseInt(hex.slice(3,5),16)/255;
                          const b = parseInt(hex.slice(5,7),16)/255;
                          const max = Math.max(r,g,b), min = Math.min(r,g,b);
                          let h = 0;
                          if (max !== min) {
                            const d = max - min;
                            if (max === r) h = ((g-b)/d + (g<b?6:0))/6;
                            else if (max === g) h = ((b-r)/d + 2)/6;
                            else h = ((r-g)/d + 4)/6;
                          }
                          return `${Math.round(h * 100)}%`;
                        })()}`,
                      }}
                    />
                  )}
                </div>
              </div>

              <div className="board-menu-divider" />

              {/* ─── Task Sorting Section ─── */}
              <div className="board-menu-section">
                <div className="board-menu-section-header">
                  <FiClock className="board-menu-section-icon" />
                  <span>Task Sorting</span>
                </div>
                <div className="board-sort-options">
                  <button
                    className={`board-sort-option ${boardSortOrder === 'newest' ? 'active' : ''}`}
                    onClick={() => handleBoardSortChange('newest')}
                  >
                    <FiArrowDown />
                    <span>Newest First</span>
                    {boardSortOrder === 'newest' && <FiCheck className="sort-check" />}
                  </button>
                  <button
                    className={`board-sort-option ${boardSortOrder === 'oldest' ? 'active' : ''}`}
                    onClick={() => handleBoardSortChange('oldest')}
                  >
                    <FiArrowUp />
                    <span>Oldest First</span>
                    {boardSortOrder === 'oldest' && <FiCheck className="sort-check" />}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Column Visibility Selector */}
        <div className="kanban-column-selector-wrapper" ref={columnSelectorRef}>
        <button
          className="kanban-column-selector-btn"
          onClick={() => setShowColumnSelector((v) => !v)}
        >
          <FiEye  style={{ color: 'green' }} />
          <span>Show/hide columns</span>
          {showColumnSelector ? <FiChevronUp /> : <FiChevronDown />}
        </button>

        {showColumnSelector && (
          <div className="kanban-column-dropdown">
            <div className="column-dropdown-header">
              <span>Visible columns</span>
              <button className="toggle-all-btn" onClick={toggleAllColumns}>
                {visibleColumns.size === KANBAN_COLUMNS.length ? 'Hide all' : 'Show all'}
              </button>
            </div>
            <div className="column-dropdown-list">
              {KANBAN_COLUMNS.map((col) => {
                const isVisible = visibleColumns.has(col.status);
                const taskCount = columnTaskCounts[col.status] || 0;
                return (
                  <button
                    key={col.status}
                    className={`column-dropdown-item ${isVisible ? 'active' : ''}`}
                    onClick={() => toggleColumnVisibility(col.status)}
                  >
                    {isVisible ? (
                      <FiCheckSquare className="col-check-icon checked" />
                    ) : (
                      <FiSquare className="col-check-icon unchecked" />
                    )}
                    <span
                      className="col-color-dot"
                      style={{ backgroundColor: col.color }}
                    />
                    <span className="col-label">{col.name}</span>
                    <span className={`col-task-count ${taskCount === 0 ? 'empty' : ''}`}>{taskCount}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
        </div>
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
      </div>

      <div
        className={`kanban-board ${boardBgColor ? 'kanban-board-custom-bg' : ''}`}
        style={boardBgColor ? { backgroundColor: boardBgColor } : undefined}
      >
        {visibleKanbanColumns.map((column) => {
          const columnTasks = getTasksForColumn(column.status);
          const isOpenColumn = column.status === 'open';
          return (
            <div
              key={column.id}
              className="kanban-column"
              ref={(el) => {
                if (el) {
                  el.style.setProperty('--col-width', el.getBoundingClientRect().width + 'px');
                }
              }}
              style={{ borderTopColor: column.color }}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column)}
            >
              <div className="column-header">
                <div className="column-header-left">
                  <span className="column-title">{column.name}</span>
                  <span className="column-count">{columnTasks.length}</span>
                </div>
              </div>
              <div className="column-tasks">
                {columnTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`kanban-task-card ${isTaskOverdue(task) ? 'task-overdue' : ''} ${updatingStatus === task.id ? 'task-updating' : ''} ${openMenuTaskId === task.id ? 'menu-open' : ''} ${cardColors[task.id] ? 'has-card-color' : ''}`}
                    style={cardColors[task.id] ? (() => {
                      const r = parseInt(cardColors[task.id].slice(1, 3), 16);
                      const g = parseInt(cardColors[task.id].slice(3, 5), 16);
                      const b = parseInt(cardColors[task.id].slice(5, 7), 16);
                      const mr = Math.round(r * 0.3 + 255 * 0.7);
                      const mg = Math.round(g * 0.3 + 255 * 0.7);
                      const mb = Math.round(b * 0.3 + 255 * 0.7);
                      const lum = (0.299 * mr + 0.587 * mg + 0.114 * mb) / 255;
                      const txt = lum > 0.5 ? '#1e293b' : '#ffffff';
                      const txtSec = lum > 0.5 ? 'rgba(30,41,59,0.7)' : 'rgba(255,255,255,0.8)';
                      const txtMut = lum > 0.5 ? 'rgba(30,41,59,0.5)' : 'rgba(255,255,255,0.6)';
                      return {
                        backgroundColor: `rgb(${mr},${mg},${mb})`,
                        borderColor: cardColors[task.id],
                        '--card-text': txt,
                        '--card-text-secondary': txtSec,
                        '--card-text-muted': txtMut,
                      };
                    })() : undefined}
                    draggable={taskPerms.canUpdate}
                    onDragStart={(e) => handleDragStart(e, task)}
                  >
                    <div className="task-header">
                      <div className="task-badges">
                        <span className={`priority-badge priority-${task.priority}`}>{capitalize(task.priority)}</span>
                      </div>
                      <div className="task-actions-menu" ref={openMenuTaskId === task.id ? menuRef : null}>
                        <button
                          className="task-menu-button"
                          onClick={() => toggleMenu(task.id)}
                          disabled={deletingTaskId === task.id}
                        >
                          <FiMoreVertical />
                        </button>
                        {openMenuTaskId === task.id && (
                          <div className="task-dropdown-menu task-dropdown-menu-enhanced">
                            {/* ─── Color Picker ─── */}
                            <div
                              className={`task-menu-item task-menu-item-submenu ${openSubMenu === 'color' ? 'submenu-open' : ''}`}
                              onClick={() => setOpenSubMenu(openSubMenu === 'color' ? null : 'color')}
                            >
                              <FiDroplet />
                              <span>Change Color</span>
                              {cardColors[task.id] && (
                                <span className="active-color-preview" style={{ backgroundColor: cardColors[task.id] }} />
                              )}
                              <FiChevronRight className="submenu-arrow" />
                              {openSubMenu === 'color' && (
                                <div className="task-submenu task-submenu-color" onClick={(e) => e.stopPropagation()}>
                                  <div className="cp-header">
                                    <span className="cp-title">Card Color</span>
                                    {cardColors[task.id] && (
                                      <button className="cp-clear-btn" onClick={() => setCardColor(task.id, '')}>
                                        <FiX /> Remove
                                      </button>
                                    )}
                                  </div>
                                  {cardColors[task.id] && (
                                    <div className="cp-preview" style={{ backgroundColor: cardColors[task.id] }}>
                                      <span className="cp-preview-hex">{cardColors[task.id]}</span>
                                    </div>
                                  )}
                                  <div className="cp-bar-wrapper">
                                    <div
                                      ref={colorBarRef}
                                      className="cp-bar"
                                      onClick={(e) => handleColorBarClick(task.id, e)}
                                    />
                                    {cardColors[task.id] && (
                                      <div
                                        className="cp-bar-indicator"
                                        style={{
                                          left: `${(() => {
                                            const hex = cardColors[task.id];
                                            const r = parseInt(hex.slice(1,3),16)/255;
                                            const g = parseInt(hex.slice(3,5),16)/255;
                                            const b = parseInt(hex.slice(5,7),16)/255;
                                            const max = Math.max(r,g,b), min = Math.min(r,g,b);
                                            let h = 0;
                                            if (max !== min) {
                                              const d = max - min;
                                              if (max === r) h = ((g-b)/d + (g<b?6:0))/6;
                                              else if (max === g) h = ((b-r)/d + 2)/6;
                                              else h = ((r-g)/d + 4)/6;
                                            }
                                            return `${Math.round(h * 100)}%`;
                                          })()}`,
                                        }}
                                      />
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* ─── Move Task To ─── */}
                            <div
                              className={`task-menu-item task-menu-item-submenu ${openSubMenu === 'move' ? 'submenu-open' : ''}`}
                              onClick={() => setOpenSubMenu(openSubMenu === 'move' ? null : 'move')}
                            >
                              <FiCornerDownRight />
                              <span>Move To</span>
                              <FiChevronRight className="submenu-arrow" />
                              {openSubMenu === 'move' && (
                                <div className="task-submenu task-submenu-move" onClick={(e) => e.stopPropagation()}>
                                  <div className="move-header">
                                    <span className="move-title">Move to column</span>
                                  </div>
                                  <div className="move-list">
                                    {KANBAN_COLUMNS.map((col) => {
                                      const isCurrent = String(task.status).toLowerCase() === String(col.status).toLowerCase();
                                      return (
                                        <button
                                          key={col.status}
                                          className={`move-item ${isCurrent ? 'move-item-current' : ''}`}
                                          disabled={!taskPerms.canUpdate || isCurrent}
                                          onClick={() => handleMoveToStatus(task, col.status)}
                                        >
                                          <span
                                            className={`move-checkbox ${isCurrent ? 'move-checkbox-checked' : ''}`}
                                            style={isCurrent ? { borderColor: col.color, backgroundColor: col.color } : undefined}
                                          >
                                            {isCurrent && <FiCheck className="move-checkbox-icon" />}
                                          </span>
                                          <span className="move-item-label">
                                            <span className="move-status-bar" style={{ backgroundColor: col.color }} />
                                            {col.name}
                                          </span>
                                          {isCurrent && <span className="move-current-tag">Current</span>}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="task-menu-divider" />

                            {/* View Task */}
                            <button
                              className="task-menu-item"
                              onClick={() => {
                                if (taskPerms.canViewDetail) navigate(`${tasksBasePath()}/view/${task.id}`);
                              }}
                              disabled={!taskPerms.canViewDetail}
                            >
                              <FiEye />
                              View Task
                            </button>

                            {/* Edit Task */}
                            <button
                              className="task-menu-item"
                              onClick={() => {
                                if (taskPerms.canUpdate) navigate(`${tasksBasePath()}/update/${task.id}`);
                              }}
                              disabled={!taskPerms.canUpdate}
                            >
                              <FiEdit2 />
                              Edit Task
                            </button>

                            <div className="task-menu-divider" />

                            {/* Delete Task */}
                            <button
                              className="task-menu-item task-menu-item-danger"
                              onClick={() => handleDeleteTask(task.id)}
                              disabled={deletingTaskId === task.id}
                            >
                              <FiTrash2 />
                              {deletingTaskId === task.id ? 'Deleting...' : 'Delete Task'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <h4 className="task-title">{task.title}</h4>
                    <div className="task-meta">
                      <span className="task-department">{getDepartments(task)}</span>
                      <span className="task-assignee">{getAssigneeNames(task)}</span>
                      {task.due_date && (
                        <span className={`task-due-date ${isTaskOverdue(task) ? 'task-due-date-overdue' : 'task-due-date-normal'}`}>
                          {isTaskOverdue(task) ? `Overdue ${Math.ceil((new Date() - new Date(task.due_date)) / (1000 * 60 * 60 * 24))}d` : `Due ${formatDate(task.due_date)}`}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {/* Add Task button only on Open column */}
                {isOpenColumn && (
                  <button
                    className="add-task-btn"
                    onClick={() => navigate(`${tasksBasePath()}/add`, { state: { defaultDepartment: user?.department } })}
                    disabled={!taskPerms.canCreate}
                  >
                    <FiPlus /> Add Task
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TaskKanbanBoard;
