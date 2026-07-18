import React, { useEffect, useState } from 'react';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import axiosInstance from '../../../utils/axios';
import FormInput from '../../common/FormInput';
import FormSelect from '../../common/FormSelect';
import './DreamSchoolReportForm.css';

const TEACHER_OPTIONS = [
  { value: 'good', label: 'Good' },
  { value: 'poor', label: 'Poor' },
  { value: 'excellent', label: 'Excellent' },
  { value: 'medium', label: 'Medium' },
];

function newLine() {
  return {
    key: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    dream_school_id: '',
    visits: 0,
    remarks: '',
    teacher_performance: 'good',
  };
}

async function fetchAllDreamSchools() {
  const pageSize = 200;
  let page = 1;
  const all = [];
  let hasMore = true;
  while (hasMore) {
    const res = await axiosInstance.get('/program/dream-schools', {
      params: { page, pageSize, sortField: 'school_code', sortOrder: 'ASC' },
    });
    const chunk = res.data?.data ?? [];
    all.push(...chunk);
    const totalPages = res.data?.pagination?.totalPages ?? 1;
    if (page >= totalPages || chunk.length === 0) hasMore = false;
    else page += 1;
  }
  return all;
}

export default function DreamSchoolReportForm({
  initialMonth = '',
  initialLines = null,
  submitLabel = 'Save',
  onSubmit,
  error: externalError,
  disabled = false,
}) {
  const [reportMonth, setReportMonth] = useState(initialMonth);
  const [lines, setLines] = useState(() => (initialLines?.length ? initialLines : [newLine()]));
  const [schools, setSchools] = useState([]);
  const [loadingSchools, setLoadingSchools] = useState(true);
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const s = await fetchAllDreamSchools();
        setSchools(s);
      } catch {
        setLocalError('Could not load dream schools list');
      } finally {
        setLoadingSchools(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (initialMonth != null) setReportMonth(initialMonth);
  }, [initialMonth]);

  useEffect(() => {
    if (initialLines && initialLines.length > 0) {
      setLines(
        initialLines.map((l) => ({
          key: String(l.id ?? l.key ?? Math.random()),
          dream_school_id: String(l.dream_school_id),
          visits: l.visits,
          remarks: l.remarks ?? '',
          teacher_performance: l.teacher_performance || 'good',
        })),
      );
    }
  }, [initialLines]);

  const schoolOptions = schools.map((s) => ({
    value: String(s.id),
    label: `${s.school_code} — ${s.location}`,
  }));

  const err = externalError || localError;

  const handleSubmit = (e) => {
    e.preventDefault();
    setLocalError('');
    if (!reportMonth.trim()) {
      setLocalError('Month is required (e.g. Jan-26)');
      return;
    }
    const payloadLines = lines
      .filter((l) => l.dream_school_id)
      .map((l) => ({
        dream_school_id: parseInt(l.dream_school_id, 10),
        visits: Math.max(0, parseInt(l.visits, 10) || 0),
        remarks: l.remarks?.trim() || undefined,
        teacher_performance: l.teacher_performance,
      }));
    if (payloadLines.length === 0) {
      setLocalError('Add at least one school line with a selected school');
      return;
    }
    onSubmit({ report_month: reportMonth.trim(), lines: payloadLines });
  };

  return (
    <form onSubmit={handleSubmit} className="dsr-form">
      {err && <div className="status-message status-message--error">{err}</div>}
      {loadingSchools && <p className="status-message">Loading schools…</p>}

      <div className="form-grid">
        <FormInput
          name="report_month"
          label="Month"
          value={reportMonth}
          onChange={(e) => setReportMonth(e.target.value)}
          placeholder="e.g. Jan-26"
          required
          disabled={disabled}
        />
      </div>

      <div className="dsr-lines">
        <div className="dsr-lines__head">
          <h3>School reports</h3>
          <button
            type="button"
            className="dsr-lines__add"
            onClick={() => setLines((prev) => [...prev, newLine()])}
            disabled={disabled}
          >
            <FiPlus /> Add school
          </button>
        </div>

        {lines.map((line, idx) => (
          <div key={line.key} className="dsr-line-card">
            <div className="dsr-line-card__top">
              <span className="dsr-line-card__badge">#{idx + 1}</span>
              {lines.length > 1 && (
                <button
                  type="button"
                  className="dsr-line-card__remove"
                  onClick={() => setLines((prev) => prev.filter((l) => l.key !== line.key))}
                  disabled={disabled}
                  aria-label="Remove row"
                >
                  <FiTrash2 />
                </button>
              )}
            </div>
            <div className="form-grid dsr-line-card__grid">
              <FormSelect
                name={`school-${line.key}`}
                label="School"
                value={line.dream_school_id}
                onChange={(e) =>
                  setLines((prev) =>
                    prev.map((l) => (l.key === line.key ? { ...l, dream_school_id: e.target.value } : l)),
                  )
                }
                options={schoolOptions}
                showDefaultOption={true}
                defaultOptionText="Select school"
                required
                disabled={disabled}
              />
              <FormInput
                name={`visits-${line.key}`}
                label="Monitoring visits (count)"
                type="number"
                min={0}
                value={String(line.visits)}
                onChange={(e) =>
                  setLines((prev) =>
                    prev.map((l) => (l.key === line.key ? { ...l, visits: e.target.value } : l)),
                  )
                }
                required
                disabled={disabled}
              />
              <FormSelect
                name={`perf-${line.key}`}
                label="Teacher performance"
                value={line.teacher_performance}
                onChange={(e) =>
                  setLines((prev) =>
                    prev.map((l) => (l.key === line.key ? { ...l, teacher_performance: e.target.value } : l)),
                  )
                }
                options={TEACHER_OPTIONS}
                showDefaultOption={false}
                required
                disabled={disabled}
              />
              <FormInput
                name={`remarks-${line.key}`}
                label="Remarks"
                value={line.remarks}
                onChange={(e) =>
                  setLines((prev) =>
                    prev.map((l) => (l.key === line.key ? { ...l, remarks: e.target.value } : l)),
                  )
                }
                disabled={disabled}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="form-actions">
        <button type="submit" className="primary_btn" disabled={disabled || loadingSchools}>
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
