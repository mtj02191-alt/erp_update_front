import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import FormInput from '../../../common/FormInput';
import FormSelect from '../../../common/FormSelect';
import SearchableMultiSelect from '../../../common/SearchableMultiSelect';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import DonationBoxAuditHistory from '../shared/DonationBoxAuditHistory';
import LocationMapPicker from '../../../common/LocationMapPicker';
import {
  DEFAULT_COLLECTION_RADIUS_METERS,
  metersToRadiusForm,
  radiusFormToMeters,
  validateCollectionRadiusMeters,
} from '../../../../utils/geolocation';

const EditDonationBox = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [auditRefreshKey, setAuditRefreshKey] = useState(0);

  const [donationBox, setDonationBox] = useState(null);

  const [settingsForm, setSettingsForm] = useState({
    key_no: '',
    box_type: 'medium',
    status: 'active',
    collection_frequency: 'weekly',
    landmark_marketplace: '',
    require_collection_location: true,
    location_radius_value: String(DEFAULT_COLLECTION_RADIUS_METERS),
    location_radius_unit: 'm',
  });
  const [savingSettings, setSavingSettings] = useState(false);

  const [relocateForm, setRelocateForm] = useState({
    region: '',
    city: '',
    city_id: '',
    route_id: '',
    shop_name: '',
    shopkeeper: '',
    cell_no: '',
    landmark_marketplace: '',
    active_since: new Date().toISOString().split('T')[0],
    relocation_note: '',
    assigned_user_ids: [],
  });
  const [assignedUsers, setAssignedUsers] = useState([]);
  const [relocating, setRelocating] = useState(false);
  const [relocateLocation, setRelocateLocation] = useState(null);

  const [regions, setRegions] = useState([]);
  const [cities, setCities] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loadingRegions, setLoadingRegions] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingRoutes, setLoadingRoutes] = useState(false);

  const fetchRegions = async () => {
    try {
      setLoadingRegions(true);
      const response = await axiosInstance.get('/regions?country_id=1');
      if (response.data.success) {
        setRegions(response.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching regions:', err);
      setError('Failed to load regions');
    } finally {
      setLoadingRegions(false);
    }
  };

  const fetchCities = async (regionId) => {
    try {
      setLoadingCities(true);
      const response = await axiosInstance.get(`/cities?region_id=${regionId}`);
      if (response.data.success) {
        setCities(response.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching cities:', err);
      setError('Failed to load cities');
    } finally {
      setLoadingCities(false);
    }
  };

  const fetchRoutes = async (cityId) => {
    try {
      setLoadingRoutes(true);
      const response = await axiosInstance.get(`/routes?city_id=${cityId}`);
      if (response.data.success) {
        setRoutes(response.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching routes:', err);
      setError('Failed to load routes');
    } finally {
      setLoadingRoutes(false);
    }
  };

  const fetchDonationBox = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axiosInstance.get(`/donation-box/${id}`);
      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Failed to load donation box');
      }

      const box = response.data.data;
      setDonationBox(box);
      const radiusForm = metersToRadiusForm(
        box.location_radius_meters || DEFAULT_COLLECTION_RADIUS_METERS,
      );
      setSettingsForm({
        key_no: box.key_no || '',
        box_type: box.box_type || 'medium',
        status: box.status || 'active',
        collection_frequency: box.collection_frequency || box.frequency || 'weekly',
        landmark_marketplace: box.landmark_marketplace || '',
        require_collection_location: box.require_collection_location !== false,
        location_radius_value: String(radiusForm.value),
        location_radius_unit: radiusForm.unit,
      });

      const regionId = box.route?.region?.id || box.route?.region_id || '';
      const cityId = box.city_id || '';
      if (regionId) {
        await fetchCities(regionId);
      }
      if (cityId) {
        await fetchRoutes(cityId);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load donation box');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchRegions();
    fetchDonationBox();
  }, [fetchDonationBox]);

  const handleBack = () => navigate(`/dms/donation_box/view/${id}`);

  const handleSettingsChange = (e) => {
    const { name, value, type, checked } = e.target;
    const nextValue = type === 'checkbox' ? checked : value;
    setSettingsForm((prev) => ({ ...prev, [name]: nextValue }));
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleRelocateChange = (e) => {
    const { name, value } = e.target;
    setRelocateForm((prev) => {
      const next = { ...prev, [name]: value };
      if (name === 'region') {
        next.city = '';
        next.city_id = '';
        next.route_id = '';
        setCities([]);
        setRoutes([]);
        if (value) fetchCities(value);
      } else if (name === 'city') {
        next.city_id = value;
        next.route_id = '';
        setRoutes([]);
        if (value) fetchRoutes(value);
      }
      return next;
    });
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleAssignedUsersSelect = (selectedUsers) => {
    setAssignedUsers(selectedUsers);
    const userIds = selectedUsers.map((user) => user.id);
    setRelocateForm((prev) => ({ ...prev, assigned_user_ids: userIds }));
  };

  const handleAssignedUsersClear = () => {
    setAssignedUsers([]);
    setRelocateForm((prev) => ({ ...prev, assigned_user_ids: [] }));
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    setError('');
    setSuccess('');
    try {
      const locationRadiusMeters = radiusFormToMeters(
        settingsForm.location_radius_value,
        settingsForm.location_radius_unit,
      );
      const radiusError = settingsForm.require_collection_location
        ? validateCollectionRadiusMeters(locationRadiusMeters)
        : null;
      if (radiusError) {
        setError(radiusError);
        setSavingSettings(false);
        return;
      }

      const payload = {
        key_no: settingsForm.key_no || null,
        box_type: settingsForm.box_type,
        status: settingsForm.status,
        frequency: settingsForm.collection_frequency,
        landmark_marketplace: settingsForm.landmark_marketplace?.trim() || null,
        require_collection_location: settingsForm.require_collection_location,
        location_radius_meters: locationRadiusMeters,
      };
      const response = await axiosInstance.patch(`/donation-box/${id}`, payload);
      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Failed to update donation box');
      }
      setDonationBox(response.data.data);
      setSuccess('Box settings updated successfully.');
      setAuditRefreshKey((k) => k + 1);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to update donation box');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleRelocate = async (e) => {
    e.preventDefault();
    if (!relocateForm.shop_name?.trim()) {
      setError('Shop name is required to relocate the box.');
      return;
    }

    if (donationBox?.require_collection_location !== false && !relocateLocation) {
      setError('Please select the new shop location on the map.');
      return;
    }

    setRelocating(true);
    setError('');
    setSuccess('');
    try {
      const location = relocateLocation;

      const payload = {
        route_id: relocateForm.route_id ? Number(relocateForm.route_id) : null,
        city_id: relocateForm.city_id ? Number(relocateForm.city_id) : undefined,
        shop_name: relocateForm.shop_name.trim(),
        shopkeeper: relocateForm.shopkeeper?.trim() || undefined,
        cell_no: relocateForm.cell_no?.trim() || undefined,
        landmark_marketplace: relocateForm.landmark_marketplace?.trim() || undefined,
        active_since: relocateForm.active_since || undefined,
        relocation_note: relocateForm.relocation_note?.trim() || undefined,
        assigned_user_ids: relocateForm.assigned_user_ids,
      };

      if (location) {
        payload.registration_latitude = location.latitude;
        payload.registration_longitude = location.longitude;
        payload.registration_location_name = location.location_name || undefined;
        payload.registration_location_details = location.location_details || undefined;
      }

      const response = await axiosInstance.patch(`/donation-box/${id}/relocate`, payload);
      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Failed to relocate donation box');
      }

      setSuccess(
        'Donation box relocated successfully. Your reporting manager has been notified by email.',
      );
      setAuditRefreshKey((k) => k + 1);
      setRelocateForm({
        region: '',
        city: '',
        city_id: '',
        route_id: '',
        shop_name: '',
        shopkeeper: '',
        cell_no: '',
        landmark_marketplace: '',
        active_since: new Date().toISOString().split('T')[0],
        relocation_note: '',
        assigned_user_ids: [],
      });
      setAssignedUsers([]);
      setRelocateLocation(null);
      await fetchDonationBox();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to relocate donation box');
    } finally {
      setRelocating(false);
    }
  };

  const boxTypeOptions = [
    { value: 'small', label: 'Small' },
    { value: 'medium', label: 'Medium' },
    { value: 'large', label: 'Large' },
    { value: 'medium_star', label: 'Medium/Star' },
    { value: 'premium', label: 'Premium' },
    { value: 'standard', label: 'Standard' },
  ];

  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'damaged', label: 'Damaged' },
    { value: 'retired', label: 'Retired' },
    { value: 'pending', label: 'Pending' },
  ];

  const collectionFrequencyOptions = [
    { value: 'weekly', label: 'Weekly' },
    { value: 'biweekly', label: 'Bi-Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'yearly', label: 'Yearly' },
  ];

  const currentCityName =
    donationBox?.route?.cities?.find((city) => city.id === donationBox.city_id)?.name ||
    '—';

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="form-content">
          <PageHeader title="Update Donation Box" onBack={handleBack} />
          <div className="loading">Loading...</div>
        </div>
      </>
    );
  }

  if (!donationBox) {
    return (
      <>
        <Navbar />
        <div className="form-content">
          <PageHeader title="Update Donation Box" onBack={handleBack} />
          <div className="status-message status-message--error">
            {error || 'Donation box not found'}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="form-content">
        <PageHeader
          title={`Update Donation Box — Key ${donationBox.key_no || donationBox.id}`}
          onBack={handleBack}
        />

        {error && <div className="status-message status-message--error">{error}</div>}
        {success && <div className="status-message status-message--success">{success}</div>}

        <div className="form-section">
          <h3 className="form-section-heading">Current shop placement</h3>
          <p className="form-section-hint" style={{ marginBottom: '12px', color: '#6b7280' }}>
            This is where the box is placed today. Use the relocate form below to move it to a new shop.
          </p>
          <div className="view-grid">
            <div className="view-item">
              <span className="view-item-label">Region</span>
              <span className="view-item-value">{donationBox.route?.region?.name || '—'}</span>
            </div>
            <div className="view-item">
              <span className="view-item-label">City</span>
              <span className="view-item-value">{currentCityName}</span>
            </div>
            <div className="view-item">
              <span className="view-item-label">Route</span>
              <span className="view-item-value">{donationBox.route?.name || '—'}</span>
            </div>
            <div className="view-item">
              <span className="view-item-label">Shop name</span>
              <span className="view-item-value">{donationBox.shop_name || '—'}</span>
            </div>
            <div className="view-item">
              <span className="view-item-label">Shopkeeper</span>
              <span className="view-item-value">{donationBox.shopkeeper || '—'}</span>
            </div>
            <div className="view-item">
              <span className="view-item-label">Cell number</span>
              <span className="view-item-value">{donationBox.cell_no || '—'}</span>
            </div>
            <div className="view-item">
              <span className="view-item-label">Landmark</span>
              <span className="view-item-value">{donationBox.landmark_marketplace || '—'}</span>
            </div>
            <div className="view-item">
              <span className="view-item-label">FRD officers</span>
              <span className="view-item-value">
                {donationBox.assignedUsers?.map((u) => `${u.first_name} ${u.last_name}`).join(', ') ||
                  '—'}
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleRelocate} className="form">
          <div className="form-section">
            <h3 className="form-section-heading">Relocate to new shop</h3>
            <p className="form-section-hint" style={{ marginBottom: '16px', color: '#6b7280' }}>
              Assign this same physical box to a new shop. A full audit record is kept and your
              reporting manager will receive an in-app notification and email.
            </p>
            <div className="form-grid-2">
              <FormSelect
                label="Region"
                name="region"
                value={relocateForm.region}
                onChange={handleRelocateChange}
                options={regions.map((region) => ({ value: region.id, label: region.name }))}
                required
                disabled={loadingRegions}
                placeholder={loadingRegions ? 'Loading regions...' : 'Select region'}
              />

              <FormSelect
                label="City"
                name="city"
                value={relocateForm.city}
                onChange={handleRelocateChange}
                options={cities.map((city) => ({ value: city.id, label: city.name }))}
                required
                disabled={loadingCities || !relocateForm.region}
                placeholder={
                  loadingCities
                    ? 'Loading cities...'
                    : !relocateForm.region
                      ? 'Select region first'
                      : 'Select city'
                }
              />

              <FormSelect
                label="Route (optional)"
                name="route_id"
                value={relocateForm.route_id}
                onChange={handleRelocateChange}
                options={routes.map((route) => ({ value: route.id, label: route.name }))}
                disabled={loadingRoutes || !relocateForm.city}
                showDefaultOption
                defaultOptionText={
                  loadingRoutes
                    ? 'Loading routes...'
                    : !relocateForm.city
                      ? 'Select city first'
                      : 'No route'
                }
              />

              <FormInput
                label="Active since (at new shop)"
                type="date"
                name="active_since"
                value={relocateForm.active_since}
                onChange={handleRelocateChange}
              />

              <FormInput
                label="New shop name"
                type="text"
                name="shop_name"
                value={relocateForm.shop_name}
                onChange={handleRelocateChange}
                required
                placeholder="Enter new shop name"
              />

              <FormInput
                label="New shopkeeper name"
                type="text"
                name="shopkeeper"
                value={relocateForm.shopkeeper}
                onChange={handleRelocateChange}
                placeholder="Shopkeeper at new location"
              />

              <FormInput
                label="New cell number"
                type="tel"
                name="cell_no"
                value={relocateForm.cell_no}
                onChange={handleRelocateChange}
                placeholder="Contact at new shop"
              />

              <FormInput
                label="Landmark / marketplace"
                type="text"
                name="landmark_marketplace"
                value={relocateForm.landmark_marketplace}
                onChange={handleRelocateChange}
                placeholder="Optional landmark"
              />

              <div style={{ gridColumn: '1 / -1' }}>
                <SearchableMultiSelect
                  label="Assign collectors (new placement)"
                  apiEndpoint="/users/options?department=fund_raising"
                  onSelect={handleAssignedUsersSelect}
                  onClear={handleAssignedUsersClear}
                  value={assignedUsers}
                  displayKey="first_name"
                  valueKey="id"
                  allowResearch
                  debounceDelay={500}
                  minSearchLength={2}
                  renderOption={(user) => (
                    <div style={{ padding: '8px' }}>
                      <div style={{ fontWeight: '500', marginBottom: '4px' }}>
                        {user.first_name} {user.last_name}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666' }}>{user.email}</div>
                    </div>
                  )}
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <FormInput
                  label="Relocation note (optional)"
                  type="text"
                  name="relocation_note"
                  value={relocateForm.relocation_note}
                  onChange={handleRelocateChange}
                  placeholder="Reason or details for this move (included in audit log)"
                />
              </div>
            </div>
          </div>

          {donationBox?.require_collection_location !== false && (
          <div className="form-section">
            <h3 className="form-section-heading">New shop location on map</h3>
            <LocationMapPicker
              value={relocateLocation}
              onChange={setRelocateLocation}
              axiosInstance={axiosInstance}
              disabled={relocating}
            />
          </div>
          )}

          <div className="form-actions">
            <button type="submit" className="primary_btn" disabled={relocating}>
              {relocating ? 'Relocating...' : 'Relocate box to new shop'}
            </button>
          </div>
        </form>

        <form onSubmit={handleSaveSettings} className="form" style={{ marginTop: '32px' }}>
          <div className="form-section">
            <h3 className="form-section-heading">Box settings</h3>
            <div className="form-grid-2">
              <FormInput
                label="Key number"
                type="text"
                name="key_no"
                value={settingsForm.key_no}
                onChange={handleSettingsChange}
              />

              <FormSelect
                label="Box type"
                name="box_type"
                value={settingsForm.box_type}
                onChange={handleSettingsChange}
                options={boxTypeOptions}
                required
              />

              <FormSelect
                label="Status"
                name="status"
                value={settingsForm.status}
                onChange={handleSettingsChange}
                options={statusOptions}
                required
              />

              <FormSelect
                label="Collection frequency"
                name="collection_frequency"
                value={settingsForm.collection_frequency}
                onChange={handleSettingsChange}
                options={collectionFrequencyOptions}
                required
              />

              <FormInput
                label="Landmark / Marketplace"
                type="text"
                name="landmark_marketplace"
                value={settingsForm.landmark_marketplace}
                onChange={handleSettingsChange}
                placeholder="e.g., Millat Road, Green Town, Satyana Road"
              />

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    name="require_collection_location"
                    checked={settingsForm.require_collection_location}
                    onChange={handleSettingsChange}
                    style={{ marginTop: '3px' }}
                  />
                  <span>
                    <strong>Require on-site collection (device GPS)</strong>
                    <span style={{ display: 'block', fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                      When off, this box can be collected from anywhere with no Google Maps / GPS check.
                    </span>
                  </span>
                </label>
              </div>

              {settingsForm.require_collection_location && (
                <>
                  <FormInput
                    label="Collection margin"
                    type="number"
                    name="location_radius_value"
                    value={settingsForm.location_radius_value}
                    onChange={handleSettingsChange}
                    required
                    min={settingsForm.location_radius_unit === 'km' ? '0.01' : '10'}
                    max={settingsForm.location_radius_unit === 'km' ? '10' : '10000'}
                    step={settingsForm.location_radius_unit === 'km' ? '0.1' : '1'}
                    placeholder={settingsForm.location_radius_unit === 'km' ? 'e.g. 0.1' : 'e.g. 100'}
                  />
                  <FormSelect
                    label="Margin unit"
                    name="location_radius_unit"
                    value={settingsForm.location_radius_unit}
                    onChange={handleSettingsChange}
                    options={[
                      { value: 'm', label: 'Meters (m)' },
                      { value: 'km', label: 'Kilometers (km)' },
                    ]}
                    required
                  />
                </>
              )}
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="secondary_btn" disabled={savingSettings}>
              {savingSettings ? 'Saving...' : 'Save box settings'}
            </button>
          </div>
        </form>

        <div className="form-section" style={{ marginTop: '32px' }}>
          <h3 className="form-section-heading">Relocation & change history</h3>
          <DonationBoxAuditHistory donationBoxId={id} refreshKey={auditRefreshKey} />
        </div>
      </div>
    </>
  );
};

export default EditDonationBox;
