import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../../../../utils/axios';
import Navbar from '../../../Navbar';
import PageHeader from '../../../common/PageHeader';

const LABEL_STYLE = { color: '#6b7280', fontSize: '12px', marginBottom: '4px', fontWeight: 400 };
const VALUE_STYLE = { fontWeight: 500, fontSize: '14px', color: '#1f2937' };
const SECTION_TITLE = { fontSize: '16px', fontWeight: 600, color: '#1f2937', marginBottom: '16px', paddingBottom: '8px', borderBottom: '2px solid #e5e7eb' };
const CARD_STYLE = { backgroundColor: '#fff', padding: '20px', borderRadius: '10px', border: '1px solid #e5e7eb', marginBottom: '16px' };
const GRID2 = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' };
const GRID3 = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' };

const Tag = ({ children, color = '#2196f3' }) => (
  <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 500, backgroundColor: `${color}15`, color, marginRight: '6px', marginBottom: '6px' }}>
    {children}
  </span>
);

const StatusBadge = ({ status }) => {
  const colors = { pending: '#f59e0b', approved: '#10b981', rejected: '#ef4444' };
  const c = colors[status] || '#6b7280';
  return (
    <span style={{ display: 'inline-block', padding: '4px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, backgroundColor: `${c}15`, color: c, textTransform: 'capitalize' }}>
      {status || 'pending'}
    </span>
  );
};

const Field = ({ label, value }) => (
  <div>
    <p style={LABEL_STYLE}>{label}</p>
    <p style={VALUE_STYLE}>{value || '-'}</p>
  </div>
);

const formatLabel = (str) => (str || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

const ViewVolunteer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [volunteer, setVolunteer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { fetchVolunteer(); }, [id]);

  const fetchVolunteer = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/volunteers/${id}`);
      if (response.data.success) setVolunteer(response.data.data);
      else setError('Failed to fetch volunteer details');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch volunteer details');
    } finally { setLoading(false); }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="list-wrapper">
          <div className="loading-container"><div className="loading-spinner"></div><p>Loading volunteer details...</p></div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className="list-wrapper">
          <PageHeader title="Volunteer Details" showBackButton={true} backPath="/dms/volunteers/list" />
          <div className="list-content"><div className="status-message status-message--error">{error}</div></div>
        </div>
      </>
    );
  }

  const v = volunteer;

  return (
    <>
      <Navbar />
      <div className="list-wrapper">
        <PageHeader title="Volunteer Details" showBackButton={true} backPath="/dms/volunteers/list" />
        <div className="list-content">

          {/* Status Bar */}
          <div style={{ ...CARD_STYLE, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
              <div>
                <p style={LABEL_STYLE}>Status</p>
                <StatusBadge status={v?.status} />
              </div>
              <div>
                <p style={LABEL_STYLE}>Verification</p>
                <StatusBadge status={v?.verification_status} />
              </div>
              {v?.assigned_department && (
                <div>
                  <p style={LABEL_STYLE}>Assigned Department</p>
                  <p style={VALUE_STYLE}>{formatLabel(v.assigned_department)}</p>
                </div>
              )}
            </div>
            <div>
              <p style={LABEL_STYLE}>Registered</p>
              <p style={VALUE_STYLE}>{v?.created_at ? new Date(v.created_at).toLocaleDateString() : '-'}</p>
            </div>
          </div>

          {/* Section 1: Personal Information */}
          <div style={CARD_STYLE}>
            <h3 style={SECTION_TITLE}>Personal Information</h3>
            <div style={GRID2}>
              <Field label="Full Name" value={v?.name} />
              <Field label="CNIC / ID Number" value={v?.cnic} />
              <Field label="Date of Birth" value={v?.date_of_birth ? new Date(v.date_of_birth).toLocaleDateString() : null} />
              <Field label="Gender" value={formatLabel(v?.gender)} />
              <Field label="Phone" value={v?.phone} />
              <Field label="Email" value={v?.email} />
              <Field label="City" value={v?.city} />
              <Field label="Area" value={v?.area} />
            </div>
          </div>

          {/* Section 2: Availability & Commitment */}
          <div style={CARD_STYLE}>
            <h3 style={SECTION_TITLE}>Availability & Commitment</h3>
            <div style={{ marginBottom: '12px' }}>
              <p style={LABEL_STYLE}>Available</p>
              <div style={{ marginTop: '4px' }}>
                {(v?.availability_days && v.availability_days.length > 0)
                  ? v.availability_days.map(d => <Tag key={d}>{formatLabel(d)}</Tag>)
                  : <span style={VALUE_STYLE}>{v?.availability || '-'}</span>
                }
              </div>
            </div>
            <div style={GRID3}>
              <Field label="Hours Per Week" value={v?.hours_per_week} />
              <Field label="Willing to Travel" value={v?.willing_to_travel === true ? 'Yes' : v?.willing_to_travel === false ? 'No' : '-'} />
              <Field label="Schedule" value={v?.schedule} />
            </div>
          </div>

          {/* Section 3: Skills & Interest */}
          <div style={CARD_STYLE}>
            <h3 style={SECTION_TITLE}>Skills & Interest Areas</h3>
            <div style={{ marginBottom: '16px' }}>
              <p style={LABEL_STYLE}>Skills</p>
              <div style={{ marginTop: '4px' }}>
                {(v?.skills && v.skills.length > 0)
                  ? v.skills.map(s => <Tag key={s} color="#8b5cf6">{formatLabel(s)}</Tag>)
                  : <span style={VALUE_STYLE}>-</span>
                }
              </div>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <p style={LABEL_STYLE}>Interest Areas</p>
              <div style={{ marginTop: '4px' }}>
                {(v?.interest_areas && v.interest_areas.length > 0)
                  ? v.interest_areas.map(a => <Tag key={a} color="#10b981">{formatLabel(a)}</Tag>)
                  : <span style={VALUE_STYLE}>-</span>
                }
              </div>
            </div>
            {v?.motivation && (
              <div>
                <p style={LABEL_STYLE}>Motivation</p>
                <p style={{ ...VALUE_STYLE, whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{v.motivation}</p>
              </div>
            )}
            {v?.cv_url && (
              <div style={{ marginTop: '12px' }}>
                <p style={LABEL_STYLE}>CV / Resume</p>
                <a href={v.cv_url} target="_blank" rel="noopener noreferrer" style={{ color: '#2196f3', textDecoration: 'underline', fontSize: '14px' }}>View CV</a>
              </div>
            )}
          </div>

          {/* Section 4: Emergency Contact */}
          {(v?.emergency_contact_name || v?.emergency_contact_phone) && (
            <div style={{ ...CARD_STYLE, backgroundColor: '#fef2f2', border: '1px solid #fecaca' }}>
              <h3 style={{ ...SECTION_TITLE, color: '#991b1b', borderColor: '#fecaca' }}>Emergency Contact</h3>
              <div style={GRID3}>
                <Field label="Name" value={v?.emergency_contact_name} />
                <Field label="Phone" value={v?.emergency_contact_phone} />
                <Field label="Relationship" value={v?.emergency_contact_relation} />
              </div>
            </div>
          )}

          {/* Additional Info */}
          <div style={CARD_STYLE}>
            <h3 style={SECTION_TITLE}>Additional Information</h3>
            <div style={GRID2}>
              <Field label="Source" value={formatLabel(v?.source)} />
              <Field label="Interview Required" value={v?.interview_required ? 'Yes' : 'No'} />
            </div>
            {v?.comments && (
              <div style={{ marginTop: '12px' }}>
                <p style={LABEL_STYLE}>Comments</p>
                <p style={{ ...VALUE_STYLE, whiteSpace: 'pre-wrap' }}>{v.comments}</p>
              </div>
            )}
            <div style={{ marginTop: '12px', display: 'flex', gap: '24px' }}>
              <div>
                <p style={LABEL_STYLE}>Agreed to Policy</p>
                <p style={VALUE_STYLE}>{v?.agreed_to_policy ? 'Yes' : 'No'}</p>
              </div>
              <div>
                <p style={LABEL_STYLE}>Declaration Accurate</p>
                <p style={VALUE_STYLE}>{v?.declaration_accurate ? 'Yes' : 'No'}</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button onClick={() => navigate(`/dms/volunteers/edit/${id}`)} style={{ padding: '10px 24px', fontSize: '14px', borderRadius: '8px', backgroundColor: '#ff9800', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
              Edit Volunteer
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ViewVolunteer;
