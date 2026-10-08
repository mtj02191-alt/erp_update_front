export const ORGANIZATION_OPTIONS = [
  { value: 'mtj_foundation', label: 'MTJ Foundation' },
  { value: 'aslab', label: 'Aslab' },
  { value: 'education_system', label: 'Al Hasanain College' },
];

export const COMPLAINANT_TYPE_OPTIONS = [
  { value: 'employee', label: 'Employee' },
  { value: 'visitor', label: 'Visitor' },
];

export const DEPARTMENT_OPTIONS = [
  { value: 'hr', label: 'Human Resources (HR)' },
  { value: 'finance_accounts', label: 'Finance / Accounts' },
  { value: 'it', label: 'IT' },
  { value: 'admin', label: 'Admin' },
  { value: 'operations', label: 'Operations' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'procurement', label: 'Procurement / Purchasing' },
  { value: 'legal_compliance', label: 'Legal / Compliance' },
  { value: 'internal_audit', label: 'Internal Audit' },
  { value: 'audio_video', label: 'Audio Video' },
  { value: 'customer_service', label: 'Customer Service' },
  { value: 'other', label: 'Other' },
  { value: 'unknown', label: 'Unknown' },
];

export const PRIORITY_OPTIONS = [
  { value: 'critical_high', label: 'Critical / High (نہایت اہم / اعلیٰ)' },
  { value: 'critical', label: 'Critical (نہایت اہم)' },
  { value: 'high', label: 'High (اعلیٰ)' },
  { value: 'medium_high', label: 'Medium / High (درمیانہ / اعلیٰ)' },
  { value: 'medium', label: 'Medium (درمیانہ)' },
  { value: 'high_critical', label: 'High / Critical (اعلیٰ / نہایت اہم)' },
  { value: 'low_medium', label: 'Low / Medium (کم / درمیانہ)' },
];

export const CATEGORY_OPTIONS = [
  {
    value: 'harassment_discrimination',
    label: 'Harassment and Discrimination (ہراسانی اور امتیازی سلوک)',
    priority: 'critical_high',
  },
  {
    value: 'ethics_fraud_corruption',
    label: 'Ethics, Fraud and Corruption Reporting (اخلاقیات، فراڈ اور بدعنوانی کی اطلاع دینا)',
    priority: 'critical',
  },
  {
    value: 'abuse_of_authority',
    label: 'Abuse of Authority / Leadership Misconduct (اختیارات کا غلط استعمال / قیادت کی بدسلوکی)',
    priority: 'high',
  },
  {
    value: 'unfair_employment',
    label: 'Unfair Employment Practices (غیر منصفانہ ملازمت کے طریقے)',
    priority: 'medium_high',
  },
  {
    value: 'compensation_benefits_payroll',
    label: 'Compensation, Benefits and Payroll (معاوضہ، مراعات اور پے رول)',
    priority: 'medium',
  },
  {
    value: 'workplace_safety_health',
    label: 'Workplace Safety, Health and Environment (کام کی جگہ کی حفاظت، صحت اور ماحول)',
    priority: 'high_critical',
  },
  {
    value: 'working_conditions_facilities',
    label: 'Working Conditions and Facilities (کام کے حالات اور سہولیات)',
    priority: 'low_medium',
  },
  {
    value: 'policy_compliance',
    label: 'Policy and Compliance Violations (پالیسی اور تعمیل کی خلاف ورزیاں)',
    priority: 'high',
  },
  {
    value: 'it_data_cybersecurity',
    label: 'IT, Data and Cyber Security (آئی ٹی، ڈیٹا اور سائبر سیکیورٹی)',
    priority: 'high_critical',
  },
  {
    value: 'retaliation_victimization',
    label: 'Retaliation and Victimization (انتقامی کارروائی اور شکار بنانا)',
    priority: 'critical_high',
  },
  {
    value: 'employee_relations',
    label: 'Interpersonal / Employee Relations (باہمی تعلقات / ملازمین کے تعلقات)',
    priority: 'low_medium',
  },
  {
    value: 'other_general',
    label: 'Other / General (دیگر / عمومی)',
    priority: 'medium',
  },
];

export const STATUS_OPTIONS = [
  { value: 'submitted', label: 'Submitted' },
  { value: 'under_review', label: 'Under review' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];

export const ASLAB_BRANCH_OPTIONS = [
  { value: 'lahore', label: 'Lahore' },
  { value: 'multan', label: 'Multan' },
  { value: 'bahawalpur', label: 'Bahawalpur' },
  { value: 'rahim_yar_khan', label: 'Rahim Yar Khan' },
  { value: 'sahiwal', label: 'Sahiwal' },
  { value: 'faisalabad', label: 'Faisalabad' },
  { value: 'sargodha', label: 'Sargodha' },
  { value: 'gujranwala', label: 'Gujranwala' },
  { value: 'sialkot', label: 'Sialkot' },
  { value: 'rawalpindi', label: 'Rawalpindi' },
  { value: 'islamabad', label: 'Islamabad' },
  { value: 'other', label: 'Other' },
];

export const labelFor = (options, value) => {
  if (!value) return '-';
  const hit = options.find((o) => o.value === value);
  return hit?.label || String(value).replace(/_/g, ' ');
};

export const priorityForCategory = (categoryValue) => {
  const hit = CATEGORY_OPTIONS.find((c) => c.value === categoryValue);
  return hit?.priority || '';
};
