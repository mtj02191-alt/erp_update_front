import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import PageHeader from '../../../common/PageHeader';
import Navbar from '../../../Navbar';
import '../../AccountsAndFinance.css';

const ViewAccountsAndFinanceReport = () => {
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
      const response = await axiosInstance.get(`/accounts-and-finance/reports/${id}`);
      setReport(response.data);
    } catch (err) {
      setError('Failed to fetch report details');
      console.error('Error fetching report:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/accounts_and_finance/reports/list');
  };

  const handleEdit = () => {
    navigate(`/accounts_and_finance/reports/update/${id}`);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 2
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
            title="Accounts & Finance Report Details" 
            onBack={handleBack}
            showEdit={true}
            editPath={`/accounts_and_finance/reports/update/${id}`}
          />

          <div className="report-details">
            <div className="detail-section">
              <h3 className="section-title">Basic Information</h3>
              <div className="detail-grid">
                <div className="detail-item">
                  <label className="detail-label">Report Date:</label>
                  <span className="detail-value">{formatDate(report.date)}</span>
                </div>
                <div className="detail-item">
                  <label className="detail-label">Created At:</label>
                  <span className="detail-value">{formatDate(report.created_at)}</span>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <h3 className="section-title">Daily Financial Summary</h3>
              <div className="detail-grid">
                <div className="detail-item">
                  <label className="detail-label">Daily Inflow:</label>
                  <span className="detail-value amount-positive">{formatCurrency(report.daily_inflow)}</span>
                </div>
                <div className="detail-item">
                  <label className="detail-label">Daily Outflow:</label>
                  <span className="detail-value amount-negative">{formatCurrency(report.daily_outflow)}</span>
                </div>
                <div className="detail-item">
                  <label className="detail-label">Available Funds:</label>
                  <span className="detail-value amount-positive">{formatCurrency(report.available_funds)}</span>
                </div>
                <div className="detail-item">
                  <label className="detail-label">Pending Payable:</label>
                  <span className="detail-value amount-neutral">{formatCurrency(report.pending_payable)}</span>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <h3 className="section-title">Cash Management</h3>
              <div className="detail-grid">
                <div className="detail-item">
                  <label className="detail-label">Petty Cash:</label>
                  <span className="detail-value amount-neutral">{formatCurrency(report.petty_cash)}</span>
                </div>
                <div className="detail-item">
                  <label className="detail-label">Tax Late Payments:</label>
                  <span className="detail-value amount-negative">{formatCurrency(report.tax_late_payments)}</span>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <h3 className="section-title">Reports & Commitments</h3>
              <div className="detail-grid">
                <div className="detail-item">
                  <label className="detail-label">Payable Reports:</label>
                  <span className="detail-value amount-neutral">{formatCurrency(report.payable_reports)}</span>
                </div>
                <div className="detail-item">
                  <label className="detail-label">Restricted Funds Reports:</label>
                  <span className="detail-value amount-neutral">{formatCurrency(report.restricted_funds_reports)}</span>
                </div>
                <div className="detail-item">
                  <label className="detail-label">Payment Commitment Party-wise:</label>
                  <span className="detail-value amount-neutral">{formatCurrency(report.payment_commitment_party_vise)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ViewAccountsAndFinanceReport; 