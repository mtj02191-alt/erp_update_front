import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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

const defaultQuestion = () => ({
  question_text: '',
  question_type: 'mcq_single',
  is_required: true,
  question_no: 0,
  options: [{ option_key: 'A', option_text: '' }],
});

const needsOptions = (type) =>
  type === 'mcq_single' || type === 'yes_no' || type === 'mcq_multiple';

const EditSurvey = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [survey, setSurvey] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', start_at: '', end_at: '' });
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [questionsError, setQuestionsError] = useState('');
  const [error, setError] = useState('');
  const [newQuestions, setNewQuestions] = useState([defaultQuestion()]);
  const [addingQuestions, setAddingQuestions] = useState(false);

  useEffect(() => {
    fetchSurvey();
  }, [id]);

  const fetchSurvey = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(`/surveys/${id}`);
      if (res.data.success && res.data.data) {
        const s = res.data.data;
        setSurvey(s);
        if (s.status !== 'draft') {
          setError('Only draft surveys can be edited');
          return;
        }
        setForm({
          title: s.title || '',
          description: s.description || '',
          start_at: s.start_at ? s.start_at.slice(0, 10) : '',
          end_at: s.end_at ? s.end_at.slice(0, 10) : '',
        });
      } else setError('Survey not found');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load survey');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleQuestionChange = (index, field, value) => {
    const next = [...newQuestions];
    next[index] = { ...next[index], [field]: value };
    setNewQuestions(next);
    setQuestionsError('');
  };

  const handleOptionChange = (qIndex, optIndex, field, value) => {
    const next = [...newQuestions];
    next[qIndex].options = next[qIndex].options.map((o, i) =>
      i === optIndex ? { ...o, [field]: value } : o
    );
    setNewQuestions(next);
    setQuestionsError('');
  };

  const addOption = (qIndex) => {
    const next = [...newQuestions];
    const opts = next[qIndex].options || [];
    const keys = opts.map((o) => o.option_key);
    let newKey = 'A';
    for (let i = 65; i <= 90; i++) {
      const k = String.fromCharCode(i);
      if (!keys.includes(k)) { newKey = k; break; }
    }
    next[qIndex].options = [...opts, { option_key: newKey, option_text: '' }];
    setNewQuestions(next);
  };

  const removeOption = (qIndex, optIndex) => {
    const next = [...newQuestions];
    next[qIndex].options = next[qIndex].options.filter((_, i) => i !== optIndex);
    setNewQuestions(next);
  };

  const addNewQuestion = () => {
    setNewQuestions([...newQuestions, defaultQuestion()]);
    setQuestionsError('');
  };

  const removeNewQuestion = (index) => {
    if (newQuestions.length <= 1) return;
    setNewQuestions(newQuestions.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title?.trim()) {
      setError('Title is required');
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      await axiosInstance.patch(`/surveys/${id}`, {
        title: form.title.trim(),
        description: form.description?.trim() || undefined,
        start_at: form.start_at || undefined,
        end_at: form.end_at || undefined,
      });
      fetchSurvey();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update survey');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddQuestions = async (e) => {
    e.preventDefault();
    const hasContent = newQuestions.some((q) => q.question_text?.trim());
    if (!hasContent) {
      setQuestionsError('Add at least one question with text.');
      return;
    }
    const valid = newQuestions.every((q) => {
      if (!q.question_text?.trim()) return false;
      if (needsOptions(q.question_type)) {
        return q.options?.length && q.options.every((o) => o.option_text?.trim());
      }
      return true;
    });
    if (!valid) {
      setQuestionsError('Fill all question text and option text where required.');
      return;
    }
    setAddingQuestions(true);
    setQuestionsError('');
    try {
      const payload = {
        questions: newQuestions.map((q, i) => ({
          question_text: q.question_text.trim(),
          question_type: q.question_type,
          is_required: q.is_required,
          question_no: (survey?.questions?.length || 0) + i + 1,
          options: needsOptions(q.question_type)
            ? q.options.filter((o) => o.option_text?.trim()).map((o) => ({ option_key: o.option_key, option_text: o.option_text.trim() }))
            : undefined,
        })),
      };
      await axiosInstance.post(`/surveys/${id}/questions`, payload);
      setNewQuestions([defaultQuestion()]);
      fetchSurvey();
    } catch (err) {
      setQuestionsError(err.response?.data?.message || 'Failed to add questions');
    } finally {
      setAddingQuestions(false);
    }
  };

  const handleBack = () => navigate(`/dms/surveys/view/${id}`);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="list-wrapper">
          <div className="loading-container">
            <div className="loading-spinner" />
            <p>Loading...</p>
          </div>
        </div>
      </>
    );
  }

  const existingQuestions = survey?.questions || [];

  return (
    <>
      <Navbar />
      <div className="form-content">
        <PageHeader title="Edit Survey" onBack={handleBack} />
        {error && <div className="status-message status-message--error">{error}</div>}
        <form onSubmit={handleSubmit} className="form">
          <div className="form-section">
            <div className="form-grid-2">
              <FormInput label="Title" name="title" value={form.title} onChange={handleChange} required />
              <FormInput label="Start date" name="start_at" type="date" value={form.start_at} onChange={handleChange} />
              <FormInput label="End date" name="end_at" type="date" value={form.end_at} onChange={handleChange} />
            </div>
          </div>
          <div className="form-section">
            <FormInput label="Description" type="textarea" name="description" value={form.description} onChange={handleChange} rows={3} />
          </div>
          <div className="form-actions">
            <button type="submit" className="primary_btn" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save changes'}
            </button>
            <button type="button" className="secondary_btn" onClick={handleBack} disabled={isSubmitting}>Cancel</button>
          </div>
        </form>

        {survey?.status === 'draft' && (
          <>
            <div className="form-section" style={{ marginTop: 32 }}>
              <h3 className="form-label">Existing questions ({existingQuestions.length})</h3>
              {existingQuestions.length === 0 ? (
                <p style={{ color: '#666', marginTop: 8 }}>No questions yet. Add some below.</p>
              ) : (
                <ol style={{ paddingLeft: 20, marginTop: 8 }}>
                  {existingQuestions.map((q, i) => (
                    <li key={q.id} style={{ marginBottom: 6 }}>
                      {q.question_text}
                      <span style={{ marginLeft: 8, color: '#888', fontSize: 14 }}>
                        ({q.question_type})
                        {q.is_required && ' • Required'}
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </div>

            <div className="form-section" style={{ marginTop: 24, borderTop: '1px solid #eee', paddingTop: 24 }}>
              <h3 className="form-label">Add new questions</h3>
              {questionsError && <div className="status-message status-message--error" style={{ marginBottom: 12 }}>{questionsError}</div>}
              <form onSubmit={handleAddQuestions} className="form">
                {newQuestions.map((q, qIndex) => (
                  <div key={qIndex} className="form-section" style={{ border: '1px solid #eee', borderRadius: 8, padding: 16, marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <strong>New question {qIndex + 1}</strong>
                      <button type="button" className="icon-btn danger" onClick={() => removeNewQuestion(qIndex)} disabled={newQuestions.length <= 1} title="Remove question">
                        <FiTrash2 />
                      </button>
                    </div>
                    <div className="form-grid-2">
                      <FormInput
                        label="Question text"
                        name={`nq_${qIndex}_text`}
                        value={q.question_text}
                        onChange={(e) => handleQuestionChange(qIndex, 'question_text', e.target.value)}
                        placeholder="Enter question"
                      />
                      <FormSelect
                        label="Type"
                        name={`nq_${qIndex}_type`}
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
                    {needsOptions(q.question_type) && (
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
                  <button type="button" className="secondary_btn" onClick={addNewQuestion}>
                    <FiPlus /> Add another question
                  </button>
                </div>
                <div className="form-actions">
                  <button type="submit" className="primary_btn" disabled={addingQuestions}>
                    {addingQuestions ? 'Adding...' : 'Add these questions'}
                  </button>
                </div>
              </form>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default EditSurvey;
