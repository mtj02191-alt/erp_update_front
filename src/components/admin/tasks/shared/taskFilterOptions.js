// Keep in sync with ddr_server/src/users/user.entity.ts → Department enum
export const TASK_DEPARTMENT_OPTIONS = [
  'store',
  'procurements',
  'program',
  'accounts_and_finance',
  'admin',
  'fund_raising',
  'it',
  'hr',
  'marketing',
  'audio_video',
  'meal',
  'health',
  'executive_office',
  'ceo',
  'internal_audit',
  'crd',
  'aas_lab',
].map((dept) => ({
  value: dept,
  label: dept
    .split('_')
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ''))
    .join(' '),
}));

export const TASK_PROJECT_PROGRAM_OPTIONS = [
  'MTJ Foundation',
  'Al-Hassanain College',
  'Al-Hassanain School',
  'Al-Hassanain Mudrasa',
  'Aas Lab',
  'Aas Clinics',
  'General',
  'Health',
  'Education',
  'Clean Water',
  'Apna Ghar',
  'Disaster Relief',
  'KASB Skill Development',
  'Seeds of Change',
  'Qurbani Barai Mustehqeen',
  'Aaslab',
  'Community Service',
].map((name) => ({ value: name, label: name }));
