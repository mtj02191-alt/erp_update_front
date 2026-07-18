// Sidebar configuration for different user roles and departments
import { canViewModule, isSuperAdmin } from '../../../utils/permissions';
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
  FiCreditCard,
  FiAlertCircle,
  FiBookmark,
  FiCoffee
} from 'react-icons/fi';
import { departments } from '../../../utils/admin';

const TASK_MODULE_KEYS = new Set(['tasks', 'tasking']);

const TASKS_LIST_PATH = '/tasks/list';
const TASKS_DASHBOARD_PATH = '/tasks/dashboard';

const hasGlobalTaskingAccess = (permissions) => (
  permissions?.tasks?.view === true ||
  permissions?.tasks?.list_view === true ||
  permissions?.tasking?.tasks?.view === true ||
  permissions?.tasking?.tasks?.list_view === true ||
  permissions?.tasking?.dashboard?.view === true ||
  permissions?.tasking?.dashboard?.list_view === true
);

const hasAnyDepartmentTaskAccess = (permissions) => {
  if (!permissions) return false;
  return departments.some(
    (dept) =>
      canViewModule(permissions, dept, 'tasks') ||
      canViewModule(permissions, dept, 'tasking'),
  );
};

const shouldShowUnifiedTasking = (permissions) =>
  hasGlobalTaskingAccess(permissions) || hasAnyDepartmentTaskAccess(permissions);

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

