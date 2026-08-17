import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CollectionLocationMap } from '../../../../common/LocationMapPicker';
import axiosInstance from '../../../../../utils/axios';
import FormInput from '../../../../common/FormInput';
import SearchableDropdown from '../../../../common/SearchableDropdown';
import DataImport from '../../../../common/DataImport';
import Navbar from '../../../../Navbar';
import PageHeader from '../../../../common/PageHeader';
import { useAuth } from '../../../../../context/AuthContext';
import { hasPermission } from '../../../../../utils/permissions';
import { DEFAULT_COLLECTION_RADIUS_METERS, getCurrentDeviceLocationWithName } from '../../../../../utils/geolocation';

const AddDonationBoxDonation = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    donation_box_id: '',
    donation_box: id ?? null, // Will store the selected donation box object
    collection_amount: '',
    collection_date: new Date().toISOString().split('T')[0],
    notes: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [donationBox, setDonationBox] = useState(null);
  const { permissions } = useAuth();

  const canImportCsv = useMemo(() => {
    if (!permissions) return false;
    return (
      permissions.super_admin === true ||
      hasPermission(permissions, 'fund_raising', 'donation_box_donations', 'create')
    );
  }, [permissions]);

  const canBypassLocation = useMemo(() => {
    if (!permissions) return false;
    return (
      permissions.super_admin === true ||
      hasPermission(permissions, 'fund_raising', 'donation_box_donations', 'bypass_location')
    );
  }, [permissions]);

  const activeBox = form.donation_box || donationBox;
  const boxRequiresGps = activeBox?.require_collection_location !== false;
  const needsDeviceGps = boxRequiresGps && !canBypassLocation;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  // Handle donation box selection from searchable dropdown
  const handleDonationBoxSelect = async (selectedBox) => {
    setForm({
      ...form,
      donation_box_id: selectedBox.id,
      donation_box: selectedBox,
    });
    if (error) setError('');

    try {
      const response = await axiosInstance.get(`/donation-box/${selectedBox.id}`);
      if (response.data?.success) {
        setDonationBox(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching donation box details:', err);
    }
  };

  // Clear donation box selection
  const handleClearDonationBox = () => {
    setForm({
      ...form,
      donation_box_id: '',
      donation_box: null
    });
  };

  // Custom render function for donation box options
  // Note: SearchableDropdown wraps this with key, onClick, and onMouseEnter
  const renderDonationBoxOption = (box) => (
    <>
      <div style={{ fontWeight: '600', color: '#333' }}>
        Key: {box?.key_no}
      </div>
      <div style={{ fontSize: '0.9em', color: '#666' }}>
        {box?.shop_name} - {box?.shopkeeper || 'N/A'}
      </div>
      <div style={{ fontSize: '0.85em', color: '#999' }}>
        {box?.route?.cities?.find(city => city.id === box.city_id)?.name}, {box?.route?.region?.name} • {box?.box_type}
      </div>
    </>
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Validate required fields
      if (!form.donation_box_id || !form.collection_amount || !form.collection_date) {
        setError('Please fill in all required fields');
        setIsSubmitting(false);
        return;
      }

      // Validate collection amount
      const amount = parseFloat(form.collection_amount);
      if (isNaN(amount) || amount <= 0) {
        setError('Please enter a valid collection amount');
        setIsSubmitting(false);
        return;
      }

      // Prepare donation data
      const donationData = {
        donation_box_id: form.donation_box_id,
        collection_amount: amount,
        collection_date: form.collection_date,
        notes: form.notes || undefined,
      };

      if (needsDeviceGps) {
        const location = await getCurrentDeviceLocationWithName(axiosInstance);
        donationData.collector_latitude = location.latitude;
        donationData.collector_longitude = location.longitude;
        donationData.collector_location_name = location.location_name || null;
        donationData.collector_location_details = location.location_details || null;
      }

      await axiosInstance.post('/donation-box-donation', donationData); 

      // Redirect to donations list after successful creation 
      navigate(`/dms/donation-box-donations/list/${form?.donation_box_id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add donation. Please try again.');
      console.error('Error adding donation:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate('/dms/donation-box-donations/list');
  };

  const fetchDonationBox = async (id) => {
    try {
      const response = await axiosInstance.get(`/donation-box/${id}`);
      if (response.data.success) {
        setDonationBox(response.data.data);
        setForm({...form, donation_box_id: response.data.data.id});
      }
    }
    catch (err) {
      console.error('Error fetching donation box:', err);
      setError('Failed to fetch donation box');
      setDonationBox(null);
    }
  };
  useEffect(() => {
    if (id) {
      fetchDonationBox(id);
    }
  }, [id]);

  return (
    <>
      <Navbar />
      <div className="form-content">
        <PageHeader 
          title="Add Donation Box Collection" 
          onBack={handleBack}
        />
        
        {error && (
          <div className="status-message status-message--error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="form">
          {/* Donation Box Selection */}
          {!id ?<> <div className="form-section">
            <h3 className="form-section-heading">Donation Box Information</h3>
            <div className="form-grid-2"> 
              <SearchableDropdown
                label="Search Donation Box"
                placeholder="Type Box Key Number or Shopkeeper name..."
                apiEndpoint="/donation-box"
                searchParamName="search"
                onSelect={handleDonationBoxSelect}
                onClear={handleClearDonationBox}
                renderOption={renderDonationBoxOption}
                displayKey="key_no"
                value={form.donation_box}
                name="donation_box"
                required
                minSearchLength={1}
                debounceDelay={300}
                allowResearch={true}
              />

              {/* {form.donation_box && (
                <div style={{ 
                  padding: '15px', 
                  backgroundColor: '#f0f9ff', 
                  borderRadius: '8px',
                  border: '1px solid #bae6fd'
                }}>
                  <div style={{ fontWeight: '600', color: '#0369a1', marginBottom: '8px' }}>
                    Selected Box Details
                  </div>
                  <div style={{ fontSize: '0.9em', color: '#333' }}>
                    <div><strong>Box ID:</strong> {form.donation_box.box_id_no}</div>
                    <div><strong>Shop:</strong> {form.donation_box.shop_name}</div>
                    <div><strong>Shopkeeper:</strong> {form.donation_box.shopkeeper || 'N/A'}</div>
                    <div><strong>Location:</strong> {form.donation_box.city}, {form.donation_box.region}</div>
                    <div><strong>Box Type:</strong> {form.donation_box.box_type}</div>
                  </div>
                </div>
              )} */}
            </div>
          </div>
          </> : <>
          <h3 className="form-section-heading">Add Donation for: <small style={{ color: 'var(--color-success)' }}>{donationBox?.key_no}</small></h3>
          </>
          }

          {/* Collection Details */}
          <div className="form-section">
            <h3 className="form-section-heading">Collection Details</h3>
            <div className="form-grid-2">
              <FormInput
                label="Collection Amount"
                type="number"
                name="collection_amount"
                value={form.collection_amount}
                onChange={handleChange}
                required
                placeholder="Enter amount collected"
                step="0.01"
                min="0"
              />

              <FormInput
                label="Collection Date"
                type="date"
                name="collection_date"
                value={form.collection_date}
                onChange={handleChange}
                required
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div style={{ marginTop: '8px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500, fontSize: '0.9em' }}>Notes</label>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                placeholder="Optional notes about this collection"
                rows={3}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.9em', resize: 'vertical' }}
              />
            </div>
            {needsDeviceGps && (
              <p style={{ margin: '12px 0 0', fontSize: '13px', color: '#64748b' }}>
                Your device GPS (Google Maps) will be checked against this box&apos;s registered shop location when you submit.
              </p>
            )}
            {!boxRequiresGps && (
              <p style={{ margin: '12px 0 0', fontSize: '13px', color: '#0369a1' }}>
                This box allows collection from anywhere — no device GPS check.
              </p>
            )}
            {boxRequiresGps && canBypassLocation && (
              <p style={{ margin: '12px 0 0', fontSize: '13px', color: '#0369a1' }}>
                GPS check bypass is enabled for your account.
              </p>
            )}
          </div>

          {needsDeviceGps && (
            <div className="form-section">
              <h3 className="form-section-heading">Location verification</h3>
              <CollectionLocationMap
                boxLocation={{
                  latitude: activeBox?.registration_latitude,
                  longitude: activeBox?.registration_longitude,
                  location_name: activeBox?.registration_location_name,
                  location_details: activeBox?.registration_location_details,
                }}
                radiusMeters={activeBox?.location_radius_meters || DEFAULT_COLLECTION_RADIUS_METERS}
                axiosInstance={axiosInstance}
              />
            </div>
          )}

          {canImportCsv && (
            <div
              className="form-section"
              style={{
                marginTop: '8px',
                padding: '12px 14px',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                background: '#f8fafc',
              }}
            >
              <h3 className="form-section-heading form-section-heading--compact">Bulk import collections</h3>
              <p style={{ margin: '0 0 10px', fontSize: '13px', color: '#64748b' }}>
                Upload a CSV to add many collection rows at once.
                {donationBox?.key_no
                  ? ` Use key_no "${donationBox.key_no}" in the file for this box.`
                  : ' Include donation_box_id or key_no per row.'}
              </p>
              <DataImport
                entityName="donation_box_donations"
                buttonText="Import CSV"
                disabled={isSubmitting}
                onImportComplete={() => {
                  if (form.donation_box_id) {
                    navigate(`/dms/donation-box-donations/list/${form.donation_box_id}`);
                  } else {
                    navigate('/dms/donation-box-donations/list');
                  }
                }}
              />
            </div>
          )}

          <div className="form-actions">
            <button 
              type="submit" 
              className="primary_btn" 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Adding...' : 'Add Donation'}
            </button>
            <button 
              type="button" 
              className="secondary_btn" 
              onClick={handleBack}
              disabled={isSubmitting}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default AddDonationBoxDonation;

