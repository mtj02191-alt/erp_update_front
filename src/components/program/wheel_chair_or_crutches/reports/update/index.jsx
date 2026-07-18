import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { wheel_chair_or_crutches_vulnerabilities } from '../../../../../utils/program';
import '../../../../../styles/variables.css';
import '../../../../../styles/components.css';
import Navbar from '../../../../Navbar';
import PageHeader from '../../../../common/PageHeader';
import FormInput from '../../../../common/FormInput';
import FormSelect from '../../../../common/FormSelect';
import DynamicFormSection from '../../../../common/DynamicFormSection';
import './index.css';
import axiosInstance from '../../../../../utils/axios';

const UpdateWheelChairOrCrutchesReport = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    date: '',
    distributions: []
  });

  const initialDistributionRow = () => ({
    id: Date.now() + Math.random(),
    type: 'Wheel Chair',
    gender: 'Male',
    vulnerabilities: wheel_chair_or_crutches_vulnerabilities.reduce((acc, v) => ({ ...acc, [v]: 0 }), {})
  });

  // Real data fetching
  useEffect(() => {
    fetchReport();
  }, [id]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      // First get the report by ID to get the date
      const response = await axiosInstance.get(`/program/wheel_chair_or_crutches/reports/${id}`);
      
      if (response.data.success) {
        const report = response.data.data;
        const date = report.date instanceof Date 
          ? report.date.toISOString().split('T')[0]
          : new Date(report.date).toISOString().split('T')[0];
        
        // Then get all reports for this date
        const dateResponse = await axiosInstance.get(`/program/wheel_chair_or_crutches/reports/date/${date}`);
        
        if (dateResponse.data.success) {
          setForm({
            date: date,
            distributions: dateResponse.data.data.distributions
          });
          setError('');
        } else {
          setError('Failed to fetch report data');
        }
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

  const handleDateChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleRowChange = (id, field, value) => {
    setForm(prevForm => ({
      ...prevForm,
      distributions: prevForm.distributions.map(row => 
        row.id === id ? { ...row, [field]: value } : row
      )
    }));
  };
  
  const handleVulnerabilityChange = (id, vul, value) => {
    setForm(prevForm => ({
      ...prevForm,
      distributions: prevForm.distributions.map(row => {
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
      })
    }));
  };

  const addRow = () => {
    setForm(prevForm => ({
      ...prevForm,
      distributions: [...prevForm.distributions, initialDistributionRow()]
    }));
  };

  const removeRow = (id) => {
    if (form.distributions.length <= 1) return;
    setForm(prevForm => ({
      ...prevForm,
      distributions: prevForm.distributions.filter(row => row.id !== id)
    }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.date) {
      setError('Date is required');
      return;
    }

    setIsSubmitting(true);
    try {
      // First delete all existing reports for this date
      await axiosInstance.delete(`/program/wheel_chair_or_crutches/reports/date/${form.date}`);
      
      // Then create new reports with updated data
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
      navigate('/program/wheel_chair_or_crutches/reports/list');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to Submit Report. Please try again.');
      console.error('Error updating report:', err);
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

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="form-wrapper">
          <PageHeader 
            title="Update Wheel Chair/Crutches Report"
            showBackButton={true}
            backPath="/program/wheel_chair_or_crutches/reports/list"
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
          title="Update Wheel Chair/Crutches Report"
          showBackButton={true}
          backPath="/program/wheel_chair_or_crutches/reports/list"
        />
        <div className="form-content">
          {error && <div className="status-message status-message--error">{error}</div>}
          <form onSubmit={handleSubmit}>
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

export default UpdateWheelChairOrCrutchesReport; 