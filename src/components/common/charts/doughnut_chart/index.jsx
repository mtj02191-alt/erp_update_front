import React, { useEffect, useMemo, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import { RiDownload2Fill } from 'react-icons/ri';
import { toPng } from 'html-to-image';
import './index.css';

Chart.register(...registerables);

const DEFAULT_COLORS = ['#22c55e', '#2563eb', '#f59e0b', '#7c3aed', '#06b6d4', '#f97316'];

/**
 * Reusable DoughnutChart (Chart.js)
 *
 * @param {string} [title]
 * @param {{ labels: string[], values: number[], colors?: string[] }} data
 * @param {number} [height=320]
 * @param {boolean} [showDownload=true]
 * @param {string} [downloadFileName]
 * @param {(ctx: any) => string} [formatTooltipLabel]
 */
export default function DoughnutChart({
  title = 'Donation Mix',
  data,
  height = 320,
  showDownload = true,
  downloadFileName,
  formatTooltipLabel,
}) {
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const containerRef = useRef(null);

  const chartData = useMemo(() => {
    if (!data?.labels?.length || !data?.values?.length) return null;
    const colors = Array.isArray(data.colors) && data.colors.length ? data.colors : DEFAULT_COLORS;
    return {
      labels: data.labels,
      datasets: [
        {
          data: data.values,
          backgroundColor: data.values.map((_, i) => colors[i % colors.length]),
          borderWidth: 0,
          hoverOffset: 6,
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
            label: (ctx) => {
              if (formatTooltipLabel) return formatTooltipLabel(ctx);
              const label = ctx?.label || '';
              const v = Number(ctx?.raw ?? 0);
              return `${label}: ${Number.isFinite(v) ? v.toLocaleString() : 0}`;
            },
          },
        },
      },
      cutout: '68%',
    }),
    [formatTooltipLabel],
  );

  useEffect(() => {
    if (!chartRef.current || !chartData) return;
    const ctx = chartRef.current.getContext('2d');
    if (chartInstanceRef.current) {
      chartInstanceRef.current.data = chartData;
      chartInstanceRef.current.options = options;
      chartInstanceRef.current.update();
    } else {
      chartInstanceRef.current = new Chart(ctx, {
        type: 'doughnut',
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
      link.download = `${downloadFileName || 'doughnut-chart'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Error generating image:', err);
    }
  };

  if (!chartData) {
    return (
      <div className="doughnut-chart-container">
        <div className="doughnut-chart-error">No data available</div>
      </div>
    );
  }

  const total = (data?.values || []).reduce((s, v) => s + Number(v || 0), 0);

  return (
    <div className="doughnut-chart-container" ref={containerRef}>
      {(title || showDownload) && (
        <div className="doughnut-chart-header">
          {title && <h2 className="doughnut-chart-title">{title}</h2>}
          {showDownload && (
            <button type="button" onClick={handleDownload} className="doughnut-chart-download-btn" title="Download as PNG">
              <RiDownload2Fill />
            </button>
          )}
        </div>
      )}
      <div className="doughnut-chart-wrapper" style={{ height: `${height}px` }}>
        <div className="doughnut-chart-center">
          <div className="doughnut-chart-center__label">Total</div>
          <div className="doughnut-chart-center__value">{Number(total || 0).toLocaleString()}</div>
        </div>
        <canvas ref={chartRef} />
      </div>
      <div className="doughnut-chart-legend">
        {(data.labels || []).map((lbl, i) => {
          const v = Number(data.values?.[i] ?? 0);
          const pct = total > 0 ? (v / total) * 100 : 0;
          const color = (data.colors?.[i] || DEFAULT_COLORS[i % DEFAULT_COLORS.length]);
          return (
            <div key={lbl} className="doughnut-chart-legend__row">
              <span className="doughnut-chart-legend__dot" style={{ background: color }} />
              <span className="doughnut-chart-legend__label">{lbl}</span>
              <span className="doughnut-chart-legend__meta">
                {pct.toFixed(1)}% ({Number.isFinite(v) ? v.toLocaleString() : '0'})
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

