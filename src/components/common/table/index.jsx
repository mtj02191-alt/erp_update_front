import React from 'react';

/**
 * Table Component
 * A reusable table component that follows the application's design system
 * Uses global CSS classes: .table-container, .data-table, .hide-on-mobile, .table-actions
 * 
 * @param {Array} columns - Array of column definitions
 *   Example: [
 *     { 
 *       key: 'id', 
 *       label: 'ID', 
 *       render: (value, row) => <span>#{value}</span>,
 *       hideOnMobile: false,
 *       className: ''
 *     }
 *   ]
 * @param {Array} data - Array of data objects to display
 * @param {Function} renderActions - Function to render action menu for each row (receives row item)
 * @param {boolean} showActions - Whether to show actions column (default: true)
 * @param {string} emptyMessage - Message to show when no data (default: 'No data available')
 * @param {Function} onRowClick - Optional callback when row is clicked
 * @param {string} className - Additional CSS classes for table container
 * @param {boolean} striped - Enable striped rows (default: false)
 * @param {boolean} hoverable - Enable row hover effect (default: true)
 */
const Table = ({
  columns = [],
  data = [],
  renderActions,
  showActions = true,
  emptyMessage = 'No data available',
  onRowClick,
  className = '',
  striped = false,
  hoverable = true
}) => {
  
  // Get value from nested object using dot notation
  const getNestedValue = (obj, path) => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  };

  // Render cell content
  const renderCell = (column, row) => {
    const value = getNestedValue(row, column.key);
    
    // If custom render function is provided, use it
    if (column.render) {
      return column.render(value, row);
    }
    
    // Default rendering
    return value ?? '-';
  };

  if (data.length === 0) {
    return (
      <div className={`table-container ${className}`}>
        <div className="empty-state" style={{ padding: '40px', textAlign: 'center' }}>
          <div style={{ fontSize: '2em', marginBottom: '10px' }}>📋</div>
          <div style={{ color: '#666' }}>{emptyMessage}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`table-container ${className}`}>
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((column, index) => (
              <th 
                key={column.key || index}
                className={`${column.hideOnMobile ? 'hide-on-mobile' : ''} ${column.headerClassName || ''}`}
              >
                {column.label}
              </th>
            ))}
            {showActions && renderActions && (
              <th className="table-actions">Actions</th>
            )}
          </tr>
        </thead>
        <tbody>
          {data?.data.map((row, rowIndex) => (
            <tr 
              key={row.id || rowIndex}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              style={{ 
                cursor: onRowClick ? 'pointer' : 'default',
                ...(striped && rowIndex % 2 === 1 ? { backgroundColor: '#f9fafb' } : {})
              }}
              className={hoverable ? 'hoverable-row' : ''}
            >
              {columns.map((column, colIndex) => (
                <td 
                  key={column.key || colIndex}
                  className={`${column.hideOnMobile ? 'hide-on-mobile' : ''} ${column.cellClassName || ''}`}
                >
                  {renderCell(column, row)}
                </td>
              ))}
              {showActions && renderActions && (
                <td className="table-actions">
                  {renderActions(row)}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;

