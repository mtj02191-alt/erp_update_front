import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { water_program_systems, water_activity_types } from '../../../../../utils/program';
import '../../../../../styles/variables.css';
import '../../../../../styles/components.css';
import Navbar from '../../../../Navbar';
import PageHeader from '../../../../common/PageHeader';
import FormInput from '../../../../common/FormInput';
import FormSelect from '../../../../common/FormSelect';
import DynamicFormSection from '../../../../common/DynamicFormSection';
import axios from '../../../../../utils/axios';

const UpdateWaterReport = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const initialActivityRow = () => ({
    id: Date.now() + Math.random(),
    activity: water_activity_types[0],
    system: water_program_systems[0],
    quantity: 0
  });

  useEffect(() => {
    fetchReport();
  }, [id]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError('');

      let dateKey = id;
      const isDateKey = typeof id === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(id);
      if (!isDateKey) {
        const single = await axios.get(`/program/water/reports/${id}`);
        if (!single.data?.success) {
          setError(single.data?.message || 'Report not found');
          setForm(null);
          return;
        }
        dateKey = new Date(single.data.data?.date).toISOString().split('T')[0];
      }

      const response = await axios.get(`/program/water/reports/date/${dateKey}`);
      
      if (response.data.success) {
        const reportData = response.data.data;
        setForm({
          id: reportData.date, // Using date as ID for grouping
          date: reportData.date,
          activities: reportData.activities || []
        });
      } else {
        setError(response.data.message || 'Report not found');
      }
    } catch (err) {
      console.error('Error fetching water report:', err);
      setError(err.response?.data?.message || 'Failed to fetch report');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleRowChange = (id, field, value) => {
    let newActivities = form.activities.map(row => 
      row.id === id ? { ...row, [field]: value } : row
    );

    if (field === 'quantity') {
      newActivities = newActivities.map(row => {
        if (row.id !== id) return row;
        if (value === '') {
            return { ...row, quantity: '' };
        }
        const num = parseInt(value, 10);
        return { ...row, quantity: isNaN(num) ? 0 : num };
      });
    }

    setForm({ ...form, activities: newActivities });
  };

  const addRow = () => {
    setForm(prevForm => ({
      ...prevForm,
      activities: [...prevForm.activities, initialActivityRow()]
    }));
  };

  const removeRow = (id) => {
    if (form.activities.length <= 1) return;
    setForm(prevForm => ({
      ...prevForm,
      activities: prevForm.activities.filter(row => row.id !== id)
    }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      // First delete existing reports for this date
      await axios.delete(`/program/water/reports/date/${form.date}`);
      
      // Then create new reports
      const reportsData = form.activities.map(activity => ({
        date: form.date,
        activity: activity.activity,
        system: activity.system,
        quantity: activity.quantity || 0
      }));

      const response = await axios.post('/program/water/reports/multiple', reportsData);
      
      if (response.data.success) {
        navigate('/program/water/reports/list');
      } else {
        setError(response.data.message || 'Failed to Submit Report');
      }
    } catch (err) {
      console.error('Error updating water report:', err);
      setError(err.response?.data?.message || 'Failed to Submit Report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderActivityItem = (item) => (
    <div className="form-grid-dynamic" style={{ gridTemplateColumns: '1fr 1fr 1fr', alignItems: 'flex-end', gap: 'var(--spacing-lg)' }}>
      <FormSelect
        name="activity"
        label="Activity"
        value={item.activity}
        onChange={e => handleRowChange(item.id, 'activity', e.target.value)}
        options={water_activity_types}
        required
      />
      <FormSelect
        name="system"
        label="System"
        value={item.system}
        onChange={e => handleRowChange(item.id, 'system', e.target.value)}
        options={water_program_systems}
        required
      />
      <FormInput
        name="quantity"
        label="Quantity"
        type="number"
        min="0"
        value={item.quantity}
        onChange={e => handleRowChange(item.id, 'quantity', e.target.value)}
        placeholder="0"
        required
      />
    </div>
  );

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <Navbar />
      <div className="form-wrapper">
        <PageHeader 
          title="Update Water Report"
          showBackButton={true}
          backPath="/program/water/reports/list"
        />
        <div className="form-content">
          {error ? (
            <div className="status-message status-message--error">{error}</div>
          ) : form ? (
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
                items={form.activities}
                onAdd={addRow}
                onRemove={removeRow}
                renderItem={renderActivityItem}
                titlePrefix="Activity"
                canRemove={form.activities.length > 1}
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
          ) : (
            <div className="status-message status-message--error">Report not found</div>
          )}
        </div>
      </div>
    </>
  );
};

export default UpdateWaterReport; 