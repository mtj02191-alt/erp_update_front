import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import PageHeader from '../../../common/PageHeader';
import FormInput from '../../../common/FormInput';
import Navbar from '../../../Navbar';
import '../../Procurements.css';

const UpdateProcurementReport = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [form, setForm] = useState({
    date: '',
    totalGeneratedPOs: '',
    pendingPOs: '',
    fulfilledPOs: '',
    totalGeneratedPIs: '',
    totalPaidAmount: '',
    unpaidAmount: '',
    unpaidPIs: '',
    tenders: '',
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
      const response = await axiosInstance.get(`/procurements/reports/${id}`);
      const report = response.data;
      
      setForm({
        date: report.date ? report.date.split('T')[0] : '',
        totalGeneratedPOs: report.total_generated_pos?.toString() || '',
        pendingPOs: report.pending_pos?.toString() || '',
        fulfilledPOs: report.fulfilled_pos?.toString() || '',
        totalGeneratedPIs: report.total_generated_pis?.toString() || '',
        totalPaidAmount: report.total_paid_amount?.toString() || '',
        unpaidAmount: report.unpaid_amount?.toString() || '',
        unpaidPIs: report.unpaid_pis?.toString() || '',
        tenders: report.tenders?.toString() || '',
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
      await axiosInstance.patch(`/procurements/reports/${id}`, {
        date: form.date,
        total_generated_pos: parseInt(form.totalGeneratedPOs),
        pending_pos: parseInt(form.pendingPOs),
        fulfilled_pos: parseInt(form.fulfilledPOs),
        total_generated_pis: parseInt(form.totalGeneratedPIs),
        total_paid_amount: parseFloat(form.totalPaidAmount),
        unpaid_amount: parseFloat(form.unpaidAmount),
        unpaid_pis: parseInt(form.unpaidPIs),
        tenders: parseInt(form.tenders),
      });

      // Redirect to list page after successful update
      navigate('/procurements/reports/list');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to Submit Report. Please try again.');
      console.error('Error updating report:', err);
    } finally {
      setIsSubmitting(false);
    }
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
            title="Update Procurement Report" 
            showBackButton={true}
            backPath="/procurements/reports/list"
          />
          
          {error && (
            <div className="status-message status-message--error">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="form">
            <div className="form-grid-2">
              <FormInput
                label="Date"
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                required
              />
              
              <FormInput
                label="Total Generated POs"
                type="number"
                name="totalGeneratedPOs"
                value={form.totalGeneratedPOs}
                onChange={handleChange}
                min="0"
                required
              />
              
              <FormInput
                label="Pending POs"
                type="number"
                name="pendingPOs"
                value={form.pendingPOs}
                onChange={handleChange}
                min="0"
                required
              />
              
              <FormInput
                label="Fulfilled POs"
                type="number"
                name="fulfilledPOs"
                value={form.fulfilledPOs}
                onChange={handleChange}
                min="0"
                required
              />
              
              <FormInput
                label="Total Generated PIs"
                type="number"
                name="totalGeneratedPIs"
                value={form.totalGeneratedPIs}
                onChange={handleChange}
                min="0"
                required
              />
              
              <FormInput
                label="Total Paid Amount"
                type="number"
                name="totalPaidAmount"
                value={form.totalPaidAmount}
                onChange={handleChange}
                step="0.01"
                min="0"
                required
              />
              
              <FormInput
                label="Unpaid Amount"
                type="number"
                name="unpaidAmount"
                value={form.unpaidAmount}
                onChange={handleChange}
                step="0.01"
                min="0"
                required
              />
              
              <FormInput
                label="Unpaid PIs"
                type="number"
                name="unpaidPIs"
                value={form.unpaidPIs}
                onChange={handleChange}
                min="0"
                required
              />
              
              <FormInput
                label="Tenders"
                type="number"
                name="tenders"
                value={form.tenders}
                onChange={handleChange}
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
                {isSubmitting ? 'Updating...' : 'Submit Report'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default UpdateProcurementReport; 