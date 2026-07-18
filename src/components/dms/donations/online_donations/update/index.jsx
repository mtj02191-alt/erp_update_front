import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import axiosInstance from '../../../../../utils/axios';
import '../../../../../styles/variables.css';
import '../../../../../styles/components.css';
import Navbar from '../../../../Navbar';
import PageHeader from '../../../../common/PageHeader';
import FormInput from '../../../../common/FormInput';
import FormSelect from '../../../../common/FormSelect';
import './index.css';

const donationTypeOptions = [
  { value: 'zakat', label: 'Zakat' },
  { value: 'sadqa', label: 'Sadqa' },
  { value: 'general', label: 'General' },
  { value: 'fidya', label: 'Fidya' },
  { value: 'kaffarah', label: 'Kaffarah' },
  { value: 'qurbani-baraye-mustehqeen', label: 'Qurbani Baraye Mustehqeen' },
];

const donationMethodOptions = [
  { value: 'cash', label: 'Cash' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'online', label: 'Online' },
  { value: 'meezan', label: 'Meezan Bank' },
  { value: 'blinq', label: 'Blinq' },
  { value: 'payfast', label: 'Payfast' },
  { value: 'stripe', label: 'Stripe' },
  { value: 'stripe_embed', label: 'Stripe (embed)' },
  { value: 'in_kind', label: 'In Kind' },
];

const donationSourceOptions = [
  { value: 'website', label: 'Website' },
  { value: 'mobile_app', label: 'Mobile App' },
  { value: 'collection_center', label: 'Collection Center' },
  { value: 'home_collection', label: 'Home Collection' },
  { value: 'email_campaign', label: 'Email Campaign' },
  { value: 'event', label: 'Event' },
  { value: 'referral', label: 'Referral' },
  { value: 'collection_box', label: 'Collection Box' },
  { value: 'bank', label: 'Bank' },
];

const statusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'registered', label: 'Registered' },
];

const currencyOptions = [
  { value: 'PKR', label: 'PKR' },
  { value: 'USD', label: 'USD' },
  { value: 'EUR', label: 'EUR' },
  { value: 'GBP', label: 'GBP' },
  { value: 'AED', label: 'AED' },
  { value: 'SAR', label: 'SAR' },
];

const bankOptions = [
  { value: 'habib_bank', label: 'Habib Bank Limited (HBL)' },
  { value: 'mcb', label: 'Muslim Commercial Bank (MCB)' },
  { value: 'ubl', label: 'United Bank Limited (UBL)' },
  { value: 'allied_bank', label: 'Allied Bank Limited (ABL)' },
  { value: 'meezan_bank', label: 'Meezan Bank' },
  { value: 'national_bank', label: 'National Bank of Pakistan (NBP)' },
  { value: 'standard_chartered', label: 'Standard Chartered Bank' },
  { value: 'bank_alfalah', label: 'Bank Alfalah' },
  { value: 'faysal_bank', label: 'Faysal Bank' },
  { value: 'askari_bank', label: 'Askari Bank' },
  { value: 'js_bank', label: 'JS Bank' },
  { value: 'soneri_bank', label: 'Soneri Bank' },
  { value: 'silk_bank', label: 'Silk Bank' },
  { value: 'other', label: 'Other Bank' },
];

