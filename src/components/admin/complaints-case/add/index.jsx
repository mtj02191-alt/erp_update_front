import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import FormInput from '../../../common/FormInput';
import FormTextarea from '../../../common/FormTextarea';
import SearchableMultiSelect from '../../../common/SearchableMultiSelect';
import { PrimaryButton, SecondaryButton } from '../../../common/buttons';
import axiosInstance from '../../../../utils/axios';
import { useAuth } from '../../../../context/AuthContext';
import { getComplaintCasePermissions } from '../../../../utils/permissions';
import {
  COMPLAINT_CATEGORIES,
  DEPARTMENT_OPTIONS,
} from '../shared/complaintCaseConfig';
import '../shared/complaintCase.css';
import './index.css';

const AddComplaintCase = () => {
  const navigate = useNavigate();
  const { user, permissions } = useAuth();
  const casePerms = useMemo(
    () => getComplaintCasePermissions(permissions, user?.department, user?.role),
    [permissions, user?.department, user?.role],
  );

  const [form, setForm] = useState({
    title: '',
    description: '',
    complainer_narrative: '',
    department: user?.department || '',
    complaint_category: '',
    complaint_category_custom: '',
    project_name: '',
    related_issue_id: '',
  });
  const [nominatedDepartments, setNominatedDepartments] = useState([]);
  const [nominatedUsers, setNominatedUsers] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const searchIssues = async (searchTerm) => {
    try {
      const response = await axiosInstance.post('/tickets/search', {
        pagination: { page: 1, pageSize: 20, sortField: 'created_at', sortOrder: 'DESC' },
        filters: { search: searchTerm, type: 'issue' },
      });
      const rows = (response.data?.data || []).filter(
        (row) => String(row.type || 'issue').toLowerCase() === 'issue',
      );
      return rows.map((row) => ({
        id: row.id,
        name: `#${row.id} — ${row.title}`,
      }));
    } catch {
      return [];
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!casePerms.canCreate) {
      toast.error('You do not have permission to create complaints');
      return;
    }
    if (!form.title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!nominatedDepartments.length) {
      toast.error('Nominate at least one department');
      return;
    }
    if (form.complaint_category === 'other' && !form.complaint_category_custom.trim()) {
      toast.error('Enter a custom complaint type');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        complainer_narrative: form.complainer_narrative.trim() || form.description.trim(),
        department: form.department,
        complaint_category: form.complaint_category,
        complaint_category_custom:
          form.complaint_category === 'other' ? form.complaint_category_custom.trim() : undefined,
        nominated_departments: nominatedDepartments.map((d) => d.id || d.value || d),
        nominated_user_ids: nominatedUsers.map((u) => Number(u.id || u.value)),
        project_name: form.project_name.trim() || undefined,
        related_issue_id: form.related_issue_id ? Number(form.related_issue_id) : undefined,
        submission_channel: 'internal',
      };

      const response = await axiosInstance.post('/tickets/case', payload);
      const created = response.data?.data;
      toast.success(`Complaint submitted. Reference: ${created?.complaint_code}`);
      navigate(`/complaints/view/${created.id}`);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to submit complaint');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="list-wrapper cc-shell">
        <PageHeader
          title="Submit Complaint"
          showBackButton
          backPath="/complaints/list"
          showAdd={false}
        />
        <div className="list-content complaint-case-add">
          <form onSubmit={handleSubmit} className="complaint-case-form">
            <section className="cc-surface complaint-case-form__section">
              <h3 className="cc-section-title"><span /> Complaint details</h3>
              <div className="complaint-case-form__grid">
                <FormInput
                  label="Subject"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  required
                  placeholder="Brief summary of the complaint"
                />

                <label className="form-label">
                  Complaint Type <span className="required-mark">*</span>
                  <select
                    name="complaint_category"
                    className="form-input"
                    value={form.complaint_category}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select type</option>
                    {COMPLAINT_CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </label>

                {form.complaint_category === 'other' && (
                  <FormInput
                    label="Custom Type"
                    name="complaint_category_custom"
                    value={form.complaint_category_custom}
                    onChange={handleChange}
                    required
                    placeholder="Describe the complaint type"
                  />
                )}

                <label className="form-label">
                  Your Department
                  <select
                    name="department"
                    className="form-input"
                    value={form.department}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select department</option>
                    {DEPARTMENT_OPTIONS.map((dept) => (
                      <option key={dept.value} value={dept.value}>{dept.label}</option>
                    ))}
                  </select>
                </label>

                <FormInput
                  label="Project / Location (optional)"
                  name="project_name"
                  value={form.project_name}
                  onChange={handleChange}
                  placeholder="e.g. XYZ project site"
                />
              </div>
            </section>

            <section className="cc-surface complaint-case-form__section">
              <h3 className="cc-section-title"><span /> Nominees</h3>
              <p className="complaint-case-form__hint">
                Nominate the department(s) this complaint is against. Users are optional.
              </p>
              <div className="complaint-case-form__grid">
                <div className="form-group form-group--full">
                  <SearchableMultiSelect
                    label="Nominated Department(s) *"
                    value={nominatedDepartments}
                    onSelect={setNominatedDepartments}
                    onSearch={async (term) => {
                      const t = String(term || '').toLowerCase();
                      return DEPARTMENT_OPTIONS.filter((d) =>
                        d.label.toLowerCase().includes(t) || d.value.toLowerCase().includes(t),
                      ).map((d) => ({ id: d.value, name: d.label }));
                    }}
                    valueKey="id"
                    displayKey="name"
                    minSearchLength={0}
                    placeholder="Departments this complaint is against"
                  />
                </div>

                <div className="form-group form-group--full">
                  <SearchableMultiSelect
                    label="Nominated User(s) (optional)"
                    value={nominatedUsers}
                    onSelect={setNominatedUsers}
                    apiEndpoint="/users/options"
                    apiParams={{ active: true }}
                    valueKey="id"
                    displayKey="full_name"
                    placeholder="Specific users involved (optional)"
                  />
                </div>

                <div className="form-group form-group--full">
                  <SearchableMultiSelect
                    label="Related Issue (optional)"
                    value={form.related_issue_id
                      ? [{ id: form.related_issue_id, name: `Issue #${form.related_issue_id}` }]
                      : []}
                    onSelect={(items) => {
                      const item = items[items.length - 1];
                      setForm((prev) => ({
                        ...prev,
                        related_issue_id: item ? item.id : '',
                      }));
                    }}
                    onSearch={searchIssues}
                    valueKey="id"
                    displayKey="name"
                    placeholder="Link an existing issue ticket (optional)"
                  />
                </div>
              </div>
            </section>

            <section className="cc-surface complaint-case-form__section">
              <h3 className="cc-section-title"><span /> Narrative</h3>
              <div className="complaint-case-form__grid">
                <div className="form-group form-group--full">
                  <FormTextarea
                    label="Your Narrative"
                    name="complainer_narrative"
                    value={form.complainer_narrative}
                    onChange={handleChange}
                    rows={5}
                    placeholder="Describe what happened in detail"
                  />
                </div>

                <div className="form-group form-group--full">
                  <FormTextarea
                    label="Additional Details (optional)"
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows={3}
                  />
                </div>
              </div>
            </section>

            <div className="complaint-case-form__actions">
              <SecondaryButton type="button" onClick={() => navigate('/complaints/list')}>
                Cancel
              </SecondaryButton>
              <PrimaryButton type="submit" disabled={submitting || !casePerms.canCreate}>
                {submitting ? 'Submitting…' : 'Submit Complaint'}
              </PrimaryButton>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default AddComplaintCase;
