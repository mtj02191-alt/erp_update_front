import React, { useMemo, useRef, useState } from 'react';
import { FiDownload, FiUpload, FiX } from 'react-icons/fi';
import axiosInstance from '../../../utils/axios';
import { getImportConfig } from './dataImportConfig';
import '../Modal.css';
import './index.css';

const escapeCsvCell = (value) => {
  const str = value == null ? '' : String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const buildTemplateCsv = (headers, sampleRow) => {
  const headerLine = headers.map(escapeCsvCell).join(',');
  const sampleLine = headers
    .map((key) => escapeCsvCell(sampleRow[key] ?? ''))
    .join(',');
  return `${headerLine}\n${sampleLine}\n`;
};

const downloadTextFile = (content, filename) => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.download = filename;
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

function ImportDialogContent({
  config,
  file,
  fileInputRef,
  error,
  uploading,
  result,
  failedRows,
  onClose,
  onDownloadTemplate,
  onFileChange,
  onSubmit,
}) {
  return (
    <div className="custom-modal-overlay" role="presentation">
      <div className="custom-modal-content data-import-modal" role="dialog" aria-modal="true">
        <button type="button" className="custom-modal-close" onClick={onClose} aria-label="Close">
          <FiX />
        </button>
        <h2>Import {config.label}</h2>

        <div className="data-import-panel">
          <p>{config.description}</p>

          <div className="data-import-actions">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="data-import-file-input"
              id="data-import-csv-file"
              onChange={onFileChange}
            />
            <label htmlFor="data-import-csv-file" className="data-import-file-label">
              <FiUpload /> Choose CSV
            </label>
            <button type="button" className="data-import-template-btn" onClick={onDownloadTemplate}>
              <FiDownload /> Download template
            </button>
          </div>

          {file && (
            <p className="data-import-selected">
              Selected: <strong>{file.name}</strong> ({Math.round(file.size / 1024)} KB)
            </p>
          )}

          {!result && (
            <button
              type="button"
              className="data-import-submit"
              onClick={onSubmit}
              disabled={uploading || !file}
            >
              {uploading ? 'Importing…' : 'Start import'}
            </button>
          )}

          {error && (
            <div className="data-import-summary data-import-summary--error" style={{ marginTop: 12 }}>
              {error}
            </div>
          )}

          {result && (
            <>
              <div className="data-import-summary">
                <p>
                  <strong>Total rows:</strong> {result.total_rows}
                </p>
                <p>
                  <strong>Succeeded:</strong> {result.success_count}
                </p>
                <p>
                  <strong>Failed:</strong> {result.failed_count}
                </p>
                <p>
                  <strong>Skipped:</strong> {result.skipped_count}
                </p>
              </div>

              {failedRows.length > 0 && (
                <div className="data-import-errors">
                  <table>
                    <thead>
                      <tr>
                        <th>Row</th>
                        <th>Email</th>
                        <th>Error</th>
                      </tr>
                    </thead>
                    <tbody>
                      {failedRows.map((row) => (
                        <tr key={`${row.row}-${row.email || row.error}`}>
                          <td>{row.row}</td>
                          <td>{row.email || '—'}</td>
                          <td>{row.error || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Reusable CSV import (button + dialog). Backend: POST /data-import/:entityName
 */
const DataImport = ({
  entityName,
  buttonText = 'Import CSV',
  disabled = false,
  onImportComplete,
}) => {
  const config = useMemo(() => getImportConfig(entityName), [entityName]);
  const fileInputRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const resetState = () => {
    setFile(null);
    setError('');
    setResult(null);
    setUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleOpen = () => {
    resetState();
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    resetState();
  };

  const handleDownloadTemplate = () => {
    if (!config) return;
    const csv = buildTemplateCsv(config.headers, config.sampleRow || {});
    downloadTextFile(csv, `${config.templateFilename || entityName}-template.csv`);
  };

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    setFile(selected || null);
    setError('');
    setResult(null);
  };

  const handleSubmit = async () => {
    if (!file) {
      setError('Please choose a CSV file.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploading(true);
      setError('');
      const res = await axiosInstance.post(`/data-import/${entityName}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (!res.data?.success) {
        setError(res.data?.message || 'Import failed');
        return;
      }

      setResult(res.data.data);
      if (res.data.data?.success_count > 0 && onImportComplete) {
        onImportComplete(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Import failed');
    } finally {
      setUploading(false);
    }
  };

  if (!config) {
    return null;
  }

  const failedRows = result?.results?.filter((r) => !r.success) || [];

  return (
    <>
      <button
        type="button"
        className="data-import-trigger"
        onClick={handleOpen}
        disabled={disabled}
        title={`Import ${config.label}`}
      >
        <FiUpload />
        <span>{buttonText}</span>
      </button>

      {open && (
        <ImportDialogContent
          config={config}
          file={file}
          fileInputRef={fileInputRef}
          error={error}
          uploading={uploading}
          result={result}
          failedRows={failedRows}
          onClose={handleClose}
          onDownloadTemplate={handleDownloadTemplate}
          onFileChange={handleFileChange}
          onSubmit={handleSubmit}
        />
      )}
    </>
  );
};

export default DataImport;
