import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { FiPaperclip } from 'react-icons/fi';
import './TaskPendingAttachments.css';

const MAX_FILE_BYTES = 10 * 1024 * 1024;

// Keep the attachment queue simple: each selected file gets a generated id and
// is stored with its original name so it can be displayed and removed later.
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
    if (!next) return;

    // The reference UI limits attachments to 10MB, so we guard here before any
    // file is added to the queued list to match the product requirement.
    if (next.size > MAX_FILE_BYTES) {
      setError('File must be 10MB or smaller');
      setFile(null);
      e.target.value = '';
      return;
    }

    // The mockup shows a visible selected-file row with a remove control, so we
    // add the file immediately to the pending list instead of hiding it behind the
    // old hidden form fields that were previously used.
    const nextItem = makeItem(next.name, next);
    const exists = items.some(
      (item) =>
        item.file?.name === next.name &&
        item.file?.size === next.size &&
        item.file?.lastModified === next.lastModified,
    );

    if (!exists) {
      onChange?.([...items, nextItem]);
    }

    setError('');
    setFile(next);
    e.target.value = '';
  };

  // Keep the remove action simple and explicit: delete the chosen item from the
  // queue so the UI matches the reference design's row-based attachment list.
  const handleRemove = (id) => {
    onChange?.(items.filter((item) => item.id !== id));
  };

  return (
    <div className="task-pending-attachments">
      <div className="add-task-section-title">{title}</div>

      <div className="task-pending-attachments__form task-pending-attachments__form--dropzone">
        <label htmlFor={fileInputId} className="task-pending-attachments__dropzone-label">
          <FiPaperclip className="task-pending-attachments__dropzone-icon" />
          <span>
            Drop files or <span className="task-pending-attachments__browse-link">browse</span>
            <span className="task-pending-attachments__meta"> • up to 10 MB each</span>
          </span>
        </label>

        <input
          id={fileInputId}
          type="file"
          className="task-pending-attachments__file-input"
          onChange={handleFileChange}
          disabled={disabled}
          accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx,.txt,application/pdf,image/*"
        />
      </div>

      {items.length > 0 && (
        <ul className="task-pending-attachments__list">
          {items.map((item) => (
            <li key={item.id} className="task-pending-attachments__item">
              <div className="task-pending-attachments__item-main">
                <span className="task-pending-attachments__file-name">{item.file?.name || item.name}</span>
              </div>
              <button
                type="button"
                className="task-pending-attachments__remove"
                onClick={() => handleRemove(item.id)}
                disabled={disabled}
                title="Remove"
                aria-label={`Remove ${item.file?.name || item.name}`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && <div className="form-error task-pending-attachments__error">{error}</div>}
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
