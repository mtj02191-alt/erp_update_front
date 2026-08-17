import React, { useEffect } from 'react';
import ViewTask from './index';
import './TaskViewModal.css';

export default function TaskViewModal({ taskId, onClose, onTaskUpdated, onOpenTask }) {
  useEffect(() => {
    if (!taskId) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [taskId, onClose]);

  if (!taskId) return null;

  const handleOpenRelated = (nextTaskId) => {
    if (onOpenTask) {
      onOpenTask(nextTaskId);
    }
  };

  return (
    <div
      className="task-view-modal-backdrop"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className="task-view-modal-panel">
        <ViewTask
          taskId={taskId}
          isModal
          onClose={onClose}
          onTaskUpdated={onTaskUpdated}
          onOpenRelatedTask={handleOpenRelated}
        />
      </div>
    </div>
  );
}
