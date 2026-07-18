import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';
import FormInput from '../../../common/FormInput';
import FormSelect from '../../../common/FormSelect';
import FormTextarea from '../../../common/FormTextarea';

const SECTION_TITLE = { fontSize: '16px', fontWeight: 600, color: '#1f2937', marginBottom: '16px', paddingBottom: '8px', borderBottom: '2px solid #e5e7eb' };
const CARD_STYLE = { backgroundColor: '#fff', padding: '20px', borderRadius: '10px', border: '1px solid #e5e7eb', marginBottom: '16px' };
const GRID2 = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' };
const GRID3 = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' };

const SKILL_OPTIONS = [
  { value: 'teaching', label: 'Teaching' }, { value: 'medical_assistance', label: 'Medical Assistance' },
  { value: 'it_technical', label: 'IT / Technical Support' }, { value: 'social_media_marketing', label: 'Social Media / Marketing' },
  { value: 'fundraising', label: 'Fundraising' }, { value: 'field_work', label: 'Field Work' },
  { value: 'event_management', label: 'Event Management' }, { value: 'data_entry', label: 'Data Entry' },
  { value: 'photography_videography', label: 'Photography / Videography' }, { value: 'counseling', label: 'Counseling' },
  { value: 'driving', label: 'Driving' }, { value: 'cooking', label: 'Cooking' },
  { value: 'translation', label: 'Translation' }, { value: 'other', label: 'Other' },
];

const INTEREST_OPTIONS = [
  { value: 'health', label: 'Health' }, { value: 'education', label: 'Education' },
  { value: 'food_distribution', label: 'Food Distribution' }, { value: 'women_empowerment', label: 'Women Empowerment' },
  { value: 'disaster_relief', label: 'Disaster Relief' }, { value: 'housing', label: 'Housing' },
  { value: 'clean_water', label: 'Clean Water' }, { value: 'orphan_care', label: 'Orphan Care' },
  { value: 'community_development', label: 'Community Development' },
];

const AVAILABILITY_OPTIONS = [
  { value: 'weekdays', label: 'Weekdays' }, { value: 'weekends', label: 'Weekends' },
  { value: 'emergency_only', label: 'Emergency Only' }, { value: 'remote', label: 'Remote Volunteering' },
];

const CheckboxGroup = ({ label, options, value, onChange }) => (
  <div style={{ marginBottom: '16px' }}>
    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '14px', color: '#374151' }}>{label}</label>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
      {options.map(opt => {
        const checked = (value || []).includes(opt.value);
        return (
          <label key={opt.value} style={{
            display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer',
            border: checked ? '2px solid #2196f3' : '2px solid #e5e7eb', backgroundColor: checked ? '#eff6ff' : '#fff',
            transition: 'all 0.2s ease', fontSize: '13px', color: '#374151',
          }}>
            <input type="checkbox" checked={checked} onChange={() => {
              const newVal = checked ? value.filter(v => v !== opt.value) : [...(value || []), opt.value];
              onChange(newVal);
            }} style={{ accentColor: '#2196f3' }} />
            {opt.label}
          </label>
        );
      })}
    </div>
  </div>
);

