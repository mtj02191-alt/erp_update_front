import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { financial_assistance_vulnerabilities } from '../../../../../utils/program';
import axiosInstance from '../../../../../utils/axios';
import '../../../../../styles/variables.css';
import '../../../../../styles/components.css';
import Navbar from '../../../../Navbar';
import PageHeader from '../../../../common/PageHeader';
import FormInput from '../../../../common/FormInput';
import './index.css';

const UpdateFinancialAssistanceReport = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    report_date: '',
    widow: 0,
    divorced: 0,
    disable: 0,
    extreme_poor: 0
  });

  useEffect(() => {
    fetchReport();
  }, [id]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/program/financial_assistance/reports/${id}`);
      
      if (response.data.success) {
        const data = response.data.data;
        setForm({
          report_date: data.date,
          widow: data.assistance?.Widow || 0,
          divorced: data.assistance?.Divorced || 0,
          disable: data.assistance?.Disable || 0,
          extreme_poor: data.assistance?.['Extreme Poor'] || 0
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

  const handleAssistanceChange = (vul, value) => {
    const fieldName = vul.toLowerCase().replace(' ', '_');
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
      await axiosInstance.patch(`/program/financial_assistance/reports/${id}`, form);
      navigate('/program/financial_assistance/reports/list');
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
            title="Update Financial Assistance Report"
            showBackButton={true}
            backPath="/program/financial_assistance/reports/list"
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
          title="Update Financial Assistance Report"
          showBackButton={true}
          backPath="/program/financial_assistance/reports/list"
        />
        <div className="form-content">
          {error && <div className="status-message status-message--error">{error}</div>}
          <form onSubmit={handleSubmit}>
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
                <label className="form-label">Total Assistance</label>
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
            <div className="form-section-heading">Assistance Distribution</div>
            <div className="form-grid-dynamic">
              {financial_assistance_vulnerabilities.map(vul => (
                <FormInput
                  key={vul}
                  name={`assistance-${vul}`}
                  label={vul}
                  type="number"
                  min="0"
                  placeholder="0"
                  value={form[vul.toLowerCase().replace(' ', '_')] || 0}
                  onChange={e => handleAssistanceChange(vul, e.target.value)}
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

export default UpdateFinancialAssistanceReport; 