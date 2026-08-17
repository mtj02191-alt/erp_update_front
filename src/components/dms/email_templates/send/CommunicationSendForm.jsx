import React, { useState, useEffect, useMemo } from 'react';
import axiosInstance from '../../../../utils/axios';
import MultiSelect from '../../../common/MultiSelect';
import FormInput from '../../../common/FormInput';
import SearchableDropdown from '../../../common/SearchableDropdown';
import { DropdownFilter, SearchFilter } from '../../../common/filters';
import {
  TEMPLATE_CHANNELS,
  firstOrNull,
} from '../templateConstants';
import {
  clearAudienceFilters,
  formatFiltersSummary,
} from '../communicationAudience';

export const EMPTY_COMMUNICATION_FILTERS = {
  search: '',
  donor_type: '',
  donation_type: '',
  city: '',
  source: '',
  multi_time_donors: null,
  recurring: null,
  is_mature_donor: null,
  assigned_to_user_id: '',
};

const DONOR_TYPE_OPTIONS = [
  { value: 'individual', label: 'Individual' },
  { value: 'csr', label: 'CSR' },
];

const DONATION_TYPE_OPTIONS = [
  { value: 'recurring_donor', label: 'Recurring' },
  { value: 'one_time_donor', label: 'One-time' },
];

const SOURCE_OPTIONS = [
  { value: 'online', label: 'Online' },
  { value: 'offline', label: 'Offline' },
];

const YES_NO_OPTIONS = [
  { value: 'true', label: 'Yes' },
  { value: 'false', label: 'No' },
];

/**
 * Reusable bulk communication send form.
 *
 * @param {'manual'|'filters'} [props.initialAudienceMode]
 * @param {Array<string|number>} [props.initialDonorIds]
 * @param {object|null} [props.initialDonorFilters]
 * @param {string} [props.initialTemplateId]
 * @param {boolean} [props.lockAudience] — when true, audience is fixed (list modal)
 * @param {'donor_bulk'|'communication'} [props.sendSource] — tags batch for analytics scoping
 * @param {boolean} [props.showHistoryLink]
 * @param {() => void} [props.onNavigateHistory]
 * @param {(data: object) => void} [props.onSuccess]
 * @param {boolean} [props.compact]
 */
