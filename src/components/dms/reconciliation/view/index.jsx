import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import '../reconciliation.css';

const formatDate = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
};

const ReconciliationView = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const flashMessage = location.state?.flashMessage || '';
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRecord();
  }, [id]);

  const fetchRecord = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axiosInstance.get(`/reconciliation/${id}`);
      if (response.data.success) {
        setRecord(response.data.data);
      } else {
        setError(response.data.message || 'Failed to load reconciliation');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load reconciliation');
    } finally {
      setLoading(false);
    }
  };

  const rowResults = record?.row_results || [];

  return (
    <>
      <Navbar />
      <div className="view-wrapper">
        <PageHeader
          title={`Reconciliation #${id}`}
          backPath="/dms/reconciliation/list"
        />

        {flashMessage && (
          <div className="reconciliation-summary">{flashMessage}</div>
        )}

        {loading && <p>Loading…</p>}
        {error && <div className="error-message">{error}</div>}

        {!loading && record && (
          <>
            <div className="reconciliation-upload-card">
              <div className="form-section">
                <div className="reconciliation-detail-grid">
                <div>
                  <strong>Bank</strong>
                  <div style={{ textTransform: 'capitalize' }}>{record.bank_name}</div>
                </div>
                <div>
                  <strong>Uploaded</strong>
                  <div>{formatDate(record.created_at)}</div>
                </div>
                <div>
                  <strong>By</strong>
                  <div>
                    {record.created_by?.name ||
                      record.created_by?.email ||
                      record.created_by?.id ||
                      '—'}
                  </div>
                </div>
                <div>
                  <strong>Statement period</strong>
                  <div>
                    {formatDate(record.statement_from)} — {formatDate(record.statement_to)}
                  </div>
                </div>
                <div>
                  <strong>Credit rows</strong>
                  <div>{record.total_credit_rows ?? 0}</div>
                </div>
                <div>
                  <strong>Created / Skipped / Failed</strong>
                  <div>
                    {record.created_count ?? 0} / {record.skipped_count ?? 0} /{' '}
                    {record.failed_count ?? 0}
                  </div>
                </div>
                <div>
                  <strong>File</strong>
                  <div>
                    {record.file_url ? (
                      <a
                        href={record.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="reconciliation-file-link"
                      >
                        {record.original_filename || 'Download'}
                      </a>
                    ) : (
                      '—'
                    )}
                  </div>
                </div>
                </div>
                {record.notes && (
                  <p className="reconciliation-notes">
                    <strong>Notes:</strong> {record.notes}
                  </p>
                )}
              </div>
            </div>

            <h3>Row results ({rowResults.length})</h3>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Sheet row</th>
                    <th>Tran seq</th>
                    <th>Status</th>
                    <th>Reason</th>
                    <th>Donation ID</th>
                    <th>Donor ID</th>
                  </tr>
                </thead>
                <tbody>
                  {rowResults.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center' }}>
                        No row details
                      </td>
                    </tr>
                  ) : (
                    rowResults.map((row, idx) => (
                      <tr key={`${row.rowIndex}-${idx}`}>
                        <td>{row.rowIndex}</td>
                        <td>{row.tranSeqNo || '—'}</td>
                        <td>
                          <span className={`reconciliation-status-badge ${row.status}`}>
                            {row.status}
                          </span>
                        </td>
                        <td>{row.reason || '—'}</td>
                        <td>
                          {row.donationId ? (
                            <a
                              href={`/donations/online_donations/view/${row.donationId}`}
                              className="reconciliation-file-link"
                              onClick={(e) => {
                                e.preventDefault();
                                navigate(`/donations/online_donations/view/${row.donationId}`);
                              }}
                            >
                              {row.donationId}
                            </a>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td>
                          {row.donorId ? (
                            <a
                              href={`/dms/donors/view/${row.donorId}`}
                              className="reconciliation-file-link"
                              onClick={(e) => {
                                e.preventDefault();
                                navigate(`/dms/donors/view/${row.donorId}`);
                              }}
                            >
                              {row.donorId}
                            </a>
                          ) : (
                            '—'
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default ReconciliationView;
