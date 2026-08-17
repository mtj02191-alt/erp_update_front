import React, { useCallback, useEffect, useMemo, useState } from 'react';
import SearchableMultiSelect from '../../common/SearchableMultiSelect';
import axiosInstance from '../../../utils/axios';
import { CAMPAIGN_TEMPLATE_SLOTS } from './campaignConstants';

const automationCopy = (frequency) => {
  switch (frequency) {
    case 'daily':
      return {
        blurb:
          'Every day: send thank you to enrolled donors who already donated to this campaign/project today; send reminder to those who have not.',
        checkbox: 'Enable daily donor check',
      };
    case 'weekly':
      return {
        blurb:
          'Weekend check (Saturday & Sunday): if an enrolled donor has not donated during the current week (Mon–Sun), send a reminder. Thanks are sent when they have donated that week. Donors may give any day of the week.',
        checkbox: 'Enable weekly donor check (Saturday & Sunday)',
      };
    case 'bi_weekly':
    case 'quarterly':
    case 'yearly':
      return {
        blurb:
          'On the 2nd of each month: check the current period for this frequency — thank enrolled donors who donated in-period; remind those who have not.',
        checkbox: 'Enable period donor check (runs on the 2nd)',
      };
    case 'monthly':
    default:
      return {
        blurb:
          'On the 2nd of each month: send thank you to enrolled donors who already donated to this campaign/project this month; send reminder to those who have not.',
        checkbox: 'Enable monthly donor check (2nd of month)',
      };
  }
};

const selectionKey = (slotKey, channel) => `${slotKey}:${channel}`;

