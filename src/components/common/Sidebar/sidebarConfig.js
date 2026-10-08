// Sidebar configuration for different user roles and departments
import { canViewModule, hasPermission, isSuperAdmin } from '../../../utils/permissions';
import {
  FiHome,
  FiUsers,
  FiUser,
  FiUserCheck,
  FiUserPlus,
  FiMail,
  FiPlusCircle,
  FiClipboard,
  FiCheckSquare,
  FiCheckCircle,
  FiList,
  FiBarChart2,
  FiFileText,
  FiBox,
  FiGift,
  FiDollarSign,
  FiSettings,
  FiLifeBuoy,
  FiDroplet,
  FiBriefcase,
  FiBookOpen,
  FiBook,
  FiFeather,
  FiMapPin,
  FiTarget,
  FiGrid,
  FiLayers,
  FiArchive,
  FiHeart,
  FiGlobe,
  FiMap,
  FiNavigation,
  FiShoppingCart,
  FiCpu,
  FiTrendingUp,
  FiVideo,
  FiCalendar,
  FiFlag,
  FiPackage,
  FiAlertCircle,
  FiBookmark,
  FiRepeat,
  FiRefreshCw,
  FiMessageSquare,
  FiSend,
  FiCoffee,
  FiSearch,
} from 'react-icons/fi';
import { BiSolidDonateHeart } from 'react-icons/bi';
import { departments } from '../../../utils/admin';

const TASK_MODULE_KEYS = new Set(['tasks', 'tasking']);
const COMPLAINT_MODULE_KEYS = new Set(['tickets', 'complaints']);

const TASKS_LIST_PATH = '/tasks/list';
const TASKS_DASHBOARD_PATH = '/tasks/dashboard';
const COMPLAINTS_LIST_PATH = '/tickets/list';
const COMPLAINTS_DASHBOARD_PATH = '/tickets/dashboard';
const GRIEVANCE_LIST_PATH = '/complaints/list';
const GRIEVANCE_ADD_PATH = '/complaints/add';
const GRIEVANCE_TRACK_PATH = '/complaints/track';

const hasGlobalTaskingAccess = (permissions) => (
  permissions?.tasks?.view === true ||
  permissions?.tasks?.list_view === true ||
  permissions?.tasking?.tasks?.view === true ||
  permissions?.tasking?.tasks?.list_view === true ||
  permissions?.tasking?.dashboard?.view === true ||
  permissions?.tasking?.dashboard?.list_view === true
);

const hasGlobalComplaintsAccess = (permissions) => (
  permissions?.tickets?.view === true ||
  permissions?.complaints?.view === true ||
  permissions?.tickets?.list_view === true ||
  permissions?.complaints?.list_view === true ||
  permissions?.tickets?.tickets?.view === true ||
  permissions?.complaints?.complaints?.view === true ||
  permissions?.tickets?.tickets?.list_view === true ||
  permissions?.complaints?.complaints?.list_view === true ||
  permissions?.tickets?.dashboard?.view === true ||
  permissions?.complaints?.dashboard?.view === true ||
  permissions?.tickets?.dashboard?.list_view === true ||
  permissions?.complaints?.dashboard?.list_view === true
);

const hasAnyDepartmentTaskAccess = (permissions) => {
  if (!permissions) return false;
  return departments.some(
    (dept) =>
      canViewModule(permissions, dept, 'tasks') ||
      canViewModule(permissions, dept, 'tasking'),
  );
};

const hasAnyDepartmentComplaintAccess = (permissions) => {
  if (!permissions) return false;
  return departments.some(
    (dept) => canViewModule(permissions, dept, 'tickets') || canViewModule(permissions, dept, 'complaints'),
  );
};

const shouldShowUnifiedTasking = (permissions) =>
  hasGlobalTaskingAccess(permissions) || hasAnyDepartmentTaskAccess(permissions);

const shouldShowUnifiedComplaints = (permissions) =>
  hasGlobalComplaintsAccess(permissions) || hasAnyDepartmentComplaintAccess(permissions);

const hasGlobalComplaintCaseAccess = (permissions) => (
  permissions?.tickets?.complaints_case?.view === true ||
  permissions?.tickets?.complaints_case?.list_view === true ||
  permissions?.tickets?.complaints_case?.create === true ||
  permissions?.complaints_case?.view === true ||
  permissions?.complaints_case?.list_view === true ||
  permissions?.complaints_case?.create === true
);

const hasAnyDepartmentComplaintCaseAccess = (permissions) => {
  if (!permissions) return false;
  return departments.some((dept) => {
    const mod = permissions?.[dept]?.tickets?.complaints_case;
    return mod?.view === true || mod?.list_view === true || mod?.create === true;
  });
};

const shouldShowComplaintCase = (permissions) =>
  hasGlobalComplaintCaseAccess(permissions) || hasAnyDepartmentComplaintCaseAccess(permissions);

const buildComplaintCaseGroup = (user, permissions) => {
  if (!user || !permissions) return null;
  if (!shouldShowComplaintCase(permissions) && !isSuperAdmin(permissions) && user.role !== 'super_admin') {
    return null;
  }
  return {
    id: 'complaints_case_global',
    label: 'Complaints',
    icon: FiAlertCircle,
    items: [
      {
        label: 'Complaints List',
        path: GRIEVANCE_LIST_PATH,
        type: 'list',
        module: 'tickets',
        icon: FiList,
      },
      {
        label: 'Submit Complaint',
        path: GRIEVANCE_ADD_PATH,
        type: 'list',
        module: 'tickets',
        icon: FiAlertCircle,
      },
      {
        label: 'Track by Code',
        path: GRIEVANCE_TRACK_PATH,
        type: 'list',
        module: 'tickets',
        icon: FiSearch,
      },
    ],
  };
};

