import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import FormInput from '../../../common/FormInput';
import FormSelect from '../../../common/FormSelect';
import SearchableMultiSelect from '../../../common/SearchableMultiSelect';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import LocationMapPicker from '../../../common/LocationMapPicker';
import {
  DEFAULT_COLLECTION_RADIUS_METERS,
  radiusFormToMeters,
  validateCollectionRadiusMeters,
} from '../../../../utils/geolocation';

const AddDonationBox = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    // Box identification
    key_no: '',
    
    // Location information
    country: 'Pakistan', // Default to Pakistan
    region: '',
    city: '',
    city_id: '', // City ID for payload
    route_id: '', // This will be the final selected route ID
    assigned_user_ids: [], // Array of user IDs for multiple assignments
    
    // Shop details
    shop_name: '',
    shopkeeper: '',
    cell_no: '',
    landmark_marketplace: '',
    route: '',
    
    // Box configuration
    box_type: 'medium',
    active_since: new Date().toISOString().split('T')[0],
    status: 'active',
    collection_frequency: 'weekly',
    require_collection_location: true,
    location_radius_value: '100',
    location_radius_unit: 'm',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [deviceLocation, setDeviceLocation] = useState(null);
  
  // State for cascading dropdowns
  const [regions, setRegions] = useState([]);
  const [cities, setCities] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [assignedUsers, setAssignedUsers] = useState([]); // Array of user objects for display
  const [loadingRegions, setLoadingRegions] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingRoutes, setLoadingRoutes] = useState(false);

  // Load regions for Pakistan on component mount
  useEffect(() => {
    fetchRegions('Pakistan');
  }, []);

  // Fetch regions for a country
  const fetchRegions = async (country) => {
    try {
      setLoadingRegions(true);
      const response = await axiosInstance.get(`/regions?country_id=1`);
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

  // Fetch cities for a region
  const fetchCities = async (region) => {
    try {
      console.log("region", region);
      setLoadingCities(true);
      const response = await axiosInstance.get(`/cities?region_id=${region}`);
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

  // Fetch routes for a city
  const fetchRoutes = async (city) => {
    try {
      setLoadingRoutes(true);
      const response = await axiosInstance.get(`/routes?city_id=${city}`);
      console.log('Routes API response:', response.data);
      if (response.data.success) {
        const routesData = response.data.data || [];
        console.log('Routes data:', routesData);
        setRoutes(routesData);
        
        // Optional route — do not auto-select when only one exists
      }
    } catch (err) {
      console.error('Error fetching routes:', err);
      setError('Failed to load routes');
    } finally {
      setLoadingRoutes(false);
    }
  };


  // Handle multiple user selection for assigned users
  const handleAssignedUsersSelect = (selectedUsers) => {
    setAssignedUsers(selectedUsers);
    const userIds = selectedUsers.map(user => user.id);
    setForm(prev => ({ ...prev, assigned_user_ids: userIds }));
  };

  // Handle clear all assigned users
  const handleAssignedUsersClear = () => {
    setAssignedUsers([]);
    setForm(prev => ({ ...prev, assigned_user_ids: [] }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const nextValue = type === 'checkbox' ? checked : value;
    console.log(`Form field changed: ${name} = ${nextValue}`);
    setForm({ ...form, [name]: nextValue });
    
    // Handle cascading dropdowns
    if (name === 'region') {
      setForm(prev => ({ ...prev, city: '', city_id: '', route_id: '' }));
      setCities([]);
      setRoutes([]);
      if (value) {
        fetchCities(value);
      }
    } else if (name === 'city') {
      setForm(prev => ({ ...prev, city_id: value, route_id: '' }));
      setRoutes([]);
      if (value) {
        fetchRoutes(value);
      }
    } else if (name === 'route_id') {
      console.log('Route selected:', value);
    }
    
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (form.require_collection_location && !deviceLocation) {
        setError('Please select the exact box location on the map.');
        setIsSubmitting(false);
        return;
      }

      const location = deviceLocation;

      // Prepare donation box data
      const donationBoxData = {
        key_no: form.key_no || null,
        city_id: form.city_id || null,
        route_id: form.route_id ? Number(form.route_id) : null,
        assigned_user_ids: form.assigned_user_ids || [],
        shop_name: form.shop_name,
        shopkeeper: form.shopkeeper || null,
        cell_no: form.cell_no || null,
        landmark_marketplace: form.landmark_marketplace || null,
        route: form.route || null,
        box_type: form.box_type,
        active_since: form.active_since,
        status: form.status,
        collection_frequency: form.collection_frequency,
        require_collection_location: form.require_collection_location,
      };

      if (form.require_collection_location && location) {
        const locationRadiusMeters = radiusFormToMeters(
          form.location_radius_value,
          form.location_radius_unit,
        );
        const radiusError = validateCollectionRadiusMeters(locationRadiusMeters);
        if (radiusError) {
          setError(radiusError);
          setIsSubmitting(false);
          return;
        }

        donationBoxData.registration_latitude = location.latitude;
        donationBoxData.registration_longitude = location.longitude;
        donationBoxData.registration_location_name = location.location_name || null;
        donationBoxData.registration_location_details = location.location_details || null;
        donationBoxData.location_radius_meters = locationRadiusMeters;
      }

      console.log('Submitting donation box data:', donationBoxData);
      console.log('Assigned users:', assignedUsers);
      console.log('Assigned user IDs:', form.assigned_user_ids);

      await axiosInstance.post('donation-box', donationBoxData);

      // Redirect to donation boxes list after successful creation
      navigate('/dms/donation_box/list'); 
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add donation box. Please try again.');
      console.error('Error adding donation box:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate('/dms/donation_box/list');
  };

  // Country options (default to Pakistan)
  const countryOptions = [
    { value: 'Pakistan', label: 'Pakistan' }
  ];

  const boxTypeOptions = [
    { value: 'small', label: 'Small' },
    { value: 'medium', label: 'Medium' },
    { value: 'large', label: 'Large' },
    { value: 'medium_star', label: 'Medium/Star' },
    { value: 'premium', label: 'Premium' },
    { value: 'standard', label: 'Standard' }
  ];

  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'damaged', label: 'Damaged' },
    { value: 'retired', label: 'Retired' },
    { value: 'pending', label: 'Pending' }
  ];

  const collectionFrequencyOptions = [
    { value: 'weekly', label: 'Weekly' },
    { value: 'biweekly', label: 'Bi-Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'yearly', label: 'Yearly' }
  ];


  return (
    <>
      <Navbar />
      <div className="form-content">
        <PageHeader 
          title="Add Donation Box" 
          onBack={handleBack}
        />
        
        {error && (
          <div className="status-message status-message--error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="form">
          {/* Box Identification */}
          <div className="form-section">
            <h3 className="form-section-heading">Box Identification</h3>
            <div className="form-grid-2">

              <FormInput
                label="Key Number"
                type="text"
                name="key_no"
                value={form.key_no}
                onChange={handleChange}
                placeholder="e.g., 625, 71, 681"
              />
            </div>
          </div>
          {/* Box Configuration */}
          <div className="form-section">
            <div className="form-grid-2">
              <FormSelect
                label="Box Type"
                name="box_type"
                value={form.box_type}
                onChange={handleChange}
                options={boxTypeOptions}
                required
              />

              <FormSelect
                label="Collection Frequency"
                name="collection_frequency"
                value={form.collection_frequency}
                onChange={handleChange}
                options={collectionFrequencyOptions}
                required
              />
            </div>
          </div>

          {/* Location Information */}
          <div className="form-section">
            <h3 className="form-section-heading">Location Information</h3>
            <div className="form-grid-2">
              <FormSelect
                label="Country"
                name="country"
                value={form.country}
                onChange={handleChange}
                options={countryOptions}
                required
                disabled={true} // Fixed to Pakistan
              />

              <FormSelect
                label="Region"
                name="region"
                value={form.region}
                onChange={handleChange}
                options={regions.map(region => ({ value: region.id, label: region.name }))}
                required
                disabled={loadingRegions}
                placeholder={loadingRegions ? "Loading regions..." : "Select region"}
              />

              <FormSelect
                label="City"
                name="city"
                value={form.city}
                onChange={handleChange}
                options={cities.map(city => ({ value: city.id, label: city.name }))}
                required
                disabled={loadingCities || !form.region}
                placeholder={loadingCities ? "Loading cities..." : !form.region ? "Select region first" : "Select city"}
              />

              <FormSelect
                label="Route (optional)"
                name="route_id"
                value={form.route_id}
                onChange={handleChange}
                options={routes.map(route => ({ value: route.id, label: route.name }))}
                disabled={loadingRoutes || !form.city}
                showDefaultOption={true}
                defaultOptionText={loadingRoutes ? "Loading routes..." : !form.city ? "Select city first" : "No route"}
              />

              <FormInput
                label="Landmark / Marketplace"
                type="text"
                name="landmark_marketplace"
                value={form.landmark_marketplace}
                onChange={handleChange}
                placeholder="e.g., Millat Road, Green Town, Satyana Road"
              />

              <SearchableMultiSelect
                label="Assign Collectors"
                // placeholder="Search and select multiple users..."
                apiEndpoint="/users/options?department=fund_raising"
                onSelect={handleAssignedUsersSelect}
                onClear={handleAssignedUsersClear}
                value={assignedUsers}
                displayKey="first_name"
                valueKey="id"
                allowResearch={true}
                debounceDelay={500}
                minSearchLength={2}
                renderOption={(user, index) => (
                  <div style={{ padding: '8px' }}>
                    <div style={{ fontWeight: '500', marginBottom: '4px' }}>
                      {user.first_name} {user.last_name}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {user.email}
                    </div>
                    {user.department && (
                      <div style={{ fontSize: '11px', color: '#999', marginTop: '2px' }}>
                        {user.department} • {user.role || 'User'}
                      </div>
                    )}
                  </div>
                )}
              />
              
              {/* Show selected users count */}
              {assignedUsers.length > 0 && (
                <div style={{ 
                  marginTop: '8px', 
                  fontSize: '14px', 
                  color: '#28a745',
                  fontWeight: '500'
                }}>
                  ✓ {assignedUsers.length} user{assignedUsers.length !== 1 ? 's' : ''} selected
                </div>
              )}
            </div>
          </div>

          {/* Shop Details */}
          <div className="form-section">
            <h3 className="form-section-heading">Shop Details</h3>
            <div className="form-grid-2">
              <FormInput
                label="Shop Name"
                type="text"
                name="shop_name"
                value={form.shop_name}
                onChange={handleChange}
                required
                placeholder="e.g., Flexon, DAH Club & Authority"
              />

              <FormInput
                label="Shopkeeper Name"
                type="text"
                name="shopkeeper"
                value={form.shopkeeper}
                onChange={handleChange}
                placeholder="e.g., Muneeb, Muzamil"
              />

              <FormInput
                label="Cell Number"
                type="tel"
                name="cell_no"
                value={form.cell_no}
                onChange={handleChange}
                placeholder="e.g., 0317-2841827"
              />

            </div>
          </div>

          <div className="form-section">
            <h3 className="form-section-heading">Box GPS coordinates</h3>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '12px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                name="require_collection_location"
                checked={form.require_collection_location}
                onChange={(e) => {
                  handleChange(e);
                  if (!e.target.checked) {
                    setDeviceLocation(null);
                  }
                }}
                style={{ marginTop: '3px' }}
              />
              <span>
                <strong>Require on-site collection</strong>
                <span style={{ display: 'block', fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                  When enabled, save exact GPS from Google Maps. Collections must be within the margin you set below (default {DEFAULT_COLLECTION_RADIUS_METERS}m — good for shops or large offices).
                  Uncheck for boxes that can be collected from anywhere.
                </span>
              </span>
            </label>
            {form.require_collection_location && (
              <>
              <div className="form-grid-2" style={{ marginBottom: '16px' }}>
                <FormInput
                  label="Collection margin"
                  type="number"
                  name="location_radius_value"
                  value={form.location_radius_value}
                  onChange={handleChange}
                  required
                  min={form.location_radius_unit === 'km' ? '0.01' : '10'}
                  max={form.location_radius_unit === 'km' ? '10' : '10000'}
                  step={form.location_radius_unit === 'km' ? '0.1' : '1'}
                  placeholder={form.location_radius_unit === 'km' ? 'e.g. 0.1' : 'e.g. 100'}
                />
                <FormSelect
                  label="Margin unit"
                  name="location_radius_unit"
                  value={form.location_radius_unit}
                  onChange={handleChange}
                  options={[
                    { value: 'm', label: 'Meters (m)' },
                    { value: 'km', label: 'Kilometers (km)' },
                  ]}
                  required
                />
              </div>
              <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#64748b' }}>
                Example: set <strong>100 m</strong> for a large office or plaza around the registered pin.
              </p>
              <LocationMapPicker
                value={deviceLocation}
                onChange={setDeviceLocation}
                axiosInstance={axiosInstance}
                disabled={isSubmitting}
              />
              </>
            )}
          </div>

          <div className="form-actions">
            <button 
              type="submit" 
              className="primary_btn" 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Adding Donation Box...' : 'Add Donation Box'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default AddDonationBox;
