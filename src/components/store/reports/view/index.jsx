import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import PageHeader from '../../../common/PageHeader';
import Navbar from '../../../Navbar';
import '../../Store.css';

const ViewStoreReport = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchReport();
  }, [id]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/store/reports/${id}`);
      setReport(response.data);
    } catch (err) {
      setError('Failed to fetch report details');
      console.error('Error fetching report:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/store/reports/list');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="view-wrapper">
          <div className="view-content">
            <div className="empty-state">Loading...</div>
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

  if (!report) {
    return (
      <>
        <Navbar />
        <div className="view-wrapper">
          <div className="view-content">
            <div className="empty-state">Report not found</div>
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
            title="Store Report Details" 
            showBackButton={true}
            backPath="/store/reports/list"
            showEdit={true}
            editPath={`/store/reports/update/${id}`}
          />

          <div className="report-details">
            <div className="detail-section">
              <h3 className="section-title">Report Information</h3>
              
              <div className="detail-grid">
                <div className="detail-item">
                  <label className="detail-label">Date</label>
                  <div className="detail-value">{formatDate(report.date)}</div>
                </div>
                
                <div className="detail-item">
                  <label className="detail-label">Demand Generated</label>
                  <div className="detail-value">{report.generated_demands}</div>
                </div>
                
                <div className="detail-item">
                  <label className="detail-label">Pending Demands</label>
                  <div className="detail-value">{report.pending_demands}</div>
                </div>
                
                <div className="detail-item">
                  <label className="detail-label">Generated GRN</label>
                  <div className="detail-value">{report.generated_grn}</div>
                </div>
                
                <div className="detail-item">
                  <label className="detail-label">Pending GRN</label>
                  <div className="detail-value">{report.pending_grn}</div>
                </div>
                
                <div className="detail-item">
                  <label className="detail-label">Rejected Demands</label>
                  <div className="detail-value">{report.rejected_demands}</div>
                </div>
              </div>
            </div>

            {report.created_at && (
              <div className="detail-section">
                <h3 className="section-title">System Information</h3>
                
                <div className="detail-grid">
                  <div className="detail-item">
                    <label className="detail-label">Created At</label>
                    <div className="detail-value">
                      {new Date(report.created_at).toLocaleString()}
                    </div>
                  </div>
                  
                  {report.updatedAt && report.updatedAt !== report.created_at && (
                    <div className="detail-item">
                      <label className="detail-label">Last Updated</label>
                      <div className="detail-value">
                        {new Date(report.updatedAt).toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ViewStoreReport; 