import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { health_vulnerabilities } from '../../../../../utils/program';
import '../../../../../styles/variables.css';
import '../../../../../styles/components.css';
import Navbar from '../../../../Navbar';
import PageHeader from '../../../../common/PageHeader';
import FormInput from '../../../../common/FormInput';
import FormSelect from '../../../../common/FormSelect';
import DynamicFormSection from '../../../../common/DynamicFormSection';
import './index.css';
import axiosInstance from '../../../../../utils/axios';

const HEALTH_TYPES = ['In-house', 'Referred', 'Surgeries Supported', 'Ambulance', 'Medicines'];

const UpdateHealthReport = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    date: '',
    distributions: [],
  });

  const initialDistributionRow = () => ({
    id: Date.now() + Math.random(),
    type: 'In-house',
    vulnerabilities: health_vulnerabilities.reduce((acc, v) => ({ ...acc, [v]: 0 }), {}),
  });

  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/program/health/reports/${id}`);
      if (response.data?.success) {
        const report = response.data.data;
        const date =
          report.date instanceof Date ? report.date.toISOString().split('T')[0] : new Date(report.date).toISOString().split('T')[0];

        const dateResponse = await axiosInstance.get(`/program/health/reports/date/${date}`);
        if (dateResponse.data?.success) {
          setForm({
            date,
            distributions: dateResponse.data.data?.distributions || [],
          });
          setError('');
        } else {
          setError(dateResponse.data?.message || 'Failed to fetch report data');
        }
      } else {
        setError(response.data?.message || 'Failed to fetch report data');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch report data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleRowChange = (rowId, field, value) => {
    setForm((prev) => ({
      ...prev,
      distributions: prev.distributions.map((row) => (row.id === rowId ? { ...row, [field]: value } : row)),
    }));
  };

  const handleVulnerabilityChange = (rowId, vul, value) => {
    setForm((prev) => ({
      ...prev,
      distributions: prev.distributions.map((row) => {
        if (row.id !== rowId) return row;
        if (value === '') return { ...row, vulnerabilities: { ...row.vulnerabilities, [vul]: '' } };
        const num = parseInt(value, 10);
        return { ...row, vulnerabilities: { ...row.vulnerabilities, [vul]: Number.isNaN(num) ? 0 : num } };
      }),
    }));
  };

  const addRow = () => {
    setForm((prev) => ({ ...prev, distributions: [...prev.distributions, initialDistributionRow()] }));
  };

  const removeRow = (rowId) => {
    if (form.distributions.length <= 1) return;
    setForm((prev) => ({ ...prev, distributions: prev.distributions.filter((row) => row.id !== rowId) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.date) {
      setError('Date is required');
      return;
    }

    setIsSubmitting(true);
    try {
      await axiosInstance.delete(`/program/health/reports/date/${form.date}`);

      const createDtos = form.distributions.map((dist) => ({
        date: form.date,
        type: dist.type,
        widows: dist.vulnerabilities.Widows || 0,
        divorced: dist.vulnerabilities.Divorced || 0,
        disable: dist.vulnerabilities.Disable || 0,
        indegent: dist.vulnerabilities.Indegent || 0,
        orphans: dist.vulnerabilities.Orphans || 0,
      }));

      await axiosInstance.post('/program/health/reports/multiple', createDtos);
      navigate('/program/health/reports/list');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to Submit Report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderDistributionItem = (dist) => (
    <>
      <div className="form-grid-dynamic" style={{ gridTemplateColumns: '1fr', alignItems: 'flex-end' }}>
        <FormSelect
          name="type"
          label="Type"
          value={dist.type}
          onChange={(e) => handleRowChange(dist.id, 'type', e.target.value)}
          options={HEALTH_TYPES}
          required
        />
      </div>
      <h5 className="form-section-subheading">Vulnerabilities</h5>
      <div className="form-grid-dynamic">
        {health_vulnerabilities.map((vul) => (
          <FormInput
            key={vul}
            name={`${dist.id}-${vul}`}
            label={vul}
            type="number"
            min="0"
            placeholder="0"
            value={dist.vulnerabilities?.[vul]}
            onChange={(e) => handleVulnerabilityChange(dist.id, vul, e.target.value)}
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
          <PageHeader title="Update Health Report" showBackButton={true} backPath="/program/health/reports/list" />
          <div className="loading">Loading...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="form-wrapper">
        <PageHeader title="Update Health Report" showBackButton={true} backPath="/program/health/reports/list" />
        <div className="form-content">
          {error && <div className="status-message status-message--error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ maxWidth: '300px' }}>
              <FormInput name="date" label="Report Date" type="date" value={form.date} onChange={handleDateChange} required />
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

export default UpdateHealthReport;

