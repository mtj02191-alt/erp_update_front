import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FiPlus, FiUserCheck, FiUsers, FiList } from 'react-icons/fi';
import { toast } from 'react-toastify';
import axiosInstance from '../../../../utils/axios';
import Navbar from '../../../Navbar';
import Loader from '../../../common/loader/Loader';
import { useAuth } from '../../../../context/AuthContext';
import { getTaskPermissions } from '../../../../utils/permissions';
import TaskViewModal from '../view/TaskViewModal';
import TaskFormModal from './TaskFormModal';
import TaskCardMenu from './TaskCardMenu';
import BoardColumnPicker from './BoardColumnPicker';
import TaskViewModeSwitch from '../shared/TaskViewModeSwitch';
import TaskAssigneeFilter from '../shared/TaskAssigneeFilter';
import {
  RefreshButton,
  SearchFilter,
  DropdownFilter,
  CollapsibleFilters,
  SearchButton,
  ClearButton,
} from '../../../common/filters';
import useFiltersPanel from '../../../../hooks/useFiltersPanel';
import useTasksServerQuery from '../shared/useTasksServerQuery';
import {
  TASK_DEPARTMENT_OPTIONS,
  TASK_PROJECT_PROGRAM_OPTIONS,
} from '../shared/taskFilterOptions';
import {
  BOARD_COLUMNS,
  BOARD_COLUMN_IDS,
  CARD_COLOR_OPTIONS,
  CARD_COLORS_STORAGE_KEY,
  loadVisibleColumnIds,
  saveVisibleColumnIds,
} from './taskBoardConfig';
import './index.css';

