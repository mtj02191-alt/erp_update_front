import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import PageHeader from '../../../common/PageHeader';
import FormInput from '../../../common/FormInput';
import Navbar from '../../../Navbar';
import '../../AccountsAndFinance.css';

const UpdateAccountsAndFinanceReport = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [form, setForm] = useState({
    date: '',
    daily_inflow: '',
    daily_outflow: '',
    pending_payable: '',
    petty_cash: '',
    available_funds: '',
    tax_late_payments: '',
    payable_reports: '',
    restricted_funds_reports: '',
    payment_commitment_party_vise: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchReport();
  }, [id]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/accounts-and-finance/reports/${id}`);
      const report = response.data;
      
      setForm({
        date: report.date ? new Date(report.date).toISOString().split('T')[0] : '',
        daily_inflow: report.daily_inflow?.toString() || '',
        daily_outflow: report.daily_outflow?.toString() || '',
        pending_payable: report.pending_payable?.toString() || '',
        petty_cash: report.petty_cash?.toString() || '',
        available_funds: report.available_funds?.toString() || '',
        tax_late_payments: report.tax_late_payments?.toString() || '',
        payable_reports: report.payable_reports?.toString() || '',
        restricted_funds_reports: report.restricted_funds_reports?.toString() || '',
        payment_commitment_party_vise: report.payment_commitment_party_vise?.toString() || '',
      });
    } catch (err) {
      setError('Failed to fetch report details');
      console.error('Error fetching report:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await axiosInstance.patch(`/accounts-and-finance/reports/${id}`, {
        ...form,
        daily_inflow: parseFloat(form.daily_inflow),
        daily_outflow: parseFloat(form.daily_outflow),
        pending_payable: parseFloat(form.pending_payable),
        petty_cash: parseFloat(form.petty_cash),
        available_funds: parseFloat(form.available_funds),
        tax_late_payments: parseFloat(form.tax_late_payments),
        payable_reports: parseFloat(form.payable_reports),
        restricted_funds_reports: parseFloat(form.restricted_funds_reports),
        payment_commitment_party_vise: parseFloat(form.payment_commitment_party_vise),
      });

      // Redirect to list page after successful submission
      navigate('/accounts_and_finance/reports/list');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update form. Please try again.');
      console.error('Error updating form:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate('/accounts_and_finance/reports/list');
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="form-wrapper">
          <div className="form-content">
            <div className="empty-state">Loading...</div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="form-wrapper">
        <div className="form-content">
          <PageHeader 
            title="Update Accounts & Finance Report" 
            onBack={handleBack}
          />
          
          {error && (
            <div className="status-message status-message--error">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="form">
            <div className="form-grid-3">
              <FormInput
                label="Date"
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                required
              />
              
              <FormInput
                label="Daily Inflow"
                type="number"
                name="daily_inflow"
                value={form.daily_inflow}
                onChange={handleChange}
                step="0.01"
                min="0"
                required
              />
              
              <FormInput
                label="Daily Outflow"
                type="number"
                name="daily_outflow"
                value={form.daily_outflow}
                onChange={handleChange}
                step="0.01"
                min="0"
                required
              />
              
              <FormInput
                label="Pending Payable"
                type="number"
                name="pending_payable"
                value={form.pending_payable}
                onChange={handleChange}
                step="0.01"
                min="0"
                required
              />
              
              <FormInput
                label="Petty Cash"
                type="number"
                name="petty_cash"
                value={form.petty_cash}
                onChange={handleChange}
                step="0.01"
                min="0"
                required
              />
              
              <FormInput
                label="Available Funds"
                type="number"
                name="available_funds"
                value={form.available_funds}
                onChange={handleChange}
                step="0.01"
                min="0"
                required
              />
              
              <FormInput
                label="Tax Late Payments"
                type="number"
                name="tax_late_payments"
                value={form.tax_late_payments}
                onChange={handleChange}
                step="0.01"
                min="0"
                required
              />
              
              <FormInput
                label="Payable Reports"
                type="number"
                name="payable_reports"
                value={form.payable_reports}
                onChange={handleChange}
                step="0.01"
                min="0"
                required
              />
              
              <FormInput
                label="Restricted Funds Reports"
                type="number"
                name="restricted_funds_reports"
                value={form.restricted_funds_reports}
                onChange={handleChange}
                step="0.01"
                min="0"
                required
              />
              
              <FormInput
                label="Payment Commitment Party-wise"
                type="number"
                name="payment_commitment_party_vise"
                value={form.payment_commitment_party_vise}
                onChange={handleChange}
                step="0.01"
                min="0"
                required
              />
            </div>

            <div className="form-actions">
              <button 
                type="submit" 
                className="primary_btn" 
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Updating...' : 'Update'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default UpdateAccountsAndFinanceReport; 