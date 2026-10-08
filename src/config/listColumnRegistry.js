/**
 * List column registry (product defaults).
 *
 * Purpose:
 * - Declare which columns exist on each listing screen
 * - Control desktop vs mobile visibility / order from one place
 *
 * Future SaaS (without changing list components' contract):
 * - Product defaults  → this file
 * - Tenant overrides  → DB
 * - Role / user prefs → DB
 * Resolver will merge: defaults ← tenant ← role ← user
 *
 * Lists should eventually call `resolveListColumns(screenKey, viewport)`
 * instead of hardcoding <th>/<td> visibility.
 *
 * Inventory basis (2026-09): FE list screens + matching TypeORM entities.
 * Screens without a table UI (todos cards, allotment inbox) are omitted.
 */

/** @typedef {'desktop' | 'mobile'} ListViewport */

/**
 * @typedef {Object} ListColumnDef
 * @property {string} id
 * @property {string} label
 * @property {boolean} [sortable]
 * @property {boolean} [required]     Always shown if true (ignore view hide)
 * @property {number} [priority]      Lower = more important
 * @property {boolean} [hideOnMobile] Product default: omit from mobile view
 * @property {boolean} [mobileOnly]   Shown on mobile only (replaces hidden desktop cols)
 */

/**
 * @typedef {Object} ListColumnViewConfig
 * @property {string[]} visible
 */

/**
 * @typedef {Object} ListScreenColumnConfig
 * @property {string} screenKey
 * @property {string} label
 * @property {string} [entity]        Primary TypeORM entity / table hint
 * @property {ListColumnDef[]} columns
 * @property {{ desktop: ListColumnViewConfig, mobile: ListColumnViewConfig }} views
 */

/**
 * Build a screen entry. Desktop = all non-mobileOnly ids.
 * Mobile = explicit override, else all ids except hideOnMobile (mobileOnly kept).
 *
 * @param {Omit<ListScreenColumnConfig, 'views'> & { mobileVisible?: string[] }} cfg
 * @returns {ListScreenColumnConfig}
 */
function defineScreen(cfg) {
  const { mobileVisible, ...rest } = cfg;
  const desktopIds = rest.columns
    .filter((c) => !c.mobileOnly)
    .map((c) => c.id);
  // hideOnMobile wins over required (e.g. Actions hidden on some program lists)
  const mobileIds =
    mobileVisible ||
    rest.columns
      .filter((c) => c.mobileOnly || !c.hideOnMobile)
      .map((c) => c.id);

  return {
    ...rest,
    views: {
      desktop: { visible: desktopIds },
      mobile: { visible: mobileIds },
    },
  };
}

