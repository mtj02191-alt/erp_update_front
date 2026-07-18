import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../../../../../utils/axios';
import '../../../../../styles/variables.css';
import '../../../../../styles/components.css';
import Navbar from '../../../../Navbar';
import PageHeader from '../../../../common/PageHeader';
// import './index.css';

const ViewEducationReport = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchReport();
  }, [id]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/program/education/reports/${id}`);
      if (response.data.success) {
        setReport(response.data.data);
      } else {
        setReport(response.data);
      }
    } catch (err) {
      setError('Failed to fetch report');
      console.error('Error fetching report:', err);
    } finally {
      setLoading(false);
    }
  };

  const getMaleTotal = () => {
    if (!report) return 0;
    return (report.male_orphans || 0) + (report.male_divorced || 0) + (report.male_disable || 0) + (report.male_indegent || 0);
  };

  const getFemaleTotal = () => {
    if (!report) return 0;
    return (report.female_orphans || 0) + (report.female_divorced || 0) + (report.female_disable || 0) + (report.female_indegent || 0);
  };

  const getOverallTotal = () => {
    return getMaleTotal() + getFemaleTotal();
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="view-education-report">
          <PageHeader 
            title="View Education Report" 
            breadcrumbs={[
              { label: 'Program', path: '/program' },
              { label: 'Education Reports', path: '/program/education/reports/list' },
              { label: 'View Report' }
            ]}
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
        <div className="view-education-report">
          <PageHeader 
            title="View Education Report" 
            breadcrumbs={[
              { label: 'Program', path: '/program' },
              { label: 'Education Reports', path: '/program/education/reports/list' },
              { label: 'View Report' }
            ]}
          />
          <div className="error-message">{error}</div>
        </div>
      </>
    );
  }

  if (!report) {
    return (
      <>
        <Navbar />
        <div className="view-education-report">
          <PageHeader 
            title="View Education Report" 
            breadcrumbs={[
              { label: 'Program', path: '/program' },
              { label: 'Education Reports', path: '/program/education/reports/list' },
              { label: 'View Report' }
            ]}
          />
          <div className="no-data">Report not found</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="view-education-report">
        <PageHeader 
          title="View Education Report" 
          breadcrumbs={[
            { label: 'Program', path: '/program' },
            { label: 'Education Reports', path: '/program/education/reports/list' },
            { label: 'View Report' }
          ]}
          showEdit={true}
          editPath={`/program/education/reports/update/${report.id}`}
        />
        
        <div className="report-container">
          <div className="report-content">
            <div className="info-grid">
              <div className="info-item">
                <label>Date:</label>
                <span>{formatDate(report.date)}</span>
              </div>
              
              <div className="info-item">
                <label>Total Students:</label>
                <span className="total-value">{getOverallTotal()}</span>
              </div>
            </div>

            {/* Male Section */}
            <div className="gender-section">
              <h3 className="section-title">Male Students</h3>
              <div className="vulnerabilities-grid">
                <div className="vulnerability-item">
                  <label>Orphans:</label>
                  <span>{report.male_orphans || 0}</span>
                </div>
                <div className="vulnerability-item">
                  <label>Divorced:</label>
                  <span>{report.male_divorced || 0}</span>
                </div>
                <div className="vulnerability-item">
                  <label>Disable:</label>
                  <span>{report.male_disable || 0}</span>
                </div>
                <div className="vulnerability-item">
                  <label>Indegent:</label>
                  <span>{report.male_indegent || 0}</span>
                </div>
              </div>
              <div className="gender-total">
                <label>Male Total:</label>
                <span className="total-value">{getMaleTotal()}</span>
              </div>
            </div>

            {/* Female Section */}
            <div className="gender-section">
              <h3 className="section-title">Female Students</h3>
              <div className="vulnerabilities-grid">
                <div className="vulnerability-item">
                  <label>Orphans:</label>
                  <span>{report.female_orphans || 0}</span>
                </div>
                <div className="vulnerability-item">
                  <label>Divorced:</label>
                  <span>{report.female_divorced || 0}</span>
                </div>
                <div className="vulnerability-item">
                  <label>Disable:</label>
                  <span>{report.female_disable || 0}</span>
                </div>
                <div className="vulnerability-item">
                  <label>Indegent:</label>
                  <span>{report.female_indegent || 0}</span>
                </div>
              </div>
              <div className="gender-total">
                <label>Female Total:</label>
                <span className="total-value">{getFemaleTotal()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ViewEducationReport; 