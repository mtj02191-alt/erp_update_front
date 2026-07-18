import React, { useState } from 'react';
import { FiEdit2, FiTrash2, FiEye, FiPlus } from 'react-icons/fi';
import ActionMenu from './ActionMenu';

const ExampleListComponent = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Example data
  const items = [
    { id: 1, name: 'Item 1', status: 'Active', date: '2024-01-15', description: 'Description for item 1' },
    { id: 2, name: 'Item 2', status: 'Pending', date: '2024-01-16', description: 'Description for item 2' },
    { id: 3, name: 'Item 3', status: 'Completed', date: '2024-01-17', description: 'Description for item 3' },
  ];

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = !dateFilter || item.date === dateFilter;
    return matchesSearch && matchesDate;
  });

  const getActionMenuItems = (item) => [
    {
      icon: <FiEye />,
      label: 'View',
      color: '#4CAF50',
      onClick: () => console.log('View', item),
      visible: true
    },
    {
      icon: <FiEdit2 />,
      label: 'Edit',
      color: '#2196F3',
      onClick: () => console.log('Edit', item),
      visible: true
    },
    {
      icon: <FiTrash2 />,
      label: 'Delete',
      color: '#f44336',
      onClick: () => console.log('Delete', item),
      visible: true
    }
  ];

  return (
    <div className="list-wrapper">
      <div className="list-content">
        {/* Header with title, filters, and action button */}
        <div className="list-header">
          <h2 className="header-title">Example List</h2>
          <div className="list-filters">
            <input
              type="text"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input"
            />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="form-input"
            />
          </div>
          <button className="primary_btn">
            <FiPlus /> Add New Item
          </button>
        </div>

        {/* Table Container */}
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Status</th>
                <th>Date</th>
                <th className="hide-on-mobile">Description</th>
                <th className="table-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div className="project-info">
                      <div className="project-name">{item.name}</div>
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge status-${item.status.toLowerCase()}`}>
                      {item.status}
                    </span>
                  </td>
                  <td>{new Date(item.date).toLocaleDateString()}</td>
                  <td className="hide-on-mobile">{item.description}</td>
                  <td className="table-actions">
                    <ActionMenu actions={getActionMenuItems(item)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {filteredItems.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <div className="empty-state-text">No items found</div>
            <div className="empty-state-subtext">Try adjusting your search or filters</div>
          </div>
        )}

        {/* Mobile Card View (Optional) */}
        <div className="list-cards">
          {filteredItems.map((item) => (
            <div key={item.id} className="list-card">
              <div className="list-card-info">
                <h3>{item.name}</h3>
                <div className="list-card-status">{item.status}</div>
                <div className="list-card-budget">{new Date(item.date).toLocaleDateString()}</div>
              </div>
              <ActionMenu actions={getActionMenuItems(item)} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExampleListComponent; 