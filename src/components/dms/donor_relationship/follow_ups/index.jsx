import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiCheck,
  FiClock,
  FiEdit2,
  FiEye,
  FiMessageSquare,
  FiRefreshCw,
  FiSearch,
} from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import axiosInstance from '../../../../utils/axios';
import { useAuth } from '../../../../context/AuthContext';
import Pagination from '../../../common/Pagination';
import { formatActivityType, canMutateFollowup } from '../shared/constants';
import { useDonorRelationshipScope } from '../shared/donorRelationshipScope';
import DonorRelationshipHub from '../shared/DonorRelationshipHub';
import FollowupEditModal from '../shared/FollowupEditModal';
import '../donor-relationship.css';

const BUCKETS = [
  { id: 'today', label: 'Today' },
  { id: 'overdue', label: 'Overdue' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'completed', label: 'Completed' },
];

function formatWhenParts(value) {
  if (!value) return { date: '—', time: '' };
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return { date: String(value), time: '' };
  return {
    date: d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }),
    time: d.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }),
  };
}

function getInitials(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function avatarTone(name) {
  const tones = ['blue', 'teal', 'violet', 'amber', 'rose', 'indigo'];
  let hash = 0;
  for (let i = 0; i < String(name || '').length; i += 1) {
    hash = (hash + String(name).charCodeAt(i) * (i + 1)) % 97;
  }
  return tones[hash % tones.length];
}

function followupStatusClass(status) {
  const s = String(status || '').toLowerCase();
  if (s === 'completed' || s === 'closed') return 'completed';
  if (s === 'pending' || s === 'rescheduled' || s === 'need_followup') return 'followup';
  return 'default';
}

function FollowupStatusIcon({ status }) {
  const s = String(status || '').toLowerCase();
  if (s === 'completed' || s === 'closed') return <FiCheck />;
  return <FiClock />;
}

function staffName(user) {
  if (!user) return '—';
  return (
    [user.first_name, user.last_name].filter(Boolean).join(' ') ||
    user.name ||
    user.email ||
    '—'
  );
}

const FollowUpsList = () => {
  const navigate = useNavigate();
  const { scope } = useDonorRelationshipScope();
  const { permissions } = useAuth();
  const [bucket, setBucket] = useState('today');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [searchApplied, setSearchApplied] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [editingFollowup, setEditingFollowup] = useState(null);

  useEffect(() => {
    fetchFollowups();
  }, [bucket, page, pageSize, searchApplied, scope]);

  const fetchFollowups = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axiosInstance.get('/donor-relationship/follow-ups', {
        params: {
          bucket,
          scope,
          page,
          pageSize,
          search: searchApplied.trim() || undefined,
        },
      });
      if (response.data.success) {
        setRecords(response.data.data || []);
        setTotalItems(response.data.pagination?.total || 0);
        setTotalPages(response.data.pagination?.totalPages || 1);
      } else {
        setError(response.data.message || 'Failed to load follow-ups');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load follow-ups');
    } finally {
      setLoading(false);
    }
  };

  const completeFollowup = async (id) => {
    try {
      await axiosInstance.patch(`/donor-relationship/follow-ups/${id}/complete`);
      fetchFollowups();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to complete follow-up');
    }
  };

  const openAddInteraction = (donorId) => {
    navigate(`/dms/donor-relationship/add${donorId ? `?donor_id=${donorId}` : ''}`);
  };

  const openDonor = (row) => {
    navigate(`/dms/donors/view/${row.donor_id}`);
  };

  const applySearch = () => {
    setSearchApplied(search);
    setPage(1);
  };

  const bucketTabs = (
    <div className="ix-scope-bar ix-scope-bar--compact">
      <div className="ix-scope-bar__row">
        <span className="ix-scope-bar__label">Due</span>
        <div className="ix-scope-tabs" role="tablist" aria-label="Follow-up buckets">
          {BUCKETS.map((b) => (
            <button
              key={b.id}
              type="button"
              role="tab"
              aria-selected={bucket === b.id}
              className={`ix-scope-tab${bucket === b.id ? ' is-active' : ''}`}
              onClick={() => {
                setBucket(b.id);
                setPage(1);
              }}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <DonorRelationshipHub activeTab="follow-ups" panelHeader={bucketTabs}>
      <div className="ix-toolbar">
            <div className="ix-search">
              <FiSearch className="ix-search__icon" aria-hidden />
              <input
                type="search"
                placeholder="Search donor, title, or notes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') applySearch();
                }}
              />
            </div>
            <button type="button" className="ix-btn ix-btn--primary" onClick={applySearch}>
              <FiSearch />
              Search
            </button>
            <button
              type="button"
              className="ix-btn ix-btn--ghost"
              onClick={fetchFollowups}
              disabled={loading}
            >
              <FiRefreshCw className={loading ? 'ix-spin' : undefined} />
              Refresh
            </button>
          </div>

          {error && <div className="error-message ix-error">{error}</div>}

          {loading ? (
            <div className="ix-empty">Loading follow-ups…</div>
          ) : records.length === 0 ? (
            <div className="ix-empty">
              <FiClock size={40} strokeWidth={1.4} />
              <p>No follow-ups in this bucket.</p>
              <button
                type="button"
                className="ix-btn ix-btn--primary"
                onClick={() => openAddInteraction()}
              >
                Log an interaction
              </button>
            </div>
          ) : (
            <>
              <div className="ix-table-wrap">
                <table className="ix-table">
                  <thead>
                    <tr>
                      <th>Due date & time</th>
                      <th>Donor</th>
                      {scope === 'team' && <th>Assigned to</th>}
                      <th>Follow-up</th>
                      <th>Notes</th>
                      <th>Status</th>
                      <th aria-label="Actions" className="ix-table__actions" />
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((row) => {
                      const when = formatWhenParts(row.due_datetime);
                      const donorName = row.donor?.name || `Donor #${row.donor_id}`;
                      const { canEdit, locked } = canMutateFollowup(permissions, row);
                      const activityType = row.interaction?.activity_type;
                      const relatedText = row.interaction?.user_action_text;

                      return (
                        <tr key={row.id}>
                          <td>
                            <div className="ix-when">
                              <div>
                                <div className="ix-when__date">{when.date}</div>
                                {when.time && (
                                  <div className="ix-when__time">{when.time}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="ix-donor">
                              <span
                                className={`ix-avatar ix-avatar--${avatarTone(donorName)}`}
                                aria-hidden
                              >
                                {getInitials(donorName)}
                              </span>
                              <div className="ix-donor__meta">
                                <button
                                  type="button"
                                  className="ix-donor__name"
                                  title={donorName}
                                  onClick={() => openDonor(row)}
                                >
                                  {donorName}
                                </button>
                                {row.donor?.phone && (
                                  <div className="ix-donor__phone" title={row.donor.phone}>
                                    {row.donor.phone}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          {scope === 'team' && (
                            <td className="ix-staff" title={staffName(row.assigned_to)}>
                              {staffName(row.assigned_to)}
                            </td>
                          )}
                          <td>
                            <div className="ix-action-text">
                              <span
                                className="ix-type__icon ix-type__icon--slate"
                                title={
                                  activityType
                                    ? formatActivityType(activityType)
                                    : 'Follow-up'
                                }
                              >
                                <FiMessageSquare />
                              </span>
                              <span
                                className="ix-action-text__body"
                                title={row.followup_title || undefined}
                              >
                                {row.followup_title || '—'}
                              </span>
                            </div>
                            {relatedText && (
                              <div
                                className="ix-followup-related"
                                title={relatedText}
                              >
                                {formatActivityType(activityType)}
                                {relatedText ? ` — ${relatedText}` : ''}
                              </div>
                            )}
                          </td>
                          <td>
                            <span
                              className="ix-notes-text"
                              title={row.followup_reason || undefined}
                            >
                              {row.followup_reason || '—'}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`ix-status ix-status--${followupStatusClass(row.status)}`}
                            >
                              <FollowupStatusIcon status={row.status} />
                              {String(row.status || '—').replace(/_/g, ' ')}
                              {locked && !permissions?.super_admin ? ' · locked' : ''}
                            </span>
                          </td>
                          <td className="ix-table__actions">
                            <div className="ix-actions">
                              {canEdit && (
                                <button
                                  type="button"
                                  className="ix-view-btn"
                                  title="Edit follow-up"
                                  onClick={() => setEditingFollowup(row)}
                                >
                                  <FiEdit2 />
                                </button>
                              )}
                              <button
                                type="button"
                                className="ix-view-btn"
                                title="Add interaction"
                                onClick={() => openAddInteraction(row.donor_id)}
                              >
                                <FiMessageSquare />
                              </button>
                              {row.status !== 'completed' && (
                                <button
                                  type="button"
                                  className="ix-view-btn ix-view-btn--success"
                                  title="Mark completed"
                                  onClick={() => completeFollowup(row.id)}
                                >
                                  <FiCheck />
                                </button>
                              )}
                              <button
                                type="button"
                                className="ix-view-btn"
                                title="View donor"
                                onClick={() => openDonor(row)}
                              >
                                <FiEye />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="ix-footer">
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  pageSize={pageSize}
                  onPageChange={setPage}
                  onPageSizeChange={(size) => {
                    setPageSize(size);
                    setPage(1);
                  }}
                />
              </div>
            </>
          )}

      <FollowupEditModal
        open={!!editingFollowup}
        followup={editingFollowup}
        onClose={() => setEditingFollowup(null)}
        onSaved={() => fetchFollowups()}
      />
    </DonorRelationshipHub>
  );
};

export default FollowUpsList;
