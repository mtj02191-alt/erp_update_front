// Vulnerabilities list for ration_report
export const ration_vulnerabilities = [
  'Widows',
  'Divorced',
  'Disable',
  'Indegent',
  'Orphan'
];

// Vulnerabilities list for marriage_gifts
export const marriage_gifts_vulnerabilities = [
  'Orphans',
  'Divorced',
  'Disable',
  'Indegent'
];

// Vulnerabilities list for financial_assistance
export const financial_assistance_vulnerabilities = [
  'Widow',
  'Divorced',
  'Disable',
  'Extreme Poor'
]; 

// Vulnerabilities list for sewing_machine
export const sewing_machine_vulnerabilities = [
  'Orphans',
  'Divorced',
  'Disable',
  'Indegent'
]; 

// Vulnerabilities list for wheel_chair_or_crutches
export const wheel_chair_or_crutches_vulnerabilities = [
  'Orphans',
  'Divorced',
  'Disable',
  'Indegent'
];

// Vulnerabilities list for health
export const health_vulnerabilities = [
  'Widows',
  'Divorced',
  'Disable',
  'Indegent',
  'Orphans',
];

// Vulnerabilities list for education
export const education_vulnerabilities = [
  'Orphans',
  'Divorced',
  'Disable',
  'Indegent'
];

// Vulnerabilities list for water
export const water_program_systems = [
  'Hand Pump Indoor',
  'Hand Pump Outdoor',
  'Water Motor Indoor',
  'Water Motor Outdoor',
  'Affrideve HP',
  'WF PLANT'
];

// Activity types for water program
export const water_activity_types = [
  'Survey', 'Installation', 'Monitoring'
];

// Centers list for kasb program
export const kasb_centers = [
  'Tulamba',
  'Abdul Hakim'
];

// All vulnerabilities types in program 
export const program_vulnerabilities = [
  { id: 1, key: 'widows', title: 'Widows' },
  { id: 2, key: 'orphans', title: 'Orphans' },
  { id: 3, key: 'women_headed_households', title: 'Women-Headed Households' },
  { id: 4, key: 'divorced_women', title: 'Divorced Women' },
  { id: 5, key: 'abandoned_women', title: 'Abandoned Women' },
  { id: 6, key: 'people_with_disabilities', title: 'People with Disabilities' },
  { id: 7, key: 'elderly_no_support', title: 'Elderly with No Support' },
  { id: 8, key: 'daily_wage_laborers', title: 'Daily Wage Laborers' },
  { id: 9, key: 'idps', title: 'Internally Displaced Persons (IDPs)' },
  { id: 10, key: 'religious_minorities', title: 'Religious Minorities in Need' },
  { id: 11, key: 'desert_area_inhabitants', title: 'Desert Area Inhabitants (e.g., Tharparkar)' },
  { id: 12, key: 'unemployed_youth', title: 'Unemployed Youth' },
  { id: 13, key: 'students_ultra_poor', title: 'Students from Ultra-Poor Families' },
  { id: 14, key: 'malnourished_families', title: 'Malnourished Families' },
  { id: 15, key: 'natural_disaster_victims', title: 'Victims of Natural Disasters' },
];

// All programs list
export const programs_list = [ 
  { id: 1, key: 'food_security', label: 'Food Security', logo: '/public/assets/images/program_logos/ration.png' },
  { id: 2, key: 'community_services', label: 'Community Services', logo: '/public/assets/images/program_logos/ration.png' },
  { id: 3, key: 'education', label: 'Education', logo: '/public/assets/images/program_logos/education.png' },
  { id: 4, key: 'water_clean_water', label: 'Water & Clean Water', logo: '/public/assets/images/program_logos/water.png' },
  { id: 5, key: 'kasb', label: 'KASB', logo: '/public/assets/images/program_logos/kasb.png' },
  { id: 6, key: 'green_initiative', label: 'Green Initiative', logo: '/public/assets/images/program_logos/kasb.png' },
  { id: 7, key: 'widows_and_orphans_care_program', label: 'Widows and Orphans Care Program', logo: '/public/assets/images/program_logos/maskan.png' },
  { id: 8, key: 'livelihood_support_program', label: 'Livelihood Support Program', logo: '/public/assets/images/program_logos/kasb.png' },
  { id: 9, key: 'disaster_management', label: 'Disaster Management', logo: '/public/assets/images/program_logos/disaster_management.png' },
];

