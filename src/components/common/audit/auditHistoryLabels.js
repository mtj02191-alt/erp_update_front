/** Shared labels for audit timelines (donations now; donation box later). */

export const DONATION_AUDIT_ACTION_LABELS = {
  updated: 'Updated',
  status_changed: 'Status changed',
  note_updated: 'Note updated',
  deleted: 'Deleted',
};

export const DONATION_AUDIT_SOURCE_LABELS = {
  staff_ui: 'Staff',
  gateway_payfast: 'PayFast',
  gateway_meezan: 'Meezan',
  gateway_alfalah: 'Alfalah',
  gateway_stripe: 'Stripe',
  public_site: 'Public site',
  system: 'System',
};

export const DONATION_AUDIT_FIELD_LABELS = {
  amount: 'Amount',
  paid_amount: 'Paid amount',
  currency: 'Currency',
  date: 'Date',
  donation_type: 'Donation type',
  donation_method: 'Payment method',
  donation_source: 'Source',
  status: 'Status',
  country: 'Country',
  city: 'City',
  project_id: 'Project ID',
  project_name: 'Project name',
  campaign_id: 'Campaign',
  sub_program_id: 'Sub-program',
  event_id: 'Event',
  cheque_number: 'Cheque number',
  bank_name: 'Bank name',
  bank: 'Bank',
  transaction_id: 'Transaction ID',
  ref: 'Reference',
  on_behalf_names: 'On behalf names',
  note: 'Note',
  noted_by: 'Noted by (user id)',
  record: 'Record',
};

export const formatAuditActor = (performedBy) => {
  if (!performedBy) return 'System';
  const name = [performedBy.first_name, performedBy.last_name]
    .filter(Boolean)
    .join(' ')
    .trim();
  if (name) return name;
  return performedBy.email || `User #${performedBy.id}`;
};

/** Donation box collection audit */
export const DONATION_BOX_DONATION_AUDIT_ACTION_LABELS = {
  updated: 'Updated',
  status_changed: 'Status changed',
  archived: 'Archived',
};

export const DONATION_BOX_DONATION_AUDIT_SOURCE_LABELS = {
  staff_ui: 'Staff',
  system: 'System',
};

export const DONOR_AUDIT_ACTION_LABELS = {
  updated: 'Updated',
  archived: 'Archived',
};

export const DONOR_AUDIT_SOURCE_LABELS = {
  staff_ui: 'Staff',
  system: 'System',
};

export const DONOR_AUDIT_FIELD_LABELS = {
  donor_type: 'Donor type',
  email: 'Email',
  phone: 'Phone',
  cnic: 'CNIC',
  source: 'Source',
  address: 'Address',
  city: 'City',
  country: 'Country',
  postal_code: 'Postal code',
  notes: 'Notes',
  name: 'Name',
  first_name: 'First name',
  last_name: 'Last name',
  company_name: 'Company name',
  company_registration: 'Company registration',
  contact_person: 'Contact person',
  designation: 'Designation',
  company_address: 'Company address',
  company_phone: 'Company phone',
  company_email: 'Company email',
  is_active: 'Active',
  is_archived: 'Archived',
  recurring: 'Recurring',
  multi_time_donor: 'Multi-time donor',
  notification_subscription: 'Notifications',
  assigned_to_user_id: 'Assigned to (user id)',
  referrer_user_id: 'Referred by (user id)',
};

export const DONATION_BOX_AUDIT_ACTION_LABELS = {
  updated: 'Updated',
  status_changed: 'Status changed',
  archived: 'Archived',
  shop_relocated: 'Relocated to new shop',
};

export const DONATION_BOX_AUDIT_SOURCE_LABELS = {
  staff_ui: 'Staff',
  system: 'System',
};

export const DONATION_BOX_AUDIT_FIELD_LABELS = {
  key_no: 'Key no',
  route_id: 'Route',
  city_id: 'City',
  shop_name: 'Shop name',
  shopkeeper: 'Shopkeeper',
  cell_no: 'Cell no',
  landmark_marketplace: 'Landmark',
  box_type: 'Box type',
  status: 'Status',
  frequency: 'Frequency',
  active_since: 'Active since',
  last_collection_date: 'Last collection',
  total_collected: 'Total collected',
  collection_count: 'Collection count',
  notes: 'Notes',
  is_active: 'Active',
  is_archived: 'Archived',
  assigned_user_ids: 'Assigned users',
};

export const DONATION_BOX_DONATION_AUDIT_FIELD_LABELS = {
  donation_box_id: 'Donation box',
  collection_amount: 'Collection amount',
  collection_date: 'Collection date',
  collected_by_id: 'Collected by (user id)',
  collector_name: 'Collector name',
  status: 'Status',
  verified_by_id: 'Verified by (user id)',
  verified_at: 'Verified at',
  deposit_date: 'Deposit date',
  bank_deposit_slip_no: 'Bank deposit slip',
  payment_method: 'Payment method',
  cheque_number: 'Cheque number',
  bank_name: 'Bank name',
  bank_account_no: 'Bank account no',
  notes: 'Notes',
  discrepancy_notes: 'Discrepancy notes',
  photo_urls: 'Photos',
  receipt_number: 'Receipt number',
  is_archived: 'Archived',
};

export const formatAuditValue = (value) => {
  if (value === null || value === undefined || value === '') return '—';
  return String(value);
};
