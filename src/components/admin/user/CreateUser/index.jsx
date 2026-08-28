import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import GeographicAssignmentPicker from '../GeographicAssignmentPicker';
import {
  EMPTY_GEOGRAPHIC_ASSIGNMENTS,
  toUserGeographicPayload,
} from '../../../../utils/geographicAssignment';
import './CreateUser.css';
import { toast } from 'react-toastify';
import { departmentRoles, defaultRoles, departments, bloodGroups, genders } from '../../../../utils/user';


const CreateUser = () => {
  const navigate = useNavigate();
  
  // State for available roles based on selected department
  const [availableRoles, setAvailableRoles] = useState(defaultRoles);
  
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    user_code: '',
    email: '',
    phone: '',
    dob: '',
    address: '',
    cnic: '',
    role: defaultRoles[0].value,
    department: departments[0].value,
    gender: genders[0].value,
    joining_date: '',
    emergency_contact: '',
    blood_group: bloodGroups[2].value,
    password: '',
    manager_ids: [],
  });

  const [managerOptions, setManagerOptions] = useState([]);

  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [userPermissions, setUserPermissions] = useState({});

  const [geographicAssignments, setGeographicAssignments] = useState(
    EMPTY_GEOGRAPHIC_ASSIGNMENTS,
  );
  const [geographicOff, setGeographicOff] = useState(false);

  const isFundRaising = form.department === 'fund_raising';

  useEffect(() => {
    const fetchManagers = async () => {
      try {
        const res = await axiosInstance.get('/users/options');
        const list = Array.isArray(res.data) ? res.data : res.data?.data || [];
        setManagerOptions(
          list.map((u) => ({
            value: String(u.id),
            label: u.full_name || u.email,
          })),
        );
      } catch (err) {
        console.error('Error fetching manager options:', err);
      }
    };
    fetchManagers();
  }, []);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  // Initialize roles based on default department on mount
  useEffect(() => {
    const initialDepartment = form.department;
    const rolesForDepartment = departmentRoles[initialDepartment] || defaultRoles;
    setAvailableRoles(rolesForDepartment);
    // Set initial role to first available role for the department
    setForm(prev => ({ ...prev, role: rolesForDepartment[0].value }));
  }, []); // Empty dependency array - run only on mount

  // Handle department change and update available roles
  const handleDepartmentChange = (e) => {
    const selectedDepartment = e.target.value;
    
    // Get department-specific roles or use default roles
    const rolesForDepartment = departmentRoles[selectedDepartment] || defaultRoles;
    setAvailableRoles(rolesForDepartment);
    
    // Update form with new department and reset role to first available
    setForm({ 
      ...form, 
      department: selectedDepartment,
      role: rolesForDepartment[0].value 
    });

    if (selectedDepartment !== 'fund_raising') {
      setGeographicAssignments(EMPTY_GEOGRAPHIC_ASSIGNMENTS);
      setGeographicOff(false);
    }
    
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

  const validateForm = () => {
    if (!form.first_name?.trim()) {
      setError('First name is required');
      return false;
    }
    if (!form.department) {
      setError('Department is required');
      return false;
    }
    if (!form.password) {
      setError('Password is required');
      return false;
    }

    const passwordErrors = validatePassword(form.password);
    if (passwordErrors.length > 0) {
      setError(`Password requirements: ${passwordErrors.join(', ')}`);
      return false;
    }

    // Optional fields — validate format only when filled
    if (form.email?.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.email.trim())) {
        setError('Please enter a valid email address');
        return false;
      }
    }
    if (form.cnic && !/^\d{13}$/.test(form.cnic)) {
      setError('CNIC must be 13 digits');
      return false;
    }
    if (form.phone && !/^\d{11}$/.test(form.phone)) {
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
      const sanitizedForm = {
        ...form,
        first_name: form.first_name.trim(),
        last_name: form.last_name?.trim() || null,
        email: form.email?.trim() ? form.email.trim().toLowerCase() : null,
        password: form.password.trim(),
        phone: form.phone?.trim() || null,
        dob: form.dob || null,
        address: form.address?.trim() || null,
        cnic: form.cnic?.trim() || null,
        gender: form.gender || null,
        joining_date: form.joining_date || null,
        emergency_contact: form.emergency_contact?.trim() || null,
        blood_group: form.blood_group || null,
        role: form.role || undefined,
      };

      // Create payload with user data and permissions
      const payload = {
        ...sanitizedForm,
        user_code: sanitizedForm.user_code?.trim() || null,
        permissions: userPermissions,
        manager_ids: Array.isArray(form.manager_ids)
          ? form.manager_ids.map(Number).filter((n) => Number.isFinite(n) && n > 0)
          : [],
      };

      // Include geographic assignments for fund_raising department
      if (form.department === 'fund_raising') {
        Object.assign(payload, toUserGeographicPayload(geographicAssignments));
        payload.geographic_off = geographicOff;
      }
      
      console.log('Submitting payload:', payload);
      console.log('User permissions:', userPermissions);
      
      await axiosInstance.post('/users', payload);
      
      setSubmitted(true);
      setError('');
      toast.success('User created successfully!');
      
      // Reset form for next user
      setForm({
        first_name: '',
        last_name: '',
        user_code: '',
        email: '',
        phone: '',
        dob: '',
        address: '',
        cnic: '',
        role: defaultRoles[0].value,
        department: departments[0].value,
        gender: genders[0].value,
        joining_date: '',
        emergency_contact: '',
        blood_group: bloodGroups[2].value,
        password: '',
        manager_ids: [],
      });
      
      // Reset permissions and geographic assignments
      setUserPermissions({});
      setGeographicAssignments(EMPTY_GEOGRAPHIC_ASSIGNMENTS);
      setGeographicOff(false);
      navigate('/admin/users');
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to submit form. Please try again.';
      setError(errorMsg);
      toast.error(errorMsg);
      console.error('Error submitting form:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="user-form-container">
        <PageHeader 
          title="Create New User"
          backPath="/admin/users"
          breadcrumbs={[
            { label: 'Admin', path: '/admin' },
            { label: 'User Management', path: '/admin/users' },
            { label: 'Create User' }
          ]}
        />
        
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
              />

              <FormInput
                name="user_code"
                label="User Code"
                value={form.user_code}
                onChange={handleChange}
                placeholder="Optional — permanent record id"
              />

              <FormInput
                name="email"
                label="Email"
                type="email"
                value={form.email}
                onChange={handleChange}
              />

              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  Password <span className="required">*</span>
                </label>
                <div className="password-input-container">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Enter password"
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
                {form.password && (
                  <div className="password-strength">
                    <small>Password must contain: 8+ characters, uppercase, lowercase, number, special character</small>
                  </div>
                )}
              </div>

              <FormInput
                name="phone"
                label="Phone Number"
                type="tel"
                value={form.phone}
                onChange={handleChange}
              />

              <FormInput
                name="dob"
                label="Date of Birth"
                type="date"
                value={form.dob}
                onChange={handleChange}
              />

              <FormSelect
                name="gender"
                label="Gender"
                value={form.gender}
                options={genders}
                onChange={handleChange}
              />

              <FormInput
                name="cnic"
                label="CNIC Number"
                value={form.cnic}
                onChange={handleChange}
                placeholder="13 digits"
              />

              <FormSelect
                name="blood_group"
                label="Blood Group"
                value={form.blood_group}
                options={bloodGroups}
                onChange={handleChange}
              />

              <FormSelect
                name="department"
                label="Department"
                value={form.department}
                options={departments}
                onChange={handleDepartmentChange}
                required
              />

              <FormSelect
                name="role"
                label="Role"
                value={form.role}
                options={availableRoles}
                onChange={handleChange}
              />

              <MultiSelect
                name="manager_ids"
                label="Reports to (Managers)"
                options={managerOptions}
                value={form.manager_ids || []}
                onChange={(next) => setForm((prev) => ({ ...prev, manager_ids: next }))}
                placeholder="Select one or more managers..."
              />

              <FormInput
                name="joining_date"
                label="Joining Date"
                type="date"
                value={form.joining_date}
                onChange={handleChange}
              />

              <FormInput
                name="emergency_contact"
                label="Emergency Contact"
                type="tel"
                value={form.emergency_contact}
                onChange={handleChange}
              />
            </div>

            <FormTextarea
              name="address"
              label="Address"
              value={form.address}
              onChange={handleChange}
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
                type="button"
                className="secondary_btn"
                onClick={() => setShowPermissionsModal(true)}
                style={{ marginTop: '10px' }}
              >
                <FiShield style={{ marginRight: '5px' }} />
                Manage Permissions
              </button>
              <button
                type="submit"
                className="primary_btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </form>

        <UserPermissions
          isOpen={showPermissionsModal}
          user={form}
          onSave={(permissions) => {
            setUserPermissions(permissions);
            setShowPermissionsModal(false);
            toast.success('Permissions data collected');
          }}
          onCancel={() => setShowPermissionsModal(false)}
        />
      </div>
    </>
  );
};

export default CreateUser; 