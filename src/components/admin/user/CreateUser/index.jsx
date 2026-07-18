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
  });

  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [userPermissions, setUserPermissions] = useState({});

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
      setAssignedRegions([]);
      return;
    }
    const fetchRegions = async () => {
      try {
        const promises = assignedCountries.map(cId =>
          axiosInstance.get(`/regions?country_id=${cId}`)
        );
        const responses = await Promise.all(promises);
        const allRegions = responses.flatMap(r => r.data?.data || r.data || []);
        // Remove duplicates by id
        const unique = [...new Map(allRegions.map(item => [item.id, item])).values()];
        setRegionsList(unique.map(r => ({ value: r.id, label: r.name })));
        // Remove previously selected regions that are no longer valid
        setAssignedRegions(prev => prev.filter(rId => unique.some(r => r.id === rId)));
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
      setAssignedDistricts([]);
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
        setAssignedDistricts(prev => prev.filter(dId => unique.some(d => d.id === dId)));
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
      setAssignedTehsils([]);
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
        setAssignedTehsils(prev => prev.filter(tId => unique.some(t => t.id === tId)));
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
      setAssignedCities([]);
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
        setAssignedCities(prev => prev.filter(cId => unique.some(c => c.id === cId)));
      } catch (err) {
        console.error('Error fetching cities:', err);
      }
    };
    fetchCities();
  }, [assignedTehsils]);

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

    // Reset geographic assignments when switching away from fund_raising
    if (selectedDepartment !== 'fund_raising') {
      setAssignedCountries([]);
      setAssignedRegions([]);
      setAssignedDistricts([]);
      setAssignedTehsils([]);
      setAssignedCities([]);
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
    const requiredFields = [
      'first_name',
      'last_name',
      'email', // Make email required
      'phone',
      'dob',
      'address',
      'cnic',
      'role',
      'department',
      'gender',
      'joining_date',
      'emergency_contact',
      'blood_group',
      'password' // Make password required
    ];

    for (const field of requiredFields) {
      if (!form[field]) {
        setError(`Please fill in all required fields`);
        return false;
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    // Validate password strength
    const passwordErrors = validatePassword(form.password);
    if (passwordErrors.length > 0) {
      setError(`Password requirements: ${passwordErrors.join(', ')}`);
      return false;
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
      const sanitizedForm = {
        ...form,
        email: form.email.trim().toLowerCase(),
        password: form.password.trim(),
      };

      // Create payload with user data and permissions
      const payload = {
        ...sanitizedForm,
        permissions: userPermissions
      };

      // Include geographic assignments for fund_raising department
      if (form.department === 'fund_raising') {
        payload.assigned_countries = assignedCountries.length ? assignedCountries : null;
        payload.assigned_regions = assignedRegions.length ? assignedRegions : null;
        payload.assigned_districts = assignedDistricts.length ? assignedDistricts : null;
        payload.assigned_tehsils = assignedTehsils.length ? assignedTehsils : null;
        payload.assigned_cities = assignedCities.length ? assignedCities : null;
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
      });
      
      // Reset permissions and geographic assignments
      setUserPermissions({});
      setAssignedCountries([]);
      setAssignedRegions([]);
      setAssignedDistricts([]);
      setAssignedTehsils([]);
      setAssignedCities([]);
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
                required
              />

              <FormInput
                name="email"
                label="Email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
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
                onChange={handleDepartmentChange}
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

              <FormInput
                name="joining_date"
                label="Joining Date"
                type="date"
                value={form.joining_date}
                onChange={handleChange}
                // required
              />

              <FormInput
                name="emergency_contact"
                label="Emergency Contact"
                type="tel"
                value={form.emergency_contact}
                onChange={handleChange}
                // required
              />
            </div>

            <FormTextarea
              name="address"
              label="Address"
              value={form.address}
              onChange={handleChange}
              // required
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