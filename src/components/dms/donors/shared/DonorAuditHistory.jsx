import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axiosInstance from '../../../../utils/axios';
import AuditHistoryTimeline from '../../../common/audit/AuditHistoryTimeline';
import {
  DONOR_AUDIT_ACTION_LABELS,
  DONOR_AUDIT_SOURCE_LABELS,
  DONOR_AUDIT_FIELD_LABELS,
  formatAuditActor,
  formatAuditValue,
} from '../../../common/audit/auditHistoryLabels';
import { resolveCrmApiPaths } from './crmApiPaths';

const DonorAuditHistory = ({ donorId, csrDonorId, refreshKey = 0 }) => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const apiPaths = useMemo(
    () => resolveCrmApiPaths({ donorId, csrDonorId }),
    [donorId, csrDonorId],
  );

  const fetchHistory = useCallback(async () => {
    if (!apiPaths?.auditHistory) return;
    setLoading(true);
    setError('');
    try {
      const res = await axiosInstance.get(apiPaths.auditHistory);
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
  }, [apiPaths]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory, refreshKey]);

  const emptyMessage = csrDonorId
    ? 'No staff changes recorded yet. Edits to CSR donor profile fields will appear here.'
    : 'No staff changes recorded yet. Edits to donor profile fields will appear here.';

  return (
    <AuditHistoryTimeline
      entries={entries}
      loading={loading}
      error={error}
      emptyMessage={emptyMessage}
      getActionLabel={(a) => DONOR_AUDIT_ACTION_LABELS[a] || a}
      getSourceLabel={(s) => DONOR_AUDIT_SOURCE_LABELS[s] || s}
      getFieldLabel={(f) => DONOR_AUDIT_FIELD_LABELS[f] || f.replace(/_/g, ' ')}
      formatActor={formatAuditActor}
      formatValue={formatAuditValue}
    />
  );
};

export default DonorAuditHistory;
