import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import DropdownFilter from '../../../common/filters/DropdownFilter';
import MultiSelect from '../../../common/MultiSelect';
import { FiSend, FiStar } from 'react-icons/fi';
import { FaStar } from 'react-icons/fa';

const QUESTION_TYPE_LABELS = {
  mcq_single: 'MCQ (Single)',
  mcq_multiple: 'MCQ (Multiple)',
  yes_no: 'Yes/No',
  rating_1_5: 'Rating 1–5',
  short_text: 'Short Text',
};

const FillSurvey = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [survey, setSurvey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [answers, setAnswers] = useState({}); // question_id -> { answer_option_key?, answer_rating?, answer_text? }

  useEffect(() => {
    fetchForm();
  }, [id]);

  const fetchForm = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await axiosInstance.get(`/surveys/${id}/form`);
      if (res.data.success) {
        setSurvey(res.data.data);
        const initial = {};
        (res.data.data?.questions || []).forEach((q) => {
          initial[q.id] = {};
        });
        setAnswers(initial);
      } else setError('Failed to load survey form');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load survey form. Survey may not be active.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => navigate('/dms/surveys/list');

  const setAnswer = (questionId, field, value) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: { ...(prev[questionId] || {}), [field]: value },
    }));
  };

  const buildPayload = () => {
    return {
      answers: (survey?.questions || []).map((q) => {
        const a = answers[q.id] || {};
        return {
          question_id: q.id,
          ...(a.answer_option_key !== undefined && a.answer_option_key !== '' && { answer_option_key: a.answer_option_key }),
          ...(Array.isArray(a.answer_option_keys) && a.answer_option_keys.length > 0 && { answer_option_keys: a.answer_option_keys }),
          ...(a.answer_rating != null && { answer_rating: Number(a.answer_rating) }),
          ...(a.answer_text !== undefined && { answer_text: a.answer_text ?? '' }),
        };
      }),
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!survey) return;
    try {
      setSubmitting(true);
      setError('');
      await axiosInstance.post(`/surveys/${id}/submit`, buildPayload());
      setSuccess(true);
      setTimeout(() => navigate('/dms/surveys/list'), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit survey');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="list-wrapper">
          <div className="loading-container">
            <div className="loading-spinner" />
            <p>Loading survey form...</p>
          </div>
        </div>
      </>
    );
  }

  if (error && !survey) {
    return (
      <>
        <Navbar />
        <div className="list-wrapper">
          <div className="error-container">
            <div className="status-message status-message--error">{error}</div>
            <button className="primary_btn" onClick={handleBack}>Back to Surveys</button>
          </div>
        </div>
      </>
    );
  }

  if (success) {
    return (
      <>
        <Navbar />
        <div className="list-wrapper">
          <div className="status-message status-message--success">Survey submitted successfully. Redirecting...</div>
        </div>
      </>
    );
  }

  const questions = survey?.questions || [];

  return (
    <>
      <Navbar />
      <div className="list-wrapper">
        <PageHeader title={survey?.title || 'Fill Survey'} onBack={handleBack} />
        {survey?.description && (
          <p style={{ marginBottom: 16, color: '#666' }}>{survey.description}</p>
        )}
        {error && <div className="status-message status-message--error">{error}</div>}
        <form onSubmit={handleSubmit} className="form-section" style={{ maxWidth: 640 }}>
          {questions.map((q, index) => (
            <div key={q.id} className="form-group" style={{ marginBottom: 24 }}>
              <label className="form-label">
                {index + 1}. {q.question_text}
                {q.is_required && <span style={{ color: '#e53935', marginLeft: 4 }}>*</span>}
              </label>
              <span style={{ fontSize: 12, color: '#888', display: 'block', marginBottom: 8 }}>
                {QUESTION_TYPE_LABELS[q.question_type] || q.question_type}
              </span>

              {q.question_type === 'short_text' && (
                <input
                  type="text"
                  className="form-input"
                  value={answers[q.id]?.answer_text ?? ''}
                  onChange={(e) => setAnswer(q.id, 'answer_text', e.target.value)}
                  placeholder="Your answer"
                  required={q.is_required}
                />
              )}

              {q.question_type === 'rating_1_5' && (
                <div className="survey-rating-stars" style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
                  {[1, 2, 3, 4, 5].map((n) => {
                    const rating = answers[q.id]?.answer_rating ?? 0;
                    const filled = n <= rating;
                    return (
                      <button
                        key={n}
                        type="button"
                        className="survey-star-btn"
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: 4,
                          cursor: 'pointer',
                          color: filled ? '#ffc107' : '#ddd',
                          fontSize: 28,
                          lineHeight: 1,
                        }}
                        onClick={() => setAnswer(q.id, 'answer_rating', n)}
                        title={`${n} star${n > 1 ? 's' : ''}`}
                        aria-label={`Rate ${n} star${n > 1 ? 's' : ''}`}
                      >
                        {filled ? <FaStar /> : <FiStar />}
                      </button>
                    );
                  })}
                  {q.is_required && (
                    <input
                      type="hidden"
                      value={answers[q.id]?.answer_rating ?? ''}
                      required={q.is_required}
                      data-required-rating
                    />
                  )}
                </div>
              )}

              {(q.question_type === 'mcq_single' || q.question_type === 'yes_no') && (
                <DropdownFilter
                  filterKey={q.id}
                  filters={{ [q.id]: answers[q.id]?.answer_option_key ?? '' }}
                  onFilterChange={(key, val) => setAnswer(Number(key), 'answer_option_key', val)}
                  data={(q.options || []).map((o) => ({ value: o.option_key, label: o.option_text }))}
                  label=""
                  placeholder="Select an option..."
                  required={q.is_required}
                  showClearButton={!q.is_required}
                />
              )}

              {q.question_type === 'mcq_multiple' && (
                <MultiSelect
                  name={`q-${q.id}-multi`}
                  options={(q.options || []).map((o) => ({ value: o.option_key, label: o.option_text }))}
                  value={answers[q.id]?.answer_option_keys ?? []}
                  onChange={(val) => setAnswer(q.id, 'answer_option_keys', val)}
                  required={q.is_required}
                  placeholder="Select one or more..."
                />
              )}
            </div>
          ))}

          <div className="form-actions" style={{ marginTop: 24 }}>
            <button type="submit" className="primary_btn" disabled={submitting}>
              <FiSend style={{ marginRight: 8 }} /> {submitting ? 'Submitting...' : 'Submit survey'}
            </button>
            <button type="button" className="secondary_btn" onClick={handleBack} style={{ marginLeft: 12 }}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default FillSurvey;
