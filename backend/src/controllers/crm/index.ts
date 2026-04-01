/**
 * @fileoverview CRM Controllers - Barrel export for CRM controllers
 * @description Re-exports all CRM controller functions
 * @module controllers/crm
 */
export {
  getLeads,
  getLeadById,
  createLead,
  importLeads,
  exportLeads,
  updateLead,
  deleteLead,
  getCRMStats,
  getCRMAlerts,
  createLeadValidation,
  updateLeadValidation,
} from './leads.controller';

export {
  createTask,
  completeTask,
  getLeadTasks,
  getUpcomingTasks,
  createTaskValidation,
} from './tasks.controller';

export { addCommunication, getLeadCommunications } from './communications.controller';

export { getAnalyticsReport, exportAnalyticsReport } from './analytics.controller';
