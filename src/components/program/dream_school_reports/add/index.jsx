import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import DreamSchoolReportForm from '../DreamSchoolReportForm';

const AddDreamSchoolReport = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (payload) => {
    setError('');
    setSubmitting(true);
    try {
      await axiosInstance.post('/program/dream-school-reports', payload);
      navigate('/program/dream_school_reports');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="form-wrapper">
        <PageHeader title="New Dream School Report" showBackButton={true} backPath="/program/dream_school_reports" />
        <div className="form-content">
          <DreamSchoolReportForm
            onSubmit={handleSubmit}
            submitLabel={submitting ? 'Saving…' : 'Submit report'}
            error={error}
            disabled={submitting}
          />
        </div>
      </div>
    </>
  );
};

export default AddDreamSchoolReport;
