import React, { useRef, useState } from 'react';
import axiosInstance from '../../../../utils/axios';

/**
 * Upload image to S3 via POST /website-home-hero/upload/image
 * (stored under donations/website-home-hero/ on S3).
 */
const HeroSlideImageUpload = ({
  label,
  value = '',
  onChange,
  disabled = false,
  placeholder = 'https://... or upload a file',
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
        '/website-home-hero/upload/image',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      const url = res.data?.data?.url;
      if (!url) throw new Error('No URL returned from server');
      onChange(url);
    } catch (err) {
      setLocalError(
        err.response?.data?.message || err.message || 'Upload failed',
      );
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="form-group" style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>
        {label}
      </label>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFile}
          disabled={disabled || uploading}
        />
        {uploading && <span>Uploading…</span>}
      </div>
      <input
        type="text"
        className="form-control"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled || uploading}
        style={{ width: '100%' }}
      />
      {localError && (
        <div className="status-message status-message--error" style={{ marginTop: 6 }}>
          {localError}
        </div>
      )}
      {value ? (
        <div style={{ marginTop: 10 }}>
          <img
            src={value}
            alt={label}
            style={{ maxWidth: '100%', maxHeight: 180, objectFit: 'contain', borderRadius: 8 }}
          />
        </div>
      ) : null}
    </div>
  );
};

export default HeroSlideImageUpload;
