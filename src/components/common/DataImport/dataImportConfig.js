/**
 * Registry of CSV import templates per backend entity_name.
 * Add new modules here when a handler is registered in data_import service.
 */
export const ENTITY_IMPORT_CONFIG = {
  donors: {
    label: 'Donors',
    templateFilename: 'donors-import-template',
    description:
      'Import individual or CSR donors. Required: donor_type, email, phone. For individual rows include name; for csr include company_name and contact_person.',
    headers: [
      'donor_type',
      'email',
      'phone',
      'name',
      'first_name',
      'last_name',
      'cnic',
      'company_name',
      'company_registration',
      'contact_person',
      'designation',
      'company_address',
      'company_phone',
      'company_email',
      'address',
      'city',
      'country',
      'postal_code',
      'source',
      'notes',
      'is_active',
      'notification_subscription',
      'recurring',
      'multi_time_donor',
      'assigned_to_user_id',
      'referrer_user_id',
      'password',
    ],
    sampleRow: {
      donor_type: 'individual',
      email: 'donor@example.com',
      phone: '03001234567',
      name: 'Sample Donor',
      first_name: 'Sample',
      last_name: 'Donor',
      city: 'Lahore',
      country: 'Pakistan',
      source: 'import',
      is_active: 'true',
      notification_subscription: 'true',
      recurring: 'false',
      multi_time_donor: 'false',
    },
  },
};

export const getImportConfig = (entityName) => {
  const key = String(entityName || '').trim().toLowerCase();
  return ENTITY_IMPORT_CONFIG[key] || null;
};