const buildUnifiedTaskingGroup = (user, permissions) => {
  if (!user || !permissions || !shouldShowUnifiedTasking(permissions)) {
    return null;
  }
  return {
    id: 'tasking_global',
    label: 'Tasking',
    icon: FiCheckSquare,
    items: [
      {
        label: 'Tasks List',
        path: TASKS_LIST_PATH,
        type: 'list',
        module: 'tasks',
        icon: FiList,
      },
      {
        label: 'Tasks Dashboard',
        path: TASKS_DASHBOARD_PATH,
        type: 'list',
        module: 'tasks',
        icon: FiBarChart2,
      },
    ],
  };
};

const buildUnifiedComplaintsGroup = (user, permissions) => {
  if (!user || !permissions || !shouldShowUnifiedComplaints(permissions)) {
    return null;
  }
  return {
    id: 'tickets_global',
    label: 'Issues',
    icon: FiAlertCircle,
    items: [
      {
        label: 'Issues List',
        path: COMPLAINTS_LIST_PATH,
        type: 'list',
        module: 'tickets',
        icon: FiList,
      },
      {
        label: 'Issues Dashboard',
        path: COMPLAINTS_DASHBOARD_PATH,
        type: 'list',
        module: 'tickets',
        icon: FiBarChart2,
      },
    ],
  };
};

/** Super admin: single Tasks section (flat `/tasks/...` routes). */
const buildSuperAdminTaskingGroup = () => ({
  id: 'tasking_global',
  label: 'Tasking',
  icon: FiCheckSquare,
  items: [
    {
      label: 'Tasks List',
      path: TASKS_LIST_PATH,
      type: 'list',
      module: 'tasks',
      icon: FiList,
    },
    {
      label: 'Tasks Dashboard',
      path: TASKS_DASHBOARD_PATH,
      type: 'list',
      module: 'tasks',
      icon: FiBarChart2,
    },
  ],
});

/** Super admin: single Tickets section (flat `/complaints/...` routes). */
const buildSuperAdminComplaintsGroup = () => ({
  id: 'tickets_global',
  label: 'Issues',
  icon: FiAlertCircle,
  items: [
    {
      label: 'Issues List',
      path: COMPLAINTS_LIST_PATH,
      type: 'list',
      module: 'tickets',
      icon: FiList,
    },
    {
      label: 'Issues Dashboard',
      path: COMPLAINTS_DASHBOARD_PATH,
      type: 'list',
      module: 'tickets',
      icon: FiBarChart2,
    },
  ],
});

const programDepartmentItems = (isUser = false) => [
  {
    label: 'Tasking',
    path: '/tasks/list',
    type: 'list',
    module: 'tasks',
    icon: FiCheckSquare,
    subItems: [
      { label: 'Tasking List', path: '/tasks/list', type: 'list', icon: FiList },
      { label: 'Tasking Dashboard', path: '/tasks/dashboard', type: 'list', icon: FiBarChart2 }
    ]
  },
  {
    label: 'Applications Reports',
    path: '/program/applications_reports',
    type: 'list',
    module: 'application_reports',
    icon: FiFileText
  },
  {
    label: 'Ration Reports',
    path: '/program/ration_report/list',
    type: 'list',
    module: 'ration_reports',
    icon: FiBox
  },
  {
    label: 'Marriage Gifts',
    path: '/program/marriage_gifts/reports/list',
    type: 'list',
    module: 'marriage_gifts_reports',
    icon: FiGift
  },
  {
    label: 'Financial Assistance',
    path: '/program/financial_assistance/reports/list',
    type: 'list',
    module: 'financial_assistance_reports',
    icon: FiDollarSign
  },
  {
    label: 'Sewing Machine',
    path: '/program/sewing_machine/reports/list',
    type: 'list',
    module: 'sewing_machine_reports',
    icon: FiSettings
  },
  {
    label: 'Wheel Chair/Crutches',
    path: '/program/wheel_chair_or_crutches/reports/list',
    type: 'list',
    module: 'wheel_chair_or_crutches_reports',
    icon: FiLifeBuoy
  },
  {
    label: 'Health Reports',
    path: '/program/health/reports/list',
    type: 'list',
    module: 'health_reports',
    icon: FiHeart
  },
  {
    label: 'Water Reports',
    path: '/program/water/reports/list',
    type: 'list',
    module: 'water_reports',
    icon: FiDroplet
  },
  {
    label: 'Kasb Reports',
    path: '/program/kasb/reports/list',
    type: 'list',
    module: 'kasb_reports',
    icon: FiBriefcase
  },
  {
    label: 'Kasb Training Reports',
    path: '/program/kasb-training/reports',
    type: 'list',
    module: 'kasb_training_reports',
    icon: FiBookOpen
  },
  {
    label: 'Education Reports',
    path: '/program/education/reports/list',
    type: 'list',
    module: 'education_reports',
    icon: FiBook
  },
  {
    label: 'Tree Plantation Reports',
    path: '/program/tree_plantation/reports/list',
    type: 'list',
    module: 'tree_plantation_reports',
    icon: FiFeather
  },
  {
    label: 'Area Ration Reports',
    path: '/program/area_ration/reports/list',
    type: 'list',
    module: 'area_ration_reports',
    icon: FiMapPin
  },
  {
    label: 'Targets',
    path: '/program/targets/reports/list',
    type: 'list',
    module: 'targets',
    icon: FiTarget
  },
  {
    label: 'AAS Collection Centers',
    path: '/program/aas_collection_centers_reports',
    type: 'list',
    module: 'aas_collection_centers_reports',
    icon: FiFileText
  },
  {
    label: 'Al Hasanain CLG',
    path: '/program/al_hasanain_clg',
    type: 'list',
    module: 'al_hasanain_clg',
    icon: FiBook
  },
  {
    label: 'Programs',
    path: '/program/programs',
    type: 'list',
    module: 'programs',
    icon: FiGrid
  },
  {
    label: 'Dream Schools',
    path: '/program/dream_schools',
    type: 'list',
    module: 'programs',
    icon: FiBookmark
  },
  {
    label: 'Dream School Reports',
    path: '/program/dream_school_reports',
    type: 'list',
    module: 'programs',
    icon: FiFileText
  },
  {
    label: 'Subprograms',
    path: '/program/subprograms',
    type: 'list',
    module: 'subprograms',
    icon: FiList
  },
  {
    label: 'Progress Tracking',
    path: '/progress/trackers',
    type: 'list',
    module: 'progress_tracking',
    icon: FiTrendingUp,
    subItems: [
      { label: 'Trackers', path: '/progress/trackers', type: 'list', module: 'progress_tracking', icon: FiList },
      { label: 'Create Tracker', path: '/progress/trackers/add', type: 'create', module: 'progress_tracking', icon: FiPlusCircle },
      { label: 'Workflow Templates', path: '/progress/templates', type: 'list', module: 'progress_tracking', icon: FiLayers },
      { label: 'Create Template', path: '/progress/templates/add', type: 'create', module: 'progress_tracking', icon: FiPlusCircle },
    ],
  }
];

