import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiCalendar,
  FiCheck,
  FiCheckCircle,
  FiClock,
  FiEye,
  FiHeart,
  FiMail,
  FiMapPin,
  FiMessageCircle,
  FiMessageSquare,
  FiMinusCircle,
  FiPhone,
  FiRefreshCw,
  FiSearch,
} from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import axiosInstance from '../../../../utils/axios';
import Pagination from '../../../common/Pagination';
import {
  ACTIVITY_TYPE_OPTIONS,
  formatActivityType,
} from '../shared/constants';
import { useDonorRelationshipScope } from '../shared/donorRelationshipScope';
import DonorRelationshipHub from '../shared/DonorRelationshipHub';
import '../donor-relationship.css';

const ACTIVITY_VISUAL = {
  call: { Icon: FiPhone, tone: 'green' },
  whatsapp: { Icon: FaWhatsapp, tone: 'whatsapp' },
  email: { Icon: FiMail, tone: 'purple' },
  visit: { Icon: FiMapPin, tone: 'amber' },
  meeting: { Icon: FiMessageSquare, tone: 'blue' },
  dinner_invitation: { Icon: FiHeart, tone: 'rose' },
  event_invitation: { Icon: FiCalendar, tone: 'indigo' },
  proposal_shared: { Icon: FiMessageSquare, tone: 'slate' },
  thank_you: { Icon: FiHeart, tone: 'rose' },
  donation_request: { Icon: FiMessageCircle, tone: 'blue' },
  pledge_followup: { Icon: FiClock, tone: 'amber' },
  relationship_building: { Icon: FiMessageSquare, tone: 'teal' },
  custom: { Icon: FiMessageSquare, tone: 'slate' },
};

const AVATAR_TONES = ['blue', 'teal', 'violet', 'amber', 'rose', 'indigo'];

function getInitials(name) {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function avatarTone(name) {
  const str = String(name || '');
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) hash = (hash + str.charCodeAt(i) * (i + 1)) % 97;
  return AVATAR_TONES[hash % AVATAR_TONES.length];
}

function formatWhenParts(value) {
  if (!value) return { date: '—', time: '' };
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return { date: String(value), time: '' };
  return {
    date: d.toLocaleDateString(undefined, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }),
    time: d.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }),
  };
}

function responseTone(type, text) {
  const t = String(type || '').toLowerCase();
  if (['positive', 'interested', 'committed'].includes(t)) return 'positive';
  if (['need_details', 'busy', 'neutral'].includes(t)) return 'pending';
  if (['refused', 'negative', 'not_responding'].includes(t)) return 'muted';
  if (!text) return 'muted';
  return 'pending';
}

function ResponseIcon({ tone }) {
  if (tone === 'positive') return <FiCheckCircle />;
  if (tone === 'muted') return <FiMinusCircle />;
  return <FiClock />;
}

