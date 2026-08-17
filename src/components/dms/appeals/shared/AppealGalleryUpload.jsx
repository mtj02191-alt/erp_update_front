import React, { useRef, useState } from 'react';
import axiosInstance from '../../../../utils/axios';

const AppealGalleryUpload = ({ urls = [], onChange, disabled = false }) => {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setError('');
    setUploading(true);
    try {
      const formData = new FormData();
      files.forEach((f) => formData.append('files', f));
      const res = await axiosInstance.post('/appeals/upload/images', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const uploaded = (res.data?.data || []).map((x) => x.url).filter(Boolean);
      onChange([...urls, ...uploaded]);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const removeAt = (index) => {
    onChange(urls.filter((_, i) => i !== index));
  };

  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: 'block', fontWeight: 500, marginBottom: 4 }}>
        Gallery images (optional)
      </label>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        onChange={handleFiles}
        disabled={disabled || uploading}
      />
      {uploading && <p style={{ fontSize: 13, color: '#666' }}>Uploading…</p>}
      {error && <div className="status-message status-message--error">{error}</div>}
      {urls.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
          {urls.map((url, i) => (
            <div key={url} style={{ position: 'relative' }}>
              <img
                src={url}
                alt={`Gallery ${i + 1}`}
                style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 4 }}
              />
              <button
                type="button"
                onClick={() => removeAt(i)}
                style={{
                  position: 'absolute',
                  top: 2,
                  right: 2,
                  background: '#c00',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 2,
                  fontSize: 10,
                  cursor: 'pointer',
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AppealGalleryUpload;
