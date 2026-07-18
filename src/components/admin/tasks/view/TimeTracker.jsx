import React, { useEffect, useMemo, useState, useCallback } from 'react';
import axiosInstance from '../../../../utils/axios';
import { toast } from 'react-toastify';

const formatSeconds = (totalSeconds) => {
  const seconds = Math.max(0, Math.floor(totalSeconds || 0));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const parts = [];
  if (h > 0) parts.push(`${h}h`);
  if (m > 0 || h > 0) parts.push(`${m}m`);
  parts.push(`${s}s`);
  return parts.join(' ');
};

const TimeTracker = ({ taskId, taskStatus }) => {
  const [entries, setEntries] = useState([]);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [activeStartedAt, setActiveStartedAt] = useState(null);
  const [tickSeconds, setTickSeconds] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [manualMinutes, setManualMinutes] = useState('');
  const [manualNotes, setManualNotes] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const normalizedStatus = String(taskStatus || '').toLowerCase();
  const isClosed = normalizedStatus === 'closed';

  useEffect(() => {
    let timer;
    if (isRunning && activeStartedAt) {
      timer = setInterval(() => {
        const diffMs = Date.now() - activeStartedAt;
        setTickSeconds(Math.floor(diffMs / 1000));
      }, 1000);
    } else {
      setTickSeconds(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRunning, activeStartedAt]);

  // Fetch work history only on user interaction (Start Timer or Add Time)
  const fetchHistory = useCallback(async () => {
    if (hasLoaded || isLoading || !taskId) return;
    
    setIsLoading(true);
    setLoading(true);
    setError('');
    try {
      const res = await axiosInstance.get(`/tasks/${taskId}/work-history`);
      const data = res.data?.data || {};
      const list = Array.isArray(data.entries) ? data.entries : [];
      const total = Number(data.total_seconds) || 0;
      const activeEntry = data.active_entry || null;
      setEntries(list);
      setTotalSeconds(total);
      if (activeEntry && activeEntry.started_at) {
        const startedTime = new Date(activeEntry.started_at).getTime();
        if (!Number.isNaN(startedTime)) {
          setIsRunning(true);
          setActiveStartedAt(startedTime);
        }
      }
      setHasLoaded(true);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load work history.');
      setHasLoaded(true); // Mark as loaded even on error to prevent retries
    } finally {
      setLoading(false);
      setIsLoading(false);
    }
  }, [taskId, hasLoaded, isLoading]);

  const effectiveTotalSeconds = useMemo(
    () => totalSeconds + tickSeconds,
    [totalSeconds, tickSeconds],
  );

  const handleStart = async () => {
    if (!taskId || isRunning) return;
    // Ensure work history is loaded before starting timer
    if (!hasLoaded) {
      await fetchHistory();
    }
    setLoading(true);
    setError('');
    try {
      await axiosInstance.post(`/tasks/${taskId}/time-entries`, {
        action: 'start',
      });
      const startedAt = Date.now();
      setIsRunning(true);
      setActiveStartedAt(startedAt);
      toast.success('Timer started');
    } catch (e) {
      const msg =
        e.response?.data?.message || 'Failed to start timer.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    if (!taskId || !isRunning || !activeStartedAt) return;
    setLoading(true);
    setError('');
    try {
      const elapsedSeconds = Math.floor((Date.now() - activeStartedAt) / 1000);
      await axiosInstance.post(`/tasks/${taskId}/time-entries`, {
        action: 'stop',
        seconds: elapsedSeconds,
      });
      setIsRunning(false);
      setActiveStartedAt(null);
      setTotalSeconds((prev) => prev + elapsedSeconds);
      setEntries((prev) => [
        {
          id: `local-${Date.now()}`,
          seconds: elapsedSeconds,
          created_at: new Date().toISOString(),
        },
        ...prev,
      ]);
      toast.success('Timer stopped');
    } catch (e) {
      const msg =
        e.response?.data?.message || 'Failed to stop timer.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    const minutes = Number(manualMinutes);
    if (!taskId || !minutes || minutes <= 0) {
      toast.error('Please enter a valid number of minutes.');
      return;
    }
    // Ensure work history is loaded before adding manual entry
    if (!hasLoaded) {
      await fetchHistory();
    }
    setLoading(true);
    setError('');
    try {
      const seconds = Math.floor(minutes * 60);
      await axiosInstance.post(`/tasks/${taskId}/time-entries`, {
        action: 'manual',
        seconds,
        notes: manualNotes,
      });
      setTotalSeconds((prev) => prev + seconds);
      setEntries((prev) => [
        {
          id: `manual-${Date.now()}`,
          seconds,
          created_at: new Date().toISOString(),
          notes: manualNotes,
        },
        ...prev,
      ]);
      setManualMinutes('');
      setManualNotes('');
      toast.success('Time entry added');
    } catch (e) {
      const msg =
        e.response?.data?.message || 'Failed to add time entry.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="task-time-tracker">
      <div className="task-time-header">
        <div className="task-time-main">
          <div className="task-time-total">
            Total time logged: {formatSeconds(effectiveTotalSeconds)}
          </div>
          {error && (
            <div className="task-time-error">
              {error}
            </div>
          )}
        </div>
        <div className="task-time-actions">
          {!isRunning && (
            <button
              type="button"
              className="task-time-button task-time-button--primary"
              onClick={handleStart}
              disabled={loading}
            >
              Start Timer
            </button>
          )}
          {isRunning && (
            <button
              type="button"
              className="task-time-button task-time-button--danger"
              onClick={handleStop}
              disabled={loading}
            >
              Stop Timer
            </button>
          )}
        </div>
      </div>

      <form className="task-time-manual" onSubmit={handleManualSubmit}>
        <div className="task-time-manual-grid">
          <div className="task-time-field">
            <label className="form-label">
              Manual minutes
            </label>
            <input
              type="number"
              className="form-input"
              min="1"
              value={manualMinutes}
              onChange={(e) => setManualMinutes(e.target.value)}
              disabled={isClosed}
            />
          </div>
          <div className="task-time-field">
            <label className="form-label">
              Notes
            </label>
            <input
              type="text"
              className="form-input"
              value={manualNotes}
              onChange={(e) => setManualNotes(e.target.value)}
              disabled={isClosed}
            />
          </div>
          <div className="task-time-manual-actions">
            <button
              type="submit"
              className="task-time-button task-time-button--secondary"
              disabled={loading || isClosed}
            >
              Add Time
            </button>
          </div>
        </div>
      </form>

      {entries.length > 0 && (
        <div className="task-time-history">
          <div className="task-time-history-title">
            Recent time entries
          </div>
          <ul className="task-time-history-list">
            {entries.slice(0, 3).map((entry) => (
              <li key={entry.id} className="task-time-history-item">
                <span className="task-time-history-duration">
                  {formatSeconds(entry.seconds || entry.duration_seconds || 0)}
                </span>
                <span className="task-time-history-meta">
                  {entry.created_at
                    ? new Date(entry.created_at).toLocaleString()
                    : ''}
                  {entry.notes ? ` • ${entry.notes}` : ''}
                </span>
              </li>
            ))}
          </ul>
          {entries.length > 3 && (
            <div className="task-time-see-more-container">
              <button
                type="button"
                className="task-time-see-more-btn"
                onClick={() => setShowAll(true)}
              >
                See More
              </button>
            </div>
          )}
        </div>
      )}

      {showAll && (
        <div className="task-time-modal-overlay" onClick={() => setShowAll(false)}>
          <div className="task-time-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="task-time-modal-header">
              <h3>All Time Entries</h3>
              <button
                type="button"
                className="task-time-modal-close"
                onClick={() => setShowAll(false)}
              >
                &times;
              </button>
            </div>
            <div className="task-time-modal-body">
              <ul className="task-time-history-list">
                {entries.map((entry) => (
                  <li key={entry.id} className="task-time-history-item">
                    <span className="task-time-history-duration">
                      {formatSeconds(entry.seconds || entry.duration_seconds || 0)}
                    </span>
                    <span className="task-time-history-meta">
                      {entry.created_at
                        ? new Date(entry.created_at).toLocaleString()
                        : ''}
                      {entry.notes ? ` • ${entry.notes}` : ''}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeTracker;
