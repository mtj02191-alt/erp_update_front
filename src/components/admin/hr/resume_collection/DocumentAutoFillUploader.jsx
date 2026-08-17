import React, { useEffect, useState, useRef } from 'react';
import axiosInstance from '../../../../utils/axios';

const EMPTY_FORM = {
  applicant_name: '',
  phone: '',
  email: '',
  cnic: '',
  address: '',
  city: '',
  role: '',
  experience: '',
  education: '',
  department: '',
  notes: '',
};

const SUPPORTED_EXTENSIONS = /\.(pdf|doc|docx|jpe?g|png|webp|gif)$/i;

/**
 * Sends the file to the backend for OpenAI extraction + parallel S3 upload.
 */
const DocumentAutoFillUploader = ({
  file,
  onFieldsExtracted,
  onUploadStaged,
  onAnalyzingChange,
  onClearForm,
}) => {
  const [extracting, setExtracting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [extractError, setExtractError] = useState('');
  const [extractInfo, setExtractInfo] = useState('');
  const lastFileRef = useRef(null);

  useEffect(() => {
    if (!file) {
      setExtractError('');
      setExtractInfo('');
      setExtracting(false);
      setUploading(false);
      lastFileRef.current = null;
      onUploadStaged?.(null);
      onAnalyzingChange?.(false);
      return;
    }

    if (lastFileRef.current === file) return;
    lastFileRef.current = file;

    if (!SUPPORTED_EXTENSIONS.test(file.name)) {
      setExtractError('');
      setExtractInfo(
        'AI auto-fill supports PDF, DOC, DOCX, and images. You can still upload and enter details manually.',
      );
      onUploadStaged?.(null);
      onAnalyzingChange?.(false);
      return;
    }

    let cancelled = false;

    const run = async () => {
      onAnalyzingChange?.(true);
      setExtracting(true);
      setUploading(true);
      setExtractError('');
      setExtractInfo('');
      onUploadStaged?.(null);

      try {
        const formData = new FormData();
        formData.append('resume', file);

        const response = await axiosInstance.post('/resume-collection/analyze', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        if (cancelled) return;

        if (response.data?.success === false) {
          throw new Error(response.data?.message || 'Failed to analyze resume');
        }

        const { extracted, upload, extraction_error: extractionError } =
          response.data?.data || {};

        if (upload) {
          onUploadStaged?.(upload);
        }

        if (extracted) {
          const parsed = Object.fromEntries(
            Object.entries(extracted).filter(([, value]) => value != null && value !== ''),
          );
          onFieldsExtracted?.(parsed);

          const count = Object.keys(parsed).length;
          if (count > 0) {
            setExtractInfo(
              `AI extracted ${count} field(s). Review and edit before saving.`,
            );
          } else if (extractionError) {
            setExtractError(extractionError);
          } else {
            setExtractInfo('File uploaded. No fields were detected — enter details manually.');
          }
        }

        if (extractionError && !extracted) {
          setExtractError(extractionError);
        } else if (extractionError) {
          setExtractInfo((prev) =>
            prev
              ? `${prev} (${extractionError})`
              : `File uploaded. ${extractionError}`,
          );
        }
      } catch (err) {
        if (!cancelled) {
          const msg =
            err.response?.data?.message ||
            err.message ||
            'Failed to analyze resume with AI';
          setExtractError(Array.isArray(msg) ? msg.join(', ') : msg);
          onUploadStaged?.(null);
        }
      } finally {
        if (!cancelled) {
          setExtracting(false);
          setUploading(false);
          onAnalyzingChange?.(false);
        }
      }
    };

    run();

    return () => {
      cancelled = true;
      onAnalyzingChange?.(false);
    };
  }, [file, onFieldsExtracted, onUploadStaged, onAnalyzingChange]);

  const handleClear = () => {
    setExtractError('');
    setExtractInfo('');
    onClearForm?.(EMPTY_FORM);
  };

  if (!file) return null;

  const busy = extracting || uploading;

  return (
    <div
      className="document-autofill-panel"
      style={{
        marginBottom: '16px',
        padding: '12px 14px',
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
        background: '#f8fafc',
      }}
    >
      <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
        AI auto-fill (OpenAI)
      </div>

      {busy && (
        <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 8px' }}>
          {extracting && uploading
            ? 'Uploading file and extracting details with AI...'
            : uploading
              ? 'Uploading file...'
              : 'Extracting details with AI...'}
        </p>
      )}

      {extractInfo && !busy && (
        <p style={{ fontSize: '13px', color: '#059669', margin: '0 0 8px' }}>{extractInfo}</p>
      )}

      {extractError && (
        <p style={{ fontSize: '13px', color: '#dc2626', margin: '0 0 8px' }}>{extractError}</p>
      )}

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button
          type="button"
          className="secondary-btn"
          style={{ padding: '6px 12px', fontSize: '13px' }}
          onClick={handleClear}
          disabled={busy}
        >
          Clear auto-filled fields
        </button>
      </div>
    </div>
  );
};

export default DocumentAutoFillUploader;
export { EMPTY_FORM };
