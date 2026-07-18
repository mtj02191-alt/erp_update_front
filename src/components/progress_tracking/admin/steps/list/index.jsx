import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import axiosInstance from '../../../../../utils/axios';
import Navbar from '../../../../Navbar';
import PageHeader from '../../../../common/PageHeader';
import ActionMenu from '../../../../common/ActionMenu';
import { FiEye, FiList } from 'react-icons/fi';

const StepsList = () => {
  const { trackerId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const batchIdFromUrl = searchParams.get('batch_id');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await axiosInstance.get(`/progress/trackers/${trackerId}/steps`);
        if (res.data?.success) setRows(res.data.data || []);
        else setError(res.data?.message || 'Failed to load steps');
      } catch (e) {
        setError(e.response?.data?.message || 'Failed to load steps');
      } finally {
        setLoading(false);
      }
    };
    if (trackerId) run();
  }, [trackerId]);

  const batchFilterOptions = useMemo(() => {
    const map = new Map();
    for (const s of rows) {
      const bid = s.batch_id != null ? Number(s.batch_id) : null;
      if (bid == null || !Number.isFinite(bid) || bid <= 0) continue;
      const bn = s.batch?.batch_number != null ? Number(s.batch.batch_number) : bid;
      if (!map.has(bid)) map.set(bid, { batch_id: bid, batch_number: bn });
    }
    return Array.from(map.values()).sort((a, b) => a.batch_number - b.batch_number);
  }, [rows]);

  const filteredRows = useMemo(() => {
    const raw =
      batchIdFromUrl != null && String(batchIdFromUrl).trim() !== ''
        ? Number(batchIdFromUrl)
        : NaN;
    if (!Number.isFinite(raw) || raw <= 0) return rows;
    const scoped = rows.filter((s) => s.batch_id != null && Number(s.batch_id) === raw);
    return scoped.length ? scoped : rows;
  }, [rows, batchIdFromUrl]);

  const actionsFor = (s) => [
    {
      icon: <FiEye />,
      label: 'View',
      color: '#4CAF50',
      onClick: () => navigate(`/progress/trackers/${trackerId}/steps/${s.id}`),
      visible: true,
    },
  ];

  const evidenceCount = useMemo(
    () => filteredRows.reduce((sum, s) => sum + ((s.evidence || []).length || 0), 0),
    [filteredRows],
  );

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="list-wrapper">
          <PageHeader title="Tracker Steps" showBackButton={true} backPath={`/progress/trackers/${trackerId}`} />
          <div className="loading">Loading...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="list-wrapper">
        <PageHeader title="Tracker Steps" showBackButton={true} backPath={`/progress/trackers/${trackerId}`} />
        <div className="list-content">
          {error && <div className="status-message status-message--error">{error}</div>}

          {batchFilterOptions.length > 0 && (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
                alignItems: 'center',
                marginBottom: '12px',
                padding: '10px 12px',
                background: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
              }}
            >
              <span style={{ fontSize: '13px', color: '#475569', fontWeight: 600 }}>Batch:</span>
              <Link
                to={`/progress/trackers/${trackerId}/steps`}
                style={{
                  fontSize: '13px',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  background: !batchIdFromUrl ? '#dbeafe' : 'white',
                  color: '#1e40af',
                  border: '1px solid #bfdbfe',
                }}
              >
                All
              </Link>
              {batchFilterOptions.map((b) => (
                <Link
                  key={b.batch_id}
                  to={`/progress/trackers/${trackerId}/steps?batch_id=${b.batch_id}`}
                  style={{
                    fontSize: '13px',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    textDecoration: 'none',
                    background:
                      String(batchIdFromUrl) === String(b.batch_id) ? '#dbeafe' : 'white',
                    color: '#1e40af',
                    border: '1px solid #bfdbfe',
                  }}
                >
                  #{b.batch_number}
                </Link>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
            <div className="status-message" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <FiList /> Showing {filteredRows.length} of {rows.length} steps • Evidence: {evidenceCount}
            </div>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Order</th>
                  <th>Title</th>
                  <th className="hide-on-mobile">Batch</th>
                  <th>Status</th>
                  <th className="hide-on-mobile">Donor Visible</th>
                  <th className="hide-on-mobile">Evidence</th>
                  <th className="table-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((s) => (
                  <tr key={s.id}>
                    <td>{s.id}</td>
                    <td>{s.step_order}</td>
                    <td>{s.title}</td>
                    <td className="hide-on-mobile">
                      {s.batch_id != null ? (
                        <Link
                          to={`/progress/trackers/${trackerId}/steps?batch_id=${s.batch_id}`}
                          style={{ color: '#2563eb', textDecoration: 'underline', fontSize: '13px' }}
                        >
                          #{s.batch?.batch_number ?? s.batch_id}
                        </Link>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>{s.status}</td>
                    <td className="hide-on-mobile">{s.donor_visible ? 'Yes' : 'No'}</td>
                    <td className="hide-on-mobile">{(s.evidence || []).length}</td>
                    <td className="table-actions">
                      <ActionMenu actions={actionsFor(s)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredRows.length === 0 && rows.length > 0 && (
            <div className="empty-state" style={{ padding: 20 }}>
              No steps for this batch. Try another batch or clear the filter.
            </div>
          )}
          {filteredRows.length === 0 && rows.length === 0 && (
            <div className="empty-state" style={{ padding: 20 }}>
              No steps found.
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default StepsList;

