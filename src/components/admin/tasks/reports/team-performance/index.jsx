
import React, { useState, useMemo, useCallback } from 'react';
import { FaUserClock, FaClipboard, FaSpinner, FaCheckCircle, FaExclamationTriangle, FaChartLine, FaUserCircle } from 'react-icons/fa';
import axiosInstance from '@/utils/axios';
import './index.css';

const TeamPerformance = ({ 
  taskAggregates, 
  currentUser, 
  duration, 
  getDateRangeForDuration 
}) => {
  // State management
  const [teamSearchQuery, setTeamSearchQuery] = useState('');
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [selectedMemberTasks, setSelectedMemberTasks] = useState(null);
  const [showMemberTasksModal, setShowMemberTasksModal] = useState(false);
  const [memberTasksLoading, setMemberTasksLoading] = useState(false);

  // Helper functions
  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const getStatusConfig = (status, task) => {
    const s = (status || 'open').toLowerCase();
    if (s === 'completed' || s === 'closed') return { icon: '✓', label: 'Completed', class: 'completed' };
    if (s === 'in_progress') return { icon: '🔄', label: 'In Progress', class: 'in-progress' };
    if (s === 'overdue' || (task.due_date && new Date(task.due_date) < new Date() && s !== 'completed' && s !== 'closed'))
      return { icon: '⚠️', label: 'Overdue', class: 'overdue' };
    return { icon: '⏳', label: String(status).split('_').map(w => w ? w[0].toUpperCase() + w.slice(1) : '').join(' '), class: s.replace('_', '-') };
  };

  const getOverdueDays = (dueDate) => {
    if (!dueDate) return 0;
    const diff = new Date() - new Date(dueDate);
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  };

  // Filtered team members (exclude current user)
  const filteredTeamMembers = useMemo(() => {
    if (!taskAggregates.users) return [];

    const currentUserId = Number(currentUser?.id);
    const teamWithoutCurrentUser = taskAggregates.users.filter(member => {
      const memberId = Number(member.id || member.user_id || member.userId);
      return memberId !== currentUserId;
    });

    if (!teamSearchQuery.trim()) return teamWithoutCurrentUser;

    const query = teamSearchQuery.toLowerCase();
    return teamWithoutCurrentUser.filter(member =>
      member.label.toLowerCase().includes(query) ||
      (member.role && member.role.toLowerCase().includes(query))
    );
  }, [taskAggregates.users, teamSearchQuery, currentUser?.id]);

  // Team summary
  const teamSummary = useMemo(() => {
    const list = filteredTeamMembers;
    const members = list.length;
    const totalTasks = list.reduce((sum, m) => sum + (Number(m.count) || 0), 0);
    const completed = list.reduce((sum, m) => sum + (Number(m.completed_count) || 0), 0);
    const inProgress = list.reduce((sum, m) => sum + (Number(m.in_progress_count) || 0), 0);
    const overdue = list.reduce((sum, m) => sum + (Number(m.overdue_count) || 0), 0);
    const avgRateRaw = members > 0 ? (list.reduce((s, m) => s + (Number(m.rate) || 0), 0) / members) : 0;
    const avgRate = Math.round(avgRateRaw);
    return { members, totalTasks, completed, inProgress, overdue, avgRate };
  }, [filteredTeamMembers]);

  // Handle showing member tasks
  const handleShowMemberTasks = useCallback(async (member) => {
    setSelectedMemberTasks({ member, tasks: [] });
    setShowMemberTasksModal(true);
    setMemberTasksLoading(true);

    try {
      const range = getDateRangeForDuration(duration);
      const memberId = member.id || member.user_id || member.userId;

      if (!memberId) {
        setMemberTasksLoading(false);
        return;
      }

      const payload = {
        pagination: { page: 1, pageSize: 100 },
        filters: {
          start_date: range.from,
          end_date: range.to,
          assignee_id: memberId
        }
      };

      const res = await axiosInstance.post('/tasks/search', payload);
      const tasks = Array.isArray(res.data?.data)
        ? res.data.data
        : Array.isArray(res.data?.data?.data)
          ? res.data.data.data
          : [];

      setSelectedMemberTasks(prev => ({
        ...prev,
        tasks
      }));
    } catch (e) {
      console.error('Error fetching member tasks:', e);
    } finally {
      setMemberTasksLoading(false);
    }
  }, [duration, getDateRangeForDuration]);

  // Render functions
  const renderTaskCard = (task) => {
    const statusConfig = getStatusConfig(task.status, task);
    const overdueDays = getOverdueDays(task.due_date);

    return (
      <div key={task.id} className={`team-perf-modal-task-item status-${statusConfig.class}`}>
        <div className="team-perf-modal-task-main">
          <div className="team-perf-modal-task-title">{task.title}</div>
          <div className={`team-perf-modal-task-status team-perf-modal-task-status-${statusConfig.class}`}>
            {statusConfig.icon} {statusConfig.label}
          </div>
        </div>
        <div className="team-perf-modal-task-details">
          <div className="team-perf-modal-task-detail-item">
            Priority: <span className={`priority-${(task.priority || 'medium').toLowerCase()}`}>{(task.priority || 'MEDIUM').toUpperCase()}</span>
          </div>
          <div className="team-perf-modal-task-detail-item">
            Department: {task.department || 'N/A'}
          </div>
          <div className="team-perf-modal-task-detail-item">
            Due Date: {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'N/A'}
          </div>

          {statusConfig.class === 'completed' && (task.completed_date || task.completed_at) && (
            <div className="team-perf-modal-task-detail-item">
              Completed: {new Date(task.completed_date || task.completed_at).toLocaleDateString()}
            </div>
          )}

          {statusConfig.class === 'in_progress' && task.progress !== undefined && (
            <div className="team-perf-modal-task-detail-item">
              Progress: {task.progress}%
            </div>
          )}

          {statusConfig.class === 'overdue' && overdueDays > 0 && (
            <div className="team-perf-modal-task-detail-item">
              Days Overdue: {overdueDays}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="team-perf-card">
        <div className="team-perf-header">
          <div className="team-perf-title-group">
            <FaUserClock className="team-perf-icon" />
            <h2 className="team-perf-title">Team Performance Dashboard</h2>
          </div>
          <div className="team-perf-header-actions">
            <div className={`team-perf-search-wrapper ${mobileSearchOpen ? 'team-perf-search-wrapper-open' : ''}`}>
              <span
                className="team-perf-search-icon"
                onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              >🔍</span>
              <input
                type="text"
                className="team-perf-search-input"
                placeholder="Search team members..."
                value={teamSearchQuery}
                onChange={(e) => setTeamSearchQuery(e.target.value)}
              />
            </div>
            <span className="team-perf-active-badge">
              {filteredTeamMembers.length} Active Members
            </span>
          </div>
        </div>

        <div className="team-perf-summary">
                  <div className="team-perf-summary-item">
                    <div className="team-perf-summary-value">
                      <FaUserClock className="stat-icon" style={{ color: '#808e9b' }} />
                      {teamSummary.members}
                      <div className="team-perf-summary-label">Team Members</div>
                    </div>
                  </div>
                  <div className="team-perf-summary-item">
                    <div className="team-perf-summary-value">
                      <FaClipboard className="stat-icon" style={{ color: '#077af5' }} />
                      {teamSummary.totalTasks}
                      <div className="team-perf-summary-label">Total Tasks</div>
                    </div>
                  </div>
                  <div className="team-perf-summary-item">
                    <div className="team-perf-summary-value">
                      <FaSpinner className="stat-icon" style={{ color: '#fccf3a' }} />
                      {teamSummary.inProgress}
                      <div className="team-perf-summary-label">In Progress</div>
                    </div>
                  </div>
                  <div className="team-perf-summary-item">
                    <div className="team-perf-summary-value">
                      <FaCheckCircle className="stat-icon" style={{ color: '#0feb42' }} />
                      {teamSummary.completed}
                      <div className="team-perf-summary-label">Completed</div>
                    </div>
                  </div>
                  <div className="team-perf-summary-item">
                    <div className="team-perf-summary-value">
                      <FaExclamationTriangle className="stat-icon" style={{ color: '#ff3f34' }} />
                      {teamSummary.overdue}
                      <div className="team-perf-summary-label">Overdue</div>
                    </div>
                  </div>
                  <div className="team-perf-summary-item">
                    <div className="team-perf-summary-value">
                      <FaChartLine className="stat-icon" style={{ color: '#077af5' }} />
                      {teamSummary.avgRate}%
                      <div className="team-perf-summary-label">Completion</div>
                    </div>
                  </div>
                </div>

        <div className="team-perf-grid">
          {filteredTeamMembers.length > 0 ? (
            filteredTeamMembers.map((member, index) => (
              <div key={index} className="team-perf-member-card">
                <div className="team-perf-member-header">
                  <div className="team-perf-member-avatar">
                    <FaUserCircle size={40} />
                  </div>
                  <div className="team-perf-member-info">
                    <div className="team-perf-member-name">{member.label}</div>
                    <div className="team-perf-member-role">
                      {String(member.role || 'User').split('_').map(w => w ? w[0].toUpperCase() + w.slice(1) : '').join(' ')}
                    </div>
                  </div>
                </div>
                <div className="team-perf-member-stats">
                  <div className="team-perf-stat-item team-perf-stat-item-total">
                    <div className="team-perf-stat-value">{member.count}</div>
                    <div className="team-perf-stat-label">Total Tasks</div>
                  </div>
                  <div className="team-perf-stat-item team-perf-stat-item-in-progress">
                    <div className="team-perf-stat-value">{member.in_progress_count || 0}</div>
                    <div className="team-perf-stat-label">In Progress</div>
                  </div>
                  <div className="team-perf-stat-item team-perf-stat-item-completed">
                    <div className="team-perf-stat-value">{member.completed_count || 0}</div>
                    <div className="team-perf-stat-label">Completed</div>
                  </div>
                  <div className="team-perf-stat-item team-perf-stat-item-overdue">
                    <div className="team-perf-stat-value">{member.overdue_count || 0}</div>
                    <div className="team-perf-stat-label">Overdue</div>
                  </div>
                </div>
                <div className="team-perf-member-progress-group">
                  <div className="team-perf-member-progress-label">
                    <span>📈 Completion Rate</span>
                    <span>{member.rate || 0}%</span>
                  </div>
                  <div className="team-perf-member-progress-container">
                    <div
                      className="team-perf-member-progress-bar"
                      style={{ width: `${member.rate || 0}%` }}
                    ></div>
                  </div>
                </div>
                <div className="team-perf-member-footer-actions">
                  <button
                    className="team-perf-view-details-btn"
                    onClick={() => handleShowMemberTasks(member)}
                  >
                    📋 View Details ({member.count} Tasks)
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="team-perf-empty-search">
              No team members found matching "{teamSearchQuery}"
            </div>
          )}
        </div>
      </div>

      {/* Task Details Modal */}
      {showMemberTasksModal && selectedMemberTasks && (
        <div className="team-perf-modal-overlay" onClick={() => setShowMemberTasksModal(false)}>
          <div className="team-perf-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="team-perf-modal-header">
              <div className="team-perf-modal-header-left">
                <div className="team-perf-modal-avatar">
                  {getInitials(selectedMemberTasks.member.label || selectedMemberTasks.member.name)}
                </div>
                <div className="team-perf-modal-user-info">
                  <h3 className="team-perf-modal-user-name">{selectedMemberTasks.member.label || selectedMemberTasks.member.name || 'User'}</h3>
                  <span className="team-perf-modal-user-role">{selectedMemberTasks.member.role || 'User'}</span>
                </div>
              </div>
              <div className="team-perf-modal-header-right">
                <button className="team-perf-modal-close" onClick={() => setShowMemberTasksModal(false)}>×</button>
              </div>
            </div>

            <div className="team-perf-modal-body">
              <div className="team-perf-modal-stats">
                <div className="team-perf-modal-stat-item">
                  <div className="team-perf-modal-stat-value">{selectedMemberTasks.member.count}</div>
                  <div className="team-perf-modal-stat-label">Total Tasks</div>
                </div>
                <div className="team-perf-modal-stat-item">
                  <div className="team-perf-modal-stat-value team-perf-modal-stat-value-in-progress">
                    {selectedMemberTasks.member.in_progress_count || 0}
                  </div>
                  <div className="team-perf-modal-stat-label">In Progress</div>
                </div>
                <div className="team-perf-modal-stat-item">
                  <div className="team-perf-modal-stat-value team-perf-modal-stat-value-completed">
                    {selectedMemberTasks.member.completed_count || 0}
                  </div>
                  <div className="team-perf-modal-stat-label">Completed</div>
                </div>
                <div className="team-perf-modal-stat-item">
                  <div className="team-perf-modal-stat-value team-perf-modal-stat-value-overdue">
                    {selectedMemberTasks.member.overdue_count || 0}
                  </div>
                  <div className="team-perf-modal-stat-label">Pending/Overdue</div>
                </div>
                <div className="team-perf-modal-stat-item">
                  <div className="team-perf-modal-stat-value">{selectedMemberTasks.member.rate || 0}%</div>
                  <div className="team-perf-modal-stat-label">Completion Rate</div>
                </div>
              </div>

              <div className="team-perf-modal-task-list-section">
                <h4 className="team-perf-modal-section-title">📋 Task List ({selectedMemberTasks.tasks.length} Tasks)</h4>
                <div className="team-perf-modal-task-list">
                  {memberTasksLoading ? (
                    <div className="team-perf-modal-loading">
                      <div className="team-perf-loading-spinner"></div>
                      <p>Loading member tasks...</p>
                    </div>
                  ) : selectedMemberTasks.tasks.length > 0 ? (
                    selectedMemberTasks.tasks.map(renderTaskCard)
                  ) : (
                    <div className="team-perf-modal-empty">No tasks found for this member.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TeamPerformance;
