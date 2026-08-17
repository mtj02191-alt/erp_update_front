import React, { useCallback, useEffect, useState } from 'react';
import {
  DEFAULT_COLLECTION_RADIUS_METERS,
  formatRadiusDisplay,
  distanceMeters,
  formatCoordinates,
  getCurrentDeviceLocation,
  getGoogleMapsUrl,
  parseCoordinateInput,
  resolveLocationDetails,
} from '../../../utils/geolocation';
import LocationDetailsSummary from './LocationDetailsSummary';
import './LocationMapPicker.css';

/**
 * Manual location entry: GPS hint → Google Maps in new tab → paste coordinates.
 */
export function LocationMapPicker({
  value,
  onChange,
  axiosInstance,
  disabled = false,
}) {
  const [loadingGps, setLoadingGps] = useState(false);
  const [resolvingName, setResolvingName] = useState(false);
  const [error, setError] = useState('');
  const [pasteInput, setPasteInput] = useState('');
  const [latInput, setLatInput] = useState('');
  const [lngInput, setLngInput] = useState('');

  const latitude = value?.latitude != null ? Number(value.latitude) : null;
  const longitude = value?.longitude != null ? Number(value.longitude) : null;
  const hasCoords =
    latitude != null &&
    longitude != null &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude);

  useEffect(() => {
    if (value?.latitude != null) setLatInput(String(value.latitude));
    if (value?.longitude != null) setLngInput(String(value.longitude));
  }, [value?.latitude, value?.longitude]);

  const applyCoordinates = useCallback(async (nextLat, nextLng) => {
    if (!Number.isFinite(nextLat) || !Number.isFinite(nextLng)) {
      setError('Please enter valid latitude and longitude.');
      return;
    }
    if (nextLat < -90 || nextLat > 90 || nextLng < -180 || nextLng > 180) {
      setError('Latitude must be between -90 and 90, longitude between -180 and 180.');
      return;
    }

    setError('');
    setLatInput(String(nextLat));
    setLngInput(String(nextLng));

    onChange?.({
      latitude: nextLat,
      longitude: nextLng,
      location_name: value?.location_name || null,
      location_details: value?.location_details || null,
    });

    if (!axiosInstance) return;

    setResolvingName(true);
    try {
      const details = await resolveLocationDetails(nextLat, nextLng, axiosInstance);
      onChange?.({
        latitude: nextLat,
        longitude: nextLng,
        location_name: details?.display_name || details?.location_name || null,
        location_details: details,
      });
    } finally {
      setResolvingName(false);
    }
  }, [axiosInstance, onChange, value?.location_details, value?.location_name]);

  const openGoogleMaps = (lat, lng) => {
    const url =
      lat != null && lng != null
        ? getGoogleMapsUrl(lat, lng)
        : 'https://www.google.com/maps';
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleUseMyLocation = async () => {
    setLoadingGps(true);
    setError('');
    try {
      const current = await getCurrentDeviceLocation();
      setLatInput(String(current.latitude));
      setLngInput(String(current.longitude));
      openGoogleMaps(current.latitude, current.longitude);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingGps(false);
    }
  };

  const handleApplyPaste = async () => {
    const parsed = parseCoordinateInput(pasteInput);
    if (!parsed) {
      setError('Paste coordinates as "latitude, longitude" or a Google Maps link.');
      return;
    }
    await applyCoordinates(parsed.latitude, parsed.longitude);
    setPasteInput('');
  };

  const handleApplyManualCoords = async () => {
    await applyCoordinates(parseFloat(latInput), parseFloat(lngInput));
  };

  return (
    <div className="location-map-picker">
      <ol className="location-map-picker__steps">
        <li>Click <strong>Get my GPS &amp; open Google Maps</strong> (approximate starting point).</li>
        <li>In Google Maps, drop a pin on the exact shop spot and copy the coordinates.</li>
        <li>Paste below or type latitude / longitude, then click <strong>Save coordinates</strong>.</li>
      </ol>

      <div className="location-map-picker__toolbar">
        <button
          type="button"
          className="secondary_btn"
          onClick={handleUseMyLocation}
          disabled={disabled || loadingGps}
        >
          {loadingGps ? 'Getting GPS...' : 'Get my GPS & open Google Maps'}
        </button>
        <button
          type="button"
          className="secondary_btn"
          onClick={() => openGoogleMaps(
            latInput ? parseFloat(latInput) : latitude,
            lngInput ? parseFloat(lngInput) : longitude,
          )}
          disabled={disabled}
        >
          Open Google Maps
        </button>
      </div>

      {error && (
        <div className="status-message status-message--error">{error}</div>
      )}

      <div className="location-map-picker__field-row">
        <label className="location-map-picker__label">Paste coordinates or Google Maps link</label>
        <div className="location-map-picker__inline">
          <input
            type="text"
            className="form-input"
            value={pasteInput}
            onChange={(e) => setPasteInput(e.target.value)}
            placeholder='e.g. 30.523203, 72.230367 or https://maps.google.com/...'
            disabled={disabled}
          />
          <button
            type="button"
            className="secondary_btn"
            onClick={handleApplyPaste}
            disabled={disabled || !pasteInput.trim()}
          >
            Apply
          </button>
        </div>
      </div>

      <div className="location-map-picker__coords-grid">
        <div>
          <label className="location-map-picker__label">Latitude</label>
          <input
            type="number"
            step="any"
            className="form-input"
            value={latInput}
            onChange={(e) => setLatInput(e.target.value)}
            placeholder="e.g. 30.523203"
            disabled={disabled}
          />
        </div>
        <div>
          <label className="location-map-picker__label">Longitude</label>
          <input
            type="number"
            step="any"
            className="form-input"
            value={lngInput}
            onChange={(e) => setLngInput(e.target.value)}
            placeholder="e.g. 72.230367"
            disabled={disabled}
          />
        </div>
        <div className="location-map-picker__coords-action">
          <button
            type="button"
            className="primary_btn"
            onClick={handleApplyManualCoords}
            disabled={disabled || !latInput || !lngInput}
          >
            Save coordinates
          </button>
        </div>
      </div>

      {hasCoords ? (
        <div className="location-map-picker__summary">
          {resolvingName ? (
            <div>Resolving address details...</div>
          ) : (
            <LocationDetailsSummary
              details={value?.location_details}
              latitude={latitude}
              longitude={longitude}
              title="Saved location"
            />
          )}
          <div style={{ marginTop: '8px' }}>
            <a
              className="location-map-picker__link"
              href={getGoogleMapsUrl(latitude, longitude)}
              target="_blank"
              rel="noreferrer"
            >
              Verify in Google Maps
            </a>
          </div>
        </div>
      ) : (
        <div className="location-map-picker__summary location-map-picker__summary--muted">
          No coordinates saved yet.
        </div>
      )}
    </div>
  );
}