const storeDepartmentItems = (isUser = false) => [
  {
    label: 'Tasking',
    path: '/tasks/list',
    type: 'list',
    module: 'tasking',
    icon: FiCheckSquare,
    subItems:[
      {label:'Tasking List',path:'/tasks/list',type:'list',module:'tasking', icon: FiList},
      {label:'Tasking Dashboard',path:'/tasks/dashboard',type:'list',module:'tasking', icon: FiBarChart2}
    ]
  },
  {
    label: 'Reports',
    path: '/store/reports/list',
    type: 'list',
    module: 'reports',
    icon: FiBarChart2
  }
];

const procurementsDepartmentItems = (isUser = false) => [
  {
    label: 'Tasking',
    path: '/tasks/list',
    type: 'list',
    module: 'tasks',
    icon: FiCheckSquare,
    subItems:[
      {label:'Tasking List',path:'/tasks/list',type:'list',module:'tasks', icon: FiList},
      {label:'Tasking Dashboard',path:'/tasks/dashboard',type:'list',module:'tasks', icon: FiBarChart2}
    ]
  },
  {
    label: 'Reports',
    path: '/procurements/reports/list',
    type: 'list',
    module: 'reports',
    icon: FiShoppingCart
  }
];

const adminDepartmentItems = () => [
  {
    label: 'User Management',
    path: '/admin/users',
    type: 'list',
    module: 'users',
    icon: FiUsers
    // subItems: [
    //   { label: 'View All Users', path: '/admin/users', type: 'list' },
    // ]
  },
  {
    label: 'Dashboard',
    path: '/admin',
    type: 'list',
    module: 'dashboard',
    icon: FiHome,
    subItems: [
      { label: 'Admin Dashboard', path: '/admin', type: 'list', icon: FiHome },
      { label: 'Workflow Template Report', path: '/admin/progress-template-dashboard', type: 'list', icon: FiBarChart2 }
    ]
  },
  {
    label: 'Program',
    path: '/program',
    type: 'list',
    module: 'program_admin',
    icon: FiLayers,
    subItems: [
      { label: 'Progress Tracking (Trackers)', path: '/progress/trackers', type: 'list', icon: FiTrendingUp },
      { label: 'Progress Tracking (Create Tracker)', path: '/progress/trackers/add', type: 'create', icon: FiPlusCircle },
      { label: 'Progress Tracking (Templates)', path: '/progress/templates', type: 'list', icon: FiLayers },
      { label: 'Progress Tracking (Create Template)', path: '/progress/templates/add', type: 'create', icon: FiPlusCircle },
      {label: "Programs", path: "/program/programs", type: "list", icon: FiGrid},
      {label: "Subprograms", path: "/program/subprograms", type: "list", icon: FiList}
    ]
  },
  // {
  //   label: 'Fund Raising',
  //   path: '/fund_raising',
  //   type: 'list',
  //   module: 'fund_raising_admin',
  //   icon: FiHeart,
  //   subItems: [ 
  //     {label: "Online Donations", path: "/donations/online_donations/list", type: "list", module: "online_donations", icon: BiSolidDonateHeart},
  //     {label: "Offline Donations", path: "/donations/offline_donations/list", type: "list", module: "offline_donations", icon: BiSolidDonateHeart},
  //     {label: "Website Donation Projects", path: "/dms/website_donation_projects/list", type: "list", icon: FiGrid},
  //     {label: "Home Hero Slides", path: "/dms/website_home_hero/list", type: "list", icon: FiLayers},
  //     {label: "Recurring Donations", path: "/dms/recurring-donations/list", type: "list", module: "recurring_donations", icon: FiRepeat},
  //     {label: "Reminder Logs", path: "/dms/recurring-reminder-logs/list", type: "list", module: "recurring_reminder_logs", icon: FiMail},
  //     {label: "Recurring Donors", path: "/dms/recurring-donors/list", type: "list", module: "recurring_donors", icon: FiRepeat},
  //     {label: "Donation Boxes", path: "/dms/donation_box/list", type: "list", icon: FiBox},
  //     {label: "Donation Box Donations", path: "/dms/donation-box-donations/list", type: "list", icon: FiPackage},
  //     {label: "My To-Dos", path: "/dms/todos", type: "list", module: "dms_todos", icon: FiCheckSquare},
  //     {label: "Online Donors", path: "/dms/online_donors/list", type: "list", module: "online_donors", icon: FiUsers},
  //     // Enable later — Beneficiary Aid Applications (Phase 1)
  //     // {label: "Aid Applications", path: "/dms/aid/applications/list", type: "list", module: "aid_applications", icon: FiLifeBuoy},
  //     // {label: "Aid People", path: "/dms/aid/people/list", type: "list", module: "aid_people", icon: FiUsers},
  //     {label: "Offline Donors", path: "/dms/offline_donors/list", type: "list", module: "offline_donors", icon: FiUsers},
  //     {label: "CSR Donors", path: "/dms/csr-donors/list", type: "list", module: "organizations", icon: FiBriefcase},
  //     {label: "CSR Donations", path: "/dms/csr-donations/list", type: "list", module: "organizations", icon: BiSolidDonateHeart},
  //     {label: "CSR POCs", path: "/dms/csr-pocs/list", type: "list", module: "csr_pocs", icon: FiUsers},
  //     {label: "Volunteers", path: "/dms/volunteers/list", type: "list", icon: FiUserPlus},
  //     // {label: "Surveys", path: "/dms/surveys/list", type: "list", icon: FiClipboard},
  //     // {label: "Events", path: "/dms/events/list", type: "list", icon: FiCalendar},
  //     // {label: "Campaigns", path: "/dms/campaigns/list", type: "list", icon: FiFlag},
  //     // {label: "Appeals", path: "/dms/appeals/list", type: "list", icon: FiAlertCircle},
  //     // {label: "Social Media", path: "/dms/social-posts/list", type: "list", icon: FiFileText},
  //     {label: "Reconciliation", path: "/dms/reconciliation/list", type: "list", icon: FiRefreshCw},
  //     {label: "Donor Relationship", path: "/dms/donor-relationship/follow-ups", type: "list", icon: FiUsers}
  //   ]
  // },
  {
    label: 'Geographic',
    path: '/dms/geographic/countries/list',
    type: 'list',
    module: 'geographic_admin',
    icon: FiGlobe,
    subItems: [
      { label: 'Countries', path: '/dms/geographic/countries/list', type: 'list', icon: FiGlobe },
      { label: 'Regions', path: '/dms/geographic/regions/list', type: 'list', icon: FiMap },
      { label: 'Sub Regions', path: '/dms/geographic/sub-regions/list', type: 'list', icon: FiMap },
      { label: 'Districts', path: '/dms/geographic/districts/list', type: 'list', icon: FiMap },
      { label: 'Tehsils', path: '/dms/geographic/tehsils/list', type: 'list', icon: FiMap },
      { label: 'Cities', path: '/dms/geographic/cities/list', type: 'list', icon: FiMapPin },
      { label: 'Routes', path: '/dms/geographic/routes/list', type: 'list', icon: FiNavigation }
    ]
  },
  {
    label: 'Marketing',
    path: '/marketing',
    type: 'list',
    module: 'marketing_admin',
    icon: FiTrendingUp,
    subItems: [
      {label: "Marketing Reports", path: "/marketing/reports/list", type: "list", icon: FiBarChart2}
    ]
  },
  {
    label: 'HR',
    path: '/hr/careers/jobs/list',
    type: 'list',
    module: 'hr_admin',
    icon: FiUserCheck,
    subItems: [
      { label: 'Jobs', path: '/hr/careers/jobs/list', type: 'list', icon: FiBriefcase },
      { label: 'Applications', path: '/hr/career/applications/list', type: 'list', icon: FiFileText },
      { label: 'Resume Collection', path: '/hr/resume-collection/list', type: 'list', icon: FiFileText }
    ]
  },
];

