import React, { useState } from 'react';
import './Sidebar.css';

const SidebarItem = ({ item, activeItem, onItemClick }) => {
  const [expanded, setExpanded] = useState(false);

  const toggleExpanded = (e) => {
    if (e) {
      e.stopPropagation();
    }
    setExpanded(!expanded);
  };

  const handleItemClick = (path) => {
    onItemClick(path);
  };

  const isActive = activeItem === item.path || 
    item.subItems?.some(subItem => activeItem === subItem.path);

  const hasSubItems = item.subItems && item.subItems.length > 0;

  return (
    <div className="sidebar-item">
      <div 
        className={`sidebar-item-header ${isActive ? 'sidebar-item-header--active' : ''}`}
        onClick={() => hasSubItems ? toggleExpanded() : handleItemClick(item.path)}
      >
        {item.icon && <span className="sidebar-item-icon"><item.icon /></span>}
        <span className="sidebar-item-label">{item.label}</span>
        {hasSubItems && (
          <span className={`sidebar-item-arrow ${expanded ? 'sidebar-item-arrow--expanded' : ''}`}>
            ▶
          </span>
        )}
      </div>
      
      {expanded && hasSubItems && (
        <div className="sidebar-sub-items">
          {item.subItems.map((subItem, index) => {
            const isSubActive = activeItem === subItem.path;
            return (
              <div
                key={index}
                className={`sidebar-sub-item ${isSubActive ? 'sidebar-sub-item--active' : ''}`}
                onClick={() => handleItemClick(subItem.path)}
              >
                {subItem.icon && <span className="sidebar-sub-item-icon"><subItem.icon /></span>}
                <span className="sidebar-sub-item-label">{subItem.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SidebarItem; 
