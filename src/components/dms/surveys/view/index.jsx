import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import Card from '../../../common/Card';
import { FiCheckCircle, FiXCircle, FiBarChart2, FiEdit, FiRefreshCw, FiEdit3 } from 'react-icons/fi';

const QUESTION_TYPE_LABELS = {
  mcq_single: 'MCQ (Single)',
  yes_no: 'Yes/No',
  rating_1_5: 'Rating 1-5',
  short_text: 'Short Text',
};

const ViewSurvey = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [survey, setSurvey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchSurvey();
  }, [id]);

  const fetchSurvey = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(`/surveys/${id}`);
      if (res.data.success) setSurvey(res.data.data);
      else setError('Failed to load survey');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load survey');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => navigate('/dms/surveys/list');
  const handleActivate = async () => {
    try {
      setActionLoading(true);
      await axiosInstance.patch(`/surveys/${id}/activate`);
      fetchSurvey();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to activate');
    } finally {
      setActionLoading(false);
    }
  };
  const handleClose = async () => {
    try {
      setActionLoading(true);
      await axiosInstance.patch(`/surveys/${id}/close`);
      fetchSurvey();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to close');
    } finally {
      setActionLoading(false);
    }
  };
  const handleReactivate = async () => {
    try {
      setActionLoading(true);
      await axiosInstance.patch(`/surveys/${id}/reactivate`);
      fetchSurvey();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reactivate');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const cls = status === 'active' ? 'status-badge--active' : status === 'closed' ? 'status-badge--closed' : 'status-badge--draft';
    return <span className={`status-badge ${cls}`}>{status}</span>;
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="list-wrapper">
          <div className="loading-container">
            <div className="loading-spinner" />
            <p>Loading survey...</p>
          </div>
        </div>
      </>
    );
  }

  if (error || !survey) {
    return (
      <>
        <Navbar />
        <div className="list-wrapper">
          <div className="error-container">
            <div className="status-message status-message--error">{error || 'Survey not found'}</div>
            <button className="primary_btn" onClick={handleBack}>Back to Surveys</button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="list-wrapper">
        <PageHeader
          title={survey.title}
          onBack={handleBack}
          showEdit={survey.status === 'draft'}
          editPath={`/dms/surveys/edit/${id}`}
        />
        {error && <div className="status-message status-message--error">{error}</div>}
        <div className="list-content">
          <div className="card-grid">
            <Card
              title="Survey details"
              data={{
                Status: getStatusBadge(survey.status),
                'Start date': survey.start_at ? new Date(survey.start_at).toLocaleDateString() : '—',
                'End date': survey.end_at ? new Date(survey.end_at).toLocaleDateString() : '—',
                Description: survey.description || '—',
              }}
            />
          </div>
          {survey.questions?.length > 0 && (
            <div className="form-section" style={{ marginTop: 24 }}>
              <h3 className="form-label">Questions</h3>
              <ol style={{ paddingLeft: 20 }}>
                {survey.questions.map((q, i) => (
                  <li key={q.id} style={{ marginBottom: 12 }}>
                    <strong>{q.question_text}</strong>
                    <span style={{ marginLeft: 8, color: '#666', fontSize: 14 }}>
                      ({QUESTION_TYPE_LABELS[q.question_type] || q.question_type})
                      {q.is_required && ' • Required'}
                    </span>
                    {q.options?.length > 0 && (
                      <ul style={{ marginTop: 4, paddingLeft: 20, fontSize: 14 }}>
                        {q.options.map((o) => (
                          <li key={o.id}>{o.option_key}: {o.option_text}</li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          )}
          <div className="form-actions" style={{ marginTop: 24 }}>
            {survey.status === 'draft' && (
              <button className="primary_btn" onClick={handleActivate} disabled={actionLoading}>
                <FiCheckCircle style={{ marginRight: 8 }} /> Activate survey
              </button>
            )}
            {survey.status === 'active' && (
              <>
                <button className="primary_btn" onClick={() => navigate(`/dms/surveys/fill/${id}`)}>
                  <FiEdit3 style={{ marginRight: 8 }} /> Fill survey
                </button>
                <button className="primary_btn" onClick={handleClose} disabled={actionLoading} style={{ backgroundColor: '#9e9e9e', marginLeft: 10 }}>
                  <FiXCircle style={{ marginRight: 8 }} /> Close survey
                </button>
              </>
            )}
            {survey.status === 'closed' && (
              <>
                <button className="primary_btn" onClick={handleReactivate} disabled={actionLoading} style={{ backgroundColor: '#4caf50' }}>
                  <FiRefreshCw style={{ marginRight: 8 }} /> Reactivate survey
                </button>
                <button className="primary_btn" onClick={() => navigate(`/dms/surveys/report/${id}`)} style={{ backgroundColor: '#673ab7', marginLeft: 10 }}>
                  <FiBarChart2 style={{ marginRight: 8 }} /> View report
                </button>
              </>
            )}
            {survey.status === 'draft' && (
              <button className="secondary_btn" onClick={() => navigate(`/dms/surveys/edit/${id}`)} style={{ marginLeft: 10 }}>
                <FiEdit style={{ marginRight: 8 }} /> Edit survey
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ViewSurvey;
