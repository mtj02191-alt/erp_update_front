import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { FiGitBranch, FiMinus, FiRefreshCw, FiSidebar } from 'react-icons/fi';
import axiosInstance from '../../../../utils/axios';
import FormInput from '../../../common/FormInput';
import FormSelect from '../../../common/FormSelect';
import FormTextarea from '../../../common/FormTextarea';
import { PrimaryButton, SecondaryButton } from '../../../common/buttons';
import {
  DONOR_PIPELINE_STAGES,
  DONOR_PIPELINE_STAGE_HINTS,
  DONOR_PIPELINE_STAGE_LABELS,
  formatPipelineStage,
  resolveDonorPipelineStage,
} from './donorPipelineConstants';
import './DonorPipelinePanel.css';

function formatActor(user) {
  if (!user) return '—';
  return (
    [user.first_name, user.last_name].filter(Boolean).join(' ') ||
    user.email ||
    `User #${user.id}`
  );
}

function formatWhen(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
}

function formatAmount(amount, currency = 'PKR') {
  if (amount == null || amount === '' || Number.isNaN(Number(amount))) return null;
  return `${currency || 'PKR'} ${Number(amount).toLocaleString()}`;
}

/**
 * CRM pipeline panel — additive UI only; does not alter donation data.
 */
