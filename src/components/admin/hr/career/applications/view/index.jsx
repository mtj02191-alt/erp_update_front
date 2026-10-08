import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axiosInstance from '../../../../../../utils/axios';
import PageHeader from '../../../../../common/PageHeader';
import Navbar from '../../../../../Navbar';
import {
  FiDownload,
  FiMail,
  FiPhone,
  FiUser,
  FiBriefcase,
  FiFileText,
  FiMapPin,
  FiBookOpen,
  FiShield,
} from 'react-icons/fi';

const STATUS_OPTIONS = ['pending', 'reviewed', 'shortlisted', 'rejected', 'hired'];

const DISCLOSURE_QUESTIONS = [
  { key: 'dismissed', label: 'Were you ever dismissed or asked to leave a job?' },
  { key: 'serviceBond', label: 'Are you under any service bond with your employer?' },
  { key: 'criminalCharges', label: 'Have any criminal charges been brought against you?' },
  { key: 'relativeWorking', label: 'Is any of your relative working at MTJ Foundation?' },
  { key: 'approachEmployer', label: 'Can we approach your present employer?' },
];

const humanize = (value) => {
  if (value === null || value === undefined || value === '') return '-';
  return String(value)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

const formatDateTime = (dateString) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const DetailItem = ({ label, children }) => (
  <div className="detail-item">
    <label className="detail-label">{label}</label>
    <div className="detail-value">{children ?? '-'}</div>
  </div>
);

const AdminApplicationView = () => {
  const { id } = useParams();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [savingStatus, setSavingStatus] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    fetchApplication();
  }, [id]);

  const fetchApplication = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axiosInstance.get(`/job_applications/${id}`);
      const data = response.data?.data || null;
      setApplication(data);
      setStatus(data?.status || 'pending');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch application details');
      console.error('Error fetching application:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusSave = async () => {
    if (!application || status === application.status) return;
    try {
      setSavingStatus(true);
      setStatusMessage('');
      const response = await axiosInstance.patch(`/job_applications/${id}`, { status });
      setApplication((prev) => ({ ...prev, ...(response.data?.data || {}), status }));
      setStatusMessage('Status updated');
    } catch (err) {
      setStatusMessage(err.response?.data?.message || 'Failed to update status');
      console.error('Error updating status:', err);
    } finally {
      setSavingStatus(false);
    }
  };

  const renderShell = (content) => (
    <>
      <Navbar />
      <div className="view-wrapper">
        <div className="view-content">{content}</div>
      </div>
    </>
  );

  if (loading) return renderShell(<div className="empty-state">Loading application details...</div>);
  if (error) return renderShell(<div className="status-message status-message--error">{error}</div>);
  if (!application) return renderShell(<div className="empty-state">Application not found</div>);

  const applicantName =
    application.applicant_name ||
    [application.first_name, application.last_name].filter(Boolean).join(' ') ||
    'Applicant';
  const education = Array.isArray(application.education) ? application.education : [];
  const experience = Array.isArray(application.experience) ? application.experience : [];
  const disclosure = application.disclosure || {};

  return renderShell(
    <>
      <PageHeader
        title="Application Details"
        subtitle={`Reviewing application from ${applicantName}`}
        showBackButton={true}
        backPath="/hr/career/applications/list"
      />

      <div className="detail-section">
        <h3 className="section-title">
          <FiBriefcase className="icon" />
          Job & Status
        </h3>
        <div className="detail-grid">
          <DetailItem label="Job">
            {application.job?.title || (application.job_id ? `Job #${application.job_id}` : 'General application')}
          </DetailItem>
          <DetailItem label="Applied Date">{formatDateTime(application.created_at)}</DetailItem>
          <DetailItem label="Last Updated">{formatDateTime(application.updated_at)}</DetailItem>
          <div className="detail-item">
            <label className="detail-label">Status</label>
            <div className="detail-value" style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <select value={status} onChange={(e) => setStatus(e.target.value)} disabled={savingStatus}>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {humanize(s)}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="primary_btn"
                onClick={handleStatusSave}
                disabled={savingStatus || status === application.status}
              >
                {savingStatus ? 'Saving...' : 'Update'}
              </button>
              {statusMessage && <span style={{ fontSize: '12px' }}>{statusMessage}</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="detail-section">
        <h3 className="section-title">
          <FiUser className="icon" />
          Personal Information
        </h3>
        <div className="detail-grid">
          <DetailItem label="Full Name">{applicantName}</DetailItem>
          <DetailItem label="Father Name">{application.father_name || '-'}</DetailItem>
          <DetailItem label="CNIC">{application.cnic || '-'}</DetailItem>
          <DetailItem label="Gender">{humanize(application.gender)}</DetailItem>
          <DetailItem label="Marital Status">{humanize(application.marital_status)}</DetailItem>
          {application.husband_name && (
            <DetailItem label="Husband Name">{application.husband_name}</DetailItem>
          )}
          <DetailItem label="Disability">{humanize(application.disability)}</DetailItem>
        </div>
      </div>

      <div className="detail-section">
        <h3 className="section-title">
          <FiMapPin className="icon" />
          Contact Information
        </h3>
        <div className="detail-grid">
          <DetailItem label={<><FiMail className="icon" /> Email</>}>
            {application.email ? (
              <a href={`mailto:${application.email}`} className="link">
                {application.email}
              </a>
            ) : (
              '-'
            )}
          </DetailItem>
          <DetailItem label={<><FiPhone className="icon" /> Mobile</>}>
            {application.phone_number ? (
              <a href={`tel:${application.phone_number}`} className="link">
                {application.phone_number}
              </a>
            ) : (
              '-'
            )}
          </DetailItem>
          <DetailItem label="Office Phone">{application.office_phone || '-'}</DetailItem>
          <DetailItem label="Residence Phone">{application.residence_phone || '-'}</DetailItem>
          <DetailItem label="Country">{application.country || '-'}</DetailItem>
          <DetailItem label="State / Province">{application.state || '-'}</DetailItem>
          <DetailItem label="City">{application.city || '-'}</DetailItem>
          <DetailItem label="Postal Code">{application.postal_code || '-'}</DetailItem>
          <DetailItem label="Current Address">{application.current_address || '-'}</DetailItem>
          <DetailItem label="Permanent Address">{application.permanent_address || '-'}</DetailItem>
        </div>
      </div>

      <div className="detail-section">
        <h3 className="section-title">
          <FiBookOpen className="icon" />
          Education
        </h3>
        {education.length === 0 ? (
          <div className="empty-state">No education records</div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Program</th>
                  <th>Specialization</th>
                  <th>Year</th>
                  <th>Result</th>
                </tr>
              </thead>
              <tbody>
                {education.map((row, idx) => (
                  <tr key={idx}>
                    <td>{humanize(row.type)}</td>
                    <td>{row.program || '-'}</td>
                    <td>{row.specialization || '-'}</td>
                    <td>{row.yearOfCompletion || '-'}</td>
                    <td>{humanize(row.resultStatus)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="detail-section">
        <h3 className="section-title">
          <FiBriefcase className="icon" />
          Work Experience
        </h3>
        <div className="detail-grid">
          <DetailItem label="Has Work Experience">
            {application.has_work_experience === true
              ? 'Yes'
              : application.has_work_experience === false
                ? 'No'
                : '-'}
          </DetailItem>
        </div>
        {experience.length > 0 && (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Job Title</th>
                  <th>Location</th>
                  <th>Total Experience</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {experience.map((row, idx) => (
                  <tr key={idx}>
                    <td>{row.company || '-'}</td>
                    <td>{row.jobTitle || '-'}</td>
                    <td>{row.location || '-'}</td>
                    <td>{row.totalExperience || '-'}</td>
                    <td>{row.description || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="detail-section">
        <h3 className="section-title">
          <FiShield className="icon" />
          Disclosure
        </h3>
        <div className="detail-grid">
          {DISCLOSURE_QUESTIONS.map((q) => (
            <DetailItem key={q.key} label={q.label}>
              {humanize(disclosure[q.key])}
            </DetailItem>
          ))}
        </div>
      </div>

      <div className="detail-section">
        <h3 className="section-title">
          <FiFileText className="icon" />
          Resume & Cover Letter
        </h3>
        {application.cover_letter ? (
          <div className="text-content">{application.cover_letter}</div>
        ) : (
          <div className="empty-state">No cover letter provided</div>
        )}
        <br />
        {application.resume_url ? (
          <div className="resume-actions text-center">
            <a
              href={application.resume_url}
              target="_blank"
              rel="noopener noreferrer"
              className="secondary_btn"
            >
              <FiDownload className="icon" />
              {application.original_filename || 'Download Resume'}
            </a>
          </div>
        ) : (
          <div className="empty-state">No resume uploaded</div>
        )}
      </div>
    </>
  );
};

export default AdminApplicationView;
