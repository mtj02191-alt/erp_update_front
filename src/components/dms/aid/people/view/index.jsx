import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../../../../utils/axios';
import { useAuth } from '../../../../../context/AuthContext';
import { hasPermissionByPath } from '../../../../../utils/permissions';
import Navbar from '../../../../Navbar';
import PageHeader from '../../../../common/PageHeader';
import FormInput from '../../../../common/FormInput';
import FormSelect from '../../../../common/FormSelect';
import FormTextarea from '../../../../common/FormTextarea';
import { PrimaryButton } from '../../../../common/buttons';
import {
  AID_EDUCATION_LEVELS,
  AID_FAMILY_SECTIONS,
  AID_GENDERS,
  AID_MARITAL_STATUS,
  aidStatusTone,
  formatAidStatus,
  formatEducation,
  formatMaritalStatus,
  personAge,
} from '../../aidConstants';
import '../../aid.css';

const emptyRelative = {
  full_name: '',
  cnic: '',
  phone: '',
  gender: '',
  date_of_birth: '',
  marital_status: '',
  occupation: '',
  monthly_income: '',
  education_level: '',
  is_alive: true,
  address: '',
  city: '',
  notes: '',
};

const AidPersonView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { permissions } = useAuth();
  const canUpdate =
    hasPermissionByPath(permissions, 'fund_raising.aid_people.update') ||
    permissions?.super_admin ||
    permissions?.fund_raising_manager;

  const [data, setData] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [profile, setProfile] = useState({});
  const [editingProfile, setEditingProfile] = useState(false);
  const [addSection, setAddSection] = useState(null);
  const [relationType, setRelationType] = useState('father');
  const [relative, setRelative] = useState({ ...emptyRelative });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [personRes, attRes] = await Promise.all([
        axiosInstance.get(`/aid/people/${id}`),
        axiosInstance.get(`/aid/applications/person/${id}/attachments`),
      ]);
      const payload = personRes.data?.data || null;
      setData(payload);
      if (payload?.person) {
        const p = payload.person;
        setProfile({
          full_name: p.full_name || '',
          cnic: p.cnic || '',
          phone: p.phone || '',
          gender: p.gender || '',
          date_of_birth: p.date_of_birth ? String(p.date_of_birth).slice(0, 10) : '',
          marital_status: p.marital_status || '',
          occupation: p.occupation || '',
          education_level: p.education_level || '',
          monthly_income: p.monthly_income || '',
          is_alive: p.is_alive !== false,
          health_notes: p.health_notes || '',
          address: p.address || '',
          city: p.city || '',
          notes: p.notes || '',
        });
      }
      setAttachments(attRes.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load person');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const saveProfile = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await axiosInstance.patch(`/aid/people/${id}`, {
        ...profile,
        full_name: profile.full_name.trim(),
        gender: profile.gender || null,
        marital_status: profile.marital_status || null,
        education_level: profile.education_level || null,
        date_of_birth: profile.date_of_birth || null,
        monthly_income: profile.monthly_income || null,
        cnic: profile.cnic || null,
      });
      setEditingProfile(false);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save profile');
    } finally {
      setBusy(false);
    }
  };

  const openAdd = (section) => {
    setAddSection(section.key);
    setRelationType(section.defaultRelation);
    setRelative({
      ...emptyRelative,
      gender:
        section.defaultRelation === 'mother' ||
        section.defaultRelation === 'sister' ||
        section.defaultRelation === 'daughter' ||
        section.defaultRelation === 'grandmother'
          ? 'female'
          : section.defaultRelation === 'father' ||
              section.defaultRelation === 'brother' ||
              section.defaultRelation === 'son' ||
              section.defaultRelation === 'grandfather'
            ? 'male'
            : '',
    });
  };

  const addFamilyMember = async (e) => {
    e.preventDefault();
    if (!relative.full_name.trim()) {
      setError('Relative name is required');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await axiosInstance.post(`/aid/people/${id}/family-members`, {
        relation_type: relationType,
        notes: relative.notes || undefined,
        person: {
          full_name: relative.full_name.trim(),
          cnic: relative.cnic || undefined,
          phone: relative.phone || undefined,
          gender: relative.gender || undefined,
          date_of_birth: relative.date_of_birth || undefined,
          marital_status: relative.marital_status || undefined,
          occupation: relative.occupation || undefined,
          monthly_income: relative.monthly_income || undefined,
          education_level: relative.education_level || undefined,
          is_alive: relative.is_alive,
          address: relative.address || undefined,
          city: relative.city || undefined,
          notes: relative.notes || undefined,
        },
      });
      setAddSection(null);
      setRelative({ ...emptyRelative });
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add family member');
    } finally {
      setBusy(false);
    }
  };

  const removeEdge = async (edgeId) => {
    setBusy(true);
    try {
      await axiosInstance.delete(`/aid/people/kinship/${edgeId}`);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove relation');
    } finally {
      setBusy(false);
    }
  };

  const uploadProfile = async (file) => {
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    fd.append('context', 'profile');
    setBusy(true);
    try {
      await axiosInstance.post(`/aid/applications/person/${id}/attachments/upload`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="form-content">Loading…</div>
      </>
    );
  }
  if ((error && !data) || !data?.person) {
    return (
      <>
        <Navbar />
        <div className="form-content">
          <div className="error-message">{error || 'Not found'}</div>
        </div>
      </>
    );
  }

  const person = data.person;
  const age = personAge(person.date_of_birth);
  const tree = data.family_tree || {};
  const counts = data.family_counts || {};

  const renderMemberCard = (row) => {
    const p = row.person;
    const a = personAge(p.date_of_birth);
    return (
      <div key={row.edge_id} className="aid-family-card">
        <div className="aid-family-card__main">
          <Link to={`/dms/aid/people/view/${p.id}`}>
            <strong>{p.full_name}</strong>
          </Link>
          <span className="aid-family-card__rel">{row.relation_type}</span>
          {!p.is_alive && <span className="aid-status-pill aid-status-pill--danger">Deceased</span>}
        </div>
        <div className="aid-family-card__meta">
          {[
            p.gender,
            a != null ? `${a} yrs` : null,
            p.marital_status ? formatMaritalStatus(p.marital_status) : null,
            p.occupation,
            p.monthly_income ? `PKR ${p.monthly_income}/mo` : null,
            p.education_level ? formatEducation(p.education_level) : null,
            p.cnic ? `CNIC ${p.cnic}` : null,
            p.phone,
            p.city,
          ]
            .filter(Boolean)
            .join(' · ') || 'No extra details'}
        </div>
        {p.address && <div className="aid-family-card__meta">Address: {p.address}</div>}
        {row.notes && <div className="aid-family-card__meta">Note: {row.notes}</div>}
        {canUpdate && (
          <button
            type="button"
            className="secondary-btn"
            style={{ marginTop: 8, padding: '2px 8px', fontSize: 12 }}
            disabled={busy}
            onClick={() => removeEdge(row.edge_id)}
          >
            Unlink
          </button>
        )}
      </div>
    );
  };

  return (
    <>
      <Navbar />
      <div className="form-content aid-view">
        <PageHeader
          title={person.full_name || 'Person'}
          backPath="/dms/aid/people/list"
          onBackClick={() => navigate('/dms/aid/people/list')}
          showAdd={false}
        />
        {error && <div className="error-message">{error}</div>}

        <div className="aid-hero">
          <div>
            <h2 style={{ margin: 0 }}>{person.full_name}</h2>
            <p style={{ margin: '6px 0 0', color: '#64748b' }}>
              {formatMaritalStatus(person.marital_status)}
              {age != null ? ` · ${age} yrs` : ''}
              {person.gender ? ` · ${person.gender}` : ''}
              {person.is_alive === false ? ' · Deceased' : ''}
            </p>
            <p style={{ margin: '6px 0 0', color: '#64748b' }}>
              CNIC: {person.cnic || '—'} · Phone: {person.phone || '—'} ·{' '}
              {person.city || 'No city'}
            </p>
            {person.address && (
              <p style={{ margin: '6px 0 0', color: '#64748b' }}>Address: {person.address}</p>
            )}
          </div>
          {canUpdate && !editingProfile && (
            <button type="button" className="secondary-btn" onClick={() => setEditingProfile(true)}>
              Edit profile
            </button>
          )}
        </div>

        <div className="aid-family-stats">
          <span>Parents {counts.parents || 0}</span>
          <span>Spouse {counts.spouse || 0}</span>
          <span>Children {counts.children || 0}</span>
          <span>Brothers {counts.brothers || 0}</span>
          <span>Sisters {counts.sisters || 0}</span>
          <span>Linked {counts.total_linked || 0}</span>
        </div>

        {editingProfile ? (
          <form className="aid-section" style={{ marginBottom: 16 }} onSubmit={saveProfile}>
            <h3>Beneficiary profile bank</h3>
            <div className="form-grid">
              <FormInput
                label="Full name"
                required
                value={profile.full_name}
                onChange={(e) => setProfile((p) => ({ ...p, full_name: e.target.value }))}
              />
              <FormInput
                label="CNIC"
                value={profile.cnic}
                onChange={(e) => setProfile((p) => ({ ...p, cnic: e.target.value }))}
              />
              <FormInput
                label="Phone"
                value={profile.phone}
                onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
              />
              <FormSelect
                label="Gender"
                value={profile.gender}
                onChange={(e) => setProfile((p) => ({ ...p, gender: e.target.value }))}
                options={[{ value: '', label: '—' }, ...AID_GENDERS]}
              />
              <FormInput
                label="Date of birth"
                type="date"
                value={profile.date_of_birth}
                onChange={(e) => setProfile((p) => ({ ...p, date_of_birth: e.target.value }))}
              />
              <FormSelect
                label="Marital status"
                value={profile.marital_status}
                onChange={(e) => setProfile((p) => ({ ...p, marital_status: e.target.value }))}
                options={[{ value: '', label: '—' }, ...AID_MARITAL_STATUS]}
              />
              <FormInput
                label="Profession"
                value={profile.occupation}
                onChange={(e) => setProfile((p) => ({ ...p, occupation: e.target.value }))}
                placeholder="Optional"
              />
              <FormSelect
                label="Education"
                value={profile.education_level}
                onChange={(e) => setProfile((p) => ({ ...p, education_level: e.target.value }))}
                options={[{ value: '', label: '—' }, ...AID_EDUCATION_LEVELS]}
              />
              <FormInput
                label="Monthly income (PKR)"
                value={profile.monthly_income}
                onChange={(e) => setProfile((p) => ({ ...p, monthly_income: e.target.value }))}
                placeholder="Optional"
              />
              <FormInput
                label="City"
                value={profile.city}
                onChange={(e) => setProfile((p) => ({ ...p, city: e.target.value }))}
              />
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
                <input
                  type="checkbox"
                  checked={profile.is_alive !== false}
                  onChange={(e) => setProfile((p) => ({ ...p, is_alive: e.target.checked }))}
                />
                Alive
              </label>
            </div>
            <FormTextarea
              label="Address"
              value={profile.address}
              onChange={(e) => setProfile((p) => ({ ...p, address: e.target.value }))}
              rows={2}
            />
            <FormTextarea
              label="Health / disability notes"
              value={profile.health_notes}
              onChange={(e) => setProfile((p) => ({ ...p, health_notes: e.target.value }))}
              rows={2}
            />
            <FormTextarea
              label="General notes"
              value={profile.notes}
              onChange={(e) => setProfile((p) => ({ ...p, notes: e.target.value }))}
              rows={2}
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <PrimaryButton type="submit" loading={busy} loadingText="Saving…">
                Save profile
              </PrimaryButton>
              <button
                type="button"
                className="secondary-btn"
                onClick={() => setEditingProfile(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <section className="aid-section" style={{ marginBottom: 16 }}>
            <h3>Profile bank</h3>
            <div className="aid-meta-row">
              <span>Marital status</span>
              <strong>{formatMaritalStatus(person.marital_status)}</strong>
            </div>
            <div className="aid-meta-row">
              <span>Profession</span>
              <strong>{person.occupation || '—'}</strong>
            </div>
            <div className="aid-meta-row">
              <span>Education</span>
              <strong>{formatEducation(person.education_level)}</strong>
            </div>
            <div className="aid-meta-row">
              <span>Monthly income</span>
              <strong>{person.monthly_income ? `PKR ${person.monthly_income}` : '—'}</strong>
            </div>
            <div className="aid-meta-row">
              <span>Date of birth</span>
              <strong>
                {person.date_of_birth
                  ? `${String(person.date_of_birth).slice(0, 10)}${age != null ? ` (${age} yrs)` : ''}`
                  : '—'}
              </strong>
            </div>
            {person.health_notes && (
              <div className="aid-meta-row">
                <span>Health notes</span>
                <strong>{person.health_notes}</strong>
              </div>
            )}
            {person.notes && (
              <div className="aid-meta-row">
                <span>Notes</span>
                <strong>{person.notes}</strong>
              </div>
            )}
          </section>
        )}

        <h3 style={{ margin: '8px 0 12px' }}>Family tree</h3>
        <div className="aid-family-grid">
          {AID_FAMILY_SECTIONS.map((section) => {
            const rows = tree[section.key] || [];
            const allRows =
              section.key === 'extended'
                ? [...rows, ...(tree.siblings || [])]
                : rows;
            return (
              <section key={section.key} className="aid-section aid-family-section">
                <div className="aid-family-section__head">
                  <h3>
                    {section.title}{' '}
                    <span style={{ color: '#94a3b8', fontWeight: 500 }}>({allRows.length})</span>
                  </h3>
                  {canUpdate && (
                    <button
                      type="button"
                      className="secondary-btn"
                      style={{ padding: '4px 10px', fontSize: 12 }}
                      onClick={() => openAdd(section)}
                    >
                      + Add
                    </button>
                  )}
                </div>
                {allRows.length === 0 ? (
                  <p style={{ color: '#94a3b8', margin: 0 }}>{section.empty}</p>
                ) : (
                  allRows.map(renderMemberCard)
                )}

                {addSection === section.key && (
                  <form className="aid-inline-form" onSubmit={addFamilyMember}>
                    <FormSelect
                      label="Relation"
                      value={relationType}
                      onChange={(e) => setRelationType(e.target.value)}
                      options={section.relations}
                    />
                    <FormInput
                      label="Full name"
                      required
                      value={relative.full_name}
                      onChange={(e) =>
                        setRelative((p) => ({ ...p, full_name: e.target.value }))
                      }
                    />
                    <div className="form-grid">
                      <FormSelect
                        label="Gender"
                        value={relative.gender}
                        onChange={(e) =>
                          setRelative((p) => ({ ...p, gender: e.target.value }))
                        }
                        options={[{ value: '', label: '—' }, ...AID_GENDERS]}
                      />
                      <FormInput
                        label="Date of birth"
                        type="date"
                        value={relative.date_of_birth}
                        onChange={(e) =>
                          setRelative((p) => ({ ...p, date_of_birth: e.target.value }))
                        }
                      />
                      <FormSelect
                        label="Marital status"
                        value={relative.marital_status}
                        onChange={(e) =>
                          setRelative((p) => ({ ...p, marital_status: e.target.value }))
                        }
                        options={[{ value: '', label: '—' }, ...AID_MARITAL_STATUS]}
                      />
                      <FormInput
                        label="CNIC"
                        value={relative.cnic}
                        onChange={(e) =>
                          setRelative((p) => ({ ...p, cnic: e.target.value }))
                        }
                      />
                      <FormInput
                        label="Phone"
                        value={relative.phone}
                        onChange={(e) =>
                          setRelative((p) => ({ ...p, phone: e.target.value }))
                        }
                      />
                      <FormInput
                        label="Profession"
                        value={relative.occupation}
                        onChange={(e) =>
                          setRelative((p) => ({ ...p, occupation: e.target.value }))
                        }
                        placeholder="Optional"
                      />
                      <FormInput
                        label="Monthly income (PKR)"
                        value={relative.monthly_income}
                        onChange={(e) =>
                          setRelative((p) => ({ ...p, monthly_income: e.target.value }))
                        }
                        placeholder="Optional"
                      />
                      <FormSelect
                        label="Education"
                        value={relative.education_level}
                        onChange={(e) =>
                          setRelative((p) => ({ ...p, education_level: e.target.value }))
                        }
                        options={[{ value: '', label: '—' }, ...AID_EDUCATION_LEVELS]}
                      />
                      <FormInput
                        label="City"
                        value={relative.city}
                        onChange={(e) =>
                          setRelative((p) => ({ ...p, city: e.target.value }))
                        }
                      />
                    </div>
                    <FormTextarea
                      label="Address"
                      value={relative.address}
                      onChange={(e) =>
                        setRelative((p) => ({ ...p, address: e.target.value }))
                      }
                      rows={2}
                    />
                    <label style={{ display: 'flex', gap: 8, fontSize: 14 }}>
                      <input
                        type="checkbox"
                        checked={relative.is_alive !== false}
                        onChange={(e) =>
                          setRelative((p) => ({ ...p, is_alive: e.target.checked }))
                        }
                      />
                      Alive
                    </label>
                    <FormTextarea
                      label="Notes"
                      value={relative.notes}
                      onChange={(e) =>
                        setRelative((p) => ({ ...p, notes: e.target.value }))
                      }
                      rows={2}
                    />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <PrimaryButton type="submit" loading={busy} loadingText="Saving…">
                        Save relative
                      </PrimaryButton>
                      <button
                        type="button"
                        className="secondary-btn"
                        onClick={() => setAddSection(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </section>
            );
          })}
        </div>

        <section className="aid-section" style={{ marginTop: 16 }}>
          <h3>Households</h3>
          {(data.households || []).length === 0 ? (
            <p style={{ color: '#94a3b8' }}>Not in any household yet.</p>
          ) : (
            data.households.map((h) => (
              <div key={h.membership_id || h.id} style={{ marginBottom: 10 }}>
                <strong>{h.label || h.code || `Household #${h.id}`}</strong>
                <div style={{ fontSize: 12, color: '#64748b' }}>
                  Your role: {h.role_in_household || '—'}
                </div>
                <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
                  {(h.members || []).map((m) => (
                    <li key={m.id}>
                      {m.person?.id === Number(id) ? (
                        <span>
                          {m.person?.full_name} ({m.role_in_household})
                        </span>
                      ) : (
                        <Link to={`/dms/aid/people/view/${m.person?.id}`}>
                          {m.person?.full_name} ({m.role_in_household})
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </section>

        <section className="aid-section" style={{ marginTop: 16 }}>
          <h3>Applications</h3>
          {(data.applications || []).length === 0 ? (
            <p style={{ color: '#94a3b8' }}>No applications as beneficiary or writer.</p>
          ) : (
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {data.applications.map((a) => (
                <li key={a.id} style={{ marginBottom: 6 }}>
                  <Link to={`/dms/aid/applications/view/${a.id}`}>{a.application_no}</Link>{' '}
                  <span className={`aid-status-pill aid-status-pill--${aidStatusTone(a.status)}`}>
                    {formatAidStatus(a.status)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="aid-section" style={{ marginTop: 16 }}>
          <h3>Profile attachments</h3>
          {canUpdate && (
            <input
              type="file"
              style={{ marginBottom: 12 }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) uploadProfile(f);
                e.target.value = '';
              }}
            />
          )}
          {attachments.length === 0 ? (
            <p style={{ color: '#94a3b8' }}>No profile files.</p>
          ) : (
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {attachments.map((a) => (
                <li key={a.id}>
                  <a href={a.file_url} target="_blank" rel="noreferrer">
                    {a.file_name}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
};

export default AidPersonView;
