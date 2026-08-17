import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import { useAuth } from '../../../../context/AuthContext';
import { hasPermission } from '../../../../utils/permissions';
import Modal from '../../../common/Modal';
import { FiKey, FiBarChart2 } from 'react-icons/fi';
import '../../../../styles/variables.css';
import '../../../../styles/components.css';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import { GEO_TYPE_LABELS } from '../../../../utils/geographicAssignment';
import '../GeographicAssignmentPicker/GeographicAssignmentPicker.css';
import './UserView.css';

const formatLabel = (value) => {
  if (!value) return '—';
  return String(value)
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const formatDate = (dateString) => {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString();
};

const formatManager = (manager) => {
  if (!manager) return '—';
  const name = [manager.first_name, manager.last_name].filter(Boolean).join(' ');
  return name || manager.email || `User #${manager.id}`;
};

const InfoItem = ({ label, value }) => (
  <div className="view-item">
    <span className="view-item-label">{label}</span>
    <span className="view-item-value">{value || '—'}</span>
  </div>
);

const UserView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: authUser, permissions } = useAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revealModalOpen, setRevealModalOpen] = useState(false);
  const [revealedPassword, setRevealedPassword] = useState('');
  const [revealError, setRevealError] = useState('');
  const [revealLoading, setRevealLoading] = useState(false);

  const isOwnProfile = authUser?.id && Number(authUser.id) === Number(id);
  const backPath = isOwnProfile ? '/welcome' : '/admin/users';

  const canRevealPassword =
    permissions?.super_admin === true ||
    permissions?.read_only_super_admin === true ||
    hasPermission(permissions, 'admin', 'users', 'update');

  const canEdit =
    !isOwnProfile &&
    (permissions?.super_admin === true ||
      hasPermission(permissions, 'admin', 'users', 'update'));

  useEffect(() => {
    fetchUser();
  }, [id]);

  const fetchUser = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/users/${id}`);
      setUser(response.data?.data || response.data || null);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load user details.');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRevealPassword = async () => {
    try {
      setRevealError('');
      setRevealLoading(true);
      setRevealModalOpen(true);
      const res = await axiosInstance.get(`/users/${id}/reveal-password`);
      const password = res?.data?.data?.password || '';
      setRevealedPassword(password);
      if (!password) setRevealError(res?.data?.message || 'No password returned.');
    } catch (err) {
      setRevealError(err.response?.data?.message || 'Failed to reveal password');
    } finally {
      setRevealLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="view-wrapper">
          <PageHeader title="User Details" backPath={backPath} />
          <div className="view-content">
            <div className="status-message">Loading user…</div>
          </div>
        </div>
      </>
    );
  }

  if (error || !user) {
    return (
      <>
        <Navbar />
        <div className="view-wrapper">
          <PageHeader title="User Details" backPath={backPath} />
          <div className="view-content">
            <div className="status-message status-message--error">
              {error || 'User not found'}
            </div>
          </div>
        </div>
      </>
    );
  }

  const fullName =
    [user.first_name, user.last_name].filter(Boolean).join(' ').trim() ||
    user.email ||
    `User #${user.id}`;

  return (
    <>
      <Navbar />
      <div className="view-wrapper">
        <PageHeader
          title={isOwnProfile ? 'My Profile' : 'User Details'}
          backPath={backPath}
          showEdit={canEdit}
          editPath={`/admin/users/edit/${user.id}`}
        />

        <div className="view-content">
          <section className="user-view-summary">
            <div className="user-view-summary-main">
              <h2 className="user-view-name">{fullName}</h2>
              <p className="user-view-email">{user.email || '—'}</p>
            </div>
            <div className="user-view-summary-badges">
              {user.user_code && (
                <span className="user-view-badge user-view-badge--code">{user.user_code}</span>
              )}
              <span className="user-view-badge user-view-badge--department">
                {formatLabel(user.department)}
              </span>
              <span className="user-view-badge user-view-badge--role">
                {formatLabel(user.role)}
              </span>
              <span
                className={`user-view-badge ${
                  user.isActive ? 'user-view-badge--active' : 'user-view-badge--inactive'
                }`}
              >
                {user.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </section>

          <section className="view-section">
            <h3 className="view-section-title">Basic Information</h3>
            <div className="view-grid">
              <InfoItem label="First Name" value={user.first_name} />
              <InfoItem label="Last Name" value={user.last_name} />
              <InfoItem label="User Code" value={user.user_code} />
              <InfoItem label="Email" value={user.email} />
              <InfoItem label="Phone" value={user.phone} />
              <InfoItem label="Date of Birth" value={formatDate(user.dob)} />
              <InfoItem label="Gender" value={formatLabel(user.gender)} />
              <InfoItem label="CNIC" value={user.cnic} />
              <InfoItem label="Blood Group" value={user.blood_group} />
              <InfoItem label="Emergency Contact" value={user.emergency_contact} />
              <InfoItem label="Address" value={user.address} />
            </div>
          </section>

          <section className="view-section">
            <h3 className="view-section-title">Work Details</h3>
            <div className="view-grid">
              <InfoItem label="Department" value={formatLabel(user.department)} />
              <InfoItem label="Role" value={formatLabel(user.role)} />
              <InfoItem label="Joining Date" value={formatDate(user.joining_date)} />
              <InfoItem label="Reporting Manager" value={formatManager(user.manager)} />
              <InfoItem label="Status" value={user.isActive ? 'Active' : 'Inactive'} />
            </div>
          </section>

          {Array.isArray(user.geographic_assignments) &&
            user.geographic_assignments.length > 0 && (
              <section className="view-section">
                <h3 className="view-section-title">Geographic Assignment</h3>
                <div className="user-view-geo-panel">
                  <div className="geo-assignment-chips user-view-geo-chips">
                    {user.geographic_assignments.map((item) => (
                      <span
                        key={`${item.type}:${item.id}`}
                        className="geo-assignment-chip user-view-geo-chip"
                      >
                        <span className="geo-assignment-chip-type">
                          {GEO_TYPE_LABELS[item.type] || item.type}
                        </span>
                        <span>{item.name}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </section>
            )}

          <div className="form-actions" style={{ marginTop: 24 }}>
            <button
              type="button"
              className="primary_btn"
              onClick={() => navigate(`/users/${user.id}/performance`)}
            >
              <FiBarChart2 style={{ marginRight: 8 }} />
              View Performance
            </button>
            {canRevealPassword && !isOwnProfile && (
              <button
                type="button"
                className="secondary_btn"
                onClick={handleRevealPassword}
                style={{ marginLeft: 12 }}
              >
                <FiKey style={{ marginRight: 8 }} />
                Reveal Password
              </button>
            )}
          </div>
        </div>
      </div>

      <Modal
        open={revealModalOpen}
        onClose={() => setRevealModalOpen(false)}
        title={`User Password — ${fullName}`}
        details={{
          Status: revealLoading ? 'Loading...' : revealError ? 'Error' : 'Success',
          ...(revealError ? { Message: revealError } : {}),
          ...(revealedPassword ? { Password: revealedPassword } : {}),
        }}
      />
    </>
  );
};

export default UserView;
