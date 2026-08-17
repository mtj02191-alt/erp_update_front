import React, { useCallback, useEffect, useState } from 'react';
import axiosInstance from '../../../../utils/axios';
import AuditHistoryTimeline from '../../../common/audit/AuditHistoryTimeline';
import {
  DONATION_BOX_AUDIT_ACTION_LABELS,
  DONATION_BOX_AUDIT_SOURCE_LABELS,
  DONATION_BOX_AUDIT_FIELD_LABELS,
  formatAuditActor,
  formatAuditValue,
} from '../../../common/audit/auditHistoryLabels';

const renderRelocationMetadata = (entry) => {
  if (entry.action !== 'shop_relocated' || !entry.metadata) return null;

  const { previous_shop: prev, new_shop: next, relocation_note: note } = entry.metadata;
  if (!prev && !next) return null;

  const row = (label, value) => (
    <div key={label} style={{ fontSize: '13px', marginBottom: '4px' }}>
      <strong>{label}:</strong> {value || '—'}
    </div>
  );

  return (
    <div
      className="audit-timeline__relocation"
      style={{
        marginTop: '8px',
        padding: '10px 12px',
        background: '#f8fafc',
        borderRadius: '6px',
        border: '1px solid #e2e8f0',
      }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div>
          <div style={{ fontWeight: 600, marginBottom: '6px', fontSize: '13px' }}>Previous</div>
          {row('Shop', prev?.shop_name)}
          {row('Shopkeeper', prev?.shopkeeper)}
          {row('Route', prev?.route_name)}
          {row('City', prev?.city_name)}
        </div>
        <div>
          <div style={{ fontWeight: 600, marginBottom: '6px', fontSize: '13px' }}>New</div>
          {row('Shop', next?.shop_name)}
          {row('Shopkeeper', next?.shopkeeper)}
          {row('Route', next?.route_name)}
          {row('City', next?.city_name)}
        </div>
      </div>
      {note ? (
        <div style={{ marginTop: '8px', fontSize: '13px' }}>
          <strong>Note:</strong> {note}
        </div>
      ) : null}
    </div>
  );
};

const DonationBoxAuditHistory = ({ donationBoxId, refreshKey = 0 }) => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchHistory = useCallback(async () => {
    if (!donationBoxId) return;
    setLoading(true);
    setError('');
    try {
      const res = await axiosInstance.get(
        `/donation-box/${donationBoxId}/audit-history`,
      );
      if (res.data?.success) {
        setEntries(res.data.data || []);
      } else {
        setError(res.data?.message || 'Failed to load change history');
        setEntries([]);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load change history');
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [donationBoxId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory, refreshKey]);

  return (
    <AuditHistoryTimeline
      entries={entries}
      loading={loading}
      error={error}
      emptyMessage="No staff changes recorded yet. Edits to this donation box will appear here."
      getActionLabel={(a) => DONATION_BOX_AUDIT_ACTION_LABELS[a] || a}
      getSourceLabel={(s) => DONATION_BOX_AUDIT_SOURCE_LABELS[s] || s}
      getFieldLabel={(f) =>
        DONATION_BOX_AUDIT_FIELD_LABELS[f] || f.replace(/_/g, ' ')
      }
      formatActor={formatAuditActor}
      formatValue={formatAuditValue}
      renderEntryExtra={renderRelocationMetadata}
    />
  );
};

export default DonationBoxAuditHistory;
