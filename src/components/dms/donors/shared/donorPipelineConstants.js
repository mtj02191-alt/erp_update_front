export const DONOR_PIPELINE_STAGES = [
  'lead',
  'prospect',
  'cultivation',
  'ask',
  'pledge',
  'donor',
  'major_donor',
  'lapsed_donor',
  'stewardship',
];

export const DONOR_PIPELINE_STAGE_LABELS = {
  lead: 'Lead',
  prospect: 'Prospect',
  cultivation: 'Cultivation',
  ask: 'Ask',
  pledge: 'Pledge',
  donor: 'Donor',
  major_donor: 'Major Donor',
  lapsed_donor: 'Lapsed Donor',
  stewardship: 'Stewardship',
};

export const DONOR_PIPELINE_STAGE_HINTS = {
  lead: 'Possible donor',
  prospect: 'Interested in donating',
  cultivation: 'Building relationship',
  ask: 'Donation request made',
  pledge: 'Donation promised',
  donor: 'Donation completed',
  major_donor: 'High-value donor',
  lapsed_donor: 'No donation for a long time',
  stewardship: 'Post-donation relationship care',
};

export const DONOR_PIPELINE_FILTER_OPTIONS = [
  { label: 'All Stages', value: '' },
  ...DONOR_PIPELINE_STAGES.map((value) => ({
    label: DONOR_PIPELINE_STAGE_LABELS[value],
    value,
  })),
];

export function resolveDonorPipelineStage(stage) {
  if (stage && DONOR_PIPELINE_STAGES.includes(stage)) return stage;
  return 'donor';
}

export function formatPipelineStage(stage) {
  const key = resolveDonorPipelineStage(stage);
  return DONOR_PIPELINE_STAGE_LABELS[key] || key;
}
