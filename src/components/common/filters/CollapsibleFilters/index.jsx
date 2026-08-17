import React from 'react';
import './CollapsibleFilters.css';

const CollapsibleFilters = ({ open = false, children, className = '' }) => (
  <div className={`collapsible-filters ${open ? 'collapsible-filters--open' : ''} ${className}`.trim()}>
    <div className="collapsible-filters__inner">{children}</div>
  </div>
);

export default CollapsibleFilters;
