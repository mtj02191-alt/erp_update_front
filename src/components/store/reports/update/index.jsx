import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import PageHeader from '../../../common/PageHeader';
import FormInput from '../../../common/FormInput';
import Navbar from '../../../Navbar';
import '../../Store.css';

const UpdateStoreReport = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [form, setForm] = useState({
    date: '',
    generated_demands: '',
    pending_demands: '',
    generated_grn: '',
    pending_grn: '',
    rejected_demands: '',
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
      const response = await axiosInstance.get(`/store/reports/${id}`);
      const report = response.data;
      
      setForm({
        date: report.date ? report.date.split('T')[0] : '',
        generated_demands: report.generated_demands?.toString() || '',
        pending_demands: report.pending_demands?.toString() || '',
        generated_grn: report.generated_grn?.toString() || '',
        pending_grn: report.pending_grn?.toString() || '',
        rejected_demands: report.rejected_demands?.toString() || '',
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
      await axiosInstance.patch(`/store/reports/${id}`, {
        ...form,
        generated_demands: parseInt(form.generated_demands),
        pending_demands: parseInt(form.pending_demands),
        generated_grn: parseInt(form.generated_grn),
        pending_grn: parseInt(form.pending_grn),
        rejected_demands: parseInt(form.rejected_demands),
      });

      // Redirect to list page after successful update
      navigate('/store/reports/list');
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
            title="Update Store Report" 
            showBackButton={true}
            backPath="/store/reports/list"
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
                {isSubmitting ? 'Updating...' : 'Submit Report'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default UpdateStoreReport; 