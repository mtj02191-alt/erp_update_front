import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../../../../../utils/axios';
import FormInput from '../../../../common/FormInput';
import FormSelect from '../../../../common/FormSelect';
import PageHeader from '../../../../common/PageHeader';
import DynamicFormSection from '../../../../common/DynamicFormSection';
import Navbar from '../../../../Navbar';
import './UpdateKasbTrainingReport.css';

const UpdateKasbTrainingReport = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [originalDate, setOriginalDate] = useState('');
  const [formData, setFormData] = useState({
    date: '',
    activities: [],
  });

  const skillLevelOptions = [
    { value: 'expert', label: 'Expert' },
    { value: 'medium_expert', label: 'Medium Expert' },
    { value: 'new trainee', label: 'New Trainee' }
  ];

  const initialActivityRow = () => {
    const defaultSkill = skillLevelOptions[0]?.value || '';
    return {
      id: Date.now() + Math.random(),
      skill_level: defaultSkill,
      quantity: '',
      addition: '',
      left: '',
      total: 0,
    };
  };

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

  useEffect(() => {
    fetchReport();
  }, [id]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/program/kasb-training/reports/${id}`);
      
      if (response.data.success) {
        const reportData = response.data.data;
        setOriginalDate(reportData?.date || '');
        setFormData({
          date: reportData?.date || '',
          activities: (reportData?.activities || []).map((a) => ({
            id: a.id,
            skill_level: a.skill_level || '',
            quantity: a.quantity ?? 0,
            addition: a.addition ?? 0,
            left: a.left ?? 0,
            total: a.total ?? recalcTotal({ quantity: a.quantity, addition: a.addition, left: a.left }),
          })),
        });
      } else {
        setError(response.data.message || 'Failed to fetch report');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred while fetching the report');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (e) => {
    setFormData((prev) => ({ ...prev, date: e.target.value }));
    if (error) setError('');
  };

  const handleRowChange = (rowId, field, value) => {
    setFormData((prev) => {
      const nextActivities = (prev.activities || []).map((activity) => {
        if (activity.id !== rowId) return activity;
        const nextActivity = { ...activity, [field]: value };
        nextActivity.total = recalcTotal(nextActivity);
        return nextActivity;
      });
      return { ...prev, activities: nextActivities };
    });
    if (error) setError('');
  };

  const addRow = () => {
    setFormData((prev) => ({
      ...prev,
      activities: [...(prev.activities || []), initialActivityRow()],
    }));
  };

  const removeRow = (rowId) => {
    setFormData((prev) => {
      if ((prev.activities || []).length <= 1) return prev;
      return { ...prev, activities: (prev.activities || []).filter((a) => a.id !== rowId) };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      await axios.delete(`/program/kasb-training/reports/date/${originalDate || formData.date}`);

      const reportsData = (formData.activities || []).map((activity) => ({
        date: formData.date,
        skill_level: activity.skill_level,
        quantity: toIntOrZero(activity.quantity),
        addition: toIntOrZero(activity.addition),
        left: toIntOrZero(activity.left),
      }));

      const response = await axios.post('/program/kasb-training/reports/multiple', reportsData);
      
      if (response.data.success) {
        navigate('/program/kasb-training/reports');
      } else {
        setError(response.data.message || 'Failed to Submit Report');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred while updating the report');
    } finally {
      setSaving(false);
    }
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

  if (loading) {
    return (
      <div className="update-kasb-training-report">
        <PageHeader 
          title="Update Kasb Training Report" 
          breadcrumbs={[
            { label: 'Program', path: '/program' },
            { label: 'Kasb Training Reports', path: '/program/kasb-training/reports' },
            { label: 'Submit Report' }
          ]}
        />
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="update-kasb-training-report">
      <Navbar />
      <PageHeader
        title="Update Kasb Training Report"
        showBackButton={true}
        backPath="/program/kasb-training/reports"
      />

      <div className="form-container">
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
            onAdd={addRow}
            onRemove={removeRow}
            renderItem={renderActivityItem}
            titlePrefix="Activity"
            canRemove={formData.activities.length > 1}
          />

          {error && <div className="error-message">{error}</div>}

          <div className="form-actions">
            <button type="submit" className="primary_btn" disabled={saving}>
              {saving ? 'Updating...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateKasbTrainingReport; 