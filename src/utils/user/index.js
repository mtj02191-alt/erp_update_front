// Department-specific roles mapping
export const departmentRoles = {
    store: [
      { value: 'user', label: 'User' },
      { value: 'store_keeper', label: 'Keeper' },
      { value: 'inventory_officer', label: 'Officer' },
      { value: 'assistant_manager', label: 'Assistant Manager' },
      { value: 'manager', label: 'Manager' }
    ],
    procurements: [
      { value: 'user', label: 'User' },
      { value: 'procurement_officer', label: 'Officer' },
      { value: 'vendor_coordinator', label: 'Coordinator' },
      { value: 'assistant_manager', label: 'Assistant Manager' },
      { value: 'manager', label: 'Manager' }
    ],
    accounts_and_finance: [
      { value: 'user', label: 'User' },
      { value: 'accountant', label: 'Accountant' },
      { value: 'accounts_officer', label: 'Accounts Officer' },
      { value: 'finance_analyst', label: 'Analyst' },
      { value: 'assistant_manager', label: 'Assistant Manager' },
      { value: 'manager', label: 'Manager' }
    ],
    program: [
      { value: 'user', label: 'User' },
      { value: 'program_coordinator', label: 'Coordinator' },
      { value: 'program_officer', label: 'Officer' },
      { value: 'assistant_manager', label: 'Assistant Manager' },
      { value: 'manager', label: 'Manager' }
    ],
    it: [
      { value: 'user', label: 'User' },
      { value: 'developer', label: 'Developer' },
      { value: 'system_admin', label: 'Admin' },
      { value: 'it_support', label: 'Support' },
      { value: 'assistant_manager', label: 'Assistant Manager' },
      { value: 'manager', label: 'Manager' }
    ],
    marketing: [
      { value: 'user', label: 'User' },
      { value: 'content_creator', label: 'Content Creator' },
      { value: 'social_media_manager', label: 'Manager' },
      { value: 'marketing_officer', label: 'Officer' },
      { value: 'assistant_manager', label: 'Assistant Manager' },
      { value: 'manager', label: 'Manager' }
    ],
    audio_video: [
      { value: 'user', label: 'User' },
      { value: 'video_editor', label: 'Video Editor' },
      { value: 'camera_operator', label: 'Camera Operator' },
      { value: 'av_technician', label: 'AV Technician' },
      { value: 'assistant_manager', label: 'Assistant Manager' },
      { value: 'manager', label: 'Manager' }
    ],
    fund_raising: [
      { value: 'user', label: 'User' },
      { value: 'fundraiser', label: 'Fundraiser' },
      { value: 'donor_relations_officer', label: 'Donor Relations Officer' },
      { value: 'coordinator', label: 'Coordinator' },
      { value: 'assistant_manager', label: 'Assistant Manager' },
      { value: 'manager', label: 'Manager' },
      { value: 'csr', label: 'CSR' }, // Donation Collector
      { value: 'reconcile_agent', label: 'Reconcile Agent' }, // bank data reconcile agent
      { value: 'back_office_clerk', label: 'Back Office Clerk' }, // person responsible for registering donors and handling back office clerk
      { value: 'call_center_agent', label: 'Call Center Agent' },
      { value: 'asst_crd_officer', label: 'Asst. CRD Officer' },
      { value: 'crd_officer', label: 'CRD Officer' },
      { value: 'internee', label: 'Internee' },
    ]
  };

  export const departments = [
    { value: 'admin', label: 'Admin' },
    { value: 'store', label: 'Store' },
    { value: 'procurements', label: 'Procurement' },
    { value: 'accounts_and_finance', label: 'Accounts & Finance' },
    { value: 'program', label: 'Program' },
    { value: 'it', label: 'IT' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'audio_video', label: 'Audio Video' },
    { value: 'fund_raising', label: 'Fund Raising' },
    { value: 'hr', label: 'HR' },
    { value: 'meal', label: 'Meal' },
    { value: 'health', label: 'Health' },
    { value: 'executive_office', label: 'Executive Office'},
    { value: 'ceo', label: 'CEO'},
    { value: 'internal_audit', label: 'Internal Audit'},
    { value: 'crd', label: 'CRD'},
    { value: 'aas_lab', label: 'Aas Lab'},
  ];
  
  export const bloodGroups = [
    { value: 'A+', label: 'A+' },
    { value: 'A-', label: 'A-' },
    { value: 'B+', label: 'B+' },
    { value: 'B-', label: 'B-' },
    { value: 'AB+', label: 'AB+' },
    { value: 'AB-', label: 'AB-' },
    { value: 'O+', label: 'O+' },
    { value: 'O-', label: 'O-' }
  ];
  
  // Default roles available for all departments
  export const defaultRoles = [
    { value: 'user', label: 'User' },
    { value: 'assistant_manager', label: 'Assistant Manager' },
    { value: 'manager', label: 'Manager' },
    { value: 'admin', label: 'Admin' },
    { value: 'super_admin', label: 'Super Admin' },
    { value: 'officer', label: 'Officer' },
    { value: 'coordinator', label: 'Coordinator' },
    { value: 'support', label: 'Support' },
    { value: 'analyst', label: 'Analyst' },
    { value: 'developer', label: 'Developer' },
    { value: 'team_lead', label: 'Team Lead' },
    { value: 'staff', label: 'Staff' }, 
    { value: 'field_officer', label: 'Field Officer' },
    { value: 'volunteer', label: 'Volunteer' },
    { value: 'dept_head', label: 'Dept Head' },
    { value: 'asst_crd_officer', label: 'Asst. CRD Officer' },
    { value: 'crd_officer', label: 'CRD Officer' },
    { value: 'internee', label: 'Internee' },
  ];
  
  export const genders = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' }
  ];