import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from '../../../utils/axios';
import Navbar from '../../Navbar';
import { useAuth } from '../../../context/AuthContext';
import { getStatusLabel, normalizeStatusValue } from '../note/statusConfig';


import { 
  FaArrowUp, FaCheckCircle, FaRegClock, FaExclamationTriangle, 
  FaPhone, FaWhatsapp, FaUsers, FaHandshake, FaBullhorn, 
  FaGavel, FaEnvelope, FaHourglassHalf, FaFileAlt, FaCheck,
  FaClipboardList, FaUserCheck, FaReplyAll, FaStickyNote, FaRedo, FaBell, FaTimes, FaUser
} from 'react-icons/fa';

import EmptyState from '../common/EmptyState';
import './index.css';

const CeoDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [modalCategory, setModalCategory] = useState('');
  const [modalItems, setModalItems] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [pendingApprovalsLoading, setPendingApprovalsLoading] = useState(false);
  const [pendingApprovalsOpen, setPendingApprovalsOpen] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const pendingDropdownRef = useRef(null);

  const openCategoryModal = (catKey, items) => {
    setModalCategory(catKey);
    setModalItems(items);
  };

  const getLinkTo = (item, catKey) => {
    if (catKey === 'project_command_sheets') {
      const noteId = item.note_id || item.related_note_id || item.noteId || item.id;
      return `/ceo-office/notes/${noteId}`;
    }
    if (catKey === 'visitors') {
      const noteId = item.related_note_id || item.noteId || item.id;
      return `/ceo-office/notes/${noteId}`;
    }
    if (catKey === 'calls') {
      const noteId = item.related_note_id || item.noteId || item.id;
      return `/ceo-office/notes/${noteId}`;
    }
    if (catKey === 'whatsapp') {
      const noteId = item.related_note_id || item.noteId || item.id;
      return `/ceo-office/notes/${noteId}`;
    }
    const noteId = item.related_note_id || item.noteId || item.id;
    return `/ceo-office/notes/${noteId}`;
  };

  const getItemTitle = (item) => {
    return item.project_name || 
           item.caller_name || 
           item.contact_name || 
           item.visitor_name || 
           item.title;
  };

  const closeCategoryModal = () => {
    setModalCategory('');
    setModalItems([]);
  };

  // Category config for icons and labels
  const categoryConfig = {
    top_priority: {
      label: 'Top Priorities',
      icon: <FaArrowUp />
    },
      emails_and_approvals: {
      label: 'Emails & Approvals',
      icon: <FaEnvelope />
    },
    today_task: {
      label: "Today's Tasks",
      icon: <FaCheckCircle />
    },
    follow_up: {
      label: 'Follow-ups',
      icon: <FaRegClock />
    },
    calls: {
      label: 'Calls',
      icon: <FaPhone />
    },
    whatsapp: {
      label: 'WhatsApp',
      icon: <FaWhatsapp />
    },
    visitors: {
      label: 'Visitors',
      icon: <FaUsers />
    },
    meetings: {
      label: 'Meetings',
      icon: <FaHandshake />
    },
    ceo_direct_orders: {
      label: 'CEO Direct Orders',
      icon: <FaBullhorn />
    },
    important_decisions: {
      label: 'Important Decisions',
      icon: <FaGavel />
    },
    waiting_response: {
      label: 'Waiting Response',
      icon: <FaHourglassHalf />
    },
      project_notes: {
      label: 'Project Notes',
      icon: <FaFileAlt />
    },
    project_command_sheets: {
      label: 'Project Command Sheets',
      icon: <FaClipboardList />
    },
    completed: {
      label: 'Completed',
      icon: <FaCheck />
    }
  };

  const categories = [
    { value: '', label: 'All Categories' },
    { value: 'top_priority', label: 'Top Priority' },
    { value: 'today_task', label: 'Today Task' },
    { value: 'follow_up', label: 'Follow-up' },
    { value: 'calls', label: 'Calls' },
    { value: 'whatsapp', label: 'WhatsApp' },
    { value: 'visitors', label: 'Visitors' },
    { value: 'meetings', label: 'Meetings' },
    { value: 'ceo_direct_orders', label: 'CEO Direct Orders' },
    { value: 'important_decisions', label: 'Important Decisions' },
    { value: 'emails_and_approvals', label: 'Emails & Approvals' },
    { value: 'waiting_response', label: 'Waiting Response' },
    { value: 'project_notes', label: 'Project Notes' },
    { value: 'project_command_sheets', label: 'Project Command Sheets' },
    { value: 'completed', label: 'Completed' },
  ];

  // Helper to get category data
  const getCategoryData = (catKey) => {
    switch (catKey) {
      case 'top_priority': return stats?.top_priority_notes || [];
      case 'today_task': return stats?.today_tasks || [];
      case 'follow_up': return stats?.follow_ups || [];
      case 'calls': return stats?.calls || [];
      case 'whatsapp': return stats?.whatsapp || [];
      case 'visitors': return stats?.visitors || [];
      case 'meetings': return stats?.meetings || [];
      case 'ceo_direct_orders': return stats?.ceo_direct_orders || [];
      case 'important_decisions': return stats?.important_decisions || [];
      case 'emails_and_approvals': return stats?.emails_and_approvals || [];
      case 'waiting_response': return stats?.waiting_response_notes || [];
      case 'project_notes': return stats?.project_notes || [];
      case 'project_command_sheets': return stats?.project_command_sheets || [];
      case 'completed': return stats?.completed_notes || [];
      default: return [];
    }
  };

  const fetchPendingApprovals = async () => {
    if (!(user?.department === 'ceo' || user?.department === 'admin')) {
      return;
    }

    try {
      setPendingApprovalsLoading(true);
      const response = await axios.get('/ceo-notes', {
        params: {
          page: 1,
          pageSize: 10,
          category: 'emails_and_approvals',
          status: 'pending',
          sortOrder: 'DESC',
        },
      });
      setPendingApprovals(response.data.data || []);
    } catch (error) {
      console.error('Failed to load pending approvals:', error);
    } finally {
      setPendingApprovalsLoading(false);
    }
  };

  const fetchDashboardStats = async (showToast = false) => {
    try {
      setLoading(true);
      setRefreshing(true);
      const params = selectedCategory ? { category: selectedCategory } : {};
      const response = await axios.get('/ceo-notes/dashboard/stats', { params });
      setStats(response.data);
      setLastUpdated(new Date());
      if (showToast) {
        toast.success('Dashboard refreshed');
      }
    } catch (error) {
      // Silently handle error
      toast.error('Failed to load dashboard stats');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const refreshAllDashboardData = async (showToast = false) => {
    await fetchDashboardStats(showToast);
    await fetchPendingApprovals();
  };

  const handleApprovalAction = async (noteId, decision) => {
    setActionLoadingId(noteId);
    try {
      await axios.post(`/ceo-notes/${noteId}/approve`, {
        decision,
        remarks:
          decision === 'clarification_requested'
            ? 'CEO requested clarification'
            : undefined,
      });
      toast.success(
        decision === 'approved'
          ? 'Approval recorded'
          : decision === 'rejected'
          ? 'Rejection recorded'
          : 'Clarification requested',
      );
      await refreshAllDashboardData();
      if (pendingApprovals.length === 1) {
        setPendingApprovalsOpen(false);
      }
    } catch (error) {
      const backendMessage = error?.response?.data?.message || error?.response?.data?.error || error?.message;
      console.error('Approval action failed:', error);
      toast.error(backendMessage || 'Failed to process approval action');
    } finally {
      setActionLoadingId(null);
    }
  };

  useEffect(() => {
    refreshAllDashboardData();

    // Poll every 60 seconds
    const intervalId = setInterval(() => refreshAllDashboardData(), 60000);

    return () => clearInterval(intervalId);
  }, [selectedCategory, user]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        pendingDropdownRef.current &&
        !pendingDropdownRef.current.contains(event.target)
      ) {
        setPendingApprovalsOpen(false);
      }
    };

    if (pendingApprovalsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [pendingApprovalsOpen]);

  useEffect(() => {
    if (pendingApprovalsOpen) {
      fetchPendingApprovals();
    }
  }, [pendingApprovalsOpen]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="loading-container">Loading...</div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="ceo-dashboard">
        <div className="dashboard-header">
          <h3>CEO Office Dashboard</h3>
          <div className="header-actions">
            <div className="form-group category-filter">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="ceo-select form-control"
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
            {/* <div className="ceo-btn-group">
              <Link to="/ceo-office/instruction-register" className="ceo-instruction-register-btn"> 
                Instruction Register
              </Link>
              <Link to="/ceo-office/quick-note" className="ceo-quick-note-btn">
                Quick Note
              </Link>
            </div> */}
          </div>
        </div>

      <div className="ceo-dashboard-toolbar">
        <div className="ceo-dashboard-toolbar-meta">
            {(user?.department === 'ceo' || user?.department === 'admin') && (
              <div className="ceo-approval-bell-wrapper" ref={pendingDropdownRef}>
                <button
                  type="button"
                  className="ceo-approval-bell-btn"
                  onClick={() => setPendingApprovalsOpen((prev) => !prev)}
                >
                  <FaBell />
                  {(stats?.summary?.pending_approvals > 0 || pendingApprovals.length > 0) && (
                    <span className="approval-badge">
                      {stats?.summary?.pending_approvals ?? pendingApprovals.length}
                    </span>
                  )}
                </button>
                {pendingApprovalsOpen && (
                  <div className="approval-dropdown">
                    <div className="approval-dropdown-header">
                      <div>
                        <strong>Emails & Approvals</strong>
                        <div className="approval-dropdown-subtitle">
                          Pending CEO actions
                        </div>
                      </div>
                      <span className="approval-dropdown-count">
                        {stats?.summary?.pending_approvals || 0}
                      </span>
                    </div>
                    <div className="approval-dropdown-list">
                      {pendingApprovalsLoading ? (
                        <div className="approval-empty-state">Loading...</div>
                      ) : pendingApprovals.length === 0 ? (
                        <div className="approval-empty-state">
                          No pending approval requests.
                        </div>
                      ) : (
                        pendingApprovals.map((note) => (
                          <div
                            key={note.id}
                            className="approval-item approval-item-clickable"
                            onClick={() => {
                              navigate(`/ceo-office/notes/${note.id}`);
                              setPendingApprovalsOpen(false);
                            }}
                          >
                            <div className="approval-item-main">
                              <div className="approval-item-title">{note.title}</div>
                              <div className="approval-item-meta">
                                <span>{note.approval_requested_by || 'Unknown requester'}</span>
                                <span>{note.priority ? note.priority.toUpperCase() : 'N/A'}</span>
                                <span>{new Date(note.created_at).toLocaleString()}</span>
                              </div>
                            </div>
                            <div className="approval-item-actions">
                              <button
                                type="button"
                                className="approval-btn approval-btn-approve"
                                disabled={actionLoadingId === note.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleApprovalAction(note.id, 'approved');
                                }}
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                className="approval-btn approval-btn-reject"
                                disabled={actionLoadingId === note.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleApprovalAction(note.id, 'rejected');
                                }}
                              >
                                Reject
                              </button>
                              <button
                                type="button"
                                className="approval-btn approval-btn-clarify"
                                disabled={actionLoadingId === note.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleApprovalAction(note.id, 'clarification_requested');
                                }}
                              >
                                Clarify
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    {/* <div className="approval-dropdown-footer">
                      <Link to="/ceo-office/instruction-register">View all approvals</Link>
                    </div> */}
                  </div>
                )}
              </div>
            )}

          {/* <span className="ceo-dashboard-meta-pill">
            {selectedCategory ? `Focused on ${categoryConfig[selectedCategory]?.label || 'selected category'}` : 'Showing all categories'}
          </span> */}
        </div>
        <button
          type="button"
          className="ceo-refresh-btn"
          onClick={() => refreshAllDashboardData(true)}
          disabled={refreshing}
        >
          <FaRedo className={refreshing ? 'ceo-refresh-spin' : ''} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="ceo-stats-grid">
        {/* {(user?.department === 'ceo' || user?.department === 'admin') && (
          <div 
            className={`stat-card pending-approvals-card ${(stats?.summary?.pending_approvals || 0) > 0 ? 'pending-approvals-active' : ''}`}
            onClick={() => setSelectedCategory('emails_and_approvals')}
            style={{ cursor: 'pointer' }}
          >
            <FaUserCheck className="ceo-stat-icon pending" />
            <div className="stat-label">Pending Approvals</div>
            <div className="stat-value">{stats?.summary?.pending_approvals || 0}</div>
          </div>
        )} */}
        <div className={`stat-card warning ${(stats?.summary?.overdue_follow_ups || 0) > 0 ? 'stat-card-overdue' : ''}`}>
          <FaExclamationTriangle className="ceo-stat-icon follow_up" />
          <div className="stat-label">Overdue Follow-ups</div>
          <div className="stat-value">{stats?.summary?.overdue_follow_ups || 0}</div>
        </div>
        <div className="stat-card">
          <FaReplyAll className="ceo-stat-icon waiting_response" />
          <div className="stat-label">Waiting Responses</div>
          <div className="stat-value">{stats?.summary?.waiting_responses || 0}</div>
        </div>
        <div className="stat-card">
          <FaStickyNote className="ceo-stat-icon project_notes" />
          <div className="stat-label">Unprocessed Notes</div>
          <div className="stat-value">{stats?.summary?.unprocessed_notes || 0}</div>
        </div>
        <div className="stat-card">
          <FaClipboardList className="ceo-stat-icon follow_up" />
          <div className="stat-label">Project Sheets</div>
          <div className="stat-value">{stats?.summary?.total_project_sheets || 0}</div>
        </div>
        <div className="stat-card">
          <FaUsers className="ceo-stat-icon waiting_response" />
          <div className="stat-label">Total Visitors</div>
          <div className="stat-value">{stats?.summary?.total_visitors || 0}</div>
        </div>
      </div>

      {/* Project Alerts Section - shows overdue items */}
      {/* {(stats?.summary?.overdue_follow_ups || 0) > 0 && (
        <div className="ceo-dashboard-card category-project_alerts" style={{ borderLeft: '4px solid #dc3545', marginBottom: '16px' }}>
          <div className="ceo-dashboard-card-header" style={{ cursor: 'pointer' }} onClick={() => navigate('/ceo-office/instruction-register')}>
            <h2><span className="card-header-icon"><FaExclamationTriangle /></span> Project Alerts</h2>
            <span className="card-count-badge" style={{ backgroundColor: '#dc3545' }}>{stats.summary.overdue_follow_ups}</span>
          </div>
          <div className="ceo-dashboard-card-body">
            <p style={{ color: '#dc3545', fontWeight: '500', padding: '8px 0' }}>
              {stats.summary.overdue_follow_ups} overdue item{stats.summary.overdue_follow_ups > 1 ? 's' : ''} requiring attention.
            </p>
          </div>
        </div>
      )} */}

      {/* Dashboard Card Grid */}
      <div className="ceo-dashboard-card-grid">
        {Object.entries(categoryConfig).map(([catKey, config]) => {
          if (selectedCategory && selectedCategory !== catKey) return null;

          const items = getCategoryData(catKey);
          const count = items.length;

          const getLinkTo = (item, catKey) => {
            if (catKey === 'project_command_sheets') {
              const noteId = item.note_id || item.related_note_id || item.noteId || item.id;
              return `/ceo-office/notes/${noteId}`;
            }
            if (catKey === 'visitors') {
              const noteId = item.related_note_id || item.noteId || item.id;
              return `/ceo-office/notes/${noteId}`;
            }
            if (catKey === 'calls') {
              const noteId = item.related_note_id || item.noteId || item.id;
              return `/ceo-office/notes/${noteId}`;
            }
            if (catKey === 'whatsapp') {
              const noteId = item.related_note_id || item.noteId || item.id;
              return `/ceo-office/notes/${noteId}`;
            }
            const noteId = item.related_note_id || item.noteId || item.id;
            return `/ceo-office/notes/${noteId}`;
          };

          const getItemTitle = (item) => {
            return item.project_name || 
                   item.caller_name || 
                   item.contact_name || 
                   item.visitor_name || 
                   item.title;
          };

          const getAddLink = () => `/ceo-office/quick-note?category=${catKey}`;

          return (
            <div 
              key={catKey}
              className={`ceo-dashboard-card category-${catKey}`}
            >
              {/* Card Header */}
              <div 
                className="ceo-dashboard-card-header"
              >
                <h2>
                  <span className="card-header-icon">{config.icon}</span>
                  {config.label}
                </h2>
                <span className="card-count-badge">
                  {count}
                </span>
              </div>

              {/* Card Body */}
              <div className="ceo-dashboard-card-body">
                {items.length > 0 ? (
                  <>
                    <div className="notes-list">
                      {items.slice(0, 3).map(item => (
                        <Link
                          to={getLinkTo(item, catKey)}
                          key={item.id}
                          className="card-note-item"
                        >
                          <div className="note-content-left">
                            <div className="note-title">
                              {getItemTitle(item)}
                            </div>
                          </div>
                          <span className={`dashboard-note-status ${normalizeStatusValue(item.status || 'pending')}`}>
                            {getStatusLabel(item.status)}
                          </span>
                        </Link>
                      ))}
                    </div>
                    {items.length > 3 && (
                      <button 
                        className="see-more-btn"
                        onClick={(e) => {
                          e.preventDefault();
                          openCategoryModal(catKey, items);
                        }}
                      >
                        {`View All`}
                      </button>
                    )}
                  </>
                ) : 
                (
                  <EmptyState
                    title={`No ${config.label.toLowerCase()} yet`}
                  />
                )}
              </div>

              {/* Card Footer */}
              {/* <div className="ceo-dashboard-card-footer">
                <Link to={getAddLink()} className="add-note-link">
                  + Add
                </Link>
              </div> */}
            </div>
          );
        })}
      </div>
      {modalCategory && createPortal(
        <div className="ceo-modal-overlay" onClick={closeCategoryModal}>
          <div className="ceo-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ceo-modal-header">
              <div className="ceo-modal-header-left">
                <div className="modal-header-icon">{categoryConfig[modalCategory]?.icon}</div>
                <div className="modal-header-text">
                  <h3>{categoryConfig[modalCategory]?.label || 'Items'}</h3>
                  <span className="modal-record-badge">{modalItems.length} record{modalItems.length === 1 ? '' : 's'}</span>
                </div>
              </div>
              <button
                type="button"
                className="ceo-modal-close-circle"
                onClick={closeCategoryModal}
                aria-label="Close"
              >
                <FaTimes />
              </button>
            </div>

            <div className="ceo-modal-list">
              {modalItems.map((item) => (
                <Link
                  key={item.id}
                  to={getLinkTo(item, modalCategory)}
                  className="ceo-modal-item"
                  onClick={closeCategoryModal}
                >
                  <div className="modal-item-left">
                    <div className="modal-item-text">
                      <div className="note-title">{getItemTitle(item)}</div>
                      <div className="note-meta">
                        <span className="note-meta-small">{item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}</span>
                      </div>
                    </div>
                  </div>
                  <div className="modal-item-right">
                    <span className={`status-pill status-${(item.status || 'pending').toLowerCase().replace(/\s+/g, '-')}`}>
                      {(item.status || 'Pending').toString().replace(/_/g, ' ')}
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            <div className="ceo-modal-footer">
              <button type="button" className="ceo-modal-action-btn" onClick={closeCategoryModal}>Close</button>
            </div>
          </div>
        </div>,
        document.body,
      )}
      </div>
    </>
  );
};

export default CeoDashboard;