function formatDateYmd(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

const UpdateOnlineDonation = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const listBackPath = location.state?.fromList || '/donations/online_donations/list';

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    amount: '',
    paid_amount: '',
    currency: 'PKR',
    date: '',
    donation_type: 'general',
    donation_method: '',
    donation_source: '',
    status: 'pending',
    country: '',
    city: '',
    project_id: '',
    project_name: '',
    campaign_id: '',
    sub_program_id: '',
    event_id: '',
    ref: '',
    cheque_number: '',
    bank_name: '',
    bank: '',
    transaction_id: '',
  });

  useEffect(() => {
    const fetchDonation = async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get(`/donations/${id}`);
        if (!res.data?.success) {
          setError(res.data?.message || 'Failed to load donation');
          return;
        }
        const d = res.data.data;
        setForm({
          amount: d.amount != null ? String(d.amount) : '',
          paid_amount: d.paid_amount != null ? String(d.paid_amount) : '',
          currency: d.currency || 'PKR',
          date: formatDateYmd(d.date || d.created_at),
          donation_type: d.donation_type || 'general',
          donation_method: d.donation_method || '',
          donation_source: d.donation_source || '',
          status: d.status || 'pending',
          country: d.country || '',
          city: d.city || '',
          project_id: d.project_id ?? '',
          project_name: d.project_name ?? '',
          campaign_id: d.campaign_id != null ? String(d.campaign_id) : '',
          sub_program_id: d.sub_program_id != null ? String(d.sub_program_id) : '',
          event_id: d.event_id != null ? String(d.event_id) : '',
          ref: d.ref ?? '',
          cheque_number: d.cheque_number ?? '',
          bank_name: d.bank_name ?? '',
          bank: d.bank ?? '',
          transaction_id: d.transaction_id ?? '',
        });
      } catch (e) {
        setError(e.response?.data?.message || 'Failed to load donation');
      } finally {
        setLoading(false);
      }
    };
    fetchDonation();
  }, [id]);

  const isInKind = form.donation_method === 'in_kind';
  const isCheque = form.donation_method === 'cheque';

  const methodOptions = useMemo(() => {
    const current = form.donation_method;
    if (!current) return donationMethodOptions;
    const exists = donationMethodOptions.some((o) => o.value === current);
    if (exists) return donationMethodOptions;
    return [{ value: current, label: current }, ...donationMethodOptions];
  }, [form.donation_method]);

  const sourceOptions = useMemo(() => {
    const current = form.donation_source;
    if (!current) return donationSourceOptions;
    const exists = donationSourceOptions.some((o) => o.value === current);
    if (exists) return donationSourceOptions;
    return [{ value: current, label: current }, ...donationSourceOptions];
  }, [form.donation_source]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      const payload = {
        amount: form.amount !== '' ? parseFloat(form.amount) : undefined,
        paid_amount: form.paid_amount !== '' ? parseFloat(form.paid_amount) : undefined,
        currency: form.currency || undefined,
        date: form.date || undefined,
        donation_type: form.donation_type || undefined,
        donation_method: form.donation_method || undefined,
        donation_source: form.donation_source || undefined,
        status: form.status || undefined,
        country: form.country || undefined,
        city: form.city || undefined,
        project_id: form.project_id || undefined,
        project_name: form.project_name || undefined,
        ref: form.ref || undefined,
        cheque_number: form.cheque_number || undefined,
        bank_name: form.bank_name || undefined,
        bank: form.bank || undefined,
        transaction_id: form.transaction_id || undefined,
      };

      if (form.campaign_id.trim() === '') payload.campaign_id = null;
      else if (form.campaign_id !== '') payload.campaign_id = parseInt(form.campaign_id, 10);

      if (form.sub_program_id.trim() === '') payload.sub_program_id = null;
      else if (form.sub_program_id !== '') payload.sub_program_id = parseInt(form.sub_program_id, 10);

      if (form.event_id.trim() === '') payload.event_id = null;
      else if (form.event_id !== '') payload.event_id = parseInt(form.event_id, 10);

      Object.keys(payload).forEach((k) => {
        if (payload[k] === undefined) delete payload[k];
      });

      await axiosInstance.patch(`/donations/${id}`, payload);
      navigate(`/donations/online_donations/view/${id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update donation');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="update-donation-wrapper">
          <div className="status-message">Loading donation...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="form-content update-donation-wrapper">
        <PageHeader title="Update Donation" showBackButton={true} backPath={listBackPath} />
        {isInKind && (
          <div className="status-message" style={{ marginBottom: '1rem' }}>
            In-kind line items are not editable here; you can still update amounts, status, and other core fields.
          </div>
        )}
        <form onSubmit={handleSubmit} className="form">
          {error && <div className="status-message status-message--error">{error}</div>}

          <div className="form-section">
            <h3 style={{ marginBottom: '15px', color: '#333' }}>Donation details</h3>
            <div className="form-grid-2">
              <FormInput
                label="Amount"
                type="number"
                name="amount"
                value={form.amount}
                onChange={handleChange}
                step="0.01"
                min="0"
              />
              <FormInput
                label="Paid amount"
                type="number"
                name="paid_amount"
                value={form.paid_amount}
                onChange={handleChange}
                step="0.01"
                min="0"
              />
              <FormSelect
                label="Currency"
                name="currency"
                value={form.currency}
                onChange={handleChange}
                options={currencyOptions}
              />
              <FormInput
                label="Donation date"
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
              />
              <FormSelect
                label="Donation type"
                name="donation_type"
                value={form.donation_type}
                onChange={handleChange}
                options={donationTypeOptions}
              />
              <FormSelect
                label="Payment method"
                name="donation_method"
                value={form.donation_method}
                onChange={handleChange}
                options={methodOptions}
                disabled={isInKind}
              />
              <FormSelect
                label="Source"
                name="donation_source"
                value={form.donation_source}
                onChange={handleChange}
                options={sourceOptions}
                showDefaultOption={true}
                defaultOptionText="Select source"
              />
              <FormSelect
                label="Status"
                name="status"
                value={form.status}
                onChange={handleChange}
                options={statusOptions}
              />
            </div>
          </div>

          {isCheque && (
            <div className="form-section">
              <h3 style={{ marginBottom: '15px', color: '#333' }}>Cheque</h3>
              <div className="form-grid-2">
                <FormInput
                  label="Cheque number"
                  name="cheque_number"
                  value={form.cheque_number}
                  onChange={handleChange}
                />
                <FormSelect
                  label="Bank name"
                  name="bank_name"
                  value={form.bank_name}
                  onChange={handleChange}
                  options={bankOptions}
                  showDefaultOption={true}
                  defaultOptionText="Select bank"
                />
              </div>
            </div>
          )}

          <div className="form-section">
            <h3 style={{ marginBottom: '15px', color: '#333' }}>Location &amp; project</h3>
            <div className="form-grid-2">
              <FormInput label="Country" name="country" value={form.country} onChange={handleChange} />
              <FormInput label="City" name="city" value={form.city} onChange={handleChange} />
              <FormInput label="Project ID" name="project_id" value={form.project_id} onChange={handleChange} />
              <FormInput label="Project name" name="project_name" value={form.project_name} onChange={handleChange} />
              <FormInput
                label="Campaign ID"
                type="number"
                name="campaign_id"
                value={form.campaign_id}
                onChange={handleChange}
                placeholder="Optional"
              />
              <FormInput
                label="Sub-program ID"
                type="number"
                name="sub_program_id"
                value={form.sub_program_id}
                onChange={handleChange}
                placeholder="Optional"
              />
              <FormInput
                label="Event ID"
                type="number"
                name="event_id"
                value={form.event_id}
                onChange={handleChange}
                placeholder="Optional"
              />
              <FormInput label="Ref" name="ref" value={form.ref} onChange={handleChange} />
            </div>
          </div>

          <div className="form-section">
            <h3 style={{ marginBottom: '15px', color: '#333' }}>Bank / reference</h3>
            <div className="form-grid-2">
              <FormInput label="Bank" name="bank" value={form.bank} onChange={handleChange} />
              <FormInput
                label="Transaction ID"
                name="transaction_id"
                value={form.transaction_id}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-actions" style={{ marginTop: '1rem' }}>
            <button type="submit" className="primary_btn" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default UpdateOnlineDonation;
