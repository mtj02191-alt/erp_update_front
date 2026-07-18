import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { marriage_gifts_vulnerabilities } from '../../../../../utils/program';
import axiosInstance from '../../../../../utils/axios';
import '../../../../../styles/variables.css';
import '../../../../../styles/components.css';
import Navbar from '../../../../Navbar';
import PageHeader from '../../../../common/PageHeader';
import FormInput from '../../../../common/FormInput';
import './index.css';

const UpdateMarriageGiftsReport = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    report_date: '',
    orphans: 0,
    divorced: 0,
    disable: 0,
    indegent: 0
  });

  useEffect(() => {
    fetchReport();
  }, [id]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/program/marriage-gifts/reports/${id}`);
      
      if (response.data.success) {
        const data = response.data.data;
        setForm({
          report_date: data.date,
          orphans: data.gifts?.Orphans || 0,
          divorced: data.gifts?.Divorced || 0,
          disable: data.gifts?.Disable || 0,
          indegent: data.gifts?.Indegent || 0
        });
        setError('');
      } else {
        setError('Failed to fetch report data');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch report data. Please try again.');
      console.error('Error fetching report:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const handleGiftChange = (vul, value) => {
    const fieldName = vul.toLowerCase();
    const numValue = value === '' ? 0 : parseInt(value, 10);
    setForm(prev => ({
      ...prev,
      [fieldName]: isNaN(numValue) ? 0 : Math.max(0, numValue)
    }));
    if (error) setError('');
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.report_date) {
      setError('Date is required');
      return;
    }

    setIsSubmitting(true);
    try {
      await axiosInstance.patch(`/program/marriage-gifts/reports/${id}`, form);
      navigate('/program/marriage_gifts/reports/list');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to Submit Report. Please try again.');
      console.error('Error updating report:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTotal = () => {
    return Object.values(form).reduce((sum, count) => {
      if (typeof count === 'number') return sum + count;
      return sum;
    }, 0);
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="form-wrapper">
          <PageHeader 
            title="Update Marriage Gifts Report"
            showBackButton={true}
            backPath="/program/marriage_gifts/reports/list"
          />
          <div className="loading">Loading...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="form-wrapper">
        <PageHeader 
          title="Update Marriage Gifts Report"
          showBackButton={true}
          backPath="/program/marriage_gifts/reports/list"
        />
        <div className="form-content">
          <form onSubmit={handleSubmit}>
            {error && <div className="status-message status-message--error">{error}</div>}
            <div className="form-grid-2">
              <FormInput
                name="report_date"
                label="Report Date"
                type="date"
                value={form.report_date}
                onChange={handleChange}
                required
              />
              <div className="form-group">
                <label className="form-label">Total Gifts</label>
                <input
                  type="number"
                  className="form-input"
                  value={getTotal()}
                  readOnly
                  tabIndex={-1}
                  style={{ background: '#f5f5f5', fontWeight: 600 }}
                />
              </div>
            </div>
            <div className="form-section-heading">Gift Distribution</div>
            <div className="form-grid-dynamic">
              {marriage_gifts_vulnerabilities.map(vul => (
                <FormInput
                  key={vul}
                  name={`gifts-${vul}`}
                  label={vul}
                  type="number"
                  min="0"
                  placeholder="0"
                  value={form[vul.toLowerCase()] || 0}
                  onChange={e => handleGiftChange(vul, e.target.value)}
                />
              ))}
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

export default UpdateMarriageGiftsReport; 