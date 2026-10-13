import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import axiosInstance from '../../../../utils/axios';
import DonationPendingAttachments, {
  uploadPendingRecurringDonationAttachments,
} from '../../donations/shared/DonationPendingAttachments';
import '../../donations/shared/DonationPendingAttachments.css';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import FormInput from '../../../common/FormInput';
import FormSelect from '../../../common/FormSelect';
import SearchableDropdown from '../../../common/SearchableDropdown';
import { projectCards } from '../../../../utils/program';
import { useAuth } from '../../../../context/AuthContext';
import { hasPermission, isSuperAdmin, canReconcileRecurring } from '../../../../utils/permissions';

const INTERVAL_OPTIONS = [
  { value: 'day', label: 'Daily' },
  { value: 'week', label: 'Weekly' },
  { value: 'month', label: 'Monthly' },
  { value: 'year', label: 'Yearly' },
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'canceled', label: 'Canceled' },
  { value: 'past_due', label: 'Past due' },
  { value: 'failed', label: 'Failed' },
];

const INSTALLMENT_STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
];

const START_MODE_OPTIONS = [
  { value: 'same_date', label: 'Recurring Billing date' },
  { value: 'first_of_month', label: 'First of month' },
  { value: 'custom', label: 'First billing date' },
];

const METHOD_OPTIONS = [
  { value: 'manual', label: 'Manual / remind' },
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank transfer' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'online', label: 'Online (non-Stripe)' },
];

const DONATION_TYPE_OPTIONS = [
  { value: '', label: '—' },
  { value: 'zakat', label: 'Zakat' },
  { value: 'sadqa', label: 'Sadqa' },
  { value: 'general', label: 'General' },
];

const emptyForm = {
  donor_id: '',
  amount: '',
  total_amount: '',
  currency: 'PKR',
  billing_interval: 'month',
  billing_interval_count: '1',
  start_date_mode: 'same_date',
  start_date: '',
  consent: true,
  donation_method: 'manual',
  project_id: '',
  campaign_id: '',
  donation_type: 'general',
  on_behalf_names: '',
  initial_donation_id: '',
  status: 'active',
  installment_status: 'pending',
};

