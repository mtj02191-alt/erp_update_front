import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { FiPaperclip, FiPlus, FiTrash2 } from 'react-icons/fi';
import FormInput from '../../../common/FormInput';
import { SecondaryButton } from '../../../common/buttons';
import './TaskPendingAttachments.css';

const MAX_FILE_BYTES = 10 * 1024 * 1024;

function makeItem(name, file) {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    file,
  };
}

/**
 * Pending named attachments for task create/update.
 * On form submit, call ref.current.collectForSubmit() so a filled name+file
 * is included even if "Add attachment" was not clicked.
 */
const TaskPendingAttachments = forwardRef(function TaskPendingAttachments(
  { items = [], onChange, disabled = false, title = 'Attachments', fileInputId = 'task-pending-attachment-file' },
  ref,
) {
  const [name, setName] = useState('');
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const draftRef = useRef({ name: '', file: null });
  draftRef.current = { name, file };

  const clearDraft = () => {
    setName('');
    setFile(null);
    setError('');
    const input = document.getElementById(fileInputId);
    if (input) input.value = '';
  };

  useImperativeHandle(ref, () => ({
    /** Returns queued items + current draft (if name+file filled). */
    collectForSubmit() {
      const trimmed = String(draftRef.current.name || '').trim();
      const draftFile = draftRef.current.file;
      if (trimmed && draftFile && draftFile.size <= MAX_FILE_BYTES) {
        const next = [...items, makeItem(trimmed, draftFile)];
        onChange?.(next);
        clearDraft();
        return next;
      }
      return items;
    },
  }));

  const handleFileChange = (e) => {
    const next = e.target.files?.[0] || null;
    if (next && next.size > MAX_FILE_BYTES) {
      setError('File must be 10MB or smaller');
      setFile(null);
      e.target.value = '';
      return;
    }
    setError('');
    setFile(next);
  };

  const handleAdd = () => {
    const trimmed = String(name || '').trim();
    if (!trimmed) {
      setError('Attachment name is required');
      return;
    }
    if (!file) {
      setError('Please select a file');
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError('File must be 10MB or smaller');
      return;
    }

    onChange?.([...items, makeItem(trimmed, file)]);
    clearDraft();
  };

  const handleRemove = (id) => {
    onChange?.(items.filter((item) => item.id !== id));
  };

  return (
    <div className="task-pending-attachments">
      <div className="add-task-section-title">{title}</div>
      <p className="task-pending-attachments__hint">
        Enter a name and choose a file, then create the task (or click Add attachment to queue several files). Max 10MB each.
      </p>

      <div className="task-pending-attachments__form">
        <FormInput
          name="attachment_name"
          label="Attachment name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (error) setError('');
          }}
          placeholder="e.g. Proposal draft, Site photo, Checklist"
          disabled={disabled}
        />

        <div className="form-group">
          <label className="form-label" htmlFor={fileInputId}>
            File
          </label>
          <input
            id={fileInputId}
            type="file"
            className="form-input"
            onChange={handleFileChange}
            disabled={disabled}
            accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx,.txt,application/pdf,image/*"
          />
          {file && (
            <div className="task-pending-attachments__selected">
              <FiPaperclip /> Selected: {file.name}
            </div>
          )}
        </div>

        {error && <div className="form-error">{error}</div>}

        <SecondaryButton
          type="button"
          onClick={handleAdd}
          disabled={disabled}
          icon={<FiPlus />}
        >
          Add attachment
        </SecondaryButton>
      </div>

      {items.length > 0 && (
        <ul className="task-pending-attachments__list">
          {items.map((item) => (
            <li key={item.id} className="task-pending-attachments__item">
              <div className="task-pending-attachments__item-main">
                <strong>{item.name}</strong>
                <span>{item.file?.name}</span>
              </div>
              <button
                type="button"
                className="task-pending-attachments__remove"
                onClick={() => handleRemove(item.id)}
                disabled={disabled}
                title="Remove"
              >
                <FiTrash2 />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
});

export default TaskPendingAttachments;

/** Upload pending named attachments after task create/update. */
export async function uploadPendingTaskAttachments({
  axiosInstance,
  taskId,
  items,
  isInitial = true,
}) {
  if (!taskId || !items?.length) return { uploaded: 0, failed: 0 };

  let uploaded = 0;
  let failed = 0;

  for (const item of items) {
    try {
      const formData = new FormData();
      formData.append('file', item.file);
      formData.append('is_initial', isInitial ? 'true' : 'false');
      if (item.name) {
        formData.append('description', item.name);
        formData.append('name', item.name);
      }
      await axiosInstance.post(`/tasks/${taskId}/attachments/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      uploaded += 1;
    } catch (err) {
      console.error('Attachment upload error:', err);
      failed += 1;
    }
  }

  return { uploaded, failed };
}
