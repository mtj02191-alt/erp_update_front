import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import '../../../../styles/variables.css';
import '../../../../styles/components.css';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import './UserView.css';

const UserView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUser();
  }, [id]);

  const fetchUser = async () => {
    try {
      setLoading(true);
      // const response = await axiosInstance.get(`/users/${id}`);
      const response = {
        data: {
            id: 1,
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            phoneNumber: '1234567890',    
            dob: '1990-01-01',
            gender: 'male',
            bloodGroup: 'A+',
            department: 'program',
            role: 'admin',
            joiningDate: '2020-01-01',
            cnicNumber: '1234567890123',
            emergencyContact: '9876543210',
            address: '123 Main St, Anytown, USA'
        }
    }; 
      setUser(response.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch user data. Please try again.');
      console.error('Error fetching user:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const formatDepartment = (department) => {
    if (!department) return 'N/A';
    return department.split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatRole = (role) => {
    if (!role) return 'N/A';
    return role.split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="user-view-container">
          <div className="status-message">Loading user data...</div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className="user-view-container">
          <div className="status-message status-message--error">{error}</div>
        </div>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Navbar />
        <div className="user-view-container">
          <div className="status-message status-message--error">User not found</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="user-view-container">
        <PageHeader 
          title="User Details"
          backPath="/admin/users"
          showEdit={true}
          editPath={`/admin/users/edit/${user.id}`}
          breadcrumbs={[
            { label: 'Admin', path: '/admin' },
            { label: 'User Management', path: '/admin/users' },
            { label: 'User Details' }
          ]}
        />

        <div className="user-view-content">
          <div className="user-info-grid">
            <div className="user-info-section">
              <div className="info-row">
                <span className="info-label">Full Name:</span>
                <span className="info-value">{user.firstName} {user.lastName}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Email:</span>
                <span className="info-value">{user.email || 'N/A'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Phone Number:</span>
                <span className="info-value">{user.phoneNumber}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Date of Birth:</span>
                <span className="info-value">{formatDate(user.dob)}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Gender:</span>
                <span className="info-value">{user.gender ? user.gender.charAt(0).toUpperCase() + user.gender.slice(1) : 'N/A'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Blood Group:</span>
                <span className="info-value">{user.bloodGroup || 'N/A'}</span>
              </div>
            </div>

            <div className="user-info-section">
              <div className="info-row">
                <span className="info-label">Department:</span>
                <span className="info-value">{formatDepartment(user.department)}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Role:</span>
                <span className="info-value">{formatRole(user.role)}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Joining Date:</span>
                <span className="info-value">{formatDate(user.joiningDate)}</span>
              </div>
            </div>

            <div className="user-info-section">
              <div className="info-row">
                <span className="info-label">CNIC Number:</span>
                <span className="info-value">{user.cnicNumber || 'N/A'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Emergency Contact:</span>
                <span className="info-value">{user.emergencyContact || 'N/A'}</span>
              </div>
            </div>

            <div className="user-info-section full-width">
              <h3 className="section-heading">Address</h3>
              <div className="info-row">
                <span className="info-label">Address:</span>
                <span className="info-value">{user.address || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default UserView; 