/** Super admin: single Tasks section (flat `/tasks/...` routes). */
const buildSuperAdminTaskingGroup = () => ({
  id: 'tasking_global',
  label: 'Tasks',
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

const accountsFinanceDepartmentItems = (isUser = false) => [
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
    path: '/accounts_and_finance/reports/list',
    type: 'list',
    module: 'reports',
    icon: FiDollarSign
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
      { label: 'Program Dashboard', path: '/program', type: 'list', icon: FiHome },
      { label: 'Progress Tracking (Trackers)', path: '/progress/trackers', type: 'list', icon: FiTrendingUp },
      { label: 'Progress Tracking (Create Tracker)', path: '/progress/trackers/add', type: 'create', icon: FiPlusCircle },
      { label: 'Progress Tracking (Templates)', path: '/progress/templates', type: 'list', icon: FiLayers },
      { label: 'Progress Tracking (Create Template)', path: '/progress/templates/add', type: 'create', icon: FiPlusCircle },
      {label: "Application Reports", path: "/program/applications_reports", type: "list", icon: FiFileText},
      {label: "ration_report", path: "/program/ration_report/list", type: "list", icon: FiBox},
      {label: "marriage_gifts", path: "/program/marriage_gifts/reports/list", type: "list", icon: FiGift},
      {label: "financial_assistance", path: "/program/financial_assistance/reports/list", type: "list", icon: FiDollarSign},
      {label: "sewing_machine", path: "/program/sewing_machine/reports/list", type: "list", icon: FiSettings},
      {label: "wheel_chair_or_crutches", path: "/program/wheel_chair_or_crutches/reports/list", type: "list", icon: FiLifeBuoy},
      {label: "health", path: "/program/health/reports/list", type: "list", icon: FiHeart},
      {label: "water", path: "/program/water/reports/list", type: "list", icon: FiDroplet},
      {label: "kasb", path: "/program/kasb/reports/list", type: "list", icon: FiBriefcase},
      {label: "kasb_training", path: "/program/kasb-training/reports", type: "list", icon: FiBookOpen},
      {label: "education", path: "/program/education/reports/list", type: "list", icon: FiBook},
      {label: "tree_plantation", path: "/program/tree_plantation/reports/list", type: "list", icon: FiFeather},
      {label: "area_ration", path: "/program/area_ration/reports/list", type: "list", icon: FiMapPin},
      {label: "targets", path: "/program/targets/reports/list", type: "list", icon: FiTarget},
      {label: "AAS Collection Centers", path: "/program/aas_collection_centers_reports", type: "list", icon: FiFileText},
      {label: "Al Hasanain CLG", path: "/program/al_hasanain_clg", type: "list", icon: FiBook},
      {label: "programs", path: "/program/programs", type: "list", icon: FiGrid},
      {label: "Dream Schools", path: "/program/dream_schools", type: "list", icon: FiBookmark},
      {label: "Dream School Reports", path: "/program/dream_school_reports", type: "list", icon: FiFileText},
      {label: "subprograms", path: "/program/subprograms", type: "list", icon: FiList}
    ]
  },
  {
    label: 'Store',
    path: '/store',
    type: 'list',
    module: 'store_admin',
    icon: FiArchive,
    subItems: [
      {label: "store_reports", path: "/store/reports/list", type: "list", icon: FiBarChart2}
    ]
  },
  {
    label: 'Fund Raising',
    path: '/fund_raising',
    type: 'list',
    module: 'fund_raising_admin',
    icon: FiHeart,
    subItems: [ 
      {label: "donations", path: "/donations/online_donations/list", type: "list", icon: FiCreditCard},
      {label: "donation_box", path: "/dms/donation_box/list", type: "list", icon: FiBox},
      {label: "donation_box_donations", path: "/dms/donation-box-donations/list", type: "list", icon: FiPackage},
      {label: "Donor", path: "/dms/donors/list", type: "list", icon: FiUsers},
      {label: "volunteers", path: "/dms/volunteers/list", type: "list", icon: FiUserPlus},
      {label: "surveys", path: "/dms/surveys/list", type: "list", icon: FiClipboard},
      {label: "events", path: "/dms/events/list", type: "list", icon: FiCalendar},
      {label: "campaigns", path: "/dms/campaigns/list", type: "list", icon: FiFlag}
    ]
  },
  {
    label: 'Geographic',
    path: '/dms/geographic/countries/list',
    type: 'list',
    module: 'geographic_admin',
    icon: FiGlobe,
    subItems: [
      { label: 'Countries', path: '/dms/geographic/countries/list', type: 'list', icon: FiGlobe },
      { label: 'Regions', path: '/dms/geographic/regions/list', type: 'list', icon: FiMap },
      { label: 'Districts', path: '/dms/geographic/districts/list', type: 'list', icon: FiMap },
      { label: 'Tehsils', path: '/dms/geographic/tehsils/list', type: 'list', icon: FiMap },
      { label: 'Cities', path: '/dms/geographic/cities/list', type: 'list', icon: FiMapPin },
      { label: 'Routes', path: '/dms/geographic/routes/list', type: 'list', icon: FiNavigation }
    ]
  },
  {
    label: 'Procurements',
    path: '/procurements',
    type: 'list',
    module: 'procurements_admin',
    icon: FiShoppingCart,
    subItems: [
      {label: "procurements_reports", path: "/procurements/reports/list", type: "list", icon: FiBarChart2}
    ]
  },
  {
    label: 'Accounts & Finance',
    path: '/accounts_and_finance',
    type: 'list',
    module: 'accounts_finance_admin',
    icon: FiDollarSign,
    subItems: [
      {label: "accounts_and_finance_reports", path: "/accounts_and_finance/reports/list", type: "list", icon: FiBarChart2}
    ]
  },
  {
    label: 'IT',
    path: '/it',
    type: 'list',
    module: 'it_admin',
    icon: FiCpu,
    subItems: [
      {label: "it_reports", path: "/it/reports/list", type: "list", icon: FiBarChart2}
    ]
  },
  {
    label: 'Marketing',
    path: '/marketing',
    type: 'list',
    module: 'marketing_admin',
    icon: FiTrendingUp,
    subItems: [
      {label: "marketing_reports", path: "/marketing/reports/list", type: "list", icon: FiBarChart2}
    ]
  },
  {
    label: 'Audio Video',
    path: '/audio_video',
    type: 'list',
    module: 'audio_video_admin',
    icon: FiVideo,
    subItems: [
      {label: "audio_video_reports", path: "/audio_video/reports/list", type: "list", icon: FiBarChart2}
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
      { label: 'Applications', path: '/hr/career/applications/list', type: 'list', icon: FiFileText }
    ]
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
  }
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
  //   label: 'Complaints',
  //   path: '/hr/complaints/list',
  //   type: 'list',
  //   module: 'complaints',
  //   subItems: [
  //     { label: 'Complaints List', path: '/hr/complaints/list', type: 'list', module: 'complaints' },
  //     { label: 'Complaints Dashboard', path: '/hr/complaints/reports', type: 'list', module: 'complaints' }
  //   ]
  // }
];

