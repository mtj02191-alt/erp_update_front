import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import FormInput from '../../../common/FormInput';
import FormTextarea from '../../../common/FormTextarea';
import { PrimaryButton, SecondaryButton } from '../../../common/buttons';
import axiosInstance from '../../../../utils/axios';
import { useAuth } from '../../../../context/AuthContext';
import { hasPermission, isSuperAdmin } from '../../../../utils/permissions';
import {
  ORGANIZATION_OPTIONS,
  COMPLAINANT_TYPE_OPTIONS,
  DEPARTMENT_OPTIONS,
  CATEGORY_OPTIONS,
  PRIORITY_OPTIONS,
  ASLAB_BRANCH_OPTIONS,
  labelFor,
  priorityForCategory,
} from '../shared/ceoComplaintConfig';

const CeoComplaintAdd = () => {
  const navigate = useNavigate();
  const { permissions } = useAuth();
  const canCreate = useMemo(
    () =>
      isSuperAdmin(permissions) ||
      hasPermission(permissions, 'ceo_office', 'ceo_complaints', 'create'),
    [permissions],
  );

  const [form, setForm] = useState({
    organization: '',
    branch: '',
    complainant_type: '',
    complainant_name: '',
    contact_number: '',
    department: '',
    category: '',
    details: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      if (name === 'organization' && value !== 'aslab') next.branch = '';
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canCreate) {
      toast.error('You do not have permission to create complaints');
      return;
    }
    if (!form.organization) {
      toast.error('Organization is required');
      return;
    }
    if (form.organization === 'aslab' && !form.branch) {
      toast.error('Branch is required for Aslab');
      return;
    }
    if (!form.complainant_type) {
      toast.error('Complainant type is required');
      return;
    }
    if (!form.complainant_name.trim()) {
      toast.error('Name is required');
      return;
    }
    if (!form.contact_number.trim()) {
      toast.error('Contact number is required');
      return;
    }
    if (!form.department) {
      toast.error('Department is required');
      return;
    }
    if (!form.category) {
      toast.error('Complaint type is required');
      return;
    }
    if (!form.details.trim() || form.details.trim().length < 5) {
      toast.error('Please enter complaint details');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        organization: form.organization,
        ...(form.organization === 'aslab' ? { branch: form.branch } : {}),
        complainant_type: form.complainant_type,
        complainant_name: form.complainant_name.trim(),
        contact_number: form.contact_number.trim(),
        department: form.department,
        category: form.category,
        details: form.details.trim(),
      };
      const res = await axiosInstance.post('/ceo-complaints', payload);
      if (res.data?.success) {
        toast.success(
          `Complaint ${res.data.data?.complaint_number || ''} created`,
        );
        navigate(
          res.data.data?.id
            ? `/ceo-office/ceo-complaints/view/${res.data.data.id}`
            : '/ceo-office/ceo-complaints/list',
        );
      } else {
        toast.error(res.data?.message || 'Failed to create complaint');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create complaint');
    } finally {
      setSubmitting(false);
    }
  };

  if (!canCreate) {
    return (
      <>
        <Navbar />
        <div className="list-wrapper">
          <PageHeader
            title="Add CEO Complaint"
            showBackButton
            backPath="/ceo-office/ceo-complaints/list"
          />
          <div className="status-message status-message--error">
            You do not have permission to create CEO complaints.
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="list-wrapper">
        <PageHeader
          title="Add CEO Complaint"
          subtitle="Staff intake for the CEO complaint portal"
          showBackButton
          backPath="/ceo-office/ceo-complaints/list"
        />
        <form onSubmit={handleSubmit} className="form-container" style={{ maxWidth: 720 }}>
          <div className="form-group">
            <label>Organization *</label>
            <select
              name="organization"
              value={form.organization}
              onChange={handleChange}
              className="form-select"
              required
            >
              <option value="">Select organization</option>
              {ORGANIZATION_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {form.organization === 'aslab' && (
            <div className="form-group">
              <label>Branch *</label>
              <select
                name="branch"
                value={form.branch}
                onChange={handleChange}
                className="form-select"
                required
              >
                <option value="">Select branch</option>
                {ASLAB_BRANCH_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group">
            <label>Complainant type *</label>
            <select
              name="complainant_type"
              value={form.complainant_type}
              onChange={handleChange}
              className="form-select"
              required
            >
              <option value="">Select type</option>
              {COMPLAINANT_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <FormInput
            label="Name"
            name="complainant_name"
            value={form.complainant_name}
            onChange={handleChange}
            placeholder="Complainant name"
            required
          />
          <FormInput
            label="Contact number"
            name="contact_number"
            value={form.contact_number}
            onChange={handleChange}
            placeholder="Phone number"
            required
          />

          <div className="form-group">
            <label>Department *</label>
            <select
              name="department"
              value={form.department}
              onChange={handleChange}
              className="form-select"
              required
            >
              <option value="">Select department</option>
              {DEPARTMENT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Complaint type (کمپلینٹ ٹائپ) *</label>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              className="form-select"
              required
            >
              <option value="">Select complaint type</option>
              {CATEGORY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {form.category ? (
            <div className="form-group">
              <label>Priority / ترجیح (Tarjih)</label>
              <div className="form-input" style={{ background: '#f8fafc' }}>
                {labelFor(PRIORITY_OPTIONS, priorityForCategory(form.category))}
              </div>
            </div>
          ) : null}

          <FormTextarea
            label="Complaint details *"
            name="details"
            value={form.details}
            onChange={handleChange}
            placeholder="Describe the complaint"
            rows={5}
            required
          />

          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            <PrimaryButton type="submit" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit complaint'}
            </PrimaryButton>
            <SecondaryButton
              type="button"
              onClick={() => navigate('/ceo-office/ceo-complaints/list')}
            >
              Cancel
            </SecondaryButton>
          </div>
        </form>
      </div>
    </>
  );
};

export default CeoComplaintAdd;