/** Subprograms: `program_id` matches `programs_list[].id` */
export const subprograms_list = [
  { id: 1, program_id: 1, key: 'food_security_general', label: 'General distribution' },
  { id: 2, program_id: 1, key: 'food_security_targeted', label: 'Targeted assistance' },
  { id: 3, program_id: 2, key: 'community_services_general', label: 'General' },
  { id: 4, program_id: 2, key: 'community_services_outreach', label: 'Outreach' },
  { id: 5, program_id: 3, key: 'education_general', label: 'General' },
  { id: 6, program_id: 3, key: 'education_scholarships', label: 'Scholarships' },
  { id: 7, program_id: 4, key: 'water_hand_pumps', label: 'Hand pumps' },
  { id: 8, program_id: 4, key: 'water_filtration', label: 'Filtration systems' },
  { id: 9, program_id: 5, key: 'kasb_tulamba', label: 'Tulamba center' },
  { id: 10, program_id: 5, key: 'kasb_abdul_hakim', label: 'Abdul Hakim center' },
  { id: 11, program_id: 6, key: 'green_initiative_general', label: 'General' },
  { id: 12, program_id: 6, key: 'green_initiative_afforestation', label: 'Afforestation' },
  { id: 13, program_id: 7, key: 'wocp_general', label: 'General' },
  { id: 14, program_id: 7, key: 'wocp_shelter', label: 'Shelter support' },
  { id: 15, program_id: 8, key: 'livelihood_general', label: 'General' },
  { id: 16, program_id: 8, key: 'livelihood_skills', label: 'Skills training' },
  { id: 17, program_id: 9, key: 'disaster_relief', label: 'Relief operations' },
  { id: 18, program_id: 9, key: 'disaster_preparedness', label: 'Preparedness' },
];

/** Resolve display labels from keys (e.g. for read-only views). */
export const getProgramLabelByKey = (key) => {
  if (key == null || key === '') return '';
  return programs_list.find((p) => p.key === key)?.label ?? key;
};

export const getSubprogramLabelByKey = (key) => {
  if (key == null || key === '') return '';
  return subprograms_list.find((s) => s.key === key)?.label ?? key;
};


