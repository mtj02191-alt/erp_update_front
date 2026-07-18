import React, { useRef, useEffect, useMemo } from 'react';
import { Chart, registerables } from 'chart.js';
import { RiDownload2Fill } from 'react-icons/ri';
import { toPng } from 'html-to-image';
import './index.css';

Chart.register(...registerables);

const DEFAULT_COLORS = [
  'rgba(100, 181, 246, 0.9)',   // Online - light blue
  'rgba(255, 193, 7, 0.9)',     // Phone - amber
  'rgba(156, 39, 176, 0.9)',    // Events - purple
  'rgba(123, 31, 162, 0.9)',    // Corporate - dark purple
];

/**
 * Grouped bar chart: "Raised each month" by source (Online, Phone, Events, Corporate).
 *
 * @param {string} [title] - Chart title (e.g. "Raised each month")
 * @param {Object} data - { labels: string[], datasets: [{ label: string, data: number[] }] }
 * @param {number} [height=320] - Chart height in px
 * @param {boolean} [showDownload=true] - Show download as PNG
 * @param {string} [downloadFileName] - Custom download filename
 */
const RaisedEachMonthChart = ({
  title = 'Raised each month',
  data,
  height = 320,
  showDownload = true,
  downloadFileName,
}) => {
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const containerRef = useRef(null);

  const chartData = useMemo(() => {
    if (!data?.labels?.length || !data?.datasets?.length) return null;
    return {
      labels: data.labels,
      datasets: data.datasets.map((ds, i) => ({
        label: ds.label,
        data: ds.data,
        backgroundColor: ds.backgroundColor || DEFAULT_COLORS[i % DEFAULT_COLORS.length],
        borderColor: ds.borderColor || undefined,
        borderWidth: ds.borderWidth ?? 0,
      })),
    };
  }, [data]);

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top',
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
            label: (ctx) => {
              const v = ctx.raw;
              if (v >= 1e6) return `${ctx.dataset.label}: ${(v / 1e6).toFixed(1)}M`;
              if (v >= 1e3) return `${ctx.dataset.label}: ${(v / 1e3).toFixed(0)}K`;
              return `${ctx.dataset.label}: ${v}`;
            },
          },
        },
      },
      scales: {
        x: {
          stacked: false,
          ticks: { maxRotation: 45, minRotation: 45 },
        },
        y: {
          stacked: false,
          beginAtZero: true,
          ticks: {
            callback: (value) => {
              if (value >= 1e6) return `${value / 1e6}M`;
              if (value >= 1e3) return `${value / 1e3}K`;
              return String(value);
            },
          },
        },
      },
    }),
    [],
  );

  useEffect(() => {
    if (!chartRef.current || !chartData) return;
    const ctx = chartRef.current.getContext('2d');

    if (chartInstanceRef.current) {
      chartInstanceRef.current.data = chartData;
      chartInstanceRef.current.update();
    } else {
      chartInstanceRef.current = new Chart(ctx, {
        type: 'bar',
        data: chartData,
        options,
      });
    }

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [chartData, options]);

  const handleDownload = async () => {
    if (!containerRef.current) return;
    try {
      const dataUrl = await toPng(containerRef.current, {
        cacheBust: true,
        backgroundColor: '#ffffff',
      });
      const link = document.createElement('a');
      link.download = `${downloadFileName || 'raised-each-month-chart'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Error generating image:', err);
    }
  };

  if (!chartData) {
    return (
      <div className="raised-each-month-container">
        <div className="raised-each-month-error">No data available</div>
      </div>
    );
  }

  return (
    <div className="raised-each-month-container" ref={containerRef}>
      {(title || showDownload) && (
        <div className="raised-each-month-header">
          {title && <h2 className="raised-each-month-title">{title}</h2>}
          {showDownload && (
            <button
              type="button"
              onClick={handleDownload}
              className="raised-each-month-download-btn"
              title="Download as PNG"
            >
              <RiDownload2Fill />
            </button>
          )}
        </div>
      )}
      <div className="raised-each-month-wrapper" style={{ height: `${height}px` }}>
        <canvas ref={chartRef} />
      </div>
    </div>
  );
};

export default RaisedEachMonthChart;
