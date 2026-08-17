import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import { useAuth } from '../../../../context/AuthContext';
import { hasPermission } from '../../../../utils/permissions';
import InteractionEditModal from './InteractionEditModal';
import {
  formatActivityType,
  formatDateTime,
  canMutateInteraction,
  RESPONSE_TYPE_OPTIONS,
} from './constants';
import {
  FiPlus,
  FiSearch,
  FiFilter,
  FiPhone,
  FiMail,
  FiEdit2,
  FiTrash2,
  FiMoreVertical,
  FiCalendar,
  FiFileText,
} from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import '../donor-relationship.css';

const getActivityTone = (type) => {
  const t = String(type || '').toLowerCase();
  if (t === 'call') return 'call';
  if (t === 'email') return 'email';
  if (t === 'whatsapp') return 'whatsapp';
  return 'note';
};

const getActivityIcon = (type) => {
  const tone = getActivityTone(type);
  if (tone === 'call') return <FiPhone />;
  if (tone === 'email') return <FiMail />;
  if (tone === 'whatsapp') return <FaWhatsapp />;
  return <FiFileText />;
};

const formatTime = (value) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

const formatDayLabel = (value) => {
  if (!value) return 'Unknown date';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return 'Unknown date';
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

const dayKey = (value) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return 'unknown';
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};

const formatResponseType = (value) =>
  RESPONSE_TYPE_OPTIONS.find((o) => o.value === value)?.label ||
  String(value || '').replace(/_/g, ' ');

