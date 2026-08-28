import React, { useRef, useState } from 'react';
import axiosInstance from '../../../../utils/axios';

/**
 * Upload image to S3 via POST /website-donation-projects/upload/image
 * (stored under donations/website-donation-projects/ on S3).
 */
const PageContentImageUpload = ({
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
        '/website-donation-projects/upload/image',
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
    <div className="wdp-image-upload">
      <label className="wdp-image-upload__label">{label}</label>
      <div className="wdp-image-upload__controls">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFile}
          disabled={disabled || uploading}
          className="wdp-image-upload__file"
        />
        {uploading && (
          <span className="wdp-image-upload__status">Uploading…</span>
        )}
      </div>
      <input
        type="text"
        className="wdp-image-upload__url"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled || uploading}
      />
      {localError && (
        <div className="status-message status-message--error wdp-image-upload__error">
          {localError}
        </div>
      )}
      {value ? (
        <div className="wdp-image-upload__preview">
          <img src={value} alt={label} />
        </div>
      ) : null}
    </div>
  );
};

export default PageContentImageUpload;