const hrDepartmentItems = (isUser = false) => [
  {
    label: 'Jobs',
    path: '/hr/careers/jobs/list',
    type: 'list',
    module: 'jobs',
    icon: FiBriefcase
  },
  {
    label: 'Applications',
    path: '/hr/career/applications/list',
    type: 'list',
    module: 'applications',
    icon: FiFileText
  },
  {
    label: 'Resume Collection',
    path: '/hr/resume-collection/list',
    type: 'list',
    module: 'resume_collection',
    icon: FiFileText,
    subItems: [
      { label: 'Collection List', path: '/hr/resume-collection/list', type: 'list', icon: FiList },
      { label: 'Upload Resume', path: '/hr/resume-collection/add', type: 'list', icon: FiPlusCircle }
    ]
  },
  {
    label: 'Tasking',
    path: '/tasks/list',
    type: 'list',
    module: 'tasks',
    icon: FiCheckSquare,
    subItems: [
      { label: 'Tasking List', path: '/tasks/list', type: 'list', module: 'tasks', icon: FiList },
      { label: 'Tasking Dashboard', path: '/tasks/dashboard', type: 'list', module: 'tasks', icon: FiBarChart2 }
    ]
  },
  // {
  //   label: 'Tickets',
  //   path: '/hr/complaints/list',
  //   type: 'list',
  //   module: 'tickets',
  //   subItems: [
  //     { label: 'Tickets List', path: '/hr/complaints/list', type: 'list', module: 'tickets' },
  //     { label: 'Tickets Dashboard', path: '/hr/complaints/reports', type: 'list', module: 'tickets' }
  //   ]
  // }
];

