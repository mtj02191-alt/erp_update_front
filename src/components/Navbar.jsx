import React, { useEffect, useRef, useState } from 'react';
import { FiChevronDown, FiLogOut, FiUser } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import './Navbar.css';
import mtjfLogo from '../assets/mtjf_logo.png';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      // The logout function in AuthContext will handle the redirect
    } catch (error) {
      console.error('Logout failed:', error);
      // Force redirect even if logout fails
      window.location.href = '/';
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <img src={mtjfLogo} alt="MTJF Logo" className="navbar-logo" />
          <h2>Operations Report</h2>
        </div>
        <div className="navbar-actions" ref={menuRef}>
          <button
            type="button"
            className="navbar-user-trigger"
            aria-label="Open user menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className="navbar-user-avatar">
              <FiUser />
              {unreadCount > 0 && (
                <span className="navbar-user-badge" aria-label={`${unreadCount} unread notifications`}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </span>
            <FiChevronDown className={`navbar-user-chevron${menuOpen ? ' navbar-user-chevron--open' : ''}`} />
          </button>

          {menuOpen && (
            <div className="navbar-user-menu">
              <div className="navbar-user-menu__header">
                <div className="navbar-user-menu__avatar">
                  <FiUser />
                </div>
                <div className="navbar-user-menu__info">
                  <div className="navbar-user-menu__name">{user?.name || user?.email || 'User'}</div>
                  <div className="navbar-user-menu__role">{user?.role || 'Member'}</div>
                  {user?.department ? (
                    <div className="navbar-user-menu__department">{user.department}</div>
                  ) : null}
                </div>
              </div>

              <div className="navbar-user-menu__meta">
                <span>Notifications</span>
                <strong>{unreadCount > 0 ? unreadCount : 0}</strong>
              </div>

              <button type="button" onClick={handleLogout} className="logout-button">
                <FiLogOut />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 