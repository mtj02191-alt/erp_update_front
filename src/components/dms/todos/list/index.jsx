import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import FormInput from '../../../common/FormInput';
import FormSelect from '../../../common/FormSelect';
import SearchableDropdown from '../../../common/SearchableDropdown';
import {
  FiBox,
  FiCalendar,
  FiCheck,
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
  FiClipboard,
  FiClock,
  FiFlag,
  FiMapPin,
  FiMoreVertical,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiAlertTriangle,
} from 'react-icons/fi';
import './DmsTodos.css';

const RELATED_TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'none', label: 'General' },
  { value: 'donation_box', label: 'Donation Box' },
  { value: 'donor', label: 'Donor' },
  { value: 'volunteer', label: 'Volunteer' },
  { value: 'appeal', label: 'Appeal' },
  { value: 'campaign', label: 'Campaign' },
  { value: 'event', label: 'Event' },
  { value: 'other', label: 'Other' },
];

const PRIORITY_OPTIONS = [
  { value: '', label: 'All Priorities' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

const RECURRENCE_OPTIONS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'bi_weekly', label: 'Bi-weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'annually', label: 'Annually' },
];

const RELATED_TYPE_LABELS = {
  none: 'General',
  donation_box: 'Donation Box',
  donor: 'Donor',
  volunteer: 'Volunteer',
  appeal: 'Appeal',
  campaign: 'Campaign',
  event: 'Event',
  other: 'Other',
};

const emptyForm = () => ({
  title: '',
  notes: '',
  due_date: '',
  priority: 'medium',
  related_type: 'none',
  related_id: '',
  is_recurring: false,
  recurrence_rule: 'weekly',
  recurrence_end_type: 'never',
  recurrence_end_date: '',
  recurrence_end_occurrences: '',
});

function formatDueLabel(dueDateStr) {
  if (!dueDateStr) return 'No due date';
  const due = new Date(`${String(dueDateStr).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(due.getTime())) return String(dueDateStr);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((due - today) / 86400000);
  const formatted = due.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  if (diffDays < 0) return `Overdue ${formatted}`;
  if (diffDays === 0) return `Due Today ${formatted}`;
  if (diffDays === 1) return `Due Tomorrow ${formatted}`;
  if (diffDays === 2) return `${formatted} Day after tomorrow`;
  return `Due ${formatted}`;
}

function buildCalendar(year, month) {
  const first = new Date(year, month, 1);
  const startPad = first.getDay(); // 0 Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startPad; i += 1) cells.push(null);
  for (let d = 1; d <= daysInMonth; d += 1) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

const DmsTodosPage = () => {
  const navigate = useNavigate();
  const canUpdate = true;

  const [tab, setTab] = useState('pending');
  const [todos, setTodos] = useState([]);
  const [summary, setSummary] = useState({
    pending: 0,
    due_tomorrow: 0,
    overdue: 0,
    completed_this_month: 0,
    completed_total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [relatedType, setRelatedType] = useState('');
  const [priority, setPriority] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;

  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState('');

  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [selectedBox, setSelectedBox] = useState(null);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState(null);

  const calendarCells = useMemo(
    () => buildCalendar(calYear, calMonth),
    [calYear, calMonth],
  );
  const monthLabel = useMemo(
    () =>
      new Date(calYear, calMonth, 1).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      }),
    [calYear, calMonth],
  );

  const fetchSummary = useCallback(async () => {
    try {
      const res = await axiosInstance.get('/dms/todos/summary');
      if (res.data?.success) setSummary(res.data.data || {});
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchTodos = useCallback(async (override = {}) => {
    try {
      setLoading(true);
      setError('');
      const reqPage = override.page ?? page;
      const reqSelectedDate =
        override.selectedDate !== undefined ? override.selectedDate : selectedDate;
      const reqRelatedType =
        override.relatedType !== undefined ? override.relatedType : relatedType;
      const reqPriority =
        override.priority !== undefined ? override.priority : priority;
      const reqSearch =
        override.appliedSearch !== undefined ? override.appliedSearch : appliedSearch;

      const params = {
        page: reqPage,
        pageSize,
        mine_only: true,
        status: tab === 'pending' ? 'pending' : 'completed',
        sortField: tab === 'pending' ? 'due_date' : 'completed_at',
        sortOrder: tab === 'pending' ? 'ASC' : 'DESC',
      };
      if (reqSearch.trim()) params.search = reqSearch.trim();
      if (reqRelatedType) params.related_type = reqRelatedType;
      if (reqPriority) params.priority = reqPriority;
      if (reqSelectedDate) params.due_date = reqSelectedDate;

      // Debug: verify the list endpoint is being called with expected filters.
      // Remove once confirmed.
      // eslint-disable-next-line no-console
      console.log('DmsTodosPage fetchTodos params:', params);

      const res = await axiosInstance.get('/dms/todos', { params });
      if (res.data?.success) {
        setTodos(res.data.data || []);
        setTotal(res.data.total ?? 0);
      } else {
        setError(res.data?.message || 'Failed to load todos');
        setTodos([]);
        setTotal(0);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load todos');
      setTodos([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, tab, appliedSearch, relatedType, priority, selectedDate]);

  useEffect(() => {
    fetchSummary();
    fetchTodos();
  }, [fetchSummary, fetchTodos]);

  const hasActiveFilters =
    Boolean(selectedDate || relatedType || priority || appliedSearch.trim());

  const clearFilters = () => {
    setSelectedDate('');
    setRelatedType('');
    setPriority('');
    setSearch('');
    setAppliedSearch('');
    setPage(1);
  };

  const refreshAll = async (override = {}) => {
    await Promise.all([fetchSummary(), fetchTodos(override)]);
  };

  const handleMarkDone = async (todo) => {
    if (!canUpdate) return;
    try {
      setActionId(todo.id);
      await axiosInstance.patch(`/dms/todos/${todo.id}/complete`);
      await refreshAll();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to mark as done');
    } finally {
      setActionId(null);
    }
  };

  const openAdd = () => {
    setForm(emptyForm());
    setSelectedBox(null);
    setShowAdd(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError('Title is required');
      return;
    }
    if (form.related_type === 'donation_box' && !form.related_id) {
      setError('Please select a donation box');
      return;
    }
    if (form.is_recurring && !form.recurrence_rule) {
      setError('Please choose a recurrence rule');
      return;
    }

    try {
      setSaving(true);
      setError('');
      const relatedType = form.related_type || 'none';
      const relatedIdRequired = [
        'donation_box',
        'donor',
        'volunteer',
        'appeal',
        'campaign',
        'event',
      ].includes(relatedType);

      const payload = {
        title: form.title.trim(),
        notes: form.notes?.trim() || undefined,
        due_date: form.due_date || undefined,
        priority: form.priority || 'medium',
        related_type: relatedType,
        related_id: relatedIdRequired ? Number(form.related_id) : undefined,
        is_recurring: !!form.is_recurring,
      };
      if (form.is_recurring) {
        payload.recurrence_rule = form.recurrence_rule;
        payload.recurrence_end_type = form.recurrence_end_type || 'never';
        if (form.recurrence_end_type === 'on_date' && form.recurrence_end_date) {
          payload.recurrence_end_date = form.recurrence_end_date;
        }
        if (
          form.recurrence_end_type === 'after_occurrences' &&
          form.recurrence_end_occurrences
        ) {
          payload.recurrence_end_occurrences = Number(
            form.recurrence_end_occurrences,
          );
        }
      }

      await axiosInstance.post('/dms/todos', payload);
      setShowAdd(false);
      setTab('pending');
      setPage(1);
      setSelectedDate('');
      setRelatedType('');
      setPriority('');
      setSearch('');
      setAppliedSearch('');
      await refreshAll({
        page: 1,
        selectedDate: '',
        relatedType: '',
        priority: '',
        appliedSearch: '',
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create todo');
    } finally {
      setSaving(false);
    }
  };

  const shiftMonth = (delta) => {
    let m = calMonth + delta;
    let y = calYear;
    if (m < 0) {
      m = 11;
      y -= 1;
    } else if (m > 11) {
      m = 0;
      y += 1;
    }
    setCalMonth(m);
    setCalYear(y);
  };

  const pickDay = (day) => {
    if (!day) return;
    const iso = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDate((prev) => (prev === iso ? '' : iso));
    setPage(1);
  };

  const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const startIdx = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endIdx = Math.min(page * pageSize, total);

  return (
    <>
      <Navbar />
      <div className="dms-todos-page">
        <PageHeader
          title="My To-Dos"
          backPath="/fund_raising"
          showAdd
          addTitle="Add To-Do"
          onAddClick={openAdd}
          rightElement={
            <button type="button" className="dms-todos-add-btn" onClick={openAdd}>
              <FiPlus /> Add To-Do
            </button>
          }
        />
        <p className="dms-todos-subtitle">Track and manage your upcoming tasks</p>

        {error ? <div className="dms-todos-error">{error}</div> : null}

        <div className="dms-todos-top">
          <div className="dms-todos-stats">
            <div className="dms-todos-stat">
              <div>
                <div className="dms-todos-stat-value">{summary.pending || 0} Pending</div>
                <div className="dms-todos-stat-sub">Due Soon</div>
              </div>
              <span className="dms-todos-stat-icon blue">
                <FiClipboard />
              </span>
            </div>
            <div className="dms-todos-stat">
              <div>
                <div className="dms-todos-stat-value">
                  {summary.due_tomorrow || 0} Due Tomorrow
                </div>
                <div className="dms-todos-stat-sub">High Priority</div>
              </div>
              <span className="dms-todos-stat-icon amber">
                <FiClock />
              </span>
            </div>
            <div className="dms-todos-stat">
              <div>
                <div className="dms-todos-stat-value">{summary.overdue || 0} Overdue</div>
                <div className="dms-todos-stat-sub">Needs Attention</div>
              </div>
              <span className="dms-todos-stat-icon red">
                <FiAlertTriangle />
              </span>
            </div>
            <div className="dms-todos-stat">
              <div>
                <div className="dms-todos-stat-value">
                  {summary.completed_this_month || 0} Completed
                </div>
                <div className="dms-todos-stat-sub">This Month</div>
              </div>
              <span className="dms-todos-stat-icon green">
                <FiCheckCircle />
              </span>
            </div>
          </div>

          <div className="dms-todos-calendar">
            <div className="dms-todos-cal-header">
              <button type="button" onClick={() => shiftMonth(-1)} aria-label="Previous month">
                <FiChevronLeft />
              </button>
              <strong>{monthLabel}</strong>
              <button type="button" onClick={() => shiftMonth(1)} aria-label="Next month">
                <FiChevronRight />
              </button>
            </div>
            <div className="dms-todos-cal-weekdays">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                <span key={d}>{d}</span>
              ))}
            </div>
            <div className="dms-todos-cal-grid">
              {calendarCells.map((day, idx) => {
                if (!day) return <span key={`e-${idx}`} className="dms-todos-cal-empty" />;
                const iso = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const isToday = iso === todayIso;
                const isSelected = iso === selectedDate;
                return (
                  <button
                    key={iso}
                    type="button"
                    className={`dms-todos-cal-day${isToday ? ' is-today' : ''}${isSelected ? ' is-selected' : ''}`}
                    onClick={() => pickDay(day)}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
            {selectedDate ? (
              <button
                type="button"
                className="dms-todos-cal-clear"
                onClick={() => setSelectedDate('')}
              >
                Clear date filter
              </button>
            ) : null}
          </div>
        </div>

        <div className="dms-todos-panel">
          <div className="dms-todos-tabs">
            <button
              type="button"
              className={tab === 'pending' ? 'active' : ''}
              onClick={() => {
                setTab('pending');
                setPage(1);
              }}
            >
              Pending ({summary.pending || 0})
            </button>
            <button
              type="button"
              className={tab === 'completed' ? 'active' : ''}
              onClick={() => {
                setTab('completed');
                setPage(1);
              }}
            >
              Completed ({summary.completed_total || 0})
            </button>
          </div>

          <div className="dms-todos-toolbar">
            <select
              value={relatedType}
              onChange={(e) => {
                setRelatedType(e.target.value);
                setPage(1);
              }}
            >
              {RELATED_TYPE_OPTIONS.map((o) => (
                <option key={o.value || 'all'} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <select
              value={priority}
              onChange={(e) => {
                setPriority(e.target.value);
                setPage(1);
              }}
            >
              {PRIORITY_OPTIONS.map((o) => (
                <option key={o.value || 'all-p'} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <div className="dms-todos-search">
              <FiSearch />
              <input
                type="search"
                placeholder="Search tasks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setAppliedSearch(search);
                    setPage(1);
                  }
                }}
              />
            </div>
            <button
              type="button"
              className="dms-todos-ghost-btn"
              onClick={() => {
                setAppliedSearch(search);
                setPage(1);
                refreshAll();
              }}
            >
              <FiRefreshCw /> Refresh
            </button>
            <button type="button" className="dms-todos-add-btn" onClick={openAdd}>
              <FiPlus /> Add To-Do
            </button>
          </div>

          {hasActiveFilters ? (
            <div className="dms-todos-active-filters">
              <span>
                Filters active
                {selectedDate ? ` · Due ${selectedDate}` : ''}
                {relatedType ? ` · Type: ${relatedType}` : ''}
                {priority ? ` · Priority: ${priority}` : ''}
                {appliedSearch.trim() ? ` · Search: "${appliedSearch.trim()}"` : ''}
              </span>
              <button type="button" className="dms-todos-ghost-btn" onClick={clearFilters}>
                Clear filters
              </button>
            </div>
          ) : null}

          <div className="dms-todos-list">
            {loading ? (
              <div className="dms-todos-empty">Loading…</div>
            ) : todos.length === 0 ? (
              <div className="dms-todos-empty">
                <p>
                  {total > 0
                    ? 'No todos on this page. Try going to page 1 or clearing filters.'
                    : hasActiveFilters
                      ? 'No todos match your filters.'
                      : 'No todos found.'}
                </p>
                {hasActiveFilters ? (
                  <button type="button" className="dms-todos-add-btn" onClick={clearFilters}>
                    Clear filters
                  </button>
                ) : (
                  <button type="button" className="dms-todos-add-btn" onClick={openAdd}>
                    <FiPlus /> Add your first To-Do
                  </button>
                )}
              </div>
            ) : (
              todos.map((todo) => {
                const meta = todo.related_meta || {};
                const typeLabel =
                  RELATED_TYPE_LABELS[todo.related_type] || 'General';
                return (
                  <div key={todo.id} className="dms-todos-row">
                    <div className="dms-todos-row-icon">
                      {todo.related_type === 'donation_box' ? <FiBox /> : <FiClipboard />}
                    </div>
                    <div className="dms-todos-row-main">
                      <div className="dms-todos-row-title-line">
                        <strong>{todo.title}</strong>
                        <span className="dms-todos-type-pill">{typeLabel}</span>
                        {todo.is_recurring ? (
                          <span className="dms-todos-recur-pill">
                            <FiRefreshCw /> {todo.recurrence_rule || 'recurring'}
                          </span>
                        ) : null}
                      </div>
                      <div className="dms-todos-row-meta">
                        {meta.address || meta.label ? (
                          <span>
                            <FiMapPin /> {meta.address || meta.label}
                          </span>
                        ) : null}
                        {meta.box_id_no ? (
                          <span>Box ID: {meta.box_id_no}</span>
                        ) : todo.related_id && todo.related_type !== 'none' ? (
                          <span>
                            Ref: {todo.related_type} #{todo.related_id}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <div className="dms-todos-row-due">
                      <FiCalendar /> {formatDueLabel(todo.due_date)}
                    </div>
                    <span className={`dms-todos-priority ${todo.priority}`}>
                      <FiFlag /> {todo.priority}
                    </span>
                    <div className="dms-todos-row-actions">
                      {tab === 'pending' && canUpdate ? (
                        <button
                          type="button"
                          className="dms-todos-done-btn"
                          disabled={actionId === todo.id}
                          onClick={() => handleMarkDone(todo)}
                        >
                          <FiCheck /> Mark as Done
                        </button>
                      ) : null}
                      {(() => {
                        if (!todo.related_id) return null;
                        const viewPathByType = {
                          donation_box: `/dms/donation_box/view/${todo.related_id}`,
                          donor: `/dms/donors/view/${todo.related_id}`,
                          volunteer: `/dms/volunteers/view/${todo.related_id}`,
                          appeal: `/dms/appeals/view/${todo.related_id}`,
                          campaign: `/dms/campaigns/view/${todo.related_id}`,
                          event: `/dms/events/view/${todo.related_id}`,
                        };
                        const viewPath = viewPathByType[todo.related_type];
                        if (!viewPath) return null;
                        return (
                          <button
                            type="button"
                            className="dms-todos-more-btn"
                            title="Open related record"
                            onClick={() => navigate(viewPath)}
                          >
                            <FiMoreVertical />
                          </button>
                        );
                      })()}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="dms-todos-footer">
            Showing {startIdx} to {endIdx} of {total} tasks
            <div className="dms-todos-pager">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </button>
              <button
                type="button"
                disabled={page * pageSize >= total}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {showAdd ? (
        <div className="dms-todos-modal-backdrop" onClick={() => !saving && setShowAdd(false)}>
          <div
            className="dms-todos-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="dms-todos-modal-header">
              <h2>Add To-Do</h2>
              <button type="button" onClick={() => setShowAdd(false)} disabled={saving}>
                ×
              </button>
            </div>
            <form onSubmit={handleCreate} className="dms-todos-form">
              <FormInput
                name="title"
                label="Title"
                value={form.title}
                required
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
              <FormInput
                name="due_date"
                label="Due date"
                type="date"
                value={form.due_date}
                onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))}
              />
              <FormSelect
                name="priority"
                label="Priority"
                value={form.priority}
                options={[
                  { value: 'high', label: 'High' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'low', label: 'Low' },
                ]}
                onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
              />
              <FormSelect
                name="related_type"
                label="Related to"
                value={form.related_type}
                options={RELATED_TYPE_OPTIONS.filter((o) => o.value).map((o) => ({
                  value: o.value,
                  label: o.label,
                }))}
                onChange={(e) => {
                  const related_type = e.target.value;
                  setForm((f) => ({
                    ...f,
                    related_type,
                    related_id: '',
                  }));
                  setSelectedBox(null);
                }}
              />

              {form.related_type === 'donation_box' ? (
                <SearchableDropdown
                  label="Donation Box"
                  required
                  placeholder="Type box key or shop name..."
                  apiEndpoint="/donation-box"
                  searchParamName="search"
                  displayKey="shop_name"
                  minSearchLength={1}
                  debounceDelay={300}
                  value={selectedBox}
                  onSelect={(box) => {
                    setSelectedBox(box);
                    setForm((f) => ({
                      ...f,
                      related_id: box?.id || '',
                    }));
                  }}
                  onClear={() => {
                    setSelectedBox(null);
                    setForm((f) => ({ ...f, related_id: '' }));
                  }}
                  renderOption={(box) => (
                    <>
                      <div style={{ fontWeight: 600 }}>{box?.shop_name}</div>
                      <div style={{ fontSize: '0.85em', color: '#666' }}>
                        Key: {box?.key_no || '—'} · Box ID: {box?.box_id_no || '—'}
                      </div>
                    </>
                  )}
                />
              ) : ['donor', 'volunteer', 'appeal', 'campaign', 'event'].includes(form.related_type) ? (
                <FormInput
                  name="related_id"
                  label="Related record ID"
                  type="number"
                  value={form.related_id}
                  required
                  onChange={(e) =>
                    setForm((f) => ({ ...f, related_id: e.target.value }))
                  }
                />
              ) : null}

              <FormInput
                name="notes"
                label="Notes"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              />

              <label className="dms-todos-check">
                <input
                  type="checkbox"
                  checked={form.is_recurring}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, is_recurring: e.target.checked }))
                  }
                />
                Recurring todo
              </label>

              {form.is_recurring ? (
                <>
                  <FormSelect
                    name="recurrence_rule"
                    label="Repeats"
                    value={form.recurrence_rule}
                    options={RECURRENCE_OPTIONS}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, recurrence_rule: e.target.value }))
                    }
                  />
                  <FormSelect
                    name="recurrence_end_type"
                    label="Ends"
                    value={form.recurrence_end_type}
                    options={[
                      { value: 'never', label: 'Never' },
                      { value: 'on_date', label: 'On date' },
                      { value: 'after_occurrences', label: 'After N occurrences' },
                    ]}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        recurrence_end_type: e.target.value,
                      }))
                    }
                  />
                  {form.recurrence_end_type === 'on_date' ? (
                    <FormInput
                      name="recurrence_end_date"
                      label="End date"
                      type="date"
                      value={form.recurrence_end_date}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          recurrence_end_date: e.target.value,
                        }))
                      }
                    />
                  ) : null}
                  {form.recurrence_end_type === 'after_occurrences' ? (
                    <FormInput
                      name="recurrence_end_occurrences"
                      label="Number of occurrences"
                      type="number"
                      value={form.recurrence_end_occurrences}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          recurrence_end_occurrences: e.target.value,
                        }))
                      }
                    />
                  ) : null}
                </>
              ) : null}

              <div className="dms-todos-form-actions">
                <button
                  type="button"
                  className="dms-todos-ghost-btn"
                  onClick={() => setShowAdd(false)}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button type="submit" className="dms-todos-add-btn" disabled={saving}>
                  {saving ? 'Saving…' : 'Create To-Do'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default DmsTodosPage;
