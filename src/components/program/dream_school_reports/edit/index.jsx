import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import DreamSchoolReportForm from '../DreamSchoolReportForm';

const EditDreamSchoolReport = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [initial, setInitial] = useState({ month: '', lines: [] });

  useEffect(() => {
    (async () => {
      try {
        const res = await axiosInstance.get(`/program/dream-school-reports/${id}`);
        if (res.data.success && res.data.data) {
          const d = res.data.data;
          setError('');
          setInitial({
            month: d.report_month || '',
            lines: d.lines || [],
          });
        } else {
          setError(res.data.message || 'Not found');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Not found');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleSubmit = async (payload) => {
    setError('');
    setSubmitting(true);
    try {
      await axiosInstance.patch(`/program/dream-school-reports/${id}`, payload);
      navigate('/program/dream_school_reports');
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
        <PageHeader title="Edit Dream School Report" showBackButton={true} backPath="/program/dream_school_reports" />
        <div className="form-content">
          {error && !initial.lines.length ? (
            <div className="status-message status-message--error">{error}</div>
          ) : (
            <DreamSchoolReportForm
              initialMonth={initial.month}
              initialLines={initial.lines}
              onSubmit={handleSubmit}
              submitLabel={submitting ? 'Saving…' : 'Update report'}
              error={error}
              disabled={submitting}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default EditDreamSchoolReport;
