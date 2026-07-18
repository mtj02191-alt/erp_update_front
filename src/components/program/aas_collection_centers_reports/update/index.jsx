import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import FormInput from '../../../common/FormInput';
import CampRowsEditor from '../CampRowsEditor';

function buildCampWise(rows) {
  return rows
    .filter((r) => String(r.camp_name || '').trim())
    .map((r) => ({
      camp_name: String(r.camp_name).trim(),
      patients: Math.max(0, parseInt(r.patients, 10) || 0),
    }));
}

function rowsFromApi(list) {
  if (!Array.isArray(list) || list.length === 0) return [{ camp_name: '', patients: '' }];
  return list.map((c) => ({ camp_name: c.camp_name || '', patients: c.patients != null ? String(c.patients) : '' }));
}

const UpdateAasCollectionCentersReport = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    total_patients: 0,
    tests_conducted: 0,
    pending_tests: 0,
    revenue: 0,
    on_time_delivery_percent: 0,
    total_camps: 0,
  });
  const [campRows, setCampRows] = useState([{ camp_name: '', patients: '' }]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await axiosInstance.get(`/program/aas-collection-centers-reports/${id}`);
        if (res.data.success && res.data.data) {
          const d = res.data.data;
          setForm({
            total_patients: d.total_patients ?? 0,
            tests_conducted: d.tests_conducted ?? 0,
            pending_tests: d.pending_tests ?? 0,
            revenue: d.revenue ?? 0,
            on_time_delivery_percent: d.on_time_delivery_percent ?? 0,
            total_camps: d.total_camps ?? 0,
          });
          setCampRows(rowsFromApi(d.camp_wise_patients));
          setError('');
        } else {
          setError(res.data.message || 'Failed to load');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await axiosInstance.patch(`/program/aas-collection-centers-reports/${id}`, {
        total_patients: Number(form.total_patients) || 0,
        tests_conducted: Number(form.tests_conducted) || 0,
        pending_tests: Number(form.pending_tests) || 0,
        revenue: Number(form.revenue) || 0,
        on_time_delivery_percent: Number(form.on_time_delivery_percent) || 0,
        total_camps: Number(form.total_camps) || 0,
        camp_wise_patients: buildCampWise(campRows),
      });
      navigate('/program/aas_collection_centers_reports');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="form-wrapper">
          <div className="status-message">Loading…</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="form-wrapper">
        <PageHeader title="Edit AAS collection centers report" showBackButton backPath="/program/aas_collection_centers_reports" />
        <div className="form-content">
          <form onSubmit={handleSubmit}>
            {error && <div className="status-message status-message--error">{error}</div>}
            <div className="form-grid">
              <FormInput
                name="total_patients"
                label="Total patients"
                type="number"
                min={0}
                value={String(form.total_patients)}
                onChange={(e) => setForm((p) => ({ ...p, total_patients: e.target.value }))}
                required
              />
              <FormInput
                name="tests_conducted"
                label="Tests conducted"
                type="number"
                min={0}
                value={String(form.tests_conducted)}
                onChange={(e) => setForm((p) => ({ ...p, tests_conducted: e.target.value }))}
                required
              />
              <FormInput
                name="pending_tests"
                label="Pending tests"
                type="number"
                min={0}
                value={String(form.pending_tests)}
                onChange={(e) => setForm((p) => ({ ...p, pending_tests: e.target.value }))}
                required
              />
              <FormInput
                name="revenue"
                label="Revenue"
                type="number"
                min={0}
                step="0.01"
                value={String(form.revenue)}
                onChange={(e) => setForm((p) => ({ ...p, revenue: e.target.value }))}
                required
              />
              <FormInput
                name="on_time_delivery_percent"
                label="On-time delivery %"
                type="number"
                min={0}
                max={100}
                step="0.1"
                value={String(form.on_time_delivery_percent)}
                onChange={(e) => setForm((p) => ({ ...p, on_time_delivery_percent: e.target.value }))}
                required
              />
              <FormInput
                name="total_camps"
                label="Total camps"
                type="number"
                min={0}
                value={String(form.total_camps)}
                onChange={(e) => setForm((p) => ({ ...p, total_camps: e.target.value }))}
                required
              />
              <CampRowsEditor rows={campRows} onChange={setCampRows} />
            </div>
            <div className="form-actions">
              <button type="submit" className="primary_btn" disabled={submitting}>
                {submitting ? 'Saving…' : 'Update'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default UpdateAasCollectionCentersReport;
