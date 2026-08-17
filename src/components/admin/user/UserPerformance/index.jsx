import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Chart, registerables } from 'chart.js';
import axiosInstance from '../../../../utils/axios';
import { useAuth } from '../../../../context/AuthContext';
import { hasPermission } from '../../../../utils/permissions';
import Modal from '../../../common/Modal';
import { FiKey } from 'react-icons/fi';
import '../../../../styles/variables.css';
import '../../../../styles/components.css';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import { GEO_TYPE_LABELS } from '../../../../utils/geographicAssignment';
import '../GeographicAssignmentPicker/GeographicAssignmentPicker.css';
import './UserPerformance.css';

Chart.register(...registerables);

const formatLabel = (value) => {
  if (!value) return '—';
  return String(value)
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const formatDate = (dateString) => {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString();
};

const formatManager = (manager) => {
  if (!manager) return '—';
  const name = [manager.first_name, manager.last_name].filter(Boolean).join(' ');
  return name || manager.email || `User #${manager.id}`;
};

const formatAmount = (amount) => {
  if (amount == null || Number.isNaN(Number(amount))) return '—';
  return `Rs. ${Number(amount).toLocaleString()}`;
};

const DmsPeriodMetrics = ({ title, stats }) => {
  if (!stats) return null;

  return (
    <div style={{ marginTop: '1rem' }}>
      <h4 className="perf-subtitle">{title}</h4>
      <div className="perf-metrics-grid perf-metrics-grid--dms">
        <MetricCard label="Donation Boxes Assigned" value={stats.donation_boxes_assigned ?? 0} accent="blue" />
        <MetricCard label="Donation Box Collection" value={formatAmount(stats.donations_box_collection)} accent="indigo" />
        <MetricCard label="Donations Added" value={stats.donations_added ?? 0} accent="violet" />
        <MetricCard label="Donor Registered" value={stats.donor_registered ?? 0} accent="green" />
        <MetricCard label="Donation Boxes Registered" value={stats.donation_boxes_registered ?? 0} accent="amber" />
        <MetricCard label="Follow-ups" value={stats.followups ?? 0} accent="blue" />
        <MetricCard label="Follow-ups Completed" value={stats.followups_completed ?? 0} accent="green" />
        <MetricCard label="Overdue Follow-ups" value={stats.followups_overdue ?? 0} accent="red" />
        <MetricCard label="Interactions" value={stats.interactions ?? 0} accent="violet" />
        <MetricCard label="Interaction Donors" value={stats.interaction_donors ?? 0} accent="indigo" />
      </div>
    </div>
  );
};

const MetricCard = ({ label, value, accent = 'blue' }) => (
  <div className={`perf-metric-card perf-metric-card--${accent}`}>
    <span className="perf-metric-card__label">{label}</span>
    <strong className="perf-metric-card__value">{value}</strong>
  </div>
);

const StatusBadge = ({ status }) => (
  <span className={`perf-status-badge perf-status-badge--${String(status || 'open').replace(/_/g, '-')}`}>
    {formatLabel(status)}
  </span>
);

const TaskTrendChart = ({ monthlyTrend }) => {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    if (chartRef.current) chartRef.current.destroy();

    const labels = (monthlyTrend || []).map((r) => r.month);
    chartRef.current = new Chart(canvasRef.current, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Completed',
            data: (monthlyTrend || []).map((r) => r.completed),
            backgroundColor: '#22c55e',
          },
          {
            label: 'Pending',
            data: (monthlyTrend || []).map((r) => r.pending),
            backgroundColor: '#f59e0b',
          },
          {
            label: 'Overdue',
            data: (monthlyTrend || []).map((r) => r.overdue),
            backgroundColor: '#ef4444',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } },
        scales: {
          x: { stacked: true },
          y: { stacked: true, beginAtZero: true, ticks: { precision: 0 } },
        },
      },
    });

    return () => {
      if (chartRef.current) chartRef.current.destroy();
    };
  }, [monthlyTrend]);

  return (
    <div className="perf-chart-wrap">
      <canvas ref={canvasRef} />
    </div>
  );
};

