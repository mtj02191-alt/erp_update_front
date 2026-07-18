import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../../../../../../utils/axios';
import Navbar from '../../../../../Navbar';
import PageHeader from '../../../../../common/PageHeader';
import { FiBriefcase, FiUsers } from 'react-icons/fi';

const ViewJob = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchJob();
  }, [id]);

  const fetchJob = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/jobs/${id}`);
      console.log("response", response);
      if (response.data.success) {
        setJob(response.data.data);
        setError('');
      } else {
        setError('Failed to fetch job data');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch job data. Please try again.');
      console.error('Error fetching job:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'active': { class: 'status-completed', text: 'Active' },
      'closed': { class: 'status-cancelled', text: 'Closed' },
      'draft': { class: 'status-pending', text: 'Draft' }
    };
    
    const statusInfo = statusMap[status] || { class: 'status-pending', text: status };
    return <span className={`status-badge ${statusInfo.class}`}>{statusInfo.text}</span>;
  };

  const getDepartmentBadge = (department) => {
    const deptMap = {
      'IT': { class: 'job-dept-it', text: 'IT' },
      'Marketing': { class: 'job-dept-marketing', text: 'Marketing' },
      'Design': { class: 'job-dept-design', text: 'Design' },
      'Operations': { class: 'job-dept-operations', text: 'Operations' }
    };
    
    const deptInfo = deptMap[department] || { class: 'job-dept-standard', text: department };
    return <span className={`job-dept-badge ${deptInfo.class}`}>{deptInfo.text}</span>;
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="view-wrapper">
          <PageHeader 
            title="View Job"
            showBackButton={true}
            backPath="/hr/careers/jobs/list"
          />
          <div className="loading">Loading...</div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className="view-wrapper">
          <PageHeader 
            title="View Job"
            showBackButton={true}
            backPath="/hr/careers/jobs/list"
          />
          <div className="view-content">
            <div className="status-message status-message--error">{error}</div>
          </div>
        </div>
      </>
    );
  }
  
  if (!job) {
    return (
      <>
        <Navbar />
        <div className="view-wrapper">
          <PageHeader 
            title="View Job"
            showBackButton={true}
            backPath="/hr/careers/jobs/list"
          />
          <div className="view-content">
            <div className="status-message status-message--error">Job not found</div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="view-wrapper">
        <PageHeader 
          title="View Job"
          showBackButton={true}
          backPath="/hr/careers/jobs/list"
        />
        <div className="view-content">
          {/* Basic Information */}
          <div className="view-section">
            <h3 className="view-section-title">Basic Information</h3>
            <div className="view-grid">
              <div className="view-item">
                <span className="view-item-label">Job Title</span>
                <span className="view-item-value">
                  {job.is_featured && <span style={{ color: '#f59e0b', marginRight: '4px' }}>⭐</span>}
                  {job.title}
                </span>
              </div>
              <div className="view-item">
                <span className="view-item-label">Slug</span>
                <span className="view-item-value">{job.slug || '-'}</span>
              </div>
              <div className="view-item">
                <span className="view-item-label">Department</span>
                <span className="view-item-value">{getDepartmentBadge(job.department)}</span>
              </div>
              <div className="view-item">
                <span className="view-item-label">Job Type</span>
                <span className="view-item-value">{job.type}</span>
              </div>
              <div className="view-item">
                <span className="view-item-label">Location</span>
                <span className="view-item-value">{job.location || '-'}</span>
              </div>
              <div className="view-item">
                <span className="view-item-label">Experience</span>
                <span className="view-item-value">{job.experience || '-'}</span>
              </div>
              <div className="view-item">
                <span className="view-item-label">Status</span>
                <span className="view-item-value">{getStatusBadge(job.status)}</span>
              </div>
              <div className="view-item">
                <span className="view-item-label">Featured</span>
                <span className="view-item-value">{job.is_featured ? 'Yes' : 'No'}</span>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="view-section">
            <h3 className="view-section-title">Dates</h3>
            <div className="view-grid">
              <div className="view-item">
                <span className="view-item-label">Posted Date</span>
                <span className="view-item-value">{formatDate(job.posted_date)}</span>
              </div>
              <div className="view-item">
                <span className="view-item-label">Closing Date</span>
                <span className="view-item-value">{formatDate(job.closing_date)}</span>
              </div>
            </div>
          </div>

          {/* Job Description */}
          <div className="view-section">
            <h3 className="view-section-title">Job Description</h3>
            <div className="view-item view-item--full">
              <div style={{ width: '100%' }}>
                <div className="view-item-label" style={{ marginBottom: '10px' }}>About</div>
                <div className="view-item-value" style={{ 
                  whiteSpace: 'pre-wrap', 
                  lineHeight: '1.6',
                  padding: '15px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '6px',
                  border: '1px solid #e5e7eb'
                }}>
                  {job.about || '-'}
                </div>
              </div>
            </div>
          </div>

          {/* Qualifications */}
          <div className="view-section">
            <h3 className="view-section-title">Qualifications</h3>
            {job.qualifications && job.qualifications.length > 0 ? (
              <ul style={{ 
                listStyle: 'none', 
                padding: 0,
                margin: 0
              }}>
                {job.qualifications.map((qual, index) => (
                  <li key={index} style={{
                    padding: '12px 16px',
                    marginBottom: '8px',
                    backgroundColor: '#f9fafb',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px'
                  }}>
                    <span style={{ 
                      color: '#2563eb', 
                      fontWeight: '600',
                      marginTop: '2px'
                    }}>•</span>
                    <span style={{ flex: 1 }}>{qual}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div style={{ color: '#666', fontStyle: 'italic' }}>No qualifications specified</div>
            )}
          </div>

          {/* Responsibilities */}
          <div className="view-section">
            <h3 className="view-section-title">Responsibilities</h3>
            {job.responsibilities && job.responsibilities.length > 0 ? (
              <ul style={{ 
                listStyle: 'none', 
                padding: 0,
                margin: 0
              }}>
                {job.responsibilities.map((resp, index) => (
                  <li key={index} style={{
                    padding: '12px 16px',
                    marginBottom: '8px',
                    backgroundColor: '#f9fafb',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px'
                  }}>
                    <span style={{ 
                      color: '#10b981', 
                      fontWeight: '600',
                      marginTop: '2px'
                    }}>•</span>
                    <span style={{ flex: 1 }}>{resp}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div style={{ color: '#666', fontStyle: 'italic' }}>No responsibilities specified</div>
            )}
          </div>

          {/* Applications */}
          <div className="view-section">
            <h3 className="view-section-title">Applications</h3>
            <div className="view-grid">
              <div className="view-item">
                <span className="view-item-label">Total Applications</span>
                <span className="view-item-value">
                  {job.applications?.length || 0}
                </span>
              </div>
            </div>
            {job.applications && job.applications.length > 0 && (
              <button
                onClick={() => navigate(`/hr/career/applications/list?jobId=${job.id}`)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 24px',
                  backgroundColor: '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                  marginTop: '15px'
                }}
              >
                <FiUsers /> View Applications
              </button>
            )}
          </div>

          {/* System Information */}
          <div className="view-section">
            <h3 className="view-section-title">System Information</h3>
            <div className="view-grid">
              <div className="view-item">
                <span className="view-item-label">Created At</span>
                <span className="view-item-value">{formatDate(job.created_at)}</span>
              </div>
              <div className="view-item">
                <span className="view-item-label">Updated At</span>
                <span className="view-item-value">{formatDate(job.updated_at)}</span>
              </div>
              <div className="view-item">
                <span className="view-item-label">Record ID</span>
                <span className="view-item-value">{job.id}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ViewJob;

