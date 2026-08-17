import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Sidebar.css';

const SidebarItem = ({ item, activeItem, onNavigate }) => {
  const [expanded, setExpanded] = useState(false);

  const toggleExpanded = () => setExpanded(!expanded);

  const handleNavigate = (event) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }
    onNavigate?.();
  };

  const handleHeaderWithSubItemsClick = (event) => {
    const isPlainLeftClick =
      event.button === 0 &&
      !event.metaKey &&
      !event.ctrlKey &&
      !event.shiftKey &&
      !event.altKey;

    // Keep original behavior: clicking the parent header expands/collapses.
    if (isPlainLeftClick) {
      event.preventDefault();
      toggleExpanded();
      return;
    }

    // Ctrl/Cmd/middle/right-click should behave like a real link (open in new tab).
    onNavigate?.();
  };

  const isActive = activeItem === item.path || 
    item.subItems?.some(subItem => activeItem === subItem.path);

  const hasSubItems = item.subItems && item.subItems.length > 0;
  const headerClassName = `sidebar-item-header ${isActive ? 'sidebar-item-header--active' : ''}`;

  return (
    <div className="sidebar-item">
      {hasSubItems ? (
        item.path ? (
          <Link
            to={item.path}
            className={headerClassName}
            onClick={handleHeaderWithSubItemsClick}
          >
            {item.icon && (
              <span className="sidebar-item-icon">
                <item.icon />
              </span>
            )}
            <span className="sidebar-item-label">{item.label}</span>
            <span
              className={`sidebar-item-arrow ${
                expanded ? 'sidebar-item-arrow--expanded' : ''
              }`}
            >
              ▶
            </span>
          </Link>
        ) : (
          <div
            className={headerClassName}
            onClick={toggleExpanded}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                toggleExpanded();
              }
            }}
          >
            {item.icon && <span className="sidebar-item-icon"><item.icon /></span>}
            <span className="sidebar-item-label">{item.label}</span>
            <span className={`sidebar-item-arrow ${expanded ? 'sidebar-item-arrow--expanded' : ''}`}>
              ▶
            </span>
          </div>
        )
      ) : (
        <Link
          to={item.path}
          className={headerClassName}
          onClick={handleNavigate}
        >
          {item.icon && <span className="sidebar-item-icon"><item.icon /></span>}
          <span className="sidebar-item-label">{item.label}</span>
        </Link>
      )}
      
      {expanded && hasSubItems && (
        <div className="sidebar-sub-items">
          {item.subItems.map((subItem, index) => {
            const isSubActive = activeItem === subItem.path;
            return (
              <Link
                key={index}
                to={subItem.path}
                className={`sidebar-sub-item ${isSubActive ? 'sidebar-sub-item--active' : ''}`}
                onClick={handleNavigate}
              >
                {subItem.icon && <span className="sidebar-sub-item-icon"><subItem.icon /></span>}
                <span className="sidebar-sub-item-label">{subItem.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SidebarItem; 
