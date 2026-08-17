import React, { useCallback, useEffect, useState } from 'react';
import axiosInstance from '../../../../utils/axios';
import { toast } from 'react-toastify';
import PrimaryButton from '../../../common/buttons/primary';
import FormInput from '../../../common/FormInput';
import './TaskDueRemindersPanel.css';

const formatRemindDate = (value) => {
  if (!value) return '—';
  const str = String(value).slice(0, 10);
  const [y, m, d] = str.split('-');
  if (!y || !m || !d) return str;
  return `${d}/${m}/${y}`;
};

const formatHourLabel = (hour) => {
  const h = Number(hour);
  if (!Number.isFinite(h)) return '—';
  if (h === 0) return '12:00 AM';
  if (h < 12) return `${h}:00 AM`;
  if (h === 12) return '12:00 PM';
  return `${h - 12}:00 PM`;
};

const parseTimeHour = (timeValue) => {
  if (!timeValue || typeof timeValue !== 'string') return null;
  const [hourPart] = timeValue.split(':');
  const hour = parseInt(hourPart, 10);
  if (!Number.isFinite(hour) || hour < 0 || hour > 23) return null;
  return hour;
};

const defaultRemindDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
};

const TaskDueRemindersPanel = ({ taskId, dueDate, isAssignee, disabled }) => {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [remindOnDate, setRemindOnDate] = useState(defaultRemindDate);
  const [remindAtTime, setRemindAtTime] = useState('10:00');

  const hasDueDate = Boolean(dueDate);

  const loadReminders = useCallback(async () => {
    if (!taskId || !isAssignee) return;
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/tasks/${taskId}/due-reminders`);
      setReminders(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load reminders');
    } finally {
      setLoading(false);
    }
  }, [taskId, isAssignee]);

  useEffect(() => {
    loadReminders();
  }, [loadReminders]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!hasDueDate) {
      toast.error('Set a due date on this task first.');
      return;
    }
    if (!remindOnDate) {
      toast.error('Select a reminder date.');
      return;
    }
    const hour = parseTimeHour(remindAtTime);
    if (hour === null) {
      toast.error('Select a valid reminder time.');
      return;
    }

    setSaving(true);
    try {
      await axiosInstance.post(`/tasks/${taskId}/due-reminders`, {
        remind_on_date: remindOnDate,
        remind_at_hour: hour,
      });
      toast.success('Reminder added.');
      setRemindOnDate(defaultRemindDate());
      setRemindAtTime('10:00');
      await loadReminders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add reminder');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (reminderId) => {
    try {
      await axiosInstance.delete(`/tasks/${taskId}/due-reminders/${reminderId}`);
      toast.success('Reminder removed.');
      setReminders((prev) => prev.filter((r) => r.id !== reminderId));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove reminder');
    }
  };

  if (!isAssignee) {
    return null;
  }

  return (
    <div className="view-section task-due-reminders-panel">
      <h3 className="view-section-title">
        <span>⏰</span> Due date email reminders
      </h3>
      <p className="task-due-reminders-note">
        Pick any date and time (<strong>Asia/Karachi</strong>). Email is sent during
        that hour. Each reminder is sent once, then removed.
        {hasDueDate && (
          <>
            {' '}
            Task due: <strong>{formatRemindDate(dueDate)}</strong>
          </>
        )}
      </p>

      {!hasDueDate && (
        <div className="task-due-reminders-empty">
          Add a due date to this task before setting reminders.
        </div>
      )}

      {hasDueDate && (
        <form onSubmit={handleAdd} className="task-due-reminders-form">
          <div className="task-due-reminders-form-row">
            <FormInput
              label="Reminder date"
              name="remind_on_date"
              type="date"
              value={remindOnDate}
              onChange={(e) => setRemindOnDate(e.target.value)}
              disabled={disabled || saving}
              required
            />
            <FormInput
              label="Reminder time (PKT)"
              name="remind_at_time"
              type="time"
              value={remindAtTime}
              onChange={(e) => setRemindAtTime(e.target.value)}
              disabled={disabled || saving}
              required
            />
          </div>
          <div className="form-actions">
            <PrimaryButton
              type="submit"
              disabled={disabled || saving || !hasDueDate}
              loading={saving}
              loadingText="Adding..."
            >
              Add reminder
            </PrimaryButton>
          </div>
        </form>
      )}

      <div className="task-due-reminders-list-wrap">
        {loading && <p className="task-due-reminders-muted">Loading reminders…</p>}
        {!loading && reminders.length === 0 && (
          <p className="task-due-reminders-muted">No reminders scheduled yet.</p>
        )}
        {!loading && reminders.length > 0 && (
          <ul className="task-due-reminders-list">
            {reminders.map((r) => (
              <li key={r.id} className="task-due-reminder-item">
                <div className="task-due-reminder-item__main">
                  <span className="task-due-reminder-item__when">
                    {formatRemindDate(r.remind_on_date)} at{' '}
                    {formatHourLabel(r.remind_at_hour)}
                  </span>
                  <span className="task-due-reminder-item__meta">
                    Scheduled email reminder
                  </span>
                </div>
                {!disabled && (
                  <button
                    type="button"
                    className="task-due-reminder-item__remove"
                    onClick={() => handleDelete(r.id)}
                  >
                    Remove
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default TaskDueRemindersPanel;
