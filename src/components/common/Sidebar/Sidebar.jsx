import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import SidebarGroup from './SidebarGroup';
import { getSidebarConfig } from './sidebarConfig';
import { FiChevronsLeft, FiChevronsRight } from 'react-icons/fi';
import { FaArrowRightArrowLeft } from 'react-icons/fa6';
import './Sidebar.css';

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeItem, setActiveItem] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const { user, permissions } = useAuth();

  useEffect(() => {
    setActiveItem(location.pathname);
  }, [location.pathname]);

  const handleItemClick = (path) => {
    navigate(path);
    // Close mobile sidebar after navigation
    setMobileOpen(false);
  };

  const toggleCollapse = () => {
    setCollapsed(!collapsed);
  };

  const toggleMobile = () => {
    setMobileOpen(!mobileOpen);
  };

  const closeMobile = () => {
    setMobileOpen(false);
  };

  const sidebarConfig = getSidebarConfig(user, permissions);

  // Debug logging (remove in production)
  useEffect(() => {
    if (user && permissions) {
      // console.log('Sidebar - User:', user);
      // console.log('Sidebar - Permissions:', permissions);
      // console.log('Sidebar - Config:', sidebarConfig);
    }
  }, [user, permissions, sidebarConfig]);

  return (
    <>
      {/* Mobile Hamburger Icon */}
      <button 
        className={`mobile-hamburger${mobileOpen ? ' mobile-hamburger--shifted' : ''}`}
        onClick={toggleMobile}
        title="Toggle Sidebar"
      >
        <FaArrowRightArrowLeft />
      </button>

      {/* Mobile Overlay */}
      <div 
        className={`sidebar-overlay ${mobileOpen ? 'sidebar-overlay--visible' : ''}`}
        onClick={closeMobile}
      />

      {/* Sidebar */}
      <div className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''} ${mobileOpen ? 'sidebar--mobile-open' : ''}`}>
        <div className="sidebar-content">
          {/* Global Toggle Button */}
          <div className="sidebar-toggle-container">
            <button 
              className="sidebar-toggle"
              onClick={toggleCollapse}
              title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {collapsed ? <FiChevronsRight /> : <FiChevronsLeft />}
            </button>
          </div>

          {sidebarConfig.map((group) => (
            <SidebarGroup
              key={group.id}
              group={group}
              collapsed={collapsed}
              activeItem={activeItem}
              onItemClick={handleItemClick}
            />
          ))}
        </div>
      </div>
    </>
  );
};

export default Sidebar; 