const geographicItems = (isUser = false) => [
  { label: 'Countries', path: '/dms/geographic/countries/list', type: 'list', module: 'countries', icon: FiGlobe },
  { label: 'Regions', path: '/dms/geographic/regions/list', type: 'list', module: 'regions', icon: FiMap },
  { label: 'Sub Regions', path: '/dms/geographic/sub-regions/list', type: 'list', module: 'sub_regions', icon: FiMap },
  { label: 'Districts', path: '/dms/geographic/districts/list', type: 'list', module: 'districts', icon: FiMap },
  { label: 'Tehsils', path: '/dms/geographic/tehsils/list', type: 'list', module: 'tehsils', icon: FiMap },
  { label: 'Cities', path: '/dms/geographic/cities/list', type: 'list', module: 'cities', icon: FiMapPin },
  { label: 'Routes', path: '/dms/geographic/routes/list', type: 'list', module: 'routes', icon: FiNavigation }
];

const fundRaisingDepartmentItems = (isUser = false) => [
  // Enable later — Beneficiary Aid Applications (Phase 1)
  // {
  //   label: 'Aid Applications',
  //   path: '/dms/aid/applications/list',
  //   type: 'list',
  //   module: 'aid_applications',
  //   icon: FiLifeBuoy
  // },
  // {
  //   label: 'Aid People',
  //   path: '/dms/aid/people/list',
  //   type: 'list',
  //   module: 'aid_people',
  //   icon: FiUsers
  // },
  {
    label: 'Online Donations',
    path: '/donations/online_donations/list',
    type: 'list',
    module: 'online_donations',
    icon: BiSolidDonateHeart
  },
  {
    label: 'Offline Donations',
    path: '/donations/offline_donations/list',
    type: 'list',
    module: 'offline_donations',
    icon: BiSolidDonateHeart
  },
  {
    label: 'Website Donation Projects',
    path: '/dms/website_donation_projects/list',
    type: 'list',
    module: 'website_donation_projects',
    icon: FiGrid
  },
  {
    label: 'Home Hero Slides',
    path: '/dms/website_home_hero/list',
    type: 'list',
    module: 'website_home_hero',
    icon: FiLayers
  },
  {
    label: 'Online Donors',
    path: '/dms/online_donors/list',
    type: 'list',
    module: 'online_donors',
    icon: FiUsers
  },
  {
    label: 'Offline Donors',
    path: '/dms/offline_donors/list',
    type: 'list',
    module: 'offline_donors',
    icon: FiUsers
  },
  {
    label: 'Donation Box',
    path: '/dms/donation_box/list',
    type: 'list',
    module: 'donation_box',
    icon: FiBox
  },
  {
    label: 'Donation Box Donations',
    path: '/dms/donation-box-donations/list',
    type: 'list',
    module: 'donation_box_donations',
    icon: FiPackage
  },
  {
    label: 'In Kind Items',
    path: '/dms/in-kind-items/list',
    type: 'list',
    module: 'donation_in_kind_items',
    icon: FiGift
  },
  {
    label: 'In Kind Donations',
    path: '/dms/in-kind-donations/list',
    type: 'list',
    module: 'in_kind_donations',
    icon: FiGift
  },
  {
    label: 'CSR Donors',
    path: '/dms/csr-donors/list',
    type: 'list',
    module: 'organizations',
    icon: FiBriefcase
  },
  {
    label: 'CSR Donations',
    path: '/dms/csr-donations/list',
    type: 'list',
    module: 'organizations',
    icon: BiSolidDonateHeart
  },
  {
    label: 'CSR POCs',
    path: '/dms/csr-pocs/list',
    type: 'list',
    module: 'csr_pocs',
    icon: FiUsers
  },
  {
    label: 'My To-Dos',
    path: '/dms/todos',
    type: 'list',
    module: 'dms_todos',
    icon: FiCheckSquare
  },
  {
    label: 'Volunteers',
    path: '/dms/volunteers/list',
    type: 'list',
    module: 'volunteers',
    icon: FiUserPlus
  },
  // {
  //   label: 'Surveys',
  //   path: '/dms/surveys/list',
  //   type: 'list',
  //   module: 'surveys',
  //   icon: FiClipboard
  // },
  // {
  //   label: 'Events',
  //   path: '/dms/events/list',
  //   type: 'list',
  //   module: 'events',
  //   icon: FiCalendar
  // },
  // {
  //   label: 'Campaigns',
  //   path: '/dms/campaigns/list',
  //   type: 'list',
  //   module: 'campaigns',
  //   icon: FiFlag
  // },
  // {
  //   label: 'Appeals',
  //   path: '/dms/appeals/list',
  //   type: 'list',
  //   module: 'appeals',
  //   icon: FiAlertCircle
  // },
  {
    label: 'Social Posts',
    path: '/dms/social-posts/list',
    type: 'list',
    module: 'social_posts',
    icon: FiFileText
  },
  {
    label: 'Recurring Donations',
    path: '/dms/recurring-donations/list',
    type: 'list',
    module: 'recurring_donations',
    icon: FiRepeat,
    subItems: [
      {
        label: 'Subscriptions',
        path: '/dms/recurring-donations/list',
        type: 'list',
        module: 'recurring_donations',
        icon: FiList,
      },
      {
        label: 'Reminder Logs',
        path: '/dms/recurring-reminder-logs/list',
        type: 'list',
        module: 'recurring_reminder_logs',
        icon: FiMail,
      },
    ],
  },
  {
    label: 'Recurring Donors',
    path: '/dms/recurring-donors/list',
    type: 'list',
    module: 'recurring_donors',
    icon: FiUsers
  },
  {
    label: 'Event Pledges',
    path: '/dms/event-pledges/list',
    type: 'list',
    module: 'event_pledges',
    icon: FiClipboard
  },
  {
    label: 'Reconciliation',
    path: '/dms/reconciliation/list',
    type: 'list',
    module: 'reconciliation',
    icon: FiRefreshCw
  },
  {
    label: 'Donor Relationship',
    path: '/dms/donor-relationship/follow-ups',
    type: 'list',
    module: 'donor_relationship',
    icon: FiUsers,
    subItems: [
      { label: 'Follow Ups & Interactions', path: '/dms/donor-relationship/follow-ups', type: 'list', icon: FiList },
      { label: 'Add Interaction', path: '/dms/donor-relationship/add', type: 'create', action: 'create', icon: FiPlusCircle },
      {
        label: 'Management Overview',
        path: '/dms/donor-relationship/overview',
        type: 'list',
        action: 'manage_overview',
        icon: FiBarChart2,
      },
    ],
  },
  // {
  //   label: 'Allotment Approvals',
  //   path: '/donations/allotments/pending',
  //   type: 'list',
  //   module: 'donation_allotments',
  //   icon: FiCheckCircle,
  // },
  // {
  //   label: 'Receipt Templates',
  //   path: '/dms/receipt_templates/list',
  //   type: 'list',
  //   module: 'receipt_templates',
  //   icon: FiFileText,
  //   subItems: [
  //     { label: 'Templates List', path: '/dms/receipt_templates/list', type: 'list', icon: FiList },
  //     { label: 'Add Template', path: '/dms/receipt_templates/add', type: 'list', icon: FiPlusCircle }
  //   ]
  // },
  // {
  //   label: 'Reports',
  //   path: '/dms/reports/create',
  //   type: 'create',
  //   module: 'reports'
  // },
  {
    label: 'Tasking',
    path: '/tasks/list',
    type: 'list',
    module: 'tasks',
    icon: FiCheckSquare,
    subItems: [
      { label: 'Tasking List', path: '/tasks/list', type: 'list', icon: FiList },
      { label: 'Tasking Dashboard', path: '/tasks/dashboard', type: 'list', icon: FiBarChart2 }
    ]
  },
  {
    label: 'Dashboard',
    path: '/fund_raising/dashboard',
    type: 'list',
    module: 'dashboard',
    icon: FiHome
  },
  {
    label: 'Recurring Performance',
    path: '/fund_raising/recurring-performance',
    type: 'list',
    module: 'recurring_performance',
    icon: FiRepeat
  }
];

