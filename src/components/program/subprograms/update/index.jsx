import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import FormInput from '../../../common/FormInput';
import FormSelect from '../../../common/FormSelect';
import './index.css';

const UpdateSubprogram = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    program_id: '',
    key: '',
    label: '',
    status: 'active',
  });

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [programOptions, setProgramOptions] = useState([]);
  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ];

  useEffect(() => {
    fetchSubprogram();
    // eslint-disable-next-line
  }, [id]);

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const response = await axiosInstance.get('/program/programs', {
          params: { page: 1, pageSize: 1000 },
        });
        if (response.data?.success) {
          setProgramOptions(
            (response.data.data || []).map((p) => ({ value: p.id, label: p.label })),
          );
        }
      } catch (err) {
        console.error('Error fetching programs:', err);
      }
    };
    fetchPrograms();
  }, []);

  const fetchSubprogram = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/program/subprograms/${id}`);
      if (response.data.success) {
        const data = response.data.data;
        setForm({
          program_id: data.program_id ?? '',
          key: data.key ?? '',
          label: data.label ?? '',
          status: data.status ?? 'active',
        });
      } else {
        setError(response.data.message || 'Failed to fetch subprogram');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch subprogram');
      console.error('Error fetching subprogram:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.program_id) return setError('Please select a program');
    if (!form.key.trim()) return setError('Please enter subprogram key');
    if (!form.label.trim()) return setError('Please enter subprogram label');

    setIsSubmitting(true);
    try {
      const payload = {
        program_id: Number(form.program_id),
        key: form.key,
        label: form.label,
        status: form.status,
      };

      await axiosInstance.patch(`/program/subprograms/${id}`, payload);
      navigate('/program/subprograms');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update subprogram');
      console.error('Error updating subprogram:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="update-subprogram-container">
          <div className="status-message">Loading subprogram...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="form-wrapper">
        <PageHeader title="Update Subprogram" showBackButton={true} backPath="/program/subprograms" />
        <div className="form-content">
          <form onSubmit={handleSubmit}>
            {error && <div className="status-message status-message--error">{error}</div>}

            <div className="form-grid">
              <FormSelect
                name="program_id"
                label="Program"
                value={form.program_id}
                onChange={(e) => setForm((prev) => ({ ...prev, program_id: e.target.value }))}
                options={programOptions}
                required
                showDefaultOption={true}
                defaultOptionText="Select Program"
              />

              <FormInput
                name="key"
                label="Key"
                value={form.key}
                onChange={(e) => setForm((prev) => ({ ...prev, key: e.target.value }))}
                required
              />

              <FormInput
                name="label"
                label="Label"
                value={form.label}
                onChange={(e) => setForm((prev) => ({ ...prev, label: e.target.value }))}
                required
              />

              <FormSelect
                name="status"
                label="Status"
                value={form.status}
                onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
                options={statusOptions}
                required
                showDefaultOption={false}
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="primary_btn" disabled={isSubmitting}>
                {isSubmitting ? 'Updating...' : 'Update Subprogram'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default UpdateSubprogram;

