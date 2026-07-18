import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import FormInput from '../../../common/FormInput';
import FormSelect from '../../../common/FormSelect';

const AddProgram = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    key: '',
    label: '',
    logo: '',
    status: 'active',
    applicationable: true,
  });

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ];

  const applicationableOptions = [
    { value: 'true', label: 'Yes — use in application reports & overview' },
    { value: 'false', label: 'No — hide from application flows' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.key.trim()) return setError('Please enter program key');
    if (!form.label.trim()) return setError('Please enter program label');

    setIsSubmitting(true);
    try {
      await axiosInstance.post('/program/programs', {
        key: form.key,
        label: form.label,
        logo: form.logo || null,
        status: form.status,
        applicationable: form.applicationable,
      });
      navigate('/program/programs');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create program');
      console.error('Error creating program:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="form-wrapper">
        <PageHeader title="Create Program" showBackButton={true} backPath="/program/programs" />
        <div className="form-content">
          <form onSubmit={handleSubmit}>
            {error && <div className="status-message status-message--error">{error}</div>}

            <div className="form-grid">
              <FormInput
                name="key"
                label="Key"
                value={form.key}
                onChange={(e) => setForm((p) => ({ ...p, key: e.target.value }))}
                placeholder="e.g. education"
                required
              />

              <FormInput
                name="label"
                label="Label"
                value={form.label}
                onChange={(e) => setForm((p) => ({ ...p, label: e.target.value }))}
                placeholder="e.g. Education"
                required
              />

              <FormInput
                name="logo"
                label="Logo (optional)"
                value={form.logo}
                onChange={(e) => setForm((p) => ({ ...p, logo: e.target.value }))}
                placeholder="/public/assets/images/program_logos/education.png"
              />

              <FormSelect
                name="status"
                label="Status"
                value={form.status}
                onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
                options={statusOptions}
                required
                showDefaultOption={false}
              />

              <FormSelect
                name="applicationable"
                label="Application reports"
                value={form.applicationable ? 'true' : 'false'}
                onChange={(e) =>
                  setForm((p) => ({ ...p, applicationable: e.target.value === 'true' }))
                }
                options={applicationableOptions}
                required
                showDefaultOption={false}
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="primary_btn" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Program'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default AddProgram;

