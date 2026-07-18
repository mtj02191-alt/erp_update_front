import React from 'react';
import { SheetActions } from '../SheetActions';
import { FaCalendarAlt, FaCalendarCheck } from 'react-icons/fa';
import './index.css';

const SheetCard = ({ sheet, onEdit, onDelete, onConvert }) => {
  return (
    <div className="pcs-sheet-card">
      <div className="pcs-sheet-header">
        <h3 className="pcs-sheet-name">{sheet.project_name}</h3>
        <SheetActions
          sheet={sheet}
          onEdit={onEdit}
          onDelete={onDelete}
          onConvert={onConvert}
        />
      </div>

      {sheet.project_details && (
        <p className="pcs-sheet-description">{sheet.project_details}</p>
      )}

      <div className="pcs-sheet-meta">
        {sheet.start_date && (
          <div className="pcs-meta-item">
            <span className="pcs-meta-icon"><FaCalendarAlt /></span>
            <span className="pcs-meta-text">{new Date(sheet.start_date).toLocaleDateString()}</span>
          </div>
        )}
        {sheet.end_date && (
          <div className="pcs-meta-item">
            <span className="pcs-meta-icon"><FaCalendarCheck /></span>
            <span className="pcs-meta-text">{new Date(sheet.end_date).toLocaleDateString()}</span>
          </div>
        )}
        <span
          className={`pcs-status-badge pcs-status-${(sheet.status || "Pending")
              .trim()
              .toLowerCase()
              .replace(/\s+/g, "-")
            }`}
        >
          {sheet.status || "Pending"}
        </span>
      </div>
    </div>
  );
};

export default SheetCard;
