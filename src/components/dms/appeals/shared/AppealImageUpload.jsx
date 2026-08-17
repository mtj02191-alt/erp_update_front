import React, { useRef, useState } from 'react';
import axiosInstance from '../../../../utils/axios';

/**
 * Upload image to S3 via POST /appeals/upload/image?purpose=...
 * Sets urlFieldName on parent form state when done.
 */
const AppealImageUpload = ({
  label,
  purpose,
  urlFieldName,
  urlValue,
  onUrlChange,
  disabled = false,
}) => {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLocalError('');
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await axiosInstance.post(
        `/appeals/upload/image?purpose=${encodeURIComponent(purpose)}`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      const url = res.data?.data?.url;
      if (!url) throw new Error('No URL returned from server');
      onUrlChange(urlFieldName, url);
    } catch (err) {
      setLocalError(err.response?.data?.message || err.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="appeal-image-upload" style={{ marginBottom: 12 }}>
      <label style={{ display: 'block', fontWeight: 500, marginBottom: 4 }}>{label}</label>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFile}
          disabled={disabled || uploading}
        />
        {uploading && <span style={{ fontSize: 13, color: '#666' }}>Uploading…</span>}
      </div>
      {localError && (
        <div className="status-message status-message--error" style={{ marginTop: 6 }}>
          {localError}
        </div>
      )}
      {urlValue && (
        <div style={{ marginTop: 8 }}>
          <img
            src={urlValue}
            alt={label}
            style={{ maxWidth: 200, maxHeight: 120, objectFit: 'cover', borderRadius: 4 }}
          />
          <p style={{ fontSize: 11, color: '#888', wordBreak: 'break-all', marginTop: 4 }}>
            {urlValue}
          </p>
        </div>
      )}
    </div>
  );
};

export default AppealImageUpload;
