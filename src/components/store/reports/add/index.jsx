import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import PageHeader from '../../../common/PageHeader';
import FormInput from '../../../common/FormInput';
import Navbar from '../../../Navbar';
import '../../Store.css';

const AddStoreReport = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    date: '',
    generated_demands: '',
    pending_demands: '',
    generated_grn: '',
    pending_grn: '',
    rejected_demands: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await axiosInstance.post('/store/reports', {
        ...form,
        generated_demands: parseInt(form.generated_demands),
        pending_demands: parseInt(form.pending_demands),
        generated_grn: parseInt(form.generated_grn),
        pending_grn: parseInt(form.pending_grn),
        rejected_demands: parseInt(form.rejected_demands),
      });

      // Redirect to list page after successful submission
      navigate('/store/reports/list');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit form. Please try again.');
      console.error('Error submitting form:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate('/store');
  };

  return (
    <>
      <Navbar />
      <div className="form-wrapper">
        <div className="form-content">
          <PageHeader 
            title="Add Store Report" 
            onBack={handleBack}
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
                label="Demand Generated"
                type="number"
                name="generated_demands"
                value={form.generated_demands}
                onChange={handleChange}
                min="0"
                required
              />
              
              <FormInput
                label="Pending Demands"
                type="number"
                name="pending_demands"
                value={form.pending_demands}
                onChange={handleChange}
                min="0"
                required
              />
              
              <FormInput
                label="Generated GRN"
                type="number"
                name="generated_grn"
                value={form.generated_grn}
                onChange={handleChange}
                min="0"
                required
              />
              
              <FormInput
                label="Pending GRN"
                type="number"
                name="pending_grn"
                value={form.pending_grn}
                onChange={handleChange}
                min="0"
                required
              />
              
              <FormInput
                label="Rejected Demands"
                type="number"
                name="rejected_demands"
                value={form.rejected_demands}
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
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default AddStoreReport; 