const RecurringDonationForm = ({ mode = 'add' }) => {
  const isEdit = mode === 'edit';
  const navigate = useNavigate();
  const { id } = useParams();
  const { permissions, user } = useAuth();
  const canReconcile = useMemo(
    () => canReconcileRecurring(permissions),
    [permissions],
  );
  const installmentStatusOptions = useMemo(() => {
    if (canReconcile) return INSTALLMENT_STATUS_OPTIONS;
    return [{ value: 'pending', label: 'Pending' }];
  }, [canReconcile]);
  const [form, setForm] = useState({ ...emptyForm });
  const [selectedDonor, setSelectedDonor] = useState(null);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [pendingAttachments, setPendingAttachments] = useState([]);
  const attachmentsRef = useRef(null);
  const [isStripe, setIsStripe] = useState(false);

  const canAccess = useMemo(() => {
    if (!permissions && !user) return null;
    const role = String(user?.role || '').toLowerCase();
    if (
      isSuperAdmin(permissions) ||
      role === 'super_admin' ||
      permissions?.fund_raising_manager === true ||
      role === 'fund_raising_manager'
    ) {
      return true;
    }
    const action = isEdit ? 'update' : 'create';
    return hasPermission(permissions, 'fund_raising', 'recurring_donations', action);
  }, [permissions, user, isEdit]);

  const projectOptions = useMemo(
    () => [
      { value: '', label: '—' },
      ...(projectCards || []).map((p) => ({
        value: p.id,
        label: p.title || p.id,
      })),
    ],
    [],
  );

  useEffect(() => {
    if (!isEdit || !id) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get(`/recurring-donations/${id}`);
        const sub = res.data?.data?.subscription;
        const donor = res.data?.data?.donor;
        if (!res.data?.success || !sub) {
          throw new Error(res.data?.message || 'Failed to load');
        }
        if (cancelled) return;
        setIsStripe(!!sub.stripe_subscription_id);
        const prepaidCount = Number(
          sub.prepaid_periods || sub.prepaid_months || 0,
        );
        const installmentCount =
          Number.isFinite(prepaidCount) && prepaidCount >= 2
            ? prepaidCount
            : Number(sub.billing_interval_count) || 1;
        setForm({
          donor_id: sub.donor_id ? String(sub.donor_id) : '',
          amount: sub.amount != null ? String(sub.amount) : '',
          total_amount:
            sub.total_amount != null ? String(sub.total_amount) : '',
          currency: sub.currency || 'PKR',
          billing_interval: sub.billing_interval || 'month',
          billing_interval_count: String(installmentCount),
          start_date_mode: sub.start_date_mode || 'same_date',
          start_date: sub.start_date ? String(sub.start_date).slice(0, 10) : '',
          consent: sub.consent !== false,
          donation_method: sub.donation_method || 'manual',
          project_id: sub.project_id || '',
          campaign_id: sub.campaign_id != null ? String(sub.campaign_id) : '',
          donation_type: sub.donation_type || '',
          on_behalf_names: sub.on_behalf_names || '',
          initial_donation_id:
            sub.initial_donation_id != null
              ? String(sub.initial_donation_id)
              : '',
          status: sub.status || 'active',
        });
        if (donor) {
          setSelectedDonor({
            id: donor.id,
            name:
              donor.name ||
              [donor.first_name, donor.last_name].filter(Boolean).join(' ') ||
              donor.email,
            email: donor.email,
          });
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || err.message || 'Failed to load');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isEdit, id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (error) setError('');
  };

  const handleDonorSelect = (donor) => {
    setSelectedDonor(donor);
    setForm((prev) => ({
      ...prev,
      donor_id: donor?.id != null ? String(donor.id) : '',
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.donor_id) {
      setError('Please select a donor');
      return;
    }
    if (!form.amount || Number(form.amount) <= 0) {
      setError('Installment amount must be greater than 0');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const payload = isStripe && isEdit
        ? { status: form.status }
        : {
            donor_id: Number(form.donor_id),
            amount: Number(form.amount),
            total_amount: form.total_amount
              ? Number(form.total_amount)
              : null,
            currency: form.currency || 'PKR',
            billing_interval: form.billing_interval,
            billing_interval_count: Number(form.billing_interval_count) || 1,
            start_date_mode: form.start_date_mode || 'same_date',
            start_date: form.start_date || undefined,
            consent: !!form.consent,
            donation_method: form.donation_method || 'manual',
            project_id: form.project_id || undefined,
            campaign_id: form.campaign_id
              ? Number(form.campaign_id)
              : undefined,
            donation_type: form.donation_type || undefined,
            on_behalf_names: String(form.on_behalf_names || '').trim() || null,
            // Drive prepaid from Interval count (>1 = N paid installments)
            prepaid_periods:
              Number(form.billing_interval_count) >= 2
                ? Number(form.billing_interval_count)
                : undefined,
            initial_donation_id: form.initial_donation_id
              ? Number(form.initial_donation_id)
              : undefined,
            status: form.status || 'active',
            ...(isEdit
              ? {}
              : {
                  installment_status: canReconcile
                    ? form.installment_status || 'pending'
                    : 'pending',
                }),
          };

      const res = isEdit
        ? await axiosInstance.patch(`/recurring-donations/${id}`, payload)
        : await axiosInstance.post('/recurring-donations', payload);

      if (!res.data?.success) {
        throw new Error(res.data?.message || 'Save failed');
      }
      const savedId = isEdit ? id : res.data?.data?.id;
      const toUpload =
        attachmentsRef.current?.collectForSubmit?.() || pendingAttachments;
      if (savedId && toUpload.length > 0) {
        const { uploaded, failed } = await uploadPendingRecurringDonationAttachments({
          axiosInstance,
          recurringDonationId: savedId,
          items: toUpload,
        });
        if (uploaded > 0) {
          toast.success(
            uploaded === 1
              ? 'Attachment uploaded successfully.'
              : `${uploaded} attachments uploaded successfully.`,
          );
        }
        if (failed > 0) {
          toast.error(
            failed === 1
              ? 'Failed to upload 1 attachment.'
              : `Failed to upload ${failed} attachments.`,
          );
        }
      }
      navigate(
        savedId
          ? `/dms/recurring-donations/view/${savedId}`
          : '/dms/recurring-donations/list',
      );
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () =>
    navigate(
      isEdit
        ? `/dms/recurring-donations/view/${id}`
        : '/dms/recurring-donations/list',
    );

  if (canAccess === null || loading) {
    return (
      <>
        <Navbar />
        <div className="form-content">
          <PageHeader
            title={isEdit ? 'Update Recurring Donation' : 'Add Recurring Donation'}
            showBackButton
            onBackClick={handleBack}
          />
          <div className="loading">Loading...</div>
        </div>
      </>
    );
  }

  if (!canAccess) {
    return (
      <>
        <Navbar />
        <div className="form-content">
          <PageHeader
            title={isEdit ? 'Update Recurring Donation' : 'Add Recurring Donation'}
            showBackButton
            onBackClick={handleBack}
          />
          <div className="status-message status-message--error">
            You do not have permission to {isEdit ? 'update' : 'create'} recurring
            donations.
          </div>
        </div>
      </>
    );
  }

  const fieldsDisabled = isStripe && isEdit;
  const installmentCount = Math.max(
    1,
    Math.floor(Number(form.billing_interval_count) || 1),
  );
  const installmentAmount = Number(form.amount) || 0;
  const totalAmountEntered = Number(form.total_amount) || 0;
  const impliedTotal =
    installmentCount >= 2 && installmentAmount > 0
      ? installmentAmount * installmentCount
      : null;

  return (
    <>
      <Navbar />
      <div className="form-content">
        <PageHeader
          title={isEdit ? 'Update Recurring Donation' : 'Add Recurring Donation'}
          showBackButton
          onBackClick={handleBack}
        />

        {isStripe && (
          <div className="status-message">
            Stripe subscription — only status can be changed here
          </div>
        )}

        {error && (
          <div className="status-message status-message--error">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="form">
          <div className="form-section">
            <SearchableDropdown
              label="Donor"
              required
              apiEndpoint="/donors/lookup"
              apiParams={{ donor_type: 'individual', pageSize: 20 }}
              value={selectedDonor}
              displayKey="name"
              valueKey="id"
              onSelect={handleDonorSelect}
              onClear={() => {
                setSelectedDonor(null);
                setForm((prev) => ({ ...prev, donor_id: '' }));
              }}
              placeholder="Search donor by name, email, phone..."
              noResultsText="No donors found"
              disabled={fieldsDisabled}
              renderOption={(donor) => (
                <div>
                  <div>
                    {donor.name ||
                      [donor.first_name, donor.last_name].filter(Boolean).join(' ')}
                    {donor.recurring ? ' (recurring)' : ''}
                  </div>
                  <div style={{ fontSize: 12, color: '#666' }}>
                    {donor.email || donor.phone || `ID ${donor.id}`}
                  </div>
                </div>
              )}
            />
          </div>

          <div className="form-section">
            <div className="form-grid-2">
              <FormInput
                label="Installment Amount"
                name="amount"
                type="number"
                min="1"
                value={form.amount}
                onChange={handleChange}
                required
                disabled={fieldsDisabled}
              />
              <FormInput
                label="Total Amount"
                name="total_amount"
                type="number"
                min="1"
                value={form.total_amount}
                onChange={handleChange}
                disabled={fieldsDisabled}
                placeholder="Optional (prepaid lump sum)"
              />
              <FormInput
                label="Currency"
                name="currency"
                value={form.currency}
                onChange={handleChange}
                disabled={fieldsDisabled}
              />
              <FormSelect
                label="Billing interval"
                name="billing_interval"
                value={form.billing_interval}
                onChange={handleChange}
                options={INTERVAL_OPTIONS}
                disabled={fieldsDisabled}
              />
              <div>
                <FormInput
                  label="Installments count"
                  name="billing_interval_count"
                  type="number"
                  min="1"
                  value={form.billing_interval_count}
                  onChange={handleChange}
                  disabled={fieldsDisabled}
                />
                <small style={{ color: '#6b7280', display: 'block', marginTop: 4 }}>
                  Set &gt; 1 when donor paid multiple periods upfront (e.g. 12 =
                  one year). Creates paid installments and skips reminders for
                  that many periods.
                </small>
                {impliedTotal != null && (
                  <small
                    style={{
                      color: '#059669',
                      display: 'block',
                      marginTop: 4,
                      fontWeight: 600,
                    }}
                  >
                    {form.currency || 'PKR'}{' '}
                    {installmentAmount.toLocaleString('en-PK')} ×{' '}
                    {installmentCount}
                    {totalAmountEntered > 0
                      ? ` (total entered: ${form.currency || 'PKR'} ${totalAmountEntered.toLocaleString('en-PK')})`
                      : ` = ${form.currency || 'PKR'} ${impliedTotal.toLocaleString('en-PK')}`}
                  </small>
                )}
              </div>
              <FormInput
                label="First billing date"
                name="start_date"
                type="date"
                value={form.start_date}
                onChange={handleChange}
                disabled={fieldsDisabled}
              />
              <FormSelect
                label="Recurring Billing date"
                name="start_date_mode"
                value={form.start_date_mode}
                onChange={handleChange}
                options={START_MODE_OPTIONS}
                disabled={fieldsDisabled}
              />
              <FormSelect
                label="Payment method"
                name="donation_method"
                value={form.donation_method}
                onChange={handleChange}
                options={METHOD_OPTIONS}
                disabled={fieldsDisabled}
              />
              <FormSelect
                label="Donation type"
                name="donation_type"
                value={form.donation_type}
                onChange={handleChange}
                options={DONATION_TYPE_OPTIONS}
                disabled={fieldsDisabled}
              />
              <FormSelect
                label="Project"
                name="project_id"
                value={form.project_id}
                onChange={handleChange}
                options={projectOptions}
                disabled={fieldsDisabled}
              />
              <FormInput
                label="Campaign ID (optional)"
                name="campaign_id"
                type="number"
                value={form.campaign_id}
                onChange={handleChange}
                disabled={fieldsDisabled}
              />
              <FormInput
                label="Initial donation ID (optional)"
                name="initial_donation_id"
                type="number"
                value={form.initial_donation_id}
                onChange={handleChange}
                disabled={fieldsDisabled}
              />
            </div>
            <div style={{ marginTop: 16 }}>
              <FormInput
                label="On behalf name(s) (optional)"
                type="text"
                name="on_behalf_names"
                value={form.on_behalf_names}
                onChange={handleChange}
                placeholder="Enter name(s) this donation is on behalf of"
                disabled={fieldsDisabled}
              />
            </div>
            <div className="form-grid-2" style={{ marginTop: 16 }}>
              <FormSelect
                label="Status"
                name="status"
                value={form.status}
                onChange={handleChange}
                options={STATUS_OPTIONS}
              />
              {!isEdit && installmentCount < 2 && (
                <FormSelect
                  label="Installment status"
                  name="installment_status"
                  value={form.installment_status}
                  onChange={handleChange}
                  options={installmentStatusOptions}
                  disabled={!canReconcile}
                />
              )}
              {!isEdit && installmentCount >= 2 && (
                <div style={{ alignSelf: 'center', color: '#059669', fontSize: 13 }}>
                  {installmentCount} paid installments will be created automatically.
                </div>
              )}
            </div>
          </div>

          <div className="form-section">
            <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="checkbox"
                name="consent"
                checked={!!form.consent}
                onChange={handleChange}
                disabled={fieldsDisabled}
              />
              Donor consented to recurring donations
            </label>
          </div>

          <div className="form-section">
            <DonationPendingAttachments
              ref={attachmentsRef}
              items={pendingAttachments}
              onChange={setPendingAttachments}
              disabled={saving}
              title="Attachments"
              fileInputId="recurring-donation-form-attachment-file"
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : isEdit ? 'Save changes' : 'Create recurring donation'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/dms/recurring-donations/list')}
              disabled={saving}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default RecurringDonationForm;
