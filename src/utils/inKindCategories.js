/** Shared in-kind catalog / donation line category options. */
export const IN_KIND_CATEGORY_OPTIONS = [
  { value: 'clothing', label: 'Clothing' },
  { value: 'food', label: 'Food' },
  { value: 'medical', label: 'Medical' },
  { value: 'educational', label: 'Educational' },
  { value: 'electronics', label: 'Electronics' },
  { value: 'furniture', label: 'Furniture' },
  { value: 'books', label: 'Books' },
  { value: 'toys', label: 'Toys' },
  { value: 'household', label: 'Household' },
  { value: 'food_items', label: 'Food Items' },
  { value: 'beverages_refreshments', label: 'Beverages & Refreshments' },
  { value: 'clothing_apparel', label: 'Clothing & Apparel' },
  { value: 'hygiene_personal_care', label: 'Hygiene & Personal Care' },
  { value: 'medical_supplies', label: 'Medical Supplies' },
  { value: 'education_stationery', label: 'Education & Stationery' },
  { value: 'household_items', label: 'Household Items' },
  { value: 'relief_emergency', label: 'Relief & Emergency Items' },
  { value: 'it_electronics', label: 'IT & Electronics' },
  { value: 'construction_materials', label: 'Construction Materials' },
  { value: 'agriculture_plantation', label: 'Agriculture & Plantation' },
  { value: 'office_supplies', label: 'Office Supplies' },
  { value: 'other', label: 'Other / Miscellaneous' },
];

export const IN_KIND_CATEGORY_LABELS = IN_KIND_CATEGORY_OPTIONS.reduce(
  (acc, opt) => {
    acc[opt.value] = opt.label;
    return acc;
  },
  {},
);

export const getInKindCategoryLabel = (category) => {
  if (!category) return '—';
  const key = String(category).toLowerCase();
  return IN_KIND_CATEGORY_LABELS[key] || category;
};
