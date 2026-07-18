import React, { useEffect, useMemo, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import { RiDownload2Fill } from 'react-icons/ri';
import { toPng } from 'html-to-image';
import './index.css';

Chart.register(...registerables);

/**
 * Simple bar chart for comparing counts (e.g. donors, boxes, events, campaigns).
 *
 * @param {string} [title]
 * @param {{ labels: string[], values: number[] }} data
 * @param {number} [height=320]
 * @param {boolean} [showDownload=true]
 * @param {string} [downloadFileName]
 */
export default function OverviewComparisonChart({
  title = 'Overview Comparison',
  subtitle,
  data,
  height = 320,
  showDownload = true,
  downloadFileName,
}) {
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const containerRef = useRef(null);

  const chartData = useMemo(() => {
    if (!data?.labels?.length || !data?.values?.length) return null;
    return {
      labels: data.labels,
      datasets: [
        {
          label: 'Count',
          data: data.values,
          backgroundColor: [
            '#2563eb',
            '#7c3aed',
            '#f59e0b',
            '#14b8a6',
            '#22c55e',
            '#f97316',
            '#06b6d4',
          ].slice(0, data.values.length),
          borderRadius: 8,
          borderSkipped: false,
          maxBarThickness: 56,
        },
      ],
    };
  }, [data]);

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.raw ?? 0}`,
          },
        },
      },
      scales: {
        x: {
          ticks: { maxRotation: 0, autoSkip: false },
          grid: { display: false },
        },
        y: {
          beginAtZero: true,
          ticks: { precision: 0 },
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
      link.download = `${downloadFileName || 'overview-comparison'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Error generating image:', err);
    }
  };

  if (!chartData) {
    return (
      <div className="overview-comparison-chart-container">
        <div className="overview-comparison-chart-error">No data available</div>
      </div>
    );
  }

  return (
    <div className="overview-comparison-chart-container" ref={containerRef}>
      {(title || showDownload) && (
        <div className="overview-comparison-chart-header">
          <div className="overview-comparison-chart-heading">
            {title && <h2 className="overview-comparison-chart-title">{title}</h2>}
            {subtitle ? <p className="overview-comparison-chart-subtitle">{subtitle}</p> : null}
          </div>
          {showDownload && (
            <button
              type="button"
              onClick={handleDownload}
              className="overview-comparison-chart-download-btn"
              title="Download as PNG"
            >
              <RiDownload2Fill />
            </button>
          )}
        </div>
      )}
      <div className="overview-comparison-chart-wrapper" style={{ height: `${height}px` }}>
        <canvas ref={chartRef} />
      </div>
    </div>
  );
}

