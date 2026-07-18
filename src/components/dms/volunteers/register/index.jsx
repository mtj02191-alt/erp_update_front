import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import FormInput from '../../../common/FormInput';
import FormSelect from '../../../common/FormSelect';
import FormTextarea from '../../../common/FormTextarea';

const STEPS = [
  { label: 'Personal Information', icon: '1' },
  { label: 'Availability & Commitment', icon: '2' },
  { label: 'Skills & Interest', icon: '3' },
  { label: 'Additional Info', icon: '4' },
];

const SKILL_OPTIONS = [
  { value: 'teaching', label: 'Teaching' },
  { value: 'medical_assistance', label: 'Medical Assistance' },
  { value: 'it_technical', label: 'IT / Technical Support' },
  { value: 'social_media_marketing', label: 'Social Media / Marketing' },
  { value: 'fundraising', label: 'Fundraising' },
  { value: 'field_work', label: 'Field Work' },
  { value: 'event_management', label: 'Event Management' },
  { value: 'data_entry', label: 'Data Entry' },
  { value: 'photography_videography', label: 'Photography / Videography' },
  { value: 'counseling', label: 'Counseling' },
  { value: 'driving', label: 'Driving' },
  { value: 'cooking', label: 'Cooking' },
  { value: 'translation', label: 'Translation' },
  { value: 'other', label: 'Other' },
];

const INTEREST_OPTIONS = [
  { value: 'health', label: 'Health' },
  { value: 'education', label: 'Education' },
  { value: 'food_distribution', label: 'Food Distribution' },
  { value: 'women_empowerment', label: 'Women Empowerment' },
  { value: 'disaster_relief', label: 'Disaster Relief' },
  { value: 'housing', label: 'Housing' },
  { value: 'clean_water', label: 'Clean Water' },
  { value: 'orphan_care', label: 'Orphan Care' },
  { value: 'community_development', label: 'Community Development' },
];

const AVAILABILITY_OPTIONS = [
  { value: 'weekdays', label: 'Weekdays' },
  { value: 'weekends', label: 'Weekends' },
  { value: 'emergency_only', label: 'Emergency Only' },
  { value: 'remote', label: 'Remote Volunteering' },
];

// ─── Checkbox Group ─────────────────────────────────────────────
const CheckboxGroup = ({ label, options, value, onChange }) => (
  <div className="form-section">
    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '14px', color: '#374151' }}>{label}</label>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
      {options.map(opt => {
        const checked = value.includes(opt.value);
        return (
          <label key={opt.value} style={{
            display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer',
            border: checked ? '2px solid #2196f3' : '2px solid #e5e7eb',
            backgroundColor: checked ? '#eff6ff' : '#fff',
            transition: 'all 0.2s ease', fontSize: '13px', color: '#374151',
          }}>
            <input type="checkbox" checked={checked} onChange={() => {
              const newVal = checked ? value.filter(v => v !== opt.value) : [...value, opt.value];
              onChange(newVal);
            }} style={{ accentColor: '#2196f3' }} />
            {opt.label}
          </label>
        );
      })}
    </div>
  </div>
);

