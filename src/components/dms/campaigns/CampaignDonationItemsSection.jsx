import React, { useCallback, useEffect, useState } from 'react';
import axiosInstance from '../../../utils/axios';
import FormInput from '../../common/FormInput';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

const emptyItemForm = {
  name: '',
  description: '',
  unit_price: '',
  currency: 'PKR',
  sort_order: 0,
  is_active: true
};

const newDraftKey = () => `draft-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

/**
 * Donation items on campaign add/edit.
 * - Draft mode (no campaignId): local list, parent sends `donation_items` on create.
 * - Persisted mode (campaignId): load/save via API.
 */
const CampaignDonationItemsSection = ({
  campaignId = null,
  draftItems = [],
  onDraftItemsChange = null,
  defaultCurrency = 'PKR',
  isRecurring = false
}) => {
  const isDraftMode = !campaignId && typeof onDraftItemsChange === 'function';

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(!isDraftMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ ...emptyItemForm, currency: defaultCurrency });
  const [editingKey, setEditingKey] = useState(null);

  const displayItems = isDraftMode ? draftItems : items;

  const fetchItems = useCallback(async () => {
    if (!campaignId) return;
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/campaigns/${campaignId}/donation-items`);
      if (response.data.success) {
        setItems(response.data.data || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load donation items');
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  useEffect(() => {
    if (campaignId) {
      fetchItems();
    }
  }, [campaignId, fetchItems]);

  useEffect(() => {
    setForm((prev) => ({ ...prev, currency: defaultCurrency }));
  }, [defaultCurrency]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const resetForm = () => {
    setEditingKey(null);
    setForm({ ...emptyItemForm, currency: defaultCurrency });
    setError('');
  };

  const startEdit = (item) => {
    const key = isDraftMode ? item._key : item.id;
    setEditingKey(key);
    setForm({
      name: item.name || '',
      description: item.description || '',
      unit_price: item.unit_price != null ? String(item.unit_price) : '',
      currency: item.currency || defaultCurrency,
      sort_order: item.sort_order ?? 0,
      is_active: item.is_active !== false
    });
  };

  const buildItemPayload = () => ({
    name: form.name.trim(),
    description: form.description?.trim() || null,
    unit_price: parseFloat(form.unit_price),
    currency: form.currency || defaultCurrency,
    sort_order: Number(form.sort_order) || 0,
    is_active: form.is_active
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || form.unit_price === '' || form.unit_price == null) {
      setError('Name and unit price are required');
      return;
    }

    const payload = buildItemPayload();
    if (Number.isNaN(payload.unit_price) || payload.unit_price < 0) {
      setError('Unit price must be a valid number');
      return;
    }

    if (isDraftMode) {
      if (editingKey) {
        onDraftItemsChange(
          draftItems.map((item) =>
            item._key === editingKey ? { ...item, ...payload } : item
          )
        );
      } else {
        onDraftItemsChange([
          ...draftItems,
          { _key: newDraftKey(), ...payload }
        ]);
      }
      resetForm();
      return;
    }

    setSaving(true);
    setError('');

    try {
      if (editingKey) {
        await axiosInstance.patch(
          `/campaigns/${campaignId}/donation-items/${editingKey}`,
          payload
        );
      } else {
        await axiosInstance.post(`/campaigns/${campaignId}/donation-items`, payload);
      }
      resetForm();
      await fetchItems();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save donation item');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (item) => {
    const itemKey = isDraftMode ? item._key : item.id;
    if (
      !window.confirm('Remove this donation item? Existing pledges referencing it cannot be deleted.')
    ) {
      return;
    }

    if (isDraftMode) {
      onDraftItemsChange(draftItems.filter((row) => row._key !== itemKey));
      if (editingKey === itemKey) resetForm();
      return;
    }

    try {
      await axiosInstance.delete(`/campaigns/${campaignId}/donation-items/${itemKey}`);
      if (editingKey === itemKey) resetForm();
      await fetchItems();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove item');
    }
  };

  return (
    <div className="form-section">
      <h3 style={{ marginBottom: '8px' }}>Donation items (per-unit pricing)</h3>
      <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#6b7280', lineHeight: 1.5 }}>
        {isRecurring
          ? 'Define priced items for website checkout and recurring donor pledges (e.g. 1 meal, 1 blanket). Donors pick quantities when donating or enrolling.'
          : 'Define priced items for one-time website checkout (e.g. 1 meal, 1 blanket). Donors pick quantities and pay the total at checkout.'}
        {isDraftMode && ' Items are saved when you create the campaign.'}
      </p>

      {error && (
        <div className="status-message status-message--error" style={{ marginBottom: '12px' }}>
          {error}
        </div>
      )}

      {loading ? (
        <p style={{ color: '#6b7280' }}>Loading items...</p>
      ) : (
        <>
          {displayItems.length > 0 && (
            <div style={{ marginBottom: '16px', overflowX: 'auto' }}>
              <table className="data-table" style={{ fontSize: '14px' }}>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Unit price</th>
                    <th>Active</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {displayItems.map((item) => {
                    const rowKey = isDraftMode ? item._key : item.id;
                    return (
                      <tr key={rowKey}>
                        <td>
                          <div style={{ fontWeight: 500 }}>{item.name}</div>
                          {item.description && (
                            <div style={{ fontSize: '12px', color: '#666' }}>{item.description}</div>
                          )}
                        </td>
                        <td>{item.currency} {Number(item.unit_price).toLocaleString()}</td>
                        <td>{item.is_active ? 'Yes' : 'No'}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button type="button" className="secondary_btn" onClick={() => startEdit(item)}>
                              Edit
                            </button>
                            <button type="button" className="secondary_btn" onClick={() => handleRemove(item)}>
                              <FiTrash2 />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div style={{ background: '#f9fafb', padding: '16px', borderRadius: '8px' }}>
            <h4 style={{ margin: '0 0 12px', fontSize: '14px' }}>
              {editingKey ? 'Edit item' : 'Add item'}
            </h4>
            <div className="form-grid-2" style={{ marginBottom: '12px' }}>
              <FormInput
                label="Item name"
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                maxLength={200}
              />
              <FormInput
                label="Unit price"
                type="number"
                name="unit_price"
                value={form.unit_price}
                onChange={handleChange}
                min={0}
                step="0.01"
              />
            </div>
            <div className="form-grid-2" style={{ marginBottom: '12px' }}>
              <FormInput
                label="Currency"
                type="text"
                name="currency"
                value={form.currency}
                onChange={handleChange}
                maxLength={10}
              />
              <FormInput
                label="Sort order"
                type="number"
                name="sort_order"
                value={form.sort_order}
                onChange={handleChange}
              />
            </div>
            <FormInput
              label="Description"
              type="text"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Optional"
            />
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', cursor: 'pointer' }}>
              <input type="checkbox" name="is_active" checked={form.is_active} onChange={handleChange} />
              Active (available on checkout{isRecurring ? ' and new pledges' : ''})
            </label>
            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <button type="button" className="primary_btn" disabled={saving} onClick={handleSubmit}>
                <FiPlus style={{ marginRight: '6px' }} />
                {saving ? 'Saving...' : editingKey ? 'Update item' : 'Add item'}
              </button>
              {editingKey && (
                <button type="button" className="secondary_btn" onClick={resetForm}>
                  Cancel
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CampaignDonationItemsSection;
