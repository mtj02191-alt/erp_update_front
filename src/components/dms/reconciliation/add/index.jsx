import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import FormInput from '../../../common/FormInput';
import FormSelect from '../../../common/FormSelect';
import { PrimaryButton } from '../../../common/buttons';
import { useAuth } from '../../../../context/AuthContext';
import { hasPermission } from '../../../../utils/permissions';
import { FiUpload } from 'react-icons/fi';
import '../reconciliation.css';

const UPLOAD_BANK_OPTIONS = [
  { value: 'faysal', label: 'Faysal Bank' },
  { value: 'meezan', label: 'Meezan Bank' },
];

const ReconciliationAdd = () => {
  const navigate = useNavigate();
  const { permissions } = useAuth();

  const canUpload = useMemo(
    () =>
      permissions?.super_admin === true ||
      hasPermission(permissions, 'fund_raising', 'reconciliation', 'create'),
    [permissions],
  );

  const [uploadBank, setUploadBank] = useState('faysal');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadNotes, setUploadNotes] = useState('');
  const [fileInputKey, setFileInputKey] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleUploadSubmit = async (e) => {
    e.preventDefault();

    if (!uploadFile) {
      setError('Please select a statement file (.xls or .xlsx)');
      return;
    }
    if (!uploadBank) {
      setError('Please select a bank');
      return;
    }

    try {
      setUploading(true);
      setError('');
      setSuccessMessage('');

      const formData = new FormData();
      formData.append('file', uploadFile);

      const response = await axiosInstance.post(
        `/reconciliation/upload?bank=${encodeURIComponent(uploadBank)}${uploadNotes ? `&notes=${encodeURIComponent(uploadNotes)}` : ''}`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );

      if (response.data.success) {
        const s = response.data.summary || {};
        const recordId = response.data.data?.id;
        const message = `Reconciliation complete — created: ${s.created_count ?? 0}, skipped: ${s.skipped_count ?? 0}, failed: ${s.failed_count ?? 0}`;

        if (recordId) {
          navigate(`/dms/reconciliation/view/${recordId}`, {
            state: { flashMessage: message },
          });
        } else {
          setSuccessMessage(message);
          setUploadFile(null);
          setUploadNotes('');
          setFileInputKey((k) => k + 1);
        }
      } else {
        setError(response.data.message || 'Upload failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  if (!canUpload) {
    return (
      <>
        <Navbar />
        <div className="form-content">
          <PageHeader
            title="Upload bank statement"
            backPath="/dms/reconciliation/list"
          />
          <div className="reconciliation-summary reconciliation-summary--error">
            You do not have permission to run bank reconciliation.
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="form-content">
        <PageHeader
          title="Upload bank statement"
          backPath="/dms/reconciliation/list"
        />

        {error && (
          <div className="reconciliation-summary reconciliation-summary--error">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="reconciliation-summary">{successMessage}</div>
        )}

        <form onSubmit={handleUploadSubmit} className="form reconciliation-upload-card">
          <div className="form-section">
            <h3 className="reconciliation-section-title">Statement details</h3>
            <p className="reconciliation-notes">
              Upload a bank account statement. Faysal: .xls / .xlsx. Meezan: .csv.
              Credit rows are parsed into donors and donations. Branch name from the
              statement is saved as the donor address.
            </p>

            <div className="form-grid-2">
              <FormSelect
                name="upload_bank"
                label="Bank"
                value={uploadBank}
                onChange={(e) => setUploadBank(e.target.value)}
                options={UPLOAD_BANK_OPTIONS}
                required
              />

              <FormInput
                key={fileInputKey}
                name="statement_file"
                label="Statement file"
                type="file"
                accept=".xls,.xlsx,.csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
                onChange={(e) => {
                  setUploadFile(e.target.files?.[0] || null);
                  if (error) setError('');
                }}
                required
              />

              <FormInput
                name="upload_notes"
                label="Notes (optional)"
                type="text"
                value={uploadNotes}
                onChange={(e) => setUploadNotes(e.target.value)}
                placeholder="e.g. June 2026 Faysal statement"
              />
            </div>

            <div className="form-actions">
              <PrimaryButton
                type="submit"
                loading={uploading}
                loadingText="Processing…"
                icon={<FiUpload />}
              >
                Upload & reconcile
              </PrimaryButton>
            </div>
          </div>
        </form>
      </div>
    </>
  );
};

export default ReconciliationAdd;
