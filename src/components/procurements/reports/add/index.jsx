import React, { useState } from 'react';
import axiosInstance from '../../../../utils/axios';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import '../../../../styles/variables.css';
import '../../../../styles/components.css';
import '../../Procurements.css';

const AddProcurementReport = () => {
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
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const validateForm = () => {
    const requiredFields = [
      'date',
      'totalGeneratedPOs',
      'pendingPOs',
      'fulfilledPOs',
      'totalGeneratedPIs',
      'totalPaidAmount',
      'unpaidAmount',
      'unpaidPIs',
      'tenders',
    ];
    for (const field of requiredFields) {
      if (form[field] === '' || form[field] === undefined || form[field] === null) {
        setError(`Please fill in all required fields`);
        return false;
      }
    }
    const numericFields = [
      'totalGeneratedPOs',
      'pendingPOs',
      'fulfilledPOs',
      'totalGeneratedPIs',
      'totalPaidAmount',
      'unpaidAmount',
      'unpaidPIs',
      'tenders',
    ];
    for (const field of numericFields) {
      const value = parseFloat(form[field]);
      if (isNaN(value) || value < 0) {
        setError(`Please enter valid numbers for all amount fields`);
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      await axiosInstance.post('/procurements/reports', {
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
      setSubmitted(true);
      setError('');
      setForm({
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
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit form. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    window.history.back();
  };

  return (
    <>
      <Navbar />
      <div className="procurements-container">
        <PageHeader title="Add Procurement Report" onBack={handleBack} />
        {submitted ? (
          <div className="procurements-success">Form submitted successfully!</div>
        ) : (
          <form onSubmit={handleSubmit} className="procurements-form">
            {error && <div className="procurements-error">{error}</div>}
            <label className="full-width">Date
              <input name="date" type="date" value={form.date} onChange={handleChange} required />
            </label>
            <label>Total Generated PO's
              <input name="totalGeneratedPOs" type="number" min="0" value={form.totalGeneratedPOs} onChange={handleChange} required />
            </label>
            <label>Pending PO's
              <input name="pendingPOs" type="number" min="0" value={form.pendingPOs} onChange={handleChange} required />
            </label>
            <label>Fulfilled PO's
              <input name="fulfilledPOs" type="number" min="0" value={form.fulfilledPOs} onChange={handleChange} required />
            </label>
            <label>Total Generated PI's
              <input name="totalGeneratedPIs" type="number" min="0" value={form.totalGeneratedPIs} onChange={handleChange} required />
            </label>
            <label>Total Paid Amount
              <input name="totalPaidAmount" type="number" min="0" value={form.totalPaidAmount} onChange={handleChange} required />
            </label>
            <label>Unpaid Amount
              <input name="unpaidAmount" type="number" min="0" value={form.unpaidAmount} onChange={handleChange} required />
            </label>
            <label>Unpaid PI's
              <input name="unpaidPIs" type="number" min="0" value={form.unpaidPIs} onChange={handleChange} required />
            </label>
            <label>Tenders
              <input name="tenders" type="number" min="0" value={form.tenders} onChange={handleChange} required />
            </label>
            <button type="submit" className="primary_btn" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
          </form>
        )}
      </div>
    </>
  );
};

export default AddProcurementReport; 