export function CollectionLocationMap({
  boxLocation,
  radiusMeters = DEFAULT_COLLECTION_RADIUS_METERS,
  axiosInstance,
}) {
  const [userLocation, setUserLocation] = useState(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');

  const boxLat = boxLocation?.latitude != null ? Number(boxLocation.latitude) : null;
  const boxLng = boxLocation?.longitude != null ? Number(boxLocation.longitude) : null;
  const hasBoxCoords =
    boxLat != null && boxLng != null && Number.isFinite(boxLat) && Number.isFinite(boxLng);

  const distance = userLocation?.distanceMeters;
  const withinRadius = distance != null && distance <= radiusMeters;

  const handleCheckLocation = async () => {
    setChecking(true);
    setError('');
    try {
      const current = await getCurrentDeviceLocation();
      let location_details = null;
      if (axiosInstance) {
        location_details = await resolveLocationDetails(
          current.latitude,
          current.longitude,
          axiosInstance,
        );
      }

      const meters = hasBoxCoords
        ? distanceMeters(boxLat, boxLng, current.latitude, current.longitude)
        : null;

      setUserLocation({
        ...current,
        location_details,
        location_name: location_details?.display_name || null,
        distanceMeters: meters,
      });
    } catch (err) {
      setError(err.message);
      setUserLocation(null);
    } finally {
      setChecking(false);
    }
  };

  if (!hasBoxCoords) {
    return (
      <p className="location-map-picker__hint">
        This box has no registered coordinates yet.
      </p>
    );
  }

  return (
    <div className="location-map-picker">
      <LocationDetailsSummary
        details={boxLocation?.location_details}
        latitude={boxLat}
        longitude={boxLng}
        title="Registered box location"
      />

      <p className="location-map-picker__hint" style={{ marginTop: '12px' }}>
        Collection is allowed within <strong>{formatRadiusDisplay(radiusMeters)}</strong> of the registered point above.
      </p>

      <div className="location-map-picker__toolbar">
        <button
          type="button"
          className="secondary_btn"
          onClick={handleCheckLocation}
          disabled={checking}
        >
          {checking ? 'Checking GPS...' : 'Check my current GPS'}
        </button>
        <a
          className="location-map-picker__link"
          href={getGoogleMapsUrl(boxLat, boxLng)}
          target="_blank"
          rel="noreferrer"
        >
          Open box location in Google Maps
        </a>
      </div>

      {error && (
        <div className="status-message status-message--error">{error}</div>
      )}

      {userLocation && distance != null && (
        <div className={`location-map-picker__summary ${withinRadius ? '' : 'location-map-picker__summary--muted'}`}>
          <LocationDetailsSummary
            details={userLocation.location_details}
            latitude={userLocation.latitude}
            longitude={userLocation.longitude}
            title="Your current GPS"
          />
          <div style={{ marginTop: '8px' }}>
            Distance from box:{' '}
            <span className={withinRadius ? 'location-map-picker__distance-ok' : 'location-map-picker__distance-bad'}>
              {Math.round(distance)}m
            </span>
            {' '}(allowed: up to {formatRadiusDisplay(radiusMeters)})
          </div>
          {!withinRadius && (
            <div style={{ marginTop: '6px', color: '#b91c1c' }}>
              You are outside the allowed area. Move closer to the box or use a bypass-permitted account.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default LocationMapPicker;
