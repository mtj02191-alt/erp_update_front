import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import axiosInstance from '../../../../../utils/axios';
import Navbar from '../../../../Navbar';
import PageHeader from '../../../../common/PageHeader';
import FormTextarea from '../../../../common/FormTextarea';
import { departments } from '../../../../../utils/user';
import { useAuth } from '../../../../../context/AuthContext';
import { toast } from 'react-toastify';

const departmentLabel = (value) => {
  if (!value) return '—';
  const found = departments.find((d) => d.value === value);
  return found?.label || value;
};

const fileHint = (record) => {
  const name = (record?.original_filename || '').toLowerCase();
  return name;
};

const isPdfResume = (record) => {
  const name = fileHint(record);
  return name.endsWith('.pdf');
};

const isImageResume = (record) => {
  const imageExts = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
  const name = fileHint(record);
  return imageExts.some((ext) => name.endsWith(ext));
};

const ResumeCollectionView = () => {
  const { id } = useParams();
  const { hasAnyPermission } = useAuth();
  const canUpdateNotes = hasAnyPermission([
    'hr.resume_collection.update',
    'super_admin',
  ]);
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesError, setNotesError] = useState('');
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState('');

  useEffect(() => {
    fetchRecord();
  }, [id]);

  useEffect(() => {
    if (!record?.resume_url) {
      setPreviewUrl(null);
      setPreviewError('');
      return undefined;
    }

    let objectUrl = null;
    const loadPreview = async () => {
      try {
        setPreviewLoading(true);
        setPreviewError('');
        const response = await axiosInstance.get(`/resume-collection/${id}/file`, {
          responseType: 'blob',
        });
        const contentType = response.headers['content-type'] || 'application/octet-stream';
        const blob = new Blob([response.data], { type: contentType });
        objectUrl = URL.createObjectURL(blob);
        setPreviewUrl(objectUrl);
      } catch (err) {
        setPreviewUrl(null);
        setPreviewError(err.response?.data?.message || 'Failed to load file preview');
      } finally {
        setPreviewLoading(false);
      }
    };

    loadPreview();
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [id, record?.resume_url]);

  const fetchRecord = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axiosInstance.get(`/resume-collection/${id}`);
      if (response.data.success) {
        setRecord(response.data.data);
        setNotes(response.data.data.notes || '');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load resume');
    } finally {
      setLoading(false);
    }
  };

  const fetchResumeBlob = async (disposition = 'inline') => {
    const response = await axiosInstance.get(`/resume-collection/${id}/file`, {
      responseType: 'blob',
      params: disposition === 'attachment' ? { disposition: 'attachment' } : {},
    });
    const contentType = response.headers['content-type'] || 'application/octet-stream';
    return new Blob([response.data], { type: contentType });
  };

  const handleOpenResume = async () => {
    try {
      const blob = await fetchResumeBlob('inline');
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener');
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to open file');
    }
  };

  const handleDownloadResume = async () => {
    try {
      const blob = await fetchResumeBlob('attachment');
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = record?.original_filename || 'resume';
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to download file');
    }
  };

  const handleSaveNotes = async () => {
    try {
      setSavingNotes(true);
      setNotesError('');
      const response = await axiosInstance.patch(`/resume-collection/${id}`, {
        notes: notes.trim() || null,
      });
      if (response.data.success) {
        setRecord((prev) => ({ ...prev, ...response.data.data }));
        setNotes(response.data.data.notes || '');
        toast.success('Notes saved');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save notes';
      setNotesError(msg);
      toast.error(msg);
    } finally {
      setSavingNotes(false);
    }
  };

  const showPdfPreview = useMemo(
    () => record && isPdfResume(record) && record.resume_url,
    [record],
  );

  const showImagePreview = useMemo(
    () => record && isImageResume(record) && record.resume_url,
    [record],
  );

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="view-wrapper">
          <PageHeader title="View Resume" showBackButton backPath="/hr/resume-collection/list" />
          <div className="loading">Loading...</div>
        </div>
      </>
    );
  }

  if (error || !record) {
    return (
      <>
        <Navbar />
        <div className="view-wrapper">
          <PageHeader title="View Resume" showBackButton backPath="/hr/resume-collection/list" />
          <div className="status-message status-message--error">{error || 'Not found'}</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="view-wrapper">
        <PageHeader title="View Resume" showBackButton backPath="/hr/resume-collection/list" />
        <div className="view-content">
          <div className="view-section">
            <h3 className="view-section-title">Applicant details</h3>
            <div className="view-grid">
              <div className="view-item">
                <span className="view-item-label">Name</span>
                <span className="view-item-value">{record.applicant_name || '—'}</span>
              </div>
              <div className="view-item">
                <span className="view-item-label">Phone</span>
                <span className="view-item-value">{record.phone || '—'}</span>
              </div>
              <div className="view-item">
                <span className="view-item-label">Email</span>
                <span className="view-item-value">{record.email || '—'}</span>
              </div>
              <div className="view-item">
                <span className="view-item-label">CNIC</span>
                <span className="view-item-value">{record.cnic || '—'}</span>
              </div>
              <div className="view-item">
                <span className="view-item-label">Address</span>
                <span className="view-item-value">{record.address || '—'}</span>
              </div>
              <div className="view-item">
                <span className="view-item-label">City</span>
                <span className="view-item-value">{record.city || '—'}</span>
              </div>
              <div className="view-item">
                <span className="view-item-label">Role</span>
                <span className="view-item-value">{record.role || '—'}</span>
              </div>
              <div className="view-item">
                <span className="view-item-label">Department</span>
                <span className="view-item-value">{departmentLabel(record.department)}</span>
              </div>
              <div className="view-item">
                <span className="view-item-label">Experience</span>
                <span className="view-item-value" style={{ whiteSpace: 'pre-wrap' }}>
                  {record.experience || '—'}
                </span>
              </div>
              <div className="view-item">
                <span className="view-item-label">Education</span>
                <span className="view-item-value" style={{ whiteSpace: 'pre-wrap' }}>
                  {record.education || '—'}
                </span>
              </div>
              <div className="view-item">
                <span className="view-item-label">Uploaded</span>
                <span className="view-item-value">{formatDate(record.created_at)}</span>
              </div>
              <div className="view-item">
                <span className="view-item-label">File</span>
                <span className="view-item-value">{record.original_filename || '—'}</span>
              </div>
            </div>
          </div>

          <div className="view-section">
            <h3 className="view-section-title">Notes</h3>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '12px' }}>
              Add or update internal notes. Notes are included in list search and filters.
            </p>
            {notesError && (
              <div className="status-message status-message--error" style={{ marginBottom: '12px' }}>
                {notesError}
              </div>
            )}
            <FormTextarea
              label="Notes"
              name="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={5}
              placeholder="e.g. referred by manager, skills, follow-up date..."
              disabled={!canUpdateNotes}
            />
            {canUpdateNotes ? (
              <div style={{ marginTop: '12px' }}>
                <button
                  type="button"
                  className="primary-btn"
                  onClick={handleSaveNotes}
                  disabled={savingNotes}
                >
                  {savingNotes ? 'Saving...' : 'Save Notes'}
                </button>
              </div>
            ) : (
              <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '8px' }}>
                You need update permission to edit notes.
              </p>
            )}
          </div>

          {record.resume_url && (
            <div className="view-section">
              <h3 className="view-section-title">File</h3>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
                <button type="button" className="primary-btn" onClick={handleOpenResume}>
                  Open in new tab
                </button>
                <button type="button" className="secondary-btn" onClick={handleDownloadResume}>
                  Download
                </button>
              </div>

              {previewLoading && <div className="loading">Loading preview...</div>}
              {previewError && (
                <div className="status-message status-message--error" style={{ marginBottom: '12px' }}>
                  {previewError}
                </div>
              )}

              {previewUrl && !previewLoading && showPdfPreview && (
                <iframe
                  title={`Resume: ${record.applicant_name || record.original_filename || id}`}
                  src={previewUrl}
                  style={{
                    width: '100%',
                    minHeight: '640px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    background: '#fff',
                  }}
                />
              )}

              {previewUrl && !previewLoading && showImagePreview && (
                <img
                  src={previewUrl}
                  alt={record.original_filename || 'Uploaded file'}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '640px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
              )}

              {previewUrl && !previewLoading && !showPdfPreview && !showImagePreview && (
                <p style={{ color: '#64748b', fontSize: '14px' }}>
                  Preview is available for PDF and image files. DOC/DOCX files can be opened or downloaded using the buttons above.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ResumeCollectionView;