const CommunicationSendForm = ({
  initialAudienceMode = 'filters',
  initialDonorIds = [],
  initialDonorFilters = null,
  initialTemplateId = '',
  lockAudience = false,
  sendSource = 'communication',
  showHistoryLink = true,
  onNavigateHistory,
  onSuccess,
  compact = false,
}) => {
  const lockedMode = initialDonorIds?.length
    ? 'manual'
    : initialAudienceMode === 'manual'
      ? 'manual'
      : 'filters';

  const [templates, setTemplates] = useState([]);
  const [donors, setDonors] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState(initialTemplateId || '');
  const [selectionMode, setSelectionMode] = useState(
    lockAudience ? lockedMode : initialDonorIds?.length ? 'manual' : initialAudienceMode,
  );
  const [selectedDonorIds, setSelectedDonorIds] = useState(
    (initialDonorIds || []).map(String),
  );
  const [donorFilters, setDonorFilters] = useState(
    () => initialDonorFilters || EMPTY_COMMUNICATION_FILTERS,
  );
  const [matchedCount, setMatchedCount] = useState(null);
  const [channels, setChannels] = useState([]);
  const [channel, setChannel] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [previewDonorId, setPreviewDonorId] = useState('');
  const [previewData, setPreviewData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadTemplates();
    if (!lockAudience || selectionMode === 'manual') {
      loadDonors();
    }
  }, []);

  useEffect(() => {
    if (lockAudience) {
      setSelectionMode(lockedMode);
      setSelectedDonorIds((initialDonorIds || []).map(String));
      if (initialDonorFilters) {
        setDonorFilters(initialDonorFilters);
      }
    }
  }, [lockAudience, lockedMode, initialDonorIds, initialDonorFilters]);

  useEffect(() => {
    if (selectionMode === 'filters') {
      resolveAudienceCount();
    } else {
      setMatchedCount(selectedDonorIds.length);
    }
  }, [selectionMode, donorFilters, selectedDonorIds]);

  const loadTemplates = async () => {
    try {
      const res = await axiosInstance.get('/email-templates', {
        params: { page: 1, pageSize: 500, statuses: 'active' },
      });
      setTemplates(res.data?.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadDonors = async () => {
    try {
      const res = await axiosInstance.get('/donors', {
        params: { page: 1, pageSize: 500 },
      });
      setDonors(res.data?.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const donorOptions = useMemo(
    () =>
      donors.map((donor) => ({
        value: String(donor.id),
        label: `${donor.name || 'Donor'} (${donor.email || donor.phone || donor.id})`,
      })),
    [donors],
  );

  const selectedTemplate = templates.find(
    (t) => String(t.id) === String(selectedTemplateId),
  );

  useEffect(() => {
    if (selectedTemplate?.channels?.length) {
      setChannels(selectedTemplate.channels);
      setChannel(selectedTemplate.channels[0]);
    } else {
      setChannels([]);
      setChannel('');
    }
  }, [selectedTemplate]);

  const buildAudiencePayload = () => {
    if (selectionMode === 'manual') {
      return {
        selection_mode: 'manual',
        donor_ids: selectedDonorIds.map(Number),
      };
    }
    return {
      selection_mode: 'filters',
      donor_filters: donorFilters,
    };
  };

  const resolveAudienceCount = async () => {
    try {
      const res = await axiosInstance.post('/email-templates/resolve-audience', {
        selection_mode: 'filters',
        donor_filters: donorFilters,
      });
      setMatchedCount(res.data?.data?.total ?? 0);
    } catch {
      setMatchedCount(null);
    }
  };

  const handleFilterChange = (key, value) => {
    let nextValue = value;
    if (['multi_time_donors', 'recurring', 'is_mature_donor'].includes(key)) {
      if (value === '' || value === null || value === undefined) nextValue = null;
      else if (value === 'true' || value === true) nextValue = true;
      else if (value === 'false' || value === false) nextValue = false;
    }
    setDonorFilters((prev) => ({ ...prev, [key]: nextValue }));
  };

  const handlePreview = async () => {
    if (!selectedTemplateId) {
      setError('Select a template first');
      return;
    }
    const donorId = previewDonorId || firstOrNull(selectedDonorIds);
    if (!donorId && selectionMode === 'manual') {
      setError('Select at least one donor for personalized preview');
      return;
    }
    if (!donorId && selectionMode === 'filters') {
      setError('Search and pick a donor for personalized preview');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await axiosInstance.post(
        `/email-templates/${selectedTemplateId}/preview/${donorId}`,
        { sample_data: {} },
      );
      setPreviewData(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Preview failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (schedule = false) => {
    if (!selectedTemplateId) {
      setError('Select a template');
      return;
    }
    if (selectionMode === 'manual' && !selectedDonorIds.length) {
      setError('Select at least one donor');
      return;
    }
    if (selectionMode === 'filters' && matchedCount === 0) {
      setError('No donors match the selected filters');
      return;
    }
    if (!channel) {
      setError('Select a channel');
      return;
    }
    if (schedule && !scheduledAt) {
      setError('Select a schedule date/time');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await axiosInstance.post(
        `/email-templates/${selectedTemplateId}/send-bulk`,
        {
          ...buildAudiencePayload(),
          channel,
          scheduled_at: schedule ? scheduledAt : null,
          send_source: sendSource,
        },
      );
      const data = res.data?.data;
      clearAudienceFilters();
      const successText = schedule
        ? `Scheduled batch #${data?.batch_id}: ${data?.scheduled || 0} message(s).`
        : `Batch #${data?.batch_id}: sent ${data?.sent || 0}, failed ${data?.failed || 0} of ${data?.matched_count || 0} matched.`;
      setMessage(successText);
      if (typeof onSuccess === 'function') {
        onSuccess(data || {});
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Send failed');
    } finally {
      setLoading(false);
    }
  };

  const searchDonors = async (term) => {
    const query = String(term || '').trim();
    if (query.length < 2) return donorOptions.slice(0, 20);
    try {
      const res = await axiosInstance.get('/donors', {
        params: { page: 1, pageSize: 50, search: query },
      });
      return (res.data?.data || []).map((donor) => ({
        id: donor.id,
        first_name: donor.name,
        email: donor.email,
        filterValue: String(donor.id),
      }));
    } catch {
      return [];
    }
  };

  return (
    <div className={`communication-send-form${compact ? ' communication-send-form--compact' : ''}`}>
      {error && <div className="error-message">{error}</div>}
      {message && <div className="status-message">{message}</div>}

      <div className="form-grid">
        <div className="form-group">
          <label className="form-label">Saved Template</label>
          <select
            className="form-control"
            value={selectedTemplateId}
            onChange={(e) => setSelectedTemplateId(e.target.value)}
          >
            <option value="">Select template</option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>
        </div>

        {!lockAudience && (
          <div className="form-group">
            <label className="form-label">Audience mode</label>
            <select
              className="form-control"
              value={selectionMode}
              onChange={(e) => setSelectionMode(e.target.value)}
            >
              <option value="filters">Filter-based segment</option>
              <option value="manual">Manual donor selection</option>
            </select>
          </div>
        )}

        <MultiSelect
          label="Channel"
          name="channels"
          options={TEMPLATE_CHANNELS.filter((c) =>
            channels.length ? channels.includes(c.value) : true,
          )}
          value={channel ? [channel] : []}
          onChange={(value) => setChannel(firstOrNull(value) || '')}
          placeholder="Select channel"
        />

        <FormInput
          label="Schedule (optional)"
          name="scheduledAt"
          type="datetime-local"
          value={scheduledAt}
          onChange={(e) => setScheduledAt(e.target.value)}
        />
      </div>

      {lockAudience && selectionMode === 'manual' && (
        <p className="communication-send-form__audience-summary">
          <strong>{selectedDonorIds.length}</strong> donor
          {selectedDonorIds.length === 1 ? '' : 's'} selected
        </p>
      )}

      {lockAudience && selectionMode === 'filters' && (
        <div className="communication-send-form__audience-summary">
          <p style={{ margin: '0 0 6px', fontWeight: 600 }}>
            Matched donors: {matchedCount ?? '…'}
          </p>
          <p style={{ margin: 0, color: '#666', fontSize: 14 }}>
            {formatFiltersSummary(donorFilters)}
          </p>
        </div>
      )}

      {!lockAudience && selectionMode === 'filters' ? (
        <div className="card" style={{ padding: 16, marginTop: 16 }}>
          <h3 style={{ marginTop: 0 }}>Donor segment filters</h3>
          <div className="form-grid">
            <SearchFilter
              filterKey="search"
              label="Search"
              filters={donorFilters}
              onFilterChange={handleFilterChange}
              placeholder="Name, email, phone..."
            />
            <DropdownFilter
              filterKey="donor_type"
              label="Donor Type"
              data={DONOR_TYPE_OPTIONS}
              filters={donorFilters}
              onFilterChange={handleFilterChange}
              placeholder="All"
            />
            <DropdownFilter
              filterKey="donation_type"
              label="Donation Type"
              data={DONATION_TYPE_OPTIONS}
              filters={donorFilters}
              onFilterChange={handleFilterChange}
              placeholder="All"
            />
            <DropdownFilter
              filterKey="source"
              label="Source"
              data={SOURCE_OPTIONS}
              filters={donorFilters}
              onFilterChange={handleFilterChange}
              placeholder="All"
            />
            <FormInput
              label="City"
              name="city"
              value={donorFilters.city}
              onChange={(e) => handleFilterChange('city', e.target.value)}
            />
            <DropdownFilter
              filterKey="multi_time_donors"
              label="Multi-time donors"
              data={YES_NO_OPTIONS}
              filters={{
                ...donorFilters,
                multi_time_donors:
                  donorFilters.multi_time_donors === null
                    ? ''
                    : String(donorFilters.multi_time_donors),
              }}
              onFilterChange={handleFilterChange}
              placeholder="All"
            />
            <DropdownFilter
              filterKey="recurring"
              label="Recurring"
              data={YES_NO_OPTIONS}
              filters={{
                ...donorFilters,
                recurring:
                  donorFilters.recurring === null
                    ? ''
                    : String(donorFilters.recurring),
              }}
              onFilterChange={handleFilterChange}
              placeholder="All"
            />
            <DropdownFilter
              filterKey="is_mature_donor"
              label="Mature donor"
              data={YES_NO_OPTIONS}
              filters={{
                ...donorFilters,
                is_mature_donor:
                  donorFilters.is_mature_donor === null
                    ? ''
                    : String(donorFilters.is_mature_donor),
              }}
              onFilterChange={handleFilterChange}
              placeholder="All"
            />
          </div>
          <p style={{ marginTop: 12, fontWeight: 600 }}>
            Matched donors: {matchedCount ?? '…'}
          </p>
          <p style={{ color: '#666', fontSize: 14 }}>
            {formatFiltersSummary(donorFilters)}
          </p>
        </div>
      ) : null}

      {!lockAudience && selectionMode === 'manual' ? (
        <MultiSelect
          label="Donors"
          name="donor_ids"
          options={donorOptions}
          value={selectedDonorIds}
          onChange={setSelectedDonorIds}
          placeholder="Select donors"
        />
      ) : null}

      <SearchableDropdown
        label="Preview for donor"
        placeholder="Search donor for personalized preview..."
        onSearch={searchDonors}
        onSelect={(item) => setPreviewDonorId(String(item.id || item.filterValue))}
        onClear={() => setPreviewDonorId('')}
        displayKey="first_name"
        minSearchLength={2}
      />

      <div className="form-actions" style={{ flexWrap: 'wrap', gap: 10, marginTop: 20 }}>
        <button type="button" className="secondary-btn" onClick={handlePreview} disabled={loading}>
          Review Personalized Preview
        </button>
        <button type="button" className="primary-btn" onClick={() => handleSend(false)} disabled={loading}>
          Send Now
        </button>
        <button type="button" className="secondary-btn" onClick={() => handleSend(true)} disabled={loading}>
          Schedule Send
        </button>
        {showHistoryLink && (
          <button
            type="button"
            className="secondary-btn"
            onClick={() => {
              if (typeof onNavigateHistory === 'function') onNavigateHistory();
            }}
          >
            View Send History
          </button>
        )}
      </div>

      {previewData && (
        <div className="card" style={{ marginTop: 24, padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ marginTop: 0 }}>Personalized Preview</h3>
            <button type="button" className="secondary-btn" onClick={() => setPreviewData(null)}>
              Close Preview
            </button>
          </div>
          <p><strong>Donor:</strong> {previewData.donor?.name}</p>
          {previewData.subject && (
            <p><strong>Subject:</strong> {previewData.subject}</p>
          )}
          <div
            style={{
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              padding: 16,
              maxHeight: 400,
              overflow: 'auto',
            }}
            dangerouslySetInnerHTML={{ __html: previewData.body }}
          />
        </div>
      )}
    </div>
  );
};

export default CommunicationSendForm;
