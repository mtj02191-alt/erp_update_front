/**
 * Read device GPS via the browser Geolocation API (Google Maps / phone GPS).
 * Not related to the ERP geographic routes/cities module.
 */
export function getCurrentDeviceLocation(options = {}) {
  const {
    enableHighAccuracy = true,
    timeout = 15000,
    maximumAge = 0,
  } = options;

  return new Promise((resolve, reject) => {
    if (!navigator?.geolocation) {
      reject(new Error('Geolocation is not supported by this browser or device.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        const messages = {
          1: 'Location permission denied. Please allow location access to continue.',
          2: 'Unable to determine your location. Please check GPS/network and try again.',
          3: 'Location request timed out. Please try again.',
        };
        reject(new Error(messages[error.code] || error.message || 'Failed to get location.'));
      },
      { enableHighAccuracy, timeout, maximumAge },
    );
  });
}

export async function resolveLocationName(latitude, longitude, axiosInstance) {
  const details = await resolveLocationDetails(latitude, longitude, axiosInstance);
  return details?.display_name || details?.location_name || null;
}

export async function resolveLocationDetails(latitude, longitude, axiosInstance) {
  if (!axiosInstance || latitude == null || longitude == null) {
    return null;
  }

  try {
    const response = await axiosInstance.get('/donation-box/reverse-geocode', {
      params: { lat: latitude, lng: longitude },
    });
    const data = response.data?.data;
    if (!data) return null;
    return {
      ...(data.location_details || {}),
      display_name: data.location_name || data.location_details?.display_name || null,
      location_name: data.location_name || data.location_details?.display_name || null,
    };
  } catch {
    return null;
  }
}

export function getLocationDetailRows(details) {
  if (!details) return [];
  return [
    { label: 'Shop / point', value: details.place_or_shop },
    { label: 'Road / address', value: details.road_address },
    { label: 'City', value: details.city },
    { label: 'Area', value: details.area },
    { label: 'District', value: details.district },
    { label: 'Province', value: details.province },
    { label: 'Country', value: details.country },
  ].filter((row) => row.value);
}

export async function getCurrentDeviceLocationWithName(axiosInstance, options = {}) {
  const location = await getCurrentDeviceLocation(options);
  const details = await resolveLocationDetails(
    location.latitude,
    location.longitude,
    axiosInstance,
  );

  return {
    ...location,
    location_details: details,
    location_name: details?.display_name || details?.location_name || null,
  };
}

export function formatCoordinates(latitude, longitude) {
  if (latitude == null || longitude == null) return '-';
  return `${Number(latitude).toFixed(6)}, ${Number(longitude).toFixed(6)}`;
}

export function formatLocationDisplay(location) {
  if (!location) return '-';

  const coords = formatCoordinates(location.latitude, location.longitude);
  if (location.location_name) {
    return `${location.location_name} (${coords})`;
  }

  return coords;
}

/** Allowed collection distance from registered box coordinates (meters). */
export const DEFAULT_COLLECTION_RADIUS_METERS = 100;
export const MIN_COLLECTION_RADIUS_METERS = 10;
export const MAX_COLLECTION_RADIUS_METERS = 10000;

/** @deprecated use DEFAULT_COLLECTION_RADIUS_METERS */
export const COLLECTION_LOCATION_RADIUS_METERS = DEFAULT_COLLECTION_RADIUS_METERS;

export function metersToRadiusForm(meters) {
  const value = Number(meters);
  if (!Number.isFinite(value) || value <= 0) {
    return { value: DEFAULT_COLLECTION_RADIUS_METERS, unit: 'm' };
  }
  if (value >= 1000 && value % 1000 === 0) {
    return { value: value / 1000, unit: 'km' };
  }
  return { value, unit: 'm' };
}

export function radiusFormToMeters(value, unit) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return unit === 'km' ? Math.round(amount * 1000) : Math.round(amount);
}

export function formatRadiusDisplay(meters) {
  if (meters == null || !Number.isFinite(Number(meters))) return '-';
  const m = Number(meters);
  if (m >= 1000) {
    const km = m / 1000;
    return Number.isInteger(km) ? `${km} km` : `${km.toFixed(2)} km`;
  }
  return `${Math.round(m)} m`;
}

export function validateCollectionRadiusMeters(meters) {
  const value = Number(meters);
  if (!Number.isFinite(value)) {
    return 'Please enter a valid collection margin.';
  }
  if (value < MIN_COLLECTION_RADIUS_METERS) {
    return `Collection margin must be at least ${MIN_COLLECTION_RADIUS_METERS} m.`;
  }
  if (value > MAX_COLLECTION_RADIUS_METERS) {
    return `Collection margin cannot exceed ${formatRadiusDisplay(MAX_COLLECTION_RADIUS_METERS)}.`;
  }
  return null;
}

export function getGoogleMapsUrl(latitude, longitude) {
  if (latitude == null || longitude == null) return '#';
  return `https://www.google.com/maps?q=${latitude},${longitude}`;
}

export function getGoogleMapsEmbedUrl(latitude, longitude, zoom = 18) {
  if (latitude == null || longitude == null || !Number.isFinite(Number(latitude)) || !Number.isFinite(Number(longitude))) {
    return `https://maps.google.com/maps?q=Pakistan&hl=en&z=6&output=embed`;
  }
  return `https://maps.google.com/maps?q=${latitude},${longitude}&hl=en&z=${zoom}&output=embed`;
}

/**
 * Parse "lat, lng" text or a Google Maps share link.
 */
export function parseCoordinateInput(input) {
  if (!input || typeof input !== 'string') return null;
  const text = input.trim();

  const fromUrl = parseGoogleMapsUrl(text);
  if (fromUrl) return fromUrl;

  const pair = text.match(/^(-?\d+(?:\.\d+)?)\s*[, ]\s*(-?\d+(?:\.\d+)?)$/);
  if (pair) {
    return { latitude: parseFloat(pair[1]), longitude: parseFloat(pair[2]) };
  }

  return null;
}

/**
 * Extract coordinates from a shared Google Maps URL (after user drops a pin).
 */
export function parseGoogleMapsUrl(input) {
  if (!input || typeof input !== 'string') return null;
  const text = input.trim();

  let match = text.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (match) {
    return { latitude: parseFloat(match[1]), longitude: parseFloat(match[2]) };
  }

  match = text.match(/[?&]q=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (match) {
    return { latitude: parseFloat(match[1]), longitude: parseFloat(match[2]) };
  }

  match = text.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
  if (match) {
    return { latitude: parseFloat(match[1]), longitude: parseFloat(match[2]) };
  }

  return null;
}

export function distanceMeters(lat1, lon1, lat2, lon2) {
  const earthRadiusMeters = 6371000;
  const toRadians = (degrees) => (degrees * Math.PI) / 180;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) ** 2;
  return earthRadiusMeters * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
