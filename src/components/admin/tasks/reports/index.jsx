import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { FaUserCircle } from 'react-icons/fa';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import Loader from '../../../common/loader/Loader';
import { Chart, registerables } from 'chart.js';
import axiosInstance from '../../../../utils/axios';
import { departments } from '../../../../utils/admin';
import { useAuth } from '../../../../context/AuthContext';
import { getTaskPermissions, isSuperAdmin } from '../../../../utils/permissions';
import ReloadButton from '../../../common/buttons/reload';
import '../../../../styles/components.css';
import './index.css';

Chart.register(...registerables);

const getResponsiveTooltipSizes = () => {
  const width = window.innerWidth;
  if (width < 480) {
    return {
      titleFontSize: 8,
      bodyFontSize: 7,
      padding: 4,
      cornerRadius: 4,
      boxWidth: 6,
      boxHeight: 6,
      boxPadding: 1,
      caretPadding: 3,
      caretSize: 4,
      bodySpacing: 2
    };
  } else if (width < 768) {
    return {
      titleFontSize: 9,
      bodyFontSize: 8,
      padding: 5,
      cornerRadius: 5,
      boxWidth: 7,
      boxHeight: 7,
      boxPadding: 2,
      caretPadding: 4,
      caretSize: 5,
      bodySpacing: 2
    };
  } else {
    return {
      titleFontSize: 10,
      bodyFontSize: 9,
      padding: 6,
      cornerRadius: 6,
      boxWidth: 8,
      boxHeight: 8,
      boxPadding: 2,
      caretPadding: 5,
      caretSize: 5,
      bodySpacing: 3
    };
  }
};

const STATUS_LABELS = [
  'Open',
  'In Progress',
  'Pending Approval',
  'Approved',
  'Rejected',
  'Completed',
  'Closed',
  'Cancelled'
];

const STATUS_COLORS = [
  '#077af5',
  '#fccf3a',
  '#A281C7',
  '#61C0AA',
  '#ef4444',
  '#0feb42',
  '#E88073',
  '#f10a1d'
];

// Project and Program categories for filtering
const PROJECTS_LIST = [
  'MTJ Foundation',
  'Al-Hassanain College',
  'Al-Hassanain School',
  'Al-Hassanain Mudrasa',
  'Aas Lab',
  'Aas Clinics'
];

const PROGRAMS_LIST = [
  'General',
  'Health',
  'Education',
  'Clean Water',
  'Apna Ghar',
  'Disaster Relief',
  'KASB Skill Development',
  'Seeds of Change',
  'Qurbani Barai Mustehqeen',
  'Aaslab',
  'Community Service'
];

const STATUS_DOT_CLASSNAMES = [
  'task-progress-dot--open',
  'task-progress-dot--in-progress',
  'task-progress-dot--pending-approval',
  'task-progress-dot--approved',
  'task-progress-dot--rejected',
  'task-progress-dot--completed',
  'task-progress-dot--closed',
  'task-progress-dot--cancelled'
];

const DEPARTMENT_COLORS = [
  '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
  '#FF9F40', '#4D5360', '#C9CBCF', '#8E5EA2', '#3CBA9F'
];

function createOrUpdateDoughnutChart(ctx, data, chartInstanceRef) {
  const drawLabels = (chart) => {
    const ctx = chart.ctx;
    chart.data.datasets.forEach((dataset, i) => {
      const meta = chart.getDatasetMeta(i);
      meta.data.forEach((arc, index) => {
        const value = dataset.data[index];
        if (value === 0 || !arc) return;
        
        const total = dataset.data.reduce((a, b) => a + b, 0);
        const percentage = Math.round((value / total) * 100);
        
        ctx.save();
        const center = arc.getCenterPoint();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px Inter, sans-serif';
        ctx.fillText(value.toString(), center.x, center.y - 6);
        ctx.font = '10px Inter, sans-serif';
        ctx.fillText(`(${percentage}%)`, center.x, center.y + 8);
        ctx.restore();
      });
    });
  };

  if (chartInstanceRef.current) {
    chartInstanceRef.current.data = data;
    chartInstanceRef.current.update();
    return;
  }

  chartInstanceRef.current = new Chart(ctx, {
    type: 'doughnut',
    data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { 
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.parsed || 0;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = Math.round((value / total) * 100);
              return `${label}: ${value} (${percentage}%)`;
            }
          }
        }
      }
    },
    plugins: [{
      id: 'doughnutLabels',
      afterDatasetsDraw: drawLabels
    }]
  });
}