export const projectCards = [
  { 
    id: 'health', 
    title: "Health", 
    price: 5000, 
    new: false,
    category: "General",
    initiatives: [
      { id: 'health-patient-care', title: 'Patient Care', subtitle: 'Initiative Per Patient', price: 10000,
        description:'The per patient cost includes consultancy fees, diagnostic tests, and the cost of medicines',
        duration: 'One time'
       },
      { id: 'health-medical-support', title: 'Medical Support', subtitle: 'Initiative Per Beneficiary', price: 40000,
        description: 'Medical Support Initiative provides direct financial assistance — with payments made straight to partner hospitals — for deserving patients who cannot afford essential surgical procedures. This program supports a broad range of surgeries, including gynecological, orthopedic, and other critical medical interventions, ensuring that vulnerable individuals receive timely, safe, and life-enhancing treatment.',
        duration: 'One time'
      },
      { id: 'health-rehabilitation-pwds', title: 'Rehabilitation of PWDs', subtitle: 'Per Beneficiary', price: 20000,
        description: 'This initiative focuses on restoring independence and mobility for individuals with physical disabilities or mobility impairments. By providing wheelchairs, crutches, walkers, and other mobility aids, we aim to remove the barriers that limit their access to education, healthcare, employment, and social participation.',
        duration: 'One time'
      }
    ]
  },
  { 
    id: 'education', 
    title: "Education", 
    price: 3000, 
    new: false,
    category: "General",
    initiatives: [
      { id: 'education-scholarship', title: 'Scholarship', subtitle: 'Per Student/Per Month', price: 15000,
        description: 'The monthly scholarship for deserving students encompasses various expenses, including tuition fees, accommodation, food, and stationery costs. This comprehensive support aims to alleviate the financial burden on students and ensure their continued access to education.',
        duration: 'Minimum 2-years'
      },
      { id: 'education-dream-school', title: 'Dream School', subtitle: 'Per School/Per Month', price: 35000,
        description: 'Dream Schools is a flagship educational initiative designed to bring out-of-school and deserving children back into the learning environment. Each Dream School accommodates 40 students and provides a complete package of support including free books, uniforms, school bags, and shoes, ensuring that no child is deprived of education due to financial barriers.',
        duration: '4-Years Session'
      },
      { id: 'education-hafiz', title: 'For Hafiz', subtitle: 'Per Student/Per Month', price: 5000,
        description: 'The monthly expenses for a Hafiz include various components such as the teacher\'s salary, operational expenses, and other essential costs associated with their education and well-being.',
        duration: '2-Years Session'
      },
      { id: 'education-alim', title: 'For Alim', subtitle: 'Per Student/Per Month', price: 18000,
        description: 'The monthly expenses for an Alim student typically encompass fees, boarding and lodging costs, as well as food expenses. These components collectively contribute to their educational and living requirements.',
        duration: '6-Years'
      }
    ]
  },
  { 
    id: 'clean-water', 
    title: "Clean Water", 
    price: 2000, 
    new: true,
    category: "General",
    initiatives: [
      { id: 'clean-water-hand-pump', title: 'Hand Pump', subtitle: 'Per Unit', price: 80000,
        description: 'Projects involving hand pumps cater to varying depths of water levels to ensure access to clean water across different regions',
        duration: 'One time'
      },
      { id: 'clean-water-afridev', title: 'Afridev Community Hand Pump', subtitle: 'Per Unit', price: 125000,
        description: 'The Afridev Community Hand Pump is highly recommended for areas with low water levels, as it is specifically designed to efficiently extract water from shallow depths.',
        duration: 'One time'
      },
      { id: 'clean-water-filtration-plant-1', title: 'Filtration Plant(without construction)', subtitle: 'Per Unit : Filtration Plant (without construction 1.5 Million)', price: 1500000,
        description: 'This initiative will be carried out with active community participation and contributions. It encompasses all expenses related to the RO filtration plant, excluding civil construction work.',
        duration: 'One time'
      },
      { id: 'clean-water-filtration-plant-2', title: 'Filtration Plant', subtitle: 'Filtration Plant Per Unit (2.5 Million)', price: 2500000, 
        description: 'This initiative will be implemented without community participation or contributions. It covers all expenses related to the Solarized RO filtration plant (fully automated), including solar system, equipment, machinery, and civil construction work.',
        duration: 'One time'
      },
      { id: 'clean-water-solar-pump', title: 'Solar Submersible Pump', subtitle: 'Per Unit', price: 250000,
        description: 'For plains areas, the project entails borehole drilling, installation of a submersible pump, utilization of 4 solar panels, and provision of water tanks.',
        duration: 'One time'
      },
      { id: 'clean-water-solar-turbine', title: 'Solar Submersible Pump / Turbine', subtitle: 'Per Unit', price: 500000,
        description: 'For desert areas, the initiative comprises borehole drilling, installation of a submersible pump/turbine, construction of room, incorporation of 8 solar panels, and provision of water tanks.',
        duration: 'One time'
      }
    ]
  },
  { 
    id: 'apna-ghar',
    title: "Apna Ghar",
    price: 10000, 
    new: false, 
    category: "Sadqa",
     initiatives: [] 
    },
  { 
    id: 'disaster-management',
    title: "Gaza Relief",
    price: 5000, new: false,
    category: "General",
    initiatives: []    
   },
  { 
    id: 'kasb-skill-development', 
    title: "KASB Skill Development", 
    price: 4000, 
    new: false,
    category: "General",
    initiatives: [
      { id: 'kasb-empowering-woman', title: 'Empowering a Woman', subtitle: 'Per Beneficiary', price: 100000,
        description: 'This initiative is particularly recommended for woman-headed families to promote sustainable livelihoods.',
        duration: 'One time'
      }
    ]
  },
  { 
    id: 'seeds-of-change', 
    title: "Seeds of Change", 
    price: 2500, 
    new: false,
    category: "General",
    initiatives: [
      { id: 'seeds-of-change-plant', title: 'SEEDS OF CHANGE', subtitle: 'Per Plant', price: 750 }
    ]
  },
  {
     id: 'qurbani-baraye-mustehqeen', 
     title: "Qurbani Baraye Mustehqeen",
     price: 15000,
     new: false, 
     category: "Zakat", 
     initiatives:[
      {
        id: 'qurbani-baraye-mustehqeen-1', title: 'Cow Share', subtitle: 'Cow Share', price: 24500, templateCode: "cow_share",
      },
      {
        id: 'qurbani-baraye-mustehqeen-2', title: 'Full Cow', subtitle: 'Full Cow', price: 171500, templateCode: "cow",
      },
      {
        id: 'qurbani-baraye-mustehqeen-3', title: 'Goat', subtitle: 'Goat', price: 58000, templateCode: "goat",
      }
     ]
     },

  {
     id: 'aas-lab-diagnostics', 
     title: "Aaslab",
     price: 3500, 
     new: false, 
     category: "General", 
     initiatives:[] },
  { 
    id: 'community-services', 
    title: "Community Service", 
    price: 3000, 
    new: false,
    category: "General",
    initiatives: [
      { id: 'community-feed-family', title: 'Feed a Family for whole month', subtitle: 'Per Family', price: 8500,
        description: 'The monthly ration for deserving families includes essential food items necessary for their sustenance. This support helps alleviate food insecurity and ensures that these families have access to nutritious meals on a regular basis.',
        duration: '1-Year' 
      },
      { id: 'community-ramzan-ration', title: 'Ramadan Ration', subtitle: 'Per Family', price: 9600,
        description: 'The monthly ration for deserving families includes essential food items necessary for their sustenance. This support helps alleviate food insecurity and ensures that these families have access to nutritious meals on a regular basis.',
        duration: 'One time'
      },
      { id: 'marriage-gift-distribution', title: 'Marriage Gift', subtitle: 'Per Benificiary', price: 150000,
        description: 'This initiative is aimed at deserving girls whose families are unable to make arrangements for their marriage, providing them with essential support for their marital journey.',
        duration: 'One time'
      },
    ]
  },
]