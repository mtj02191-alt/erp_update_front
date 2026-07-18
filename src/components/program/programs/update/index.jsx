import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import FormInput from '../../../common/FormInput';
import FormSelect from '../../../common/FormSelect';

const UpdateProgram = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    fetchProgram();
    // eslint-disable-next-line
  }, [id]);

  const fetchProgram = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/program/programs/${id}`);
      if (response.data.success) {
        const data = response.data.data;
        setForm({
          key: data.key ?? '',
          label: data.label ?? '',
          logo: data.logo ?? '',
          status: data.status ?? 'active',
          applicationable: data.applicationable !== false,
        });
      } else {
        setError(response.data.message || 'Failed to fetch program');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch program');
      console.error('Error fetching program:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.key.trim()) return setError('Please enter program key');
    if (!form.label.trim()) return setError('Please enter program label');

    setIsSubmitting(true);
    try {
      await axiosInstance.patch(`/program/programs/${id}`, {
        key: form.key,
        label: form.label,
        logo: form.logo || null,
        status: form.status,
        applicationable: form.applicationable,
      });
      navigate('/program/programs');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update program');
      console.error('Error updating program:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="update-program-container">
          <div className="status-message">Loading program...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="form-wrapper">
        <PageHeader title="Update Program" showBackButton={true} backPath="/program/programs" />
        <div className="form-content">
          <form onSubmit={handleSubmit}>
            {error && <div className="status-message status-message--error">{error}</div>}

            <div className="form-grid">
              <FormInput
                name="key"
                label="Key"
                value={form.key}
                onChange={(e) => setForm((p) => ({ ...p, key: e.target.value }))}
                required
              />

              <FormInput
                name="label"
                label="Label"
                value={form.label}
                onChange={(e) => setForm((p) => ({ ...p, label: e.target.value }))}
                required
              />

              <FormInput
                name="logo"
                label="Logo (optional)"
                value={form.logo}
                onChange={(e) => setForm((p) => ({ ...p, logo: e.target.value }))}
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
                {isSubmitting ? 'Updating...' : 'Update Program'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default UpdateProgram;

