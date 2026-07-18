import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../../../../utils/axios';
import FormInput from '../../../../common/FormInput';
import FormSelect from '../../../../common/FormSelect';
import DynamicFormSection from '../../../../common/DynamicFormSection';
import PageHeader from '../../../../common/PageHeader';
import './AddKasbTrainingReport.css';
import Navbar from '../../../../Navbar';

const AddKasbTrainingReport = ({ isEmbedded = false, onFormDataChange }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const skillLevelOptions = [
    { value: 'expert', label: 'Expert' },
    { value: 'medium_expert', label: 'Medium Expert' },
    { value: 'new trainee', label: 'New Trainee' },
  ];

  const initialActivityRow = (overrides = {}) => {
    const defaultSkill = skillLevelOptions[0]?.value || '';
    return {
      id: Date.now() + Math.random(),
      skill_level: defaultSkill,
      quantity: '',
      addition: '',
      left: '',
      total: 0,
      ...overrides,
    };
  };

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    activities: [initialActivityRow()],
  });

  const toIntOrZero = (v) => {
    if (v === '' || v === null || v === undefined) return 0;
    const n = parseInt(v, 10);
    return Number.isNaN(n) ? 0 : n;
  };

  const recalcTotal = (activity) => {
    const quantity = toIntOrZero(activity.quantity);
    const addition = toIntOrZero(activity.addition);
    const left = toIntOrZero(activity.left);
    return quantity + addition - left;
  };

  const handleDateChange = (e) => {
    const nextForm = { ...formData, date: e.target.value };
    setFormData(nextForm);
    if (onFormDataChange) onFormDataChange(nextForm);
    if (error) setError('');
  };

  const handleRowChange = (id, field, value) => {
    const updatedActivities = formData.activities.map((activity) => {
      if (activity.id !== id) return activity;

      // Keep empty input while typing (especially for numeric fields)
      const nextActivity = { ...activity, [field]: value };
      nextActivity.total = recalcTotal(nextActivity);
      return nextActivity;
    });

    const nextForm = { ...formData, activities: updatedActivities };
    setFormData(nextForm);
    if (onFormDataChange) onFormDataChange(nextForm);
    if (error) setError('');
  };

  const addActivity = () => {
    const nextForm = {
      ...formData,
      activities: [...formData.activities, initialActivityRow()],
    };
    setFormData(nextForm);
    if (onFormDataChange) onFormDataChange(nextForm);
  };

  const removeActivity = (id) => {
    if (formData.activities.length <= 1) return;
    const nextForm = {
      ...formData,
      activities: formData.activities.filter((a) => a.id !== id),
    };
    setFormData(nextForm);
    if (onFormDataChange) onFormDataChange(nextForm);
  };

  const renderActivityItem = (activity) => (
    <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
      <FormSelect
        name={`skill_level-${activity.id}`}
        label="Skill Level"
        value={activity.skill_level}
        onChange={(e) => handleRowChange(activity.id, 'skill_level', e.target.value)}
        options={skillLevelOptions}
        required
      />

      <FormInput
        name={`quantity-${activity.id}`}
        label="Quantity"
        type="number"
        min="0"
        value={activity.quantity}
        onChange={(e) => {
          const v = e.target.value;
          handleRowChange(activity.id, 'quantity', v === '' ? '' : v);
        }}
        placeholder="0"
      />

      <FormInput
        name={`addition-${activity.id}`}
        label="Addition"
        type="number"
        min="0"
        value={activity.addition}
        onChange={(e) => {
          const v = e.target.value;
          handleRowChange(activity.id, 'addition', v === '' ? '' : v);
        }}
        placeholder="0"
      />

      <FormInput
        name={`left-${activity.id}`}
        label="Left"
        type="number"
        min="0"
        value={activity.left}
        onChange={(e) => {
          const v = e.target.value;
          handleRowChange(activity.id, 'left', v === '' ? '' : v);
        }}
        placeholder="0"
      />

      <div className="form-field">
        <label>Total</label>
        <div className="total-display">{activity.total}</div>
      </div>
    </div>
  );

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const createDtos = formData.activities.map((activity) => ({
        date: formData.date,
        skill_level: activity.skill_level,
        quantity: toIntOrZero(activity.quantity),
        addition: toIntOrZero(activity.addition),
        left: toIntOrZero(activity.left),
      }));

      const response = await axios.post('/program/kasb-training/reports/multiple', createDtos);
      if (response.data.success) {
        if (!isEmbedded) navigate('/program/kasb-training/reports');
      } else {
        setError(response.data.message || 'Failed to Submit Report');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred while creating the report');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={isEmbedded ? "" : "add-kasb-training-report"}>
      {!isEmbedded && <Navbar />}
      {!isEmbedded && <PageHeader title="Add Kasb Training Report" showBackButton={true} backPath="/program/kasb-training/reports" />}

      <div className={isEmbedded ? "" : "form-container"}>
        <form onSubmit={handleSubmit}>
          <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <FormInput
              name="date"
              label="Date"
              type="date"
              value={formData.date}
              onChange={handleDateChange}
              required
            />
          </div>

          <DynamicFormSection
            items={formData.activities}
            onAdd={addActivity}
            onRemove={removeActivity}
            renderItem={renderActivityItem}
            titlePrefix="Activity"
            canRemove={formData.activities.length > 1}
          />

          {error && <div className="error-message">{error}</div>}

          {!isEmbedded && (
            <div className="form-actions">
              <button type="submit" className="primary_btn" disabled={loading}>
                {loading ? 'Creating...' : 'Submit Report'}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default AddKasbTrainingReport;