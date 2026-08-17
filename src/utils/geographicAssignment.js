export const EMPTY_GEOGRAPHIC_ASSIGNMENTS = {
  countries: [],
  regions: [],
  districts: [],
  tehsils: [],
  cities: [],
  routes: [],
};

export const GEO_TYPE_TO_FIELD = {
  country: 'countries',
  region: 'regions',
  district: 'districts',
  tehsil: 'tehsils',
  city: 'cities',
  route: 'routes',
};

export const GEO_TYPE_LABELS = {
  country: 'Country',
  region: 'Region',
  district: 'District',
  tehsil: 'Tehsil',
  city: 'City',
  route: 'Route',
};

export const itemKey = (item) => `${item.type}:${item.id}`;

export const hasAnyGeographicAssignment = (value) =>
  Object.values(value || {}).some((arr) => Array.isArray(arr) && arr.length > 0);

export const normalizeGeographicAssignments = (raw = {}) => ({
  countries: Array.isArray(raw.countries) ? raw.countries : raw.assigned_countries || [],
  regions: Array.isArray(raw.regions) ? raw.regions : raw.assigned_regions || [],
  districts: Array.isArray(raw.districts) ? raw.districts : raw.assigned_districts || [],
  tehsils: Array.isArray(raw.tehsils) ? raw.tehsils : raw.assigned_tehsils || [],
  cities: Array.isArray(raw.cities) ? raw.cities : raw.assigned_cities || [],
  routes: Array.isArray(raw.routes) ? raw.routes : raw.assigned_routes || [],
});

export const toUserGeographicPayload = (value) => ({
  assigned_countries: value.countries?.length ? value.countries : null,
  assigned_regions: value.regions?.length ? value.regions : null,
  assigned_districts: value.districts?.length ? value.districts : null,
  assigned_tehsils: value.tehsils?.length ? value.tehsils : null,
  assigned_cities: value.cities?.length ? value.cities : null,
  assigned_routes: value.routes?.length ? value.routes : null,
});