const taskingItems = (isUser = false) => [
  {
    label: 'Tasking List',
    path: TASKS_LIST_PATH,
    type: 'list',
    module: 'tasks',
    icon: FiList
  },
  {
    label: 'Tasking Dashboard',
    path: TASKS_DASHBOARD_PATH,
    type: 'list',
    module: 'tasks',
    icon: FiBarChart2
  },
];

const complaintsItems = (isUser = false) => [
  {
    label: 'Tickets List',
    path: COMPLAINTS_LIST_PATH,
    type: 'list',
    module: 'tickets',
    icon: FiList
  },
  {
    label: 'Tickets Dashboard',
    path: COMPLAINTS_DASHBOARD_PATH,
    type: 'list',
    module: 'tickets',
    icon: FiBarChart2
  },
];

// IT department menu
const itDepartmentItems = () => [
  {
    label: 'Tasking',
    path: '/tasks/list',
    type: 'list',
    module: 'tasks',
    icon: FiCheckSquare,
    subItems: [
      { label: 'Tasking List', path: '/tasks/list', type: 'list', module: 'tasks', icon: FiList },
      { label: 'Tasking Dashboard', path: '/tasks/dashboard', type: 'list', module: 'tasks', icon: FiBarChart2 }
    ]
  },
  // {
  //   label: 'Tickets',
  //   path: '/it/complaints/list',
  //   type: 'list',
  //   module: 'tickets',
  //   subItems: [
  //     { label: 'Tickets List', path: '/it/complaints/list', type: 'list', module: 'tickets' },
  //     { label: 'Tickets Dashboard', path: '/it/complaints/reports', type: 'list', module: 'tickets' }
  //   ]
  // }
];

// Marketing department menu
const marketingDepartmentItems = () => [
  {
    label: 'Tasking',
    path: '/tasks/list',
    type: 'list',
    module: 'tasks',
    icon: FiCheckSquare,
    subItems: [
      { label: 'Tasking List', path: '/tasks/list', type: 'list', module: 'tasks', icon: FiList },
      { label: 'Tasking Dashboard', path: '/tasks/dashboard', type: 'list', module: 'tasks', icon: FiBarChart2 }
    ]
  },
  // {
  //   label: 'Tickets',
  //   path: '/marketing/complaints/list',
  //   type: 'list',
  //   module: 'tickets',
  //   subItems: [
  //     { label: 'Tickets List', path: '/marketing/complaints/list', type: 'list', module: 'tickets' },
  //     { label: 'Tickets Dashboard', path: '/marketing/complaints/reports', type: 'list', module: 'tickets' }
  //   ]
  // }
];

