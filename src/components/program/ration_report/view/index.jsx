import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios'; 
import '../../../../styles/variables.css';
import '../../../../styles/components.css';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import './index.css';

const ViewRationReport = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [rationData, setRationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRationReport();
  }, [id]);

  const fetchRationReport = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/program/ration/reports/${id}`);
      
      if (response.data.success) {
        setRationData(response.data.data);
        setError('');
      } else {
        setError('Failed to fetch ration report data');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch ration report data. Please try again.');
      console.error('Error fetching ration report:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getTotalCount = (rationData) => {
    if (!rationData) return 0;
    return Object.values(rationData).reduce((total, count) => total + count, 0);
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="page_container">
          <PageHeader 
            title="View Ration Report"
            showBackButton={true}
            backPath="/program/ration_report/list"
            showEdit={true}
            editPath={`/program/ration_report/update/${id}`}
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
        <div className="page_container">
          <PageHeader 
            title="View Ration Report"
            showBackButton={true}
            backPath="/program/ration_report/list"
            showEdit={true}
            editPath={`/program/ration_report/update/${id}`}
          />
          <div className="status-message status-message--error">{error}</div>
        </div>
      </>
    );
  }

  if (!rationData) {
    return (
      <>
        <Navbar />
        <div className="page_container">
          <PageHeader 
            title="View Ration Report"
            showBackButton={true}
            backPath="/program/ration_report/list"
            showEdit={true}
            editPath={`/program/ration_report/update/${id}`}
          />
          <div className="status-message status-message--error">Ration report not found</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="page_container">
        <PageHeader 
          title="View Ration Report"
          showBackButton={true}
          backPath="/program/ration_report/list"
          showEdit={true}
          editPath={`/program/ration_report/update/${id}`}
        />
        <div className="ration-report-summary">
          <div className="report-summary-item">
            <label>Report Date:</label>
            <span>{formatDate(rationData.date)}</span>
          </div>
          <div className="report-summary-item">
            <label>Alternate:</label>
            <span>{rationData.is_alternate ? 'Yes' : 'No'}</span>
          </div>
          <div className="report-summary-item">
            <label>Life time (combined total):</label>
            <span>{rationData.life_time}</span>
          </div>
        </div>

        <div className="ration-section">
          <div className="ration-card">
            <div className="ration-header">
              <h4 className="ration-title">Full Ration</h4>
              <span className="ration-total">Total: {getTotalCount(rationData.full)}</span>
            </div>
            
            <div className="ration-stats">
              <div className="stat-row">
                <div className="stat-item">
                  <label>Widows:</label>
                  <span className="stat-value">{rationData.full?.Widows || 0}</span>
                </div>
                <div className="stat-item">
                  <label>Divorced:</label>
                  <span className="stat-value">{rationData.full?.Divorced || 0}</span>
                </div>
              </div>
              
              <div className="stat-row">
                <div className="stat-item">
                  <label>Disable:</label>
                  <span className="stat-value">{rationData.full?.Disable || 0}</span>
                </div>
                <div className="stat-item">
                  <label>Indegent:</label>
                  <span className="stat-value">{rationData.full?.Indegent || 0}</span>
                </div>
              </div>
              
              <div className="stat-row">
                <div className="stat-item">
                  <label>Orphan:</label>
                  <span className="stat-value">{rationData.full?.Orphan || 0}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="ration-card">
            <div className="ration-header">
              <h4 className="ration-title">Half Ration</h4>
              <span className="ration-total">Total: {getTotalCount(rationData.half)}</span>
            </div>
            
            <div className="ration-stats">
              <div className="stat-row">
                <div className="stat-item">
                  <label>Widows:</label>
                  <span className="stat-value">{rationData.half?.Widows || 0}</span>
                </div>
                <div className="stat-item">
                  <label>Divorced:</label>
                  <span className="stat-value">{rationData.half?.Divorced || 0}</span>
                </div>
              </div>
              
              <div className="stat-row">
                <div className="stat-item">
                  <label>Disable:</label>
                  <span className="stat-value">{rationData.half?.Disable || 0}</span>
                </div>
                <div className="stat-item">
                  <label>Indegent:</label>
                  <span className="stat-value">{rationData.half?.Indegent || 0}</span>
                </div>
              </div>
              
              <div className="stat-row">
                <div className="stat-item">
                  <label>Orphan:</label>
                  <span className="stat-value">{rationData.half?.Orphan || 0}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="ration-card">
            <div className="ration-header">
              <h4 className="ration-title">Life time — full</h4>
              <span className="ration-total">Total: {getTotalCount(rationData.life_time_full)}</span>
            </div>
            <div className="ration-stats">
              <div className="stat-row">
                <div className="stat-item">
                  <label>Widows:</label>
                  <span className="stat-value">{rationData.life_time_full?.Widows || 0}</span>
                </div>
                <div className="stat-item">
                  <label>Divorced:</label>
                  <span className="stat-value">{rationData.life_time_full?.Divorced || 0}</span>
                </div>
              </div>
              <div className="stat-row">
                <div className="stat-item">
                  <label>Disable:</label>
                  <span className="stat-value">{rationData.life_time_full?.Disable || 0}</span>
                </div>
                <div className="stat-item">
                  <label>Indegent:</label>
                  <span className="stat-value">{rationData.life_time_full?.Indegent || 0}</span>
                </div>
              </div>
              <div className="stat-row">
                <div className="stat-item">
                  <label>Orphan:</label>
                  <span className="stat-value">{rationData.life_time_full?.Orphan || 0}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="ration-card">
            <div className="ration-header">
              <h4 className="ration-title">Life time — half</h4>
              <span className="ration-total">Total: {getTotalCount(rationData.life_time_half)}</span>
            </div>
            <div className="ration-stats">
              <div className="stat-row">
                <div className="stat-item">
                  <label>Widows:</label>
                  <span className="stat-value">{rationData.life_time_half?.Widows || 0}</span>
                </div>
                <div className="stat-item">
                  <label>Divorced:</label>
                  <span className="stat-value">{rationData.life_time_half?.Divorced || 0}</span>
                </div>
              </div>
              <div className="stat-row">
                <div className="stat-item">
                  <label>Disable:</label>
                  <span className="stat-value">{rationData.life_time_half?.Disable || 0}</span>
                </div>
                <div className="stat-item">
                  <label>Indegent:</label>
                  <span className="stat-value">{rationData.life_time_half?.Indegent || 0}</span>
                </div>
              </div>
              <div className="stat-row">
                <div className="stat-item">
                  <label>Orphan:</label>
                  <span className="stat-value">{rationData.life_time_half?.Orphan || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ViewRationReport;