const TasksBoard = ({ viewMode = 'kanban', onViewModeChange, refreshNonce = 0 }) => {
  const { user, permissions } = useAuth();
  const { filtersOpen, toggleFilters } = useFiltersPanel();
  const [assignedUser, setAssignedUser] = useState(null);
  const [activeTab, setActiveTab] = useState('assigned_to_me');
  const [draggingTaskId, setDraggingTaskId] = useState(null);
  const [dropColumnId, setDropColumnId] = useState(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [taskFormModal, setTaskFormModal] = useState({ mode: null, taskId: null });
  const [didDrag, setDidDrag] = useState(false);
  const [openMenuTaskId, setOpenMenuTaskId] = useState(null);
  const [menuSubmenu, setMenuSubmenu] = useState(null);
  const [cardColors, setCardColors] = useState(() => {
    try {
      const raw = localStorage.getItem(CARD_COLORS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });
  const [columnPickerOpen, setColumnPickerOpen] = useState(false);
  const [visibleColumnIds, setVisibleColumnIds] = useState(() => loadVisibleColumnIds(null));
  const pendingRollbackRef = useRef(new Map());
  const statusRequestRef = useRef(0);
  const tasksRef = useRef([]);

  const {
    tasks,
    setTasks,
    loading,
    error,
    categoryCounts,
    tempFilters,
    handleFilterChange,
    handleApplyFilters,
    handleClearFilters,
    setCurrentPage,
    refresh,
  } = useTasksServerQuery({
    storagePrefix: 'tasks-board',
    defaultPageSize: -1,
    defaultSortField: 'updated_at',
    activeTab,
    assignedUser,
    refreshNonce,
  });

  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  const currentUserId = user?.id ? Number(user.id) : null;

  useEffect(() => {
    setVisibleColumnIds(loadVisibleColumnIds(currentUserId));
  }, [currentUserId]);

  const taskPerms = useMemo(
    () => getTaskPermissions(permissions || {}, user?.department, user?.role),
    [permissions, user?.department, user?.role],
  );

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
      return [...ids, ...metaIds]
        .map((v) => Number(v))
        .filter((n) => Number.isInteger(n) && n > 0)
        .includes(currentUserId);
    },
    [currentUserId],
  );

  const visibleTasks = useMemo(() => (Array.isArray(tasks) ? tasks : []), [tasks]);

  const tasksByColumn = useMemo(() => {
    const map = Object.fromEntries(BOARD_COLUMNS.map((c) => [c.id, []]));
    visibleTasks.forEach((task) => {
      const status = String(task.status || 'open').toLowerCase();
      const columnId = BOARD_COLUMN_IDS.has(status) ? status : 'open';
      map[columnId].push(task);
    });
    return map;
  }, [visibleTasks]);

  const visibleBoardColumns = useMemo(
    () => BOARD_COLUMNS.filter((col) => visibleColumnIds.has(col.id)),
    [visibleColumnIds],
  );

  const columnCounts = useMemo(() => {
    const counts = Object.fromEntries(BOARD_COLUMNS.map((c) => [c.id, 0]));
    visibleTasks.forEach((task) => {
      const status = String(task.status || 'open').toLowerCase();
      const columnId = BOARD_COLUMN_IDS.has(status) ? status : 'open';
      counts[columnId] = (counts[columnId] || 0) + 1;
    });
    return counts;
  }, [visibleTasks]);

  const persistVisibleColumns = useCallback(
    (nextSet) => {
      setVisibleColumnIds(nextSet);
      saveVisibleColumnIds(currentUserId, nextSet);
    },
    [currentUserId],
  );

  const handleToggleColumnVisibility = (columnId) => {
    setVisibleColumnIds((prev) => {
      const next = new Set(prev);
      if (next.has(columnId)) {
        if (next.size <= 1) {
          toast.info('At least one column must stay visible.');
          return prev;
        }
        next.delete(columnId);
      } else {
        next.add(columnId);
      }
      saveVisibleColumnIds(currentUserId, next);
      return next;
    });
  };

  const handleShowAllColumns = () => {
    const next = new Set(BOARD_COLUMNS.map((c) => c.id));
    persistVisibleColumns(next);
  };

  const handleHideAllColumns = () => {
    const next = new Set(['open']);
    persistVisibleColumns(next);
    toast.info('Only Open column is shown. Use Show all to restore every column.');
  };

  const tabCounts = useMemo(
    () => ({
      assigned_to_me: categoryCounts.assigned_to_me || 0,
      assigned_to_team: categoryCounts.assigned_to_team || 0,
      other_tasks: categoryCounts.other_tasks || 0,
    }),
    [categoryCounts],
  );

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const handleClearAll = () => {
    setAssignedUser(null);
    handleClearFilters();
    setActiveTab('assigned_to_me');
  };

  const statusFilterOptions = useMemo(
    () => [
      'open',
      'in_progress',
      'pending_approval',
      'approved',
      'rejected',
      'completed',
      'closed',
      'cancelled',
    ].map((s) => ({
      value: s,
      label: s.split('_').map((w) => w[0].toUpperCase() + w.slice(1)).join(' '),
    })),
    [],
  );

  const priorityFilterOptions = useMemo(
    () => ['low', 'medium', 'high', 'critical'].map((p) => ({
      value: p,
      label: p[0].toUpperCase() + p.slice(1),
    })),
    [],
  );

  const canChangeStatus = useCallback(
    (task) => {
      const canUpdate = taskPerms.canUpdate === true;
      const isAssignee = isTaskAssignedToCurrentUser(task);
      const canChangeAsAssignee =
        isAssignee && (taskPerms.canUpdate === true || taskPerms.canComplete === true);
      return canUpdate || canChangeAsAssignee;
    },
    [taskPerms, isTaskAssignedToCurrentUser],
  );

  const handleStatusChange = async (task, nextStatus) => {
    if (!task?.id) return;
    const taskId = Number(task.id);
    const current = String(task.status || 'open').toLowerCase();
    const normalizedNext = String(nextStatus || '').toLowerCase();
    if (current === normalizedNext) return;
    if (!canChangeStatus(task)) {
      toast.error('You do not have permission to update this task status.');
      return;
    }

    const requestId = statusRequestRef.current + 1;
    statusRequestRef.current = requestId;

    let rollbackTask = null;
    setTasks((prev) => {
      const existing = prev.find((t) => Number(t.id) === taskId);
      if (existing) {
        rollbackTask = { ...existing };
        pendingRollbackRef.current.set(taskId, rollbackTask);
      }
      return prev.map((t) =>
        Number(t.id) === taskId ? { ...t, status: normalizedNext } : t,
      );
    });

    if (!rollbackTask) {
      rollbackTask = { ...task, status: current };
      pendingRollbackRef.current.set(taskId, rollbackTask);
    }

    setStatusUpdatingId(taskId);
    setDraggingTaskId(null);

    try {
      const res = await axiosInstance.post(`/tasks/${taskId}/status-transition`, {
        status: normalizedNext,
        notes: '',
      });

      if (requestId !== statusRequestRef.current) return;

      if (res.data?.success === false) {
        throw new Error(res.data?.message || 'Failed to update status.');
      }

      pendingRollbackRef.current.delete(taskId);
      const updated = res.data?.data;
      setTasks((prev) =>
        prev.map((t) =>
          Number(t.id) === taskId ? { ...t, ...(updated || { status: normalizedNext }) } : t,
        ),
      );
      toast.success('Status updated.');
    } catch (e) {
      if (requestId !== statusRequestRef.current) return;

      const snapshot = pendingRollbackRef.current.get(taskId) || rollbackTask;
      if (snapshot) {
        setTasks((prev) =>
          prev.map((t) => (Number(t.id) === taskId ? { ...snapshot } : t)),
        );
      }
      pendingRollbackRef.current.delete(taskId);

      const message =
        e.response?.data?.message || e.message || 'Failed to update status.';
      toast.error(message);
    } finally {
      if (requestId === statusRequestRef.current) {
        setStatusUpdatingId(null);
      }
    }
  };

  const handleDragStart = (e, task) => {
    if (!canChangeStatus(task)) {
      e.preventDefault();
      return;
    }
    setDidDrag(true);
    setDraggingTaskId(task.id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(task.id));
  };

  const handleDragEnd = () => {
    setDraggingTaskId(null);
    setDropColumnId(null);
    setTimeout(() => setDidDrag(false), 0);
  };

  const openTaskModal = (taskId) => {
    if (!taskPerms.canViewDetail) return;
    setSelectedTaskId(taskId);
  };

  const openTaskFormModal = (mode, taskId = null) => {
    setTaskFormModal({ mode, taskId });
    setOpenMenuTaskId(null);
    setMenuSubmenu(null);
  };

  const closeTaskFormModal = () => {
    setTaskFormModal({ mode: null, taskId: null });
  };

  const handleTaskFormSaved = async (savedTask) => {
    closeTaskFormModal();
    if (!savedTask?.id) {
      refresh();
      return;
    }
    refresh();
  };

  const handleTaskUpdatedFromModal = (updated) => {
    if (!updated?.id) return;
    setTasks((prev) =>
      prev.map((t) => (Number(t.id) === Number(updated.id) ? { ...t, ...updated } : t)),
    );
  };

  const getCardColorStyle = (taskId) => {
    const colorId = cardColors[taskId] || 'default';
    const opt = CARD_COLOR_OPTIONS.find((c) => c.id === colorId) || CARD_COLOR_OPTIONS[0];
    return {
      backgroundColor: opt.value,
      borderColor: opt.border,
    };
  };

  const handleCardColorChange = (taskId, colorId) => {
    setCardColors((prev) => {
      const next = { ...prev, [taskId]: colorId };
      localStorage.setItem(CARD_COLORS_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const closeCardMenu = () => {
    setOpenMenuTaskId(null);
    setMenuSubmenu(null);
  };

  const deleteTask = async (task) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await axiosInstance.delete(`/tasks/${task.id}`);
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
      toast.success('Task deleted.');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to delete task.');
    }
  };

  const canEditTask = (task) => {
    const status = String(task.status || '').toLowerCase();
    const canEditCompleted = taskPerms.canEditCompleted === true;
    return taskPerms.canUpdate && (status !== 'completed' || canEditCompleted);
  };

  const handleColumnDragOver = (e, columnId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropColumnId(columnId);
  };

  const handleColumnDrop = (e, columnId) => {
    e.preventDefault();
    setDropColumnId(null);
    const taskId = Number(e.dataTransfer.getData('text/plain'));
    if (!taskId) return;
    const task = tasksRef.current.find((t) => Number(t.id) === taskId);
    if (!task) return;
    setDraggingTaskId(null);
    handleStatusChange(task, columnId);
  };

  const formatDate = (d) => {
    if (!d) return null;
    const date = new Date(d);
    if (Number.isNaN(date.getTime())) return null;
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
  };

  const isOverdue = (task) => {
    if (!task?.due_date) return false;
    const status = String(task.status || '').toLowerCase();
    if (['completed', 'closed', 'cancelled'].includes(status)) return false;
    const dueNoon = new Date(task.due_date);
    dueNoon.setHours(12, 0, 0, 0);
    return new Date() > dueNoon;
  };

  const capitalize = (s) =>
    s ? String(s).split('_').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ') : '';

  return (
    <>
      <Navbar />
      <Loader loading={loading} />
      <div className="trello-board-wrapper">
        {/* <PageHeader title="Tasks Board" showBackButton={false} showAdd={false} /> */}
        <div className="trello-board-content">
          <div className="trello-board-toolbar">
            <div className="trello-board-toolbar-top">
              <div className="tl-scope-switch" role="tablist" aria-label="Task scope">
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'assigned_to_me'}
                  className={`tl-scope-switch__btn ${activeTab === 'assigned_to_me' ? 'is-active is-mine' : ''}`}
                  onClick={() => handleTabChange('assigned_to_me')}
                  title="Assigned to me"
                >
                  <FiUserCheck />
                  <span className="tl-scope-switch__label">Me</span>
                  <span className="tl-scope-switch__count">{tabCounts.assigned_to_me}</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'other_tasks'}
                  className={`tl-scope-switch__btn ${activeTab === 'other_tasks' ? 'is-active is-other' : ''}`}
                  onClick={() => handleTabChange('other_tasks')}
                  title="Assigned by me"
                >
                  <FiList />
                  <span className="tl-scope-switch__label">Others</span>
                  <span className="tl-scope-switch__count">{tabCounts.other_tasks}</span>
                </button>
                {isManager && (
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === 'assigned_to_team'}
                    className={`tl-scope-switch__btn ${activeTab === 'assigned_to_team' ? 'is-active is-team' : ''}`}
                    onClick={() => handleTabChange('assigned_to_team')}
                    title="Assigned to team"
                  >
                    <FiUsers />
                    <span className="tl-scope-switch__label">Team</span>
                    <span className="tl-scope-switch__count">{tabCounts.assigned_to_team}</span>
                  </button>
                )}
              </div>

              <div className="trello-board-toolbar-assignee">
                <TaskAssigneeFilter
                  value={assignedUser}
                  onSelect={setAssignedUser}
                  onClear={() => setAssignedUser(null)}
                  placeholder="Filter by assignee..."
                />
              </div>

              <div className="trello-board-toolbar-right">
                <button
                  type="button"
                  className="tl-filter-clear-btn"
                  onClick={toggleFilters}
                >
                  {filtersOpen ? 'Hide filters' : 'Show filters'}
                </button>
                <BoardColumnPicker
                  open={columnPickerOpen}
                  onToggle={() => setColumnPickerOpen((prev) => !prev)}
                  onClose={() => setColumnPickerOpen(false)}
                  visibleColumnIds={visibleColumnIds}
                  columnCounts={columnCounts}
                  onToggleColumn={handleToggleColumnVisibility}
                  onShowAll={handleShowAllColumns}
                  onHideAll={handleHideAllColumns}
                />

                <TaskViewModeSwitch value={viewMode} onChange={onViewModeChange} />

                <button
                  type="button"
                  className="trello-board-add-btn"
                  title="Add task"
                  disabled={!taskPerms.canCreate}
                  onClick={
                    taskPerms.canCreate
                      ? () => openTaskFormModal('add')
                      : undefined
                  }
                >
                  <FiPlus />
                </button>
              </div>
            </div>

            <CollapsibleFilters open={filtersOpen}>
            <div className="trello-board-toolbar-filters filters-section">
              <SearchFilter
                filterKey="search"
                label="Search"
                filters={tempFilters}
                onFilterChange={handleFilterChange}
                placeholder="Search tasks..."
              />

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

              <div className="filters-actions">
                <SearchButton onClick={handleApplyFilters} loading={loading} />
                <ClearButton onClick={handleClearAll} disabled={loading} />
                <RefreshButton onClick={refresh} loading={loading} />
              </div>
            </div>
            </CollapsibleFilters>
          </div>

          {/* <p className="trello-board-hint">
            Drag cards or use ⋮ menu to move status. Click a card to open details.
          </p> */}

          {error && <div className="tl-status-message tl-status-message--error">{error}</div>}

          {!loading && visibleBoardColumns.length === 0 && (
            <div className="trello-board-empty">
              No columns selected. Open Show/hide columns and pick at least one.
            </div>
          )}

          {!loading && visibleBoardColumns.length > 0 && visibleTasks.length === 0 && (
            <div className="trello-board-empty">No tasks in this view.</div>
          )}

          {(loading || visibleTasks.length > 0) && visibleBoardColumns.length > 0 && (
          <div className="trello-board-scroll">
            <div className="trello-board-columns">
              {visibleBoardColumns.map((column) => (
                <section
                  key={column.id}
                  className={`trello-board-column ${dropColumnId === column.id ? 'trello-board-column--drag-over' : ''}`}
                  onDragOver={(e) => handleColumnDragOver(e, column.id)}
                  onDragLeave={() => setDropColumnId(null)}
                  onDrop={(e) => handleColumnDrop(e, column.id)}
                >
                  <header className="trello-board-column-header">
                    <div className="trello-board-column-title">
                      <span
                        className="trello-board-column-dot"
                        style={{ backgroundColor: column.color }}
                      />
                      {column.label}
                    </div>
                    <span className="trello-board-column-count">
                      {(tasksByColumn[column.id] || []).length}
                    </span>
                  </header>
                  <div className="trello-board-column-cards">
                    {(tasksByColumn[column.id] || []).map((task) => {
                      const due = formatDate(task.due_date);
                      const overdue = isOverdue(task);
                      const isUpdating = statusUpdatingId === task.id;
                      const draggable = canChangeStatus(task) && !isUpdating;
                      return (
                        <article
                          key={task.id}
                          className={`trello-board-card${draggingTaskId === task.id ? ' trello-board-card--dragging' : ''}${isUpdating ? ' trello-board-card--updating' : ''}`}
                          style={getCardColorStyle(task.id)}
                          draggable={draggable}
                          onDragStart={(e) => handleDragStart(e, task)}
                          onDragEnd={handleDragEnd}
                          onClick={() => {
                            if (didDrag || openMenuTaskId != null) return;
                            openTaskModal(task.id);
                          }}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              openTaskModal(task.id);
                            }
                          }}
                        >
                          <div className="trello-board-card-header">
                            <span
                              className={`trello-board-priority trello-board-priority--${task.priority || 'medium'}`}
                            >
                              {capitalize(task.priority || 'medium')}
                            </span>
                            <span className="trello-board-card-dept" title={capitalize(task.department)}>
                              {capitalize(task.department)}
                            </span>
                            <TaskCardMenu
                              task={task}
                              open={openMenuTaskId === task.id}
                              submenu={openMenuTaskId === task.id ? menuSubmenu : null}
                              onToggle={() => {
                                if (openMenuTaskId === task.id) {
                                  closeCardMenu();
                                } else {
                                  setOpenMenuTaskId(task.id);
                                  setMenuSubmenu(null);
                                }
                              }}
                              onSubmenu={setMenuSubmenu}
                              onClose={closeCardMenu}
                              onView={() => openTaskModal(task.id)}
                              onEdit={() => openTaskFormModal('update', task.id)}
                              onDelete={() => deleteTask(task)}
                              onMoveTo={(status) => handleStatusChange(task, status)}
                              onColorChange={(colorId) => handleCardColorChange(task.id, colorId)}
                              canView={taskPerms.canViewDetail}
                              canEdit={canEditTask(task)}
                              canDelete={taskPerms.canDelete}
                              canMove={canChangeStatus(task)}
                            />
                          </div>
                          <h4 className="trello-board-card-title">{task.title}</h4>
                          {due && (
                            <div className="trello-board-card-meta">
                              <span
                                className={`trello-board-card-due ${overdue ? 'trello-board-card-due--overdue' : ''}`}
                              >
                                {overdue ? 'Overdue · ' : ''}
                                {due}
                              </span>
                            </div>
                          )}
                        </article>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          </div>
          )}
        </div>
      </div>

      <TaskViewModal
        taskId={selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
        onTaskUpdated={handleTaskUpdatedFromModal}
        onOpenTask={setSelectedTaskId}
      />

      <TaskFormModal
        mode={taskFormModal.mode}
        taskId={taskFormModal.taskId}
        defaultDepartment={user?.department}
        onClose={closeTaskFormModal}
        onSaved={handleTaskFormSaved}
      />
    </>
  );
};

export default TasksBoard;