const RegisterVolunteer = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '', cnic: '', date_of_birth: '', gender: '', phone: '', email: '', city: '', area: '',
    availability_days: [], hours_per_week: '', willing_to_travel: false, schedule: '',
    skills: [], interest_areas: [], motivation: '', cv_url: '',
    emergency_contact_name: '', emergency_contact_phone: '', emergency_contact_relation: '',
    source: 'walk_in', comments: '', agreed_to_policy: false, declaration_accurate: false,
  });

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  const validateStep = (step) => {
    switch (step) {
      case 0:
        if (!form.name) return 'Full name is required.';
        if (!form.cnic) return 'CNIC / ID Number is required.';
        if (!form.date_of_birth) return 'Date of birth is required.';
        if (!form.gender) return 'Gender is required.';
        if (!form.phone) return 'Phone number is required.';
        if (!form.email) return 'Email is required.';
        if (!form.city) return 'City is required.';
        if (!form.area) return 'Area is required.';
        return null;
      case 1:
        if (form.availability_days.length === 0) return 'Please select at least one availability option.';
        return null;
      case 2:
        if (form.skills.length === 0) return 'Please select at least one skill.';
        if (form.interest_areas.length === 0) return 'Please select at least one interest area.';
        return null;
      case 3:
        if (!form.agreed_to_policy) return 'You must agree to the volunteer policy.';
        if (!form.declaration_accurate) return 'You must confirm the accuracy of your information.';
        return null;
      default:
        return null;
    }
  };

  const handleNext = () => {
    const err = validateStep(currentStep);
    if (err) { setError(err); return; }
    setError('');
    setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
  };

  const handleBack = () => {
    setError('');
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    const err = validateStep(currentStep);
    if (err) { setError(err); return; }
    setError('');
    try {
      setIsSubmitting(true);
      const payload = { ...form };
      if (payload.availability_days.length > 0) {
        payload.availability = payload.availability_days.join(', ');
      }
      const response = await axiosInstance.post('/volunteers/register', payload);
      if (response.data.success) {
        navigate('/dms/volunteers/list');
      } else {
        setError(response.data.message || 'Failed to register volunteer');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register volunteer');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Progress Bar ─────────────────────────────────────────────
  const ProgressBar = () => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', gap: '0' }}>
      {STEPS.map((step, idx) => (
        <React.Fragment key={idx}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '120px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 600,
              backgroundColor: idx <= currentStep ? '#2196f3' : '#e5e7eb',
              color: idx <= currentStep ? '#fff' : '#9ca3af',
              transition: 'all 0.3s ease',
            }}>
              {idx < currentStep ? '✓' : step.icon}
            </div>
            <span style={{ fontSize: '11px', marginTop: '6px', color: idx <= currentStep ? '#2196f3' : '#9ca3af', fontWeight: idx === currentStep ? 600 : 400, textAlign: 'center' }}>
              {step.label}
            </span>
          </div>
          {idx < STEPS.length - 1 && (
            <div style={{ flex: 1, height: '2px', backgroundColor: idx < currentStep ? '#2196f3' : '#e5e7eb', marginBottom: '20px', minWidth: '40px', transition: 'all 0.3s ease' }} />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  // ─── Step Content ─────────────────────────────────────────────
  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <>
            <h3 className="form-section-heading">Personal Information</h3>
            <div className="form-section">
              <div className="form-grid-2">
                <FormInput label="Full Name" type="text" name="name" value={form.name} onChange={(e) => handleChange('name', e.target.value)} placeholder="Enter full name" required />
                <FormInput label="CNIC / ID Number" type="text" name="cnic" value={form.cnic} onChange={(e) => handleChange('cnic', e.target.value)} placeholder="e.g. 42101-1234567-1" required />
                <FormInput label="Date of Birth" type="date" name="date_of_birth" value={form.date_of_birth} onChange={(e) => handleChange('date_of_birth', e.target.value)} required />
                <FormSelect label="Gender" name="gender" value={form.gender} onChange={(e) => handleChange('gender', e.target.value)} required options={[
                  { value: '', label: 'Select Gender' },
                  { value: 'male', label: 'Male' },
                  { value: 'female', label: 'Female' },
                  { value: 'other', label: 'Other' },
                ]} />
                <FormInput label="Phone (WhatsApp preferred)" type="tel" name="phone" value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} placeholder="e.g. +92 300 1234567" required />
                <FormInput label="Email" type="email" name="email" value={form.email} onChange={(e) => handleChange('email', e.target.value)} placeholder="you@example.com" required />
                <FormInput label="City" type="text" name="city" value={form.city} onChange={(e) => handleChange('city', e.target.value)} placeholder="e.g. Karachi" required />
                <FormInput label="Area" type="text" name="area" value={form.area} onChange={(e) => handleChange('area', e.target.value)} placeholder="e.g. Gulshan-e-Iqbal" required />
              </div>
            </div>
          </>
        );

      case 1:
        return (
          <>
            <h3 className="form-section-heading">Availability & Commitment</h3>
            <CheckboxGroup
              label="When are you available? *"
              options={AVAILABILITY_OPTIONS}
              value={form.availability_days}
              onChange={(val) => handleChange('availability_days', val)}
            />
            <div className="form-section">
              <div className="form-grid-2">
                <FormSelect label="Hours per week" name="hours_per_week" value={form.hours_per_week} onChange={(e) => handleChange('hours_per_week', e.target.value)} options={[
                  { value: '', label: 'Select hours' },
                  { value: '1-5', label: '1-5 hours' },
                  { value: '5-10', label: '5-10 hours' },
                  { value: '10-20', label: '10-20 hours' },
                  { value: '20+', label: '20+ hours' },
                  { value: 'flexible', label: 'Flexible' },
                ]} />
                <FormSelect label="Willing to travel?" name="willing_to_travel" value={form.willing_to_travel === true ? 'true' : form.willing_to_travel === false ? 'false' : ''} onChange={(e) => handleChange('willing_to_travel', e.target.value === 'true')} options={[
                  { value: '', label: 'Select' },
                  { value: 'true', label: 'Yes' },
                  { value: 'false', label: 'No' },
                ]} />
              </div>
            </div>
            <div className="form-section">
              <FormInput label="Preferred schedule" type="text" name="schedule" value={form.schedule} onChange={(e) => handleChange('schedule', e.target.value)} placeholder="e.g. Mon-Fri 9am-1pm, Weekends flexible" />
            </div>
          </>
        );

      case 2:
        return (
          <>
            <h3 className="form-section-heading">Skills & Interest Areas</h3>
            <CheckboxGroup
              label="Select your skills *"
              options={SKILL_OPTIONS}
              value={form.skills}
              onChange={(val) => handleChange('skills', val)}
            />
            <CheckboxGroup
              label="Interest areas (align with our projects) *"
              options={INTEREST_OPTIONS}
              value={form.interest_areas}
              onChange={(val) => handleChange('interest_areas', val)}
            />
            <div className="form-section">
              <FormTextarea label="Why do you want to volunteer with us?" name="motivation" value={form.motivation} onChange={(e) => handleChange('motivation', e.target.value)} placeholder="Share what motivates you to join our mission..." rows={4} />
            </div>
            <div className="form-section">
              <FormInput label="CV / Resume Link (optional)" type="url" name="cv_url" value={form.cv_url} onChange={(e) => handleChange('cv_url', e.target.value)} placeholder="https://drive.google.com/..." />
            </div>
          </>
        );

      case 3:
        return (
          <>
            <h3 className="form-section-heading">Additional Information</h3>

            {/* Emergency Contact */}
            <div className="form-section" style={{ padding: '16px', backgroundColor: '#fef2f2', borderRadius: '8px', border: '1px solid #fecaca' }}>
              <h4 style={{ fontSize: '15px', fontWeight: 600, color: '#991b1b', marginBottom: '12px' }}>Emergency Contact</h4>
              <div className="form-grid-3">
                <FormInput label="Contact Name" type="text" name="emergency_contact_name" value={form.emergency_contact_name} onChange={(e) => handleChange('emergency_contact_name', e.target.value)} placeholder="Full name" />
                <FormInput label="Contact Phone" type="tel" name="emergency_contact_phone" value={form.emergency_contact_phone} onChange={(e) => handleChange('emergency_contact_phone', e.target.value)} placeholder="Phone number" />
                <FormInput label="Relationship" type="text" name="emergency_contact_relation" value={form.emergency_contact_relation} onChange={(e) => handleChange('emergency_contact_relation', e.target.value)} placeholder="e.g. Father, Brother" />
              </div>
            </div>

            {/* Source & Comments */}
            <div className="form-section">
              <div className="form-grid-2">
                <FormSelect label="How did you hear about us?" name="source" value={form.source} onChange={(e) => handleChange('source', e.target.value)} options={[
                  { value: '', label: 'Select source' },
                  { value: 'website', label: 'Website' },
                  { value: 'social_media', label: 'Social Media' },
                  { value: 'referral', label: 'Friend / Referral' },
                  { value: 'walk_in', label: 'Walk-In' },
                  { value: 'event', label: 'Event' },
                  { value: 'other', label: 'Other' },
                ]} />
              </div>
            </div>
            <div className="form-section">
              <FormTextarea label="Additional Comments" name="comments" value={form.comments} onChange={(e) => handleChange('comments', e.target.value)} placeholder="Anything else you'd like us to know..." rows={3} />
            </div>

            {/* Code of Conduct */}
            <div className="form-section" style={{ padding: '16px', backgroundColor: '#f0f9ff', borderRadius: '8px', border: '1px solid #bae6fd' }}>
              <h4 style={{ fontSize: '15px', fontWeight: 600, color: '#0c4a6e', marginBottom: '12px' }}>Volunteer Code of Conduct</h4>
              <ul style={{ fontSize: '13px', color: '#374151', paddingLeft: '20px', marginBottom: '16px', lineHeight: '1.8' }}>
                <li>Respect all beneficiaries and community members</li>
                <li>No political or religious campaigning during activities</li>
                <li>No media sharing without prior organizational permission</li>
                <li>Follow all organizational guidelines and safety protocols</li>
                <li>Maintain confidentiality of sensitive information</li>
              </ul>

              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginBottom: '10px', fontSize: '14px', color: '#374151' }}>
                <input type="checkbox" checked={form.agreed_to_policy} onChange={(e) => handleChange('agreed_to_policy', e.target.checked)} style={{ accentColor: '#2196f3', width: '18px', height: '18px' }} />
                <span>I agree to follow the volunteer policy *</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '14px', color: '#374151' }}>
                <input type="checkbox" checked={form.declaration_accurate} onChange={(e) => handleChange('declaration_accurate', e.target.checked)} style={{ accentColor: '#2196f3', width: '18px', height: '18px' }} />
                <span>I confirm that all information provided is accurate *</span>
              </label>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <Navbar />
      <div className="form-content">
        <PageHeader title="Register Volunteer" onBack={() => navigate('/dms/volunteers/list')} />

        {error && (
          <div className="status-message status-message--error">{error}</div>
        )}

        <ProgressBar />

        <form className="form" onSubmit={(e) => e.preventDefault()}>
          {renderStep()}

          {/* Navigation Buttons */}
          <div className="form-actions" style={{ justifyContent: 'space-between' }}>
            <button
              type="button"
              className="secondary_btn"
              onClick={currentStep === 0 ? () => navigate('/dms/volunteers/list') : handleBack}
              style={{ padding: '10px 28px' }}
            >
              {currentStep === 0 ? 'Cancel' : 'Back'}
            </button>

            {currentStep < STEPS.length - 1 ? (
              <button
                type="button"
                className="primary_btn"
                onClick={handleNext}
                style={{ padding: '10px 32px' }}
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                className="primary_btn"
                onClick={handleSubmit}
                disabled={isSubmitting}
                style={{ padding: '10px 32px', backgroundColor: '#10b981' }}
              >
                {isSubmitting ? 'Submitting...' : 'Register Volunteer'}
              </button>
            )}
          </div>

          <p style={{ textAlign: 'center', marginTop: '8px', color: '#9ca3af', fontSize: '13px' }}>
            Step {currentStep + 1} of {STEPS.length}
          </p>
        </form>
      </div>
    </>
  );
};

export default RegisterVolunteer;
