import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import PageHeader from '../../../common/PageHeader';
import Navbar from '../../../Navbar';
import '../../Procurements.css';

const ViewProcurementReport = () => {
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
      const response = await axiosInstance.get(`/procurements/reports/${id}`);
      setReport(response.data);
    } catch (err) {
      setError('Failed to fetch report details');
      console.error('Error fetching report:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
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
            <div className="status-message status-message--error">{error}</div>
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
            title="Procurement Report Details" 
            showBackButton={true}
            backPath="/procurements/reports/list"
            showEdit={true}
            editPath={`/procurements/reports/update/${id}`}
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
                  <label className="detail-label">Total Generated POs</label>
                  <div className="detail-value">{report.total_generated_pos}</div>
                </div>
                
                <div className="detail-item">
                  <label className="detail-label">Pending POs</label>
                  <div className="detail-value">{report.pending_pos}</div>
                </div>
                
                <div className="detail-item">
                  <label className="detail-label">Fulfilled POs</label>
                  <div className="detail-value">{report.fulfilled_pos}</div>
                </div>
                
                <div className="detail-item">
                  <label className="detail-label">Total Generated PIs</label>
                  <div className="detail-value">{report.total_generated_pis}</div>
                </div>
                
                <div className="detail-item">
                  <label className="detail-label">Total Paid Amount</label>
                  <div className="detail-value">{formatCurrency(report.total_paid_amount)}</div>
                </div>
                
                <div className="detail-item">
                  <label className="detail-label">Unpaid Amount</label>
                  <div className="detail-value">{formatCurrency(report.unpaid_amount)}</div>
                </div>
                
                <div className="detail-item">
                  <label className="detail-label">Unpaid PIs</label>
                  <div className="detail-value">{report.unpaid_pis}</div>
                </div>
                
                <div className="detail-item">
                  <label className="detail-label">Tenders</label>
                  <div className="detail-value">{report.tenders}</div>
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
                  
                  {report.updated_at && report.updated_at !== report.created_at && (
                    <div className="detail-item">
                      <label className="detail-label">Last Updated</label>
                      <div className="detail-value">
                        {new Date(report.updated_at).toLocaleString()}
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

export default ViewProcurementReport; 