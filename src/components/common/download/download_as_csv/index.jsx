import React from 'react';
import { FiDownload } from 'react-icons/fi';
import './styles.css';

/**
 * DownloadCSV Component
 * A reusable component to download data as CSV file
 * 
 * @param {Array} data - Array of objects to be converted to CSV
 * @param {String} filename - Name of the downloaded file (without extension)
 * @param {Array} columns - Optional: Array of column configurations
 *   Example: [{ key: 'name', label: 'Full Name' }, { key: 'email', label: 'Email Address' }]
 *   If not provided, all keys from the first data object will be used
 * @param {String} buttonText - Text to display on the button
 * @param {String} buttonClass - Additional CSS classes for the button
 * @param {Boolean} disabled - Whether the button is disabled
 * @param {Function} onDownloadStart - Callback when download starts
 * @param {Function} onDownloadComplete - Callback when download completes
 * @param {Boolean} excludeKeys - Array of keys to exclude from CSV
 */
const DownloadCSV = ({
  data = [],
  filename = 'download',
  columns = null,
  buttonText = 'Download CSV',
  buttonClass = '',
  disabled = false,
  onDownloadStart = null,
  onDownloadComplete = null,
  excludeKeys = []
}) => {
  
  /**
   * Escape CSV values to handle commas, quotes, and newlines
   */
  const escapeCSVValue = (value) => {
    if (value === null || value === undefined) {
      return '';
    }
    
    // Convert to string
    let stringValue = String(value);
    
    // If value contains comma, quote, or newline, wrap in quotes and escape existing quotes
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      stringValue = '"' + stringValue.replace(/"/g, '""') + '"';
    }
    
    return stringValue;
  };

  /**
   * Format value based on type
   */
  const formatValue = (value) => {
    // Handle dates
    if (value instanceof Date) {
      return value.toISOString().split('T')[0];
    }
    
    // Handle objects (convert to JSON string)
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value);
    }
    
    // Handle booleans
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    
    return value;
  };

  /**
   * Convert data array to CSV string
   */
  const convertToCSV = () => {
    if (!data || data.length === 0) {
      return '';
    }

    let headers = [];
    let keys = [];

    // Determine headers and keys
    if (columns && columns.length > 0) {
      // Use provided columns configuration
      headers = columns.map(col => col.label || col.key);
      keys = columns.map(col => col.key);
    } else {
      // Use keys from first data object, excluding specified keys
      keys = Object.keys(data[0]).filter(key => !excludeKeys.includes(key));
      headers = keys.map(key => {
        // Convert snake_case to Title Case
        return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      });
    }

    // Create CSV header row
    const csvHeaders = headers.map(header => escapeCSVValue(header)).join(',');

    // Helper function to get nested value using dot notation (e.g., 'donor.name')
    const getNestedValue = (obj, path) => {
      return path.split('.').reduce((current, prop) => {
        return current && current[prop] !== undefined ? current[prop] : null;
      }, obj);
    };

    // Create CSV data rows
    const csvRows = data.map(row => {
      return keys.map(key => {
        // Support nested keys with dot notation (e.g., 'donor.name')
        const value = key.includes('.') ? getNestedValue(row, key) : row[key];
        const formattedValue = formatValue(value);
        return escapeCSVValue(formattedValue);
      }).join(',');
    });

    // Combine headers and rows
    return [csvHeaders, ...csvRows].join('\n');
  };

  /**
   * Handle download action
   */
  const handleDownload = () => {
    if (!data || data.length === 0) {
      console.warn('No data to download');
      return;
    }

    // Trigger onDownloadStart callback
    if (onDownloadStart) {
      onDownloadStart();
    }

    try {
      // Convert data to CSV
      const csvContent = convertToCSV();

      // Create blob
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

      // Create download link
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      // Set link attributes
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}.csv`);
      link.style.visibility = 'hidden';

      // Append to body, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up URL
      URL.revokeObjectURL(url);

      // Trigger onDownloadComplete callback
      if (onDownloadComplete) {
        onDownloadComplete();
      }

      console.log(`CSV downloaded: ${filename}.csv`);
    } catch (error) {
      console.error('Error downloading CSV:', error);
    }
  };

  return (
    <button
      className={`download-csv-button ${buttonClass}`}
      onClick={handleDownload}
      disabled={disabled || !data || data.length === 0}
      title={data && data.length > 0 ? 'Download as CSV' : 'No data to download'}
    >
      <FiDownload className="download-csv-icon" />
      <span className="download-csv-text">{buttonText}</span>
    </button>
  );
};

export default DownloadCSV;
