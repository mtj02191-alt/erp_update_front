import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../../../utils/axios';
import Navbar from '../../../../Navbar';
import PageHeader from '../../../../common/PageHeader';
import FormInput from '../../../../common/FormInput';
import FormSelect from '../../../../common/FormSelect';
import FormTextarea from '../../../../common/FormTextarea';
import { PrimaryButton } from '../../../../common/buttons';
import SearchableDropdown from '../../../../common/SearchableDropdown';
import {
  AID_REQUEST_TYPES,
  AID_WRITER_RELATIONS,
  AID_MARITAL_STATUS,
  AID_GENDERS,
  AID_EDUCATION_LEVELS,
} from '../../aidConstants';
import '../../aid.css';

const emptyPerson = {
  full_name: '',
  cnic: '',
  phone: '',
  city: '',
  address: '',
  gender: '',
  date_of_birth: '',
  marital_status: '',
  occupation: '',
  monthly_income: '',
  education_level: '',
  is_alive: true,
};

const emptyRelative = () => ({ ...emptyPerson });

const RelativeFields = ({ title, value, onChange, genderHint }) => (
  <div className="aid-relative-block">
    {title ? <h4 style={{ margin: '0 0 8px' }}>{title}</h4> : null}
    <div className="form-grid">
      <FormInput
        label="Full name"
        value={value.full_name}
        onChange={(e) => onChange({ ...value, full_name: e.target.value })}
        placeholder={genderHint || undefined}
      />
      <FormInput
        label="CNIC"
        value={value.cnic}
        onChange={(e) => onChange({ ...value, cnic: e.target.value })}
      />
      <FormInput
        label="Phone"
        value={value.phone}
        onChange={(e) => onChange({ ...value, phone: e.target.value })}
      />
      <FormSelect
        label="Gender"
        value={value.gender}
        onChange={(e) => onChange({ ...value, gender: e.target.value })}
        options={[{ value: '', label: '—' }, ...AID_GENDERS]}
      />
      <FormInput
        label="Date of birth"
        type="date"
        value={value.date_of_birth}
        onChange={(e) => onChange({ ...value, date_of_birth: e.target.value })}
      />
      <FormSelect
        label="Marital status"
        value={value.marital_status}
        onChange={(e) => onChange({ ...value, marital_status: e.target.value })}
        options={[{ value: '', label: '—' }, ...AID_MARITAL_STATUS]}
      />
      <FormInput
        label="Profession"
        value={value.occupation}
        onChange={(e) => onChange({ ...value, occupation: e.target.value })}
        placeholder="Optional"
      />
      <FormInput
        label="Monthly income (PKR)"
        value={value.monthly_income}
        onChange={(e) => onChange({ ...value, monthly_income: e.target.value })}
        placeholder="Optional"
      />
      <FormSelect
        label="Education"
        value={value.education_level}
        onChange={(e) => onChange({ ...value, education_level: e.target.value })}
        options={[{ value: '', label: '—' }, ...AID_EDUCATION_LEVELS]}
      />
      <FormInput
        label="City"
        value={value.city}
        onChange={(e) => onChange({ ...value, city: e.target.value })}
      />
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
        <input
          type="checkbox"
          checked={value.is_alive !== false}
          onChange={(e) => onChange({ ...value, is_alive: e.target.checked })}
        />
        Alive
      </label>
    </div>
    <FormTextarea
      label="Address"
      value={value.address}
      onChange={(e) => onChange({ ...value, address: e.target.value })}
      rows={2}
    />
  </div>
);

const cleanPersonPayload = (p) => {
  if (!p?.full_name?.trim()) return null;
  return {
    full_name: p.full_name.trim(),
    cnic: p.cnic || undefined,
    phone: p.phone || undefined,
    gender: p.gender || undefined,
    date_of_birth: p.date_of_birth || undefined,
    marital_status: p.marital_status || undefined,
    occupation: p.occupation || undefined,
    monthly_income: p.monthly_income || undefined,
    education_level: p.education_level || undefined,
    is_alive: p.is_alive !== false,
    address: p.address || undefined,
    city: p.city || undefined,
  };
};

