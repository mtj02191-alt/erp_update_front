import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../../../../utils/axios';
import '../../../../../styles/variables.css';
import '../../../../../styles/components.css';
import Navbar from '../../../../Navbar';
import PageHeader from '../../../../common/PageHeader';
import FormInput from '../../../../common/FormInput';
import './index.css';

const UpdateAreaRationReport = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [form, setForm] = useState({
    report_date: '',
    province: '',
    district: '',
    city: '',
    quantity: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line
  }, [id]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/program/area_ration/reports/${id}`);
      const report = response.data.data;
      setForm({
        report_date: report.report_date ? report.report_date.split('T')[0] : '',
        province: report.province || '',
        district: report.district || '',
        city: report.city || '',
        quantity: report.quantity?.toString() || ''
      });
    } catch (err) {
      setError('Failed to fetch report details');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.report_date || !form.province || !form.district || !form.city || !form.quantity) {
      setError('All fields are required');
      return;
    }
    setIsSubmitting(true);
    try {
      await axiosInstance.patch(`/program/area_ration/reports/${id}`, {
        ...form,
        quantity: parseInt(form.quantity, 10)
      });
      navigate('/program/area_ration/reports/list');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to Submit Report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="form-wrapper"><div className="form-content"><div className="empty-state">Loading...</div></div></div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="form-wrapper">
        <PageHeader 
          title="Update Area Ration Report"
          showBackButton={true}
          backPath="/program/area_ration/reports/list"
        />
        <div className="form-content">
          <form onSubmit={handleSubmit}>
            {error && <div className="status-message status-message--error">{error}</div>}
            <div className="form-grid-2">
              <FormInput
                name="report_date"
                label="Date"
                type="date"
                value={form.report_date}
                onChange={handleChange}
                required
              />
              <FormInput
                name="province"
                label="Province"
                type="text"
                value={form.province}
                onChange={handleChange}
                required
              />
              <FormInput
                name="district"
                label="District"
                type="text"
                value={form.district}
                onChange={handleChange}
                required
              />
              <FormInput
                name="city"
                label="City"
                type="text"
                value={form.city}
                onChange={handleChange}
                required
              />
              <FormInput
                name="quantity"
                label="Quantity"
                type="number"
                min="0"
                value={form.quantity}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="primary_btn" disabled={isSubmitting}>
                {isSubmitting ? 'Updating...' : 'Submit Report'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default UpdateAreaRationReport; 