const UserPerformance = () => {
  const { id } = useParams();
  const { user: authUser, permissions } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  const [revealModalOpen, setRevealModalOpen] = useState(false);
  const [revealedPassword, setRevealedPassword] = useState('');
  const [revealError, setRevealError] = useState('');
  const [revealLoading, setRevealLoading] = useState(false);

  const isOwnProfile = authUser?.id && Number(authUser.id) === Number(id);
  const backPath = isOwnProfile ? '/welcome' : `/users/${id}`;

  const canRevealPassword =
    permissions?.super_admin === true ||
    permissions?.read_only_super_admin === true ||
    hasPermission(permissions, 'admin', 'users', 'update');

  useEffect(() => {
    fetchDashboard();
  }, [id]);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/users/${id}/performance-dashboard`);
      setDashboard(response.data?.data || null);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load performance dashboard.');
    } finally {
      setLoading(false);
    }
  };

  const handleRevealPassword = async () => {
    try {
      setRevealError('');
      setRevealLoading(true);
      setRevealModalOpen(true);
      const res = await axiosInstance.get(`/users/${id}/reveal-password`);
      const password = res?.data?.data?.password || '';
      setRevealedPassword(password);
      if (!password) setRevealError(res?.data?.message || 'No password returned.');
    } catch (err) {
      setRevealError(err.response?.data?.message || 'Failed to reveal password');
    } finally {
      setRevealLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="view-wrapper">
          <PageHeader title="My Performance" backPath={backPath} />
          <div className="view-content"><div className="status-message">Loading dashboard…</div></div>
        </div>
      </>
    );
  }

  if (error || !dashboard) {
    return (
      <>
        <Navbar />
        <div className="view-wrapper">
          <PageHeader title="My Performance" backPath={backPath} />
          <div className="view-content">
            <div className="status-message status-message--error">{error || 'Dashboard unavailable'}</div>
          </div>
        </div>
      </>
    );
  }

  const { profile, overview, tasks, dms } = dashboard;

  return (
    <>
      <Navbar />
      <div className="view-wrapper user-perf-dashboard">
        <PageHeader
          title={isOwnProfile ? 'My Performance Dashboard' : `${profile.name} — Performance`}
          backPath={backPath}
          showEdit={!isOwnProfile}
          editPath={`/admin/users/edit/${profile.id}`}
        />

        <div className="view-content">
          {/* 1. Profile Summary */}
          <section className="perf-profile-card">
            <div className="perf-profile-card__main">
              <h2 className="perf-profile-card__name">{profile.name}</h2>
              <p className="perf-profile-card__email">{profile.email}</p>
              <div className="perf-profile-card__chips">
                {profile.user_code && <span className="user-view-badge user-view-badge--code">{profile.user_code}</span>}
                <span className="user-view-badge user-view-badge--department">{formatLabel(profile.department)}</span>
                <span className="user-view-badge user-view-badge--role">{formatLabel(profile.role)}</span>
                <span className={`user-view-badge ${profile.is_active ? 'user-view-badge--active' : 'user-view-badge--inactive'}`}>
                  {profile.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
            <div className="perf-profile-card__meta view-grid">
              <div className="view-item">
                <span className="view-item-label">Branch / Location</span>
                <span className="view-item-value">{profile.branch_location || '—'}</span>
              </div>
              <div className="view-item">
                <span className="view-item-label">Reporting Manager</span>
                <span className="view-item-value">{formatManager(profile.manager)}</span>
              </div>
              <div className="view-item">
                <span className="view-item-label">Joined</span>
                <span className="view-item-value">{formatDate(profile.joining_date)}</span>
              </div>
            </div>
          </section>

          {/* 2. Performance Overview */}
          <section className="perf-section">
            <h3 className="view-section-title">Performance Overview</h3>
            <div className="perf-metrics-grid">
              <MetricCard label="Completed Tasks" value={overview.completed_tasks} accent="green" />
              <MetricCard label="Pending Tasks" value={overview.pending_tasks} accent="amber" />
              <MetricCard label="Overdue Tasks" value={overview.overdue_tasks} accent="red" />
              <MetricCard label="Total Assigned" value={overview.total_assigned_tasks} accent="blue" />
              <MetricCard label="Donations Processed" value={overview.donations_processed} accent="indigo" />
              <MetricCard label="Donor Follow-ups" value={overview.donor_followups} accent="violet" />
              <MetricCard label="Performance Score" value={`${overview.performance_score}%`} accent="score" />
            </div>
          </section>

          {/* 3. Tasking Performance */}
          <section className="perf-section view-section">
            <h3 className="view-section-title">Tasking Performance</h3>
            <div className="perf-task-summary">
              <div className="perf-progress-block">
                <div className="perf-progress-header">
                  <span>Task completion</span>
                  <strong>{tasks.completion_rate}%</strong>
                </div>
                <div className="perf-progress-bar">
                  <div className="perf-progress-bar__fill" style={{ width: `${tasks.completion_rate}%` }} />
                </div>
                {tasks.avg_completion_days != null && (
                  <p className="perf-muted">Avg completion time: {tasks.avg_completion_days} day(s)</p>
                )}
              </div>
              <div className="perf-breakdown-grid">
                {Object.entries(tasks.by_status || {}).map(([status, count]) => (
                  <div key={status} className="perf-breakdown-item">
                    <StatusBadge status={status} />
                    <span>{count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="perf-two-col">
              <div>
                <h4 className="perf-subtitle">Monthly task trend</h4>
                <TaskTrendChart monthlyTrend={tasks.monthly_trend} />
              </div>
              <div>
                <h4 className="perf-subtitle">Priority breakdown</h4>
                <div className="perf-priority-list">
                  {Object.entries(tasks.by_priority || {}).map(([priority, count]) => (
                    <div key={priority} className="perf-priority-row">
                      <span>{formatLabel(priority)}</span>
                      <strong>{count}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* 4. DMS Performance */}
          {dms?.available ? (
            <section className="perf-section view-section">
              <h3 className="view-section-title">DMS Performance</h3>
              <div className="perf-metrics-grid perf-metrics-grid--dms">
                <MetricCard label="Donors Added" value={dms.donors_added} />
                <MetricCard label="Donors Assigned" value={dms.donors_assigned} />
                <MetricCard label="Donations Entered" value={dms.donations_entered} />
                <MetricCard label="Donations Completed" value={dms.donations_completed} />
                <MetricCard label="Donation Amount Handled" value={formatAmount(dms.donation_amount_handled)} accent="indigo" />
                <MetricCard label="Donation Boxes Managed" value={dms.donation_boxes_managed} />
                <MetricCard label="Box Collections Submitted" value={dms.box_collections_submitted} />
                <MetricCard label="Follow-ups Completed" value={dms.followups_completed} accent="green" />
                <MetricCard label="Pending Follow-ups" value={dms.pending_followups} accent="amber" />
                <MetricCard label="Interactions Logged" value={dms.donor_interactions_logged} />
                <MetricCard label="Approved Allotments" value={dms.approved_donation_allotments} />
                <MetricCard label="Pending Allotment Approvals" value={dms.pending_allotment_approvals} accent="red" />
                <MetricCard label="Pending Donation Recovery" value={dms.donations_pending_recovery} accent="red" />
              </div>

              <DmsPeriodMetrics title="Total View" stats={dms.period_summary?.total} />
              <DmsPeriodMetrics title="Last Month View" stats={dms.period_summary?.last_month} />
            </section>
          ) : (
            <section className="perf-section view-section">
              <h3 className="view-section-title">DMS Performance</h3>
              <p className="perf-muted">DMS metrics are available for Fund Raising department users.</p>
            </section>
          )}

          {/* Collapsible profile details */}
          <section className="view-section">
            <button type="button" className="perf-details-toggle" onClick={() => setShowDetails((v) => !v)}>
              {showDetails ? 'Hide' : 'Show'} full profile details
            </button>
            {showDetails && profile.geographic_assignments?.length > 0 && (
              <div className="user-view-geo-panel" style={{ marginTop: '1rem' }}>
                <h4 className="perf-subtitle">Geographic assignment</h4>
                <div className="geo-assignment-chips user-view-geo-chips">
                  {profile.geographic_assignments.map((item) => (
                    <span key={`${item.type}:${item.id}`} className="geo-assignment-chip user-view-geo-chip">
                      <span className="geo-assignment-chip-type">{GEO_TYPE_LABELS[item.type] || item.type}</span>
                      <span>{item.name}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>

          {canRevealPassword && !isOwnProfile && (
            <div className="form-actions" style={{ marginTop: '24px' }}>
              <button type="button" className="primary_btn" onClick={handleRevealPassword} style={{ backgroundColor: '#111827' }}>
                <FiKey style={{ marginRight: '8px' }} />
                Reveal Password
              </button>
            </div>
          )}
        </div>
      </div>

      <Modal
        open={revealModalOpen}
        onClose={() => setRevealModalOpen(false)}
        title={`User Password — ${profile.name}`}
        details={{
          Status: revealLoading ? 'Loading...' : revealError ? 'Error' : 'Success',
          ...(revealError ? { Message: revealError } : {}),
          ...(revealedPassword ? { Password: revealedPassword } : {}),
        }}
      />
    </>
  );
};

export default UserPerformance;
