import React, { useState, useEffect, useRef } from 'react';
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
import MultiSelect from '../../../common/MultiSelect';
import UserPermissions from '../UserPermissions';
import { toast } from 'react-toastify';
import './UpdateUser.css';

const UpdateUser = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
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
  });

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

  // Geographic assignment states
  const [assignedCountries, setAssignedCountries] = useState([]);
  const [assignedRegions, setAssignedRegions] = useState([]);
  const [assignedDistricts, setAssignedDistricts] = useState([]);
  const [assignedTehsils, setAssignedTehsils] = useState([]);
  const [assignedCities, setAssignedCities] = useState([]);

  // Geographic options lists
  const [countriesList, setCountriesList] = useState([]);
  const [regionsList, setRegionsList] = useState([]);
  const [districtsList, setDistrictsList] = useState([]);
  const [tehsilsList, setTehsilsList] = useState([]);
  const [citiesList, setCitiesList] = useState([]);

  // Flag to track initial load so cascading effects don't reset saved selections
  const initialLoadDone = useRef(false);

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

  const roles = [
    { value: 'user', label: 'User' },
    { value: 'assistant_manager', label: 'Assistant Manager' },
    { value: 'manager', label: 'Manager' },
    { value: 'admin', label: 'Admin'},
    { value: 'super_admin', label: 'Super Admin' },
    { value: 'officer', label: 'Officer' },
    { value: 'coordinator', label: 'Coordinator' },
    { value: 'support', label: 'Support' },
    { value: 'analyst', label: 'Analyst' },
    { value: 'developer', label: 'Developer' },
    { value: 'team_lead', label: 'Team Lead' },
    { value: 'staff', label: 'Staff' }, 
    { value: 'field_officer', label: 'Field Officer' },
    { value: 'volunteer', label: 'Volunteer' },
    { value: 'dept_head', label: 'Dept Head' }

  ];

  const genders = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' }
  ];

  const isFundRaising = form.department === 'fund_raising';

  // Fetch countries on mount
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const res = await axiosInstance.get('/countries');
        const data = res.data?.data || res.data || [];
        setCountriesList(data.map(c => ({ value: c.id, label: c.name })));
      } catch (err) {
        console.error('Error fetching countries:', err);
      }
    };
    fetchCountries();
  }, []);

  // Fetch regions when selected countries change
  useEffect(() => {
    if (!assignedCountries.length) {
      setRegionsList([]);
      if (initialLoadDone.current) setAssignedRegions([]);
      return;
    }
    const fetchRegions = async () => {
      try {
        const promises = assignedCountries.map(cId =>
          axiosInstance.get(`/regions?country_id=${cId}`)
        );
        const responses = await Promise.all(promises);
        const allRegions = responses.flatMap(r => r.data?.data || r.data || []);
        const unique = [...new Map(allRegions.map(item => [item.id, item])).values()];
        setRegionsList(unique.map(r => ({ value: r.id, label: r.name })));
        if (initialLoadDone.current) {
          setAssignedRegions(prev => prev.filter(rId => unique.some(r => r.id === rId)));
        }
      } catch (err) {
        console.error('Error fetching regions:', err);
      }
    };
    fetchRegions();
  }, [assignedCountries]);

  // Fetch districts when selected regions change
  useEffect(() => {
    if (!assignedRegions.length) {
      setDistrictsList([]);
      if (initialLoadDone.current) setAssignedDistricts([]);
      return;
    }
    const fetchDistricts = async () => {
      try {
        const promises = assignedRegions.map(rId =>
          axiosInstance.get(`/districts?region_id=${rId}`)
        );
        const responses = await Promise.all(promises);
        const allDistricts = responses.flatMap(r => r.data?.data || r.data || []);
        const unique = [...new Map(allDistricts.map(item => [item.id, item])).values()];
        setDistrictsList(unique.map(d => ({ value: d.id, label: d.name })));
        if (initialLoadDone.current) {
          setAssignedDistricts(prev => prev.filter(dId => unique.some(d => d.id === dId)));
        }
      } catch (err) {
        console.error('Error fetching districts:', err);
      }
    };
    fetchDistricts();
  }, [assignedRegions]);

  // Fetch tehsils when selected districts change
  useEffect(() => {
    if (!assignedDistricts.length) {
      setTehsilsList([]);
      if (initialLoadDone.current) setAssignedTehsils([]);
      return;
    }
    const fetchTehsils = async () => {
      try {
        const promises = assignedDistricts.map(dId =>
          axiosInstance.get(`/tehsils?district_id=${dId}`)
        );
        const responses = await Promise.all(promises);
        const allTehsils = responses.flatMap(r => r.data?.data || r.data || []);
        const unique = [...new Map(allTehsils.map(item => [item.id, item])).values()];
        setTehsilsList(unique.map(t => ({ value: t.id, label: t.name })));
        if (initialLoadDone.current) {
          setAssignedTehsils(prev => prev.filter(tId => unique.some(t => t.id === tId)));
        }
      } catch (err) {
        console.error('Error fetching tehsils:', err);
      }
    };
    fetchTehsils();
  }, [assignedDistricts]);

  // Fetch cities when selected tehsils change
  useEffect(() => {
    if (!assignedTehsils.length) {
      setCitiesList([]);
      if (initialLoadDone.current) setAssignedCities([]);
      return;
    }
    const fetchCities = async () => {
      try {
        const promises = assignedTehsils.map(tId =>
          axiosInstance.get(`/cities?tehsil_id=${tId}`)
        );
        const responses = await Promise.all(promises);
        const allCities = responses.flatMap(r => r.data?.data || r.data || []);
        const unique = [...new Map(allCities.map(item => [item.id, item])).values()];
        setCitiesList(unique.map(c => ({ value: c.id, label: c.name })));
        if (initialLoadDone.current) {
          setAssignedCities(prev => prev.filter(cId => unique.some(c => c.id === cId)));
        }
      } catch (err) {
        console.error('Error fetching cities:', err);
      }
    };
    fetchCities();
  }, [assignedTehsils]);

  useEffect(() => {
    fetchUser();
  }, [id]);

  const fetchUser = async () => {
    try {
      setLoading(true);
      initialLoadDone.current = false;
      console.log('Fetching user with ID:', id);
      const response = await axiosInstance.get(`/users/${id}`);
      const userData = response.data;
      console.log('Fetched user data:', userData);
      setUser(userData);
      setForm({
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
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
      });

      // Load geographic assignments from saved user data
      if (userData.assigned_countries) setAssignedCountries(userData.assigned_countries);
      if (userData.assigned_regions) setAssignedRegions(userData.assigned_regions);
      if (userData.assigned_districts) setAssignedDistricts(userData.assigned_districts);
      if (userData.assigned_tehsils) setAssignedTehsils(userData.assigned_tehsils);
      if (userData.assigned_cities) setAssignedCities(userData.assigned_cities);

      // Mark initial load as done after a short delay so cascading effects stabilize
      setTimeout(() => {
        initialLoadDone.current = true;
      }, 2000);

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
    setForm({ ...form, [name]: value });
    
    // Reset geographic assignments when department changes away from fund_raising
    if (name === 'department' && value !== 'fund_raising') {
      setAssignedCountries([]);
      setAssignedRegions([]);
      setAssignedDistricts([]);
      setAssignedTehsils([]);
      setAssignedCities([]);
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
      };

      // Include geographic assignments for fund_raising department
      if (form.department === 'fund_raising') {
        payload.assigned_countries = assignedCountries.length ? assignedCountries : null;
        payload.assigned_regions = assignedRegions.length ? assignedRegions : null;
        payload.assigned_districts = assignedDistricts.length ? assignedDistricts : null;
        payload.assigned_tehsils = assignedTehsils.length ? assignedTehsils : null;
        payload.assigned_cities = assignedCities.length ? assignedCities : null;
      } else {
        // Clear geographic assignments if department is not fund_raising
        payload.assigned_countries = null;
        payload.assigned_regions = null;
        payload.assigned_districts = null;
        payload.assigned_tehsils = null;
        payload.assigned_cities = null;
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
                options={roles}
                onChange={handleChange}
                required
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
                  Assign geographic areas to this fund raising user. Selections cascade — choosing a country loads its regions, and so on.
                </p>
                <div className="form-grid">
                  <MultiSelect
                    name="assigned_countries"
                    label="Countries"
                    options={countriesList}
                    value={assignedCountries}
                    onChange={setAssignedCountries}
                    placeholder="Select countries..."
                  />
                  <MultiSelect
                    name="assigned_regions"
                    label="Regions"
                    options={regionsList}
                    value={assignedRegions}
                    onChange={setAssignedRegions}
                    placeholder={assignedCountries.length ? 'Select regions...' : 'Select a country first'}
                    disabled={!assignedCountries.length}
                  />
                  <MultiSelect
                    name="assigned_districts"
                    label="Districts"
                    options={districtsList}
                    value={assignedDistricts}
                    onChange={setAssignedDistricts}
                    placeholder={assignedRegions.length ? 'Select districts...' : 'Select a region first'}
                    disabled={!assignedRegions.length}
                  />
                  <MultiSelect
                    name="assigned_tehsils"
                    label="Tehsils"
                    options={tehsilsList}
                    value={assignedTehsils}
                    onChange={setAssignedTehsils}
                    placeholder={assignedDistricts.length ? 'Select tehsils...' : 'Select a district first'}
                    disabled={!assignedDistricts.length}
                  />
                  <MultiSelect
                    name="assigned_cities"
                    label="Cities"
                    options={citiesList}
                    value={assignedCities}
                    onChange={setAssignedCities}
                    placeholder={assignedTehsils.length ? 'Select cities...' : 'Select a tehsil first'}
                    disabled={!assignedTehsils.length}
                  />
                </div>
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