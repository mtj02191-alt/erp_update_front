import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { wheel_chair_or_crutches_vulnerabilities } from '../../../../../utils/program';
import axiosInstance from '../../../../../utils/axios';
import '../../../../../styles/variables.css';
import '../../../../../styles/components.css';
import Navbar from '../../../../Navbar';
import PageHeader from '../../../../common/PageHeader';
import FormInput from '../../../../common/FormInput';
import FormSelect from '../../../../common/FormSelect';
import DynamicFormSection from '../../../../common/DynamicFormSection';
import './index.css';

const AddWheelChairOrCrutchesReport = ({ isEmbedded = false, onFormDataChange }) => {
  const navigate = useNavigate();
  
  const initialDistributionRow = () => ({
    id: Date.now() + Math.random(), // Add random number to ensure key is unique
    type: 'Wheel Chair',
    gender: 'Male',
    vulnerabilities: wheel_chair_or_crutches_vulnerabilities.reduce((acc, v) => ({ ...acc, [v]: 0 }), {})
  });

  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    distributions: [initialDistributionRow()]
  });
  
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDateChange = e => {
    const nextForm = { ...form, [e.target.name]: e.target.value };
    setForm(nextForm);
    if (onFormDataChange) onFormDataChange(nextForm);
    if (error) setError('');
  };

  const handleRowChange = (id, field, value) => {
    const nextDistributions = form.distributions.map(row => 
      row.id === id ? { ...row, [field]: value } : row
    );
    const nextForm = {
      ...form,
      distributions: nextDistributions
    };
    setForm(nextForm);
    if (onFormDataChange) onFormDataChange(nextForm);
  };
  
  const handleVulnerabilityChange = (id, vul, value) => {
    const nextDistributions = form.distributions.map(row => {
      if (row.id !== id) return row;
      
      // Allow the input to be empty during typing.
      // The value will be treated as 0 for calculations.
      if (value === '') {
        return { ...row, vulnerabilities: { ...row.vulnerabilities, [vul]: '' } };
      }

      const num = parseInt(value, 10);
      const newVulnerabilities = {
        ...row.vulnerabilities,
        // Fallback to 0 if parsing fails (e.g., non-numeric input)
        [vul]: isNaN(num) ? 0 : num
      };
      return { ...row, vulnerabilities: newVulnerabilities };
    });
    
    const nextForm = {
      ...form,
      distributions: nextDistributions
    };
    setForm(nextForm);
    if (onFormDataChange) onFormDataChange(nextForm);
  };

  const addRow = () => {
    const nextForm = {
      ...form,
      distributions: [...form.distributions, initialDistributionRow()]
    };
    setForm(nextForm);
    if (onFormDataChange) onFormDataChange(nextForm);
  };

  const removeRow = (id) => {
    if (form.distributions.length <= 1) return;
    const nextForm = {
      ...form,
      distributions: form.distributions.filter(row => row.id !== id)
    };
    setForm(nextForm);
    if (onFormDataChange) onFormDataChange(nextForm);
  };

  const handleSubmit = async e => {
    if (e) e.preventDefault();
    if (!form.date) {
      setError('Date is required');
      return;
    }

    setIsSubmitting(true);
    try {
      // Convert distributions to the format expected by the backend
      const createDtos = form.distributions.map(dist => ({
        date: form.date,
        type: dist.type,
        gender: dist.gender,
        orphans: dist.vulnerabilities.Orphans || 0,
        divorced: dist.vulnerabilities.Divorced || 0,
        disable: dist.vulnerabilities.Disable || 0,
        indegent: dist.vulnerabilities.Indegent || 0
      }));

      await axiosInstance.post('/program/wheel_chair_or_crutches/reports/multiple', createDtos);
      if (!isEmbedded) navigate('/program/wheel_chair_or_crutches/reports/list');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit report. Please try again.');
      console.error('Error submitting report:', err);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const renderDistributionItem = (dist) => (
    <>
      <div className="form-grid-dynamic" style={{ gridTemplateColumns: '1fr 1fr', alignItems: 'flex-end' }}>
        <FormSelect
          name="type"
          label="Type"
          value={dist.type}
          onChange={e => handleRowChange(dist.id, 'type', e.target.value)}
          options={['Wheel Chair', 'Crutches']}
          required
        />
        <FormSelect
          name="gender"
          label="Gender"
          value={dist.gender}
          onChange={e => handleRowChange(dist.id, 'gender', e.target.value)}
          options={['Male', 'Female']}
          required
        />
      </div>
      <h5 className="form-section-subheading">Vulnerabilities</h5>
      <div className="form-grid-dynamic">
        {wheel_chair_or_crutches_vulnerabilities.map(vul => (
          <FormInput
            key={vul}
            name={`${dist.id}-${vul}`}
            label={vul}
            type="number"
            min="0"
            placeholder="0"
            value={dist.vulnerabilities[vul]}
            onChange={e => handleVulnerabilityChange(dist.id, vul, e.target.value)}
          />
        ))}
      </div>
    </>
  );

  return (
    <>
      {!isEmbedded && <Navbar />}
      <div className={isEmbedded ? "" : "form-wrapper"}>
        {!isEmbedded && (
          <PageHeader 
            title="Create Wheel Chair/Crutches Report"
            showBackButton={true}
            backPath="/program/wheel_chair_or_crutches/reports/list"
          />
        )}
        <div className={isEmbedded ? "" : "form-content"}>
          <form onSubmit={handleSubmit}>
            {error && <div className="status-message status-message--error">{error}</div>}
            <div className="form-group" style={{maxWidth: '300px'}}>
              <FormInput
                name="date"
                label="Report Date"
                type="date"
                value={form.date}
                onChange={handleDateChange}
                required
              />
            </div>

            <DynamicFormSection
              items={form.distributions}
              onAdd={addRow}
              onRemove={removeRow}
              renderItem={renderDistributionItem}
              titlePrefix="Distribution"
              canRemove={form.distributions.length > 1}
            />

            {!isEmbedded && (
              <div className="form-actions">
                <button
                  type="submit"
                  className="primary_btn"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creating...' : 'Submit Report'}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </>
  );
};

export default AddWheelChairOrCrutchesReport; 