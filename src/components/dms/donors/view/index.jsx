import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import { useAuth } from '../../../../context/AuthContext';
import { fundRaisingDonorsHas } from '../../../../utils/permissions';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import Card from '../../../common/Card';
import Modal from '../../../common/Modal';
import { FiUser, FiMail, FiPhone, FiMapPin, FiCalendar, FiEdit, FiTrash2, FiKey } from 'react-icons/fi';
import { BsFillBuildingsFill } from "react-icons/bs";

const ViewDonor = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { permissions } = useAuth();
  const [donor, setDonor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revealModalOpen, setRevealModalOpen] = useState(false);
  const [revealedPassword, setRevealedPassword] = useState('');
  const [revealError, setRevealError] = useState('');
  const [revealLoading, setRevealLoading] = useState(false);

  useEffect(() => {
    fetchDonor();
  }, [id]);

  const fetchDonor = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/donors/${id}`);
      if (response.data.success) {
        setDonor(response.data.data);
      } else {
        setError('Failed to fetch donor details');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch donor details');
      console.error('Error fetching donor:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/dms/donors/list');
  };

  const handleEdit = () => {
    navigate(`/dms/donors/edit/${id}`);
  };

  const handleViewDonations = () => {
    navigate(`/donations/online_donations/list?donor_id=${id}`);
  };

  const handleAddDonation = () => {
    navigate(`/donations/online_donations/add?donor_id=${id}`);
  };

  const canRevealPassword = (() => {
    if (!permissions) return false;
    return permissions.super_admin === true || fundRaisingDonorsHas(permissions, 'update');
  })();

  const closeRevealModal = () => {
    setRevealModalOpen(false);
    setRevealedPassword('');
    setRevealError('');
    setRevealLoading(false);
  };

  const handleRevealPassword = async () => {
    try {
      setRevealError('');
      setRevealLoading(true);
      setRevealModalOpen(true);
      const res = await axiosInstance.get(`/donors/${id}/reveal-password`);
      const password = res?.data?.data?.password || '';
      setRevealedPassword(password);
      if (!password) setRevealError('No password returned.');
    } catch (err) {
      setRevealError(err.response?.data?.message || 'Failed to reveal password');
    } finally {
      setRevealLoading(false);
    }
  };

  const getDonorTypeIcon = (type) => {
    return type === 'csr' ? <BsFillBuildingsFill /> : <FiUser />;
  };

  const getDonorTypeLabel = (type) => {
    return type === 'csr' ? 'CSR Donor (Corporate)' : 'Individual Donor';
  };

  const getDonorTypeClass = (type) => {
    return type === 'csr' ? 'donor-type--csr' : 'donor-type--individual';
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="list-wrapper">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading donor details...</p>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className="list-wrapper">
          <div className="error-container">
            <div className="status-message status-message--error">
              {error}
            </div>
            <button className="primary_btn" onClick={handleBack}>
              Back to Donors List
            </button>
          </div>
        </div>
      </>
    );
  }

  if (!donor) {
    return (
      <>
        <Navbar />
        <div className="list-wrapper">
          <div className="error-container">
            <div className="status-message status-message--error">
              Donor not found
            </div>
            <button className="primary_btn" onClick={handleBack}>
              Back to Donors List
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="list-wrapper">
        <PageHeader 
          title="Donor Details" 
          onBack={handleBack}
          showAdd={true}
          onAddClick={handleEdit}
          addButtonText="Edit Donor"
        />
        
        <div className="list-content">
          {/* Donor Type and Basic Info */}
          <div className="card-grid">
            <Card
              title="Registration Date"
              data={{
                type: (
                  <div className={`donor-type ${getDonorTypeClass(donor.donor_type)}`}>
                    {getDonorTypeIcon(donor.donor_type)}
                    <span>{getDonorTypeLabel(donor.donor_type)}</span>
                  </div>
                ),
                date: new Date(donor.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }),
                name: donor.name,
                ...(donor.donor_type === 'csr' && donor.company_name && {
                  'Company Name': donor.company_name
                }),
                ...(donor.donor_type === 'csr' && donor.company_registration && {
                  'Registration Number': donor.company_registration
                }),
                ...(donor.donor_type === 'csr' && donor.contact_person && {
                  'Contact Person': donor.contact_person
                }),
                ...(donor.donor_type === 'csr' && donor.designation && {
                  'Designation': donor.designation
                }),
                ...(donor.donor_type === 'individual' && donor.first_name && {
                  'First Name': donor.first_name
                }),
                ...(donor.donor_type === 'individual' && donor.last_name && {
                  'Last Name': donor.last_name
                }),
                email: donor.email,
                phone: donor.phone,
                ...(donor.donor_type === 'csr' && donor.company_email && {
                  'Company Email': donor.company_email
                }),
                ...(donor.donor_type === 'csr' && donor.company_phone && {
                  'Company Phone': donor.company_phone
                })
              }}
            />
          </div>

          {/* Address Information */}
          <div className="card-grid">
            <Card
              title="Address Information"
              data={{
                address: donor.address || 'Not provided',
                city: donor.city || 'Not provided',
                country: donor.country || 'Not provided',
                'Postal Code': donor.postal_code || 'Not provided',
                ...(donor.donor_type === 'csr' && donor.company_address && {
                  'Company Address': donor.company_address
                })
              }}
            />
          </div>

          {/* Additional Information */}
          {donor.notes && (
            <div className="card-grid">
              <Card
                title="Additional Information"
                data={{
                  notes: donor.notes
                }}
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="form-actions" style={{ marginTop: '30px' }}>
            <button 
              className="primary_btn" 
              onClick={handleEdit}
            >
              <FiEdit style={{ marginRight: '8px' }} />
              Edit Donor
            </button>

            {canRevealPassword && (
              <button
                className="primary_btn"
                onClick={handleRevealPassword}
                style={{
                  backgroundColor: '#111827',
                  marginLeft: '10px'
                }}
                title="Reveal donor password (admin only)"
              >
                <FiKey style={{ marginRight: '8px' }} />
                Reveal Password
              </button>
            )}
            
            <button 
              className="primary_btn" 
              onClick={handleViewDonations}
              style={{ 
                backgroundColor: '#10b981',
                marginLeft: '10px'
              }}
            >
              View Donations
            </button>

            <button 
              className="primary_btn" 
              onClick={handleAddDonation}
              style={{ 
                backgroundColor: '#10b981',
                marginLeft: '10px'
              }}
            >
              Add Donation
            </button>
          </div>
        </div>
      </div>

      <Modal
        open={revealModalOpen}
        onClose={closeRevealModal}
        title={`Donor Password — ${donor?.name || donor?.email || 'Donor'}`}
        details={{
          Status: revealLoading ? 'Loading...' : revealError ? 'Error' : 'Success',
          ...(revealError ? { Message: revealError } : {}),
          ...(revealedPassword ? { Password: revealedPassword } : {}),
          Note: 'Password is shown for operational use only. Close this dialog when done.',
        }}
      />
    </>
  );
};

export default ViewDonor;
