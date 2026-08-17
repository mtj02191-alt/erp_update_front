/**
 * Entity key → options API path. Used by useEntityOptions().
 * Backend field whitelists live in ddr_server/src/utils/lookup/lookup-profiles.constants.ts
 */
export const LOOKUP_ENDPOINTS = {
  appeals: '/appeals/options',
  workflow_templates: '/progress/workflow-templates/options',
  users: '/users/options',
  donations: '/donations/options',
  donation_box: '/donation-box/options',
};
