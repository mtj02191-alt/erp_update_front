import React from 'react';
import './Welcome.css';

const Welcome = ({ title = 'Welcome', message = 'Use the sidebar to access features.' }) => (
  <div className="module-wrapper">
    <div className="module-content">
      <h2 className="primary-heading">{title}</h2>
      <p className="welcome-text">{message}</p>
    </div>
  </div>
);

export default Welcome; 