const DonorPipelinePanel = ({
  donorId,
  currentStage,
  askAmount = null,
  pledgeAmount = null,
  amountCurrency = 'PKR',
  canUpdate = false,
  onStageChanged,
}) => {
  const effectiveStage = resolveDonorPipelineStage(currentStage);
  const [stage, setStage] = useState(effectiveStage);
  const [reason, setReason] = useState('');
  const [mode, setMode] = useState('advanced'); // advanced | noted
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState(amountCurrency || 'PKR');
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [panelHidden, setPanelHidden] = useState(false);

  const showAmountField = stage === 'ask' || stage === 'pledge';

  useEffect(() => {
    setStage(resolveDonorPipelineStage(currentStage));
  }, [currentStage]);

  useEffect(() => {
    setCurrency(amountCurrency || 'PKR');
  }, [amountCurrency]);

  useEffect(() => {
    if (stage === 'ask' && askAmount != null && askAmount !== '') {
      setAmount(String(askAmount));
    } else if (stage === 'pledge' && pledgeAmount != null && pledgeAmount !== '') {
      setAmount(String(pledgeAmount));
    } else if (stage !== 'ask' && stage !== 'pledge') {
      setAmount('');
    }
  }, [stage, askAmount, pledgeAmount]);

  const fetchHistory = useCallback(async () => {
    if (!donorId) return;
    try {
      setLoadingHistory(true);
      setError('');
      const res = await axiosInstance.get(`/donors/${donorId}/pipeline-history`);
      if (res.data?.success) {
        setHistory(res.data.data || []);
      } else {
        setError(res.data?.message || 'Failed to load pipeline history');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load pipeline history');
    } finally {
      setLoadingHistory(false);
    }
  }, [donorId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const stageOptions = useMemo(
    () =>
      DONOR_PIPELINE_STAGES.map((value) => ({
        value,
        label: `${DONOR_PIPELINE_STAGE_LABELS[value]} — ${DONOR_PIPELINE_STAGE_HINTS[value]}`,
      })),
    [],
  );

  const modeOptions = useMemo(
    () => [
      { value: 'advanced', label: 'Move to selected stage' },
      { value: 'noted', label: 'Log reason without progressing' },
    ],
    [],
  );

  const currencyOptions = useMemo(
    () => [
      { value: 'PKR', label: 'PKR' },
      { value: 'USD', label: 'USD' },
      { value: 'EUR', label: 'EUR' },
      { value: 'GBP', label: 'GBP' },
    ],
    [],
  );

  const stepOptions = useMemo(
    () =>
      DONOR_PIPELINE_STAGES.map((value) => ({
        value,
        label: DONOR_PIPELINE_STAGE_LABELS[value],
        hint: DONOR_PIPELINE_STAGE_HINTS[value],
      })),
    [],
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canUpdate) return;
    const trimmed = reason.trim();
    if (trimmed.length < 3) {
      toast.error('Reason must be at least 3 characters');
      return;
    }

    const needsAmount = showAmountField && mode === 'advanced';
    const amountNum = Number(amount);
    if (needsAmount && (!Number.isFinite(amountNum) || amountNum <= 0)) {
      toast.error(
        stage === 'ask'
          ? 'Ask amount is required when moving to Ask'
          : 'Pledge amount is required when moving to Pledge',
      );
      return;
    }

    try {
      setSaving(true);
      const payload = {
        stage,
        reason: trimmed,
        transition_type: mode,
      };
      if (showAmountField && Number.isFinite(amountNum) && amountNum > 0) {
        payload.amount = amountNum;
        payload.currency = currency || 'PKR';
      }

      const res = await axiosInstance.post(`/donors/${donorId}/pipeline-stage`, payload);
      if (res.data?.success) {
        toast.success(res.data.message || 'Pipeline stage updated');
        setReason('');
        await fetchHistory();
        if (typeof onStageChanged === 'function') {
          onStageChanged(res.data.data?.donor || null);
        }
      } else {
        toast.error(res.data?.message || 'Failed to update stage');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update stage');
    } finally {
      setSaving(false);
    }
  };

  const askLabel = formatAmount(askAmount, amountCurrency);
  const pledgeLabel = formatAmount(pledgeAmount, amountCurrency);

  return (
    <section className="donor-pipeline-panel donor-crm-card">
      <div className="donor-pipeline-panel__header">
        <div className="donor-pipeline-panel__title-wrap">
          <span className="donor-profile-section__icon">
            <FiGitBranch />
          </span>
          <div>
            <h3 className="donor-crm-card__title" style={{ margin: 0 }}>
              CRM Pipeline
            </h3>
            <p className="donor-pipeline-panel__subtitle">
              Current stage:{' '}
              <strong>{formatPipelineStage(effectiveStage)}</strong>
              {currentStage == null ? ' (legacy — treated as Donor)' : ''}
            </p>
            {(askLabel || pledgeLabel) && (
              <p className="donor-pipeline-panel__subtitle">
                {askLabel ? (
                  <>
                    Ask: <strong>{askLabel}</strong>
                  </>
                ) : null}
                {askLabel && pledgeLabel ? ' · ' : null}
                {pledgeLabel ? (
                  <>
                    Pledge: <strong>{pledgeLabel}</strong>
                  </>
                ) : null}
              </p>
            )}
          </div>
        </div>
        <div className="donor-pipeline-panel__header-actions">
          <SecondaryButton
            type="button"
            onClick={fetchHistory}
            disabled={loadingHistory || panelHidden}
            loading={loadingHistory}
            loadingText="Refreshing…"
            icon={<FiRefreshCw />}
          >
            {/* Refresh */}
          </SecondaryButton>
          <SecondaryButton
            type="button"
            onClick={() => setPanelHidden((v) => !v)}
            icon={panelHidden ? <FiSidebar /> : <FiMinus />}
            title={panelHidden ? 'Show pipeline' : 'Hide pipeline'}
            aria-label={panelHidden ? 'Show pipeline' : 'Hide pipeline'}
          >
            {/* Hide / Show */}
          </SecondaryButton>
        </div>
      </div>

      {!panelHidden ? (
        <>
      <div className="donor-pipeline-steps" aria-label="Pipeline stages">
        {stepOptions.map((opt) => {
          const active = opt.value === effectiveStage;
          return (
            <div
              key={opt.value}
              className={`donor-pipeline-step${active ? ' is-active' : ''}`}
              title={opt.hint}
            >
              <span className="donor-pipeline-step__label">{opt.label}</span>
            </div>
          );
        })}
      </div>

      {canUpdate && (
        <form className="donor-pipeline-form" onSubmit={handleSubmit}>
          <div className="donor-pipeline-form__row">
            <FormSelect
              label="Move / note stage"
              name="pipeline_stage"
              value={stage}
              onChange={(e) => setStage(e.target.value)}
              options={stageOptions}
              required
            />

            <FormSelect
              label="Transition type"
              name="pipeline_mode"
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              options={modeOptions}
              required
            />
          </div>

          {showAmountField && (
            <div className="donor-pipeline-form__amount-row">
              <FormInput
                label={stage === 'ask' ? 'Ask amount' : 'Pledge amount'}
                type="number"
                name="pipeline_amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required={mode === 'advanced'}
                placeholder="0.00"
                step="0.01"
                min="0"
              />
              <FormSelect
                label="Currency"
                name="pipeline_currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                options={currencyOptions}
                required={mode === 'advanced'}
              />
            </div>
          )}

          <FormTextarea
            label="Reason (why moved / why not)"
            name="pipeline_reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            required
            placeholder="e.g. Interested after event visit — or: Not ready, asked to follow up next month"
          />

          <PrimaryButton
            type="submit"
            loading={saving}
            loadingText="Saving…"
            disabled={saving}
          >
            {mode === 'noted' ? 'Save note' : 'Update stage'}
          </PrimaryButton>
        </form>
      )}

      <div className="donor-pipeline-history">
        <h4 className="donor-pipeline-history__title">Stage history</h4>
        {error && <div className="error-message">{error}</div>}
        {loadingHistory ? (
          <p className="donor-pipeline-panel__muted">Loading history…</p>
        ) : history.length === 0 ? (
          <p className="donor-pipeline-panel__muted">No pipeline changes recorded yet.</p>
        ) : (
          <ul className="donor-pipeline-history__list">
            {history.map((row) => (
              <li key={row.id} className="donor-pipeline-history__item">
                <div className="donor-pipeline-history__meta">
                  <strong>
                    {formatPipelineStage(row.from_stage)} → {formatPipelineStage(row.to_stage)}
                  </strong>
                  <span className="donor-pipeline-history__badge">
                    {row.transition_type === 'noted' ? 'Note' : 'Moved'}
                  </span>
                </div>
                {row.amount != null && (
                  <p className="donor-pipeline-history__amount">
                    Amount: <strong>{formatAmount(row.amount, row.currency || 'PKR')}</strong>
                  </p>
                )}
                <p className="donor-pipeline-history__reason">{row.reason}</p>
                <div className="donor-pipeline-history__footer">
                  <span>{formatActor(row.changed_by)}</span>
                  <span>{formatWhen(row.created_at)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
        </>
      ) : null}
    </section>
  );
};

export default DonorPipelinePanel;
