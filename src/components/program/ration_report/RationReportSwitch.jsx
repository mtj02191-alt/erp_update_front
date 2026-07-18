import React from 'react';

const RationReportSwitch = ({ checked, onChange, label, name }) => {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        name={name}
        style={{ accentColor: '#007bff', width: 18, height: 18 }}
      />
      <span>{label}</span>
    </label>
  );
};

export default RationReportSwitch; 