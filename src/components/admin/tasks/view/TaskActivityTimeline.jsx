import React, { useMemo } from 'react';
import { FiCheckCircle, FiInfo, FiMessageSquare, FiCircle } from 'react-icons/fi';

const capitalize = (s) =>
  s ? String(s).split('_').map((w) => (w[0] ? w[0].toUpperCase() + w.slice(1) : '')).join(' ') : '';

const getPerformerName = (performer) => {
  if (!performer) return 'System';
  const full = `${performer.first_name || ''} ${performer.last_name || ''}`.trim();
  return full || performer.email || performer.name || 'System';
};

const formatTimelineDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const resolveActivity = (activity) => {
  const action = String(activity?.action || '').toLowerCase();
  const details =
    activity?.details && typeof activity.details === 'object' ? activity.details : {};
  const author = getPerformerName(activity?.performed_by);

  if (action.includes('progress') || action.includes('mov')) {
    const notes =
      typeof details.notes === 'string'
        ? details.notes
            .replace(/\s*\[indices:[\d,]+\]/, '')
            .replace(/\s*\[ownership:[^\]]+\]/, '')
            .trim()
        : '';
    return {
      icon: 'success',
      title: 'Checklist item completed',
      body: notes,
      author,
    };
  }

  if (action.includes('status') || details.status || details.to_status || details.new_status) {
    const status = details.status || details.to_status || details.new_status;
    const label = status ? capitalize(status) : 'updated';
    const note =
      typeof details.notes === 'string'
        ? details.notes.trim()
        : typeof activity?.notes === 'string'
          ? activity.notes.trim()
          : '';
    return {
      icon: 'info',
      title: `Status updated to ${label}`,
      body: note,
      author,
    };
  }

  if (action.includes('comment') || action === 'note_added' || action === 'comment_added') {
    const content =
      details.content ||
      details.notes ||
      (typeof activity?.notes === 'string' ? activity.notes : '');
    return {
      icon: 'note',
      title: 'Note added',
      body: content,
      author,
    };
  }

  if (action === 'created' || action === 'task_created') {
    return { icon: 'neutral', title: 'Task created', body: '', author };
  }

  if (action === 'reassigned') {
    return { icon: 'info', title: 'Task reassigned', body: '', author };
  }

  return {
    icon: 'neutral',
    title: capitalize(action.replace(/_/g, ' ')) || 'Activity',
    body: typeof details.notes === 'string' ? details.notes : '',
    author,
  };
};

const TimelineIcon = ({ type }) => {
  if (type === 'success') return <FiCheckCircle className="tv-timeline-icon tv-timeline-icon--success" />;
  if (type === 'note') return <FiMessageSquare className="tv-timeline-icon tv-timeline-icon--note" />;
  if (type === 'info') return <FiInfo className="tv-timeline-icon tv-timeline-icon--info" />;
  return <FiCircle className="tv-timeline-icon tv-timeline-icon--neutral" />;
};

export default function TaskActivityTimeline({ activities = [], compact = false }) {
  const items = useMemo(() => {
    const list = Array.isArray(activities) ? activities.filter(Boolean) : [];
    return [...list].sort((a, b) => {
      const ad = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bd = b.created_at ? new Date(b.created_at).getTime() : 0;
      return bd - ad;
    });
  }, [activities]);

  const listContent =
    items.length === 0 ? (
      <div className="tv-timeline-empty">No activity yet.</div>
    ) : (
      <ul className="tv-timeline-list">
        {items.map((activity) => {
          const meta = resolveActivity(activity);
          const when = formatTimelineDate(activity.created_at);
          return (
            <li key={activity.id || `${activity.action}-${activity.created_at}`} className="tv-timeline-item">
              <div className="tv-timeline-marker">
                <TimelineIcon type={meta.icon} />
                <span className="tv-timeline-line" />
              </div>
              <div className="tv-timeline-content">
                <div className="tv-timeline-title">{meta.title}</div>
                {meta.body && <div className="tv-timeline-body">{meta.body}</div>}
                <div className="tv-timeline-meta">
                  {meta.author}
                  {when && <span className="tv-timeline-date">{when}</span>}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    );

  if (compact) {
    return <div className="tv-timeline-compact">{listContent}</div>;
  }

  return (
    <div className="task-view-section tv-timeline-card">
      <h3 className="task-task-view-section-title">Progress History</h3>
      {listContent}
    </div>
  );
}
