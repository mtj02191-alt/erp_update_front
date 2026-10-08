import React, { useRef, useState } from 'react';
import { toast } from 'react-toastify';
import axiosInstance from '../../../../utils/axios';
import DonationPendingAttachments, {
  uploadPendingRecurringDonationAttachments,
} from '../../donations/shared/DonationPendingAttachments';
import '../../donations/shared/DonationPendingAttachments.css';

export default function RecurringAttachmentPanel({
  entityId,
  attachments = [],
  canUpdate = false,
  title = 'Attachments',
  compact = false,
  onChanged,
}) {
  const attachmentsRef = useRef(null);
  const [pendingAttachments, setPendingAttachments] = useState([]);
  const [saving, setSaving] = useState(false);

  const removeAttachment = async (attachmentId) => {
    if (!entityId || !attachmentId) return;
    try {
      await axiosInstance.delete(
        `/recurring-donations/${entityId}/attachments/${attachmentId}`,
      );
      toast.success('Attachment removed');
      onChanged?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove attachment');
    }
  };

  const uploadAttachments = async () => {
    if (!entityId) return;
    const items =
      attachmentsRef.current?.collectForSubmit?.() || pendingAttachments;
    if (!items.length) {
      toast.info('Add at least one attachment to upload');
      return;
    }

    setSaving(true);
    try {
      const { uploaded, failed } = await uploadPendingRecurringDonationAttachments({
        axiosInstance,
        recurringDonationId: entityId,
        items,
      });
      if (uploaded > 0) {
        toast.success(
          uploaded === 1
            ? 'Attachment uploaded successfully.'
            : `${uploaded} attachments uploaded successfully.`,
        );
        setPendingAttachments([]);
        onChanged?.();
      }
      if (failed > 0) {
        toast.error(
          failed === 1
            ? 'Failed to upload 1 attachment.'
            : `Failed to upload ${failed} attachments.`,
        );
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload attachments.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={compact ? 'recurring-attachment-panel recurring-attachment-panel--compact' : 'recurring-attachment-panel'}>
      {!compact && <h3 className="view-section-title">{title}</h3>}
      {compact && title ? (
        <div style={{ fontWeight: 600, marginBottom: 8 }}>{title}</div>
      ) : null}

      {(attachments || []).length > 0 ? (
        <ul className="donation-attachments-list">
          {(attachments || []).map((a) => {
            const displayName = a.description || a.file_name;
            return (
              <li key={a.id} className="donation-attachments-list__item">
                <div className="donation-attachments-list__main">
                  <strong>{displayName}</strong>
                  {a.description && a.file_name && a.description !== a.file_name && (
                    <span>{a.file_name}</span>
                  )}
                </div>
                <div className="donation-attachments-list__actions">
                  <a href={a.file_url} target="_blank" rel="noreferrer">
                    View
                  </a>
                  {canUpdate && (
                    <button type="button" onClick={() => removeAttachment(a.id)}>
                      Remove
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p style={{ margin: '0.5rem 0', color: '#64748b', fontSize: '0.9rem' }}>
          No attachments yet.
        </p>
      )}

      {canUpdate && entityId && (
        <div style={{ marginTop: compact ? '0.75rem' : '1rem' }}>
          <DonationPendingAttachments
            ref={attachmentsRef}
            items={pendingAttachments}
            onChange={setPendingAttachments}
            disabled={saving}
            title={compact ? 'Add attachment' : 'Add attachment'}
            fileInputId={`recurring-attachment-file-${entityId}`}
          />
          <div style={{ marginTop: '0.75rem' }}>
            <button
              type="button"
              className="primary_btn"
              onClick={uploadAttachments}
              disabled={saving}
            >
              {saving ? 'Uploading...' : 'Upload attachments'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
