import React, { useCallback, useEffect, useState } from 'react';
import axiosInstance from '../../../../utils/axios';
import AuditHistoryTimeline from '../../../common/audit/AuditHistoryTimeline';
import {
  DONATION_AUDIT_ACTION_LABELS,
  DONATION_AUDIT_SOURCE_LABELS,
  DONATION_AUDIT_FIELD_LABELS,
  formatAuditActor,
  formatAuditValue,
} from '../../../common/audit/auditHistoryLabels';

const DonationAuditHistory = ({ donationId, refreshKey = 0 }) => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchHistory = useCallback(async () => {
    if (!donationId) return;
    setLoading(true);
    setError('');
    try {
      const res = await axiosInstance.get(`/donations/${donationId}/audit-history`);
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
  }, [donationId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory, refreshKey]);

  return (
    <AuditHistoryTimeline
      entries={entries}
      loading={loading}
      error={error}
      emptyMessage="No staff changes recorded yet. Updates to amount, status, notes, and other fields will appear here."
      getActionLabel={(a) => DONATION_AUDIT_ACTION_LABELS[a] || a}
      getSourceLabel={(s) => DONATION_AUDIT_SOURCE_LABELS[s] || s}
      getFieldLabel={(f) => DONATION_AUDIT_FIELD_LABELS[f] || f.replace(/_/g, ' ')}
      formatActor={formatAuditActor}
      formatValue={formatAuditValue}
    />
  );
};

export default DonationAuditHistory;
