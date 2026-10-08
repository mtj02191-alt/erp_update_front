import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import FormInput from '../../../common/FormInput';
import FormSelect from '../../../common/FormSelect';
import FormTextarea from '../../../common/FormTextarea';
import { useAuth } from '../../../../context/AuthContext';
import { hasPermission } from '../../../../utils/permissions';

const DONATION_TYPE_OPTIONS = [
  { value: 'general', label: 'General' },
  { value: 'zakat', label: 'Zakat' },
];

const emptyForm = {
  donor_name: '',
  contact_number: '',
  care_of_representative: '',
  donation_type: 'general',
  donation_amount: '',
  address: '',
};

const EventPledgeForm = ({ mode = 'add' }) => {
  const isEdit = mode === 'edit';
  const navigate = useNavigate();
  const { id } = useParams();
  const { permissions } = useAuth();
  const [form, setForm] = useState({ ...emptyForm });
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const canAccess = useMemo(() => {
    if (!permissions) return null;
    if (permissions.super_admin === true || permissions.fund_raising_manager === true) {
      return true;
    }
    const action = isEdit ? 'update' : 'create';
    return hasPermission(permissions, 'fund_raising', 'event_pledges', action);
  }, [permissions, isEdit]);

  useEffect(() => {
    if (!isEdit || !id) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get(`/dms/event-pledges/${id}`);
        if (!res.data?.success || !res.data?.data) {
          throw new Error(res.data?.message || 'Failed to load event pledge');
        }
        if (cancelled) return;
        const row = res.data.data;
        setForm({
          donor_name: row.donor_name || '',
          contact_number: row.contact_number || '',
          care_of_representative: row.care_of_representative || '',
          donation_type: row.donation_type || 'general',
          donation_amount:
            row.donation_amount != null ? String(row.donation_amount) : '',
          address: row.address || '',
        });
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
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleBack = () => {
    navigate(
      isEdit ? `/dms/event-pledges/view/${id}` : '/dms/event-pledges/list',
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.donor_name.trim()) {
      setError('Donor name is required');
      return;
    }
    if (!form.donation_amount || Number(form.donation_amount) <= 0) {
      setError('Donation amount must be greater than 0');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const payload = {
        donor_name: form.donor_name.trim(),
        contact_number: form.contact_number.trim() || undefined,
        care_of_representative: form.care_of_representative.trim() || undefined,
        donation_type: form.donation_type,
        donation_amount: Number(form.donation_amount),
        address: form.address.trim() || undefined,
      };

      const res = isEdit
        ? await axiosInstance.patch(`/dms/event-pledges/${id}`, payload)
        : await axiosInstance.post('/dms/event-pledges', payload);

      if (!res.data?.success) {
        throw new Error(res.data?.message || 'Save failed');
      }
      const savedId = isEdit ? id : res.data?.data?.id;
      navigate(
        savedId
          ? `/dms/event-pledges/view/${savedId}`
          : '/dms/event-pledges/list',
      );
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (canAccess === null || loading) {
    return (
      <>
        <Navbar />
        <div className="form-content">
          <PageHeader
            title={isEdit ? 'Update Event Pledge' : 'Add Event Pledge'}
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
            title={isEdit ? 'Update Event Pledge' : 'Add Event Pledge'}
            showBackButton
            onBackClick={handleBack}
          />
          <div className="status-message status-message--error">
            You do not have permission to {isEdit ? 'update' : 'create'} event
            pledges.
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="form-content">
        <PageHeader
          title={isEdit ? 'Update Event Pledge' : 'Add Event Pledge'}
          showBackButton
          onBackClick={handleBack}
        />

        {error && (
          <div className="status-message status-message--error">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="form">
          <div className="form-section">
            <div className="form-grid-2">
              <FormInput
                label="Donor Name"
                name="donor_name"
                value={form.donor_name}
                onChange={handleChange}
                required
                placeholder="Enter donor name"
              />
              <FormInput
                label="Contact Number"
                name="contact_number"
                value={form.contact_number}
                onChange={handleChange}
                placeholder="Enter contact number"
              />
              <FormInput
                label="Care of / Representative"
                name="care_of_representative"
                value={form.care_of_representative}
                onChange={handleChange}
                placeholder="Enter care of / representative"
              />
              <FormSelect
                label="Donation Type"
                name="donation_type"
                value={form.donation_type}
                onChange={handleChange}
                options={DONATION_TYPE_OPTIONS}
                required
              />
              <FormInput
                label="Donation Amount"
                name="donation_amount"
                type="number"
                min="0.01"
                step="0.01"
                value={form.donation_amount}
                onChange={handleChange}
                required
                placeholder="0.00"
              />
            </div>
            <FormTextarea
              label="Address"
              name="address"
              value={form.address}
              onChange={handleChange}
              rows={3}
              placeholder="Enter address"
            />
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="secondary_btn"
              onClick={handleBack}
              disabled={saving}
            >
              Cancel
            </button>
            <button type="submit" className="primary_btn" disabled={saving}>
              {saving ? 'Saving...' : isEdit ? 'Save changes' : 'Create pledge'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default EventPledgeForm;
