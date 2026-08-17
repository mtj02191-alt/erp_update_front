import React, { useEffect } from 'react';
import AddTask from '../add';
import UpdateTask from '../update';
import './TaskFormModal.css';

export default function TaskFormModal({
  mode,
  taskId,
  defaultDepartment,
  onClose,
  onSaved,
}) {
  useEffect(() => {
    if (!mode) return undefined;
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
  }, [mode, onClose]);

  if (!mode) return null;

  return (
    <div
      className="task-form-modal-backdrop"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className="task-form-modal-panel">
        {mode === 'add' ? (
          <AddTask
            isModal
            defaultDepartment={defaultDepartment}
            onClose={onClose}
            onSaved={onSaved}
          />
        ) : (
          <UpdateTask
            isModal
            taskId={taskId}
            onClose={onClose}
            onSaved={onSaved}
          />
        )}
      </div>
    </div>
  );
}