const ProjectProgramWiseReport = React.memo(({ projects }) => {
  const [projectCategory, setProjectCategory] = useState('all');
  const projectBarChartRef = useRef(null);
  const projectBarChartInstance = useRef(null);

  const filteredProjects = useMemo(() => {
    if (!projects) return [];
    let list = projects;
    
    if (projectCategory !== 'all') {
      list = list.filter(p => {
        const projectName = p.label;
        if (projectCategory === 'project') {
          return PROJECTS_LIST.includes(projectName);
        } else if (projectCategory === 'program') {
          return PROGRAMS_LIST.includes(projectName);
        }
        return true;
      });
    }
    
    return list;
  }, [projects, projectCategory]);

  const dynamicHeight = useMemo(() => {
    const projectCount = filteredProjects.length;
    if (projectCount === 0) return 380;
    // Base height for legend and axes + per-project height
    const calculated = projectCount * 55 + 150;
    return Math.max(380, Math.min(calculated, 800)); // Cap at 800px
  }, [filteredProjects.length]);

  useEffect(() => {
    if (filteredProjects.length > 0 && projectBarChartRef.current) {
      const labels = filteredProjects.map(p => p.label);

      const statusTotals = STATUS_LABELS.map((statusLabel, index) => {
        const statusKey = statusLabel.toLowerCase().replace(/\s+/g, '_');
        const total = filteredProjects.reduce((sum, project) => {
          return sum + (project.statuses && project.statuses[statusKey] ? project.statuses[statusKey] : 0);
        }, 0);
        return { statusLabel, statusKey, index, total };
      });

      const activeStatuses = statusTotals.filter(item => item.total > 0);

      const datasets = activeStatuses.map(({ statusLabel, statusKey, index }) => ({
        label: statusLabel,
        data: filteredProjects.map(p => {
          return p.statuses && p.statuses[statusKey] ? p.statuses[statusKey] : 0;
        }),
        backgroundColor: STATUS_COLORS[index],
        hoverBackgroundColor: STATUS_COLORS[index],
        borderColor: '#ffffff',
        hoverBorderColor: '#ffffff',
        borderWidth: 2.5,
        hoverBorderWidth: 3,
        borderRadius: 6,
        borderSkipped: false,
        statusKey: statusKey,
        barPercentage: 0.9,
        categoryPercentage: 0.9,
        barThickness: filteredProjects.length === 1 ? 40 : 'flex',
        maxBarThickness: 45
      }));

      const data = { labels, datasets };
      
      if (projectBarChartInstance.current) {
        projectBarChartInstance.current.data = data;
        projectBarChartInstance.current.update();
      } else {
        projectBarChartInstance.current = new Chart(
          projectBarChartRef.current.getContext('2d'),
          {
            type: 'bar',
            data,
            options: {
              indexAxis: 'y',
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  display: true,
                  position: 'bottom',
                  align: 'center',
                  labels: {
                    boxWidth: 14,
                    boxHeight: 14,
                    font: { size: 11, weight: '600', family: "'Inter', sans-serif" },
                    padding: 16,
                    usePointStyle: true,
                    pointStyle: 'rectRounded',
                    color: '#475569'
                  }
                },
                tooltip: {
                  mode: 'nearest',
                  intersect: true,
                  backgroundColor: 'rgba(15, 23, 42, 0.95)',
                  titleColor: '#fff',
                  bodyColor: '#fff',
                  borderColor: 'rgba(255, 255, 255, 0.15)',
                  borderWidth: 1,
                  cornerRadius: getResponsiveTooltipSizes().cornerRadius,
                  padding: getResponsiveTooltipSizes().padding,
                  titleFont: { size: getResponsiveTooltipSizes().titleFontSize, weight: '600', family: "'Inter', sans-serif" },
                  bodyFont: { size: getResponsiveTooltipSizes().bodyFontSize, weight: '500', family: "'Inter', sans-serif" },
                  displayColors: true,
                  callbacks: {
                    title: (context) => `📊 ${context[0].label}`,
                    label: (context) => {
                      const status = context.dataset.label;
                      const value = context.parsed.x;
                      return value > 0 ? ` ${status}: ${value} task${value !== 1 ? 's' : ''}` : null;
                    },
                    afterLabel: (context) => {
                      const projectIndex = context.dataIndex;
                      const project = filteredProjects[projectIndex];
                      if (!project || !project.tasks || project.tasks.length === 0) return null;
                      const currentStatus = context.dataset.statusKey;
                      const statusTasks = project.tasks.filter(t => (t.status || 'open') === currentStatus);
                      if (statusTasks.length === 0) return null;
                      const taskDetails = statusTasks.slice(0, 5).map(t => {
                        const assignees = t.assignee_names || 'Unassigned';
                        const dept = String(t.department || 'Unassigned').split('_').map(w => w ? w[0].toUpperCase() + w.slice(1) : '').join(' ');
                        return `• ${t.title}\n  👤 ${assignees}\n  🏢 ${dept}`;
                      });
                      const remaining = statusTasks.length > 5 ? `\n... and ${statusTasks.length - 5} more task(s)` : '';
                      return '\n📝 Task Details:\n' + taskDetails.join('\n') + remaining;
                    }
                  }
                },
              },
              scales: {
                x: {
                  stacked: true,
                  beginAtZero: true,
                  grid: { display: true, color: 'rgba(0, 0, 0, 0.04)', lineWidth: 1, drawBorder: false, borderDash: [4, 4] },
                  ticks: {
                    precision: 0,
                    font: { size: 11, weight: '600', family: "'Inter', sans-serif" },
                    color: '#475569',
                    callback: (value) => Number.isInteger(value) ? value : null
                  },
                  suggestedMax: (context) => {
                    const totals = context.chart.data.labels.map((_, idx) => {
                      return context.chart.data.datasets.reduce((sum, dataset) => {
                        return sum + (dataset.data[idx] || 0);
                      }, 0);
                    });
                    const max = Math.max(...totals);
                    return Math.max(5, Math.ceil(max * 1.2));
                  },
                  title: {
                    display: true,
                    text: 'Number of Tasks',
                    font: { size: 13, weight: '700', family: "'Inter', sans-serif" },
                    color: '#334155',
                    padding: { top: 12 }
                  }
                },
                y: {
                  stacked: true,
                  grid: { display: false, drawBorder: false },
                  ticks: {
                    autoSkip: false,
                    font: { size: 12, weight: '700', family: "'Inter', sans-serif" },
                    color: '#1e293b',
                    padding: 12,
                    crossAlign: 'far'
                  }
                }
              }
            },
            plugins: [{
              id: 'totalLabels',
              afterDatasetsDraw: (chart) => {
                const { ctx } = chart;
                const isHorizontal = chart.config.options.indexAxis === 'y';
                const chartWidth = chart.width;
                let badgeWidth = 36, badgeHeight = 22, cornerRadius = 5, fontSize = 12, padding = 8;
                if (chartWidth < 480) { badgeWidth = 28; badgeHeight = 18; cornerRadius = 4; fontSize = 10; padding = 6; }
                const lastDatasetIndex = chart.data.datasets.length - 1;
                if (lastDatasetIndex < 0) return;
                const meta = chart.getDatasetMeta(lastDatasetIndex);
                meta.data.forEach((bar, index) => {
                  let total = 0;
                  chart.data.datasets.forEach((dataset, dsIdx) => {
                    const dsMeta = chart.getDatasetMeta(dsIdx);
                    if (!dsMeta.hidden) total += (dataset.data[index] || 0);
                  });
                  if (total > 0 && bar) {
                    ctx.save();
                    let x = isHorizontal ? bar.x + padding : bar.x - badgeWidth / 2;
                    let y = isHorizontal ? bar.y - badgeHeight / 2 : bar.y - badgeHeight - padding;
                    if (x < 0) x = 4;
                    if (x + badgeWidth > chart.width) x = chart.width - badgeWidth - 4;
                    if (y < 0) y = 4;
                    if (y + badgeHeight > chart.height) y = chart.height - badgeHeight - 4;
                    ctx.shadowColor = 'rgba(0, 0, 0, 0.15)'; ctx.shadowBlur = 6;
                    ctx.fillStyle = '#ffffff';
                    ctx.beginPath();
                    ctx.roundRect(x, y, badgeWidth, badgeHeight, cornerRadius);
                    ctx.fill();
                    ctx.fillStyle = '#0f172a'; ctx.font = `600 ${fontSize}px 'Inter', sans-serif`;
                    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                    ctx.fillText(total, x + badgeWidth / 2, y + badgeHeight / 2);
                    ctx.restore();
                  }
                });
              }
            }]
          }
        );
      }
    }
    return () => {
      if (projectBarChartInstance.current) {
        projectBarChartInstance.current.destroy();
        projectBarChartInstance.current = null;
      }
    };
  }, [filteredProjects]);

  return (
    <div className="task-report-card task-report-card--project-report">
      <div className="task-report-card-header task-report-card-header--with-filter">
        <div className="task-report-header-left">
          <h2 className="task-report-card-title">Project/Program-wise Task Report</h2>
          <div className="task-report-filter-inline">
            <select
              className="task-report-category-filter"
              value={projectCategory}
              onChange={(e) => setProjectCategory(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="project">Project</option>
              <option value="program">Program</option>
            </select>
            {projectCategory !== 'all' && (
              <button
                className="task-report-filter-clear-inline"
                onClick={() => setProjectCategory('all')}
                title="Clear Filter"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="task-report-card-chart task-report-card-chart--wide" style={{ minHeight: '380px', height: `${dynamicHeight}px` }}>
        <canvas ref={projectBarChartRef}></canvas>
      </div>
    </div>
  );
});

const TaskReports = () => {
  const { user, permissions } = useAuth();
  const role = user?.role || 'user';
  const [duration, setDuration] = useState('this_year');
  const [viewType, setViewType] = useState('all'); // Default to 'all' for reports
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [taskStats, setTaskStats] = useState(null);
  const [taskStatsLoading, setTaskStatsLoading] = useState(false);
  const [taskStatsError, setTaskStatsError] = useState(null);
  const [taskAggregates, setTaskAggregates] = useState({ users: [], projects: [], avgCompletionDays: null });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [teamSearchQuery, setTeamSearchQuery] = useState('');
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [showTeamPerformance, setShowTeamPerformance] = useState(false);
  const [selectedMemberTasks, setSelectedMemberTasks] = useState(null);
  const [showMemberTasksModal, setShowMemberTasksModal] = useState(false);
  const [memberTasksLoading, setMemberTasksLoading] = useState(false);
  const [showFilterPopover, setShowFilterPopover] = useState(false);
  const [hiddenDepartments, setHiddenDepartments] = useState(new Set());
  const [hiddenStatuses, setHiddenStatuses] = useState(new Set());
  const [hiddenDoughnutStatuses, setHiddenDoughnutStatuses] = useState(new Set());
  const [hiddenDepartmentBarDepartments, setHiddenDepartmentBarDepartments] = useState(new Set());
  const [hiddenBarStatuses, setHiddenBarStatuses] = useState(new Set());
  const [hiddenUserBarStatuses, setHiddenUserBarStatuses] = useState(new Set());
  const [userReportSearchQuery, setUserReportSearchQuery] = useState('');

  const filteredTeamMembers = useMemo(() => {
    if (!taskAggregates.users) return [];

    // Exclude the logged-in user from team performance
    const currentUserId = Number(user?.id);
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
  }, [taskAggregates.users, teamSearchQuery, user?.id]);

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

  const filteredUserReportUsers = useMemo(() => {
    if (!taskAggregates.users) return [];

    if (!userReportSearchQuery.trim()) return taskAggregates.users;

    const query = userReportSearchQuery.toLowerCase();
    return taskAggregates.users.filter(user => {
      const userName = (user.label || user.name || '').toLowerCase();
      const userRole = (user.role || '').toLowerCase();
      return userName.includes(query) || userRole.includes(query);
    });
  }, [taskAggregates.users, userReportSearchQuery]);

  /** Task dashboard scope: user's department (permissions resolved against it). */
  const tasksDepartmentFromUser = useMemo(() => {
    const d = String(user?.department || '').trim().toLowerCase();
    return d;
  }, [user?.department]);

  const taskPerms = useMemo(
    () => getTaskPermissions(permissions || {}, tasksDepartmentFromUser || user?.department, user?.role),
    [permissions, user?.department, user?.role, tasksDepartmentFromUser],
  );
  const rolePerms = useMemo(() => {
    const r = String(user?.role || '').toLowerCase();
    const isAdmin = r === 'super_admin' || r === 'admin';
    return {
      scope: taskPerms.reportScope,
      canCreate: taskPerms.canCreate,
      canAssign: taskPerms.canAssign,
      canApprove: taskPerms.canApprove,
      canEditCompleted: taskPerms.canEditCompleted,
      isAdmin
    };
  }, [taskPerms, user?.role]);

  /** Org-wide task reports (all departments filter): super admins, or admin-role users in admin department. */
  const isGeneralAdminDashboard = useMemo(() => {
    const r = String(user?.role || '').toLowerCase();
    const isRoleAdmin = r === 'super_admin' || r === 'admin';
    if (!isRoleAdmin) return false;
    return (
      isSuperAdmin(permissions) ||
      r === 'super_admin' ||
      tasksDepartmentFromUser === 'admin'
    );
  }, [user?.role, permissions, tasksDepartmentFromUser]);

  const statsSummary = useMemo(() => {
    const total = taskStats?.total_tasks || 0;
    const breakdown = taskStats?.status_breakdown || {};
    const sumBy = (keys) => keys.reduce((sum, key) => sum + (breakdown[key] || 0), 0);
    const open = breakdown.open || 0;
    const draft = breakdown.draft || 0;
    const inProgress = breakdown.in_progress || 0;
    const pendingApproval = breakdown.pending_approval || 0;
    const approved = breakdown.approved || 0;
    const completed = breakdown.completed || 0;
    const closed = breakdown.closed || 0;
    const rejected = breakdown.rejected || 0;
    const cancelled = breakdown.cancelled || 0;
    const pending = sumBy(['draft', 'open', 'in_progress', 'pending_approval', 'approved', 'completed', 'rejected', 'cancelled']);
    const ended = closed;
    const completionRate = taskStats?.completion_rate || 0;
    const overdue = taskStats?.overdue_tasks || 0;
    const progressCompleted = closed;
    const progressInProgress = inProgress + pendingApproval + approved + completed;
    const progressNotStarted = open + draft;
    const active = open + inProgress + pendingApproval + approved + completed;
    const completedTotal = closed;
    return {
      total,
      pending,
      ended,
      completionRate,
      overdue,
      open,
      draft,
      inProgress,
      pendingApproval,
      approved,
      completed,
      closed,
      rejected,
      cancelled,
      active,
      completedTotal,
      progressCompleted,
      progressInProgress,
      progressNotStarted
    };
  }, [taskStats]);

  const prioritySummary = useMemo(() => {
    const breakdown = taskStats?.priority_breakdown || {};
    const low = breakdown.low || 0;
    const medium = breakdown.medium || 0;
    const high = breakdown.high || 0;
    const critical = breakdown.critical || 0;
    return {
      low,
      medium,
      high,
      critical
    };
  }, [taskStats]);

  const formattedCurrentTime = useMemo(() => {
    return currentTime.toLocaleString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }, [currentTime]);

  const durationLabel = useMemo(() => {
    switch (duration) {
      case 'today':
        return 'Today';
      case 'yesterday':
        return 'Yesterday';
      case 'this_week':
        return 'This Week';
      case 'last_week':
        return 'Last Week';
      case 'this_month':
        return 'This Month';
      case 'last_month':
        return 'Last Month';
      case 'this_year':
        return 'This Year';
      case 'last_year':
        return 'Last Year';
      default:
        return 'Custom Range';
    }
  }, [duration]);

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

  const toggleDepartmentVisibility = (dept) => {
    const newHidden = new Set(hiddenDepartments);
    if (newHidden.has(dept)) {
      newHidden.delete(dept);
    } else {
      newHidden.add(dept);
    }
    setHiddenDepartments(newHidden);
  };

  const toggleStatusVisibility = (statusLabel) => {
    const newHidden = new Set(hiddenStatuses);
    if (newHidden.has(statusLabel)) {
      newHidden.delete(statusLabel);
    } else {
      newHidden.add(statusLabel);
    }
    setHiddenStatuses(newHidden);
  };

  const toggleDonutStatusVisibility = (statusLabel) => {
    const newHidden = new Set(hiddenDoughnutStatuses);
    if (newHidden.has(statusLabel)) {
      newHidden.delete(statusLabel);
    } else {
      newHidden.add(statusLabel);
    }
    setHiddenDoughnutStatuses(newHidden);
  };

  const toggleBarDepartmentVisibility = (department) => {
    const newHidden = new Set(hiddenDepartmentBarDepartments);
    if (newHidden.has(department)) {
      newHidden.delete(department);
    } else {
      newHidden.add(department);
    }
    setHiddenDepartmentBarDepartments(newHidden);
  };

  const toggleUserBarStatusVisibility = (statusLabel) => {
    const newHidden = new Set(hiddenUserBarStatuses);
    if (newHidden.has(statusLabel)) {
      newHidden.delete(statusLabel);
    } else {
      newHidden.add(statusLabel);
    }
    setHiddenUserBarStatuses(newHidden);

    // Also toggle the dataset visibility in the Chart.js instance
    if (userBarChartInstance.current) {
      const datasets = userBarChartInstance.current.data.datasets;
      datasets.forEach((dataset, index) => {
        const datasetLabel = dataset.label;
        const meta = userBarChartInstance.current.getDatasetMeta(index);
        meta.hidden = newHidden.has(datasetLabel);
      });
      userBarChartInstance.current.update();
    }
  };

  const handleShowMemberTasks = async (member) => {
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
    } catch (err) {
      console.error('Error fetching member tasks:', err);
    } finally {
      setMemberTasksLoading(false);
    }
  };

  const completionRateChartRef = useRef(null);
  const completionRateChartInstance = useRef(null);
  const userBarChartRef = useRef(null);
  const userBarChartInstance = useRef(null);
  const departmentChartRef = useRef(null);
  const departmentCanvasRef = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (completionRateChartInstance.current) completionRateChartInstance.current.update();
      if (userBarChartInstance.current) userBarChartInstance.current.update();
      if (departmentChartRef.current) departmentChartRef.current.update();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getDateRangeForDuration = useCallback((durationValue) => {
    const today = new Date();
    const formatDateToYYYYMMDD = (date) => date.toISOString().split('T')[0];
    let from;
    let to;
    switch (durationValue) {
      case 'today': {
        from = formatDateToYYYYMMDD(today);
        to = from;
        break;
      }
      case 'yesterday': {
        const y = new Date(today);
        y.setDate(today.getDate() - 1);
        from = formatDateToYYYYMMDD(y);
        to = from;
        break;
      }
      case 'this_week': {
        const start = new Date(today);
        const dow = today.getDay();
        const diff = today.getDate() - dow + (dow === 0 ? -6 : 1);
        start.setDate(diff);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        from = formatDateToYYYYMMDD(start);
        to = formatDateToYYYYMMDD(end);
        break;
      }
      case 'last_week': {
        const start = new Date(today);
        const dow = today.getDay();
        const diff = today.getDate() - dow + (dow === 0 ? -6 : 1) - 7;
        start.setDate(diff);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        from = formatDateToYYYYMMDD(start);
        to = formatDateToYYYYMMDD(end);
        break;
      }
      case 'this_month': {
        const start = new Date(today.getFullYear(), today.getMonth(), 1);
        const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        from = formatDateToYYYYMMDD(start);
        to = formatDateToYYYYMMDD(end);
        break;
      }
      case 'last_month': {
        const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const end = new Date(today.getFullYear(), today.getMonth(), 0);
        from = formatDateToYYYYMMDD(start);
        to = formatDateToYYYYMMDD(end);
        break;
      }
      case 'this_year': {
        const start = new Date(today.getFullYear(), 0, 1);
        const end = new Date(today.getFullYear(), 11, 31);
        from = formatDateToYYYYMMDD(start);
        to = formatDateToYYYYMMDD(end);
        break;
      }
      case 'last_year': {
        const start = new Date(today.getFullYear() - 1, 0, 1);
        const end = new Date(today.getFullYear() - 1, 11, 31);
        from = formatDateToYYYYMMDD(start);
        to = formatDateToYYYYMMDD(end);
        break;
      }
      default: {
        from = formatDateToYYYYMMDD(today);
        to = from;
        break;
      }
    }
    return { from, to };
  }, []);

  const fetchTaskReports = useCallback(async () => {
    // Don't fetch if user is not loaded yet
    if (!user) return;

    setTaskStatsLoading(true);
    setTaskStatsError(null);
    try {
      const range = getDateRangeForDuration(duration);

      // Department for stats: from user context (tasksDepartmentFromUser), not from URL.
      // Org-wide when super admin / admin dept / permission super_admin; otherwise lock to user's routed department.
      const department = isGeneralAdminDashboard ? (selectedDepartment || undefined) : (tasksDepartmentFromUser || selectedDepartment || undefined);

      let statsDepartment;
      if (isGeneralAdminDashboard) {
        statsDepartment = selectedDepartment || undefined;
      } else if (tasksDepartmentFromUser) {
        statsDepartment = tasksDepartmentFromUser;
      } else if (rolePerms.scope === 'org') {
        statsDepartment = department;
      } else if (rolePerms.scope === 'department' || rolePerms.scope === 'team') {
        statsDepartment = user?.department;
      } else {
        statsDepartment = user?.department;
      }

      const apiViewType = (!rolePerms.isAdmin && viewType !== 'all' && !showTeamPerformance) ? viewType : undefined;

      const statsParams = {
        start_date: range.from,
        end_date: range.to,
        department: statsDepartment,
        view_type: apiViewType,
        user_id: user?.id // Ensure the current user context is passed
      };
      const statsRes = await axiosInstance.get('/tasks/dashboard/stats', { params: statsParams });
      const statsData = statsRes.data?.data || statsRes.data;
      setTaskStats(statsData || null);

      // Fetch user-wise and project-wise aggregates from the reports endpoint
      // Build reports params
      const reportsParams = {
        start_date: range.from,
        end_date: range.to,
        department: statsDepartment,
        view_type: apiViewType
      };

      // Ensure user_id is passed when explicitly filtering by 'created' or 'assigned'
      if (apiViewType === 'created' || apiViewType === 'assigned') {
        reportsParams.user_id = user?.id;
      }

      // When showTeamPerformance is active, we specifically want to view the team, NOT just the user's assigned tasks
      // So we do NOT send user_id for team performance mode unless we are trying to restrict the view.
      // But the backend relies on the Bearer token for currentUser anyway.

      const reportsRes = await axiosInstance.get('/tasks/reports', { params: reportsParams });
      const reportsData = reportsRes.data?.data || reportsRes.data;

      setTaskAggregates({
        users: reportsData?.users || [],
        projects: reportsData?.projects || [],
        avgCompletionDays: reportsData?.avgCompletionDays || null
      });
    } catch (e) {
      console.error('Task reports fetch error:', e);
      setTaskStatsError(e.response?.data?.message || e.message || 'Failed to fetch task reports');
    } finally {
      setTaskStatsLoading(false);
    }
  }, [duration, selectedDepartment, rolePerms.scope, rolePerms.isAdmin, user?.department, user?.id, tasksDepartmentFromUser, isGeneralAdminDashboard, permissions, viewType, showTeamPerformance, getDateRangeForDuration]);

  useEffect(() => {
    fetchTaskReports();
  }, [fetchTaskReports]);

  useEffect(() => {
    const palette = (n) => {
      const base = [
        '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
        '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'
      ];
      const colors = [];
      for (let i = 0; i < n; i++) {
        colors.push(base[i % base.length]);
      }
      return colors;
    };

    if (taskStats && completionRateChartRef.current) {
      const allStatusValues = [
        statsSummary.open || 0,
        statsSummary.inProgress || 0,
        statsSummary.pendingApproval || 0,
        statsSummary.approved || 0,
        statsSummary.rejected || 0,
        statsSummary.completed || 0,
        statsSummary.closed || 0,
        statsSummary.cancelled || 0
      ];
      
      const visibleData = STATUS_LABELS.map((label, index) => ({
        label,
        value: allStatusValues[index],
        color: STATUS_COLORS[index],
        colorClass: STATUS_DOT_CLASSNAMES[index],
        index,
        isHidden: hiddenDoughnutStatuses.has(label)
      })).filter(item => item.value > 0);
      
      const visibleLabels = visibleData.map(item => item.label);
      const visibleValues = visibleData.map(item => item.isHidden ? 0 : item.value);
      const visibleColors = visibleData.map(item => item.color);
      
      const completionData = {
        labels: visibleLabels,
        datasets: [{
          label: 'Task Status',
          data: visibleValues,
          backgroundColor: visibleColors,
          borderColor: '#ffffff',
          borderWidth: 2
        }]
      };
      
      createOrUpdateDoughnutChart(
        completionRateChartRef.current.getContext('2d'),
        completionData,
        completionRateChartInstance
      );
    }

    if (rolePerms.isAdmin && taskStats?.department_status_breakdown && departmentCanvasRef.current) {
      // First, get all departments with at least one task
      const deptsWithTasks = Object.keys(taskStats.department_status_breakdown).filter(dept => {
        const statusData = taskStats.department_status_breakdown[dept];
        const totalTasks = Object.values(statusData).reduce((sum, entry) => {
          const count = entry ? (typeof entry === 'object' ? entry.count : entry) : 0;
          return sum + count;
        }, 0);
        return totalTasks > 0;
      });

      // Create a consistent color map for departments
      const deptColorMap = {};
      deptsWithTasks.forEach((dept, index) => {
        deptColorMap[dept] = DEPARTMENT_COLORS[index % DEPARTMENT_COLORS.length];
      });

      // Filter out hidden departments
      const visibleDepts = deptsWithTasks.filter(dept => !hiddenDepartmentBarDepartments.has(dept));

      const labels = visibleDepts.map(d =>
        String(d || 'Unassigned').split('_').map(w => w ? w.toUpperCase() : '').join(' ')
      );

      const statusKeys = [
        'open',
        'in_progress',
        'pending_approval',
        'approved',
        'rejected',
        'completed',
        'closed',
        'cancelled'
      ];

      // First, calculate total count for each status across all departments
      const statusTotals = statusKeys.map((status, index) => {
        const total = visibleDepts.reduce((sum, dept) => {
          const entry = taskStats.department_status_breakdown[dept][status];
          const count = entry ? (typeof entry === 'object' ? entry.count : entry) : 0;
          return sum + count;
        }, 0);
        return { status, index, total };
      });

      // Filter out statuses with zero total across all departments
      const activeStatuses = statusTotals.filter(item => item.total > 0);

      // Create datasets only for statuses with actual data
      const datasets = activeStatuses.map(({ status, index }) => ({
        label: STATUS_LABELS[index],
        data: visibleDepts.map(dept => {
          const entry = taskStats.department_status_breakdown[dept][status];
          const count = entry ? (typeof entry === 'object' ? entry.count : entry) : 0;
          return count > 0 ? count : null;
        }),
        backgroundColor: STATUS_COLORS[index],
        hoverBackgroundColor: STATUS_COLORS[index],
        borderColor: '#ffffff',
        hoverBorderColor: '#ffffff',
        borderWidth: 2.5,
        hoverBorderWidth: 3,
        borderRadius: 6,
        borderSkipped: false,
        barPercentage: 0.85,
        categoryPercentage: 0.7,
        barThickness: 'flex',
        maxBarThickness: 80
      }));

      const data = {
        labels,
        datasets
      };

      if (departmentChartRef.current) {
        departmentChartRef.current.data = data;
        departmentChartRef.current.update();
      } else {
        departmentChartRef.current = new Chart(departmentCanvasRef.current.getContext('2d'), {
          type: 'bar',
          data,
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: true,
                position: 'bottom',
                align: 'center',
                labels: {
                  boxWidth: 14,
                  boxHeight: 14,
                  font: {
                    size: 11,
                    weight: '600',
                    family: "'Inter', sans-serif"
                  },
                  padding: 16,
                  usePointStyle: true,
                  pointStyle: 'rectRounded',
                  color: '#475569',
                  cursor: 'pointer'
                },
                onHover: (event, legendItem, legend) => {
                  event.native.target.style.cursor = 'pointer';
                },
                onLeave: (event, legendItem, legend) => {
                  event.native.target.style.cursor = 'default';
                }
              },
              tooltip: {
                mode: 'nearest',
                intersect: true,
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                titleColor: '#fff',
                bodyColor: '#fff',
                borderColor: 'rgba(255, 255, 255, 0.15)',
                borderWidth: 1,
                cornerRadius: (() => getResponsiveTooltipSizes().cornerRadius)(),
                padding: (() => getResponsiveTooltipSizes().padding)(),
                titleFont: { size: (() => getResponsiveTooltipSizes().titleFontSize)(), weight: '600', family: "'Inter', sans-serif" },
                bodyFont: { size: (() => getResponsiveTooltipSizes().bodyFontSize)(), weight: '500', family: "'Inter', sans-serif" },
                bodySpacing: (() => getResponsiveTooltipSizes().bodySpacing)(),
                displayColors: true,
                boxWidth: (() => getResponsiveTooltipSizes().boxWidth)(),
                boxHeight: (() => getResponsiveTooltipSizes().boxHeight)(),
                boxPadding: (() => getResponsiveTooltipSizes().boxPadding)(),
                caretPadding: (() => getResponsiveTooltipSizes().caretPadding)(),
                caretSize: (() => getResponsiveTooltipSizes().caretSize)(),
                filter: function (tooltipItem) {
                  return tooltipItem.raw !== null && tooltipItem.raw !== undefined && tooltipItem.raw > 0;
                },
                callbacks: {
                  title: function (context) {
                    const dept = context[0].label;
                    return `🏢 ${dept}`;
                  },
                  label: function (context) {
                    const status = context.dataset.label;
                    const value = context.parsed.y;
                    if (value === null || value === undefined || value === 0) return null;
                    return ` ${status}: ${value} task${value !== 1 ? 's' : ''}`;
                  },
                  afterLabel: function (context) {
                    const deptIndex = context.dataIndex;
                    const chart = context.chart;
                    let totalTasks = 0;

                    chart.data.datasets.forEach(dataset => {
                      const value = dataset.data[deptIndex];
                      if (value !== null && value !== undefined) {
                        totalTasks += value;
                      }
                    });

                    return `\n📊 Total: ${totalTasks} task${totalTasks !== 1 ? 's' : ''}`;
                  }
                }
              },
              datalabels: {
                anchor: 'end',
                align: 'end',
                offset: 4,
                font: {
                  size: 10,
                  weight: '700',
                  family: "'Inter', sans-serif"
                },
                color: '#ffffff',
                formatter: (value) => {
                  return value > 0 ? value : null;
                },
                display: (context) => {
                  // Don't display labels for hidden datasets
                  const meta = context.chart.getDatasetMeta(context.datasetIndex);
                  if (meta.hidden) return false;

                  const value = context.dataset.data[context.dataIndex];
                  return value > 0;
                },
                textShadowColor: 'rgba(0, 0, 0, 0.4)',
                textShadowBlur: 3
              }
            },
            scales: {
              x: {
                stacked: false,
                grid: {
                  display: false
                },
                border: {
                  display: false
                },
                ticks: {
                  font: {
                    size: 11,
                    weight: '600',
                    family: "'Inter', sans-serif"
                  },
                  color: '#475569',
                  maxRotation: 45,
                  minRotation: 45,
                  padding: 10
                }
              },
              y: {
                stacked: false,
                beginAtZero: true,
                grid: {
                  color: 'rgba(0, 0, 0, 0.04)',
                  lineWidth: 1,
                  drawBorder: false,
                  borderDash: [4, 4]
                },
                border: {
                  display: false,
                  lineWidth: 0
                },
                ticks: {
                  font: {
                    size: 11,
                    weight: '600',
                    family: "'Inter', sans-serif"
                  },
                  color: '#475569',
                  precision: 0,
                  maxTicksLimit: 10,
                  padding: 10,
                  stepSize: 1
                },
                title: {
                  display: true,
                  text: 'Number of Tasks',
                  font: {
                    size: 13,
                    weight: '700',
                    family: "'Inter', sans-serif"
                  },
                  color: '#334155',
                  padding: { top: 12 }
                },
                suggestedMax: function (context) {
                  const max = Math.max(...context.chart.data.datasets[0]?.data || [0]);
                  return Math.ceil(max * 1.18);
                }
              }
            },
            interaction: {
              mode: 'nearest',
              axis: 'xy',
              intersect: true
            },
            animation: {
              duration: 800,
              easing: 'easeOutQuart'
            }
          },
          plugins: [{
            id: 'valueLabels',
            afterDatasetsDraw: (chart) => {
              const { ctx } = chart;
              const isHorizontal = chart.config.options.indexAxis === 'y';
              const chartWidth = chart.width;

              // Dynamic badge sizing based on chart width for responsiveness
              let badgeWidth, badgeHeight, cornerRadius, fontSize, padding;

              if (chartWidth < 480) {
                // Extra small screens
                badgeWidth = 22;
                badgeHeight = 15;
                cornerRadius = 3;
                fontSize = 9;
                padding = 4;
              } else if (chartWidth < 768) {
                // Small screens
                badgeWidth = 24;
                badgeHeight = 16;
                cornerRadius = 3;
                fontSize = 10;
                padding = 4;
              } else {
                // Medium and larger screens
                badgeWidth = 26;
                badgeHeight = 17;
                cornerRadius = 3;
                fontSize = 10;
                padding = 5;
              }

              chart.data.datasets.forEach((dataset, datasetIndex) => {
                const meta = chart.getDatasetMeta(datasetIndex);

                // Skip hidden datasets (via legend toggle)
                if (meta.hidden) return;

                meta.data.forEach((bar, index) => {
                  const value = dataset.data[index];

                  // Only render label if value exists, is greater than 0, and bar element exists
                  if (value && value > 0 && bar) {
                    ctx.save();

                    let x, y;

                    if (isHorizontal) {
                      // Horizontal bar: badge at the end (right side)
                      x = bar.x + padding;
                      y = bar.y - badgeHeight / 2;
                    } else {
                      // Vertical bar: badge above the bar
                      x = bar.x - badgeWidth / 2;
                      y = bar.y - badgeHeight - padding;
                    }

                    // Ensure badge stays within chart boundaries
                    if (x < 0) x = 4;
                    if (x + badgeWidth > chart.width) x = chart.width - badgeWidth - 4;
                    if (y < 0) y = 4;
                    if (y + badgeHeight > chart.height) y = chart.height - badgeHeight - 4;

                    // Draw badge background (no border)
                    ctx.fillStyle = '#ffffff';

                    // Rounded rectangle
                    ctx.beginPath();
                    ctx.moveTo(x + cornerRadius, y);
                    ctx.lineTo(x + badgeWidth - cornerRadius, y);
                    ctx.quadraticCurveTo(x + badgeWidth, y, x + badgeWidth, y + cornerRadius);
                    ctx.lineTo(x + badgeWidth, y + badgeHeight - cornerRadius);
                    ctx.quadraticCurveTo(x + badgeWidth, y + badgeHeight, x + badgeWidth - cornerRadius, y + badgeHeight);
                    ctx.lineTo(x + cornerRadius, y + badgeHeight);
                    ctx.quadraticCurveTo(x, y + badgeHeight, x, y + badgeHeight - cornerRadius);
                    ctx.lineTo(x, y + cornerRadius);
                    ctx.quadraticCurveTo(x, y, x + cornerRadius, y);
                    ctx.closePath();
                    ctx.fill();
                    // Removed: ctx.stroke() - no border

                    // Draw value text
                    ctx.fillStyle = dataset.backgroundColor;
                    ctx.font = `bold ${fontSize}px sans-serif`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(value, x + badgeWidth / 2, y + badgeHeight / 2);

                    ctx.restore();
                  }
                });
              });
            }
          }]
        });
      }
    }

    if (filteredUserReportUsers.length > 0 && userBarChartRef.current) {
      const labels = filteredUserReportUsers.map(u => u.label);

      // Calculate total tasks per status across all users
      const statusTotals = STATUS_LABELS.map((statusLabel, index) => {
        const statusKey = statusLabel.toLowerCase().replace(/\s+/g, '_');
        const total = filteredUserReportUsers.reduce((sum, user) => {
          return sum + (user.statuses && user.statuses[statusKey] ? user.statuses[statusKey] : 0);
        }, 0);
        return { statusLabel, statusKey, index, total };
      });

      // Filter out statuses with zero tasks
      const activeStatuses = statusTotals.filter(item => item.total > 0);

      // Create a dataset only for statuses with actual data
      const datasets = activeStatuses.map(({ statusLabel, statusKey, index }) => ({
        label: statusLabel,
        data: filteredUserReportUsers.map(u => {
          const count = u.statuses && u.statuses[statusKey] ? u.statuses[statusKey] : 0;
          return count > 0 ? count : null;
        }),
        backgroundColor: STATUS_COLORS[index],
        hoverBackgroundColor: STATUS_COLORS[index],
        borderColor: 'transparent',
        hoverBorderColor: 'transparent',
        borderWidth: 0,
        hoverBorderWidth: 0,
        borderRadius: 0,
        borderSkipped: false,
        statusKey: statusKey,
        barPercentage: 0.55,
        categoryPercentage: 0.65,
        barThickness: 'flex',
        maxBarThickness: 45
      }));

      const data = {
        labels,
        datasets
      };

      if (userBarChartInstance.current) {
        userBarChartInstance.current.data = data;
        userBarChartInstance.current.update();
      } else {
        userBarChartInstance.current = new Chart(userBarChartRef.current.getContext('2d'), {
          type: 'bar',
          data,
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: false,
              },
              tooltip: {
                mode: 'nearest',
                intersect: true,
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                titleColor: '#fff',
                bodyColor: '#fff',
                borderColor: 'rgba(255, 255, 255, 0.15)',
                borderWidth: 1,
                cornerRadius: (() => getResponsiveTooltipSizes().cornerRadius)(),
                padding: (() => getResponsiveTooltipSizes().padding)(),
                titleFont: { size: (() => getResponsiveTooltipSizes().titleFontSize)(), weight: '600', family: "'Inter', sans-serif" },
                bodyFont: { size: (() => getResponsiveTooltipSizes().bodyFontSize)(), weight: '500', family: "'Inter', sans-serif" },
                bodySpacing: (() => getResponsiveTooltipSizes().bodySpacing)(),
                displayColors: true,
                boxWidth: (() => getResponsiveTooltipSizes().boxWidth)(),
                boxHeight: (() => getResponsiveTooltipSizes().boxHeight)(),
                boxPadding: (() => getResponsiveTooltipSizes().boxPadding)(),
                caretPadding: (() => getResponsiveTooltipSizes().caretPadding)(),
                caretSize: (() => getResponsiveTooltipSizes().caretSize)(),
                filter: function (tooltipItem) {
                  return tooltipItem.raw > 0;
                },
                callbacks: {
                  title: function (context) {
                    const userName = context[0].label;
                    return `👤 ${userName}`;
                  },
                  label: function (context) {
                    const status = context.dataset.label;
                    const value = context.parsed.y;
                    if (value === 0) return null;
                    return ` ${status}: ${value} task${value !== 1 ? 's' : ''}`;
                  },
                  afterLabel: function (context) {
                    const userIndex = context.dataIndex;
                    const user = filteredUserReportUsers[userIndex];

                    if (!user || !user.tasks || user.tasks.length === 0) {
                      return null;
                    }

                    const currentStatus = context.dataset.statusKey;
                    const statusTasks = user.tasks.filter(t => (t.status || 'open') === currentStatus);

                    if (statusTasks.length === 0) return null;

                    // Show task details with project names
                    const taskDetails = statusTasks.slice(0, 5).map(t => {
                      const project = t.project ? `\n  📁 ${t.project}` : '';
                      const department = t.department ? `\n  🏢 ${String(t.department).split('_').map(w => w ? w[0].toUpperCase() + w.slice(1) : '').join(' ')}` : '';
                      return `• ${t.title}${project}${department}`;
                    });

                    const remaining = statusTasks.length > 5 ? `\n... and ${statusTasks.length - 5} more task(s)` : '';

                    return '\n📝 Task Details:\n' + taskDetails.join('\n') + remaining;
                  }
                }
              },
              datalabels: {
                anchor: 'end',
                align: 'end',
                offset: 4,
                font: {
                  size: 10,
                  weight: '700',
                  family: "'Inter', sans-serif"
                },
                color: '#ffffff',
                formatter: (value) => {
                  return value > 0 ? value : null;
                },
                display: (context) => {
                  // Don't display labels for hidden datasets
                  const meta = context.chart.getDatasetMeta(context.datasetIndex);
                  if (meta.hidden) return false;

                  const value = context.dataset.data[context.dataIndex];
                  return value > 0;
                },
                textShadowColor: 'rgba(0, 0, 0, 0.4)',
                textShadowBlur: 3
              }
            },
            scales: {
              x: {
                stacked: true,
                grid: {
                  display: true,
                  color: 'rgba(0, 0, 0, 0.04)',
                  lineWidth: 1,
                  drawBorder: false,
                  borderDash: [4, 4]
                },
                border: {
                  display: false
                },
                ticks: {
                  font: {
                    size: 11,
                    weight: '600',
                    family: "'Inter', sans-serif"
                  },
                  color: '#475569',
                  maxRotation: 45,
                  minRotation: 45,
                  padding: 10
                },
                title: {
                  display: true,
                  text: 'Number of Tasks',
                  font: {
                    size: 13,
                    weight: '700',
                    family: "'Inter', sans-serif"
                  },
                  color: '#334155',
                  padding: { top: 12 }
                },
                suggestedMax: function (context) {
                  const totals = context.chart.data.labels.map((_, idx) => {
                    return context.chart.data.datasets.reduce((sum, dataset) => {
                      return sum + (dataset.data[idx] || 0);
                    }, 0);
                  });
                  const max = Math.max(...totals);
                  return Math.ceil(max * 1.18);
                }
              },
              y: {
                stacked: true,
                grid: {
                  display: false,
                  drawBorder: false
                },
                border: {
                  display: false,
                  lineWidth: 0
                },
                ticks: {
                  autoSkip: false,
                  font: {
                    size: 12,
                    weight: '700',
                    family: "'Inter', sans-serif"
                  },
                  color: '#1e293b',
                  padding: 12,
                  crossAlign: 'far'
                }
              }
            },
            animation: {
              duration: 800,
              easing: 'easeOutQuart'
            }
          },
          plugins: [{
            id: 'totalLabels',
            afterDatasetsDraw: (chart) => {
              const { ctx } = chart;
              const chartWidth = chart.width;

              // Dynamic badge sizing based on chart width for responsiveness
              let badgeWidth, badgeHeight, cornerRadius, fontSize, padding;

              if (chartWidth < 480) {
                badgeWidth = 28;
                badgeHeight = 18;
                cornerRadius = 4;
                fontSize = 10;
                padding = 6;
              } else if (chartWidth < 768) {
                badgeWidth = 32;
                badgeHeight = 20;
                cornerRadius = 4;
                fontSize = 11;
                padding = 6;
              } else {
                badgeWidth = 36;
                badgeHeight = 22;
                cornerRadius = 5;
                fontSize = 12;
                padding = 8;
              }

              // Only process the last dataset to show total at the top
              const lastDatasetIndex = chart.data.datasets.length - 1;
              if (lastDatasetIndex < 0) return;

              const meta = chart.getDatasetMeta(lastDatasetIndex);

              meta.data.forEach((bar, index) => {
                // Calculate total for this bar across only VISIBLE datasets
                let total = 0;
                chart.data.datasets.forEach((dataset, datasetIndex) => {
                  // Only count if dataset is visible (not hidden via legend)
                  const dsMeta = chart.getDatasetMeta(datasetIndex);
                  if (!dsMeta.hidden) {
                    total += (dataset.data[index] || 0);
                  }
                });

                if (total > 0 && bar) {
                  ctx.save();

                  // Position badge above the bar (top)
                  let x = bar.x - badgeWidth / 2;
                  let y = bar.y - badgeHeight - padding;

                  // Ensure badge stays within chart boundaries
                  if (x < 0) x = 4;
                  if (x + badgeWidth > chart.width) x = chart.width - badgeWidth - 4;
                  if (y < 0) y = 4;
                  if (y + badgeHeight > chart.height) y = chart.height - badgeHeight - 4;

                  // Draw badge background with shadow
                  ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
                  ctx.shadowBlur = 6;
                  ctx.shadowOffsetX = 0;
                  ctx.shadowOffsetY = 2;

                  ctx.fillStyle = '#ffffff';

                  // Rounded rectangle
                  ctx.beginPath();
                  ctx.moveTo(x + cornerRadius, y);
                  ctx.lineTo(x + badgeWidth - cornerRadius, y);
                  ctx.quadraticCurveTo(x + badgeWidth, y, x + badgeWidth, y + cornerRadius);
                  ctx.lineTo(x + badgeWidth, y + badgeHeight - cornerRadius);
                  ctx.quadraticCurveTo(x + badgeWidth, y + badgeHeight, x + badgeWidth - cornerRadius, y + badgeHeight);
                  ctx.lineTo(x + cornerRadius, y + badgeHeight);
                  ctx.quadraticCurveTo(x, y + badgeHeight, x, y + badgeHeight - cornerRadius);
                  ctx.lineTo(x, y + cornerRadius);
                  ctx.quadraticCurveTo(x, y, x + cornerRadius, y);
                  ctx.closePath();
                  ctx.fill();

                  // Reset shadow
                  ctx.shadowColor = 'transparent';
                  ctx.shadowBlur = 0;
                  ctx.shadowOffsetX = 0;
                  ctx.shadowOffsetY = 0;

                  // Draw total value text
                  ctx.fillStyle = '#0f172a';
                  ctx.font = `600 ${fontSize}px 'Inter', sans-serif`;
                  ctx.textAlign = 'center';
                  ctx.textBaseline = 'middle';
                  ctx.fillText(total, x + badgeWidth / 2, y + badgeHeight / 2);

                  ctx.restore();
                }
              });
            }
          }]
        });
      }
    }
  }, [taskStats, taskAggregates, statsSummary, rolePerms.isAdmin, hiddenDepartments, hiddenStatuses, hiddenDoughnutStatuses, hiddenDepartmentBarDepartments, filteredUserReportUsers]);

  useEffect(() => {
    return () => {
      if (completionRateChartInstance.current) {
        completionRateChartInstance.current.destroy();
        completionRateChartInstance.current = null;
      }
      if (departmentChartRef.current) {
        departmentChartRef.current.destroy();
        departmentChartRef.current = null;
      }
      if (userBarChartInstance.current) {
        userBarChartInstance.current.destroy();
        userBarChartInstance.current = null;
      }
    };
  }, []);

  const filterPopoverRef = useRef(null);
  const filterButtonRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showFilterPopover &&
        filterPopoverRef.current &&
        filterButtonRef.current &&
        !filterPopoverRef.current.contains(event.target) &&
        !filterButtonRef.current.contains(event.target)
      ) {
        setShowFilterPopover(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFilterPopover]);

  const filterButtonElement = (
    <div style={{ position: 'relative' }}>
      <button
        ref={filterButtonRef}
        className="task-filter-button"
        onClick={() => setShowFilterPopover(!showFilterPopover)}
      >
        <span className="task-filter-button-icon">🔍</span>
        <span className="task-filter-button-text">Filters</span>
      </button>
      {showFilterPopover && (
        <div ref={filterPopoverRef} className="task-filter-popover">
          <div className="task-filter-popover-content">
            <div className="task-filter-popover-header">
              <h3 className="task-filter-popover-title">Dashboard Filters</h3>
              <button
                className="task-filter-popover-close"
                onClick={() => setShowFilterPopover(false)}
              >
                ×
              </button>
            </div>
            <div className="task-filter-popover-body">
              <div className="task-filter-group">
                <span className="task-filter-label">Duration</span>
                <select
                  className="task-filter-select"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                >
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="this_week">This Week</option>
                  <option value="last_week">Last Week</option>
                  <option value="this_month">This Month</option>
                  <option value="last_month">Last Month</option>
                  <option value="this_year">This Year</option>
                  <option value="last_year">Last Year</option>
                </select>
              </div>

              {!rolePerms.isAdmin && (
                <div className="task-filter-group">
                  <span className="task-filter-label">Tasks</span>
                  <select
                    className="task-filter-select"
                    value={viewType}
                    onChange={(e) => setViewType(e.target.value)}
                  >
                    <option value="all">All Tasks</option>
                    <option value="created">Created by You</option>
                    <option value="assigned">Assigned to You</option>
                  </select>
                </div>
              )}

              {(rolePerms.isAdmin || rolePerms.scope === 'org') && isGeneralAdminDashboard && (
                <div className="task-filter-group">
                  <span className="task-filter-label">Department</span>
                  <select
                    className="task-filter-select"
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                  >
                    <option value="">All Departments</option>
                    {Array.isArray(departments) &&
                      departments.map((d) => (
                        <option key={d} value={d}>
                          {String(d || '')
                            .split('_')
                            .filter(Boolean)
                            .map((w) => w[0].toUpperCase() + w.slice(1))
                            .join(' ')}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {(rolePerms.isAdmin || user?.role === 'manager' || user?.role === 'dept_head' || user?.role === 'team_lead') && (
                <div className="task-filter-group">
                  <span className="task-filter-label">View Mode</span>
                  <button
                    className={`task-filter-toggle-btn ${showTeamPerformance ? 'active' : ''}`}
                    onClick={() => setShowTeamPerformance(!showTeamPerformance)}
                  >
                    {showTeamPerformance ? '📊 Main Dashboard' : '👥 Team Performance'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      <Navbar />
      <Loader loading={taskStatsLoading} />
      {!taskStatsLoading && (
        <div className="task-report-container">
          <PageHeader title="Tasks Dashboard" showBackButton={true} rightElement={filterButtonElement} />
          <div className="task-dashboard-shell">
          <div className="task-dashboard-layout">
            <div className="task-dashboard-header-bottom" style={{ marginBottom: '1rem' }}>
            </div>
            {!showTeamPerformance ? (
              <>
                <div className="task-dashboard-header">
                  {/* <div className="task-dashboard-header-bar">
                    <div className="task-dashboard-header-bar-time">{formattedCurrentTime}</div>
                  </div> */}
                  <div className="task-dashboard-header-top">
                    {/* <div className="task-dashboard-welcome task-dashboard-welcome-card">
                      <div className="task-dashboard-title">
                        Welcome{" "}
                        {user?.first_name || user?.last_name
                          ? `${user?.first_name || ""} ${user?.last_name || ""}`.trim()
                          : user?.email || "User"}
                        .
                      </div>
                      <div className="task-dashboard-tags">
                        <span className="task-badge">{`Role: ${role}`}</span>
                        <span className="task-badge">{`Scope: ${rolePerms.scope}`}</span>
                      </div>
                    </div> */}
                    <div className="task-dashboard-cards">
                      <div className="task-stat-card task-stat-card--total">
                        <div className="task-stat-label">Total Tasks</div>
                        <div className="task-stat-value">{statsSummary.total}</div>
                      </div>
                      <div className="task-stat-card task-stat-card--pending task-stat-card--active">
                        <div className="task-stat-label">Pending Tasks</div>
                        <div className="task-stat-value">
                          {statsSummary.pending}/{statsSummary.total}
                        </div>
                      </div>
                      <div className="task-stat-card task-stat-card--ended">
                        <div className="task-stat-label">Completed Tasks</div>
                        <div className="task-stat-value">
                          {statsSummary.ended}/{statsSummary.total}
                        </div>
                      </div>
                      <div className="task-stat-card task-stat-card--overdue">
                        <div className="task-stat-label">Overdue Tasks</div>
                        <div className="task-stat-value">
                          {statsSummary.overdue}/{statsSummary.total}
                        </div>
                      </div>
                      <div className="task-stat-card task-stat-card--completion">
                        <div className="task-stat-label">Completion Rate</div>
                        <div className="task-stat-value">
                          {`${Number(statsSummary.completionRate || 0).toFixed(1)}%`}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="task-dashboard-main">
                  <div className="task-dashboard-column">
                    <div className="task-dashboard-bottom-left">
                      <div className="task-report-card task-report-card--status-overview">
                        <div className="task-report-card-header">
                          <h2 className="task-report-card-title">Status Overview</h2>
                        </div>
                        <div className="task-status-grid">
                          <div className="task-status-card task-status-card--open">
                            <div className="task-status-label">Open</div>
                            <div className="task-status-value">
                              {statsSummary.open}/{statsSummary.total}
                            </div>
                          </div>
                          <div className="task-status-card task-status-card--in-progress">
                            <div className="task-status-label">In Progress</div>
                            <div className="task-status-value">
                              {statsSummary.inProgress}/{statsSummary.total}
                            </div>
                          </div>
                          <div className="task-status-card task-status-card--pending-approval">
                            <div className="task-status-label">Pending Approval</div>
                            <div className="task-status-value">
                              {statsSummary.pendingApproval}/{statsSummary.total}
                            </div>
                          </div>
                          <div className="task-status-card task-status-card--approved">
                            <div className="task-status-label">Approved</div>
                            <div className="task-status-value">
                              {statsSummary.approved}/{statsSummary.total}
                            </div>
                          </div>
                          <div className="task-status-card task-status-card--rejected">
                            <div className="task-status-label">Rejected</div>
                            <div className="task-status-value">
                              {statsSummary.rejected}/{statsSummary.total}
                            </div>
                          </div>
                          <div className="task-status-card task-status-card--completed">
                            <div className="task-status-label">Completed</div>
                            <div className="task-status-value">
                              {statsSummary.completed}/{statsSummary.total}
                            </div>
                          </div>
                          <div className="task-status-card task-status-card--closed">
                            <div className="task-status-label">Closed</div>
                            <div className="task-status-value">
                              {statsSummary.closed}/{statsSummary.total}
                            </div>
                          </div>
                          <div className="task-status-card task-status-card--cancelled">
                            <div className="task-status-label">Cancelled</div>
                            <div className="task-status-value">
                              {statsSummary.cancelled}/{statsSummary.total}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="task-report-card task-report-card--priority-overview">
                        <div className="task-report-card-header">
                          <h2 className="task-report-card-title">Priority Overview</h2>
                        </div>
                        <div className="task-priority-grid">
                          <div className="task-status-card task-status-card--priority-low">
                            <div className="task-status-label">Low</div>
                            <div className="task-status-value">
                              {prioritySummary.low}/{statsSummary.total}
                            </div>
                          </div>
                          <div className="task-status-card task-status-card--priority-medium">
                            <div className="task-status-label">Medium</div>
                            <div className="task-status-value">
                              {prioritySummary.medium}/{statsSummary.total}
                            </div>
                          </div>
                          <div className="task-status-card task-status-card--priority-high">
                            <div className="task-status-label">High</div>
                            <div className="task-status-value">
                              {prioritySummary.high}/{statsSummary.total}
                            </div>
                          </div>
                          <div className="task-status-card task-status-card--priority-critical">
                            <div className="task-status-label">Critical</div>
                            <div className="task-status-value">
                              {prioritySummary.critical}/{statsSummary.total}
                            </div>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                  <div className="task-dashboard-column">
                    <div className="task-report-card task-report-card--task-progress">
                      <div className="task-report-card-header">
                        <h2 className="task-report-card-title">Task Progress</h2>
                      </div>
                      <div className="task-report-card-chart task-report-card-chart--wide">
                        <canvas ref={completionRateChartRef}></canvas>
                      </div>
                      <div className="task-progress-legend">
                        {(() => {
                          const allStatusValues = [
                            statsSummary.open || 0,
                            statsSummary.inProgress || 0,
                            statsSummary.pendingApproval || 0,
                            statsSummary.approved || 0,
                            statsSummary.rejected || 0,
                            statsSummary.completed || 0,
                            statsSummary.closed || 0,
                            statsSummary.cancelled || 0
                          ];
                          
                          return STATUS_LABELS.map((label, index) => {
                            const count = allStatusValues[index];
                            if (count === 0) return null;
                            
                            const colorClass = STATUS_DOT_CLASSNAMES[index] || '';
                            const isHidden = hiddenDoughnutStatuses.has(label);
                            
                            return (
                              <div
                                key={label}
                                className="task-progress-legend-item"
                                onClick={() => toggleDonutStatusVisibility(label)}
                                style={{
                                  cursor: 'pointer',
                                  opacity: isHidden ? 0.4 : 1,
                                  textDecoration: isHidden ? 'line-through' : 'none'
                                }}
                              >
                                <span
                                  className={`task-progress-dot ${colorClass}`}
                                  style={{ 
                                    backgroundColor: STATUS_COLORS[index] || '',
                                    opacity: isHidden ? 0.4 : 1
                                  }}
                                />
                                <span className="task-progress-legend-label">
                                  {label}: {count}
                                </span>
                              </div>
                            );
                          });
                        })()}
                      </div>
                      {taskStatsLoading && <div className="loading">Loading task progress...</div>}
                      {taskStatsError && <div className="error">{taskStatsError}</div>}
                    </div>

                  </div>
                </div>
                <div className="task-dashboard-reports-grid">
                  <ProjectProgramWiseReport projects={taskAggregates.projects} />
                  {/* <div className="task-report-card task-report-card--user-report">
                    <div className="task-report-card-header task-report-card-header--with-filter">
                      <div className="task-report-header-left">
                        <h2 className="task-report-card-title">User-wise Task Report</h2>
                        <div className="task-report-filter-inline">
                          <input
                            type="text"
                            className="task-report-category-filter"
                            placeholder="Search users..."
                            value={userReportSearchQuery}
                            onChange={(e) => setUserReportSearchQuery(e.target.value)}
                          />
                          {userReportSearchQuery && (
                            <button
                              className="task-report-filter-clear-inline"
                              onClick={() => setUserReportSearchQuery('')}
                              title="Clear Filter"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="task-report-card-chart task-report-card-chart--wide">
                      <div className="task-report-slider-container">
                        <div 
                          className="task-report-chart-inner" 
                          style={{ 
                            width: `${Math.max(100, (filteredUserReportUsers?.length || 0) * 100)}px`,
                            minWidth: '100%',
                            height: '380px' 
                          }}
                        >
                          <canvas ref={userBarChartRef}></canvas>
                        </div>
                      </div>
                    </div>
                    <div className="task-progress-legend task-progress-legend--sticky" style={{ marginTop: '0.5rem' }}>
                      {(() => {
                        // Calculate total count for each status
                        const statusTotals = STATUS_LABELS.map((label, index) => {
                          const statusKey = label.toLowerCase().replace(/\s+/g, '_');
                          const total = filteredUserReportUsers.reduce((sum, user) => {
                            return sum + (user.statuses && user.statuses[statusKey] ? user.statuses[statusKey] : 0);
                          }, 0);
                          return { label, index, total };
                        });
                        
                        return statusTotals.map(({ label, index, total }) => {
                          if (total === 0) return null;
                          
                          const colorClass = STATUS_DOT_CLASSNAMES[index] || '';
                          const isHidden = hiddenUserBarStatuses.has(label);
                          
                          return (
                            <div
                              key={label}
                              className="task-progress-legend-item"
                              onClick={() => toggleUserBarStatusVisibility(label)}
                              style={{
                                cursor: 'pointer',
                                opacity: isHidden ? 0.4 : 1,
                                textDecoration: isHidden ? 'line-through' : 'none'
                              }}
                            >
                              <span
                                className={`task-progress-dot ${colorClass}`}
                                style={{ 
                                  backgroundColor: STATUS_COLORS[index] || '',
                                  opacity: isHidden ? 0.4 : 1
                                }}
                              />
                              <span className="task-progress-legend-label">
                                {label}: {total}
                              </span>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>  */}
                  {rolePerms.isAdmin && (
                    <div className="task-report-card task-report-card--department-report">
                      <div className="task-report-card-header">
                        <h2 className="task-report-card-title">Department-wise Task Report</h2>
                      </div>
                      <div className="task-report-card-chart task-report-card-chart--wide">
                        <div className="task-report-slider-container">
                          <div 
                            className="task-report-chart-inner" 
                            style={{ 
                              width: `${Math.max(100, (Object.keys(taskStats?.department_breakdown || {}).length || 0) * 120)}px`,
                              minWidth: '100%',
                              height: '380px' 
                            }}
                          >
                            <canvas ref={departmentCanvasRef}></canvas>
                          </div>
                        </div>
                      </div>
                      <div className="task-progress-legend task-progress-legend--sticky" style={{ marginTop: '0.5rem' }}>
                        {taskStats?.department_breakdown && (() => {
                          // Create consistent color map for legend items
                          const deptColorMap = {};
                          Object.keys(taskStats.department_breakdown).forEach((dept, index) => {
                            deptColorMap[dept] = DEPARTMENT_COLORS[index % DEPARTMENT_COLORS.length];
                          });

                          return Object.entries(taskStats.department_breakdown).map(([dept, count]) => {
                            const isHidden = hiddenDepartmentBarDepartments.has(dept);
                            const deptColor = deptColorMap[dept];

                            return (
                              <div
                                key={dept}
                                className="task-progress-legend-item"
                                onClick={() => toggleBarDepartmentVisibility(dept)}
                                style={{
                                  cursor: 'pointer',
                                  opacity: isHidden ? 0.4 : 1,
                                  textDecoration: isHidden ? 'line-through' : 'none'
                                }}
                              >
                                <span
                                  className="task-progress-dot"
                                  style={{
                                    backgroundColor: deptColor,
                                    opacity: isHidden ? 0.4 : 1
                                  }}
                                />
                                <span className="task-progress-legend-label">
                                  {String(dept || 'Unassigned').split('_').map(w => w ? w[0].toUpperCase() + w.slice(1) : '').join(' ')}: {count}
                                </span>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* Team Performance Dashboard (Screenshot 1) */
              <div className="task-report-card task-report-card--team-performance">
                <div className="task-report-card-header">
                  <div className="task-report-card-title-group">
                    <span className="task-report-card-icon">👥</span>
                    <h2 className="task-report-card-title">Team Performance Dashboard</h2>
                  </div>
                  <div className="task-team-header-actions">
                    <div className={`task-team-search-wrapper ${mobileSearchOpen ? 'task-team-search-wrapper--open' : ''}`}>
                      <span
                        className="task-team-search-icon"
                        onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
                      >🔍</span>
                      <input
                        type="text"
                        className="task-team-search-input"
                        placeholder="Search team members..."
                        value={teamSearchQuery}
                        onChange={(e) => setTeamSearchQuery(e.target.value)}
                      />
                    </div>
                    <span className="task-team-active-badge">
                      {filteredTeamMembers.length} Active Members
                    </span>
                  </div>
                </div>

                <div className="task-team-summary">
                  <div className="task-team-summary-item">
                    <div className="task-team-summary-value"><div className="stat-icon">👥</div>
                      {teamSummary.members}
                      <div className="task-team-summary-label" style={{ color: '#059669' }}>Team Members</div>
                    </div>

                  </div>
                  <div className="task-team-summary-item">
                    <div className="task-team-summary-value"><div className="stat-icon">📋</div>
                      {teamSummary.totalTasks}
                      <div className="task-team-summary-label" style={{ color: '#077af5' }}>Total Tasks</div>
                    </div>
                  </div>
                  <div className="task-team-summary-item">
                    <div className="task-team-summary-value"><div className="stat-icon">🔄</div>
                      {teamSummary.inProgress}
                      <div className="task-team-summary-label" style={{ color: '#fccf3a' }}>In Progress</div>
                    </div>
                  </div>
                  <div className="task-team-summary-item">
                    <div className="task-team-summary-value"><div className="stat-icon">✅</div>
                      {teamSummary.completed}
                      <div className="task-team-summary-label" style={{ color: '#0feb42' }}>Completed</div>
                    </div>
                  </div>
                  <div className="task-team-summary-item">
                    <div className="task-team-summary-value"><div className="stat-icon">⚠️</div>
                      {teamSummary.overdue}<div className="task-team-summary-label" style={{ color: '#FF6384' }}>Overdue</div>
                    </div>
                  </div>
                  <div className="task-team-summary-item">
                    <div className="task-team-summary-value"><div className="stat-icon">📊</div>
                      {teamSummary.avgRate}%<div className="task-team-summary-label" style={{ color: '#077af5' }}>Avg Completion</div>
                    </div>
                  </div>
                </div>

                <div className="task-team-grid">
                  {filteredTeamMembers.length > 0 ? (
                    filteredTeamMembers.map((member, index) => (
                      <div key={index} className="task-team-member-card">
                        <div className="task-team-member-header">
                          <div className="task-team-member-avatar">
                            <FaUserCircle size={40} />
                          </div>
                          <div className="task-team-member-info">
                            <div className="task-team-member-name">{member.label}</div>
                            <div className="task-team-member-role">
                              {String(member.role || 'User').split('_').map(w => w ? w[0].toUpperCase() + w.slice(1) : '').join(' ')}
                            </div>
                          </div>
                        </div>
                        <div className="task-team-member-stats">
                          <div className="task-team-stat-item task-team-stat-item--total">
                            <div className="task-team-stat-value">{member.count}</div>
                            <div className="task-team-stat-label">Tasks</div>
                          </div>
                          <div className="task-team-stat-item task-team-stat-item--in-progress">
                            <div className="task-team-stat-value">{member.in_progress_count || 0}</div>
                            <div className="task-team-stat-label">In Progress</div>
                          </div>
                          <div className="task-team-stat-item task-team-stat-item--completed">
                            <div className="task-team-stat-value">{member.completed_count || 0}</div>
                            <div className="task-team-stat-label">Completed</div>
                          </div>
                          <div className="task-team-stat-item task-team-stat-item--overdue">
                            <div className="task-team-stat-value">{member.overdue_count || 0}</div>
                            <div className="task-team-stat-label">Overdue</div>
                          </div>
                        </div>
                        <div className="task-team-member-progress-group">
                          <div className="task-team-member-progress-label">
                            <span>📈 Completion Rate</span>
                            <span>{member.rate || 0}%</span>
                          </div>
                          <div className="task-team-member-progress-container">
                            <div
                              className="task-team-member-progress-bar"
                              style={{ width: `${member.rate || 0}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="task-team-member-footer-actions">
                          <button
                            className="task-team-view-details-btn"
                            onClick={() => handleShowMemberTasks(member)}
                          >
                            📋 View Details ({member.count} Tasks)
                          </button>
                          <button className="task-team-message-btn">
                            💬 Message
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="task-team-empty-search">
                      No team members found matching "{teamSearchQuery}"
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )}

      {/* Task Details Popup*/}
      {showMemberTasksModal && selectedMemberTasks && (
        <div className="task-team-modal-overlay" onClick={() => setShowMemberTasksModal(false)}>
          <div className="task-team-modal-content" onClick={e => e.stopPropagation()}>
            <div className="task-team-modal-header">
              <div className="task-team-modal-header-left">
                <div className="task-team-modal-avatar">
                  {getInitials(selectedMemberTasks.member.label || selectedMemberTasks.member.name)}
                </div>
                <div className="task-team-modal-user-info">
                  <h3 className="task-team-modal-user-name">{selectedMemberTasks.member.label || selectedMemberTasks.member.name || 'User'}</h3>
                  <span className="task-team-modal-user-role">{selectedMemberTasks.member.role || 'User'}</span>
                </div>
              </div>
              <div className="task-team-modal-header-right">
                <button className="task-team-modal-close" onClick={() => setShowMemberTasksModal(false)}>×</button>
              </div>
            </div>

            <div className="task-team-modal-body">
              <div className="task-team-modal-stats">
                <div className="task-team-modal-stat-item">
                  <div className="task-team-modal-stat-value">{selectedMemberTasks.member.count}</div>
                  <div className="task-team-modal-stat-label">Total Tasks</div>
                </div>
                <div className="task-team-modal-stat-item">
                  <div className="task-team-modal-stat-value task-team-modal-stat-value--in-progress">
                    {selectedMemberTasks.member.in_progress_count || 0}
                  </div>
                  <div className="task-team-modal-stat-label">In Progress</div>
                </div>
                <div className="task-team-modal-stat-item">
                  <div className="task-team-modal-stat-value task-team-modal-stat-value--completed">
                    {selectedMemberTasks.member.completed_count || 0}
                  </div>
                  <div className="task-team-modal-stat-label">Completed</div>
                </div>
                <div className="task-team-modal-stat-item">
                  <div className="task-team-modal-stat-value task-team-modal-stat-value--overdue">
                    {selectedMemberTasks.member.overdue_count || 0}
                  </div>
                  <div className="task-team-modal-stat-label">Pending/Overdue</div>
                </div>
                <div className="task-team-modal-stat-item">
                  <div className="task-team-modal-stat-value">{selectedMemberTasks.member.rate || 0}%</div>
                  <div className="task-team-modal-stat-label">Completion Rate</div>
                </div>
              </div>

              <div className="task-team-modal-task-list-section">
                <h4 className="task-team-modal-section-title">📋 Task List ({selectedMemberTasks.tasks.length} Tasks)</h4>
                <div className="task-team-modal-task-list">
                  {memberTasksLoading ? (
                    <div className="task-team-modal-loading">
                      <div className="task-loading-spinner"></div>
                      <p>Loading member tasks...</p>
                    </div>
                  ) : selectedMemberTasks.tasks.length > 0 ? (
                    selectedMemberTasks.tasks.map((task, idx) => {
                      const statusConfig = getStatusConfig(task.status, task);
                      const overdueDays = getOverdueDays(task.due_date);

                      return (
                        <div key={idx} className={`task-team-modal-task-item status-${statusConfig.class}`}>
                          <div className="task-team-modal-task-main">
                            <div className="task-team-modal-task-title">{task.title}</div>
                            <div className={`task-team-modal-task-status task-team-modal-task-status--${statusConfig.class}`}>
                              {statusConfig.icon} {statusConfig.label}
                            </div>
                          </div>
                          <div className="task-team-modal-task-details">
                            <div className="task-team-modal-task-detail-item">
                              Priority: <span className={`priority-${(task.priority || 'medium').toLowerCase()}`}>{(task.priority || 'MEDIUM').toUpperCase()}</span>
                            </div>
                            <div className="task-team-modal-task-detail-item">
                              Department: {task.department || 'N/A'}
                            </div>
                            <div className="task-team-modal-task-detail-item">
                              Due Date: {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'N/A'}
                            </div>

                            {statusConfig.class === 'completed' && (task.completed_date || task.completed_at) && (
                              <div className="task-team-modal-task-detail-item">
                                Completed: {new Date(task.completed_date || task.completed_at).toLocaleDateString()}
                              </div>
                            )}

                            {statusConfig.class === 'in-progress' && task.progress !== undefined && (
                              <div className="task-team-modal-task-detail-item">
                                Progress: {task.progress}%
                              </div>
                            )}

                            {statusConfig.class === 'overdue' && overdueDays > 0 && (
                              <div className="task-team-modal-task-detail-item">
                                Days Overdue: {overdueDays}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="task-team-modal-empty">No tasks found for this member.</div>
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

export default TaskReports;