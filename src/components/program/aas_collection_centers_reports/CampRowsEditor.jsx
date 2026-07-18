import React from 'react';
import FormInput from '../../common/FormInput';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

export default function CampRowsEditor({ rows, onChange }) {
  const add = () => onChange([...rows, { camp_name: '', patients: '' }]);
  const remove = (i) => onChange(rows.filter((_, j) => j !== i));
  const setCell = (i, key, v) => {
    const next = rows.map((r, j) => (j === i ? { ...r, [key]: v } : r));
    onChange(next);
  };

  return (
    <div style={{ gridColumn: '1 / -1' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <strong>Total patient (camp-wise)</strong>
        <button type="button" className="primary_btn" style={{ padding: '0.35rem 0.75rem' }} onClick={add}>
          <FiPlus style={{ verticalAlign: 'middle', marginRight: 4 }} />
          Camp row
        </button>
      </div>
      {rows.map((r, i) => (
        <div key={i} className="form-grid" style={{ marginBottom: '0.5rem', alignItems: 'end' }}>
          <FormInput
            name={`camp_${i}`}
            label="Camp name"
            value={r.camp_name}
            onChange={(e) => setCell(i, 'camp_name', e.target.value)}
          />
          <FormInput
            name={`patients_${i}`}
            label="Patients"
            type="number"
            min={0}
            value={String(r.patients)}
            onChange={(e) => setCell(i, 'patients', e.target.value)}
          />
          <button type="button" className="secondary_btn" onClick={() => remove(i)} title="Remove row">
            <FiTrash2 />
          </button>
        </div>
      ))}
    </div>
  );
}
