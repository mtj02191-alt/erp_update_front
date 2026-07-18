import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../../../../utils/axios';
import '../../../../../styles/variables.css';
import '../../../../../styles/components.css';
import PageHeader from '../../../../common/PageHeader';
import Navbar from '../../../../Navbar';
import './index.css';

const ViewTreePlantationReport = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line
  }, [id]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/program/tree_plantation/reports/${id}`);
      setReport(response.data.data);
    } catch (err) {
      setError('Failed to fetch report details');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => navigate('/program/tree_plantation/reports/list');
  const formatDate = (dateString) => new Date(dateString).toLocaleDateString();
  const formatDateTime = (dateString) => new Date(dateString).toLocaleString();

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="view-wrapper"><div className="view-content"><div className="empty-state">Loading...</div></div></div>
      </>
    );
  }
  if (error) {
    return (
      <>
        <Navbar />
        <div className="view-wrapper"><div className="view-content"><div className="status-message status-message--error">{error}</div></div></div>
      </>
    );
  }
  if (!report) {
    return (
      <>
        <Navbar />
        <div className="view-wrapper"><div className="view-content"><div className="empty-state">Report not found</div></div></div>
      </>
    );
  }
  return (
    <>
      <Navbar />
      <div className="view-wrapper">
        <div className="view-content">
          <PageHeader 
            title="Tree Plantation Report Details" 
            showBackButton={true}
            backPath="/program/tree_plantation/reports/list"
            showEdit={true}
            editPath={`/program/tree_plantation/reports/update/${id}`}
          />
          <div className="view-section">
            <h3 className="view-section-title">Report Information</h3>
            <div className="view-grid">
              <div className="view-item">
                <span className="view-item-label">Date</span>
                <span className="view-item-value">{formatDate(report.report_date)}</span>
              </div>
              <div className="view-item">
                <span className="view-item-label">School Name</span>
                <span className="view-item-value">{report.school_name}</span>
              </div>
              <div className="view-item">
                <span className="view-item-label">Plants</span>
                <span className="view-item-value">{report.plants}</span>
              </div>
            </div>
          </div>
          {(report.created_at || report.updated_at) && (
            <div className="view-section">
              <h3 className="view-section-title">System Information</h3>
              <div className="view-grid">
                {report.created_at && (
                  <div className="view-item">
                    <span className="view-item-label">Created At</span>
                    <span className="view-item-value">{formatDateTime(report.created_at)}</span>
                  </div>
                )}
                {report.updated_at && report.updated_at !== report.created_at && (
                  <div className="view-item">
                    <span className="view-item-label">Last Updated</span>
                    <span className="view-item-value">{formatDateTime(report.updated_at)}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ViewTreePlantationReport; 