// Email Templates module items
const emailTemplatesItems = () => [
  {
    label: 'Templates',
    path: '/dms/email_templates/list',
    type: 'list',
    module: 'email_templates',
    icon: FiMail,
    subItems: [
      { label: 'Templates List', path: '/dms/email_templates/list', type: 'list', icon: FiList },
      { label: 'Create Template', path: '/dms/email_templates/add', type: 'list', icon: FiPlusCircle },
      { label: 'Send Communication', path: '/dms/email_templates/send', type: 'list', icon: FiSend },
      { label: 'Send History', path: '/dms/email_templates/batches?source=communication', type: 'list', icon: FiFileText },
    ]
  },
  {
    label: 'Email Checklist',
    path: '/email-checklist',
    type: 'list',
    module: 'email_checklist',
    icon: FiCheckSquare,
  }
];
const ceoOfficeItems = () => [
  {
    label: 'CEO Dashboard',
    path: '/ceo-office/dashboard',
    type: 'list',
    module: 'dashboard',
    icon: FiCoffee
  },
  {
    label: 'Instruction Register',
    path: '/ceo-office/instruction-register',
    type: 'list',
    module: 'instruction_register',
    icon: FiList
  },
  {
    label: 'CEO Complaints',
    path: '/ceo-office/ceo-complaints/list',
    type: 'list',
    module: 'ceo_complaints',
    icon: FiAlertCircle
  },
];

// All department items for permission-based access
const allDepartmentItems = (isUser = false) => [
  {
    id: 'program',
    label: 'Program Department',
    icon: FiLayers,
    items: programDepartmentItems(isUser)
  },
  {
    id: 'ceo_office',
    label: 'CEO Office',
    icon: FiCoffee,
    items: ceoOfficeItems()
  },
  // {
  //   id: 'store',
  //   label: 'Store Department',
  //   icon: FiArchive,
  //   items: storeDepartmentItems(isUser)
  // },
  // {
  //   id: 'procurements',
  //   label: 'Procurements Department',
  //   icon: FiShoppingCart,
  //   items: procurementsDepartmentItems(isUser)
  // },
  // {
  //   id: 'accounts_and_finance',
  //   label: 'Accounts & Finance',
  //   icon: FiDollarSign,
  //   items: accountsFinanceDepartmentItems(isUser)
  // },
  {
    id: 'admin',
    label: 'DMS Menu',
    icon: BiSolidDonateHeart,
    items: adminDepartmentItems(isUser)
  },
  {
    id: 'fund_raising',
    label: 'Fund Raising',
    icon: FiHeart,
    items: fundRaisingDepartmentItems(isUser)
  },
  {
    id: 'geographic',
    label: 'Geographic',
    icon: FiGlobe,
    items: geographicItems(isUser)
  },
  {
    id: 'hr',
    label: 'HR',
    icon: FiUser,
    items: hrDepartmentItems(isUser)
  },
  {
    id: 'tasking',
    label: 'Tasking',
    icon: FiCheckSquare,
    items: taskingItems(isUser)
  },
  {
    id: 'tickets',
    label: 'Tickets',
    icon: FiAlertCircle,
    items: complaintsItems(isUser)
  },
  {
    id: 'it',
    label: 'IT',
    icon: FiCpu,
    items: itDepartmentItems(isUser)
  },
  {
    id: 'marketing',
    label: 'Marketing',
    icon: FiTrendingUp,
    items: marketingDepartmentItems(isUser)
  },
  // {
  //   id: 'audio_video',
  //   label: 'Audio Video',
  //   icon: FiVideo,
  //   items: audioVideoDepartmentItems(isUser)
  // },
  {
    id: 'email_templates',
    label: 'Communication',
    icon: FiMail,
    items: emailTemplatesItems()
  }
];



// Department configurations
const departmentConfigs = {
ceo_office: (isUser = false) => ({
    id: 'ceo_office',
    label: 'CEO Office',
    icon: FiCoffee,
    items: ceoOfficeItems()
  }),
  program: (isUser = false) => ({
    id: 'program',
    label: 'Program Department',
    icon: FiLayers,
    items: programDepartmentItems(isUser)
  }),
  
  // store: (isUser = false) => ({
  //   id: 'store',
  //   label: 'Store Department',
  //   icon: FiArchive,
  //   items: storeDepartmentItems(isUser)
  // }),
  
  // procurements: (isUser = false) => ({
  //   id: 'procurements',
  //   label: 'Procurements Department',
  //   icon: FiShoppingCart,
  //   items: procurementsDepartmentItems(isUser)
  // }),
  
  // accounts_and_finance: (isUser = false) => ({
  //   id: 'accounts_and_finance',
  //   label: 'Accounts & Finance',
  //   icon: FiDollarSign,
  //   items: accountsFinanceDepartmentItems(isUser)
  // }),
  
  admin: (isUser = false) => ({
    id: 'admin',
    label: 'DMS Menu',
    icon: BiSolidDonateHeart,
    items: adminDepartmentItems(isUser)
  }),
  fund_raising: (isUser = false) => ({
    id: 'fund_raising',
    label: 'Fund Raising',
    icon: FiHeart,
    items: fundRaisingDepartmentItems(isUser)
  }),
  geographic: (isUser = false) => ({
    id: 'geographic',
    label: 'Geographic',
    icon: FiGlobe,
    items: geographicItems(isUser)
  }),
  hr: (isUser = false) => ({
    id: 'hr',
    label: 'HR',
    icon: FiUser,
    items: hrDepartmentItems(isUser)
  }),
  tasking: (isUser = false) => ({
    id: 'tasking',
    label: 'Tasking',
    icon: FiCheckSquare,
    items: taskingItems(isUser)
  }),
  complaints: (isUser = false) => ({
    id: 'tickets',
    label: 'Tickets',
    icon: FiAlertCircle,
    items: complaintsItems(isUser)
  }),
  it: (isUser = false) => ({
    id: 'it',
    label: 'IT',
    icon: FiCpu,
    items: itDepartmentItems(isUser)
  }),
  marketing: (isUser = false) => ({
    id: 'marketing',
    label: 'Marketing',
    icon: FiTrendingUp,
    items: marketingDepartmentItems(isUser)
  }),
  email_templates: () => ({
    id: 'email_templates',
    label: 'Communication',
    icon: FiMail,
    items: emailTemplatesItems()
  }),
};
 