/** Simple Levenshtein for fuzzy name matching (e.g. marketing ≈ Makteting). */
const editDistance = (a, b) => {
  const s = String(a || '').toLowerCase();
  const t = String(b || '').toLowerCase();
  if (s === t) return 0;
  if (!s.length) return t.length;
  if (!t.length) return s.length;
  const rows = Array.from({ length: s.length + 1 }, (_, i) =>
    Array.from({ length: t.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );
  for (let i = 1; i <= s.length; i += 1) {
    for (let j = 1; j <= t.length; j += 1) {
      const cost = s[i - 1] === t[j - 1] ? 0 : 1;
      rows[i][j] = Math.min(
        rows[i - 1][j] + 1,
        rows[i][j - 1] + 1,
        rows[i - 1][j - 1] + cost,
      );
    }
  }
  return rows[s.length][t.length];
};

const nameMatchesSearch = (name, term) => {
  const n = String(name || '').toLowerCase();
  const t = String(term || '').trim().toLowerCase();
  if (!t) return true;
  if (n.includes(t)) return true;
  // Match individual words (typos within 1–2 edits), e.g. marketing ≈ Makteting, mark ≈ makt…
  const words = n.split(/[^a-z0-9]+/).filter(Boolean);
  const maxDist = t.length <= 4 ? 1 : 2;
  return words.some((word) => {
    if (word.includes(t) || (word.length >= 3 && t.includes(word))) return true;
    if (editDistance(word, t) <= maxDist) return true;
    for (let len = Math.max(t.length - 1, 1); len <= t.length + 1; len += 1) {
      for (let i = 0; i + len <= word.length; i += 1) {
        if (editDistance(word.slice(i, i + len), t) <= maxDist) return true;
      }
    }
    return false;
  });
};

const searchTemplatesByChannel = (channel) => async (term) => {
  const params = {
    search: term,
    channels: channel,
    statuses: 'active,draft',
    pageSize: 50,
  };
  const response = await axiosInstance.get('/email-templates', { params });
  let results = response.data?.data || [];

  // If ILIKE missed typos in name, broaden and fuzzy-match on name
  if (!results.some((row) => nameMatchesSearch(row.name, term))) {
    const broad = await axiosInstance.get('/email-templates', {
      params: {
        channels: channel,
        statuses: 'active,draft',
        pageSize: 50,
      },
    });
    const all = broad.data?.data || [];
    const fuzzy = all.filter((row) => nameMatchesSearch(row.name, term));
    const byId = new Map(results.map((row) => [row.id, row]));
    fuzzy.forEach((row) => byId.set(row.id, row));
    results = Array.from(byId.values());
  }

  return results;
};

const CampaignCommunicationSection = ({
  form,
  onToggleAutomation,
  onToggleDefaultComm,
  onSlotChange,
}) => {
  const [selectedTemplates, setSelectedTemplates] = useState({});

  const copy = automationCopy(form.target_frequency);

  const templateIdsToHydrate = useMemo(() => {
    const ids = [];
    for (const slot of CAMPAIGN_TEMPLATE_SLOTS) {
      const row = form.communication_templates?.[slot.key] || {};
      if (row.email_template_id) ids.push(Number(row.email_template_id));
      if (row.whatsapp_template_id) ids.push(Number(row.whatsapp_template_id));
    }
    return [...new Set(ids.filter((id) => Number.isFinite(id) && id > 0))];
  }, [form.communication_templates]);

  useEffect(() => {
    let cancelled = false;

    const hydrate = async () => {
      const next = { ...selectedTemplates };
      let changed = false;

      for (const slot of CAMPAIGN_TEMPLATE_SLOTS) {
        const row = form.communication_templates?.[slot.key] || {};
        for (const channel of ['email', 'whatsapp']) {
          const field =
            channel === 'email' ? 'email_template_id' : 'whatsapp_template_id';
          const id = row[field] ? Number(row[field]) : null;
          const key = selectionKey(slot.key, channel);
          const current = next[key]?.[0];

          if (!id) {
            if (next[key]?.length) {
              next[key] = [];
              changed = true;
            }
            continue;
          }

          if (current && Number(current.id) === id) continue;

          try {
            const res = await axiosInstance.get(`/email-templates/${id}`);
            const template = res.data?.data || res.data;
            if (cancelled || !template?.id) continue;
            next[key] = [template];
            changed = true;
          } catch {
            if (!cancelled) {
              next[key] = [
                {
                  id,
                  name: `Template #${id}`,
                },
              ];
              changed = true;
            }
          }
        }
      }

      if (!cancelled && changed) {
        setSelectedTemplates(next);
      }
    };

    if (templateIdsToHydrate.length || Object.keys(selectedTemplates).length) {
      hydrate();
    }

    return () => {
      cancelled = true;
    };
    // Intentionally depend on template IDs from form, not selectedTemplates (avoid loop)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateIdsToHydrate.join(',')]);

  const handleTemplateSelect = useCallback(
    (slotKey, channel, items) => {
      // One template per channel/slot — keep the latest selection only
      const chosen = items?.length ? [items[items.length - 1]] : [];
      setSelectedTemplates((prev) => ({
        ...prev,
        [selectionKey(slotKey, channel)]: chosen,
      }));
      const field =
        channel === 'email' ? 'email_template_id' : 'whatsapp_template_id';
      onSlotChange(slotKey, field, chosen[0]?.id ? String(chosen[0].id) : '');
    },
    [onSlotChange],
  );

  const handleTemplateClear = useCallback(
    (slotKey, channel) => {
      setSelectedTemplates((prev) => ({
        ...prev,
        [selectionKey(slotKey, channel)]: [],
      }));
      const field =
        channel === 'email' ? 'email_template_id' : 'whatsapp_template_id';
      onSlotChange(slotKey, field, '');
    },
    [onSlotChange],
  );

  if (!form.is_recurring) return null;

  return (
    <div className="form-section">
      <h3 style={{ marginBottom: '12px', fontSize: '16px' }}>Recurring donor communication</h3>
      <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px', lineHeight: 1.5 }}>
        {copy.blurb}
      </p>

      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', cursor: 'pointer' }}>
        <input
          type="checkbox"
          name="monthly_donor_automation_enabled"
          checked={form.monthly_donor_automation_enabled}
          onChange={onToggleAutomation}
          style={{ width: '18px', height: '18px' }}
        />
        {copy.checkbox}
      </label>

      {form.monthly_donor_automation_enabled && (
        <label
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            marginBottom: '20px',
            cursor: 'pointer',
            padding: '12px',
            background: '#f0f9ff',
            border: '1px solid #bae6fd',
            borderRadius: '8px',
          }}
        >
          <input
            type="checkbox"
            name="use_default_thanks_and_reminders"
            checked={!!form.use_default_thanks_and_reminders}
            onChange={onToggleDefaultComm}
            style={{ width: '18px', height: '18px', marginTop: '2px' }}
          />
          <span>
            <span style={{ fontWeight: 500, display: 'block', marginBottom: '4px' }}>
              Use default thanks &amp; payment-link messages
            </span>
            <span style={{ fontSize: '13px', color: '#4b5563', lineHeight: 1.45 }}>
              Thanks: existing thank-you email + WhatsApp. Reminder: existing payment-link email + WhatsApp.
              Manual Thank you / Reminder templates below are skipped when this is on (Marketing / Payment link slots stay available).
            </span>
          </span>
        </label>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {CAMPAIGN_TEMPLATE_SLOTS.map((slot) => {
          const row = form.communication_templates?.[slot.key] || {};
          const emailValue = selectedTemplates[selectionKey(slot.key, 'email')] || [];
          const whatsappValue =
            selectedTemplates[selectionKey(slot.key, 'whatsapp')] || [];
          const defaultsCoverSlot =
            !!form.use_default_thanks_and_reminders &&
            (slot.key === 'thanks' || slot.key === 'reminder');

          return (
            <div
              key={slot.key}
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '14px',
                background: defaultsCoverSlot ? '#f3f4f6' : '#fafafa',
                opacity: defaultsCoverSlot ? 0.85 : 1,
              }}
            >
              {defaultsCoverSlot ? (
                <div style={{ fontWeight: 500, marginBottom: '6px' }}>
                  {slot.label}
                  <span style={{ fontWeight: 400, color: '#6b7280', marginLeft: '8px', fontSize: '13px' }}>
                    — using system default ({slot.key === 'thanks' ? 'thanks email/WhatsApp' : 'payment-link email/WhatsApp'})
                  </span>
                </div>
              ) : (
                <>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', fontWeight: 500 }}>
                    <input
                      type="checkbox"
                      checked={!!row.enabled}
                      onChange={(e) => onSlotChange(slot.key, 'enabled', e.target.checked)}
                    />
                    {slot.label}
                  </label>
                  <div className="form-grid-2">
                    <SearchableMultiSelect
                      label="Email template"
                      placeholder="Search by template name..."
                      onSearch={searchTemplatesByChannel('email')}
                      value={emailValue}
                      onSelect={(items) => handleTemplateSelect(slot.key, 'email', items)}
                      onClear={() => handleTemplateClear(slot.key, 'email')}
                      displayKey="name"
                      valueKey="id"
                      allowResearch
                      debounceDelay={400}
                      minSearchLength={2}
                      renderOption={(item) => (
                        <div style={{ padding: '8px' }}>
                          <div style={{ fontWeight: 500 }}>{item.name}</div>
                          <div style={{ fontSize: '12px', color: '#666' }}>
                            #{item.id}
                            {item.status ? ` · ${item.status}` : ''}
                            {item.purposes?.length ? ` · ${Array.isArray(item.purposes) ? item.purposes.join(', ') : item.purposes}` : ''}
                            {item.subject ? ` · ${item.subject}` : ''}
                          </div>
                        </div>
                      )}
                    />
                    <SearchableMultiSelect
                      label="WhatsApp template"
                      placeholder="Search by template name..."
                      onSearch={searchTemplatesByChannel('whatsapp')}
                      value={whatsappValue}
                      onSelect={(items) => handleTemplateSelect(slot.key, 'whatsapp', items)}
                      onClear={() => handleTemplateClear(slot.key, 'whatsapp')}
                      displayKey="name"
                      valueKey="id"
                      allowResearch
                      debounceDelay={400}
                      minSearchLength={2}
                      renderOption={(item) => (
                        <div style={{ padding: '8px' }}>
                          <div style={{ fontWeight: 500 }}>{item.name}</div>
                          <div style={{ fontSize: '12px', color: '#666' }}>
                            #{item.id}
                            {item.status ? ` · ${item.status}` : ''}
                            {item.purposes?.length ? ` · ${Array.isArray(item.purposes) ? item.purposes.join(', ') : item.purposes}` : ''}
                            {item.subject ? ` · ${item.subject}` : ''}
                          </div>
                        </div>
                      )}
                    />
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CampaignCommunicationSection;
