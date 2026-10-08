import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import FormInput from '../../../common/FormInput';
import FormSelect from '../../../common/FormSelect';
import FormTextarea from '../../../common/FormTextarea';
import SearchableDropdown from '../../../common/SearchableDropdown';
import { PrimaryButton } from '../../../common/buttons';
import {
  ACTIVITY_TYPE_OPTIONS,
  RESPONSE_TYPE_OPTIONS,
  INTERACTION_STATUS_OPTIONS,
} from '../shared/constants';
import '../donor-relationship.css';

const donorDisplayName = (donor) =>
  donor?.name ||
  `${donor?.first_name || ''} ${donor?.last_name || ''}`.trim() ||
  'Unnamed';

const filterAssignedDonors = (donors, term = '') => {
  const query = String(term || '').trim().toLowerCase();
  if (!query) return donors;
  return donors.filter((d) => {
    const name = donorDisplayName(d).toLowerCase();
    const email = String(d.email || '').toLowerCase();
    const phone = String(d.phone || '').toLowerCase();
    return (
      name.includes(query) || email.includes(query) || phone.includes(query)
    );
  });
};

const AddDonorInteraction = ({
  embedded = false,
  embeddedDonorId = null,
  embeddedCsrDonorId = null,
  embeddedCsrPocId = null,
  onSaved = null,
  onCancel = null,
} = {}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedDonorId =
    (embeddedDonorId != null && embeddedDonorId !== ''
      ? String(embeddedDonorId)
      : null) ||
    searchParams.get('donor_id') ||
    '';
  const preselectedCsrDonorId =
    (embeddedCsrDonorId != null && embeddedCsrDonorId !== ''
      ? String(embeddedCsrDonorId)
      : null) ||
    searchParams.get('csr_donor_id') ||
    '';
  const preselectedCsrPocId =
    (embeddedCsrPocId != null && embeddedCsrPocId !== ''
      ? String(embeddedCsrPocId)
      : null) ||
    searchParams.get('csr_poc_id') ||
    '';
  const isCsrMode = !!preselectedCsrDonorId;

  const [donors, setDonors] = useState([]);
  const [csrPocs, setCsrPocs] = useState([]);
  const [selectedDonor, setSelectedDonor] = useState(null);
  const [selectedCsrDonor, setSelectedCsrDonor] = useState(null);
  const [loadingDonors, setLoadingDonors] = useState(!isCsrMode);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    donor_id: preselectedDonorId,
    csr_donor_id: preselectedCsrDonorId,
    csr_poc_id: preselectedCsrPocId,
    activity_type: 'call',
    custom_activity_title: '',
    user_action_text: '',
    donor_response_text: '',
    donor_response_type: '',
    next_action_text: '',
    next_followup_datetime: '',
    status: 'need_followup',
  });

  useEffect(() => {
    if (!isCsrMode) return;
    const loadCsrDonor = async () => {
      try {
        setLoadingDonors(true);
        const res = await axiosInstance.get(`/csr-donors/${preselectedCsrDonorId}`);
        if (res.data?.success) {
          setSelectedCsrDonor(res.data.data);
          setForm((prev) => ({
            ...prev,
            csr_donor_id: String(preselectedCsrDonorId),
            csr_poc_id: preselectedCsrPocId || prev.csr_poc_id || '',
          }));
        }
        const pocsRes = await axiosInstance.get(`/csr-donors/${preselectedCsrDonorId}/pocs`, {
          params: { page: 1, pageSize: 200 },
        });
        setCsrPocs(pocsRes.data?.data || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load CSR donor');
      } finally {
        setLoadingDonors(false);
      }
    };
    loadCsrDonor();
  }, [isCsrMode, preselectedCsrDonorId]);

  useEffect(() => {
    if (isCsrMode) return;
    const loadDonors = async () => {
      try {
        setLoadingDonors(true);
        const res = await axiosInstance.get('/donor-relationship/assigned-donors');
        if (res.data.success) {
          setDonors(res.data.data || []);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load assigned donors');
      } finally {
        setLoadingDonors(false);
      }
    };
    loadDonors();
  }, [isCsrMode]);

  useEffect(() => {
    if (isCsrMode || !preselectedDonorId || !donors.length || selectedDonor) return;
    const match = donors.find(
      (d) => String(d.id) === String(preselectedDonorId),
    );
    if (match) {
      setSelectedDonor(match);
      setForm((prev) => ({ ...prev, donor_id: String(match.id) }));
    }
  }, [isCsrMode, preselectedDonorId, donors, selectedDonor]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleDonorSelect = (donor) => {
    setSelectedDonor(donor);
    setForm((prev) => ({ ...prev, donor_id: String(donor.id) }));
    if (error) setError('');
  };

  const handleDonorClear = () => {
    setSelectedDonor(null);
    setForm((prev) => ({ ...prev, donor_id: '' }));
  };

  const searchAssignedDonors = useCallback(
    async (term) => filterAssignedDonors(donors, term),
    [donors],
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.donor_id && !form.csr_donor_id) {
      setError(isCsrMode ? 'CSR donor is required' : 'Please select a donor');
      return;
    }
    if (!form.user_action_text?.trim()) {
      setError('Please describe what you did');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const payload = {
        ...(form.csr_donor_id
          ? {
              csr_donor_id: Number(form.csr_donor_id),
              ...(form.csr_poc_id ? { csr_poc_id: Number(form.csr_poc_id) } : {}),
            }
          : { donor_id: Number(form.donor_id) }),
        activity_type: form.activity_type,
        custom_activity_title:
          form.activity_type === 'custom' ? form.custom_activity_title : undefined,
        user_action_text: form.user_action_text,
        donor_response_text: form.donor_response_text || undefined,
        donor_response_type: form.donor_response_type || undefined,
        next_action_text: form.next_action_text || undefined,
        next_followup_datetime: form.next_followup_datetime || undefined,
        status: form.status,
      };

      const response = await axiosInstance.post('/donor-relationship/interactions', payload);
      if (response.data.success) {
        if (embedded && typeof onSaved === 'function') {
          onSaved(response.data.data || null);
          return;
        }
        if (form.csr_donor_id) {
          const personQuery = form.csr_poc_id ? `?person=${form.csr_poc_id}` : '';
          navigate(`/dms/csr-donors/view/${form.csr_donor_id}${personQuery}`, {
            state: { flashMessage: 'Interaction recorded successfully' },
          });
        } else {
          const donorId = form.donor_id;
          navigate(`/dms/donors/view/${donorId}?tab=journey`, {
            state: { flashMessage: 'Interaction recorded successfully' },
          });
        }
      } else {
        setError(response.data.message || 'Failed to save interaction');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save interaction');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {!embedded && <Navbar />}
      <div className={embedded ? 'donor-profile-donations-embed' : 'form-content'}>
        <PageHeader
          title="Add Donor Interaction"
          backPath={embedded ? undefined : '/dms/donor-relationship/follow-ups'}
          onBackClick={
            embedded && typeof onCancel === 'function' ? () => onCancel() : undefined
          }
        />

        {error && (
          <div className="reconciliation-summary reconciliation-summary--error">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="form reconciliation-upload-card">
          <div className="form-section">
            <p className="reconciliation-notes">
              {isCsrMode
                ? 'Record what you did and how the CSR donor responded. Interactions are linked to the company, not individual POC contacts.'
                : 'Record what you did and how the donor responded. You can only add interactions for donors assigned to you.'}
            </p>

            <div className="form-grid-2">
              {isCsrMode ? (
                <>
                  <FormInput
                    label="CSR Donor"
                    name="csr_donor_display"
                    value={selectedCsrDonor?.name || (loadingDonors ? 'Loading…' : 'CSR Donor')}
                    readOnly
                    disabled
                  />
                  <div className="form-group">
                    <label htmlFor="csr_poc_id">POC (optional)</label>
                    <select
                      id="csr_poc_id"
                      name="csr_poc_id"
                      className="form-control"
                      value={form.csr_poc_id || ''}
                      onChange={handleChange}
                    >
                      <option value="">Company-wide (no specific POC)</option>
                      {csrPocs.map((row) => {
                        const pocRow = row.poc || row;
                        return (
                          <option key={pocRow.id} value={String(pocRow.id)}>
                            {pocRow.name || pocRow.email || `POC #${pocRow.id}`}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </>
              ) : (
                <SearchableDropdown
                  label="Donor"
                  name="donor_id"
                  placeholder={
                    loadingDonors
                      ? 'Loading assigned donors…'
                      : 'Search donors by name, email, or phone...'
                  }
                  onSearch={searchAssignedDonors}
                  staticOptions={donors}
                  onSelect={handleDonorSelect}
                  onClear={handleDonorClear}
                  value={selectedDonor}
                  displayKey="name"
                  debounceDelay={300}
                  minSearchLength={1}
                  allowResearch={true}
                  required
                  noResultsText={
                    loadingDonors
                      ? 'Loading…'
                      : 'No assigned donors match your search'
                  }
                  renderOption={(donor) => (
                    <>
                      <div style={{ fontWeight: '500', marginBottom: '4px' }}>
                        {donorDisplayName(donor)}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        {[donor.email, donor.phone].filter(Boolean).join(' • ') ||
                          'No contact info'}
                      </div>
                    </>
                  )}
                />
              )}

              <FormSelect
                name="activity_type"
                label="Activity type"
                value={form.activity_type}
                onChange={handleChange}
                options={ACTIVITY_TYPE_OPTIONS}
                required
              />

              {form.activity_type === 'custom' && (
                <FormInput
                  name="custom_activity_title"
                  label="Custom activity title"
                  value={form.custom_activity_title}
                  onChange={handleChange}
                  required
                />
              )}

              <FormSelect
                name="status"
                label="Status"
                value={form.status}
                onChange={handleChange}
                options={INTERACTION_STATUS_OPTIONS}
              />

              <FormSelect
                name="donor_response_type"
                label="Donor response type"
                value={form.donor_response_type}
                onChange={handleChange}
                options={RESPONSE_TYPE_OPTIONS}
              />

              <FormInput
                name="next_followup_datetime"
                label="Follow-up date & time"
                type="datetime-local"
                value={form.next_followup_datetime}
                onChange={handleChange}
              />
            </div>

            <FormTextarea
              name="user_action_text"
              label="What did you do?"
              value={form.user_action_text}
              onChange={handleChange}
              rows={3}
              required
            />

            <FormTextarea
              name="donor_response_text"
              label="Donor response"
              value={form.donor_response_text}
              onChange={handleChange}
              rows={3}
            />

            <FormTextarea
              name="next_action_text"
              label="Next step"
              value={form.next_action_text}
              onChange={handleChange}
              rows={2}
            />

            <div className="form-actions">
              <PrimaryButton type="submit" loading={submitting} loadingText="Saving…">
                Save interaction
              </PrimaryButton>
            </div>
          </div>
        </form>
      </div>
    </>
  );
};

export default AddDonorInteraction;
