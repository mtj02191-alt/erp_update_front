import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import FormInput from '../../../common/FormInput';
import FormSelect from '../../../common/FormSelect';
import './add.css';

const AddSubprogram = () => {
  const navigate = useNavigate();

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.program_id) {
      setError('Please select a program');
      return;
    }
    if (!form.key.trim()) {
      setError('Please enter subprogram key');
      return;
    }
    if (!form.label.trim()) {
      setError('Please enter subprogram label');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        program_id: Number(form.program_id),
        key: form.key,
        label: form.label,
        status: form.status,
      };

      await axiosInstance.post('/program/subprograms', payload);
      navigate('/program/subprograms');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create subprogram');
      console.error('Error creating subprogram:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="form-wrapper">
        <PageHeader
          title="Create Subprogram"
          showBackButton={true}
          backPath="/program/subprograms"
        />

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
                placeholder="e.g. education_general"
                required
              />

              <FormInput
                name="label"
                label="Label"
                value={form.label}
                onChange={(e) => setForm((prev) => ({ ...prev, label: e.target.value }))}
                placeholder="e.g. General"
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
                {isSubmitting ? 'Creating...' : 'Create Subprogram'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default AddSubprogram;

