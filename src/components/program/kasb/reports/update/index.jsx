import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../../../../../styles/variables.css';
import '../../../../../styles/components.css';
import Navbar from '../../../../Navbar';
import PageHeader from '../../../../common/PageHeader';
import FormInput from '../../../../common/FormInput';
import FormSelect from '../../../../common/FormSelect';
import DynamicFormSection from '../../../../common/DynamicFormSection';
import axios from '../../../../../utils/axios';
import { kasb_centers } from '../../../../../utils/program';

const UpdateKasbReport = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const initialCenterRow = () => ({
    id: Date.now() + Math.random(),
    center: kasb_centers[0],
    delivery: 0,
  });

  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError('');

      let dateKey = id;
      const isDateKey = typeof id === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(id);

      if (!isDateKey) {
        const single = await axios.get(`/program/kasb/reports/${id}`);
        if (!single.data?.success) {
          setError(single.data?.message || 'Report not found');
          setForm(null);
          return;
        }

        const singleData = single.data.data;
        dateKey =
          singleData?.date instanceof Date
            ? singleData.date.toISOString().split('T')[0]
            : new Date(singleData?.date).toISOString().split('T')[0];
      }

      const response = await axios.get(`/program/kasb/reports/date/${dateKey}`);
      if (response.data.success) {
        const reportData = response.data.data;
        setForm({
          id: reportData.date,
          date: reportData.date,
          centers: reportData.centers || [],
        });
      } else {
        setError(response.data.message || 'Report not found');
        setForm(null);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch report');
      setForm(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleRowChange = (rowId, field, value) => {
    setForm((prevForm) => {
      if (!prevForm) return prevForm;

      let newCenters = prevForm.centers.map((row) =>
        row.id === rowId ? { ...row, [field]: value } : row,
      );

      if (field === 'delivery') {
        newCenters = newCenters.map((row) => {
          if (row.id !== rowId) return row;
          if (value === '') return { ...row, delivery: '' };
          const num = parseInt(value, 10);
          return { ...row, delivery: isNaN(num) ? 0 : num };
        });
      }

      return { ...prevForm, centers: newCenters };
    });
    if (error) setError('');
  };

  const addRow = () => {
    setForm((prevForm) => ({
      ...prevForm,
      centers: [...prevForm.centers, initialCenterRow()],
    }));
  };

  const removeRow = (rowId) => {
    setForm((prevForm) => {
      if (!prevForm) return prevForm;
      if (prevForm.centers.length <= 1) return prevForm;
      return {
        ...prevForm,
        centers: prevForm.centers.filter((row) => row.id !== rowId),
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form?.date) {
      setError('Date is required');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Delete all rows for this date, then recreate from the form.
      await axios.delete(`/program/kasb/reports/date/${form.date}`);

      const reportsData = form.centers.map((center) => ({
        date: form.date,
        center: center.center,
        delivery: center.delivery || 0,
      }));

      const response = await axios.post('/program/kasb/reports/multiple', reportsData);
      if (response.data.success) {
        navigate('/program/kasb/reports/list');
      } else {
        setError(response.data.message || 'Failed to Submit Report');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to Submit Report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderCenterItem = (item) => (
    <div
      className="form-grid-dynamic"
      style={{ gridTemplateColumns: '1fr 1fr', alignItems: 'flex-end', gap: 'var(--spacing-lg)' }}
    >
      <FormSelect
        name="center"
        label="Center"
        value={item.center}
        onChange={(e) => handleRowChange(item.id, 'center', e.target.value)}
        options={kasb_centers}
        required
      />
      <FormInput
        name="delivery"
        label="Delivery"
        type="number"
        min="0"
        value={item.delivery}
        onChange={(e) => handleRowChange(item.id, 'delivery', e.target.value)}
        placeholder="0"
        required
      />
    </div>
  );

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="form-wrapper">
          <PageHeader
            title="Update Kasb Report"
            showBackButton={true}
            backPath="/program/kasb/reports/list"
          />
          <div className="form-content">
            <div className="loading-state">Loading...</div>
          </div>
        </div>
      </>
    );
  }

  if (!form) {
    return (
      <>
        <Navbar />
        <div className="form-wrapper">
          <PageHeader
            title="Update Kasb Report"
            showBackButton={true}
            backPath="/program/kasb/reports/list"
          />
          <div className="form-content">
            <div className="status-message status-message--error">Report not found</div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="form-wrapper">
        <PageHeader
          title="Update Kasb Report"
          showBackButton={true}
          backPath="/program/kasb/reports/list"
        />
        <div className="form-content">
          {error ? (
            <div className="status-message status-message--error">{error}</div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-group" style={{ maxWidth: '300px' }}>
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
                items={form.centers}
                onAdd={addRow}
                onRemove={removeRow}
                renderItem={renderCenterItem}
                titlePrefix="Center"
                canRemove={form.centers.length > 1}
              />

              <div className="form-actions">
                <button type="submit" className="primary_btn" disabled={isSubmitting}>
                  {isSubmitting ? 'Updating...' : 'Submit Report'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
};

export default UpdateKasbReport;