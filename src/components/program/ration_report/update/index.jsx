import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ration_vulnerabilities } from '../../../../utils/program';
import axiosInstance from '../../../../utils/axios';
import '../../../../styles/variables.css';
import '../../../../styles/components.css';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import FormInput from '../../../common/FormInput';
import RationReportSwitch from '../RationReportSwitch';
import './UpdateRation.css';

const UpdateRationReport = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    report_date: '',
    is_alternate: false,
    full_widows: 0,
    full_divorced: 0,
    full_disable: 0,
    full_indegent: 0,
    full_orphan: 0,
    half_widows: 0,
    half_divorced: 0,
    half_disable: 0,
    half_indegent: 0,
    half_orphan: 0,
    life_time_full_widows: 0,
    life_time_full_divorced: 0,
    life_time_full_disable: 0,
    life_time_full_indegent: 0,
    life_time_full_orphan: 0,
    life_time_half_widows: 0,
    life_time_half_divorced: 0,
    life_time_half_disable: 0,
    life_time_half_indegent: 0,
    life_time_half_orphan: 0
  });

  useEffect(() => {
    fetchRationReport();
  }, [id]);

  const fetchRationReport = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/program/ration/reports/${id}`);
      
      if (response.data.success) {
        const data = response.data.data;
        setForm({
          report_date: data.date,
          is_alternate: data.is_alternate || false,
          full_widows: data.full?.Widows || 0,
          full_divorced: data.full?.Divorced || 0,
          full_disable: data.full?.Disable || 0,
          full_indegent: data.full?.Indegent || 0,
          full_orphan: data.full?.Orphan || 0,
          half_widows: data.half?.Widows || 0,
          half_divorced: data.half?.Divorced || 0,
          half_disable: data.half?.Disable || 0,
          half_indegent: data.half?.Indegent || 0,
          half_orphan: data.half?.Orphan || 0,
          life_time_full_widows: data.life_time_full?.Widows || 0,
          life_time_full_divorced: data.life_time_full?.Divorced || 0,
          life_time_full_disable: data.life_time_full?.Disable || 0,
          life_time_full_indegent: data.life_time_full?.Indegent || 0,
          life_time_full_orphan: data.life_time_full?.Orphan || 0,
          life_time_half_widows: data.life_time_half?.Widows || 0,
          life_time_half_divorced: data.life_time_half?.Divorced || 0,
          life_time_half_disable: data.life_time_half?.Disable || 0,
          life_time_half_indegent: data.life_time_half?.Indegent || 0,
          life_time_half_orphan: data.life_time_half?.Orphan || 0
        });
        setError('');
      } else {
        setError('Failed to fetch ration report data');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch ration report data. Please try again.');
      console.error('Error fetching ration report:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: name === 'is_alternate' ? e.target.checked : value
    }));
    if (error) setError('');
  };

  const handleVulnerabilityChange = (type, vul, value) => {
    const fieldName = `${type}_${vul.toLowerCase()}`;
    const numValue = value === '' ? 0 : parseInt(value, 10);
    setForm(prev => ({
      ...prev,
      [fieldName]: isNaN(numValue) ? 0 : numValue
    }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.report_date) {
      setError('Date is required');
      return;
    }

    setIsSubmitting(true);
    try {
      await axiosInstance.patch(`/program/ration/reports/${id}`, form);
      navigate('/program/ration_report/list');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to Submit Report. Please try again.');
      console.error('Error updating report:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTotal = (type) => {
    return ration_vulnerabilities.reduce((sum, vul) => {
      const fieldName = `${type}_${vul.toLowerCase()}`;
      return sum + (form[fieldName] || 0);
    }, 0);
  };

  const getLifeTimeCombinedTotal = () =>
    getTotal('life_time_full') + getTotal('life_time_half');

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="page_container">
          <PageHeader 
            title="Update Ration Report"
            showBackButton={true}
            backPath="/program/ration_report/list"
          />
          <div className="loading">Loading...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="page_container">
        <PageHeader 
          title="Update Ration Report"
          showBackButton={true}
          backPath="/program/ration_report/list"
        />
        <form onSubmit={handleSubmit} className="user-form">
          {error && <div className="status-message status-message--error">{error}</div>}
          <div className="form-grid">
            <FormInput
              name="report_date"
              label="Date"
              type="date"
              value={form.report_date}
              onChange={handleChange}
              required
            />
            <div className="form-group">
              <label className="form-label">Alternate</label>
              <RationReportSwitch
                checked={form.is_alternate}
                onChange={handleChange}
                label=""
                name="is_alternate"
              />
            </div>
          </div>
          <div className="horizontal-row">
            <p className="semi-title">Full:</p>
            {ration_vulnerabilities.map(vul => (
              <FormInput
                key={`full-${vul}`}
                name={`full-${vul}`}
                label={vul}
                type="number"
                min={0}
                value={form[`full_${vul.toLowerCase()}`] || 0}
                onChange={e => handleVulnerabilityChange('full', vul, e.target.value)}
              />
            ))}
            <div className="form-group">
              <label className="form-label">Total</label>
              <input
                type="number"
                className="form-input"
                value={getTotal('full')}
                readOnly
                tabIndex={-1}
                style={{ background: '#f5f5f5', fontWeight: 600 }}
              />
            </div>
          </div>
          <div className="horizontal-row">
            <p className="semi-title">Half:</p>
            {ration_vulnerabilities.map(vul => (
              <FormInput
                key={`half-${vul}`}
                name={`half-${vul}`}
                label={vul}
                type="number"
                min={0}
                value={form[`half_${vul.toLowerCase()}`] || 0}
                onChange={e => handleVulnerabilityChange('half', vul, e.target.value)}
              />
            ))}
            <div className="form-group">
              <label className="form-label">Total</label>
              <input
                type="number"
                className="form-input"
                value={getTotal('half')}
                readOnly
                tabIndex={-1}
                style={{ background: '#f5f5f5', fontWeight: 600 }}
              />
            </div>
          </div>
          <div className="horizontal-row">
            <p className="semi-title">Life time — full:</p>
            {ration_vulnerabilities.map(vul => (
              <FormInput
                key={`life_time_full-${vul}`}
                name={`life_time_full-${vul}`}
                label={vul}
                type="number"
                min={0}
                value={form[`life_time_full_${vul.toLowerCase()}`] || 0}
                onChange={e => handleVulnerabilityChange('life_time_full', vul, e.target.value)}
              />
            ))}
            <div className="form-group">
              <label className="form-label">Total</label>
              <input
                type="number"
                className="form-input"
                value={getTotal('life_time_full')}
                readOnly
                tabIndex={-1}
                style={{ background: '#f5f5f5', fontWeight: 600 }}
              />
            </div>
          </div>
          <div className="horizontal-row">
            <p className="semi-title">Life time — half:</p>
            {ration_vulnerabilities.map(vul => (
              <FormInput
                key={`life_time_half-${vul}`}
                name={`life_time_half-${vul}`}
                label={vul}
                type="number"
                min={0}
                value={form[`life_time_half_${vul.toLowerCase()}`] || 0}
                onChange={e => handleVulnerabilityChange('life_time_half', vul, e.target.value)}
              />
            ))}
            <div className="form-group">
              <label className="form-label">Total</label>
              <input
                type="number"
                className="form-input"
                value={getTotal('life_time_half')}
                readOnly
                tabIndex={-1}
                style={{ background: '#f5f5f5', fontWeight: 600 }}
              />
            </div>
          </div>
          <div className="horizontal-row">
            <label className="semi-title" htmlFor="life_time_combined_total" style={{ marginRight: 8 }}>
              Life time (combined total):
            </label>
            <input
              id="life_time_combined_total"
              type="number"
              className="form-input"
              value={getLifeTimeCombinedTotal()}
              readOnly
              tabIndex={-1}
              style={{ maxWidth: 120, background: '#f5f5f5', fontWeight: 600 }}
            />
          </div>
          <button type="submit" className="primary_btn" disabled={isSubmitting}>
            {isSubmitting ? 'Updating...' : 'Submit Report'}
          </button>
        </form>
      </div>
    </>
  );
};

export default UpdateRationReport; 