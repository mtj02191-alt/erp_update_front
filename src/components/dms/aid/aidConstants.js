export const AID_STATUS_OPTIONS = [
  { value: 'submitted', label: 'Submitted' },
  { value: 'under_review', label: 'Under review' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'ceo_approval_required', label: 'CEO approval required' },
  { value: 'successful', label: 'Successful' },
  { value: 'delivered', label: 'Delivered' },
];

export const AID_REQUEST_TYPES = [
  { value: 'cash', label: 'Cash' },
  { value: 'ration', label: 'Ration' },
  { value: 'medical', label: 'Medical' },
  { value: 'education', label: 'Education' },
  { value: 'other', label: 'Other' },
];

export const AID_WRITER_RELATIONS = [
  { value: 'self', label: 'Self (beneficiary)' },
  { value: 'father', label: 'Father' },
  { value: 'mother', label: 'Mother' },
  { value: 'spouse', label: 'Spouse' },
  { value: 'guardian', label: 'Guardian' },
  { value: 'relative', label: 'Relative' },
  { value: 'other', label: 'Other' },
];

export const AID_MARITAL_STATUS = [
  { value: 'single', label: 'Single' },
  { value: 'married', label: 'Married' },
  { value: 'widowed', label: 'Widowed' },
  { value: 'divorced', label: 'Divorced' },
  { value: 'separated', label: 'Separated' },
];

export const AID_EDUCATION_LEVELS = [
  { value: 'none', label: 'None / illiterate' },
  { value: 'primary', label: 'Primary' },
  { value: 'middle', label: 'Middle' },
  { value: 'matric', label: 'Matric' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'bachelors', label: "Bachelor's" },
  { value: 'masters', label: "Master's+" },
  { value: 'religious', label: 'Religious education' },
  { value: 'other', label: 'Other' },
];

export const AID_KINSHIP_TYPES = [
  { value: 'father', label: 'Father' },
  { value: 'mother', label: 'Mother' },
  { value: 'spouse', label: 'Spouse' },
  { value: 'son', label: 'Son' },
  { value: 'daughter', label: 'Daughter' },
  { value: 'child', label: 'Child' },
  { value: 'brother', label: 'Brother' },
  { value: 'sister', label: 'Sister' },
  { value: 'sibling', label: 'Sibling' },
  { value: 'uncle', label: 'Uncle' },
  { value: 'aunt', label: 'Aunt' },
  { value: 'cousin', label: 'Cousin' },
  { value: 'grandfather', label: 'Grandfather' },
  { value: 'grandmother', label: 'Grandmother' },
  { value: 'grandchild', label: 'Grandchild' },
  { value: 'guardian', label: 'Guardian' },
  { value: 'custody_holder', label: 'Custody holder' },
  { value: 'in_law', label: 'In-law' },
  { value: 'other', label: 'Other' },
];

/** Quick-add family tree sections on person view */
export const AID_FAMILY_SECTIONS = [
  {
    key: 'parents',
    title: 'Parents',
    empty: 'No parents recorded.',
    relations: [
      { value: 'father', label: 'Father' },
      { value: 'mother', label: 'Mother' },
    ],
    defaultRelation: 'father',
  },
  {
    key: 'spouse',
    title: 'Spouse',
    empty: 'No spouse recorded.',
    relations: [{ value: 'spouse', label: 'Spouse' }],
    defaultRelation: 'spouse',
  },
  {
    key: 'children',
    title: 'Children',
    empty: 'No children recorded.',
    relations: [
      { value: 'son', label: 'Son' },
      { value: 'daughter', label: 'Daughter' },
      { value: 'child', label: 'Child' },
    ],
    defaultRelation: 'son',
  },
  {
    key: 'brothers',
    title: 'Brothers',
    empty: 'No brothers recorded.',
    relations: [{ value: 'brother', label: 'Brother' }],
    defaultRelation: 'brother',
  },
  {
    key: 'sisters',
    title: 'Sisters',
    empty: 'No sisters recorded.',
    relations: [{ value: 'sister', label: 'Sister' }],
    defaultRelation: 'sister',
  },
  {
    key: 'grandparents',
    title: 'Grandparents',
    empty: 'No grandparents recorded.',
    relations: [
      { value: 'grandfather', label: 'Grandfather' },
      { value: 'grandmother', label: 'Grandmother' },
    ],
    defaultRelation: 'grandfather',
  },
  {
    key: 'grandchildren',
    title: 'Grandchildren',
    empty: 'No grandchildren recorded.',
    relations: [{ value: 'grandchild', label: 'Grandchild' }],
    defaultRelation: 'grandchild',
  },
  {
    key: 'extended',
    title: 'Extended / other',
    empty: 'No extended relatives recorded.',
    relations: [
      { value: 'uncle', label: 'Uncle' },
      { value: 'aunt', label: 'Aunt' },
      { value: 'cousin', label: 'Cousin' },
      { value: 'guardian', label: 'Guardian' },
      { value: 'custody_holder', label: 'Custody holder' },
      { value: 'in_law', label: 'In-law' },
      { value: 'other', label: 'Other' },
    ],
    defaultRelation: 'uncle',
  },
];

export const AID_DELIVERY_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'partial', label: 'Partial' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

export const AID_CEO_OPTIONS = [
  { value: 'approved', label: 'Approve' },
  { value: 'rejected', label: 'Reject' },
];

export const AID_GENDERS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];

export const AID_ATTACHMENT_CONTEXTS = [
  { value: 'profile', label: 'Profile (CNIC, bill, etc.)' },
  { value: 'verification', label: 'Verification' },
  { value: 'delivery', label: 'Delivery / handover' },
];

export const AID_VERIFICATION_CHECKLIST = [
  { key: 'home_visited', label: 'Home / field visit completed', required: true },
  {
    key: 'identity_confirmed',
    label: 'Beneficiary identity confirmed (name / CNIC)',
    required: true,
  },
  {
    key: 'address_confirmed',
    label: 'Residence / address confirmed',
    required: true,
  },
  {
    key: 'family_confirmed',
    label: 'Family composition confirmed (parents / spouse / kids / siblings)',
    required: true,
  },
  { key: 'need_verified', label: 'Aid need verified as genuine', required: true },
  {
    key: 'livelihood_reviewed',
    label: 'Profession / monthly income situation reviewed',
    required: true,
  },
  {
    key: 'duplicates_reviewed',
    label: 'Duplicate / prior-aid flags reviewed',
    required: true,
  },
  {
    key: 'eligible_recommended',
    label: 'Case recommended for CEO approval',
    required: true,
  },
];

export function formatAidStatus(status) {
  return AID_STATUS_OPTIONS.find((o) => o.value === status)?.label || status || '—';
}

export function formatMaritalStatus(status) {
  return AID_MARITAL_STATUS.find((o) => o.value === status)?.label || status || '—';
}

export function formatEducation(level) {
  return AID_EDUCATION_LEVELS.find((o) => o.value === level)?.label || level || '—';
}

export function aidStatusTone(status) {
  switch (status) {
    case 'successful':
    case 'delivered':
      return 'success';
    case 'rejected':
      return 'danger';
    case 'ceo_approval_required':
      return 'warn';
    case 'under_review':
      return 'info';
    default:
      return 'muted';
  }
}

export function personAge(dob) {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age -= 1;
  return age >= 0 ? age : null;
}
