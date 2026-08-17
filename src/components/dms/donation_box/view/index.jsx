import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import { FiDollarSign } from 'react-icons/fi';
import DonationBoxAuditHistory from '../shared/DonationBoxAuditHistory';
import { formatAuditActor } from '../../../common/audit/auditHistoryLabels';
import { formatRadiusDisplay, getGoogleMapsUrl } from '../../../../utils/geolocation';
import LocationDetailsSummary from '../../../common/LocationMapPicker/LocationDetailsSummary';

const ViewDonationBox = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [donationBox, setDonationBox] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    fetchDonationBox();
  }, [id]);

  const fetchDonationBox = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/donation-box/${id}`);
      console.log("response", response);
      if (response.data.success) {
        setDonationBox(response.data.data);
        setError('');
      } else {
        setError('Failed to fetch donation box data');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch donation box data. Please try again.');
      console.error('Error fetching donation box:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'active': { class: 'status-completed', text: 'Active' },
      'inactive': { class: 'status-cancelled', text: 'Inactive' },
      'maintenance': { class: 'status-pending', text: 'Maintenance' },
      'damaged': { class: 'status-failed', text: 'Damaged' },
      'retired': { class: 'status-cancelled', text: 'Retired' },
      'pending': { class: 'status-pending', text: 'Pending' }
    };
    
    const statusInfo = statusMap[status] || { class: 'status-pending', text: status };
    return <span className={`status-badge ${statusInfo.class}`}>{statusInfo.text}</span>;
  };

  const getBoxTypeBadge = (boxType) => {
    const typeMap = {
      'small': { class: 'box-type-small', text: 'Small' },
      'medium': { class: 'box-type-medium', text: 'Medium' },
      'large': { class: 'box-type-large', text: 'Large' },
      'medium_star': { class: 'box-type-premium', text: 'Medium/Star' },
      'premium': { class: 'box-type-premium', text: 'Premium' },
      'standard': { class: 'box-type-standard', text: 'Standard' }
    };
    
    const typeInfo = typeMap[boxType] || { class: 'box-type-standard', text: boxType };
    return <span className={`box-type-badge ${typeInfo.class}`}>{typeInfo.text}</span>;
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="view-wrapper">
          <PageHeader 
            title="View Donation Box"
            showBackButton={true}
            backPath="/dms/donation_box/list"
          />
          <div className="loading">Loading...</div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className="view-wrapper">
          <PageHeader 
            title="View Donation Box"
            showBackButton={true}
            backPath="/dms/donation_box/list"
          />
          <div className="view-content">
            <div className="status-message status-message--error">{error}</div>
          </div>
        </div>
      </>
    );
  }
  
  if (!donationBox) {
    return (
      <>
        <Navbar />
        <div className="view-wrapper">
          <PageHeader 
            title="View Donation Box"
            showBackButton={true}
            backPath="/dms/donation_box/list"
          />
          <div className="view-content">
            <div className="status-message status-message--error">Donation box not found</div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="view-wrapper">
        <PageHeader 
          title="View Donation Box"
          showBackButton={true}
          backPath="/dms/donation_box/list"
        />
        <div className="view-content">
          <div className="view-section">
            <h3 className="view-section-title">Box Identification</h3>
            <div className="view-grid">
              <div className="view-item">
                <span className="view-item-label">Box ID</span>
                <span className="view-item-value">BOX-{donationBox.box_id_no}</span>
              </div>
              <div className="view-item">
                <span className="view-item-label">Key Number</span>
                <span className="view-item-value">{donationBox.key_no || '-'}</span>
              </div>
              <div className="view-item">
                <span className="view-item-label">Box Type</span>
                <span className="view-item-value">{getBoxTypeBadge(donationBox.box_type)}</span>
              </div>
              <div className="view-item">
                <span className="view-item-label">Status</span>
                <span className="view-item-value">{getStatusBadge(donationBox.status)}</span>
              </div>
              <div className="view-item">
                <span className="view-item-label">Active Since</span>
                <span className="view-item-value">{formatDate(donationBox.active_since)}</span>
              </div>
            </div>
          </div>

          <div className="view-section">
            <h3 className="view-section-title">Location Information</h3>
            <div className="view-grid">
              <div className="view-item">
                <span className="view-item-label">Region</span>
                <span className="view-item-value">
                  {donationBox?.route?.region?.name
                    || donationBox?.city?.region?.name
                    || '-'}
                </span>
              </div>
              <div className="view-item">
                <span className="view-item-label">City</span>
                <span className="view-item-value">
                  {donationBox?.city?.name
                    || donationBox?.route?.cities?.find((city) => city.id === donationBox.city_id)?.name
                    || '-'}
                </span>
              </div>
              <div className="view-item">
                <span className="view-item-label">FRD Officers</span>
                <span className="view-item-value">{donationBox.assignedUsers?.map(user => user.first_name + ' ' + user.last_name).join(', ') || '-'}</span>
              </div>
              <div className="view-item">
                <span className="view-item-label">Landmark/Marketplace</span>
                <span className="view-item-value">{donationBox.landmark_marketplace || '-'}</span>
              </div>
              <div className="view-item">
                <span className="view-item-label">Route</span>
                <span className="view-item-value">{donationBox?.route?.name || '-'}</span>
              </div>
              <div className="view-item">
                <span className="view-item-label">On-site collection (GPS)</span>
                <span className="view-item-value">
                  {donationBox.require_collection_location === false
                    ? 'No — collect from anywhere'
                    : 'Yes — device GPS required'}
                </span>
              </div>
              {donationBox.require_collection_location !== false && (
                <>
              <div className="view-item view-item--full">
                <span className="view-item-label">GPS location details</span>
                <span className="view-item-value">
                  <LocationDetailsSummary
                    details={donationBox.registration_location_details}
                    latitude={donationBox.registration_latitude}
                    longitude={donationBox.registration_longitude}
                    title="Registered coordinates"
                  />
                </span>
              </div>
              <div className="view-item">
                <span className="view-item-label">Collection margin</span>
                <span className="view-item-value">
                  {formatRadiusDisplay(donationBox.location_radius_meters || 100)}
                </span>
              </div>
              {donationBox.registration_latitude != null && donationBox.registration_longitude != null && (
              <div className="view-item">
                <span className="view-item-label">Map</span>
                <span className="view-item-value">
                  <a
                    href={getGoogleMapsUrl(
                      donationBox.registration_latitude,
                      donationBox.registration_longitude,
                    )}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open registered location in Google Maps
                  </a>
                </span>
              </div>
              )}
                </>
              )}
            </div>
          </div>

          <div className="view-section">
            <h3 className="view-section-title">Shop Details</h3>
            <div className="view-grid">
              <div className="view-item">
                <span className="view-item-label">Shop Name</span>
                <span className="view-item-value">{donationBox.shop_name || '-'}</span>
              </div>
              <div className="view-item">
                <span className="view-item-label">Shopkeeper</span>
                <span className="view-item-value">{donationBox.shopkeeper || '-'}</span>
              </div>
              <div className="view-item">
                <span className="view-item-label">Cell Number</span>
                <span className="view-item-value">{donationBox.cell_no || '-'}</span>
              </div>
            </div>
          </div>

          <div className="view-section">
            <h3 className="view-section-title">System information</h3>
            <div className="view-grid">
              <div className="view-item">
                <span className="view-item-label">Created at</span>
                <span className="view-item-value">{formatDate(donationBox.created_at)}</span>
              </div>
              <div className="view-item">
                <span className="view-item-label">Created by</span>
                <span className="view-item-value">
                  {donationBox.created_by
                    ? formatAuditActor(donationBox.created_by)
                    : '—'}
                </span>
              </div>
              <div className="view-item">
                <span className="view-item-label">Last updated at</span>
                <span className="view-item-value">{formatDate(donationBox.updated_at)}</span>
              </div>
              <div className="view-item">
                <span className="view-item-label">Last updated by</span>
                <span className="view-item-value">
                  {donationBox.updated_by
                    ? formatAuditActor(donationBox.updated_by)
                    : '—'}
                </span>
              </div>
            </div>
          </div>

          <div className="view-section">
            <h3 className="view-section-title">Change history</h3>
            <DonationBoxAuditHistory donationBoxId={id} />
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            <button
              type="button"
              onClick={() => navigate(`/dms/donation_box/edit/${id}`)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                backgroundColor: '#6366f1',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              }}
            >
              Update / Relocate
            </button>
            <button
              type="button"
              onClick={() => navigate(`/dms/donation-box-donations/add/${id}`)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              }}
            >
              Add Collection
            </button>
            <button
              type="button"
              onClick={() => navigate(`/dms/donation-box-donations/list/${id}`)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              }}
            >
              View Collections
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ViewDonationBox;
