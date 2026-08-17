import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../../../utils/axios';
import Navbar from '../../../../Navbar';
import PageHeader from '../../../../common/PageHeader';
import FormInput from '../../../../common/FormInput';
import FormSelect from '../../../../common/FormSelect';
import FormTextarea from '../../../../common/FormTextarea';
import DocumentAutoFillUploader, { EMPTY_FORM } from '../DocumentAutoFillUploader';
import { departments } from '../../../../../utils/user';

const ResumeCollectionAdd = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const [stagedUpload, setStagedUpload] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  const departmentOptions = [
    { value: '', label: '— Not specified —' },
    ...departments,
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const MAX_FILE_BYTES = 5 * 1024 * 1024;

  const handleFieldsExtracted = useCallback((parsed) => {
    setForm((prev) => {
      const next = { ...prev };
      Object.entries(parsed).forEach(([key, value]) => {
        if (value && key in next) next[key] = value;
      });
      return next;
    });
  }, []);

  const handleClearAutoFill = useCallback((empty) => {
    setForm({ ...empty });
  }, []);

  const handleUploadStaged = useCallback((upload) => {
    setStagedUpload(upload);
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    if (file && file.size > MAX_FILE_BYTES) {
      setResumeFile(null);
      setStagedUpload(null);
      setError('File must be 5MB or smaller');
      e.target.value = '';
      return;
    }
    setResumeFile(file);
    setStagedUpload(null);
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!resumeFile) {
      setError('Please select a file (PDF, DOC, DOCX, or image)');
      return;
    }
    if (resumeFile.size > MAX_FILE_BYTES) {
      setError('File must be 5MB or smaller');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const formData = new FormData();
      if (stagedUpload) {
        formData.append('resume_url', stagedUpload.resume_url);
        formData.append('resume_file_key', stagedUpload.resume_file_key);
        if (stagedUpload.original_filename) {
          formData.append('original_filename', stagedUpload.original_filename);
        }
      } else {
        formData.append('resume', resumeFile);
      }
      const textFields = [
        'applicant_name',
        'phone',
        'email',
        'cnic',
        'address',
        'city',
        'role',
        'experience',
        'education',
        'notes',
      ];
      textFields.forEach((key) => {
        if (form[key]?.trim()) formData.append(key, form[key].trim());
      });
      if (form.department) formData.append('department', form.department);

      const response = await axiosInstance.post('/resume-collection', formData);
      if (response.data?.success === false) {
        setError(response.data?.message || 'Failed to upload resume');
        return;
      }
      navigate('/hr/resume-collection/list');
    } catch (err) {
      const data = err.response?.data;
      const msg = data?.message;
      setError(
        Array.isArray(msg)
          ? msg.join(', ')
          : msg || err.message || 'Failed to upload resume',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="form-content">
        <PageHeader
          title="Upload Resume"
          onBack={() => navigate('/hr/resume-collection/list')}
        />

        {error && <div className="status-message status-message--error">{error}</div>}

        <form onSubmit={handleSubmit} className="form">
          <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
            Add a resume or document to the HR collection (max 5MB). When you select a file, it is uploaded and AI extracts applicant details — review before saving.
          </p>

          <h3 className="form-section-title">Resume file</h3>
          <div className="form-section">
            <div className="form-group">
              <label className="form-label">
                Resume file <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.gif,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png,image/webp,image/gif"
                onChange={handleFileChange}
                required
              />
              {resumeFile && (
                <small style={{ display: 'block', marginTop: '6px', color: '#64748b' }}>
                  Selected: {resumeFile.name}
                </small>
              )}
            </div>

            <DocumentAutoFillUploader
              file={resumeFile}
              onFieldsExtracted={handleFieldsExtracted}
              onUploadStaged={handleUploadStaged}
              onAnalyzingChange={setAnalyzing}
              onClearForm={handleClearAutoFill}
            />
            {stagedUpload && (
              <small style={{ display: 'block', color: '#059669', marginTop: '4px' }}>
                File uploaded to storage. You can save when ready.
              </small>
            )}
          </div>

          <h3 className="form-section-title">Applicant details</h3>
          <div className="form-section">
            <div className="form-grid-2">
              <FormInput
                label="Applicant name (optional)"
                name="applicant_name"
                value={form.applicant_name}
                onChange={handleChange}
                placeholder="Full name"
              />
              <FormInput
                label="Phone (optional)"
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                placeholder="03XXXXXXXXX"
              />
              <FormInput
                label="Email (optional)"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="email@example.com"
              />
              <FormInput
                label="CNIC (optional)"
                name="cnic"
                value={form.cnic}
                onChange={handleChange}
                placeholder="35202-1234567-1"
              />
            </div>
            <FormInput
              label="Address (optional)"
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="Full address"
            />
            <div className="form-grid-2">
              <FormInput
                label="City (optional)"
                name="city"
                value={form.city}
                onChange={handleChange}
                placeholder="City"
              />
              <FormInput
                label="Role (optional)"
                name="role"
                value={form.role}
                onChange={handleChange}
                placeholder="Job title / role"
              />
              <FormSelect
                label="Department (optional)"
                name="department"
                value={form.department}
                options={departmentOptions}
                onChange={handleChange}
              />
            </div>
          </div>

          <h3 className="form-section-title">Experience & education</h3>
          <div className="form-section">
            <div className="form-grid-2">
              <FormTextarea
                label="Experience (optional)"
                name="experience"
                value={form.experience}
                onChange={handleChange}
                rows={4}
                placeholder="Work experience"
              />
              <FormTextarea
                label="Education (optional)"
                name="education"
                value={form.education}
                onChange={handleChange}
                rows={4}
                placeholder="Education / qualifications"
              />
            </div>
          </div>

          <h3 className="form-section-title">Notes</h3>
          <div className="form-section">
            <FormTextarea
              label="Internal notes (optional)"
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={3}
              placeholder="Internal notes about this resume"
            />
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="secondary-btn"
              onClick={() => navigate('/hr/resume-collection/list')}
            >
              Cancel
            </button>
              <button
                type="submit"
                className="primary-btn"
                disabled={loading || analyzing}
              >
                {loading ? 'Saving...' : analyzing ? 'Analyzing...' : 'Save to Collection'}
              </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default ResumeCollectionAdd;
