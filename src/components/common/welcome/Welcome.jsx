import React from 'react';
import { FiHeart } from 'react-icons/fi';
import './Welcome.css';

const Welcome = ({
  title = 'Welcome',
  message = 'Use the sidebar to access features.',
}) => (
  <div className="welcome-bg">
    <div className="welcome-card">
      <h2 className="welcome-title">{title}</h2>
      <div className="welcome-divider" aria-hidden>
        <span className="welcome-divider__line" />
        <FiHeart className="welcome-divider__icon" />
        <span className="welcome-divider__line" />
      </div>
      <p className="welcome-text">{message}</p>
    </div>
  </div>
);

export default Welcome;