const AidApplicationAdd = () => {
  const navigate = useNavigate();
  const [writerIsSelf, setWriterIsSelf] = useState(true);
  const [beneficiaryMode, setBeneficiaryMode] = useState('new');
  const [writerMode, setWriterMode] = useState('new');
  const [beneficiaryId, setBeneficiaryId] = useState(null);
  const [existingBeneficiary, setExistingBeneficiary] = useState(null);
  const [writerId, setWriterId] = useState(null);
  const [beneficiary, setBeneficiary] = useState({ ...emptyPerson });
  const [writer, setWriter] = useState({ ...emptyPerson });
  const [form, setForm] = useState({
    title: '',
    request_summary: '',
    requested_aid_type: 'ration',
    writer_relation: 'self',
  });
  const [father, setFather] = useState(emptyRelative());
  const [mother, setMother] = useState(emptyRelative());
  const [spouse, setSpouse] = useState(emptyRelative());
  const [guardians, setGuardians] = useState([]);
  const [siblings, setSiblings] = useState([{ ...emptyRelative(), _genderRole: 'brother' }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const beneficiaryGender =
    beneficiaryMode === 'existing'
      ? existingBeneficiary?.gender || ''
      : beneficiary.gender;
  const beneficiaryMarital =
    beneficiaryMode === 'existing'
      ? existingBeneficiary?.marital_status || ''
      : beneficiary.marital_status;

  const isMarried = beneficiaryMarital === 'married';
  const spouseLabel =
    beneficiaryGender === 'male'
      ? 'Wife'
      : beneficiaryGender === 'female'
        ? 'Husband'
        : 'Spouse';
  const spouseDefaultGender =
    beneficiaryGender === 'male'
      ? 'female'
      : beneficiaryGender === 'female'
        ? 'male'
        : '';

  useEffect(() => {
    if (!isMarried) return;
    setSpouse((p) => ({
      ...p,
      gender: p.gender || spouseDefaultGender,
      marital_status: p.marital_status || 'married',
    }));
  }, [isMarried, spouseDefaultGender]);

  useEffect(() => {
    setFather((p) => ({ ...p, gender: p.gender || 'male' }));
    setMother((p) => ({ ...p, gender: p.gender || 'female' }));
  }, []);

  const searchPeople = async (term) => {
    const q = String(term || '').trim();
    if (q.length < 2) return [];
    try {
      const res = await axiosInstance.get('/aid/people', {
        params: { search: q, page: 1, pageSize: 30 },
      });
      return (res.data?.data || []).map((p) => ({
        id: p.id,
        name: p.full_name,
        email: p.cnic || p.phone || '',
        raw: p,
      }));
    } catch {
      return [];
    }
  };

  const buildFamilyMembers = () => {
    const members = [];
    const fatherPayload = cleanPersonPayload(father);
    if (fatherPayload) {
      members.push({ relation_type: 'father', person: fatherPayload });
    }
    const motherPayload = cleanPersonPayload(mother);
    if (motherPayload) {
      members.push({ relation_type: 'mother', person: motherPayload });
    }
    for (const g of guardians) {
      const payload = cleanPersonPayload(g);
      if (payload) members.push({ relation_type: 'guardian', person: payload });
    }
    for (const s of siblings) {
      const payload = cleanPersonPayload(s);
      if (!payload) continue;
      const relation =
        s._genderRole === 'sister' || payload.gender === 'female'
          ? 'sister'
          : s._genderRole === 'brother' || payload.gender === 'male'
            ? 'brother'
            : 'sibling';
      if (!payload.gender && relation === 'sister') payload.gender = 'female';
      if (!payload.gender && relation === 'brother') payload.gender = 'male';
      members.push({ relation_type: relation, person: payload });
    }
    if (isMarried) {
      const spousePayload = cleanPersonPayload(spouse);
      if (spousePayload) {
        if (!spousePayload.gender && spouseDefaultGender) {
          spousePayload.gender = spouseDefaultGender;
        }
        if (!spousePayload.marital_status) spousePayload.marital_status = 'married';
        members.push({ relation_type: 'spouse', person: spousePayload });
      }
    }
    return members;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (isMarried && !spouse.full_name.trim()) {
        throw new Error(`${spouseLabel} details are required for married beneficiaries`);
      }
      const hasParentOrGuardian =
        father.full_name.trim() ||
        mother.full_name.trim() ||
        guardians.some((g) => g.full_name?.trim());
      if (!hasParentOrGuardian) {
        throw new Error('Enter at least one parent or guardian');
      }

      const payload = {
        title: form.title || null,
        request_summary: form.request_summary || null,
        requested_aid_type: form.requested_aid_type,
        writer_relation: writerIsSelf ? 'self' : form.writer_relation,
        family_members: buildFamilyMembers(),
      };

      if (beneficiaryMode === 'existing') {
        if (!beneficiaryId) throw new Error('Select a beneficiary');
        payload.beneficiary_person_id = Number(beneficiaryId);
      } else {
        if (!beneficiary.full_name.trim()) throw new Error('Beneficiary name is required');
        if (!beneficiary.gender) throw new Error('Beneficiary gender is required');
        if (!beneficiary.marital_status) {
          throw new Error('Beneficiary marital status is required');
        }
        payload.beneficiary = {
          ...cleanPersonPayload(beneficiary),
          full_name: beneficiary.full_name.trim(),
        };
      }

      if (writerIsSelf) {
        payload.writer_relation = 'self';
      } else if (writerMode === 'existing') {
        if (!writerId) throw new Error('Select application writer');
        payload.writer_person_id = Number(writerId);
      } else {
        if (!writer.full_name.trim()) throw new Error('Writer name is required');
        payload.writer = cleanPersonPayload(writer);
      }

      const res = await axiosInstance.post('/aid/applications', payload);
      const id = res.data?.data?.id;
      navigate(id ? `/dms/aid/applications/view/${id}` : '/dms/aid/applications/list');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create application');
    } finally {
      setSaving(false);
    }
  };

  const familyHint = useMemo(() => {
    if (isMarried) {
      return `Married beneficiary — collect ${spouseLabel.toLowerCase()}, parents/guardians, and siblings.`;
    }
    return 'Collect parents/guardians and siblings for every beneficiary (married or single).';
  }, [isMarried, spouseLabel]);

  return (
    <>
      <Navbar />
      <div className="form-content">
        <PageHeader
          title="New Aid Application"
          backPath="/dms/aid/applications/list"
          onBackClick={() => navigate('/dms/aid/applications/list')}
          showAdd={false}
        />
        <form className="form-card card" onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}

          <h3 style={{ marginTop: 0 }}>Request</h3>
          <div className="form-grid">
            <FormInput
              label="Title"
              name="title"
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="Short need title"
            />
            <FormSelect
              label="Aid type"
              name="requested_aid_type"
              value={form.requested_aid_type}
              onChange={(e) => setForm((p) => ({ ...p, requested_aid_type: e.target.value }))}
              options={AID_REQUEST_TYPES}
            />
          </div>
          <FormTextarea
            label="Request summary"
            name="request_summary"
            value={form.request_summary}
            onChange={(e) => setForm((p) => ({ ...p, request_summary: e.target.value }))}
            rows={3}
            placeholder="Describe the need…"
          />

          <h3>Beneficiary</h3>
          <label style={{ display: 'flex', gap: 8, marginBottom: 12, fontSize: 14 }}>
            <input
              type="checkbox"
              checked={beneficiaryMode === 'existing'}
              onChange={(e) => {
                setBeneficiaryMode(e.target.checked ? 'existing' : 'new');
                if (!e.target.checked) setExistingBeneficiary(null);
              }}
            />
            Link existing person in system
          </label>
          {beneficiaryMode === 'existing' ? (
            <SearchableDropdown
              label="Search beneficiary"
              placeholder="Name, CNIC, phone…"
              onSearch={searchPeople}
              onSelect={async (item) => {
                setBeneficiaryId(item.id);
                try {
                  const res = await axiosInstance.get(`/aid/people/${item.id}`);
                  setExistingBeneficiary(res.data?.data?.person || item.raw || null);
                } catch {
                  setExistingBeneficiary(item.raw || null);
                }
              }}
              onClear={() => {
                setBeneficiaryId(null);
                setExistingBeneficiary(null);
              }}
              displayKey="name"
              minSearchLength={2}
            />
          ) : (
            <div className="form-grid">
              <FormInput
                label="Full name"
                required
                value={beneficiary.full_name}
                onChange={(e) => setBeneficiary((p) => ({ ...p, full_name: e.target.value }))}
              />
              <FormInput
                label="CNIC (unique)"
                value={beneficiary.cnic}
                onChange={(e) => setBeneficiary((p) => ({ ...p, cnic: e.target.value }))}
                placeholder="Optional but unique if provided"
              />
              <FormInput
                label="Phone"
                value={beneficiary.phone}
                onChange={(e) => setBeneficiary((p) => ({ ...p, phone: e.target.value }))}
              />
              <FormInput
                label="City"
                value={beneficiary.city}
                onChange={(e) => setBeneficiary((p) => ({ ...p, city: e.target.value }))}
              />
              <FormSelect
                label="Gender"
                required
                value={beneficiary.gender}
                onChange={(e) => setBeneficiary((p) => ({ ...p, gender: e.target.value }))}
                options={[{ value: '', label: '—' }, ...AID_GENDERS]}
              />
              <FormSelect
                label="Marital status"
                required
                value={beneficiary.marital_status}
                onChange={(e) =>
                  setBeneficiary((p) => ({ ...p, marital_status: e.target.value }))
                }
                options={[{ value: '', label: '—' }, ...AID_MARITAL_STATUS]}
              />
              <FormInput
                label="Date of birth"
                type="date"
                value={beneficiary.date_of_birth}
                onChange={(e) =>
                  setBeneficiary((p) => ({ ...p, date_of_birth: e.target.value }))
                }
              />
              <FormInput
                label="Profession"
                value={beneficiary.occupation}
                onChange={(e) => setBeneficiary((p) => ({ ...p, occupation: e.target.value }))}
                placeholder="Optional"
              />
              <FormInput
                label="Monthly income (PKR)"
                value={beneficiary.monthly_income}
                onChange={(e) =>
                  setBeneficiary((p) => ({ ...p, monthly_income: e.target.value }))
                }
                placeholder="Optional"
              />
              <FormTextarea
                label="Address"
                value={beneficiary.address}
                onChange={(e) => setBeneficiary((p) => ({ ...p, address: e.target.value }))}
                rows={2}
                placeholder="Full address"
              />
            </div>
          )}

          <div className="aid-family-intake">
            <h3>Family data bank</h3>
            <p className="aid-family-intake__hint">{familyHint}</p>

            {isMarried && (
              <section className="aid-section" style={{ marginBottom: 12 }}>
                <RelativeFields
                  title={`${spouseLabel} (required)`}
                  value={spouse}
                  onChange={setSpouse}
                  genderHint={spouseLabel}
                />
              </section>
            )}

            <section className="aid-section" style={{ marginBottom: 12 }}>
              <h4 style={{ marginTop: 0 }}>Parents (enter at least one parent or guardian)</h4>
              <RelativeFields title="Father" value={father} onChange={setFather} />
              <div style={{ height: 12 }} />
              <RelativeFields title="Mother" value={mother} onChange={setMother} />
            </section>

            <section className="aid-section" style={{ marginBottom: 12 }}>
              <div className="aid-family-section__head">
                <h4 style={{ margin: 0 }}>Guardians</h4>
                <button
                  type="button"
                  className="secondary-btn"
                  style={{ padding: '4px 10px', fontSize: 12 }}
                  onClick={() => setGuardians((p) => [...p, emptyRelative()])}
                >
                  + Add guardian
                </button>
              </div>
              {guardians.length === 0 ? (
                <p style={{ color: '#94a3b8', margin: 0, fontSize: 13 }}>
                  Optional — add if parents are absent / deceased.
                </p>
              ) : (
                guardians.map((g, idx) => (
                  <div key={`g-${idx}`} style={{ marginTop: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <strong style={{ fontSize: 13 }}>Guardian {idx + 1}</strong>
                      <button
                        type="button"
                        className="secondary-btn"
                        style={{ padding: '2px 8px', fontSize: 12 }}
                        onClick={() =>
                          setGuardians((list) => list.filter((_, i) => i !== idx))
                        }
                      >
                        Remove
                      </button>
                    </div>
                    <RelativeFields
                      value={g}
                      onChange={(next) =>
                        setGuardians((list) =>
                          list.map((row, i) => (i === idx ? next : row)),
                        )
                      }
                    />
                  </div>
                ))
              )}
            </section>

            <section className="aid-section" style={{ marginBottom: 12 }}>
              <div className="aid-family-section__head">
                <h4 style={{ margin: 0 }}>Siblings (brothers / sisters)</h4>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    type="button"
                    className="secondary-btn"
                    style={{ padding: '4px 10px', fontSize: 12 }}
                    onClick={() =>
                      setSiblings((p) => [
                        ...p,
                        { ...emptyRelative(), gender: 'male', _genderRole: 'brother' },
                      ])
                    }
                  >
                    + Brother
                  </button>
                  <button
                    type="button"
                    className="secondary-btn"
                    style={{ padding: '4px 10px', fontSize: 12 }}
                    onClick={() =>
                      setSiblings((p) => [
                        ...p,
                        { ...emptyRelative(), gender: 'female', _genderRole: 'sister' },
                      ])
                    }
                  >
                    + Sister
                  </button>
                </div>
              </div>
              {siblings.map((s, idx) => (
                <div key={`s-${idx}`} style={{ marginTop: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <FormSelect
                      label="Sibling type"
                      value={s._genderRole || 'brother'}
                      onChange={(e) => {
                        const role = e.target.value;
                        setSiblings((list) =>
                          list.map((row, i) =>
                            i === idx
                              ? {
                                  ...row,
                                  _genderRole: role,
                                  gender:
                                    role === 'sister'
                                      ? 'female'
                                      : role === 'brother'
                                        ? 'male'
                                        : row.gender,
                                }
                              : row,
                          ),
                        );
                      }}
                      options={[
                        { value: 'brother', label: 'Brother' },
                        { value: 'sister', label: 'Sister' },
                        { value: 'sibling', label: 'Sibling' },
                      ]}
                    />
                    <button
                      type="button"
                      className="secondary-btn"
                      style={{ padding: '2px 8px', fontSize: 12, alignSelf: 'end' }}
                      onClick={() =>
                        setSiblings((list) => list.filter((_, i) => i !== idx))
                      }
                    >
                      Remove
                    </button>
                  </div>
                  <RelativeFields
                    value={s}
                    onChange={(next) =>
                      setSiblings((list) =>
                        list.map((row, i) =>
                          i === idx ? { ...next, _genderRole: row._genderRole } : row,
                        ),
                      )
                    }
                  />
                </div>
              ))}
            </section>
          </div>

          <h3>Application writer</h3>
          <label style={{ display: 'flex', gap: 8, marginBottom: 12, fontSize: 14 }}>
            <input
              type="checkbox"
              checked={writerIsSelf}
              onChange={(e) => {
                setWriterIsSelf(e.target.checked);
                if (e.target.checked) setForm((p) => ({ ...p, writer_relation: 'self' }));
              }}
            />
            Beneficiary is also the writer
          </label>
          {!writerIsSelf && (
            <>
              <FormSelect
                label="Writer relation to beneficiary"
                value={form.writer_relation}
                onChange={(e) => setForm((p) => ({ ...p, writer_relation: e.target.value }))}
                options={AID_WRITER_RELATIONS.filter((r) => r.value !== 'self')}
              />
              <label style={{ display: 'flex', gap: 8, margin: '12px 0', fontSize: 14 }}>
                <input
                  type="checkbox"
                  checked={writerMode === 'existing'}
                  onChange={(e) => setWriterMode(e.target.checked ? 'existing' : 'new')}
                />
                Link existing writer
              </label>
              {writerMode === 'existing' ? (
                <SearchableDropdown
                  label="Search writer"
                  placeholder="Name, CNIC…"
                  onSearch={searchPeople}
                  onSelect={(item) => setWriterId(item.id)}
                  onClear={() => setWriterId(null)}
                  displayKey="name"
                  minSearchLength={2}
                />
              ) : (
                <RelativeFields title="Writer" value={writer} onChange={setWriter} />
              )}
            </>
          )}

          <div className="form-actions" style={{ marginTop: 20 }}>
            <PrimaryButton type="submit" loading={saving} loadingText="Saving…">
              Submit application
            </PrimaryButton>
          </div>
        </form>
      </div>
    </>
  );
};

export default AidApplicationAdd;
