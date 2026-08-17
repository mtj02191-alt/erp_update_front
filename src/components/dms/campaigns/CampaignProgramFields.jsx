import React, { useEffect, useMemo, useState } from 'react';
import axiosInstance from '../../../utils/axios';
import FormSelect from '../../common/FormSelect';

export const parseOptionalCampaignId = (value) => {
  if (value === '' || value == null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const CampaignProgramFields = ({
  programId = '',
  subProgramId = '',
  onProgramChange,
  onSubProgramChange,
}) => {
  const [programs, setPrograms] = useState([]);
  const [subprograms, setSubprograms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOptions = async () => {
      try {
        setLoading(true);
        const [programsRes, subprogramsRes] = await Promise.all([
          axiosInstance.get('/program/programs', {
            params: { page: 1, pageSize: 1000, active: 'true' },
          }),
          axiosInstance.get('/program/subprograms', {
            params: { page: 1, pageSize: 1000, active: 'true' },
          }),
        ]);

        if (programsRes.data?.success) {
          setPrograms(programsRes.data.data || []);
        }
        if (subprogramsRes.data?.success) {
          setSubprograms(subprogramsRes.data.data || []);
        }
      } catch (err) {
        console.error('Failed to load program options:', err);
      } finally {
        setLoading(false);
      }
    };

    loadOptions();
  }, []);

  const programOptions = useMemo(
    () =>
      programs.map((program) => ({
        value: String(program.id),
        label: program.label || program.key,
      })),
    [programs],
  );

  const subProgramOptions = useMemo(() => {
    if (!programId) return [];
    return subprograms
      .filter((sub) => String(sub.program_id) === String(programId))
      .map((sub) => ({
        value: String(sub.id),
        label: sub.label || sub.key,
      }));
  }, [subprograms, programId]);

  const handleProgramChange = (e) => {
    const nextProgramId = e.target.value;
    onProgramChange(nextProgramId);
    if (
      subProgramId &&
      !subprograms.some(
        (sub) =>
          String(sub.id) === String(subProgramId) &&
          String(sub.program_id) === String(nextProgramId),
      )
    ) {
      onSubProgramChange('');
    }
  };

  return (
    <div className="form-section">
      <h3 className="form-section-heading">Program (optional)</h3>
      <div className="form-grid-2">
        <FormSelect
          label="Program"
          name="program_id"
          value={programId}
          onChange={handleProgramChange}
          options={programOptions}
          showDefaultOption
          defaultOptionText={loading ? 'Loading programs...' : 'No program'}
          disabled={loading}
        />
        <FormSelect
          label="Subprogram"
          name="sub_program_id"
          value={subProgramId}
          onChange={(e) => onSubProgramChange(e.target.value)}
          options={subProgramOptions}
          showDefaultOption
          defaultOptionText={
            !programId
              ? 'Select a program first'
              : subProgramOptions.length
                ? 'No subprogram'
                : 'No subprograms for this program'
          }
          disabled={loading || !programId}
        />
      </div>
    </div>
  );
};

export default CampaignProgramFields;
