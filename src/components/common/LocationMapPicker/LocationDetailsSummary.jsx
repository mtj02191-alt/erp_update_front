import React from 'react';
import { formatCoordinates, getLocationDetailRows } from '../../../utils/geolocation';
import './LocationMapPicker.css';

export default function LocationDetailsSummary({ details, latitude, longitude, title = 'Location details' }) {
  const rows = getLocationDetailRows(details);

  if (!rows.length && latitude == null && longitude == null) {
    return null;
  }

  return (
    <div className="location-details-summary">
      <div className="location-details-summary__title">{title}</div>
      {rows.length > 0 ? (
        <div className="location-details-summary__grid">
          {rows.map((row) => (
            <div key={row.label} className="location-details-summary__item">
              <span className="location-details-summary__label">{row.label}</span>
              <span className="location-details-summary__value">{row.value}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="location-details-summary__empty">
          Structured address not available for these coordinates.
        </div>
      )}
      {latitude != null && longitude != null && (
        <div className="location-details-summary__coords">
          Coordinates: {formatCoordinates(latitude, longitude)}
        </div>
      )}
      {details?.display_name && (
        <div className="location-details-summary__full">
          Full: {details.display_name}
        </div>
      )}
    </div>
  );
}
