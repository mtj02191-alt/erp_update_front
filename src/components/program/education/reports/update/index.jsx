import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../../../../../utils/axios';
import '../../../../../styles/variables.css';
import '../../../../../styles/components.css';
import Navbar from '../../../../Navbar';
import FormInput from '../../../../common/FormInput';
import PageHeader from '../../../../common/PageHeader';
// import './index.css';

const UpdateEducationReport = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    date: '',
    male_orphans: 0,
    male_divorced: 0,
    male_disable: 0,
    male_indegent: 0,
    female_orphans: 0,
    female_divorced: 0,
    female_disable: 0,
    female_indegent: 0
  });

  useEffect(() => {
    fetchReport();
  }, [id]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/program/education/reports/${id}`);
      const reportData = response.data.success ? response.data.data : response.data;
      
      setForm({
        date: reportData.date ? new Date(reportData.date).toISOString().split('T')[0] : '',
        male_orphans: reportData.male_orphans || 0,
        male_divorced: reportData.male_divorced || 0,
        male_disable: reportData.male_disable || 0,
        male_indegent: reportData.male_indegent || 0,
        female_orphans: reportData.female_orphans || 0,
        female_divorced: reportData.female_divorced || 0,
        female_disable: reportData.female_disable || 0,
        female_indegent: reportData.female_indegent || 0
      });
    } catch (err) {
      setError('Failed to fetch report');
      console.error('Error fetching report:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = e => {
    setForm(prev => ({
      ...prev,
      date: e.target.value
    }));
    if (error) setError('');
  };

  const handleFieldChange = (field, value) => {
    const numValue = value === '' ? 0 : parseInt(value, 10);
    const validValue = isNaN(numValue) ? 0 : Math.max(0, numValue);
    
    setForm(prev => ({
      ...prev,
      [field]: validValue
    }));
    if (error) setError('');
  };

  const getMaleTotal = () => {
    return form.male_orphans + form.male_divorced + form.male_disable + form.male_indegent;
  };

  const getFemaleTotal = () => {
    return form.female_orphans + form.female_divorced + form.female_disable + form.female_indegent;
  };

  const getOverallTotal = () => {
    return getMaleTotal() + getFemaleTotal();
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.date) {
      setError('Date is required');
      return;
    }

    setSaving(true);
    try {
      await axiosInstance.patch(`/program/education/reports/${id}`, form);
      navigate('/program/education/reports/list');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to Submit Report. Please try again.');
      console.error('Error updating report:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="update-education-report">
          <PageHeader 
            title="Update Education Report" 
            breadcrumbs={[
              { label: 'Program', path: '/program' },
              { label: 'Education Reports', path: '/program/education/reports/list' },
              { label: 'Submit Report' }
            ]}
          />
          <div className="loading">Loading...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="update-education-report">
        <PageHeader 
          title="Update Education Report" 
          breadcrumbs={[
            { label: 'Program', path: '/program' },
            { label: 'Education Reports', path: '/program/education/reports/list' },
            { label: 'Submit Report' }
          ]}
          backPath="/program/education/reports/list"
          actionButton={{
            label: 'Submit Report',
            onClick: handleSubmit,
            disabled: saving
          }}
        />
        
        <div className="form-container">
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
            
            <div className="form-actions">
              <button
                type="submit"
                className="primary_btn"
                disabled={saving}
              >
                {saving ? 'Updating...' : 'Submit Report'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default UpdateEducationReport; 