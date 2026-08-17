import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { FaArrowDown, FaArrowUp, FaBan, FaChartLine, FaCheckCircle, FaCheckDouble, FaExclamationCircle, FaExclamationTriangle, FaFolderOpen, FaGripLines, FaHourglassHalf, FaLayerGroup, FaLock, FaDownload, FaSpinner, FaTimesCircle, FaUserCircle, FaUserClock, FaTasks, FaFlag, FaChartPie, FaBuilding, FaUsers, FaRegFolderOpen, FaProjectDiagram, FaClipboard, FaEllipsisH, FaChevronLeft, FaChevronRight, FaChevronUp, FaChevronDown, FaCheck } from 'react-icons/fa';
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
import TeamPerformance from './team-performance';

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
      // caretPadding: 3,
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

const getResponsiveChartSizes = () => {
  const width = window.innerWidth;
  if (width < 480) {
    return {
      tickFontSize: 8,
      labelFontSize: 8,
      legendLabelFontSize: 9,
      titleFontSize: 10,
      boxWidth: 8,
      boxHeight: 8,
      legendPadding: 8,
      chartPadding: { right: 60, top: 8, bottom: 8 },
      barThickness: 30,
      maxBarThickness: 35
    };
  } else if (width < 768) {
    return {
      tickFontSize: 9,
      labelFontSize: 9,
      legendLabelFontSize: 10,
      titleFontSize: 11,
      boxWidth: 10,
      boxHeight: 10,
      legendPadding: 12,
      chartPadding: { right: 80, top: 10, bottom: 10 },
      barThickness: 35,
      maxBarThickness: 40
    };
  } else {
    return {
      tickFontSize: 12,
      labelFontSize: 11,
      legendLabelFontSize: 11,
      titleFontSize: 13,
      boxWidth: 14,
      boxHeight: 14,
      legendPadding: 16,
      chartPadding: { right: 96, top: 14, bottom: 14 },
      barThickness: 'flex',
      maxBarThickness: 45
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
  '#f10a1d',
  '#0feb42',
  '#6B7280',
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

// Custom hook for click outside detection
const useClickOutside = (ref, handler) => {
  useEffect(() => {
    const listener = (event) => {
      if (!ref.current || ref.current.contains(event.target)) {
        return;
      }
      handler(event);
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
};

const downloadCsv = (rows, fileName) => {
  const csvContent = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

function createOrUpdateDoughnutChart(ctx, data, chartInstanceRef, chartSizes, isMobile) {
  const drawLabels = (chart) => {
    const ctx = chart.ctx;
    const dataset = chart.data.datasets[0];
    const total = dataset.data.reduce((sum, value) => sum + value, 0);

    chart.data.datasets.forEach((dataset, i) => {
      const meta = chart.getDatasetMeta(i);
      meta.data.forEach((arc, index) => {
        const value = dataset.data[index];
        if (value === 0 || !arc) return;

        const percentage = Math.round((value / total) * 100);

        // Calculate arc length to determine if label fits
        const startAngle = arc.startAngle;
        const endAngle = arc.endAngle;
        const arcLength = endAngle - startAngle;

        // Only draw label if arc is large enough (at least 12 degrees)
        if (arcLength < 0.21) { // ~12 degrees in radians
          return;
        }

        ctx.save();
        const center = arc.getCenterPoint();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffffff';

        // Text shadow for better readability
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 2;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;

        // Only draw value if percentage > 2%, otherwise skip to save space
        if (percentage >= 2) {
          ctx.font = '600 11px Inter, sans-serif';
          ctx.fillText(value.toString(), center.x, center.y - 6);
          ctx.font = '500 9px Inter, sans-serif';
          ctx.fillText(`(${percentage}%)`, center.x, center.y + 8);
        } else if (percentage >= 1) {
          // For very small percentages, only show the value
          ctx.font = '600 10px Inter, sans-serif';
          ctx.fillText(value.toString(), center.x, center.y);
        }

        ctx.restore();
      });
    });

    if (total > 0) {
      ctx.save();
      const centerX = (chart.chartArea.left + chart.chartArea.right) / 2;
      const centerY = (chart.chartArea.top + chart.chartArea.bottom) / 2;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#0f172a';
      ctx.font = '600 24px Inter, sans-serif';
      ctx.fillText(total.toString(), centerX, centerY - 8);
      ctx.font = '600 11px Inter, sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.fillText('Total Tasks', centerX, centerY + 14);
      ctx.restore();
    }
  };

  // If chart already exists, update it
  if (chartInstanceRef.current) {
    // Defensive check: if the instance was bound to a different canvas (e.g.
    // canvas was unmounted & remounted by a loading flag or parent conditional),
    // destroy the orphaned instance and fall through to re-create it.
    const currentCanvas = ctx && ctx.canvas;
    if (currentCanvas && chartInstanceRef.current.canvas &&
        chartInstanceRef.current.canvas !== currentCanvas) {
      try { chartInstanceRef.current.destroy(); } catch (_) { /* no-op */ }
      chartInstanceRef.current = null;
    } else if (document && currentCanvas && !document.body.contains(currentCanvas)) {
      // The canvas being passed is already detached - destroy and bail.
      try { chartInstanceRef.current.destroy(); } catch (_) { /* no-op */ }
      chartInstanceRef.current = null;
      return;
    }
  }
  if (chartInstanceRef.current) {
    chartInstanceRef.current.data = data;
    chartInstanceRef.current.update('none'); // Use 'none' to prevent animation issues
    return;
  }

  // Create new chart
  chartInstanceRef.current = new Chart(ctx, {
    type: 'doughnut',
    data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '50%',
      layout: {
        padding: {
          top: 16,
          bottom: 16,
          left: 16,
          right: 16
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function (context) {
              const label = context.label || '';
              const value = context.parsed || 0;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = total ? Math.round((value / total) * 100) : 0;
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
  const headerRef = useRef(null);
  const projectReportSliderRef = useRef(null);
  const [showHeaderFilters, setShowHeaderFilters] = useState(false);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);

  const checkScrollability = () => {
    if (projectReportSliderRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = projectReportSliderRef.current;
      setCanScrollUp(scrollTop > 0);
      setCanScrollDown(scrollTop + clientHeight < scrollHeight);
    }
  };

  const handleScroll = (ref, direction, isVertical = true) => {
    if (ref.current) {
      const scrollAmount = 300;
      if (isVertical) {
        if (direction === 'left') { // Up
          ref.current.scrollBy({ top: -scrollAmount, behavior: 'smooth' });
        } else { // Down
          ref.current.scrollBy({ top: scrollAmount, behavior: 'smooth' });
        }
      } else {
        if (direction === 'left') {
          ref.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
        } else {
          ref.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
      }
      // Check scrollability after scroll
      setTimeout(checkScrollability, 100);
    }
  };

  useClickOutside(headerRef, () => setShowHeaderFilters(false));

  /** Sync helper for ProjectProgramWiseReport chart instances (same logic as outer dashboard). */
  const syncProjectChartCanvas = (instanceRef, canvasRef) => {
    const instance = instanceRef.current;
    const canvas = canvasRef.current;
    if (!instance) return false;
    if (!canvas) {
      try { instance.destroy(); } catch (_) { /* no-op */ }
      instanceRef.current = null;
      return false;
    }
    if (instance.canvas !== canvas) {
      try { instance.destroy(); } catch (_) { /* no-op */ }
      instanceRef.current = null;
      return false;
    }
    return true;
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      setScreenWidth(window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const filteredProjects = useMemo(() => {
    if (!projects) return [];
    let list = Array.isArray(projects) ? [...projects] : [];
    list.sort((a, b) => {
      const diff = (Number(b.count) || 0) - (Number(a.count) || 0);
      return diff !== 0 ? diff : String(a.label || '').localeCompare(String(b.label || ''));
    });

    if (projectCategory !== 'all') {
      list = list.filter((p) => {
        const projectName = String(p.label || '');
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

  useEffect(() => {
    const slider = projectReportSliderRef.current;
    if (slider) {
      slider.addEventListener('scroll', checkScrollability);
      checkScrollability();

      return () => slider.removeEventListener('scroll', checkScrollability);
    }
  }, [filteredProjects]);

  const dynamicHeight = useMemo(() => {
    const projectCount = filteredProjects.length;
    const perProjectHeight = screenWidth < 480 ? 45 : screenWidth < 768 ? 50 : 55;
    const baseHeight = screenWidth < 480 ? 120 : screenWidth < 768 ? 135 : 150;
    const minHeight = screenWidth < 480 ? 320 : screenWidth < 768 ? 350 : 380;
    const maxHeight = screenWidth < 480 ? 600 : screenWidth < 768 ? 700 : 800;
    if (projectCount === 0) return minHeight;
    const calculated = projectCount * perProjectHeight + baseHeight;
    return Math.max(minHeight, Math.min(calculated, maxHeight));
  }, [filteredProjects.length, screenWidth]);

  useEffect(() => {
    if (filteredProjects.length > 0 && projectBarChartRef.current) {
      const labels = filteredProjects.map((p) => p.label);
      const chartSizes = getResponsiveChartSizes();

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
        borderSkipped: false,
        statusKey: statusKey,
        barPercentage: 0.9,
        categoryPercentage: 0.9,
        barThickness: filteredProjects.length === 1 ? chartSizes.maxBarThickness : chartSizes.barThickness,
        maxBarThickness: chartSizes.maxBarThickness
      }));

      const data = { labels, datasets };

      // Validate instance is still bound to a canvas currently in the DOM
      const projectInstanceAlive = syncProjectChartCanvas(projectBarChartInstance, projectBarChartRef);

      if (projectInstanceAlive && projectBarChartInstance.current) {
        projectBarChartInstance.current.data = data;
        // Update responsive sizes with guards
        if (projectBarChartInstance.current.options.plugins) {
          if (projectBarChartInstance.current.options.plugins.legend) {
            projectBarChartInstance.current.options.plugins.legend.display = !isMobile;
            if (projectBarChartInstance.current.options.plugins.legend.labels) {
              projectBarChartInstance.current.options.plugins.legend.labels.boxWidth = chartSizes.boxWidth;
              projectBarChartInstance.current.options.plugins.legend.labels.boxHeight = chartSizes.boxHeight;
              if (!projectBarChartInstance.current.options.plugins.legend.labels.font) {
                projectBarChartInstance.current.options.plugins.legend.labels.font = {};
              }
              projectBarChartInstance.current.options.plugins.legend.labels.font.size = chartSizes.legendLabelFontSize;
              projectBarChartInstance.current.options.plugins.legend.labels.padding = chartSizes.legendPadding;
            }
          }
        }
        if (projectBarChartInstance.current.options.layout) {
          projectBarChartInstance.current.options.layout.padding = chartSizes.chartPadding;
        }
        if (projectBarChartInstance.current.options.scales) {
          if (projectBarChartInstance.current.options.scales.x) {
            if (projectBarChartInstance.current.options.scales.x.ticks) {
              if (!projectBarChartInstance.current.options.scales.x.ticks.font) {
                projectBarChartInstance.current.options.scales.x.ticks.font = {};
              }
              projectBarChartInstance.current.options.scales.x.ticks.font.size = chartSizes.tickFontSize;
            }
            if (projectBarChartInstance.current.options.scales.x.title) {
              if (!projectBarChartInstance.current.options.scales.x.title.font) {
                projectBarChartInstance.current.options.scales.x.title.font = {};
              }
              projectBarChartInstance.current.options.scales.x.title.font.size = chartSizes.titleFontSize;
            }
          }
          if (projectBarChartInstance.current.options.scales.y) {
            if (projectBarChartInstance.current.options.scales.y.ticks) {
              if (!projectBarChartInstance.current.options.scales.y.ticks.font) {
                projectBarChartInstance.current.options.scales.y.ticks.font = {};
              }
              projectBarChartInstance.current.options.scales.y.ticks.font.size = chartSizes.tickFontSize;
            }
          }
        }
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
                  display: !isMobile,
                  position: 'bottom',
                  align: 'center',
                  labels: {
                    boxWidth: chartSizes.boxWidth,
                    boxHeight: chartSizes.boxHeight,
                    font: { size: chartSizes.legendLabelFontSize, weight: '600', family: "'Inter', sans-serif" },
                    padding: chartSizes.legendPadding,
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
                      const statusTasks = project.tasks.filter((t) => (t.status || 'open') === currentStatus);
                      if (statusTasks.length === 0) return null;
                      const taskDetails = statusTasks.slice(0, 5).map((t) => {
                        const assignees = t.assignee_names || 'Unassigned';
                        const dept = String(t.department || 'Unassigned')
                          .split('_')
                          .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ''))
                          .join(' ');
                        return `• ${t.title}\n  👤 ${assignees}\n  🏢 ${dept}`;
                      });
                      const remaining = statusTasks.length > 5 ? `\n... and ${statusTasks.length - 5} more task(s)` : '';
                      return '\n📝 Task Details:\n' + taskDetails.join('\n') + remaining;
                    }
                  }
                }
              },
              layout: {
                padding: {
                  ...chartSizes.chartPadding,
                  bottom: screenWidth < 480 ? 40 : screenWidth < 768 ? 35 : 30,
                  top: 10,
                  left: 10,
                  right: 10
                }
              },
              scales: {
                x: {
                  stacked: true,
                  beginAtZero: true,
                  grid: {
                    display: true,
                    color: 'rgba(0, 0, 0, 0.04)',
                    lineWidth: 1,
                    drawBorder: false,
                    borderDash: [4, 4]
                  },
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
              id: 'segmentLabels',
              afterDatasetsDraw: (chart) => {
                const { ctx } = chart;
                chart.data.datasets.forEach((dataset) => {
                  const meta = chart.getDatasetMeta(chart.data.datasets.indexOf(dataset));
                  meta.data.forEach((bar, index) => {
                    const value = dataset.data[index];
                    if (!value || value === 0) return;
                    const base = bar.base !== undefined ? bar.base : bar.x - bar.width;
                    const width = Math.abs((bar.x || 0) - base) || bar.width || 0;
                    if (width < 10) return;  // Reduced from 18px to 10px
                    const x = base + width / 2;
                    ctx.save();
                    ctx.fillStyle = '#ffffff';
                    // Adjust font size based on bar width
                    if (width >= 18) {
                      ctx.font = '600 12px Inter, sans-serif';
                    } else {
                      ctx.font = '600 10px Inter, sans-serif';
                    }
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(String(value), x, bar.y);
                    ctx.restore();
                  });
                });
              }
            }, {
              id: 'totalColumn',
              afterDatasetsDraw: (chart) => {
                const { ctx } = chart;
                const rightPadding = chart.options.layout?.padding?.right || 96;
                const drawX = chart.width - rightPadding / 2;
                const totals = chart.data.labels.map((_, idx) => {
                  return chart.data.datasets.reduce((sum, dataset) => {
                    return sum + (dataset.data[idx] || 0);
                  }, 0);
                });
                ctx.save();
                ctx.font = '600 13px Inter, sans-serif';
                ctx.fillStyle = '#7F8C8D';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('Total', drawX, 16);
                totals.forEach((total, idx) => {
                  const bar = chart.getDatasetMeta(0).data[idx];
                  if (!bar) return;
                  const y = bar.y;
                  ctx.fillText(String(total), drawX, y);
                });
                ctx.restore();
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
  }, [filteredProjects, isMobile, screenWidth]);

  const handleExportProjectReport = useCallback(() => {
    if (!filteredProjects || filteredProjects.length === 0) return;

    const rows = [
      [
        'Project / Program',
        'Open',
        'In Progress',
        'Pending Approval',
        'Approved',
        'Rejected',
        'Completed',
        'Closed',
        'Cancelled',
        'Total'
      ],
    ];

    filteredProjects.forEach((project) => {
      const statuses = project.statuses || {};
      const counts = STATUS_LABELS.map((label) => statuses[label.toLowerCase().replace(/\s+/g, '_')] || 0);
      const total = counts.reduce((sum, value) => sum + value, 0);
      rows.push([project.label, ...counts, total]);
    });

    downloadCsv(rows, `project_program_task_report_${new Date().toISOString().slice(0, 10)}.csv`);
  }, [filteredProjects]);

  return (
    <div className="task-report-card task-report-card--project-report">
      <div className="task-report-card-header task-report-card-header--with-filter" ref={headerRef}>
        <div className="task-report-header-left">
          <FaProjectDiagram className="task-status-overview-icon" />
          <h2 className="task-report-card-title">Project/Program-wise Task Report</h2>
        </div>
        <div className={`task-report-header-right ${showHeaderFilters ? 'task-report-header-right--visible' : ''}`}>
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
          <button
            className="task-report-export-button"
            onClick={handleExportProjectReport}
            title="Export report"
            type="button"
          >
            <FaDownload /> Export
          </button>
        </div>
        <button
          className="task-report-header-menu-button"
          onClick={() => setShowHeaderFilters(!showHeaderFilters)}
          title={showHeaderFilters ? "Hide filters" : "Show filters"}
          type="button"
        >
          <FaEllipsisH />
        </button>
      </div>
      <div className="task-report-card-chart task-report-card-chart--wide" style={{ minHeight: '380px', height: 'auto', position: 'relative' }}>
        <div className="task-report-slider-wrapper task-report-slider-wrapper--vertical">
          {canScrollUp && (
            <button
              className="task-report-slider-button task-report-slider-button--left"
              onClick={() => handleScroll(projectReportSliderRef, 'left', true)}
              type="button"
            >
              <FaChevronUp />
            </button>
          )}
          <div className="task-report-slider-container task-report-slider-container--vertical" ref={projectReportSliderRef}>
            <div
              className="task-report-chart-inner"
              style={{
                width: '100%',
                minWidth: '100%',
                height: `${dynamicHeight}px`
              }}
            >
              <canvas ref={projectBarChartRef}></canvas>
            </div>
          </div>
          {canScrollDown && (
            <button
              className="task-report-slider-button task-report-slider-button--right"
              onClick={() => handleScroll(projectReportSliderRef, 'right', true)}
              type="button"
            >
              <FaChevronDown />
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

const TaskReports = () => {
  const { user, permissions } = useAuth();
  const role = user?.role || 'user';
  const [duration, setDuration] = useState('this_year');
  const [viewType, setViewType] = useState("assigned"); // Initial view: current user's assigned tasks
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [taskStats, setTaskStats] = useState(null);
  const [taskStatsLoading, setTaskStatsLoading] = useState(false);
  const [taskStatsError, setTaskStatsError] = useState(null);
  const [taskAggregates, setTaskAggregates] = useState({ users: [], projects: [], avgCompletionDays: null });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showTeamPerformance, setShowTeamPerformance] = useState(false);
  const [showFilterPopover, setShowFilterPopover] = useState(false);
  const [showUserReportFilters, setShowUserReportFilters] = useState(false);
  const [showDeptReportFilters, setShowDeptReportFilters] = useState(false);
  const userReportHeaderRef = useRef(null);
  const deptReportHeaderRef = useRef(null);
  const userReportSliderRef = useRef(null);
  const deptReportSliderRef = useRef(null);
  const projectReportSliderRef = useRef(null);
  const [userCanScrollLeft, setUserCanScrollLeft] = useState(false);
  const [userCanScrollRight, setUserCanScrollRight] = useState(false);
  const [deptCanScrollLeft, setDeptCanScrollLeft] = useState(false);
  const [deptCanScrollRight, setDeptCanScrollRight] = useState(false);
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const checkUserScrollability = () => {
    if (userReportSliderRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = userReportSliderRef.current;
      setUserCanScrollLeft(scrollLeft > 0);
      setUserCanScrollRight(scrollLeft + clientWidth < scrollWidth);
    }
  };

  const checkDeptScrollability = () => {
    if (deptReportSliderRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = deptReportSliderRef.current;
      setDeptCanScrollLeft(scrollLeft > 0);
      setDeptCanScrollRight(scrollLeft + clientWidth < scrollWidth);
    }
  };

  const handleScroll = (ref, direction, isVertical = true) => {
    if (ref.current) {
      const scrollAmount = 300;
      if (isVertical) {
        if (direction === 'left') { // Up
          ref.current.scrollBy({ top: -scrollAmount, behavior: 'smooth' });
        } else { // Down
          ref.current.scrollBy({ top: scrollAmount, behavior: 'smooth' });
        }
      } else {
        if (direction === 'left') {
          ref.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
        } else {
          ref.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
      }
      // Check scrollability after scroll
      setTimeout(() => {
        checkUserScrollability();
        checkDeptScrollability();
      }, 100);
    }
  };

  useClickOutside(userReportHeaderRef, () => setShowUserReportFilters(false));
  useClickOutside(deptReportHeaderRef, () => setShowDeptReportFilters(false));

  const [hiddenDepartments, setHiddenDepartments] = useState(new Set());
  const [hiddenStatuses, setHiddenStatuses] = useState(new Set());
  const [hiddenDoughnutStatuses, setHiddenDoughnutStatuses] = useState(new Set());
  const [hiddenDepartmentBarDepartments, setHiddenDepartmentBarDepartments] = useState(new Set());
  const [hiddenBarStatuses, setHiddenBarStatuses] = useState(new Set());
  const [hiddenUserBarStatuses, setHiddenUserBarStatuses] = useState(new Set());
  const [userReportSearchQuery, setUserReportSearchQuery] = useState('');

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

  // User report scrollability
  useEffect(() => {
    const slider = userReportSliderRef.current;
    if (slider) {
      slider.addEventListener('scroll', checkUserScrollability);
      checkUserScrollability();

      return () => slider.removeEventListener('scroll', checkUserScrollability);
    }
  }, [filteredUserReportUsers]);

  // Department report scrollability
  useEffect(() => {
    const slider = deptReportSliderRef.current;
    if (slider) {
      slider.addEventListener('scroll', checkDeptScrollability);
      checkDeptScrollability();

      return () => slider.removeEventListener('scroll', checkDeptScrollability);
    }
  }, [taskStats]);

  const handleExportUserReport = useCallback(() => {
    if (!filteredUserReportUsers || filteredUserReportUsers.length === 0) return;

    const rows = [
      [
        'User',
        'Role',
        'Open',
        'In Progress',
        'Pending Approval',
        'Approved',
        'Rejected',
        'Completed',
        'Closed',
        'Cancelled',
        'Total'
      ]
    ];

    filteredUserReportUsers.forEach((userEntry) => {
      const statuses = userEntry.statuses || {};
      const counts = STATUS_LABELS.map((label) => statuses[label.toLowerCase().replace(/\s+/g, '_')] || 0);
      const total = counts.reduce((sum, value) => sum + value, 0);
      rows.push([userEntry.label || userEntry.name || 'Unknown', userEntry.role || '', ...counts, total]);
    });

    downloadCsv(rows, `user_task_report_${new Date().toISOString().slice(0, 10)}.csv`);
  }, [filteredUserReportUsers]);

  const handleExportDepartmentReport = useCallback(() => {
    if (!taskStats?.department_status_breakdown) return;

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

    const visibleDepartments = Object.keys(taskStats.department_status_breakdown).filter((dept) => {
      if (hiddenDepartmentBarDepartments.has(dept)) return false;
      const statusData = taskStats.department_status_breakdown[dept] || {};
      return statusKeys.some((status) => {
        const entry = statusData[status];
        const count = entry ? (typeof entry === 'object' ? entry.count : entry) : 0;
        return count > 0;
      });
    });

    if (visibleDepartments.length === 0) return;

    const rows = [
      [
        'Department',
        'Open',
        'In Progress',
        'Pending Approval',
        'Approved',
        'Rejected',
        'Completed',
        'Closed',
        'Cancelled',
        'Total'
      ]
    ];

    visibleDepartments.forEach((dept) => {
      const statusData = taskStats.department_status_breakdown[dept] || {};
      const counts = statusKeys.map((status) => {
        const entry = statusData[status];
        return entry ? (typeof entry === 'object' ? entry.count : entry) : 0;
      });
      const total = counts.reduce((sum, value) => sum + value, 0);
      const formattedDept = String(dept || 'Unassigned').split('_').map((w) => w ? w.toUpperCase() : '').join(' ');
      rows.push([formattedDept, ...counts, total]);
    });

    downloadCsv(rows, `department_task_report_${new Date().toISOString().slice(0, 10)}.csv`);
  }, [taskStats, hiddenDepartmentBarDepartments]);

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

  /** Task-visibility capabilities derived from role scope and permission flags. */
  const taskScopeCaps = useMemo(() => {
    const scope = rolePerms.scope;
    const hasTeamScope = scope === 'team' || scope === 'department' || scope === 'org';
    const hasDeptScope = scope === 'department' || scope === 'org';
    const hasOrgScope = scope === 'org';
    const isSelfOnly = scope === 'self';
    const canViewTeam = hasTeamScope || rolePerms.canAssign || rolePerms.isAdmin;
    const canViewTeamToggle = canViewTeam ||
      user?.role === 'manager' ||
      user?.role === 'dept_head' ||
      user?.role === 'team_lead' ||
      user?.role === 'assistant_manager' ||
      user?.role === 'coordinator';
    const availableViewTypes = ['all', 'created', 'assigned', 'approval_tasks'];
    if (canViewTeam) availableViewTypes.push('assigned_to_team');
    return {
      scope,
      hasTeamScope,
      hasDeptScope,
      hasOrgScope,
      isSelfOnly,
      canViewTeam,
      canViewTeamToggle,
      availableViewTypes,
      // For a pure "User" / self-scope role, default "All Tasks" must mean "All of YOUR tasks"
      // The backend applyRoleFiltersWithoutBrackets already enforces this for self roles,
      // but we still make the intent explicit on the frontend.
      showTasksDropdown: !rolePerms.isAdmin
    };
  }, [rolePerms, user?.role]);

  /** Guard: if current viewType is not authorized for this user, reset to "all". */
  useEffect(() => {
    if (!taskScopeCaps.availableViewTypes.includes(viewType)) {
      setViewType('all');
    }
    // If user does not have team scope, also force exit from Team Performance page.
    if (showTeamPerformance && !taskScopeCaps.canViewTeamToggle) {
      setShowTeamPerformance(false);
    }
  }, [viewType, showTeamPerformance, taskScopeCaps.availableViewTypes, taskScopeCaps.canViewTeamToggle]);

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
    const pending = sumBy(['draft', 'open', 'in_progress', 'rejected', 'cancelled']);
    const ended = closed;
    const completionRate = taskStats?.completion_rate || 0;
    const overdue = taskStats?.overdue_tasks || 0;
    const progressCompleted = closed + completed;
    const progressInProgress = inProgress + pendingApproval;
    const progressNotStarted = open + draft;
    const active = open + inProgress + pendingApproval;
    const completedTasks = completed + closed + approved;
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
      progressNotStarted,
      completedTasks
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

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const completionRateChartRef = useRef(null);
  const completionRateChartInstance = useRef(null);
  const userBarChartRef = useRef(null);
  const userBarChartInstance = useRef(null);
  const departmentChartRef = useRef(null);
  const departmentCanvasRef = useRef(null);

  /**
   * Ensure a chart instance is bound to the canvas element currently held by the
   * canvasRef. If the instance was built on top of a detached canvas (e.g. the
   * DOM was temporarily unmounted by a loading flag, or a parent conditional
   * toggled away), destroy the stale instance so the caller re-creates it on
   * the fresh canvas. Returns true when the caller can safely call .update()
   * on the instance, false when the caller should branch into the "new Chart()"
   * creation path.
   *
   * This is the root-cause fix for "charts disappear on filter change but
   * reappear on page refresh".
   */
  function syncChartCanvas(instanceRef, canvasRef) {
    const instance = instanceRef.current;
    const canvas = canvasRef.current;
    if (!instance) {
      // Nothing to sync - caller will create new chart
      return false;
    }
    if (!canvas) {
      // Canvas element is not in the DOM right now - destroy orphaned instance
      try { instance.destroy(); } catch (_) { /* no-op */ }
      instanceRef.current = null;
      return false;
    }
    if (instance.canvas !== canvas) {
      // Instance is bound to a DIFFERENT canvas element than the ref currently
      // holds - the previous canvas was unmounted, and a new one was mounted.
      // Destroy the stale instance so we build a fresh one on the new canvas.
      try { instance.destroy(); } catch (_) { /* no-op */ }
      instanceRef.current = null;
      return false;
    }
    return true;
  }

  const toggleUserBarStatusVisibility = (statusLabel) => {
    const newHidden = new Set(hiddenUserBarStatuses);
    if (newHidden.has(statusLabel)) {
      newHidden.delete(statusLabel);
    } else {
      newHidden.add(statusLabel);
    }
    setHiddenUserBarStatuses(newHidden);

    // Also toggle the dataset visibility in the Chart.js instance
    syncChartCanvas(userBarChartInstance, userBarChartRef);
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

  useEffect(() => {
    const handleResize = () => {
      setScreenWidth(window.innerWidth);
      setIsMobile(window.innerWidth <= 768);
      // First, sync each chart with its current canvas ref so we don't call
      // .update() on an orphaned instance (would silently fail / blank canvas).
      syncChartCanvas(completionRateChartInstance, completionRateChartRef);
      syncChartCanvas(userBarChartInstance, userBarChartRef);
      syncChartCanvas(departmentChartRef, departmentCanvasRef);
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

      // view_type scopes the dashboard to the logged-in user (from JWT via @CurrentUser).
      // Do NOT send user_id — backend ignores query user_id and uses req.user from JwtGuard.
      let effectiveViewType;
      if (showTeamPerformance && !taskScopeCaps.isSelfOnly) {
        // Team performance mode: leave view_type empty so role filters show the team
        effectiveViewType = undefined;
      } else if (!rolePerms.isAdmin && viewType !== 'all') {
        effectiveViewType = viewType;
      } else if (!rolePerms.isAdmin && viewType === 'all') {
        // "All" still means personal involvement; leave undefined so role filters apply
        effectiveViewType = undefined;
      } else if (rolePerms.isAdmin && viewType !== 'all') {
        effectiveViewType = viewType;
      } else {
        effectiveViewType = undefined;
      }

      const statsParams = {
        start_date: range.from,
        end_date: range.to,
        department: statsDepartment,
        view_type: effectiveViewType,
      };
      const statsRes = await axiosInstance.get('/tasks/dashboard/stats', { params: statsParams });
      const statsData = statsRes.data?.data || statsRes.data;
      setTaskStats(statsData || null);

      const reportsParams = {
        start_date: range.from,
        end_date: range.to,
        department: statsDepartment,
        view_type: effectiveViewType,
      };

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
  }, [duration, selectedDepartment, rolePerms.scope, rolePerms.isAdmin, user, user?.department, user?.id, tasksDepartmentFromUser, isGeneralAdminDashboard, permissions, viewType, showTeamPerformance, taskScopeCaps.isSelfOnly, getDateRangeForDuration]);

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

    // Sync all chart instances BEFORE rendering - this destroys and nulls any
    // instance that is bound to an orphaned canvas (the root cause of blank
    // charts on filter change - only recreated on refresh before this fix).
    syncChartCanvas(completionRateChartInstance, completionRateChartRef);
    syncChartCanvas(userBarChartInstance, userBarChartRef);
    syncChartCanvas(departmentChartRef, departmentCanvasRef);

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

      const chartSizes = getResponsiveChartSizes();
      createOrUpdateDoughnutChart(
        completionRateChartRef.current.getContext('2d'),
        completionData,
        completionRateChartInstance,
        chartSizes,
        isMobile
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

      const chartSizes = getResponsiveChartSizes();

      // Create datasets only for statuses with actual data
      // Calculate responsive bar settings based on screen size - EVEN MORE SPACING!
      const getBarSettings = () => {
        if (screenWidth < 480) {
          return { barPercentage: 0.3, categoryPercentage: 0.3, maxBarThickness: 18 };
        } else if (screenWidth < 768) {
          return { barPercentage: 0.35, categoryPercentage: 0.35, maxBarThickness: 22 };
        } else if (screenWidth < 1024) {
          return { barPercentage: 0.4, categoryPercentage: 0.4, maxBarThickness: 28 };
        } else {
          return { barPercentage: 0.5, categoryPercentage: 0.5, maxBarThickness: chartSizes.maxBarThickness };
        }
      };
      const barSettings = getBarSettings();

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
        borderRadius: 4,
        borderSkipped: false,
        barPercentage: barSettings.barPercentage,
        categoryPercentage: barSettings.categoryPercentage,
        barThickness: screenWidth < 480 ? 15 : screenWidth < 768 ? 18 : screenWidth < 1024 ? 22 : chartSizes.barThickness,
        maxBarThickness: barSettings.maxBarThickness
      }));

      const data = {
        labels,
        datasets
      };

      // Validate instance is still attached to the canvas we now have in the DOM
      const deptInstanceAlive = syncChartCanvas(departmentChartRef, departmentCanvasRef);

      if (deptInstanceAlive && departmentChartRef.current) {
        departmentChartRef.current.data = data;
        // Update responsive sizes with guards
        if (!departmentChartRef.current.options.layout) {
          departmentChartRef.current.options.layout = {};
        }
        if (!departmentChartRef.current.options.layout.padding) {
          departmentChartRef.current.options.layout.padding = {};
        }
        departmentChartRef.current.options.layout.padding.bottom = screenWidth < 480 ? 40 : screenWidth < 768 ? 35 : 30;
        departmentChartRef.current.options.layout.padding.top = 10;
        departmentChartRef.current.options.layout.padding.left = 10;
        departmentChartRef.current.options.layout.padding.right = 10;

        if (departmentChartRef.current.options.plugins) {
          if (departmentChartRef.current.options.plugins.legend) {
            departmentChartRef.current.options.plugins.legend.display = !isMobile;
            if (departmentChartRef.current.options.plugins.legend.labels) {
              departmentChartRef.current.options.plugins.legend.labels.boxWidth = chartSizes.boxWidth;
              departmentChartRef.current.options.plugins.legend.labels.boxHeight = chartSizes.boxHeight;
              if (!departmentChartRef.current.options.plugins.legend.labels.font) {
                departmentChartRef.current.options.plugins.legend.labels.font = {};
              }
              departmentChartRef.current.options.plugins.legend.labels.font.size = chartSizes.legendLabelFontSize;
              departmentChartRef.current.options.plugins.legend.labels.padding = chartSizes.legendPadding;
            }
          }
          if (departmentChartRef.current.options.scales) {
            if (departmentChartRef.current.options.scales.x) {
              if (departmentChartRef.current.options.scales.x.ticks) {
                if (!departmentChartRef.current.options.scales.x.ticks.font) {
                  departmentChartRef.current.options.scales.x.ticks.font = {};
                }
                departmentChartRef.current.options.scales.x.ticks.font.size = chartSizes.tickFontSize;
                departmentChartRef.current.options.scales.x.ticks.padding = 15;
              }
              if (departmentChartRef.current.options.scales.x.title) {
                if (!departmentChartRef.current.options.scales.x.title.font) {
                  departmentChartRef.current.options.scales.x.title.font = {};
                }
                departmentChartRef.current.options.scales.x.title.font.size = chartSizes.titleFontSize;
              }
            }
            if (departmentChartRef.current.options.scales.y) {
              if (departmentChartRef.current.options.scales.y.ticks) {
                if (!departmentChartRef.current.options.scales.y.ticks.font) {
                  departmentChartRef.current.options.scales.y.ticks.font = {};
                }
                departmentChartRef.current.options.scales.y.ticks.font.size = chartSizes.tickFontSize;
              }
            }
          }
        }
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
                display: !isMobile,
                position: 'bottom',
                align: 'center',
                itemSpacing: 20,
                labels: {
                  boxWidth: chartSizes.boxWidth,
                  boxHeight: chartSizes.boxHeight,
                  font: {
                    size: chartSizes.legendLabelFontSize,
                    weight: '600',
                    family: "'Inter', sans-serif"
                  },
                  padding: chartSizes.legendPadding,
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

            },
            layout: {
              padding: {
                bottom: screenWidth < 480 ? 40 : screenWidth < 768 ? 35 : 30,
                top: 10,
                left: 10,
                right: 10
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
                    size: chartSizes.tickFontSize,
                    weight: '600',
                    family: "'Inter', sans-serif"
                  },
                  color: '#475569',
                  maxRotation: 45,
                  minRotation: 45,
                  padding: 15
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
                    size: chartSizes.tickFontSize,
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
                    size: chartSizes.titleFontSize,
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
                // cornerRadius = 3;
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
                // cornerRadius = 3;
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
          },

          ]
        });
      }
    }

    if (filteredUserReportUsers.length > 0 && userBarChartRef.current) {
      const labels = filteredUserReportUsers.map(u => u.label);
      const chartSizes = getResponsiveChartSizes();

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

      // Calculate responsive bar settings for user report too!
      const getUserBarSettings = () => {
        if (screenWidth < 480) {
          return { barPercentage: 0.3, categoryPercentage: 0.3, maxBarThickness: 18 };
        } else if (screenWidth < 768) {
          return { barPercentage: 0.35, categoryPercentage: 0.35, maxBarThickness: 22 };
        } else if (screenWidth < 1024) {
          return { barPercentage: 0.4, categoryPercentage: 0.4, maxBarThickness: 28 };
        } else {
          return { barPercentage: 0.5, categoryPercentage: 0.5, maxBarThickness: chartSizes.maxBarThickness };
        }
      };
      const userBarSettings = getUserBarSettings();

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
        barPercentage: userBarSettings.barPercentage,
        categoryPercentage: userBarSettings.categoryPercentage,
        barThickness: screenWidth < 480 ? 15 : screenWidth < 768 ? 18 : screenWidth < 1024 ? 22 : chartSizes.barThickness,
        maxBarThickness: userBarSettings.maxBarThickness
      }));

      const data = {
        labels,
        datasets
      };

      // Validate instance is still attached to the canvas we now have in the DOM
      const userBarInstanceAlive = syncChartCanvas(userBarChartInstance, userBarChartRef);

      if (userBarInstanceAlive && userBarChartInstance.current) {
        userBarChartInstance.current.data = data;
        // Update responsive sizes with guards
        if (!userBarChartInstance.current.options.layout) {
          userBarChartInstance.current.options.layout = {};
        }
        if (!userBarChartInstance.current.options.layout.padding) {
          userBarChartInstance.current.options.layout.padding = {};
        }
        userBarChartInstance.current.options.layout.padding.bottom = screenWidth < 480 ? 40 : screenWidth < 768 ? 35 : 30;
        userBarChartInstance.current.options.layout.padding.top = 10;
        userBarChartInstance.current.options.layout.padding.left = 10;
        userBarChartInstance.current.options.layout.padding.right = 10;

        if (userBarChartInstance.current.options.scales) {
          if (userBarChartInstance.current.options.scales.x) {
            if (userBarChartInstance.current.options.scales.x.ticks) {
              if (!userBarChartInstance.current.options.scales.x.ticks.font) {
                userBarChartInstance.current.options.scales.x.ticks.font = {};
              }
              userBarChartInstance.current.options.scales.x.ticks.font.size = chartSizes.tickFontSize;
              userBarChartInstance.current.options.scales.x.ticks.padding = 15;
            }
            if (userBarChartInstance.current.options.scales.x.title) {
              if (!userBarChartInstance.current.options.scales.x.title.font) {
                userBarChartInstance.current.options.scales.x.title.font = {};
              }
              userBarChartInstance.current.options.scales.x.title.font.size = chartSizes.titleFontSize;
            }
          }
          if (userBarChartInstance.current.options.scales.y) {
            if (userBarChartInstance.current.options.scales.y.ticks) {
              if (!userBarChartInstance.current.options.scales.y.ticks.font) {
                userBarChartInstance.current.options.scales.y.ticks.font = {};
              }
              userBarChartInstance.current.options.scales.y.ticks.font.size = chartSizes.tickFontSize;
            }
          }
        }
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

            },
            layout: {
              padding: {
                bottom: screenWidth < 480 ? 40 : screenWidth < 768 ? 35 : 30,
                top: 10,
                left: 10,
                right: 10
              }
            },
            scales: {
              x: {
                stacked: true,
                grid: {
                  display: true,
                  color: 'rgba(222, 15, 15, 0.04)',
                  lineWidth: 1,
                  drawBorder: false,
                  borderDash: [4, 4]
                },
                border: {
                  display: false
                },
                ticks: {
                  font: {
                    size: chartSizes.tickFontSize,
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
                    size: chartSizes.titleFontSize,
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
                  return Math.ceil(max * 1.3);
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
                    size: chartSizes.tickFontSize,
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
          plugins: [
            {
              id: 'totalLabels',
              afterDatasetsDraw: (chart) => {
                const { ctx } = chart;
                const chartWidth = chart.width;
                const chartArea = chart.chartArea;

                // Dynamic font sizing based on chart width for responsiveness
                let fontSize;

                if (chartWidth < 480) {
                  fontSize = 10;
                } else if (chartWidth < 768) {
                  fontSize = 11;
                } else {
                  fontSize = 12;
                }

                // Find the topmost y position across all datasets for each bar
                const barTopY = new Map();
                chart.data.datasets.forEach((_, datasetIndex) => {
                  const meta = chart.getDatasetMeta(datasetIndex);
                  meta.data.forEach((bar, index) => {
                    if (bar) {
                      const currentTop = bar.y;
                      const existingTop = barTopY.get(index);
                      if (existingTop === undefined || currentTop < existingTop) {
                        barTopY.set(index, currentTop);
                      }
                    }
                  });
                });

                // Draw total labels using the topmost position
                for (const [index, topY] of barTopY) {
                  // Calculate total for this bar across only VISIBLE datasets
                  let total = 0;
                  chart.data.datasets.forEach((dataset, datasetIndex) => {
                    // Only count if dataset is visible (not hidden via legend)
                    const dsMeta = chart.getDatasetMeta(datasetIndex);
                    if (!dsMeta.hidden) {
                      total += (dataset.data[index] || 0);
                    }
                  });

                  if (total > 0) {
                    ctx.save();

                    // Get x position from the first dataset's bar
                    const firstMeta = chart.getDatasetMeta(0);
                    const bar = firstMeta.data[index];
                    if (!bar) {
                      ctx.restore();
                      continue;
                    }

                    // Position text above the bar (top)
                    let x = bar.x;
                    let y = topY - 18;

                    // Ensure text stays within chart boundaries
                    if (x < chartArea.left) x = chartArea.left + 20;
                    if (x > chartArea.right) x = chartArea.right - 20;
                    if (y < chartArea.top) y = chartArea.top + fontSize + 4;

                    // Draw total value text only - no background
                    ctx.fillStyle = '#0f172a';
                    ctx.font = `600 ${fontSize}px 'Inter', sans-serif`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'bottom';
                    ctx.fillText(total, x, y);

                    ctx.restore();
                  }
                }
              }
            },
            {
              id: 'segmentLabels',
              afterDatasetsDraw: (chart) => {
                const { ctx } = chart;
                const isHorizontal = chart.options.indexAxis === 'y';
                ctx.save();

                // Pre-calculate topmost position for each bar
                const barTopPositions = new Map();
                chart.data.datasets.forEach((_, dsIdx) => {
                  const meta = chart.getDatasetMeta(dsIdx);
                  if (meta.hidden) return;
                  meta.data.forEach((bar, idx) => {
                    if (bar) {
                      let pos;
                      if (isHorizontal) {
                        // For horizontal bars, rightmost is "top"
                        pos = Math.max(bar.x, bar.base);
                      } else {
                        // For vertical bars, topmost is smallest y
                        pos = Math.min(bar.y, bar.base);
                      }

                      const existing = barTopPositions.get(idx);
                      if (existing === undefined) {
                        barTopPositions.set(idx, pos);
                      } else {
                        barTopPositions.set(idx, isHorizontal ? Math.max(existing, pos) : Math.min(existing, pos));
                      }
                    }
                  });
                });

                chart.data.datasets.forEach((dataset, datasetIndex) => {
                  const meta = chart.getDatasetMeta(datasetIndex);
                  if (meta.hidden) return;

                  meta.data.forEach((bar, index) => {
                    const value = dataset.data[index];
                    if (value <= 0 || !bar) return;

                    // Skip the topmost segment of each bar
                    const topPos = barTopPositions.get(index);
                    if (topPos !== undefined) {
                      if (isHorizontal) {
                        if (Math.max(bar.x, bar.base) === topPos) return;
                      } else {
                        if (Math.min(bar.y, bar.base) === topPos) return;
                      }
                    }

                    let centerX, centerY, segmentSize;
                    if (isHorizontal) {
                      // Horizontal bar (y-axis)
                      centerX = (bar.base + bar.x) / 2;
                      centerY = bar.y;
                      segmentSize = Math.abs(bar.x - bar.base); // width
                    } else {
                      // Vertical bar (x-axis)
                      centerX = bar.x;
                      centerY = (bar.base + bar.y) / 2;
                      segmentSize = Math.abs(bar.y - bar.base); // height
                    }

                    // Check if segment is large enough to show label
                    if (segmentSize < 12) return;

                    // Draw the segment label
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = '#ffffff';
                    ctx.font = '600 10px "Inter", sans-serif';

                    // Text shadow for readability
                    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
                    ctx.shadowBlur = 3;
                    ctx.shadowOffsetX = 0;
                    ctx.shadowOffsetY = 0;

                    ctx.fillText(value, centerX, centerY);
                  });
                });

                ctx.restore();
              }
            }
          ]
        });
      }
    }
  }, [taskStats, taskAggregates, statsSummary, rolePerms.isAdmin, hiddenDepartments, hiddenStatuses, hiddenDoughnutStatuses, hiddenDepartmentBarDepartments, filteredUserReportUsers, screenWidth]);

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
  const filterElement = (
    <div className="task-dashboard-filters">
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

      {taskScopeCaps.showTasksDropdown && (
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
            {taskScopeCaps.canViewTeam && (
              <option value="assigned_to_team">Assigned to Team</option>
            )}
            <option value="approval_tasks">Approval Tasks</option>
          </select>
        </div>
      )}

      {(rolePerms.isAdmin || rolePerms.scope === "org") &&
        isGeneralAdminDashboard && (
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
                    {String(d || "")
                      .split("_")
                      .filter(Boolean)
                      .map((w) => w[0].toUpperCase() + w.slice(1))
                      .join(" ")}
                  </option>
                ))}
            </select>
          </div>
        )}

      {taskScopeCaps.canViewTeamToggle && (
          <div className="task-filter-group">
            <span className="task-filter-label">View Mode</span>
            <button
              className={`task-filter-toggle-btn ${showTeamPerformance ? "active" : ""
                }`}
              onClick={() => setShowTeamPerformance(!showTeamPerformance)}
            >
              {showTeamPerformance
                ? "Main Dashboard"
                : "Team Performance"}
            </button>
          </div>
        )}
    </div>
  );

  return (
    <>
      <Navbar />
      <Loader loading={taskStatsLoading} />
      <div className="task-report-container">
        <PageHeader title="Tasks Dashboard" showBackButton={true} rightElement={filterElement} />
        <div className="task-dashboard-shell">
          <div className="task-dashboard-layout">
            <div className="task-dashboard-header-bottom" style={{ marginBottom: '1rem' }}>
            </div>
            {taskStats && taskAggregates && (!showTeamPerformance ? (
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
                          <FaLayerGroup className="task-stat-icon--total task-stat-icon" />
                          <div className="task-stat-label">Total Tasks</div>
                          <div className="task-stat-value">{statsSummary.total}</div>
                        </div>
                        <div className="task-stat-card task-stat-card--pending task-stat-card--active">
                          <FaHourglassHalf className="task-stat-icon--pending task-stat-icon" />
                          <div className="task-stat-label">Total Pending</div>
                          <div className="task-stat-value">
                            {statsSummary.pending}
                          </div>
                        </div>
                        <div className="task-stat-card task-stat-card--completed">
                          <FaCheck className="task-stat-icon--completed task-stat-icon" />
                          <div className="task-stat-label">Total Completed</div>
                          <div className="task-stat-value">
                            {statsSummary.completedTasks}
                          </div>
                        </div>
                        <div className="task-stat-card task-stat-card--overdue">
                          <FaExclamationTriangle className="task-stat-icon--overdue task-stat-icon" />
                          <div className="task-stat-label">Overdue Tasks</div>
                          <div className="task-stat-value">
                            {statsSummary.overdue}
                          </div>
                        </div>
                        <div className="task-stat-card task-stat-card--completion">
                          <FaChartLine className="task-stat-icon--completion task-stat-icon" />
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
                            <FaChartPie className="task-status-overview-icon" />
                            <h2 className="task-report-card-title">Status Overview</h2>
                          </div>
                          <div className="task-status-grid">
                            <div className="task-status-card task-status-card--open">
                              <FaFolderOpen className="task-status-icon" />
                              <div className="task-status-label">Open</div>
                              <div className="task-status-value">
                                {statsSummary.open}
                              </div>
                            </div>
                            <div className="task-status-card task-status-card--in-progress">
                              <FaSpinner className="task-status-icon" />
                              <div className="task-status-label">In Progress</div>
                              <div className="task-status-value">
                                {statsSummary.inProgress}
                              </div>
                            </div>
                            <div className="task-status-card task-status-card--completed">
                              <FaCheckCircle className="task-status-icon" />
                              <div className="task-status-label">Completed</div>
                              <div className="task-status-value">
                                {statsSummary.completed}
                              </div>
                            </div>
                            <div className="task-status-card task-status-card--closed">
                              <FaLock className="task-status-icon" />
                              <div className="task-status-label">Closed</div>
                              <div className="task-status-value">
                                {statsSummary.closed}
                              </div>
                            </div>
                            <div className="task-status-card task-status-card--pending-approval">
                              <FaUserClock className="task-status-icon" />
                              <div className="task-status-label">Pending Approval</div>
                              <div className="task-status-value">
                                {statsSummary.pendingApproval}
                              </div>
                            </div>
                            <div className="task-status-card task-status-card--approved">
                              <FaCheckDouble className="task-status-icon" />
                              <div className="task-status-label">Approved</div>
                              <div className="task-status-value">
                                {statsSummary.approved}
                              </div>
                            </div>
                            <div className="task-status-card task-status-card--rejected">
                              <FaTimesCircle className="task-status-icon" />
                              <div className="task-status-label">Rejected</div>
                              <div className="task-status-value">
                                {statsSummary.rejected}
                              </div>
                            </div>
                            <div className="task-status-card task-status-card--cancelled">
                              <FaBan className="task-status-icon" />
                              <div className="task-status-label">Cancelled</div>
                              <div className="task-status-value">
                                {statsSummary.cancelled}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="task-report-card task-report-card--priority-overview">
                          <div className="task-report-card-header">
                            <FaFlag className="task-status-overview-icon" />
                            <h2 className="task-report-card-title">Priority Overview</h2>
                          </div>
                          <div className="task-priority-grid">
                            <div className="task-status-card task-status-card--priority-low">
                              <FaArrowDown className="task-status-icon" />
                              <div className="task-status-label">Low</div>
                              <div className="task-status-value">
                                {prioritySummary.low}
                              </div>
                            </div>
                            <div className="task-status-card task-status-card--priority-medium">
                              <FaGripLines className="task-status-icon" />
                              <div className="task-status-label">Medium</div>
                              <div className="task-status-value">
                                {prioritySummary.medium}
                              </div>
                            </div>
                            <div className="task-status-card task-status-card--priority-high">
                              <FaArrowUp className="task-status-icon" />
                              <div className="task-status-label">High</div>
                              <div className="task-status-value">
                                {prioritySummary.high}
                              </div>
                            </div>
                            <div className="task-status-card task-status-card--priority-critical">
                              <FaExclamationCircle className="task-status-icon" />
                              <div className="task-status-label">Critical</div>
                              <div className="task-status-value">
                                {prioritySummary.critical}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="task-dashboard-column">
                      {/* Task Progress Section */}
                      <div className="task-report-card task-report-card--task-progress">
                        <div className="task-report-card-header">
                          <FaChartLine className="task-status-overview-icon" />
                          <h2 className="task-report-card-title">Task Progress</h2>
                        </div>
                        <div className="task-report-card-chart task-report-card-chart--wide">
                          <canvas ref={completionRateChartRef}></canvas>
                          <div className="task-progress-legend--task-progress">
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
                                    className="task-progress-legend-item--task-progress"
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
                                    <div className="task-progress-legend-body--task-progress">
                                      <span className="task-progress-legend-label--task-progress">
                                        {label}
                                      </span>
                                      <span className="task-progress-legend-value--task-progress">
                                        {count}
                                      </span>
                                    </div>
                                  </div>
                                );
                              });
                            })()}
                          </div>
                        </div>
                        {taskStatsLoading && <div className="loading">Loading task progress...</div>}
                        {taskStatsError && <div className="error">{taskStatsError}</div>}
                      </div>
                    </div>
                  </div>
                  {/* ========== Reports Grid ========== */}
                  <div className="task-dashboard-reports-grid">
                    {/* Project/Program-wise Task Report */}
                    {/* <ProjectProgramWiseReport projects={taskAggregates.projects} /> */}
                    {/* User-wise Task Report */}
                    {/* <div className="task-report-card task-report-card--user-report">
                      <div className="task-report-card-header task-report-card-header--with-filter" ref={userReportHeaderRef}>
                        <div className="task-report-header-left">
                          <FaUsers className="task-status-overview-icon" />
                          <h2 className="task-report-card-title">User-wise Task Report</h2>
                        </div>
                        <div className={`task-report-header-right ${showUserReportFilters ? 'task-report-header-right--visible' : ''}`}>
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
                          <button
                            className="task-report-export-button"
                            onClick={handleExportUserReport}
                            title="Export user report"
                            type="button"
                          >
                            <FaDownload /> Export
                          </button>
                        </div>
                        <button
                          className="task-report-header-menu-button"
                          onClick={() => setShowUserReportFilters(!showUserReportFilters)}
                          title={showUserReportFilters ? "Hide filters" : "Show filters"}
                          type="button"
                        >
                          <FaEllipsisH />
                        </button>
                      </div>
                      <div className="task-report-card-chart task-report-card-chart--wide">
                        <div className="task-report-slider-wrapper">
                          {userCanScrollLeft && (
                            <button
                              className="task-report-slider-button task-report-slider-button--left"
                              onClick={() => handleScroll(userReportSliderRef, 'left', false)}
                              type="button"
                            >
                              <FaChevronLeft />
                            </button>
                          )}
                          <div className="task-report-slider-container" ref={userReportSliderRef}>
                            <div
                              className="task-report-chart-inner"
                              style={{
                                width: `${Math.max(100, (filteredUserReportUsers?.length || 0) * (screenWidth < 480 ? 150 : screenWidth < 768 ? 180 : screenWidth < 1024 ? 200 : 220))}px`,
                                minWidth: '100%',
                                height: screenWidth < 480 ? '380px' : screenWidth < 768 ? '420px' : screenWidth < 1024 ? '450px' : '480px'
                              }}
                            >
                              <canvas ref={userBarChartRef}></canvas>
                            </div>
                          </div>
                          {userCanScrollRight && (
                            <button
                              className="task-report-slider-button task-report-slider-button--right"
                              onClick={() => handleScroll(userReportSliderRef, 'right', false)}
                              type="button"
                            >
                              <FaChevronRight />
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="task-progress-legend--user-report" style={{ marginTop: '0.5rem' }}>
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
                                className="task-progress-legend-item--user-report"
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
                                <span className="task-progress-legend-label--user-report">
                                  {label}: {total}
                                </span>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div> */}
                    {/* Department-wise Task Report (Only for Admin) */}
                    {/* {rolePerms.isAdmin && (
                      <div className="task-report-card task-report-card--department-report">
                        <div className="task-report-card-header task-report-card-header--with-filter" ref={deptReportHeaderRef}>
                          <div className="task-report-header-left">
                            <FaBuilding className="task-status-overview-icon" />
                            <h2 className="task-report-card-title">Department-wise Task Report</h2>
                          </div>
                          <div className={`task-report-header-right ${showDeptReportFilters ? 'task-report-header-right--visible' : ''}`}>
                            <button
                              className="task-report-export-button"
                              onClick={handleExportDepartmentReport}
                              title="Export department report"
                              type="button"
                            >
                              <FaDownload /> Export
                            </button>
                          </div>
                          <button
                            className="task-report-header-menu-button"
                            onClick={() => setShowDeptReportFilters(!showDeptReportFilters)}
                            title={showDeptReportFilters ? "Hide filters" : "Show filters"}
                            type="button"
                          >
                            <FaEllipsisH />
                          </button>
                        </div>
                        <div className="task-report-card-chart task-report-card-chart--wide">
                          <div className="task-report-slider-wrapper">
                            {deptCanScrollLeft && (
                              <button
                                className="task-report-slider-button task-report-slider-button--left"
                                onClick={() => handleScroll(deptReportSliderRef, 'left', false)}
                                type="button"
                              >
                                <FaChevronLeft />
                              </button>
                            )}
                            <div className="task-report-slider-container" ref={deptReportSliderRef}>
                              <div
                                className="task-report-chart-inner"
                                style={{
                                  width: `${Math.max(100, (Object.keys(taskStats?.department_breakdown || {}).length || 0) * (screenWidth < 480 ? 150 : screenWidth < 768 ? 180 : screenWidth < 1024 ? 200 : 220))}px`,
                                  minWidth: '100%',
                                  height: screenWidth < 480 ? '380px' : screenWidth < 768 ? '420px' : screenWidth < 1024 ? '450px' : '480px'
                                }}
                              >
                                <canvas ref={departmentCanvasRef}></canvas>
                              </div>
                            </div>
                            {deptCanScrollRight && (
                              <button
                                className="task-report-slider-button task-report-slider-button--right"
                                onClick={() => handleScroll(deptReportSliderRef, 'right', false)}
                                type="button"
                              >
                                <FaChevronRight />
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="task-progress-legend--department-report" style={{ marginTop: '0.5rem' }}>
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
                                  className="task-progress-legend-item--department-report"
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
                                  <span className="task-progress-legend-label--department-report">
                                    {String(dept || 'Unassigned').split('_').map(w => w ? w[0].toUpperCase() + w.slice(1) : '').join(' ')}: {count}
                                  </span>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    )} */}
                  </div>
                </>
              ) : (
                <TeamPerformance
                  taskAggregates={taskAggregates}
                  currentUser={user}
                  duration={duration}
                  getDateRangeForDuration={getDateRangeForDuration}
                />
              ))}
            </div>
          </div>
        </div>
    </>
  );
};

export default TaskReports;