const EditVolunteer = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '', cnic: '', date_of_birth: '', gender: '', phone: '', email: '', city: '', area: '',
    availability_days: [], hours_per_week: '', willing_to_travel: false, schedule: '',
    skills: [], interest_areas: [], motivation: '', cv_url: '',
    emergency_contact_name: '', emergency_contact_phone: '', emergency_contact_relation: '',
    source: '', comments: '', status: '', assigned_department: '', interview_required: false, verification_status: '',
  });

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { fetchVolunteer(); }, [id]);

  const fetchVolunteer = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/volunteers/${id}`);
      if (response.data.success) {
        const v = response.data.data;
        setForm({
          name: v.name || '', cnic: v.cnic || '', date_of_birth: v.date_of_birth ? v.date_of_birth.split('T')[0] : '', gender: v.gender || '',
          phone: v.phone || '', email: v.email || '', city: v.city || '', area: v.area || '',
          availability_days: v.availability_days || [], hours_per_week: v.hours_per_week || '',
          willing_to_travel: v.willing_to_travel || false, schedule: v.schedule || '',
          skills: v.skills || [], interest_areas: v.interest_areas || [],
          motivation: v.motivation || '', cv_url: v.cv_url || '',
          emergency_contact_name: v.emergency_contact_name || '', emergency_contact_phone: v.emergency_contact_phone || '',
          emergency_contact_relation: v.emergency_contact_relation || '',
          source: v.source || '', comments: v.comments || '',
          status: v.status || 'pending', assigned_department: v.assigned_department || '',
          interview_required: v.interview_required || false, verification_status: v.verification_status || 'unverified',
        });
      } else {
        setError('Failed to fetch volunteer');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch volunteer');
    } finally { setLoading(false); }
  };

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name || !form.email || !form.phone) {
      setError('Name, email, and phone are required.');
      return;
    }
    try {
      setIsSubmitting(true);
      const payload = { ...form };
      if (payload.availability_days.length > 0) {
        payload.availability = payload.availability_days.join(', ');
      }
      const response = await axiosInstance.patch(`/volunteers/${id}`, payload);
      if (response.data.success) {
        navigate(`/dms/volunteers/view/${id}`);
      } else {
        setError(response.data.message || 'Failed to update volunteer');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update volunteer');
    } finally { setIsSubmitting(false); }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="list-wrapper"><div className="loading-container"><div className="loading-spinner"></div><p>Loading volunteer...</p></div></div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="list-wrapper">
        <PageHeader title="Edit Volunteer" showBackButton={true} backPath={`/dms/volunteers/view/${id}`} />
        <div className="list-content">
          {error && <div className="status-message status-message--error" style={{ marginBottom: '16px' }}>{error}</div>}

          <form onSubmit={handleSubmit}>
            {/* ERP Admin Fields */}
            <div style={{ ...CARD_STYLE, backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
              <h3 style={{ ...SECTION_TITLE, color: '#166534', borderColor: '#bbf7d0' }}>Admin Controls</h3>
              <div style={GRID3}>
                <FormSelect label="Status" value={form.status} onChange={(e) => handleChange('status', e.target.value)} options={[
                  { value: 'pending', label: 'Pending' }, { value: 'approved', label: 'Approved' }, { value: 'rejected', label: 'Rejected' },
                ]} />
                <FormSelect label="Verification Status" value={form.verification_status} onChange={(e) => handleChange('verification_status', e.target.value)} options={[
                  { value: 'unverified', label: 'Unverified' }, { value: 'verified', label: 'Verified' }, { value: 'in_review', label: 'In Review' },
                ]} />
                <FormSelect label="Assigned Department" value={form.assigned_department} onChange={(e) => handleChange('assigned_department', e.target.value)} options={[
                  { value: '', label: 'Select Department' },
                  { value: 'health', label: 'Health' }, { value: 'education', label: 'Education' },
                  { value: 'food_distribution', label: 'Food Distribution' }, { value: 'women_empowerment', label: 'Women Empowerment' },
                  { value: 'disaster_relief', label: 'Disaster Relief' }, { value: 'housing', label: 'Housing' },
                  { value: 'clean_water', label: 'Clean Water' }, { value: 'community_development', label: 'Community Development' },
                ]} />
              </div>
              <div style={{ marginTop: '12px' }}>
                <FormSelect label="Interview Required?" value={form.interview_required ? 'true' : 'false'} onChange={(e) => handleChange('interview_required', e.target.value === 'true')} options={[
                  { value: 'false', label: 'No' }, { value: 'true', label: 'Yes' },
                ]} />
              </div>
            </div>

            {/* Section 1: Personal */}
            <div style={CARD_STYLE}>
              <h3 style={SECTION_TITLE}>Personal Information</h3>
              <div style={GRID2}>
                <FormInput label="Full Name *" type="text" value={form.name} onChange={(e) => handleChange('name', e.target.value)} placeholder="Full name" />
                <FormInput label="CNIC / ID Number" type="text" value={form.cnic} onChange={(e) => handleChange('cnic', e.target.value)} placeholder="42101-1234567-1" />
                <FormInput label="Date of Birth" type="date" value={form.date_of_birth} onChange={(e) => handleChange('date_of_birth', e.target.value)} />
                <FormSelect label="Gender" value={form.gender} onChange={(e) => handleChange('gender', e.target.value)} options={[
                  { value: '', label: 'Select' }, { value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }, { value: 'other', label: 'Other' },
                ]} />
                <FormInput label="Phone *" type="tel" value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} placeholder="Phone" />
                <FormInput label="Email *" type="email" value={form.email} onChange={(e) => handleChange('email', e.target.value)} placeholder="Email" />
                <FormInput label="City" type="text" value={form.city} onChange={(e) => handleChange('city', e.target.value)} placeholder="City" />
                <FormInput label="Area" type="text" value={form.area} onChange={(e) => handleChange('area', e.target.value)} placeholder="Area" />
              </div>
            </div>

            {/* Section 2: Availability */}
            <div style={CARD_STYLE}>
              <h3 style={SECTION_TITLE}>Availability & Commitment</h3>
              <CheckboxGroup label="Available" options={AVAILABILITY_OPTIONS} value={form.availability_days} onChange={(val) => handleChange('availability_days', val)} />
              <div style={GRID2}>
                <FormSelect label="Hours per week" value={form.hours_per_week} onChange={(e) => handleChange('hours_per_week', e.target.value)} options={[
                  { value: '', label: 'Select' }, { value: '1-5', label: '1-5 hours' }, { value: '5-10', label: '5-10 hours' },
                  { value: '10-20', label: '10-20 hours' }, { value: '20+', label: '20+ hours' }, { value: 'flexible', label: 'Flexible' },
                ]} />
                <FormSelect label="Willing to travel?" value={form.willing_to_travel ? 'true' : 'false'} onChange={(e) => handleChange('willing_to_travel', e.target.value === 'true')} options={[
                  { value: 'true', label: 'Yes' }, { value: 'false', label: 'No' },
                ]} />
              </div>
              <div style={{ marginTop: '12px' }}>
                <FormInput label="Schedule" type="text" value={form.schedule} onChange={(e) => handleChange('schedule', e.target.value)} placeholder="e.g. Mon-Fri 9am-1pm" />
              </div>
            </div>

            {/* Section 3: Skills */}
            <div style={CARD_STYLE}>
              <h3 style={SECTION_TITLE}>Skills & Interest Areas</h3>
              <CheckboxGroup label="Skills" options={SKILL_OPTIONS} value={form.skills} onChange={(val) => handleChange('skills', val)} />
              <CheckboxGroup label="Interest Areas" options={INTEREST_OPTIONS} value={form.interest_areas} onChange={(val) => handleChange('interest_areas', val)} />
              <div style={{ marginTop: '12px' }}>
                <FormTextarea label="Motivation" name="motivation" value={form.motivation} onChange={(e) => handleChange('motivation', e.target.value)} placeholder="Why do you want to volunteer?" rows={3} />
              </div>
              <div style={{ marginTop: '12px' }}>
                <FormInput label="CV / Resume Link" type="url" value={form.cv_url} onChange={(e) => handleChange('cv_url', e.target.value)} placeholder="https://..." />
              </div>
            </div>

            {/* Section 4: Emergency Contact */}
            <div style={{ ...CARD_STYLE, backgroundColor: '#fef2f2', border: '1px solid #fecaca' }}>
              <h3 style={{ ...SECTION_TITLE, color: '#991b1b', borderColor: '#fecaca' }}>Emergency Contact</h3>
              <div style={GRID3}>
                <FormInput label="Contact Name" type="text" value={form.emergency_contact_name} onChange={(e) => handleChange('emergency_contact_name', e.target.value)} placeholder="Full name" />
                <FormInput label="Contact Phone" type="tel" value={form.emergency_contact_phone} onChange={(e) => handleChange('emergency_contact_phone', e.target.value)} placeholder="Phone" />
                <FormInput label="Relationship" type="text" value={form.emergency_contact_relation} onChange={(e) => handleChange('emergency_contact_relation', e.target.value)} placeholder="e.g. Father" />
              </div>
            </div>

            {/* Source & Comments */}
            <div style={CARD_STYLE}>
              <h3 style={SECTION_TITLE}>Additional</h3>
              <div style={GRID2}>
                <FormSelect label="Source" value={form.source} onChange={(e) => handleChange('source', e.target.value)} options={[
                  { value: '', label: 'Select' }, { value: 'website', label: 'Website' }, { value: 'social_media', label: 'Social Media' },
                  { value: 'referral', label: 'Referral' }, { value: 'walk_in', label: 'Walk-In' }, { value: 'event', label: 'Event' }, { value: 'other', label: 'Other' },
                ]} />
              </div>
              <div style={{ marginTop: '12px' }}>
                <FormTextarea label="Comments" name="comments" value={form.comments} onChange={(e) => handleChange('comments', e.target.value)} placeholder="Additional notes..." rows={3} />
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
              <button type="button" onClick={() => navigate(`/dms/volunteers/view/${id}`)} style={{ padding: '10px 28px', fontSize: '14px', borderRadius: '8px', backgroundColor: '#e5e7eb', color: '#374151', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
                Cancel
              </button>
              <button type="submit" disabled={isSubmitting} style={{ padding: '10px 32px', fontSize: '14px', borderRadius: '8px', backgroundColor: '#2196f3', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 500, opacity: isSubmitting ? 0.6 : 1 }}>
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default EditVolunteer;
