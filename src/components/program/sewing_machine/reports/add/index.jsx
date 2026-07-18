import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sewing_machine_vulnerabilities } from '../../../../../utils/program';
import axiosInstance from '../../../../../utils/axios';
import '../../../../../styles/variables.css';
import '../../../../../styles/components.css';
import Navbar from '../../../../Navbar';
import PageHeader from '../../../../common/PageHeader';
import FormInput from '../../../../common/FormInput';
import './index.css';

const AddSewingMachineReport = ({ isEmbedded = false, onFormDataChange }) => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    orphans: 0,
    divorced: 0,
    disable: 0,
    indegent: 0
  });
  
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = e => {
    const { name, value } = e.target;
    const nextForm = {
      ...form,
      [name]: value
    };
    setForm(nextForm);
    if (onFormDataChange) onFormDataChange(nextForm);
    if (error) setError('');
  };

  const handleMachineChange = (vul, value) => {
    const fieldName = vul.toLowerCase().replace(' ', '_');
    const numValue = value === '' ? 0 : parseInt(value, 10);
    const nextForm = {
      ...form,
      [fieldName]: isNaN(numValue) ? 0 : Math.max(0, numValue)
    };
    setForm(nextForm);
    if (onFormDataChange) onFormDataChange(nextForm);
    if (error) setError('');
  };

  const handleSubmit = async e => {
    if (e) e.preventDefault();
    if (!form.date) {
      setError('Date is required');
      return;
    }

    setIsSubmitting(true);
    try {
      await axiosInstance.post('/program/sewing_machine/reports', form);
      if (!isEmbedded) navigate('/program/sewing_machine/reports/list');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit report. Please try again.');
      console.error('Error submitting report:', err);
      throw err;
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

  return (
    <>
      {!isEmbedded && <Navbar />}
      <div className={isEmbedded ? "" : "form-wrapper"}>
        {!isEmbedded && (
          <PageHeader 
            title="Create Sewing Machine Report"
            showBackButton={true}
            backPath="/program/sewing_machine/reports/list"
          />
        )}
        <div className={isEmbedded ? "" : "form-content"}>
          <form onSubmit={handleSubmit}>
            {error && <div className="status-message status-message--error">{error}</div>}
            <div className="form-grid-2">
              <FormInput
                name="date"
                label="Report Date"
                type="date"
                value={form.date}
                onChange={handleChange}
                required
              />
              <div className="form-group">
                <label className="form-label">Total Machines</label>
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
            <div className="form-section-heading">Machine Distribution</div>
            <div className="form-grid-dynamic">
              {sewing_machine_vulnerabilities.map(vul => (
                <FormInput
                  key={vul}
                  name={`machines-${vul}`}
                  label={vul}
                  type="number"
                  min="0"
                  placeholder="0"
                  value={form[vul.toLowerCase().replace(' ', '_')] || 0}
                  onChange={e => handleMachineChange(vul, e.target.value)}
                />
              ))}
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

export default AddSewingMachineReport; 