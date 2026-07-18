import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axiosInstance from '../../../../../utils/axios';
import Navbar from '../../../../Navbar';
import PageHeader from '../../../../common/PageHeader';
import { FiBox, FiMapPin, FiCalendar, FiDollarSign, FiUser } from 'react-icons/fi';

const ViewDonationBoxDonation = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [donation, setDonation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Get donation data from location state first (from list navigation)
    const donationData = location.state?.donation;
    
    if (donationData) {
      // Use data passed from list (faster, no API call)
      setDonation(donationData);
      setError('');
      setLoading(false);
    } else {
      // If no data passed, fetch from API (direct URL access)
      fetchDonation();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchDonation = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/donation-box-donation/${id}`);
      
      if (response.data.success) {
        setDonation(response.data.data);
        setError('');
      } else {
        setError('Failed to fetch collection data');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch collection data. Please try again.');
      console.error('Error fetching collection:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  const formatAmount = (amount) => {
    if (!amount && amount !== 0) return '-';
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Get back path based on whether we came from specific box or all collections
  const getBackPath = () => {
    if (donation?.donation_box_id) {
      return `/dms/donation-box-donations/list/${donation.donation_box_id}`;
    }
    return '/dms/donation-box-donations/list';
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="view-wrapper">
          <PageHeader 
            title="View Donation Box Collection"
            showBackButton={true}
            backPath={getBackPath()}
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
            title="View Donation Box Collection"
            showBackButton={true}
            backPath={getBackPath()}
          />
          <div className="view-content">
            <div className="status-message status-message--error">{error}</div>
          </div>
        </div>
      </>
    );
  }
  
  if (!donation) {
    return (
      <>
        <Navbar />
        <div className="view-wrapper">
          <PageHeader 
            title="View Donation Box Collection"
            showBackButton={true}
            backPath={getBackPath()}
          />
          <div className="view-content">
            <div className="status-message status-message--error">Collection not found</div>
          </div>
        </div>
      </>
    );
  }

  const donationBox = donation.donation_box;

  return (
    <>
      <Navbar />
      <div className="view-wrapper">
        <PageHeader 
          title="View Donation Box Collection"
          showBackButton={true}
          backPath={getBackPath()}
        />
        <div className="view-content">
          {/* Collection Information Section */}
          <div className="view-section">
            <h3 className="view-section-title">
              Collection Information
            </h3>
            <div className="view-grid">
              <div className="view-item">
                <span className="view-item-label">Collection ID</span>
                <span className="view-item-value" style={{ fontWeight: '600', color: '#0369a1' }}>
                  COL-{donation.id}
                </span>
              </div>
              <div className="view-item">
                <span className="view-item-label">Collection Amount</span>
                <span className="view-item-value" style={{ 
                  fontWeight: '700', 
                  color: '#15803d',
                  fontSize: '1.2em'
                }}>
                  {formatAmount(donation.collection_amount)}
                </span>
              </div>
              <div className="view-item">
                <span className="view-item-label">Collection Date</span>
                <span className="view-item-value" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FiCalendar style={{ color: '#6b7280' }} />
                  {formatDate(donation.collection_date)}
                </span>
              </div>
              <div className="view-item">
                <span className="view-item-label">Collected By</span>
                <span className="view-item-value" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FiUser style={{ color: '#6b7280' }} />
                  {donation.collected_by?.first_name} {donation.collected_by?.last_name || 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Donation Box Information Section */}
          {donationBox && (
            <div className="view-section">
              <h3 className="view-section-title">
                <FiBox style={{ display: 'inline', marginRight: '8px' }} />
                Donation Box Information
              </h3>
              <div className="view-grid">
                <div className="view-item">
                  <span className="view-item-label">Box ID</span>
                  <span className="view-item-value">BOX-{donationBox.box_id_no || 'N/A'}</span>
                </div>
                <div className="view-item">
                  <span className="view-item-label">Key Number</span>
                  <span className="view-item-value">{donationBox.key_no || '-'}</span>
                </div>
                <div className="view-item">
                  <span className="view-item-label">Box Type</span>
                  <span className="view-item-value" style={{ textTransform: 'capitalize' }}>
                    {donationBox.box_type || '-'}
                  </span>
                </div>
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
                {donationBox.route && (
                  <>
                    <div className="view-item">
                      <span className="view-item-label">Region</span>
                      <span className="view-item-value">{donationBox.route.region?.name || '-'}</span>
                    </div>
                    <div className="view-item">
                      <span className="view-item-label">City</span>
                      <span className="view-item-value">
                        {donationBox.route.cities?.find(city => city.id === donationBox.city_id)?.name || '-'}
                      </span>
                    </div>
                    <div className="view-item">
                      <span className="view-item-label">Route</span>
                      <span className="view-item-value">{donationBox.route.name || '-'}</span>
                    </div>
                  </>
                )}
                <div className="view-item">
                  <span className="view-item-label">Landmark/Marketplace</span>
                  <span className="view-item-value">{donationBox.landmark_marketplace || '-'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Collector Information Section */}
          {donation.collected_by && (
            <div className="view-section">
              <h3 className="view-section-title">
                <FiUser style={{ display: 'inline', marginRight: '8px' }} />
                Collector Information
              </h3>
              <div className="view-grid">
                <div className="view-item">
                  <span className="view-item-label">Name</span>
                  <span className="view-item-value">
                    {donation.collected_by.first_name} {donation.collected_by.last_name}
                  </span>
                </div>
                {donation.collected_by.email && (
                  <div className="view-item">
                    <span className="view-item-label">Email</span>
                    <span className="view-item-value">{donation.collected_by.email}</span>
                  </div>
                )}
                {donation.collected_by.department && (
                  <div className="view-item">
                    <span className="view-item-label">Department</span>
                    <span className="view-item-value">{donation.collected_by.department}</span>
                  </div>
                )}
                {donation.collected_by.role && (
                  <div className="view-item">
                    <span className="view-item-label">Role</span>
                    <span className="view-item-value">{donation.collected_by.role}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* System Information Section */}
          {/* <div className="view-section">
            <h3 className="view-section-title">System Information</h3>
            <div className="view-grid">
              <div className="view-item">
                <span className="view-item-label">Created At</span>
                <span className="view-item-value">{formatDate(donation.created_at)}</span>
              </div>
              <div className="view-item">
                <span className="view-item-label">Updated At</span>
                <span className="view-item-value">{formatDate(donation.updated_at)}</span>
              </div>
              <div className="view-item">
                <span className="view-item-label">Record ID</span>
                <span className="view-item-value">{donation.id}</span>
              </div>
            </div>
          </div> */}

          {/* Action Buttons */}
          <div style={{ 
            marginTop: '30px', 
            display: 'flex', 
            gap: '15px',
            flexWrap: 'wrap'
          }}>
            {donationBox && (
              <button
                onClick={() => navigate(`/dms/donation_box/view/${donationBox.id}`)}
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
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#4f46e5';
                  e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#6366f1';
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
                }}
              >
                <FiBox style={{ fontSize: '18px' }} />
                View Donation Box
              </button>
            )}
            
            <button
              onClick={() => {
                const listPath = donationBox?.id 
                  ? `/dms/donation-box-donations/list/${donationBox.id}` 
                  : '/dms/donation-box-donations/list';
                navigate(listPath);
              }}
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
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#059669';
                e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#10b981';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
              }}
            >
              <FiDollarSign style={{ fontSize: '18px' }} />
              View All Collections
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ViewDonationBoxDonation;
