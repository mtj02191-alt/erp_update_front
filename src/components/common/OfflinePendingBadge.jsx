import React from 'react';

const OfflinePendingBadge = ({ show }) => {
  if (!show) return null;
  return (
    <span
      style={{
        marginLeft: 8,
        fontSize: '0.7rem',
        fontWeight: 700,
        color: '#b45309',
        background: '#fef3c7',
        padding: '2px 6px',
        borderRadius: 4,
        whiteSpace: 'nowrap',
      }}
    >
      Pending sync
    </span>
  );
};

export default OfflinePendingBadge;
