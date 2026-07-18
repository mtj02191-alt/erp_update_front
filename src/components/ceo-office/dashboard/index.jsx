import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from '../../../utils/axios';
import Navbar from '../../Navbar';
import { useAuth } from '../../../context/AuthContext';



import { 
  FaArrowUp, FaCheckCircle, FaRegClock, FaExclamationTriangle, 
  FaPhone, FaWhatsapp, FaUsers, FaHandshake, FaBullhorn, 
  FaGavel, FaEnvelope, FaHourglassHalf, FaFileAlt, FaCheck,
  FaClipboardList, FaUserCheck, FaReplyAll, FaStickyNote
} from 'react-icons/fa';

import './index.css';

const CeoDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [expandedCategories, setExpandedCategories] = useState({});

  // Toggle expanded state for a category
  const toggleExpandCategory = (catKey) => {
    setExpandedCategories(prev => ({
      ...prev,
      [catKey]: !prev[catKey]
    }));
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

  useEffect(() => {
    fetchDashboardStats();
    
    // Poll every 30 seconds
    const intervalId = setInterval(fetchDashboardStats, 30000);
    
    return () => clearInterval(intervalId);
  }, [selectedCategory]);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const params = selectedCategory ? { category: selectedCategory } : {};
      console.log('Fetching dashboard stats with params:', params);
      const response = await axios.get('/ceo-notes/dashboard/stats', { params });
      console.log('Dashboard response:', response.data);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      toast.error('Failed to load dashboard stats');
    } finally {
      setLoading(false);
    }
  };

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
            <div className="ceo-btn-group">
              <Link to="/ceo-office/quick-note" className="ceo-quick-note-btn">
                Quick Note
              </Link>
              <Link to="/ceo-office/instruction-register" className="ceo-instruction-register-btn"> 
                Instruction Register
              </Link>
              <Link to="/ceo-office/project-command-sheets" className="ceo-project-command-sheets-btn">
                Project Command Sheets
              </Link>
              <Link to="/ceo-office/visitors" className="ceo-visitors-btn">
                Visitors / Calls
              </Link>
            </div>
          </div>
        </div>

      {/* Stats Cards */}
      <div className="ceo-stats-grid">
        {(user?.department === 'ceo' || user?.department === 'admin') && (
          <div 
            className={`stat-card pending-approvals-card ${(stats?.summary?.pending_approvals || 0) > 0 ? 'pending-approvals-active' : ''}`}
            onClick={() => setSelectedCategory('emails_and_approvals')}
            style={{ cursor: 'pointer' }}
          >
            <FaUserCheck className="ceo-stat-icon pending" />
            <div className="stat-label">Pending Approvals</div>
            <div className="stat-value">{stats?.summary?.pending_approvals || 0}</div>
          </div>
        )}
        <div className="stat-card warning">
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

      {/* Dashboard Card Grid */}
      <div className="ceo-dashboard-card-grid">
        {Object.entries(categoryConfig).map(([catKey, config]) => {
          if (selectedCategory && selectedCategory !== catKey) return null;

          const items = getCategoryData(catKey);
          const count = items.length;

          const getLinkTo = (item) => {
            if (catKey === 'project_command_sheets') {
              return `/ceo-office/project-command-sheets/${item.id}`;
            }
            if (item.source === 'visitor-record') {
              return `/ceo-office/visitors/${item.id}`;
            }
            return `/ceo-office/notes/${item.id}`;
          };

          const getItemTitle = (item) => {
        return item.project_name || 
               item.caller_name || 
               item.contact_name || 
               item.visitor_name || 
               item.title;
      };

          const getAddLink = () => {
            if (catKey === 'project_command_sheets') {
              return '/ceo-office/project-command-sheets';
            }
            if (catKey === 'visitors') {
              return '/ceo-office/visitors';
            }
            // Pass the category as a query parameter for quick note
            return `/ceo-office/quick-note?category=${catKey}`;
          };

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
                      {(expandedCategories[catKey] ? items : items.slice(0, 3)).map(item => (
                        <Link
                          to={getLinkTo(item)}
                          key={item.id}
                          className="card-note-item"
                        >
                          <div className="note-content-left">
                            <div className="note-title">
                              {getItemTitle(item)}
                            </div>
                          </div>
                          <span className={`dashboard-note-status ${(item.status || 'pending').toLowerCase()}`}>
                            {item.status}
                          </span>
                        </Link>
                      ))}
                    </div>
                    {items.length > 3 && (
                      <button 
                        className="see-more-btn"
                        onClick={(e) => {
                          e.preventDefault();
                          toggleExpandCategory(catKey);
                        }}
                      >
                        {expandedCategories[catKey] ? 'See Less' : `See More (${items.length - 3} more)`}
                      </button>
                    )}
                  </>
                ) : (
                  <div className="empty-state">
                    No {config.label.toLowerCase()}
                  </div>
                )}
              </div>

              {/* Card Footer */}
              <div className="ceo-dashboard-card-footer">
                <Link to={getAddLink()} className="add-note-link">
                  + Add
                </Link>
              </div>
            </div>
          );
        })}
      </div>
      </div>
    </>
  );
};

export default CeoDashboard;
