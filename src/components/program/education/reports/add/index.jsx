import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../../../utils/axios';
import '../../../../../styles/variables.css';
import '../../../../../styles/components.css';
import Navbar from '../../../../Navbar';
import FormInput from '../../../../common/FormInput';
import PageHeader from '../../../../common/PageHeader';

const AddEducationReport = ({ isEmbedded = false, onFormDataChange }) => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    male_orphans: 0,
    male_divorced: 0,
    male_disable: 0,
    male_indegent: 0,
    female_orphans: 0,
    female_divorced: 0,
    female_disable: 0,
    female_indegent: 0
  });
  
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDateChange = e => {
    const nextForm = {
      ...form,
      date: e.target.value
    };
    setForm(nextForm);
    if (onFormDataChange) onFormDataChange(nextForm);
    if (error) setError('');
  };

  const handleFieldChange = (field, value) => {
    const numValue = value === '' ? 0 : parseInt(value, 10);
    const validValue = isNaN(numValue) ? 0 : Math.max(0, numValue);
    
    const nextForm = {
      ...form,
      [field]: validValue
    };
    setForm(nextForm);
    if (onFormDataChange) onFormDataChange(nextForm);
    if (error) setError('');
  };

  const getMaleTotal = () => {
    return (form.male_orphans || 0) + (form.male_divorced || 0) + (form.male_disable || 0) + (form.male_indegent || 0);
  };

  const getFemaleTotal = () => {
    return (form.female_orphans || 0) + (form.female_divorced || 0) + (form.female_disable || 0) + (form.female_indegent || 0);
  };

  const getOverallTotal = () => {
    return getMaleTotal() + getFemaleTotal();
  };

  const handleSubmit = async e => {
    if (e) e.preventDefault();
    if (!form.date) {
      setError('Date is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await axiosInstance.post('/program/education/reports', form);
      
      if (response.data && !isEmbedded) {
        navigate('/program/education/reports/list');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit report. Please try again.');
      console.error('Error submitting report:', err);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {!isEmbedded && <Navbar />}
      <div className={isEmbedded ? "" : "add-education-report"}>
        {!isEmbedded && (
          <PageHeader 
            title="Create Education Report"
            breadcrumbs={[
              { label: 'Program', path: '/program' },
              { label: 'Education Reports', path: '/program/education/reports/list' },
              { label: 'Add Report' }
            ]}
            actionButton={{
              label: 'Submit Report',
              onClick: handleSubmit,
              disabled: isSubmitting
            }}
          />
        )}
        
        <div className={isEmbedded ? "" : "form-container"}>
          <form onSubmit={handleSubmit}>
            {error && <div className="error-message">{error}</div>}
            
            <div className="form-row">
              <FormInput
                name="date"
                label="Report Date"
                type="date"
                value={form.date}
                onChange={handleDateChange}
                required
              />
              <div className="form-field">
                <label>Total Students</label>
                <div className="total-display">{getOverallTotal()}</div>
              </div>
            </div>

            {/* Male Section */}
            <div className="gender-section">
              <h3 className="section-title">Male Students</h3>
              <div className="vulnerabilities-grid">
                <FormInput
                  name="male_orphans"
                  label="Orphans"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={form.male_orphans}
                  onChange={e => handleFieldChange('male_orphans', e.target.value)}
                />
                <FormInput
                  name="male_divorced"
                  label="Divorced"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={form.male_divorced}
                  onChange={e => handleFieldChange('male_divorced', e.target.value)}
                />
                <FormInput
                  name="male_disable"
                  label="Disable"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={form.male_disable}
                  onChange={e => handleFieldChange('male_disable', e.target.value)}
                />
                <FormInput
                  name="male_indegent"
                  label="Indegent"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={form.male_indegent}
                  onChange={e => handleFieldChange('male_indegent', e.target.value)}
                />
              </div>
              <div className="gender-total">
                <label>Male Total:</label>
                <span className="total-value">{getMaleTotal()}</span>
              </div>
            </div>

            {/* Female Section */}
            <div className="gender-section">
              <h3 className="section-title">Female Students</h3>
              <div className="vulnerabilities-grid">
                <FormInput
                  name="female_orphans"
                  label="Orphans"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={form.female_orphans}
                  onChange={e => handleFieldChange('female_orphans', e.target.value)}
                />
                <FormInput
                  name="female_divorced"
                  label="Divorced"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={form.female_divorced}
                  onChange={e => handleFieldChange('female_divorced', e.target.value)}
                />
                <FormInput
                  name="female_disable"
                  label="Disable"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={form.female_disable}
                  onChange={e => handleFieldChange('female_disable', e.target.value)}
                />
                <FormInput
                  name="female_indegent"
                  label="Indegent"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={form.female_indegent}
                  onChange={e => handleFieldChange('female_indegent', e.target.value)}
                />
              </div>
              <div className="gender-total">
                <label>Female Total:</label>
                <span className="total-value">{getFemaleTotal()}</span>
              </div>
            </div>
            
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

export default AddEducationReport; 