function StatusIcon({ status }) {
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

const InteractionsList = () => {
  const navigate = useNavigate();
  const { scope } = useDonorRelationshipScope();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [searchApplied, setSearchApplied] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchList = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const params = { scope, limit: 300 };
      if (typeFilter) params.activity_type = typeFilter;
      if (searchApplied.trim()) params.search = searchApplied.trim();
      const res = await axiosInstance.get('/donor-relationship/my-interactions', {
        params,
      });
      if (res.data.success) {
        setItems(res.data.data?.items || []);
        setPage(1);
      } else {
        setError(res.data.message || 'Failed to load interactions');
        setItems([]);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load interactions');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [scope, typeFilter, searchApplied]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const applySearch = () => setSearchApplied(search);

  const totalItems = items.length;
  const effectivePageSize = pageSize === -1 ? totalItems || 1 : pageSize;
  const totalPages =
    pageSize === -1 ? 1 : Math.max(1, Math.ceil(totalItems / effectivePageSize));
  const pagedItems = useMemo(() => {
    if (pageSize === -1) return items;
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, page, pageSize]);

  const openDonor = (row) => {
    navigate(`/dms/donors/view/${row.donor_id || row.donor?.id}`);
  };

  return (
    <DonorRelationshipHub activeTab="interactions">
      <div className="ix-toolbar">
            <div className="ix-search">
              <FiSearch className="ix-search__icon" aria-hidden />
              <input
                type="search"
                placeholder="Search donor, phone, or notes..."
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
            <select
              className="ix-select"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              aria-label="Filter by activity type"
            >
              <option value="">All activity types</option>
              {ACTIVITY_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="ix-btn ix-btn--ghost"
              onClick={fetchList}
              disabled={loading}
            >
              <FiRefreshCw className={loading ? 'ix-spin' : undefined} />
              Refresh
            </button>
          </div>

          {error && <div className="error-message ix-error">{error}</div>}

          {loading ? (
            <div className="ix-empty">Loading interactions…</div>
          ) : items.length === 0 ? (
            <div className="ix-empty">
              <FiMessageSquare size={40} strokeWidth={1.4} />
              <p>No interactions found</p>
              <button
                type="button"
                className="ix-btn ix-btn--primary"
                onClick={() => navigate('/dms/donor-relationship/add')}
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
                      <th>Date & Time</th>
                      <th>Donor</th>
                      {/* <th>Type</th> */}
                      {scope === 'team' && <th>Logged by</th>}
                      <th>What you did</th>
                      <th>Donor response</th>
                      {/* <th>Next action</th> */}
                      {/* <th>Status</th> */}
                      <th aria-label="Actions" className="ix-table__actions" />
                    </tr>
                  </thead>
                  <tbody>
                    {pagedItems.map((row) => {
                      const when = formatWhenParts(row.activity_datetime);
                      const visual = ACTIVITY_VISUAL[row.activity_type] || ACTIVITY_VISUAL.custom;
                      const TypeIcon = visual.Icon;
                      const donorName = row.donor?.name || `Donor #${row.donor_id}`;
                      const responseText =
                        row.donor_response_text ||
                        (row.donor_response_type
                          ? String(row.donor_response_type).replace(/_/g, ' ')
                          : '');
                      const rTone = responseTone(row.donor_response_type, responseText);
                      const statusKey = String(row.status || '').toLowerCase();

                      return (
                        <tr key={row.id}>
                          <td>
                            <div className="ix-when">
                              {/* <FiCalendar className="ix-when__icon" /> */}
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
                          {/* <td>
                            <div className="ix-type">
                              <span className={`ix-type__icon ix-type__icon--${visual.tone}`}>
                                <TypeIcon />
                              </span>
                              <span className="ix-type__label">
                                {formatActivityType(row.activity_type)}
                              </span>
                            </div>
                          </td> */}
 
                          {scope === 'team' && (
                            <td className="ix-staff">{staffName(row.created_by)}</td>
                          )}
                          <td>
                            <div className="ix-action-text">
                              <span
                                className={`ix-type__icon ix-type__icon--${visual.tone}`}
                                title={formatActivityType(row.activity_type)}
                              >
                                <TypeIcon />
                              </span>
                              <span
                                className="ix-action-text__body"
                                title={row.user_action_text || undefined}
                              >
                                {row.user_action_text || '—'}
                              </span>
                            </div>
                          </td>
                          <td>
                            {responseText ? (
                              <span
                                className={`ix-response ix-response--${rTone}`}
                                title={responseText}
                              >
                                <ResponseIcon tone={rTone} />
                                <span className="ix-response__text">{responseText}</span>
                              </span>
                            ) : (
                              <span className="ix-response ix-response--muted">
                                <FiMinusCircle />
                                <span className="ix-response__text">No response yet</span>
                              </span>
                            )}
                          </td>
                          {/* <td>
                            <div className="ix-next">
                              <div className="ix-next__text">
                                {row.next_action_text || '—'}
                              </div>
                              {row.next_followup_datetime && (
                                <div className="ix-next__due">
                                  Due {formatDateTime(row.next_followup_datetime)}
                                </div>
                              )}
                            </div>
                          </td> */}
                          {/* <td>
                            <span
                              className={`ix-status ix-status--${
                                statusKey === 'completed' || statusKey === 'closed'
                                  ? 'completed'
                                  : statusKey === 'need_followup' || statusKey === 'pending'
                                    ? 'followup'
                                    : 'default'
                              }`}
                            >
                              <StatusIcon status={row.status} />
                              {String(row.status || '—').replace(/_/g, ' ')}
                            </span>
                          </td> */}
                          <td className="ix-table__actions">
                            <button
                              type="button"
                              className="ix-view-btn"
                              title="View donor"
                              onClick={() => openDonor(row)}
                            >
                              <FiEye />
                            </button>
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
    </DonorRelationshipHub>
  );
};

export default InteractionsList;