const geographicItems = (isUser = false) => [
  { label: 'Countries', path: '/dms/geographic/countries/list', type: 'list', module: 'geographic_countries', icon: FiGlobe },
  { label: 'Regions', path: '/dms/geographic/regions/list', type: 'list', module: 'geographic_regions', icon: FiMap },
  { label: 'Districts', path: '/dms/geographic/districts/list', type: 'list', module: 'geographic_districts', icon: FiMap },
  { label: 'Tehsils', path: '/dms/geographic/tehsils/list', type: 'list', module: 'geographic_tehsils', icon: FiMap },
  { label: 'Cities', path: '/dms/geographic/cities/list', type: 'list', module: 'geographic_cities', icon: FiMapPin },
  { label: 'Routes', path: '/dms/geographic/routes/list', type: 'list', module: 'geographic_routes', icon: FiNavigation }
];

const fundRaisingDepartmentItems = (isUser = false) => [
  {
    label: 'Donations',
    path: '/donations/online_donations/list',
    type: 'list',
    module: 'online_donations',
    icon: FiCreditCard
  },
  // {
  //   label: 'Offline Donations',
  //   path: '/donations/offline_donations/list',
  //   type: 'list',
  //   module: 'offline_donations'
  // },
  {
    label: 'Donor',
    path: '/dms/donors/list',
    type: 'list',
    module: 'donors',
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
    label: 'Volunteers',
    path: '/dms/volunteers/list',
    type: 'list',
    module: 'volunteers',
    icon: FiUserPlus
  },
  {
    label: 'Surveys',
    path: '/dms/surveys/list',
    type: 'list',
    module: 'surveys',
    icon: FiClipboard
  },
  {
    label: 'Events',
    path: '/dms/events/list',
    type: 'list',
    module: 'events',
    icon: FiCalendar
  },
  {
    label: 'Campaigns',
    path: '/dms/campaigns/list',
    type: 'list',
    module: 'campaigns',
    icon: FiFlag
  },
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
  //   label: 'Complaints',
  //   path: '/it/complaints/list',
  //   type: 'list',
  //   module: 'complaints',
  //   subItems: [
  //     { label: 'Complaints List', path: '/it/complaints/list', type: 'list', module: 'complaints' },
  //     { label: 'Complaints Dashboard', path: '/it/complaints/reports', type: 'list', module: 'complaints' }
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
  //   label: 'Complaints',
  //   path: '/marketing/complaints/list',
  //   type: 'list',
  //   module: 'complaints',
  //   subItems: [
  //     { label: 'Complaints List', path: '/marketing/complaints/list', type: 'list', module: 'complaints' },
  //     { label: 'Complaints Dashboard', path: '/marketing/complaints/reports', type: 'list', module: 'complaints' }
  //   ]
  // }
];

// Audio Video department menu
const audioVideoDepartmentItems = () => [
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
  //   label: 'Complaints',
  //   path: '/audio_video/complaints/list',
  //   type: 'list',
  //   module: 'complaints',
  //   subItems: [
  //     { label: 'Complaints List', path: '/audio_video/complaints/list', type: 'list', module: 'complaints' },
  //     { label: 'Complaints Dashboard', path: '/audio_video/complaints/reports', type: 'list', module: 'complaints' }
  //   ]
  // }
];

