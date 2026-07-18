import React, { useRef, useEffect, useMemo } from 'react';
import { Chart, registerables } from 'chart.js';
import { RiDownload2Fill } from 'react-icons/ri';
import { toPng } from 'html-to-image';
import './index.css';

Chart.register(...registerables);

/**
 * Reusable LineChart Component
 * 
 * @param {string} title - Chart title (optional)
 * @param {Object} data - Chart.js data object { labels: [], datasets: [] }
 * @param {Object} options - Chart.js options object (optional, will merge with defaults)
 * @param {number} height - Chart height in pixels (default: 300)
 * @param {boolean} showDownload - Show download button (default: true)
 * @param {string} downloadFileName - Custom download filename (optional)
 */
const LineChart = ({ 
  title, 
  data, 
  options = {}, 
  height = 300,
  showDownload = true,
  downloadFileName 
}) => {
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const containerRef = useRef(null);

  // Default color palette for datasets
  const defaultColors = [
    { border: 'rgb(54, 162, 235)', fill: 'rgba(54, 162, 235, 0.2)' }, // Blue
    { border: 'rgb(255, 99, 132)', fill: 'rgba(255, 99, 132, 0.2)' }, // Red/Pink
    { border: 'rgb(75, 192, 192)', fill: 'rgba(75, 192, 192, 0.2)' }, // Teal
    { border: 'rgb(255, 206, 86)', fill: 'rgba(255, 206, 86, 0.2)' }, // Yellow
    { border: 'rgb(153, 102, 255)', fill: 'rgba(153, 102, 255, 0.2)' }, // Purple
    { border: 'rgb(255, 159, 64)', fill: 'rgba(255, 159, 64, 0.2)' }, // Orange
    { border: 'rgb(201, 203, 207)', fill: 'rgba(201, 203, 207, 0.2)' }, // Grey
    { border: 'rgb(255, 99, 255)', fill: 'rgba(255, 99, 255, 0.2)' }, // Magenta
  ];

  // Process data to add default styling to datasets
  const processedData = useMemo(() => {
    if (!data || !data.datasets) return data;

    return {
      ...data,
      datasets: data.datasets.map((dataset, index) => {
        // Check if dataset needs default styling
        const needsDefaultStyling = !dataset.borderColor || !dataset.backgroundColor;
        
        if (!needsDefaultStyling) {
          // Dataset has styling, but ensure other defaults are set
          return {
            borderWidth: dataset.borderWidth || 2,
            fill: dataset.fill !== undefined ? dataset.fill : true,
            tension: dataset.tension !== undefined ? dataset.tension : 0.4,
            pointRadius: dataset.pointRadius !== undefined ? dataset.pointRadius : 3,
            pointBackgroundColor: dataset.pointBackgroundColor || dataset.borderColor,
            pointBorderColor: dataset.pointBorderColor || '#fff',
            pointBorderWidth: dataset.pointBorderWidth !== undefined ? dataset.pointBorderWidth : 1,
            ...dataset
          };
        }

        // Apply default colors and styling
        const colorIndex = index % defaultColors.length;
        const colors = defaultColors[colorIndex];

        return {
          ...dataset,
          borderColor: dataset.borderColor || colors.border,
          backgroundColor: dataset.backgroundColor || colors.fill,
          borderWidth: dataset.borderWidth || 2,
          fill: dataset.fill !== undefined ? dataset.fill : true,
          tension: dataset.tension !== undefined ? dataset.tension : 0.4,
          pointRadius: dataset.pointRadius !== undefined ? dataset.pointRadius : 3,
          pointBackgroundColor: dataset.pointBackgroundColor || colors.border,
          pointBorderColor: dataset.pointBorderColor || '#fff',
          pointBorderWidth: dataset.pointBorderWidth !== undefined ? dataset.pointBorderWidth : 1,
        };
      })
    };
  }, [data]);

  // Merge default options with user-provided options
  const chartOptions = useMemo(() => {
    const defaultPlugins = {
      legend: { display: false },
      tooltip: { enabled: true }
    };

    const defaultScales = {
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 45
        }
      },
      y: {
        beginAtZero: true
      }
    };

    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        ...defaultPlugins,
        ...(options.plugins || {}),
        legend: {
          ...defaultPlugins.legend,
          ...(options.plugins?.legend || {})
        },
        tooltip: {
          ...defaultPlugins.tooltip,
          ...(options.plugins?.tooltip || {})
        }
      },
      scales: {
        ...defaultScales,
        ...(options.scales || {}),
        x: {
          ...defaultScales.x,
          ...(options.scales?.x || {})
        },
        y: {
          ...defaultScales.y,
          ...(options.scales?.y || {})
        }
      },
      ...options
    };
  }, [options]);

  // Create or update chart
  useEffect(() => {
    if (!chartRef.current || !processedData) return;

    const ctx = chartRef.current.getContext('2d');

    if (chartInstanceRef.current) {
      // Update existing chart
      chartInstanceRef.current.data = processedData;
      chartInstanceRef.current.options = chartOptions;
      chartInstanceRef.current.update();
    } else {
      // Create new chart
      chartInstanceRef.current = new Chart(ctx, {
        type: 'line',
        data: processedData,
        options: chartOptions
      });
    }

    // Cleanup function
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [processedData, chartOptions]);

  const handleDownload = async () => {
    if (containerRef.current === null) return;

    try {
      const dataUrl = await toPng(containerRef.current, {
        cacheBust: true,
        backgroundColor: '#ffffff'
      });
      const link = document.createElement('a');
      const fileName = downloadFileName || 
        (title ? title.toLowerCase().replace(/\s+/g, '-') : 'line-chart');
      link.download = `${fileName}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Error generating image:', err);
    }
  };

  if (!data || !processedData) {
    return (
      <div className="line-chart-container">
        <div className="line-chart-error">No data available</div>
      </div>
    );
  }

  return (
    <div className="line-chart-container" ref={containerRef}>
      {(title || showDownload) && (
        <div className="line-chart-header">
          {title && <h2 className="line-chart-title">{title}</h2>}
          {showDownload && (
            <button
              onClick={handleDownload}
              className="line-chart-download-btn"
              title="Download as PNG"
            >
              <RiDownload2Fill />
            </button>
          )}
        </div>
      )}
      <div className="line-chart-wrapper" style={{ height: `${height}px` }}>
        <canvas ref={chartRef}></canvas>
      </div>
    </div>
  );
};

export default LineChart;

