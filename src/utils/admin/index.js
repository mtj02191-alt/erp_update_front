export const departments = [
  "admin",
  "store",
  "procurements",
  "accounts_and_finance",
  "program",
  "it",
  "hr",
  "marketing",
  "audio_video",
  "fund_raising",
  "meal",
  "health",
  "executive_office",
  "ceo",
  "internal_audit",
  "crd",
  "aas_lab"
];

/** SPA base path for task screens (flat routing: `/tasks/list`, etc.). */
export const TASKS_BASE_PATH = "/tasks";

/** Base path for task UI routes; department argument is ignored (kept for call-site compatibility). */
export const tasksBasePath = (_department) => TASKS_BASE_PATH;