// Email Templates module items
const ceoOfficeItems = () => [
  {
    label: 'CEO Dashboard',
    path: '/ceo-office/dashboard',
    type: 'list',
    module: 'ceo_office',
    icon: FiCoffee
  },
  // {
  //   label: 'Quick CEO Note',
  //   path: '/ceo-office/quick-note',
  //   type: 'create',
  //   module: 'ceo_office',
  //   icon: FiPlusCircle
  // },
  // {
  //   label: 'Instruction Register',
  //   path: '/ceo-office/instruction-register',
  //   type: 'list',
  //   module: 'ceo_office',
  //   icon: FiList
  // },
  // {
  //   label: 'Project Command Sheets',
  //   path: '/ceo-office/project-command-sheets',
  //   type: 'list',
  //   module: 'ceo_office',
  //   icon: FiBriefcase
  // },
  // {
  //   label: 'Visitors / Calls',
  //   path: '/ceo-office/visitors',
  //   type: 'list',
  //   module: 'ceo_office',
  //   icon: FiUsers
  // }
];

const emailTemplatesItems = () => [
  {
    label: 'Email Templates',
    path: '/dms/email_templates/list',
    type: 'list',
    module: 'email_templates',
    icon: FiMail,
    subItems: [
      { label: 'Templates List', path: '/dms/email_templates/list', type: 'list', icon: FiList },
      { label: 'Add Template', path: '/dms/email_templates/add', type: 'list', icon: FiPlusCircle }
    ]
  }
];

// All department items for permission-based access
const allDepartmentItems = (isUser = false) => [
  {
    id: 'ceo_office',
    label: 'CEO Office',
    icon: FiCoffee,
    items: ceoOfficeItems()
  },
  {
    id: 'program',
    label: 'Program Department',
    icon: FiLayers,
    items: programDepartmentItems(isUser)
  },
  {
    id: 'store',
    label: 'Store Department',
    icon: FiArchive,
    items: storeDepartmentItems(isUser)
  },
  {
    id: 'procurements',
    label: 'Procurements Department',
    icon: FiShoppingCart,
    items: procurementsDepartmentItems(isUser)
  },
  {
    id: 'accounts_and_finance',
    label: 'Accounts & Finance',
    icon: FiDollarSign,
    items: accountsFinanceDepartmentItems(isUser)
  },
  {
    id: 'admin',
    label: 'Admin Panel',
    icon: FiHome,
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
  {
    id: 'audio_video',
    label: 'Audio Video',
    icon: FiVideo,
    items: audioVideoDepartmentItems(isUser)
  },
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
  
  store: (isUser = false) => ({
    id: 'store',
    label: 'Store Department',
    icon: FiArchive,
    items: storeDepartmentItems(isUser)
  }),
  
  procurements: (isUser = false) => ({
    id: 'procurements',
    label: 'Procurements Department',
    icon: FiShoppingCart,
    items: procurementsDepartmentItems(isUser)
  }),
  
  accounts_and_finance: (isUser = false) => ({
    id: 'accounts_and_finance',
    label: 'Accounts & Finance',
    icon: FiDollarSign,
    items: accountsFinanceDepartmentItems(isUser)
  }),
  
  admin: (isUser = false) => ({
    id: 'admin',
    label: 'Admin Panel',
    icon: FiHome,
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
 
// Filter items based on user permissions
const filterItemsByPermissions = (items, permissions, department) => {
  if (!permissions || !department) {
    return items; // Return all items if no permissions (fallback)
  }

  return items.filter(item => {
    // Tasks are shown from a dedicated global Tasking section only.
    if (item.module && TASK_MODULE_KEYS.has(item.module)) {
      return false;
    }

    // If item has no module, show it (for backward compatibility)
    if (!item.module) {
      return true;
    }

    // Check if user has permission to view this module
    return canViewModule(permissions, department, item.module);
  });
};

// Get sidebar configuration based on user role, department, and permissions
export const getSidebarConfig = (user, permissions = null) => {
  if (!user) return [];

  const isSuperAdminRole = user.role === 'super_admin';
  const isSuperAdminPermission = isSuperAdmin(permissions);
  const isUser = user.role === 'user';

  // Super admin: CEO Office + Admin Panel + one Tasks group (list + dashboard only; no per-department task rows).
  if (isSuperAdminRole || isSuperAdminPermission) {
    const sections = [
      departmentConfigs.ceo_office(false),
      departmentConfigs.admin(false)
    ];
    sections.push(buildSuperAdminTaskingGroup());
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

  return sections;
};

export default getSidebarConfig; 
