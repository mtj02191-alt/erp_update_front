import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../../../../../utils/axios';
import PageHeader from '../../../../../common/PageHeader';
import Navbar from '../../../../../Navbar';
import { FiDownload, FiMail, FiPhone, FiCalendar, FiUser, FiBriefcase, FiFileText, FiArrowLeft } from 'react-icons/fi';

const AdminApplicationView = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchApplication();
  }, [id]);

  const fetchApplication = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/applications/${id}`);
      console.log("response.data",response.data);
      setApplication(response.data?.data);
    } catch (err) {
      setError('Failed to fetch application details');
      console.error('Error fetching application:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/hr/career/applications/list');
  };

  const handleEdit = () => {
    navigate(`/hr/career/applications/edit/${id}`);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      'pending': 'status-badge status-badge--pending',
      'reviewed': 'status-badge status-badge--reviewed',
      'shortlisted': 'status-badge status-badge--shortlisted',
      'rejected': 'status-badge status-badge--rejected',
      'hired': 'status-badge status-badge--hired'
    };
    
    return (
      <span className={statusClasses[status] || 'status-badge'}>
        {status || 'Pending'}
      </span>
    );
  };

  const downloadResume = () => {
    if (application?.resume_url) {
      const link = document.createElement('a');
      link.href = application.resume_url;
      link.download = `${application.applicant_name}_Resume.pdf`;
      link.click();
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="view-wrapper">
          <div className="view-content">
            <div className="empty-state">Loading application details...</div>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className="view-wrapper">
          <div className="view-content">
            <div className="status-message status-message--error">
              {error}
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!application) {
    return (
      <>
        <Navbar />
        <div className="view-wrapper">
          <div className="view-content">
            <div className="empty-state">Application not found</div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="view-wrapper">
        <div className="view-content">
          <PageHeader 
            title="Application Details" 
            subtitle={`Reviewing application from ${application.applicant_name}`}
            showBackButton={true}
            backPath="/hr/career/applications/list"
            showEdit={true}
            editPath={`/hr/career/applications/edit/${id}`}
          />



          {/* Applicant Information */}
          <div className="detail-section">
            <h3 className="section-title">
              <FiUser className="icon" />
              Applicant Information
            </h3>
            
            <div className="detail-grid">
              <div className="detail-item">
                <label className="detail-label">Full Name</label>
                <div className="detail-value">{application.applicant_name}</div>
              </div>
              
              <div className="detail-item">
                <label className="detail-label">
                  <FiMail className="icon" />
                  Email Address
                </label>
                <div className="detail-value">
                  <a href={`mailto:${application.email}`} className="link">
                    {application.email}
                  </a>
                </div>
              </div>
              
              <div className="detail-item">
                <label className="detail-label">
                  <FiPhone className="icon" />
                  Phone Number
                </label>
                <div className="detail-value">
                  <a href={`tel:${application.phone_number}`} className="link">
                    {application.phone_number}
                  </a>
                </div>
              </div>
              
              <div className="detail-item">
                <label className="detail-label">
                  <FiCalendar className="icon" />
                  Applied Date
                </label>
                <div className="detail-value">
                  {formatDate(application.created_at)}
                </div>
              </div>
            </div>
          </div>

          {/* Job & Department Information */}
          <div className="detail-section">
            <h3 className="section-title">
              <FiBriefcase className="icon" />
              Job & Department Information
            </h3>
            
            <div className="detail-grid">
              <div className="detail-item">
                <label className="detail-label">Department</label>
                <div className="detail-value">
                  {application.department_id ? `Department ${application.department_id}` : 'Not specified'}
                </div>
              </div>
              
              <div className="detail-item">
                <label className="detail-label">Project ID</label>
                <div className="detail-value">
                  {application.project_id ? `Project ${application.project_id}` : 'Not specified'}
                </div>
              </div>
              
              <div className="detail-item">
                <label className="detail-label">Last Updated</label>
                <div className="detail-value">
                  {formatDate(application.updated_at)}
                </div>
              </div>
            </div>
          </div>

          {/* Cover Letter */}
          <div className="detail-section">
            <h3 className="section-title">
              <FiFileText className="icon" />
              Cover Letter
            </h3>
            
            <div className="cover-letter-content">
              {application.cover_letter ? (
                <div className="text-content">
                  {application.cover_letter}
                </div>
              ) : (
                <div className="empty-state">No cover letter provided</div>
              )}
              <br />
              {application.resume_url ? (
                <div className="resume-actions text-center">
                  <button 
                    onClick={downloadResume}
                    className="secondary_btn"
                  >
                    <FiDownload className="icon" />
                    Download Resume
                  </button>
                </div>
              ) : (
                <div className="empty-state">No resume uploaded</div>
              )}
            </div>
          </div>

        </div>
      </div>
    </>
  );
};

export default AdminApplicationView;
