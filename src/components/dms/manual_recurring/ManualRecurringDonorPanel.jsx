import React, { useEffect, useMemo, useState } from 'react';
import axiosInstance from '../../../utils/axios';
import FormInput from '../../common/FormInput';
import FormSelect from '../../common/FormSelect';
import {
  PLEDGE_STATUS_OPTIONS,
  PLEDGE_MODE_OPTIONS,
  formatAmount,
  formatPledgeStatus,
  formatPledgeMode,
  formatPledgeItems,
  computeLineTotal,
} from './manualRecurringConstants';
import { FiRepeat, FiSave } from 'react-icons/fi';

const emptyForm = {
  campaign_id: '',
  pledge_mode: 'recurring_monthly',
  prepaid_months: '3',
  currency: 'PKR',
  status: 'active',
  remind_via_email: true,
  remind_via_whatsapp: true,
  notes: ''
};

const ManualRecurringDonorPanel = ({ donorId, onUpdated }) => {
  const [pledges, setPledges] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [campaignItems, setCampaignItems] = useState([]);
  const [lineQuantities, setLineQuantities] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadingItems, setLoadingItems] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  const activePledges = pledges.filter((p) => p.status === 'active');
  const enrolledCampaignIds = new Set(activePledges.map((p) => String(p.campaign_id)));

  useEffect(() => {
    if (donorId) {
      fetchPledges();
      fetchRecurringCampaigns();
    }
  }, [donorId]);

  useEffect(() => {
    if (form.campaign_id) {
      fetchCampaignItems(form.campaign_id);
    } else {
      setCampaignItems([]);
      setLineQuantities({});
    }
  }, [form.campaign_id]);

  const fetchPledges = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/manual-recurring-pledges/donor/${donorId}`);
      if (response.data.success) {
        setPledges(response.data.data || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load recurring campaign enrollments');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecurringCampaigns = async () => {
    try {
      const response = await axiosInstance.get('/campaigns', {
        params: { is_recurring: true, status: 'active' }
      });
      if (response.data.success) {
        setCampaigns(response.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load recurring campaigns', err);
    }
  };

  const fetchCampaignItems = async (campaignId) => {
    try {
      setLoadingItems(true);
      const response = await axiosInstance.get(`/campaigns/${campaignId}/donation-items`, {
        params: { active_only: 'true' }
      });
      if (response.data.success) {
        const items = response.data.data || [];
        setCampaignItems(items);
        if (!editingId) {
          const initial = {};
          items.forEach((item) => {
            initial[item.id] = '';
          });
          setLineQuantities(initial);
        }
      }
    } catch (err) {
      setCampaignItems([]);
      setError(err.response?.data?.message || 'Failed to load campaign items');
    } finally {
      setLoadingItems(false);
    }
  };

  const campaignOptions = campaigns
    .filter((c) => editingId || !enrolledCampaignIds.has(String(c.id)))
    .map((c) => ({
      value: String(c.id),
      label: c.monthly_donor_automation_enabled
        ? `${c.title} (automation on)`
        : `${c.title} (automation off)`
    }));

  const selectedLines = useMemo(() => {
    return campaignItems
      .filter((item) => Number(lineQuantities[item.id]) > 0)
      .map((item) => ({
        campaign_item_id: item.id,
        quantity: Number(lineQuantities[item.id]),
        campaign_item: item
      }));
  }, [campaignItems, lineQuantities]);

  const periodTotal = useMemo(() => computeLineTotal(selectedLines), [selectedLines]);

  const totalPledged = useMemo(() => {
    if (form.pledge_mode === 'prepaid_months') {
      const months = Number(form.prepaid_months) || 0;
      return periodTotal * months;
    }
    return periodTotal;
  }, [form.pledge_mode, form.prepaid_months, periodTotal]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleQuantityChange = (itemId, value) => {
    setLineQuantities((prev) => ({
      ...prev,
      [itemId]: value
    }));
  };

  const startEdit = (pledge) => {
    setEditingId(pledge.id);
    setForm({
      campaign_id: String(pledge.campaign_id),
      pledge_mode: pledge.pledge_mode || 'recurring_monthly',
      prepaid_months: pledge.prepaid_months != null ? String(pledge.prepaid_months) : '3',
      currency: pledge.currency || 'PKR',
      status: pledge.status || 'active',
      remind_via_email: pledge.remind_via_email !== false,
      remind_via_whatsapp: pledge.remind_via_whatsapp !== false,
      notes: pledge.notes || ''
    });
    const qtyMap = {};
    (pledge.lines || []).forEach((line) => {
      qtyMap[line.campaign_item_id] = String(line.quantity);
    });
    setLineQuantities(qtyMap);
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setLineQuantities({});
    setCampaignItems([]);
    setError('');
  };

  const buildLinesPayload = () => {
    return selectedLines.map((line) => ({
      campaign_item_id: line.campaign_item_id,
      quantity: line.quantity
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!editingId && !form.campaign_id) {
      setError('Please select a recurring campaign');
      return;
    }

    const lines = buildLinesPayload();
    if (!lines.length) {
      setError('Select at least one item with quantity');
      return;
    }

    if (form.pledge_mode === 'prepaid_months') {
      const months = Number(form.prepaid_months);
      if (!months || months < 1) {
        setError('Prepaid months must be at least 1');
        return;
      }
    }

    setSaving(true);
    setError('');

    const payload = {
      donor_id: Number(donorId),
      campaign_id: Number(form.campaign_id),
      pledge_mode: form.pledge_mode,
      prepaid_months:
        form.pledge_mode === 'prepaid_months' ? Number(form.prepaid_months) : null,
      currency: form.currency || 'PKR',
      status: form.status,
      remind_via_email: form.remind_via_email,
      remind_via_whatsapp: form.remind_via_whatsapp,
      notes: form.notes || null,
      lines
    };

    try {
      if (editingId) {
        const { campaign_id, donor_id, ...updatePayload } = payload;
        await axiosInstance.patch(`/manual-recurring-pledges/${editingId}`, updatePayload);
      } else {
        await axiosInstance.post('/manual-recurring-pledges', payload);
      }
      resetForm();
      await fetchPledges();
      onUpdated?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save enrollment');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <section className="donor-crm-card">
        <p style={{ margin: 0, color: '#6b7280' }}>Loading recurring campaign enrollments...</p>
      </section>
    );
  }

  return (
    <section className="donor-crm-card">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <FiRepeat />
        <h3 style={{ margin: 0, fontSize: '16px' }}>Recurring campaigns</h3>
      </div>
      <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#6b7280', lineHeight: 1.5 }}>
        Enroll on a recurring campaign with per-item pledges. Monthly: reminder if not donated, thanks if donated.
        Prepaid: no reminders during covered months; thanks when payment is recorded.
      </p>

      {activePledges.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
          {activePledges.map((pledge) => (
            <div
              key={pledge.id}
              style={{
                padding: '12px',
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            >
              <div><strong>Campaign:</strong> {pledge.campaign?.title || pledge.campaign_id}</div>
              <div><strong>Mode:</strong> {formatPledgeMode(pledge.pledge_mode)}</div>
              <div><strong>Items:</strong> {formatPledgeItems(pledge.lines)}</div>
              <div><strong>Total pledge:</strong> {formatAmount(pledge.pledged_amount, pledge.currency)}</div>
              {pledge.pledge_mode === 'prepaid_months' && (
                <div>
                  <strong>Prepaid coverage:</strong>{' '}
                  {pledge.prepaid_start_period_key || '—'} to {pledge.prepaid_end_period_key || '—'}
                  {pledge.prepaid_months ? ` (${pledge.prepaid_months} months)` : ''}
                </div>
              )}
              <div>
                <strong>Channels:</strong>{' '}
                {[pledge.remind_via_email && 'Email', pledge.remind_via_whatsapp && 'WhatsApp']
                  .filter(Boolean)
                  .join(', ') || 'None'}
              </div>
              <div>
                <strong>Last reminder / thanks:</strong>{' '}
                {pledge.last_reminder_period_key || '—'} / {pledge.last_thanks_period_key || '—'}
              </div>
              <button
                type="button"
                className="secondary_btn"
                style={{ marginTop: '10px' }}
                onClick={() => startEdit(pledge)}
              >
                Edit enrollment
              </button>
            </div>
          ))}
        </div>
      )}

      {(editingId || campaignOptions.length > 0) && (
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="status-message status-message--error" style={{ marginBottom: '12px' }}>
              {error}
            </div>
          )}

          {!editingId && (
            <div style={{ marginBottom: '12px' }}>
              <FormSelect
                label="Recurring campaign"
                name="campaign_id"
                value={form.campaign_id}
                onChange={handleChange}
                options={campaignOptions}
                placeholder="Select campaign..."
                required
              />
            </div>
          )}

          <div className="form-grid-2" style={{ marginBottom: '12px' }}>
            <FormSelect
              label="Pledge mode"
              name="pledge_mode"
              value={form.pledge_mode}
              onChange={handleChange}
              options={PLEDGE_MODE_OPTIONS}
            />
            {form.pledge_mode === 'prepaid_months' && (
              <FormInput
                label="Prepaid months"
                type="number"
                name="prepaid_months"
                value={form.prepaid_months}
                onChange={handleChange}
                min={1}
                required
              />
            )}
          </div>

          {form.campaign_id && (
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ margin: '0 0 10px', fontSize: '14px' }}>Items per month</h4>
              {loadingItems ? (
                <p style={{ color: '#6b7280', fontSize: '13px' }}>Loading campaign items...</p>
              ) : campaignItems.length === 0 ? (
                <p style={{ color: '#b45309', fontSize: '13px' }}>
                  No donation items on this campaign. Add items on the campaign edit page first.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {campaignItems.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 100px',
                        gap: '12px',
                        alignItems: 'end',
                        padding: '10px',
                        background: '#f9fafb',
                        borderRadius: '6px'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 500 }}>{item.name}</div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          {item.currency} {Number(item.unit_price).toLocaleString()} each
                        </div>
                      </div>
                      <FormInput
                        label="Qty"
                        type="number"
                        name={`qty_${item.id}`}
                        value={lineQuantities[item.id] ?? ''}
                        onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                        min={0}
                        placeholder="0"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {selectedLines.length > 0 && (
            <div
              style={{
                padding: '12px',
                background: '#eff6ff',
                borderRadius: '8px',
                marginBottom: '16px',
                fontSize: '14px'
              }}
            >
              <div><strong>Per month:</strong> {formatAmount(periodTotal, form.currency)}</div>
              {form.pledge_mode === 'prepaid_months' && (
                <div>
                  <strong>Total prepaid:</strong> {formatAmount(totalPledged, form.currency)}
                  {' '}({form.prepaid_months} months)
                </div>
              )}
            </div>
          )}

          <div style={{ marginBottom: '12px' }}>
            <FormSelect
              label="Status"
              name="status"
              value={form.status}
              onChange={handleChange}
              options={PLEDGE_STATUS_OPTIONS}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                name="remind_via_email"
                checked={form.remind_via_email}
                onChange={handleChange}
              />
              Allow email (thanks / reminder from campaign templates)
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                name="remind_via_whatsapp"
                checked={form.remind_via_whatsapp}
                onChange={handleChange}
              />
              Allow WhatsApp (thanks / reminder from campaign templates)
            </label>
          </div>

          <FormInput
            label="Notes"
            type="text"
            name="notes"
            value={form.notes}
            onChange={handleChange}
            placeholder="Optional staff notes"
          />

          <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
            <button type="submit" className="primary_btn" disabled={saving || loadingItems}>
              <FiSave style={{ marginRight: '6px' }} />
              {saving ? 'Saving...' : editingId ? 'Update enrollment' : 'Enroll on campaign'}
            </button>
            {editingId && (
              <button type="button" className="secondary_btn" onClick={resetForm}>
                Cancel
              </button>
            )}
          </div>
        </form>
      )}

      {pledges.filter((p) => p.status !== 'active').length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h4 style={{ marginBottom: '8px', fontSize: '14px' }}>Past enrollments</h4>
          <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', color: '#4b5563' }}>
            {pledges.filter((p) => p.status !== 'active').map((p) => (
              <li key={p.id}>
                {p.campaign?.title || p.campaign_id} — {formatPledgeStatus(p.status)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
};

export default ManualRecurringDonorPanel;