const DonorCommunication = ({ donorId, donor }) => {
  const navigate = useNavigate();
  const { permissions } = useAuth();
  const canCreate = useMemo(
    () =>
      permissions?.super_admin === true ||
      hasPermission(permissions, 'fund_raising', 'donor_relationship', 'create'),
    [permissions],
  );
  const [interactions, setInteractions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingInteraction, setEditingInteraction] = useState(null);
  const [search, setSearch] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  const loadInteractions = useCallback(async () => {
    if (!donorId) return;
    try {
      setLoading(true);
      setError('');
      const [interactionsRes, logsRes] = await Promise.all([
        axiosInstance.get('/donor-relationship/interactions', {
          params: { donor_id: donorId },
        }),
        axiosInstance.get('/email-templates/communication-logs', {
          params: { donor_id: donorId, pageSize: 100 },
        }),
      ]);
      const manual = interactionsRes.data.success
        ? interactionsRes.data.data || []
        : [];
      const automated = (logsRes.data?.data || []).map((log) => ({
        id: `comm-log-${log.id}`,
        activity_type: log.channel,
        activity_datetime: log.sent_at || log.scheduled_at || log.created_at,
        user_action_text: `Template "${log.template?.name || 'Communication'}" — ${log.delivery_status}${log.error_message ? `: ${log.error_message}` : ''}`,
        donor_response_text: log.metadata?.reply || null,
        status: log.delivery_status,
        custom_activity_title: 'Automated communication',
        is_automated: true,
      }));
      if (interactionsRes.data.success) {
        setInteractions([...manual, ...automated].sort((a, b) => {
          const aTime = new Date(a.activity_datetime || a.created_at).getTime();
          const bTime = new Date(b.activity_datetime || b.created_at).getTime();
          return bTime - aTime;
        }));
      } else {
        setError(interactionsRes.data.message || 'Failed to load relationship journey');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load relationship journey');
    } finally {
      setLoading(false);
    }
  }, [donorId]);

  useEffect(() => {
    loadInteractions();
  }, [loadInteractions]);

  const filteredInteractions = useMemo(() => {
    const q = search.trim().toLowerCase();
    return interactions.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (!q) return true;
      const haystack = [
        formatActivityType(item.activity_type),
        item.custom_activity_title,
        item.user_action_text,
        item.donor_response_text,
        item.next_action_text,
        item.created_by?.name,
        item.created_by?.email,
        item.status,
        item.donor_response_type,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [interactions, search, statusFilter]);

  const groupedByDay = useMemo(() => {
    const groups = [];
    const map = new Map();
    filteredInteractions.forEach((item) => {
      const key = dayKey(item.activity_datetime || item.created_at);
      if (!map.has(key)) {
        const group = {
          key,
          label: formatDayLabel(item.activity_datetime || item.created_at),
          items: [],
        };
        map.set(key, group);
        groups.push(group);
      }
      map.get(key).items.push(item);
    });
    return groups;
  }, [filteredInteractions]);

  const handleDelete = async (item) => {
    if (item.is_automated) return;
    const { canDelete } = canMutateInteraction(permissions, item);
    if (!canDelete) return;
    if (!window.confirm('Delete this interaction? Linked open follow-ups will also be removed.')) {
      return;
    }
    try {
      setError('');
      await axiosInstance.delete(`/donor-relationship/interactions/${item.id}`);
      await loadInteractions();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete interaction');
    }
  };

  const statusOptions = useMemo(() => {
    const set = new Set(interactions.map((i) => i.status).filter(Boolean));
    return Array.from(set);
  }, [interactions]);

  return (
    <div className="donor-journey-panel">
      <div className="donor-journey-panel__toolbar">
        <div className="donor-journey-panel__heading">
          <h3 className="donor-journey-panel__title">Donor Relationship Journey</h3>
          <p className="donor-journey-panel__subtitle">
            All interactions, follow-ups and responses.
          </p>
        </div>
        <div className="donor-journey-panel__tools">
          <div className="donor-journey-search">
            <FiSearch />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search interactions..."
              aria-label="Search interactions"
            />
          </div>
          <div className="donor-journey-filter">
            <button
              type="button"
              className={`donor-journey-filter__btn${showFilter ? ' is-open' : ''}`}
              onClick={() => setShowFilter((v) => !v)}
              aria-label="Filter interactions"
              title="Filter"
            >
              <FiFilter />
            </button>
            {showFilter && (
              <div className="donor-journey-filter__menu">
                <button
                  type="button"
                  className={statusFilter === 'all' ? 'is-active' : ''}
                  onClick={() => {
                    setStatusFilter('all');
                    setShowFilter(false);
                  }}
                >
                  All statuses
                </button>
                {statusOptions.map((status) => (
                  <button
                    key={status}
                    type="button"
                    className={statusFilter === status ? 'is-active' : ''}
                    onClick={() => {
                      setStatusFilter(status);
                      setShowFilter(false);
                    }}
                  >
                    {String(status).replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            )}
          </div>
          {canCreate && (
            <button
              type="button"
              className="donor-journey-add-btn"
              onClick={() => navigate(`/dms/donor-relationship/add?donor_id=${donorId}`)}
            >
              <FiPlus />
              Add Interaction
            </button>
          )}
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      {loading && <p className="donor-journey-empty">Loading relationship journey…</p>}

      {!loading && filteredInteractions.length === 0 && !error && (
        <p className="donor-journey-empty">
          {interactions.length === 0
            ? 'No interactions recorded yet. Use “Add Interaction” to log the first contact.'
            : 'No interactions match your search or filter.'}
        </p>
      )}

      {!loading && groupedByDay.length > 0 && (
        <div className="donor-journey-timeline">
          {groupedByDay.map((group) => (
            <div key={group.key} className="donor-journey-day">
              <div className="donor-journey-day__marker">
                <span>{group.label}</span>
              </div>

              {group.items.map((item) => {
                const { canEdit, canDelete, locked } = canMutateInteraction(permissions, item);
                const tone = getActivityTone(item.activity_type);
                const isNoteLike = tone === 'note';
                const staffName =
                  item.created_by?.name || item.created_by?.email || 'Staff';

                return (
                  <article
                    key={item.id}
                    className={`donor-journey-item donor-journey-item--${tone}`}
                  >
                    <div className={`donor-journey-item__dot donor-journey-item__dot--${tone}`}>
                      {getActivityIcon(item.activity_type)}
                    </div>

                    <div className="donor-journey-card">
                      <div className="donor-journey-card__header">
                        <div className="donor-journey-card__heading">
                          <span className={`donor-journey-card__type donor-journey-card__type--${tone}`}>
                            {formatActivityType(item.activity_type)}
                            {item.custom_activity_title ? ` — ${item.custom_activity_title}` : ''}
                          </span>
                          <span className="donor-journey-card__meta">
                            {formatTime(item.activity_datetime)} by {staffName}
                            {locked && !permissions?.super_admin ? ' · Locked' : ''}
                          </span>
                        </div>
                        <div className="donor-journey-card__actions">
                          {canEdit && (
                            <button
                              type="button"
                              className="donor-journey-card__icon-btn"
                              onClick={() => setEditingInteraction(item)}
                              title="Edit"
                              aria-label="Edit interaction"
                            >
                              <FiEdit2 />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              type="button"
                              className="donor-journey-card__icon-btn donor-journey-card__icon-btn--danger"
                              onClick={() => handleDelete(item)}
                              title="Delete"
                              aria-label="Delete interaction"
                            >
                              <FiTrash2 />
                            </button>
                          )}
                          <button
                            type="button"
                            className="donor-journey-card__icon-btn"
                            aria-label="More"
                            title="More"
                          >
                            <FiMoreVertical />
                          </button>
                        </div>
                      </div>

                      {isNoteLike ? (
                        <div className="donor-journey-card__note">
                          {item.user_action_text || (
                            <span className="donor-journey-dialogue__empty">No note text</span>
                          )}
                        </div>
                      ) : (
                        <div className="donor-journey-card__shuttles">
                          <div className={`donor-journey-shuttle donor-journey-shuttle--action-${tone}`}>
                            <div className="donor-journey-shuttle__title">What did you do?</div>
                            <div className="donor-journey-shuttle__text">
                              {item.user_action_text || (
                                <span className="donor-journey-dialogue__empty">Not recorded</span>
                              )}
                            </div>
                          </div>
                          <div className={`donor-journey-shuttle donor-journey-shuttle--response-${tone}`}>
                            <div className="donor-journey-shuttle__title">Donor Response</div>
                            <div className="donor-journey-shuttle__text">
                              {item.donor_response_text || (
                                <span className="donor-journey-dialogue__empty">No response recorded</span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="donor-journey-card__footer">
                        <div className="donor-journey-card__footer-item">
                          <span className="donor-journey-card__footer-label">Status</span>
                          <span className={`donor-relationship-status ${item.status || ''}`}>
                            {String(item.status || '—').replace(/_/g, ' ')}
                          </span>
                        </div>
                        <div className="donor-journey-card__footer-item">
                          <span className="donor-journey-card__footer-label">Follow-up</span>
                          <span className="donor-journey-card__footer-value">
                            {item.next_followup_datetime ? (
                              <>
                                <FiCalendar />
                                {formatDateTime(item.next_followup_datetime)}
                              </>
                            ) : (
                              '—'
                            )}
                          </span>
                        </div>
                        <div className="donor-journey-card__footer-item">
                          <span className="donor-journey-card__footer-label">Response Type</span>
                          {item.donor_response_type ? (
                            <span className="donor-journey-response-pill">
                              {formatResponseType(item.donor_response_type)}
                            </span>
                          ) : (
                            <span className="donor-journey-card__footer-value">—</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ))}
        </div>
      )}

      <InteractionEditModal
        open={!!editingInteraction}
        interaction={editingInteraction}
        onClose={() => setEditingInteraction(null)}
        onSaved={() => loadInteractions()}
      />
    </div>
  );
};

export default DonorCommunication;
