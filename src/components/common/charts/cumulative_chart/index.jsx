import React, { useRef, useEffect, useMemo } from 'react';
import { Chart, registerables } from 'chart.js';
import { RiDownload2Fill } from 'react-icons/ri';
import { toPng } from 'html-to-image';
import './index.css';

Chart.register(...registerables);

/**
 * Cumulative fundraising line chart (total raised over time).
 *
 * @param {string} [title] - Chart title (e.g. "Cumulative")
 * @param {string} [subtitle] - Optional small caption under title
 * @param {Object} data - { labels: string[], values: number[] } — labels = period (e.g. months), values = cumulative amount
 * @param {number} [height=300] - Chart height in px
 * @param {boolean} [showDownload=true] - Show download as PNG
 * @param {string} [downloadFileName] - Custom download filename
 */
const CumulativeChart = ({
  title = 'Cumulative',
  subtitle,
  data,
  height = 300,
  showDownload = true,
  downloadFileName,
}) => {
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const containerRef = useRef(null);

  const chartData = useMemo(() => {
    if (!data?.labels?.length || !data?.values?.length) return null;
    return {
      labels: data.labels,
      datasets: [
        {
          label: 'Total raised',
          data: data.values,
          borderColor: 'rgb(54, 162, 235)',
          backgroundColor: 'rgba(54, 162, 235, 0.1)',
          fill: true,
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 4,
          pointBackgroundColor: 'rgb(54, 162, 235)',
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
              const v = ctx.raw;
              if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
              if (v >= 1e3) return `${(v / 1e3).toFixed(0)}K`;
              return String(v);
            },
          },
        },
      },
      scales: {
        x: {
          ticks: { maxRotation: 45, minRotation: 45 },
        },
        y: {
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
        type: 'line',
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
      link.download = `${downloadFileName || 'cumulative-chart'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Error generating image:', err);
    }
  };

  if (!chartData) {
    return (
      <div className="cumulative-chart-container">
        <div className="cumulative-chart-error">No data available</div>
      </div>
    );
  }

  return (
    <div className="cumulative-chart-container" ref={containerRef}>
      {(title || showDownload) && (
        <div className="cumulative-chart-header">
          <div className="cumulative-chart-heading">
            {title && <h2 className="cumulative-chart-title">{title}</h2>}
            {subtitle ? <p className="cumulative-chart-subtitle">{subtitle}</p> : null}
          </div>
          {showDownload && (
            <button
              type="button"
              onClick={handleDownload}
              className="cumulative-chart-download-btn"
              title="Download as PNG"
            >
              <RiDownload2Fill />
            </button>
          )}
        </div>
      )}
      <div className="cumulative-chart-wrapper" style={{ height: `${height}px` }}>
        <canvas ref={chartRef} />
      </div>
    </div>
  );
};

export default CumulativeChart;
