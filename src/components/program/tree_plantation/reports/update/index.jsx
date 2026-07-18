import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../../../../utils/axios';
import '../../../../../styles/variables.css';
import '../../../../../styles/components.css';
import Navbar from '../../../../Navbar';
import PageHeader from '../../../../common/PageHeader';
import FormInput from '../../../../common/FormInput';
import './index.css';

const UpdateTreePlantationReport = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [form, setForm] = useState({
    report_date: '',
    school_name: '',
    plants: ''
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
      const response = await axiosInstance.get(`/program/tree_plantation/reports/${id}`);
      const report = response.data.data;
      setForm({
        report_date: report.report_date ? report.report_date.split('T')[0] : '',
        school_name: report.school_name || '',
        plants: report.plants?.toString() || ''
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
    if (!form.report_date || !form.school_name || !form.plants) {
      setError('All fields are required');
      return;
    }
    setIsSubmitting(true);
    try {
      await axiosInstance.patch(`/program/tree_plantation/reports/${id}`, {
        ...form,
        plants: parseInt(form.plants, 10)
      });
      navigate('/program/tree_plantation/reports/list');
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
          title="Update Tree Plantation Report"
          showBackButton={true}
          backPath="/program/tree_plantation/reports/list"
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
                name="school_name"
                label="School Name"
                type="text"
                value={form.school_name}
                onChange={handleChange}
                required
              />
              <FormInput
                name="plants"
                label="Plants (Quantity)"
                type="number"
                min="0"
                value={form.plants}
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

export default UpdateTreePlantationReport; 