import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ration_vulnerabilities } from '../../../../utils/program';
import axiosInstance from '../../../../utils/axios';
import '../../../../styles/variables.css';
import '../../../../styles/components.css';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import FormInput from '../../../common/FormInput';
import './index.css';
import RationReportSwitch from '../RationReportSwitch';

const AddRationReport = ({ isEmbedded = false, onFormDataChange }) => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    report_date: new Date().toISOString().split('T')[0],
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
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = e => {
    const { name, value } = e.target;
    const nextForm = {
      ...form,
      [name]: name === 'is_alternate' ? e.target.checked : value
    };
    setForm(nextForm);
    if (onFormDataChange) onFormDataChange(nextForm);
    if (error) setError('');
  };

  const handleVulnerabilityChange = (type, vul, value) => {
    const fieldName = `${type}_${vul.toLowerCase()}`;
    const numValue = value === '' ? 0 : parseInt(value, 10);
    const nextForm = {
      ...form,
      [fieldName]: isNaN(numValue) ? 0 : numValue
    };
    setForm(nextForm);
    if (onFormDataChange) onFormDataChange(nextForm);
    if (error) setError('');
  };

  const handleSubmit = async e => {
    if (e) e.preventDefault();
    if (!form.report_date) {
      setError('Date is required');
      return;
    }
    setIsSubmitting(true);
    
    try {
      await axiosInstance.post('/program/ration/reports', form);
      if (!isEmbedded) navigate('/program/ration_report/list');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit form. Please try again.');
      console.error('Error submitting form:', err);
      throw err; // Re-throw for parent to handle if embedded
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

  return (
    <>
      {!isEmbedded && <Navbar />}
      <div className={isEmbedded ? "" : "page_container"}>
        {!isEmbedded && <PageHeader title="Create Ration Report" showBackButton={true} backPath="/program/ration_report/list" />}
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
          {!isEmbedded && (
            <button type="submit" className="primary_btn" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </button>
          )}
        </form>
      </div>
    </>
  );
};

export default AddRationReport;