// Sidebar section id → permissions department key (when they differ)
const permissionDepartmentFor = (sectionId) => {
  if (sectionId === 'email_templates') return 'communication';
  return sectionId;
};

const canAccessSidebarEntry = (permissions, department, item, parentModule = null) => {
  if (!item) return false;

  // Tasks / Tickets are shown from dedicated global sections only.
  if (item.module && TASK_MODULE_KEYS.has(item.module)) {
    return false;
  }
  if (item.module && COMPLAINT_MODULE_KEYS.has(item.module)) {
    return false;
  }

  const moduleKey = item.module || parentModule;
  const permDept = permissionDepartmentFor(department);

  // Explicit action (e.g. manage_overview) — must be granted on the module
  if (item.action) {
    if (!moduleKey) return false;
    if (permissions?.super_admin === true) return true;
    if (
      permDept === 'fund_raising' &&
      (permissions?.fund_raising_manager === true ||
        permissions?.fund_raising?.manager === true)
    ) {
      return true;
    }
    return hasPermission(permissions, permDept, moduleKey, item.action);
  }

  // Module-level visibility (view / list_view)
  if (moduleKey) {
    return canViewModule(permissions, department, moduleKey);
  }

  // No module/action: keep for backward compatibility
  return true;
};

// Filter items (and nested subItems) based on user permissions
const filterItemsByPermissions = (items, permissions, department) => {
  if (!permissions || !department) {
    return items;
  }

  return items
    .map((item) => {
      if (!canAccessSidebarEntry(permissions, department, item)) {
        return null;
      }

      if (!item.subItems?.length) {
        return item;
      }

      const parentModule = item.module || null;
      const filteredSubItems = item.subItems.filter((subItem) =>
        canAccessSidebarEntry(permissions, department, subItem, parentModule),
      );

      if (!filteredSubItems.length) {
        if (!item.path) return null;
        // No permitted children — render parent as a plain link
        const { subItems: _removed, ...rest } = item;
        return rest;
      }

      return {
        ...item,
        subItems: filteredSubItems,
      };
    })
    .filter(Boolean);
};

// Get sidebar configuration based on user role, department, and permissions
export const getSidebarConfig = (user, permissions = null) => {
  if (!user) return [];

  const isSuperAdminRole = user.role === 'super_admin';
  const isSuperAdminPermission = isSuperAdmin(permissions);
  const isUser = user.role === 'user';
  const isCeoRole = user.role === 'ceo' || user.role === 'pa';
  const isCeoDepartment = user.department === 'ceo';

  // Super admin: DMS Menu (admin) + dedicated Fund Raising list + Tasks + Communication + CEO Office.
  // Fund Raising is included explicitly so Aid Applications / Aid People are easy to find
  // (not only nested under DMS Menu → Fund Raising).
  if (isSuperAdminRole || isSuperAdminPermission) {
    const sections = [
      departmentConfigs.admin(false),
      departmentConfigs.fund_raising(false),
      departmentConfigs.ceo_office(false),
    ];
    sections.push(buildSuperAdminTaskingGroup());
    sections.push(buildSuperAdminComplaintsGroup());
    const superAdminComplaintCaseGroup = buildComplaintCaseGroup(user, permissions);
    if (superAdminComplaintCaseGroup) sections.push(superAdminComplaintCaseGroup);
    sections.push(departmentConfigs.email_templates());
    return sections;
  }

  // CEO / PA role or CEO department: include CEO Office section but with items filtered by actual permissions
  if (isCeoRole || isCeoDepartment) {
    const sections = [];

    if (permissions) {
      const permissionSections = allDepartmentItems(isUser)
        .map((config) => {
          const filteredItems = filterItemsByPermissions(
            config.items,
            permissions,
            config.id,
          );

          return {
            ...config,
            items: filteredItems,
          };
        })
        .filter((section) => section.items.length > 0);
      sections.push(...permissionSections);
    }

    const unifiedTaskingGroup = buildUnifiedTaskingGroup(user, permissions);
    if (unifiedTaskingGroup) {
      sections.push(unifiedTaskingGroup);
    }

    const unifiedComplaintsGroup = buildUnifiedComplaintsGroup(user, permissions);
    if (unifiedComplaintsGroup) {
      sections.push(unifiedComplaintsGroup);
    }

    const complaintCaseGroup = buildComplaintCaseGroup(user, permissions);
    if (complaintCaseGroup) {
      sections.push(complaintCaseGroup);
    }

    return sections;
  }

  // For non-super-admin users, sidebar is derived from permission map only.
  if (!permissions) return [];

  const sections = allDepartmentItems(isUser)
    .map((config) => {
      const filteredItems = filterItemsByPermissions(
        config.items,
        permissions,
        config.id,
      );

      return {
        ...config,
        items: filteredItems,
      };
    })
    .filter((section) => section.items.length > 0);

  const unifiedTaskingGroup = buildUnifiedTaskingGroup(user, permissions);
  if (unifiedTaskingGroup) {
    sections.push(unifiedTaskingGroup);
  }

  const unifiedComplaintsGroup = buildUnifiedComplaintsGroup(user, permissions);
  if (unifiedComplaintsGroup) {
    sections.push(unifiedComplaintsGroup);
  }

  const complaintCaseGroup = buildComplaintCaseGroup(user, permissions);
  if (complaintCaseGroup) {
    sections.push(complaintCaseGroup);
  }

  return sections;
};

export default getSidebarConfig; 