/** @type {Record<string, ListScreenColumnConfig>} */
export const LIST_COLUMN_REGISTRY = {
  // ─── DMS / Fundraising ─────────────────────────────────────────────

  'donations.list': defineScreen({
    screenKey: 'donations.list',
    label: 'Donations list',
    entity: 'Donation / donations',
    columns: [
      { id: 'select', label: '', required: true, priority: 0 },
      { id: 'donor', label: 'Donor', sortable: true, priority: 1 },
      { id: 'csr_donor', label: 'CSR Donor', priority: 8 },
      { id: 'amount', label: 'Amount', sortable: true, priority: 2 },
      { id: 'project', label: 'Project', priority: 4, hideOnMobile: true },
      { id: 'method', label: 'Method', priority: 5, hideOnMobile: true },
      { id: 'email', label: 'Email', priority: 9, hideOnMobile: true },
      { id: 'status', label: 'Status', sortable: true, priority: 3 },
      { id: 'approve', label: 'Approve', priority: 10, hideOnMobile: true },
      { id: 'date', label: 'Date', sortable: true, priority: 6 },
      { id: 'time', label: 'Time', priority: 7, hideOnMobile: true },
      { id: 'actions', label: 'Actions', required: true, priority: 0 },
    ],
    mobileVisible: ['select', 'donor', 'amount', 'status', 'date', 'actions'],
  }),

  'donors.list': defineScreen({
    screenKey: 'donors.list',
    label: 'Donors list',
    entity: 'Donor / donors',
    columns: [
      { id: 'select', label: '', required: true, priority: 0 },
      { id: 'type', label: 'Type', priority: 3 },
      { id: 'name', label: 'Name', sortable: true, priority: 1 },
      { id: 'pipeline', label: 'Pipeline', priority: 4 },
      { id: 'email', label: 'Email', priority: 5 },
      { id: 'phone', label: 'Phone', priority: 6 },
      { id: 'city', label: 'City', priority: 7 },
      { id: 'registration_date', label: 'Registration Date', priority: 8 },
      { id: 'actions', label: 'Actions', required: true, priority: 0 },
    ],
  }),

  'donation_boxes.list': defineScreen({
    screenKey: 'donation_boxes.list',
    label: 'Donation boxes',
    entity: 'DonationBox / donation_boxes',
    columns: [
      { id: 'box_id', label: 'Box ID', priority: 1 },
      { id: 'shop_name', label: 'Shop Name', priority: 2 },
      { id: 'location', label: 'Location', priority: 3 },
      { id: 'box_type', label: 'Box Type', priority: 4 },
      { id: 'last_collection', label: 'Last Collection', priority: 5, hideOnMobile: true },
      { id: 'status', label: 'Status', priority: 6 },
      { id: 'active_since', label: 'Active Since', priority: 7 },
      { id: 'actions', label: 'Actions', required: true, priority: 0 },
    ],
  }),

  'donation_box_donations.list': defineScreen({
    screenKey: 'donation_box_donations.list',
    label: 'Donation box collections',
    entity: 'DonationBoxDonation / donation_box_donations',
    columns: [
      { id: 'id', label: 'ID', priority: 1 },
      { id: 'box', label: 'Box', priority: 2 },
      { id: 'shop', label: 'Shop', priority: 3 },
      { id: 'collection_amount', label: 'Collection Amount', priority: 4 },
      { id: 'collection_date', label: 'Collection Date', priority: 5 },
      { id: 'collected_by', label: 'Collected By', priority: 6 },
      { id: 'notes', label: 'Notes', priority: 7 },
      { id: 'actions', label: 'Actions', required: true, priority: 0 },
    ],
  }),

  'in_kind_items.list': defineScreen({
    screenKey: 'in_kind_items.list',
    label: 'In-kind items',
    entity: 'DonationInKindItem / donation_in_kind_item',
    columns: [
      { id: 'item_name', label: 'Item Name', priority: 1 },
      { id: 'category', label: 'Category', priority: 2 },
      { id: 'description', label: 'Description', priority: 3, hideOnMobile: true },
      { id: 'status', label: 'Status', priority: 4 },
      { id: 'created', label: 'Created', priority: 5, hideOnMobile: true },
      { id: 'actions', label: 'Actions', required: true, priority: 0 },
    ],
  }),

  'organizations.list': defineScreen({
    screenKey: 'organizations.list',
    label: 'CSR donors / organizations',
    entity: 'Organization / csr_donors',
    columns: [
      { id: 'name', label: 'Name', priority: 1 },
      { id: 'registration', label: 'Registration', priority: 2 },
      { id: 'city', label: 'City', priority: 3 },
      { id: 'phone', label: 'Phone', priority: 4 },
      { id: 'active', label: 'Active', priority: 5 },
      { id: 'actions', label: 'Actions', required: true, priority: 0 },
    ],
  }),

  'csr_pocs.list': defineScreen({
    screenKey: 'csr_pocs.list',
    label: 'CSR POCs',
    entity: 'CsrPoc / csr_pocs',
    columns: [
      { id: 'name', label: 'Name', priority: 1 },
      { id: 'csr_donor', label: 'CSR Donor', priority: 2 },
      { id: 'email', label: 'Email', priority: 3 },
      { id: 'phone', label: 'Phone', priority: 4 },
      { id: 'role', label: 'Role', priority: 5 },
      { id: 'branch', label: 'Branch', priority: 6 },
      { id: 'primary', label: 'Primary', priority: 7 },
      { id: 'active', label: 'Active', priority: 8 },
      { id: 'actions', label: 'Actions', required: true, priority: 0 },
    ],
  }),

  'recurring_donations.list': defineScreen({
    screenKey: 'recurring_donations.list',
    label: 'Recurring donations',
    entity: 'RecurringDonation / recurring_donations',
    columns: [
      { id: 'id', label: 'ID', priority: 1 },
      { id: 'donor', label: 'Donor', priority: 2 },
      { id: 'amount', label: 'Amount', priority: 3 },
      { id: 'billing', label: 'Billing', priority: 4 },
      { id: 'status', label: 'Status', priority: 5 },
      { id: 'payment', label: 'Payment', priority: 6 },
      { id: 'paid', label: 'Paid', priority: 7 },
      { id: 'missing', label: 'Missing', priority: 8 },
      { id: 'created', label: 'Created', priority: 9 },
      { id: 'actions', label: 'Actions', required: true, priority: 0 },
    ],
  }),

  'recurring_donors.list': defineScreen({
    screenKey: 'recurring_donors.list',
    label: 'Recurring donors',
    entity: 'Donor + RecurringDonation',
    columns: [
      { id: 'donor', label: 'Donor', priority: 1 },
      { id: 'amount', label: 'Amount', priority: 2 },
      { id: 'billing', label: 'Billing', priority: 3 },
      { id: 'status', label: 'Status', priority: 4 },
      { id: 'payment', label: 'Payment', priority: 5 },
      { id: 'installments', label: 'Installments', priority: 6 },
      { id: 'method', label: 'Method', priority: 7 },
      { id: 'created', label: 'Created', priority: 8 },
      { id: 'actions', label: 'Actions', required: true, priority: 0 },
    ],
  }),

  'event_pledges.list': defineScreen({
    screenKey: 'event_pledges.list',
    label: 'Event pledges',
    entity: 'EventPledge / event_pledges',
    columns: [
      { id: 'donor_name', label: 'Donor Name', priority: 1 },
      { id: 'contact', label: 'Contact', priority: 2 },
      { id: 'care_of', label: 'Care of / Rep', priority: 3 },
      { id: 'type', label: 'Type', priority: 4 },
      { id: 'amount', label: 'Amount', priority: 5 },
      { id: 'created', label: 'Created', priority: 6 },
      { id: 'actions', label: 'Actions', required: true, priority: 0 },
    ],
  }),

  'manual_recurring.list': defineScreen({
    screenKey: 'manual_recurring.list',
    label: 'Manual recurring pledges',
    entity: 'ManualRecurringPledge / manual_recurring_pledges',
    columns: [
      { id: 'campaign', label: 'Campaign', priority: 1 },
      { id: 'donor', label: 'Donor', priority: 2 },
      { id: 'status', label: 'Status', priority: 3 },
      { id: 'mode', label: 'Mode', priority: 4 },
      { id: 'items', label: 'Items', priority: 5 },
      { id: 'total_pledge', label: 'Total pledge', priority: 6 },
      { id: 'reminders', label: 'Reminders', priority: 7 },
      { id: 'last_reminder', label: 'Last reminder / thanks', priority: 8 },
      { id: 'actions', label: 'Actions', required: true, priority: 0 },
    ],
  }),

  'volunteers.list': defineScreen({
    screenKey: 'volunteers.list',
    label: 'Volunteers',
    entity: 'Volunteer / volunteers',
    columns: [
      { id: 'name', label: 'Name', priority: 1 },
      { id: 'email', label: 'Email', priority: 2 },
      { id: 'phone', label: 'Phone', priority: 3 },
      { id: 'city', label: 'City', priority: 4 },
      { id: 'status', label: 'Status', priority: 5 },
      { id: 'verification', label: 'Verification', priority: 6 },
      { id: 'source', label: 'Source', priority: 7 },
      { id: 'registered', label: 'Registered', priority: 8 },
      { id: 'actions', label: 'Actions', required: true, priority: 0 },
    ],
  }),

  'social_posts.list': defineScreen({
    screenKey: 'social_posts.list',
    label: 'Social posts',
    entity: 'SocialPost / social_posts',
    columns: [
      { id: 'id', label: 'ID', priority: 1 },
      { id: 'channel', label: 'Channel', priority: 2 },
      { id: 'text', label: 'Text', priority: 3 },
      { id: 'scheduled', label: 'Scheduled', priority: 4 },
      { id: 'status', label: 'Status', priority: 5 },
      { id: 'actions', label: 'Actions', required: true, priority: 0 },
    ],
  }),

  'reconciliation.list': defineScreen({
    screenKey: 'reconciliation.list',
    label: 'Reconciliations',
    entity: 'Reconciliation / reconciliations',
    columns: [
      { id: 'id', label: 'ID', priority: 1 },
      { id: 'bank', label: 'Bank', priority: 2 },
      { id: 'file', label: 'File', priority: 3 },
      { id: 'statement_period', label: 'Statement period', priority: 4 },
      { id: 'run_date', label: 'Run date', priority: 5 },
      { id: 'by', label: 'By', priority: 6 },
      { id: 'donations_created', label: 'Donations created', priority: 7 },
      { id: 'skipped', label: 'Skipped', priority: 8 },
      { id: 'failed', label: 'Failed', priority: 9 },
      { id: 'actions', label: 'Actions', required: true, priority: 0 },
    ],
  }),

  'follow_ups.list': defineScreen({
    screenKey: 'follow_ups.list',
    label: 'Donor follow-ups',
    entity: 'DonorFollowup / donor_followups',
    columns: [
      { id: 'due_date', label: 'Due date & time', priority: 1 },
      { id: 'donor', label: 'Donor', priority: 2 },
      { id: 'assigned_to', label: 'Assigned to', priority: 3 },
      { id: 'follow_up', label: 'Follow-up', priority: 4 },
      { id: 'notes', label: 'Notes', priority: 5 },
      { id: 'status', label: 'Status', priority: 6 },
    ],
  }),

  'interactions.list': defineScreen({
    screenKey: 'interactions.list',
    label: 'Donor interactions',
    entity: 'DonorInteraction / donor_interactions',
    columns: [
      { id: 'date_time', label: 'Date & Time', priority: 1 },
      { id: 'donor', label: 'Donor', priority: 2 },
      { id: 'type', label: 'Type', priority: 3 },
      { id: 'logged_by', label: 'Logged by', priority: 4 },
      { id: 'what_you_did', label: 'What you did', priority: 5 },
      { id: 'donor_response', label: 'Donor response', priority: 6 },
      { id: 'next_action', label: 'Next action', priority: 7 },
      { id: 'status', label: 'Status', priority: 8 },
    ],
  }),

  'website_donation_projects.list': defineScreen({
    screenKey: 'website_donation_projects.list',
    label: 'Website donation projects',
    entity: 'WebsiteDonationProject / website_donation_projects',
    columns: [
      { id: 'order', label: 'Order', priority: 1 },
      { id: 'title', label: 'Title', priority: 2 },
      { id: 'slug', label: 'Slug', priority: 3 },
      { id: 'category', label: 'Category', priority: 4 },
      { id: 'initiatives', label: 'Initiatives', priority: 5 },
      { id: 'catalog', label: 'Catalog', priority: 6 },
      { id: 'page', label: 'Page', priority: 7 },
      { id: 'actions', label: 'Actions', required: true, priority: 0 },
    ],
  }),

  'website_home_hero.list': defineScreen({
    screenKey: 'website_home_hero.list',
    label: 'Website home hero',
    entity: 'WebsiteHomeHeroSlide / website_home_hero_slides',
    columns: [
      { id: 'order', label: 'Order', priority: 1 },
      { id: 'preview', label: 'Preview', priority: 2 },
      { id: 'title', label: 'Title', priority: 3 },
      { id: 'link', label: 'Link', priority: 4 },
      { id: 'status', label: 'Status', priority: 5 },
      { id: 'actions', label: 'Actions', required: true, priority: 0 },
    ],
  }),

  'email_templates.list': defineScreen({
    screenKey: 'email_templates.list',
    label: 'Email templates',
    entity: 'EmailTemplate / email_templates',
    columns: [
      { id: 'name', label: 'Name', priority: 1 },
      { id: 'channels', label: 'Channels', priority: 2 },
      { id: 'purpose', label: 'Purpose', priority: 3 },
      { id: 'subject', label: 'Subject', priority: 4 },
      { id: 'status', label: 'Status', priority: 5 },
      { id: 'actions', label: 'Actions', required: true, priority: 0 },
    ],
  }),

  'email_batches.list': defineScreen({
    screenKey: 'email_batches.list',
    label: 'Communication batches',
    entity: 'CommunicationBatch / communication_batches',
    columns: [
      { id: 'date', label: 'Date', priority: 1 },
      { id: 'template', label: 'Template', priority: 2 },
      { id: 'channel', label: 'Channel', priority: 3 },
      { id: 'criteria', label: 'Criteria', priority: 4 },
      { id: 'matched', label: 'Matched', priority: 5 },
      { id: 'sent', label: 'Sent', priority: 6 },
      { id: 'opened', label: 'Opened', priority: 7 },
      { id: 'not_opened', label: 'Not opened', priority: 8 },
      { id: 'clicked', label: 'Clicked', priority: 9 },
      { id: 'spam', label: 'Spam', priority: 10 },
      { id: 'failed', label: 'Failed', priority: 11 },
      { id: 'status', label: 'Status', priority: 12 },
      { id: 'action', label: 'Action', required: true, priority: 0 },
    ],
  }),

  'receipt_templates.list': defineScreen({
    screenKey: 'receipt_templates.list',
    label: 'Receipt templates',
    entity: 'ReceiptTemplate / receipt_templates',
    columns: [
      { id: 'name', label: 'Name', priority: 1 },
      { id: 'created', label: 'Created', priority: 2 },
      { id: 'updated', label: 'Updated', priority: 3 },
      { id: 'actions', label: 'Actions', required: true, priority: 0 },
    ],
  }),

  // ─── Geographic ────────────────────────────────────────────────────

  'geographic.countries.list': defineScreen({
    screenKey: 'geographic.countries.list',
    label: 'Countries',
    entity: 'Country',
    columns: [
      { id: 'name', label: 'Name', priority: 1 },
      { id: 'code', label: 'Code', priority: 2 },
      { id: 'currency', label: 'Currency', priority: 3 },
      { id: 'phone_code', label: 'Phone code', priority: 4 },
      { id: 'active', label: 'Active', priority: 5 },
      { id: 'actions', label: 'Actions', required: true, priority: 0 },
    ],
  }),

  'geographic.regions.list': defineScreen({
    screenKey: 'geographic.regions.list',
    label: 'Regions',
    entity: 'Region',
    columns: [
      { id: 'name', label: 'Name', priority: 1 },
      { id: 'code', label: 'Code', priority: 2 },
      { id: 'country', label: 'Country', priority: 3 },
      { id: 'active', label: 'Active', priority: 4 },
      { id: 'actions', label: 'Actions', required: true, priority: 0 },
    ],
  }),

  'geographic.sub_regions.list': defineScreen({
    screenKey: 'geographic.sub_regions.list',
    label: 'Sub-regions',
    entity: 'SubRegion',
    columns: [
      { id: 'name', label: 'Name', priority: 1 },
      { id: 'code', label: 'Code', priority: 2 },
      { id: 'region', label: 'Region', priority: 3 },
      { id: 'country', label: 'Country', priority: 4 },
      { id: 'active', label: 'Active', priority: 5 },
      { id: 'actions', label: 'Actions', required: true, priority: 0 },
    ],
  }),

  'geographic.districts.list': defineScreen({
    screenKey: 'geographic.districts.list',
    label: 'Districts',
    entity: 'District',
    columns: [
      { id: 'name', label: 'Name', priority: 1 },
      { id: 'code', label: 'Code', priority: 2 },
      { id: 'sub_region', label: 'Sub-region', priority: 3 },
      { id: 'region', label: 'Region', priority: 4 },
      { id: 'country', label: 'Country', priority: 5 },
      { id: 'active', label: 'Active', priority: 6 },
      { id: 'actions', label: 'Actions', required: true, priority: 0 },
    ],
  }),

  'geographic.tehsils.list': defineScreen({
    screenKey: 'geographic.tehsils.list',
    label: 'Tehsils',
    entity: 'Tehsil',
    columns: [
      { id: 'name', label: 'Name', priority: 1 },
      { id: 'code', label: 'Code', priority: 2 },
      { id: 'district', label: 'District', priority: 3 },
      { id: 'region', label: 'Region', priority: 4 },
      { id: 'country', label: 'Country', priority: 5 },
      { id: 'active', label: 'Active', priority: 6 },
      { id: 'actions', label: 'Actions', required: true, priority: 0 },
    ],
  }),

  'geographic.cities.list': defineScreen({
    screenKey: 'geographic.cities.list',
    label: 'Cities',
    entity: 'City',
    columns: [
      { id: 'name', label: 'Name', priority: 1 },
      { id: 'code', label: 'Code', priority: 2 },
      { id: 'tehsil', label: 'Tehsil', priority: 3 },
      { id: 'district', label: 'District', priority: 4 },
      { id: 'region', label: 'Region', priority: 5 },
      { id: 'country', label: 'Country', priority: 6 },
      { id: 'active', label: 'Active', priority: 7 },
      { id: 'actions', label: 'Actions', required: true, priority: 0 },
    ],
  }),

  'geographic.routes.list': defineScreen({
    screenKey: 'geographic.routes.list',
    label: 'Routes',
    entity: 'Route',
    columns: [
      { id: 'name', label: 'Name', priority: 1 },
      { id: 'code', label: 'Code', priority: 2 },
      { id: 'type', label: 'Type', priority: 3 },
      { id: 'region', label: 'Region', priority: 4 },
      { id: 'country', label: 'Country', priority: 5 },
      { id: 'cities', label: 'Cities', priority: 6 },
      { id: 'active', label: 'Active', priority: 7 },
      { id: 'actions', label: 'Actions', required: true, priority: 0 },
    ],
  }),

  // ─── DMS (less-active / legacy lists) ───────────────────────────────

  'appeals.list': defineScreen({
    screenKey: 'appeals.list',
    label: 'Appeals',
    entity: 'Appeal / appeals',
    columns: [
      { id: 'title', label: 'Title', priority: 1 },
      { id: 'category', label: 'Category', priority: 2 },
      { id: 'status', label: 'Status', priority: 3 },
      { id: 'raised_goal', label: 'Raised / Goal', priority: 4 },
      { id: 'progress', label: 'Progress', priority: 5 },
      { id: 'flags', label: 'Flags', priority: 6 },
      { id: 'actions', label: 'Actions', required: true, priority: 0 },
    ],
  }),

  'campaigns.list': defineScreen({
    screenKey: 'campaigns.list',
    label: 'Campaigns',
    entity: 'Campaign / campaigns',
    columns: [
      { id: 'title', label: 'Title', priority: 1 },
      { id: 'status', label: 'Status', priority: 2 },
      { id: 'type', label: 'Type', priority: 3 },
      { id: 'program', label: 'Program', priority: 4 },
      { id: 'frequency', label: 'Frequency', priority: 5 },
      { id: 'goal_target', label: 'Goal / Target', priority: 6 },
      { id: 'currency', label: 'Currency', priority: 7 },
      { id: 'start_date', label: 'Start date', priority: 8 },
      { id: 'end_date', label: 'End date', priority: 9 },
      { id: 'featured', label: 'Featured', priority: 10 },
      { id: 'actions', label: 'Actions', required: true, priority: 0 },
    ],
  }),

  'events.list': defineScreen({
    screenKey: 'events.list',
    label: 'Events',
    entity: 'Event / events',
    columns: [
      { id: 'title', label: 'Title', priority: 1 },
      { id: 'status', label: 'Status', priority: 2 },
      { id: 'type', label: 'Type', priority: 3 },
      { id: 'start_date', label: 'Start date', priority: 4 },
      { id: 'end_date', label: 'End date', priority: 5 },
      { id: 'capacity', label: 'Capacity', priority: 6 },
      { id: 'attendees', label: 'Attendees', priority: 7 },
      { id: 'actions', label: 'Actions', required: true, priority: 0 },
    ],
  }),

  'surveys.list': defineScreen({
    screenKey: 'surveys.list',
    label: 'Surveys',
    entity: 'Survey / surveys',
    columns: [
      { id: 'title', label: 'Title', priority: 1 },
      { id: 'status', label: 'Status', priority: 2 },
      { id: 'questions', label: 'Questions', priority: 3 },
      { id: 'start', label: 'Start', priority: 4 },
      { id: 'end', label: 'End', priority: 5 },
      { id: 'actions', label: 'Actions', required: true, priority: 0 },
    ],
  }),

  'aid.applications.list': defineScreen({
    screenKey: 'aid.applications.list',
    label: 'Aid applications',
    entity: 'AidApplication / aid_applications',
    columns: [
      { id: 'application', label: 'Application', priority: 1 },
      { id: 'beneficiary', label: 'Beneficiary', priority: 2 },
      { id: 'aid_type', label: 'Aid type', priority: 3 },
      { id: 'status', label: 'Status', priority: 4 },
      { id: 'assigned', label: 'Assigned', priority: 5 },
      { id: 'actions', label: 'Actions', required: true, priority: 0 },
    ],
  }),

  'aid.people.list': defineScreen({
    screenKey: 'aid.people.list',
    label: 'Aid people',
    entity: 'AidPerson / aid_people',
    columns: [
      { id: 'name', label: 'Name', priority: 1 },
      { id: 'cnic', label: 'CNIC', priority: 2 },
      { id: 'phone', label: 'Phone', priority: 3 },
      { id: 'city', label: 'City', priority: 4 },
      { id: 'actions', label: 'Actions', required: true, priority: 0 },
    ],
  }),

  // ─── Admin / HR / Tasks / Tickets ───────────────────────────────────

  'tasks.list': defineScreen({
    screenKey: 'tasks.list',
    label: 'Tasks',
    entity: 'Task / tasks',
    columns: [
      { id: 'task', label: 'Task', priority: 1 },
      { id: 'assignment', label: 'Assignment', priority: 2, hideOnMobile: true },
      { id: 'priority_status', label: 'Priority / Status', priority: 3 },
      { id: 'dates', label: 'Dates', priority: 4, hideOnMobile: true },
      { id: 'actions', label: 'Actions', required: true, priority: 0 },
    ],
  }),

  'tickets.list': defineScreen({
    screenKey: 'tickets.list',
    label: 'Tickets',
    entity: 'Complaint / complaints',
    columns: [
      { id: 'ticket', label: 'Ticket', priority: 1 },
      { id: 'assignment', label: 'Assignment', priority: 2, hideOnMobile: true },
      { id: 'priority_status', label: 'Priority / Status', priority: 3 },
      { id: 'dates', label: 'Dates', priority: 4, hideOnMobile: true },
      { id: 'actions', label: 'Actions', required: true, priority: 0 },
    ],
  }),

  'users.list': defineScreen({
    screenKey: 'users.list',
    label: 'Users',
    entity: 'User',
    columns: [
      { id: 'name', label: 'Name', priority: 1 },
      { id: 'user_code', label: 'User Code', priority: 2, hideOnMobile: true },
      { id: 'email', label: 'Email', priority: 3, hideOnMobile: true },
      { id: 'department', label: 'Department', priority: 4 },
      { id: 'role', label: 'Role', priority: 5, hideOnMobile: true },
      { id: 'actions', label: 'Actions', required: true, priority: 0 },
    ],
  }),

  'hr.jobs.list': defineScreen({
    screenKey: 'hr.jobs.list',
    label: 'HR jobs',
    entity: 'Job / jobs',
    columns: [
      { id: 'title', label: 'Title', priority: 1 },
      { id: 'department', label: 'Department', priority: 2 },
      { id: 'type', label: 'Type', priority: 3 },
      { id: 'location', label: 'Location', priority: 4 },
      { id: 'experience', label: 'Experience', priority: 5, hideOnMobile: true },
      { id: 'status', label: 'Status', priority: 6 },
      { id: 'posted_date', label: 'Posted Date', priority: 7, hideOnMobile: true },
      { id: 'closing_date', label: 'Closing Date', priority: 8, hideOnMobile: true },
      { id: 'actions', label: 'Actions', required: true, priority: 0 },
    ],
  }),

  'hr.applications.list': defineScreen({
    screenKey: 'hr.applications.list',
    label: 'Job applications',
    entity: 'Application / job_applications',
    columns: [
      { id: 'applicant', label: 'Applicant', priority: 1 },
      { id: 'email', label: 'Email', priority: 2 },
      { id: 'phone', label: 'Phone', priority: 3 },
      { id: 'department', label: 'Department', priority: 4 },
      { id: 'status', label: 'Status', priority: 5 },
      { id: 'applied_date', label: 'Applied Date', priority: 6 },
      { id: 'actions', label: 'Actions', required: true, priority: 0 },
    ],
  }),

  'hr.resume_collection.list': defineScreen({
    screenKey: 'hr.resume_collection.list',
    label: 'Resume collection',
    entity: 'ResumeCollection / hr_resume_collections',
    columns: [
      { id: 'applicant', label: 'Applicant', priority: 1 },
      { id: 'phone', label: 'Phone', priority: 2 },
      { id: 'email', label: 'Email', priority: 3 },
      { id: 'role', label: 'Role', priority: 4 },
      { id: 'city', label: 'City', priority: 5 },
      { id: 'department', label: 'Department', priority: 6 },
      { id: 'actions', label: 'Actions', required: true, priority: 0 },
    ],
  }),

  // ─── Progress tracking ─────────────────────────────────────────────

  'progress.templates.list': defineScreen({
    screenKey: 'progress.templates.list',
    label: 'Progress templates',
    entity: 'ProgressWorkflowTemplate / progress_workflow_templates',
    columns: [
      { id: 'name', label: 'Name', priority: 1 },
      { id: 'code', label: 'Code', priority: 2 },
      { id: 'batchable', label: 'Batchable', priority: 3, hideOnMobile: true },
      { id: 'active', label: 'Active', priority: 4, hideOnMobile: true },
      { id: 'actions', label: 'Actions', required: true, priority: 0 },
    ],
  }),

  'progress.trackers.list': defineScreen({
    screenKey: 'progress.trackers.list',
    label: 'Progress trackers',
    entity: 'ProgressTracker / progress_trackers',
    columns: [
      { id: 'id', label: 'ID', priority: 1 },
      { id: 'template', label: 'Template', priority: 2 },
      { id: 'donation_id', label: 'Donation ID', priority: 3, hideOnMobile: true },
      { id: 'batches', label: 'Batches', priority: 4, hideOnMobile: true },
      { id: 'overall', label: 'Overall', priority: 5 },
      { id: 'actions', label: 'Actions', required: true, priority: 0 },
    ],
  }),

  'progress.steps.list': defineScreen({
    screenKey: 'progress.steps.list',
    label: 'Progress steps',
    entity: 'ProgressWorkflowBatch / steps UI',
    columns: [
      { id: 'id', label: 'ID', priority: 1 },
      { id: 'order', label: 'Order', priority: 2 },
      { id: 'title', label: 'Title', priority: 3 },
      { id: 'batch', label: 'Batch', priority: 4, hideOnMobile: true },
      { id: 'status', label: 'Status', priority: 5 },
      { id: 'donor_visible', label: 'Donor Visible', priority: 6, hideOnMobile: true },
      { id: 'evidence', label: 'Evidence', priority: 7, hideOnMobile: true },
      { id: 'actions', label: 'Actions', required: true, priority: 0 },
    ],
  }),

  // ─── Program reports ───────────────────────────────────────────────

  'program.applications_reports.list': defineScreen({
    screenKey: 'program.applications_reports.list',
    label: 'Applications reports',
    entity: 'ApplicationReport',
    columns: [
      { id: 'report_date', label: 'Report date', priority: 1 },
      { id: 'projects_count', label: 'Projects', priority: 2 },
      { id: 'total_applications', label: 'Applications', priority: 3 },
      { id: 'total_verified', label: 'Verified', priority: 4 },
      { id: 'total_approved', label: 'Approved', priority: 5 },
      { id: 'total_pending', label: 'Pending', priority: 6 },
      { id: 'actions', label: 'Actions', required: true, priority: 0 },
    ],
  }),

  'program.ration_report.list': defineScreen({
    screenKey: 'program.ration_report.list',
    label: 'Ration reports',
    entity: 'RationReport',
    columns: [
      { id: 'date', label: 'Date', priority: 1 },
      { id: 'full_total', label: 'Full Total', priority: 2, hideOnMobile: true },
      { id: 'half_total', label: 'Half Total', priority: 3, hideOnMobile: true },
      { id: 'full_half', label: 'Full / Half', priority: 2, mobileOnly: true },
      { id: 'life_time', label: 'Lifetime', priority: 4 },
      { id: 'actions', label: 'Actions', required: true, priority: 0 },
    ],
  }),

  'program.marriage_gifts.list': defineScreen({
    screenKey: 'program.marriage_gifts.list',
    label: 'Marriage gifts reports',
    entity: 'MarriageGiftReport',
    columns: [
      { id: 'date', label: 'Date', priority: 1 },
      { id: 'total_gifts', label: 'Total gifts', priority: 2 },
      { id: 'orphans', label: 'Orphans', priority: 3, hideOnMobile: true },
      { id: 'divorced', label: 'Divorced', priority: 4, hideOnMobile: true },
      { id: 'disable', label: 'Disable', priority: 5, hideOnMobile: true },
      { id: 'indegent', label: 'Indegent', priority: 6, hideOnMobile: true },
      { id: 'distribution', label: 'Distribution', priority: 3, mobileOnly: true },
      { id: 'actions', label: 'Actions', required: true, priority: 0 },
    ],
  }),

  'program.financial_assistance.list': defineScreen({
    screenKey: 'program.financial_assistance.list',
    label: 'Financial assistance reports',
    entity: 'FinancialAssistanceReport',
    columns: [
      { id: 'date', label: 'Date', priority: 1 },
      { id: 'total_assistance', label: 'Total assistance', priority: 2 },
      { id: 'widow', label: 'Widow', priority: 3, hideOnMobile: true },
      { id: 'divorced', label: 'Divorced', priority: 4, hideOnMobile: true },
      { id: 'disable', label: 'Disable', priority: 5, hideOnMobile: true },
      { id: 'extreme_poor', label: 'Extreme poor', priority: 6, hideOnMobile: true },
      { id: 'distribution', label: 'Distribution', priority: 3, mobileOnly: true },
      { id: 'actions', label: 'Actions', required: true, priority: 0 },
    ],
  }),

  'program.sewing_machine.list': defineScreen({
    screenKey: 'program.sewing_machine.list',
    label: 'Sewing machine reports',
    entity: 'SewingMachineReport',
    columns: [
      { id: 'date', label: 'Date', priority: 1 },
      { id: 'total_machines', label: 'Total machines', priority: 2 },
      { id: 'orphans', label: 'Orphans', priority: 3, hideOnMobile: true },
      { id: 'divorced', label: 'Divorced', priority: 4, hideOnMobile: true },
      { id: 'disable', label: 'Disable', priority: 5, hideOnMobile: true },
      { id: 'indegent', label: 'Indegent', priority: 6, hideOnMobile: true },
      { id: 'distribution', label: 'Distribution', priority: 3, mobileOnly: true },
      { id: 'actions', label: 'Actions', required: true, priority: 0 },
    ],
  }),

  'program.wheel_chair.list': defineScreen({
    screenKey: 'program.wheel_chair.list',
    label: 'Wheel chair / crutches reports',
    entity: 'WheelChairOrCrutchesReport',
    columns: [
      { id: 'date', label: 'Date', priority: 1 },
      { id: 'total_wheel_chairs', label: 'Wheel chairs', priority: 2 },
      { id: 'total_crutches', label: 'Crutches', priority: 3 },
      { id: 'grand_total', label: 'Grand total', priority: 4 },
      { id: 'actions', label: 'Actions', required: true, priority: 0 },
    ],
  }),

  'program.health.list': defineScreen({
    screenKey: 'program.health.list',
    label: 'Health reports',
    entity: 'HealthReport',
    columns: [
      { id: 'date', label: 'Date', priority: 1 },
      { id: 'in_house', label: 'In house', priority: 2 },
      { id: 'referred', label: 'Referred', priority: 3 },
      { id: 'surgeries_supported', label: 'Surgeries supported', priority: 4 },
      { id: 'ambulance', label: 'Ambulance', priority: 5 },
      { id: 'medicines', label: 'Medicines', priority: 6 },
      { id: 'grand_total', label: 'Grand total', priority: 7 },
      { id: 'actions', label: 'Actions', required: true, priority: 0 },
    ],
  }),

  'program.water.list': defineScreen({
    screenKey: 'program.water.list',
    label: 'Water reports',
    entity: 'WaterReport',
    columns: [
      { id: 'date', label: 'Date', priority: 1 },
      { id: 'total_activities', label: 'Activities', priority: 2 },
      { id: 'total_quantity', label: 'Quantity', priority: 3 },
      { id: 'actions', label: 'Actions', required: true, priority: 0 },
    ],
  }),

  'program.kasb.list': defineScreen({
    screenKey: 'program.kasb.list',
    label: 'Kasb reports',
    entity: 'KasbReport',
    columns: [
      { id: 'date', label: 'Date', priority: 1 },
      { id: 'total_centers', label: 'Centers', priority: 2 },
      { id: 'total_delivery', label: 'Delivery', priority: 3 },
      { id: 'actions', label: 'Actions', required: true, priority: 0 },
    ],
  }),

  'program.kasb_training.list': defineScreen({
    screenKey: 'program.kasb_training.list',
    label: 'Kasb training reports',
    entity: 'KasbTrainingReport',
    columns: [
      { id: 'date', label: 'Date', priority: 1 },
      { id: 'skill_level', label: 'Skill level', priority: 2 },
      { id: 'quantity', label: 'Quantity', priority: 3 },
      { id: 'addition', label: 'Addition', priority: 4 },
      { id: 'left', label: 'Left', priority: 5 },
      { id: 'total', label: 'Total', priority: 6 },
      { id: 'actions', label: 'Actions', required: true, priority: 0 },
    ],
  }),

  'program.education.list': defineScreen({
    screenKey: 'program.education.list',
    label: 'Education reports',
    entity: 'EducationReport',
    columns: [
      { id: 'date', label: 'Date', priority: 1 },
      { id: 'male_total', label: 'Male', priority: 2 },
      { id: 'female_total', label: 'Female', priority: 3 },
      { id: 'overall_total', label: 'Overall', priority: 4 },
      { id: 'actions', label: 'Actions', required: true, priority: 0 },
    ],
  }),

  'program.tree_plantation.list': defineScreen({
    screenKey: 'program.tree_plantation.list',
    label: 'Tree plantation reports',
    entity: 'TreePlantationReport',
    columns: [
      { id: 'date', label: 'Date', priority: 1 },
      { id: 'school_name', label: 'School', priority: 2 },
      { id: 'plants', label: 'Plants', priority: 3 },
      { id: 'actions', label: 'Actions', required: true, priority: 0, hideOnMobile: true },
    ],
  }),

  'program.area_ration.list': defineScreen({
    screenKey: 'program.area_ration.list',
    label: 'Area ration reports',
    entity: 'AreaRationReport',
    columns: [
      { id: 'date', label: 'Date', priority: 1 },
      { id: 'province', label: 'Province', priority: 2 },
      { id: 'district', label: 'District', priority: 3 },
      { id: 'city', label: 'City', priority: 4 },
      { id: 'quantity', label: 'Quantity', priority: 5 },
      { id: 'actions', label: 'Actions', required: true, priority: 0, hideOnMobile: true },
    ],
  }),

  'program.targets.list': defineScreen({
    screenKey: 'program.targets.list',
    label: 'Program targets',
    entity: 'Target / program_targets',
    columns: [
      { id: 'year', label: 'Year', priority: 1 },
      { id: 'program', label: 'Program', priority: 2 },
      { id: 'target', label: 'Target', priority: 3 },
      { id: 'reached', label: 'Reached', priority: 4 },
      { id: 'target_type', label: 'Target type', priority: 5, hideOnMobile: true },
      { id: 'actions', label: 'Actions', required: true, priority: 0 },
    ],
  }),

  'program.aas_collection.list': defineScreen({
    screenKey: 'program.aas_collection.list',
    label: 'AAS collection centers',
    entity: 'AasCollectionCentersReport',
    columns: [
      { id: 'patients', label: 'Patients', priority: 1 },
      { id: 'tests', label: 'Tests', priority: 2, hideOnMobile: true },
      { id: 'revenue', label: 'Revenue', priority: 3 },
      { id: 'camps', label: 'Camps', priority: 4, hideOnMobile: true },
      { id: 'actions', label: 'Actions', required: true, priority: 0 },
    ],
  }),

  'program.al_hasanain.list': defineScreen({
    screenKey: 'program.al_hasanain.list',
    label: 'Al Hasanain college',
    entity: 'AlHasanainClg / al_hasanain_clg',
    columns: [
      { id: 'students', label: 'Students', priority: 1 },
      { id: 'attendance_pct', label: 'Attendance %', priority: 2, hideOnMobile: true },
      { id: 'dropout_pct', label: 'Dropout %', priority: 3, hideOnMobile: true },
      { id: 'pass_pct', label: 'Pass %', priority: 4, hideOnMobile: true },
      { id: 'fee', label: 'Fee', priority: 5 },
      { id: 'teachers', label: 'Teachers', priority: 6, hideOnMobile: true },
      { id: 'actions', label: 'Actions', required: true, priority: 0 },
    ],
  }),

  'program.programs.list': defineScreen({
    screenKey: 'program.programs.list',
    label: 'Programs',
    entity: 'ProgramEntity / programs',
    columns: [
      { id: 'key', label: 'Key', priority: 1 },
      { id: 'label', label: 'Label', priority: 2 },
      { id: 'logo', label: 'Logo', priority: 3, hideOnMobile: true },
      { id: 'status', label: 'Status', priority: 4 },
      { id: 'app_reports', label: 'App reports', priority: 5, hideOnMobile: true },
      { id: 'actions', label: 'Actions', required: true, priority: 0 },
    ],
  }),

  'program.subprograms.list': defineScreen({
    screenKey: 'program.subprograms.list',
    label: 'Subprograms',
    entity: 'ProgramSubprogram / program_subprograms',
    columns: [
      { id: 'program', label: 'Program', priority: 1 },
      { id: 'key', label: 'Key', priority: 2 },
      { id: 'label', label: 'Label', priority: 3 },
      { id: 'status', label: 'Status', priority: 4 },
      { id: 'actions', label: 'Actions', required: true, priority: 0 },
    ],
  }),

  'program.dream_schools.list': defineScreen({
    screenKey: 'program.dream_schools.list',
    label: 'Dream schools',
    entity: 'DreamSchool / dream_schools',
    columns: [
      { id: 'school_id', label: 'School ID', priority: 1 },
      { id: 'students', label: 'Students', priority: 2 },
      { id: 'location', label: 'Location', priority: 3, hideOnMobile: true },
      { id: 'kawish_id', label: 'Kawish ID', priority: 4 },
      { id: 'actions', label: 'Actions', required: true, priority: 0 },
    ],
  }),

  'program.dream_school_reports.list': defineScreen({
    screenKey: 'program.dream_school_reports.list',
    label: 'Dream school reports',
    entity: 'DreamSchoolReport',
    columns: [
      { id: 'month', label: 'Month', priority: 1 },
      { id: 'schools', label: 'Schools', priority: 2 },
      { id: 'actions', label: 'Actions', required: true, priority: 0 },
    ],
  }),

  // ─── Store / Procurements / Accounts / CEO / Comms ──────────────────

  'store.reports.list': defineScreen({
    screenKey: 'store.reports.list',
    label: 'Store daily reports',
    entity: 'StoreDailyReportEntity / store_daily_reports',
    columns: [
      { id: 'date', label: 'Date', priority: 1 },
      { id: 'demands', label: 'Demands', priority: 2 },
      { id: 'grns', label: 'GRNs', priority: 3 },
      { id: 'actions', label: 'Actions', required: true, priority: 0, hideOnMobile: true },
    ],
  }),

  'procurements.reports.list': defineScreen({
    screenKey: 'procurements.reports.list',
    label: 'Procurements daily reports',
    entity: 'ProcurementsDailyReport',
    columns: [
      { id: 'date', label: 'Date', priority: 1 },
      { id: 'pos', label: 'POs', priority: 2 },
      { id: 'pis', label: 'PIs', priority: 3 },
      { id: 'amount', label: 'Amount', priority: 4 },
      { id: 'tenders', label: 'Tenders', priority: 5 },
      { id: 'actions', label: 'Actions', required: true, priority: 0, hideOnMobile: true },
    ],
  }),

  'accounts_and_finance.reports.list': defineScreen({
    screenKey: 'accounts_and_finance.reports.list',
    label: 'Accounts & finance reports',
    entity: 'AccountsAndFinanceDailyReport',
    columns: [
      { id: 'date', label: 'Date', priority: 1 },
      { id: 'daily_inflow', label: 'Daily Inflow', priority: 2 },
      { id: 'daily_outflow', label: 'Daily Outflow', priority: 3 },
      { id: 'available_funds', label: 'Available Funds', priority: 4 },
      { id: 'pending_payable', label: 'Pending Payable', priority: 5 },
      { id: 'actions', label: 'Actions', required: true, priority: 0, hideOnMobile: true },
    ],
  }),

  'ceo.instruction_register.list': defineScreen({
    screenKey: 'ceo.instruction_register.list',
    label: 'CEO instruction register',
    entity: 'CeoNote / ceo_notes',
    columns: [
      { id: 'index', label: '#', priority: 1 },
      { id: 'date', label: 'Date', priority: 2 },
      { id: 'title', label: 'Title', priority: 3 },
      { id: 'category', label: 'Category', priority: 4 },
      { id: 'department', label: 'Department', priority: 5 },
      { id: 'priority', label: 'Priority', priority: 6 },
      { id: 'status', label: 'Status', priority: 7 },
      { id: 'assigned_to', label: 'Assigned To', priority: 8 },
      { id: 'due_date', label: 'Due Date', priority: 9 },
      { id: 'related_task', label: 'Related Task', priority: 10 },
      { id: 'actions', label: 'Actions', required: true, priority: 0 },
    ],
  }),

  'communication.email_checklist.list': defineScreen({
    screenKey: 'communication.email_checklist.list',
    label: 'Email checklist',
    entity: null,
    columns: [
      { id: 'index', label: '#', priority: 1 },
      { id: 'subject', label: 'Subject', priority: 2 },
      { id: 'status', label: 'Status', priority: 3 },
      { id: 'done', label: 'Done', priority: 4 },
    ],
  }),
};

/**
 * Resolve ordered column defs for a screen + viewport.
 * Later: replace body with API/DB merge; keep this signature stable.
 *
 * @param {string} screenKey
 * @param {ListViewport} [viewport='desktop']
 * @returns {ListColumnDef[]}
 */
export function resolveListColumns(screenKey, viewport = 'desktop') {
  const screen = LIST_COLUMN_REGISTRY[screenKey];
  if (!screen) return [];

  const viewKey = viewport === 'mobile' ? 'mobile' : 'desktop';
  const visibleIds = screen.views?.[viewKey]?.visible || [];
  const byId = Object.fromEntries(screen.columns.map((c) => [c.id, c]));

  return visibleIds.map((id) => byId[id]).filter(Boolean);
}

/**
 * Screen keys known to the registry (for docs / future admin UI).
 * @returns {string[]}
 */
export function listColumnScreenKeys() {
  return Object.keys(LIST_COLUMN_REGISTRY);
}

export default LIST_COLUMN_REGISTRY;
