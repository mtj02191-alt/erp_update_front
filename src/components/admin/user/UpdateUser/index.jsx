import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiShield } from 'react-icons/fi';
import axiosInstance from '../../../../utils/axios';
import '../../../../styles/variables.css';
import '../../../../styles/components.css';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import FormInput from '../../../common/FormInput';
import FormSelect from '../../../common/FormSelect';
import FormTextarea from '../../../common/FormTextarea';
import UserPermissions from '../UserPermissions';
import GeographicAssignmentPicker from '../GeographicAssignmentPicker';
import {
  EMPTY_GEOGRAPHIC_ASSIGNMENTS,
  normalizeGeographicAssignments,
  toUserGeographicPayload,
} from '../../../../utils/geographicAssignment';
import { toast } from 'react-toastify';
import { departmentRoles, defaultRoles } from '../../../../utils/user';
import './UpdateUser.css';

const UpdateUser = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    user_code: '',
    email: '',
    phone: '',
    dob: '',
    address: '',
    cnic: '',
    role: 'user',
    department: '',
    gender: '',
    joining_date: '',
    emergency_contact: '',
    blood_group: '',
    manager_id: '',
  });

  const [managerOptions, setManagerOptions] = useState([]);

  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);

  const [geographicAssignments, setGeographicAssignments] = useState(
    EMPTY_GEOGRAPHIC_ASSIGNMENTS,
  );
  const [geographicOff, setGeographicOff] = useState(false);
  const [availableRoles, setAvailableRoles] = useState(defaultRoles);

  const departments = [
    { value: 'store', label: 'Store' },
    { value: 'procurement', label: 'Procurement' },
    { value: 'accounts_and_finance', label: 'Accounts & Finance' },
    { value: 'program', label: 'Program' },
    { value: 'it', label: 'IT' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'audio_video', label: 'Audio Video' },
    { value: 'fund_raising', label: 'Fund Raising' },
    { value: 'meal', label: 'Meal' },
    { value: 'health', label: 'Health' },
    { value: 'executive_office', label: 'Executive Office'},
    { value: 'ceo', label: 'CEO'},
    { value: 'internal_audit', label: 'Internal Audit'},
    { value: 'crd', label: 'CRD'},
    { value: 'hr', label: 'HR'},
    { value: 'aas_lab', label: 'Aas Lab'},
    { value: 'admin', label: 'Admin'},
  ];

  const bloodGroups = [
    { value: 'A+', label: 'A+' },
    { value: 'A-', label: 'A-' },
    { value: 'B+', label: 'B+' },
    { value: 'B-', label: 'B-' },
    { value: 'AB+', label: 'AB+' },
    { value: 'AB-', label: 'AB-' },
    { value: 'O+', label: 'O+' },
    { value: 'O-', label: 'O-' }
  ];

  const rolesForDepartment = (department) =>
    departmentRoles[department] || defaultRoles;

  const genders = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' }
  ];

  const isFundRaising = form.department === 'fund_raising';

  useEffect(() => {
    const fetchManagers = async () => {
      try {
        const res = await axiosInstance.get('/users/options');
        const list = Array.isArray(res.data) ? res.data : res.data?.data || [];
        setManagerOptions([
          { value: '', label: 'No manager' },
          ...list.map((u) => ({
            value: String(u.id),
            label: u.full_name || u.email,
          })),
        ]);
      } catch (err) {
        console.error('Error fetching manager options:', err);
      }
    };
    fetchManagers();
  }, []);

  useEffect(() => {
    fetchUser();
  }, [id]);

  const fetchUser = async () => {
    try {
      setLoading(true);
      console.log('Fetching user with ID:', id);
      const response = await axiosInstance.get(`/users/${id}`);
      const userData = response.data;
      console.log('Fetched user data:', userData);
      setUser(userData);
      setForm({
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
        user_code: userData.user_code || '',
        email: userData.email || '',
        phone: userData.phone || '',
        dob: userData.dob || '',
        address: userData.address || '',
        cnic: userData.cnic || '',
        role: userData.role || 'user',
        department: userData.department || '',
        gender: userData.gender || '',
        joining_date: userData.joining_date || '',
        emergency_contact: userData.emergency_contact || '',
        blood_group: userData.blood_group || '',
        manager_id: userData.manager_id ? String(userData.manager_id) : '',
      });

      setGeographicAssignments(normalizeGeographicAssignments(userData));
      setGeographicOff(userData.geographic_off === true);

      const roles = rolesForDepartment(userData.department || '');
      setAvailableRoles(roles);

      console.log('Form data set:', form);
    } catch (err) {
      console.error('Error fetching user:', err);
      if (err.response?.status === 403) {
        setError('You do not have permission to view this user.');
      } else if (err.response?.status === 404) {
        setError('User not found.');
      } else {
        setError('Failed to fetch user data. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = e => {
    const { name, value } = e.target;

    if (name === 'department') {
      const roles = rolesForDepartment(value);
      setAvailableRoles(roles);
      const roleStillValid = roles.some((r) => r.value === form.role);
      setForm({
        ...form,
        department: value,
        role: roleStillValid ? form.role : roles[0]?.value || 'user',
      });

      if (value !== 'fund_raising') {
        setGeographicAssignments(EMPTY_GEOGRAPHIC_ASSIGNMENTS);
        setGeographicOff(false);
      }
    } else {
      setForm({ ...form, [name]: value });
    }

    if (error) setError('');
  };

  const handlePasswordChange = e => {
    setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  // Password strength validation
  const validatePassword = (password) => {
    const errors = [];
    if (password.length < 8) errors.push('Minimum 8 characters');
    if (!/[A-Z]/.test(password)) errors.push('At least one uppercase letter');
    if (!/[a-z]/.test(password)) errors.push('At least one lowercase letter');
    if (!/\d/.test(password)) errors.push('At least one number');
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push('At least one special character');
    return errors;
  };

  const validatePasswordForm = () => {
    if (!passwordForm.newPassword || !passwordForm.confirmPassword) {
      setError('Please fill in all password fields');
      return false;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('New passwords do not match');
      return false;
    }

    const passwordErrors = validatePassword(passwordForm.newPassword);
    if (passwordErrors.length > 0) {
      setError(`Password requirements: ${passwordErrors.join(', ')}`);
      return false;
    }

    return true;
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!validatePasswordForm()) return;

    setIsSubmitting(true);
    try {
      // Use the admin password change endpoint since this is in the admin panel
      await axiosInstance.post(`/users/${id}/change-password`, {
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword
      });
      
      toast.success('Password changed successfully!');
      setShowPasswordChange(false);
      setPasswordForm({
        newPassword: '',
        confirmPassword: ''
      });
      setError('');
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to change password. Please try again.';
      setError(errorMsg);
      toast.error(errorMsg);
      console.error('Error changing password:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateForm = () => {
    const requiredFields = [
      'first_name',
      'last_name',
      'phone',
      'dob',
      'address',
      'cnic',
      'role',
      'department',
      'gender',
      'joining_date',
      'emergency_contact',
      'blood_group'
    ];

    for (const field of requiredFields) {
      if (!form[field]) {
        setError(`Please fill in all required fields`);
        return false;
      }
    }

    // Validate CNIC format (13 digits)
    if (!/^\d{13}$/.test(form.cnic)) {
      setError('CNIC must be 13 digits');
      return false;
    }

    // Validate phone number format
    if (!/^\d{11}$/.test(form.phone)) {
      setError('Phone number must be 11 digits');
      return false;
    }

    return true;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        ...form,
        email: form.email.trim().toLowerCase(),
        user_code: form.user_code?.trim() || null,
        manager_id: form.manager_id ? Number(form.manager_id) : null,
      };

      // Include geographic assignments for fund_raising department
      if (form.department === 'fund_raising') {
        Object.assign(payload, toUserGeographicPayload(geographicAssignments));
        payload.geographic_off = geographicOff;
      } else {
        Object.assign(payload, toUserGeographicPayload(EMPTY_GEOGRAPHIC_ASSIGNMENTS));
        payload.geographic_off = false;
      }

      console.log('Submitting form data:', payload);
      const response = await axiosInstance.patch(`/users/${id}`, payload);
      console.log('Update response:', response.data);

      setSubmitted(true);
      setError('');
    } catch (err) {
      console.error('Error updating user:', err);
      if (err.response?.status === 403) {
        setError('You do not have permission to update this user.');
      } else if (err.response?.status === 404) {
        setError('User not found.');
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Failed to update user. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="user-form-container">
          <div className="status-message">Loading user data...</div>
        </div>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Navbar />
        <div className="user-form-container">
          <div className="status-message status-message--error">User not found</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="user-form-container">
        <PageHeader 
          title="Update User"
          backPath="/admin/users"
          breadcrumbs={[
            { label: 'Admin', path: '/admin' },
            { label: 'User Management', path: '/admin/users' },
            { label: 'Update User' }
          ]}
        />

        {submitted ? (
          <div className="status-message status-message--success">
            User updated successfully!
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="user-form">
            {error && <div className="status-message status-message--error">{error}</div>}
            
            <div className="form-grid">
              <FormInput
                name="first_name"
                label="First Name"
                value={form.first_name}
                onChange={handleChange}
                required
              />

              <FormInput
                name="last_name"
                label="Last Name"
                value={form.last_name}
                onChange={handleChange}
                required
              />

              <FormInput
                name="user_code"
                label="User Code"
                value={form.user_code}
                onChange={handleChange}
                placeholder="Permanent record id (unchanged on transfer)"
              />

              <FormInput
                name="email"
                label="Email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Optional"
              />

              <FormInput
                name="phone"
                label="Phone Number"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                required
              />

              <FormInput
                name="dob"
                label="Date of Birth"
                type="date"
                value={form.dob}
                onChange={handleChange}
                required
              />

              <FormSelect
                name="gender"
                label="Gender"
                value={form.gender}
                options={genders}
                onChange={handleChange}
                required
              />

              <FormInput
                name="cnic"
                label="CNIC Number"
                value={form.cnic}
                onChange={handleChange}
                placeholder="13 digits"
                required
              />

              <FormSelect
                name="blood_group"
                label="Blood Group"
                value={form.blood_group}
                options={bloodGroups}
                onChange={handleChange}
                required
              />

              <FormSelect
                name="department"
                label="Department"
                value={form.department}
                options={departments}
                onChange={handleChange}
                required
              />

              <FormSelect
                name="role"
                label="Role"
                value={form.role}
                options={availableRoles}
                onChange={handleChange}
                required
              />

              <FormSelect
                name="manager_id"
                label="Reports to (Manager)"
                value={form.manager_id}
                options={managerOptions}
                onChange={handleChange}
              />

              <FormInput
                name="joining_date"
                label="Joining Date"
                type="date"
                value={form.joining_date}
                onChange={handleChange}
                required
              />

              <FormInput
                name="emergency_contact"
                label="Emergency Contact"
                type="tel"
                value={form.emergency_contact}
                onChange={handleChange}
                required
              />
            </div>

            <FormTextarea
              name="address"
              label="Address"
              value={form.address}
              onChange={handleChange}
              required
            />

            {/* Geographic Assignment Section - Only for Fund Raising */}
            {isFundRaising && (
              <div className="geographic-assignment-section" style={{ marginTop: '20px', padding: '16px', border: '1px solid var(--border-color, #e0e0e0)', borderRadius: '8px', background: 'var(--card-bg, #fafbfc)' }}>
                <h3 style={{ marginBottom: '12px', fontSize: '16px', fontWeight: '600' }}>Geographic Assignment</h3>
                <p style={{ marginBottom: '16px', fontSize: '13px', color: 'var(--text-secondary, #666)' }}>
                  Search and assign any country, region, district, tehsil, city, or route — no hierarchy required.
                </p>
                <GeographicAssignmentPicker
                  value={geographicAssignments}
                  onChange={setGeographicAssignments}
                  geographicOff={geographicOff}
                  onGeographicOffChange={setGeographicOff}
                />
              </div>
            )}

            <div className="form-actions">
              <button
                type="submit"
                className="primary_btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Updating...' : 'Update User'}
              </button>
              
              <button
                type="button"
                className="secondary_btn"
                onClick={() => setShowPermissionsModal(true)}
                style={{ marginLeft: '10px' }}
              >
                <FiShield style={{ marginRight: '5px' }} />
                Manage Permissions
              </button>

              <button
                type="button"
                className="secondary_btn"
                onClick={() => setShowPasswordChange(!showPasswordChange)}
                style={{ marginLeft: '10px' }}
              >
                Change Password
              </button>
            </div>
          </form>
        )}

        {/* Password Change Section */}
        {showPasswordChange && (
          <div className="password-change-section">
            <h3>Change Password</h3>
            <form onSubmit={handlePasswordSubmit} className="password-form">
              {error && <div className="status-message status-message--error">{error}</div>}

              <div className="form-group">
                <label htmlFor="newPassword" className="form-label">
                  New Password <span className="required">*</span>
                </label>
                <div className="password-input-container">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="newPassword"
                    name="newPassword"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordChange}
                    className="form-input"
                    placeholder="Enter new password"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                {passwordForm.newPassword && (
                  <div className="password-strength">
                    <small>Password must contain: 8+ characters, uppercase, lowercase, number, special character</small>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword" className="form-label">
                  Confirm New Password <span className="required">*</span>
                </label>
                <div className="password-input-container">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordChange}
                    className="form-input"
                    placeholder="Confirm new password"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  className="primary_btn"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Changing Password...' : 'Change Password'}
                </button>
                <button
                  type="button"
                  className="secondary_btn"
                  onClick={() => {
                    setShowPasswordChange(false);
                    setPasswordForm({
                      newPassword: '',
                      confirmPassword: ''
                    });
                    setError('');
                  }}
                  style={{ marginLeft: '10px' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <UserPermissions
          isOpen={showPermissionsModal}
          user={user}
          onSave={(updatedUser) => {
            setShowPermissionsModal(false);
            if (updatedUser) {
              setUser(updatedUser);
            }
            toast.success('Permissions updated successfully');
          }}
          onCancel={() => setShowPermissionsModal(false)}
        />
      </div>
    </>
  );
};

export default UpdateUser; 