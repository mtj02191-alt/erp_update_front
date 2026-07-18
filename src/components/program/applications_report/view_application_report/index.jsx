import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiEdit2 } from 'react-icons/fi';
import axiosInstance from '../../../../utils/axios';
import '../../../../styles/variables.css';
import '../../../../styles/components.css';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import './ViewApplication.css';
import { getProgramLabelByKey, getSubprogramLabelByKey } from '../../../../utils/program';

const ViewApplicationReport = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [applicationData, setApplicationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [programLabelByKey, setProgramLabelByKey] = useState({});
  const [subprogramLabelByKey, setSubprogramLabelByKey] = useState({});

  useEffect(() => {
    fetchApplicationReport();
  }, [id]);

  const fetchApplicationReport = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/program/application-reports/${id}`);
      
      // Handle the controller's response structure
      if (response.data.success) {
        setApplicationData(response.data.data);

        // Load subprogram labels so the view reflects latest CRUD changes.
        const programLookupResponse = await axiosInstance.get('/program/programs', {
          params: { page: 1, pageSize: 1000 },
        });
        if (programLookupResponse.data?.success) {
          const map = {};
          (programLookupResponse.data.data || []).forEach((p) => {
            map[p.key] = p.label;
          });
          setProgramLabelByKey(map);
        }

        const lookupResponse = await axiosInstance.get('/program/subprograms', {
          params: { page: 1, pageSize: 1000 },
        });
        if (lookupResponse.data?.success) {
          const map = {};
          (lookupResponse.data.data || []).forEach((sp) => {
            map[sp.key] = sp.label;
          });
          setSubprogramLabelByKey(map);
        }
      } else {
        setError(response.data.message || 'Failed to fetch application report');
      }
      setError('');
    } catch (err) {
      setError('Failed to fetch application report data. Please try again.');
      console.error('Error fetching application report:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="view-application-container">
          <div className="status-message">Loading application report data...</div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className="view-application-container">
          <div className="status-message status-message--error">{error}</div>
        </div>
      </>
    );
  }

  if (!applicationData) {
    return (
      <>
        <Navbar />
        <div className="view-application-container">
          <div className="status-message status-message--error">Application report not found</div>
        </div>
      </>
    );
  }

  // Check if applications array exists and is not empty
  if (!applicationData.applications || applicationData.applications.length === 0) {
    return (
      <>
        <Navbar />
        <div className="view-application-container">
          <PageHeader 
            title="View Application Report"
            backPath="/program/applications_reports"
            showEdit={true}
            editPath={`/program/applications_reports/edit_application_report/${id}`}
          />
          <div className="view-application-content">
            <div className="report-summary">
              <div className="report-summary-item">
                <label>Report Date:</label>
                <span>{formatDate(applicationData.report_date)}</span>
              </div>
            </div>
            <div className="status-message">No applications found for this report.</div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="view-application-container">
        <PageHeader 
          title="View Application Report"
          backPath="/program/applications_reports"
          showEdit={true}
          editPath={`/program/applications_reports/edit_application_report/${id}`}
        />
        <div className="view-application-content">
          <div className="report-summary">
            <div className="report-summary-item">
              <label>Report Date:</label>
              <span>{formatDate(applicationData.report_date)}</span>
            </div>
            {/* {applicationData.notes && (
              <div className="report-summary-item">
                <label>Notes:</label>
                <span>{applicationData.notes}</span>
              </div>
            )} */}
          </div>

          <div className="applications-section">
            {/* <h3 className="section-title">Applications</h3> */}
            {applicationData.applications.map((application, index) => (
              <div key={application.id} className="application-card">
                <div className="application-header">
                  <h4 className="application-title">
                    Application {index + 1}:{' '}
                    {programLabelByKey[application.project] || getProgramLabelByKey(application.project)}
                    {application.subprogram ? (
                      <span className="application-subtitle">
                        {' — '}
                        {subprogramLabelByKey[application.subprogram] || getSubprogramLabelByKey(application.subprogram)}
                      </span>
                    ) : null}
                  </h4>
                </div>
                
                <div className="application-stats">
                  <div className="stat-row">
                    <div className="stat-item">
                      <label>Pending from Last Month:</label>
                      <span className="stat-value">{application.pending_last_month}</span>
                    </div>
                    <div className="stat-item">
                      <label>New Applications:</label>
                      <span className="stat-value">{application.application_count}</span>
                    </div>
                  </div>
                  
                  <div className="stat-row">
                    <div className="stat-item">
                      <label>Under Investigation:</label>
                      <span className="stat-value">{application.investigation_count}</span>
                    </div>
                  </div>
                  
                  <div className="stat-row">
                    <div className="stat-item">
                      <label>Verified:</label>
                      <span className="stat-value stat-verified">{application.verified_count ?? 0}</span>
                    </div>
                    <div className="stat-item">
                      <label>Approved:</label>
                      <span className="stat-value stat-approved">{application.approved_count}</span>
                    </div>
                    <div className="stat-item">
                      <label>Rejected:</label>
                      <span className="stat-value stat-rejected">{application.rejected_count}</span>
                    </div>
                  </div>
                  
                  <div className="stat-row">
                    <div className="stat-item">
                      <label>Currently Pending:</label>
                      <span className="stat-value stat-pending">{application.pending_count}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default ViewApplicationReport; 