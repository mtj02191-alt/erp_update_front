import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import FormInput from '../../../common/FormInput';
import FormSelect from '../../../common/FormSelect';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

const QUESTION_TYPE_OPTIONS = [
  { value: 'mcq_single', label: 'MCQ (Single)' },
  { value: 'mcq_multiple', label: 'MCQ (Multiple)' },
  { value: 'yes_no', label: 'Yes/No' },
  { value: 'rating_1_5', label: 'Rating 1-5' },
  { value: 'short_text', label: 'Short Text' },
];

const needsOptions = (type) =>
  type === 'mcq_single' || type === 'yes_no' || type === 'mcq_multiple';

const defaultQuestion = () => ({
  question_text: '',
  question_type: 'mcq_single',
  is_required: true,
  question_no: 0,
  options: [{ option_key: 'A', option_text: '' }],
});

const AddSurvey = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [surveyId, setSurveyId] = useState(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    start_at: '',
    end_at: '',
  });
  const [questions, setQuestions] = useState([defaultQuestion()]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleQuestionChange = (index, field, value) => {
    const next = [...questions];
    next[index] = { ...next[index], [field]: value };
    setQuestions(next);
  };

  const handleOptionChange = (qIndex, optIndex, field, value) => {
    const next = [...questions];
    next[qIndex].options = next[qIndex].options.map((o, i) =>
      i === optIndex ? { ...o, [field]: value } : o
    );
    setQuestions(next);
  };

  const addOption = (qIndex) => {
    const next = [...questions];
    const opts = next[qIndex].options || [];
    const keys = opts.map((o) => o.option_key);
    let newKey = 'A';
    for (let i = 65; i <= 90; i++) {
      const k = String.fromCharCode(i);
      if (!keys.includes(k)) { newKey = k; break; }
    }
    next[qIndex].options = [...opts, { option_key: newKey, option_text: '' }];
    setQuestions(next);
  };

  const removeOption = (qIndex, optIndex) => {
    const next = [...questions];
    next[qIndex].options = next[qIndex].options.filter((_, i) => i !== optIndex);
    setQuestions(next);
  };

  const addQuestion = () => {
    setQuestions([...questions, defaultQuestion()]);
  };

  const removeQuestion = (index) => {
    if (questions.length <= 1) return;
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleSubmitStep1 = async (e) => {
    e.preventDefault();
    if (!form.title?.trim()) {
      setError('Title is required');
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      const res = await axiosInstance.post('/surveys', {
        title: form.title.trim(),
        description: form.description?.trim() || undefined,
        status: 'draft',
        start_at: form.start_at || undefined,
        end_at: form.end_at || undefined,
      });
      if (res.data.success && res.data.data?.id) {
        setSurveyId(res.data.data.id);
        setStep(2);
      } else setError('Failed to create survey');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create survey');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitStep2 = async (e) => {
    e.preventDefault();
    const valid = questions.every(
      (q) => q.question_text?.trim() && (needsOptions(q.question_type) ? (q.options?.length && q.options.every((o) => o.option_text?.trim())) : true)
    );
    if (!valid) {
      setError('Fill all question text and option text where required.');
      return;
    }
    if (!surveyId) return;
    setIsSubmitting(true);
    setError('');
    try {
      const payload = {
        questions: questions.map((q, i) => ({
          question_text: q.question_text.trim(),
          question_type: q.question_type,
          is_required: q.is_required,
          question_no: i + 1,
          options: needsOptions(q.question_type)
            ? q.options.filter((o) => o.option_text?.trim()).map((o) => ({ option_key: o.option_key, option_text: o.option_text.trim() }))
            : undefined,
        })),
      };
      await axiosInstance.post(`/surveys/${surveyId}/questions`, payload);
      navigate(`/dms/surveys/view/${surveyId}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add questions');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (step === 2) setStep(1);
    else navigate('/dms/surveys/list');
  };

  return (
    <>
      <Navbar />
      <div className="form-content">
        <PageHeader
          title={step === 1 ? 'Create Survey' : 'Add Questions'}
          onBack={handleBack}
        />
        {error && <div className="status-message status-message--error">{error}</div>}
        {step === 1 ? (
          <form onSubmit={handleSubmitStep1} className="form">
            <div className="form-section">
              <div className="form-grid-2">
                <FormInput
                  label="Title"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  required
                  placeholder="Survey title"
                />
                <FormInput
                  label="Start date"
                  name="start_at"
                  type="date"
                  value={form.start_at}
                  onChange={handleChange}
                />
                <FormInput
                  label="End date"
                  name="end_at"
                  type="date"
                  value={form.end_at}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div className="form-section">
              <FormInput
                label="Description"
                type="textarea"
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={3}
                placeholder="Optional"
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="primary_btn" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Next: Add Questions'}
              </button>
              <button type="button" className="secondary_btn" onClick={() => navigate('/dms/surveys/list')}>
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmitStep2} className="form">
            {questions.map((q, qIndex) => (
              <div key={qIndex} className="form-section" style={{ border: '1px solid #eee', borderRadius: 8, padding: 16, marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <strong>Question {qIndex + 1}</strong>
                  <button type="button" className="icon-btn danger" onClick={() => removeQuestion(qIndex)} disabled={questions.length <= 1} title="Remove question">
                    <FiTrash2 />
                  </button>
                </div>
                <div className="form-grid-2">
                  <FormInput
                    label="Question text"
                    name={`q_${qIndex}_text`}
                    value={q.question_text}
                    onChange={(e) => handleQuestionChange(qIndex, 'question_text', e.target.value)}
                    required
                    placeholder="Enter question"
                  />
                  <FormSelect
                    label="Type"
                    name={`q_${qIndex}_type`}
                    value={q.question_type}
                    onChange={(e) => handleQuestionChange(qIndex, 'question_type', e.target.value)}
                    options={QUESTION_TYPE_OPTIONS}
                  />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label className="form-label">
                    <input
                      type="checkbox"
                      checked={q.is_required}
                      onChange={(e) => handleQuestionChange(qIndex, 'is_required', e.target.checked)}
                    />
                    {' '}Required
                  </label>
                </div>
                {(q.question_type === 'mcq_single' || q.question_type === 'yes_no' || q.question_type === 'mcq_multiple') && (
                  <div>
                    <label className="form-label">Options</label>
                    {(q.options || []).map((opt, oi) => (
                      <div key={oi} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                        <input
                          type="text"
                          placeholder="Key (A,B...)"
                          value={opt.option_key}
                          onChange={(e) => handleOptionChange(qIndex, oi, 'option_key', e.target.value)}
                          style={{ width: 60 }}
                        />
                        <input
                          type="text"
                          placeholder="Option text"
                          value={opt.option_text}
                          onChange={(e) => handleOptionChange(qIndex, oi, 'option_text', e.target.value)}
                          style={{ flex: 1 }}
                        />
                        <button type="button" className="icon-btn danger" onClick={() => removeOption(qIndex, oi)} title="Remove">×</button>
                      </div>
                    ))}
                    <button type="button" className="secondary_btn" onClick={() => addOption(qIndex)}>
                      <FiPlus size={14} /> Add option
                    </button>
                  </div>
                )}
              </div>
            ))}
            <div className="form-section">
              <button type="button" className="secondary_btn" onClick={addQuestion}>
                <FiPlus /> Add question
              </button>
            </div>
            <div className="form-actions">
              <button type="submit" className="primary_btn" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Questions'}
              </button>
              <button type="button" className="secondary_btn" onClick={() => navigate(`/dms/surveys/view/${surveyId}`)}>
                Skip & view survey
              </button>
            </div>
          </form>
        )}
      </div>
    </>
  );
};

export default AddSurvey;
