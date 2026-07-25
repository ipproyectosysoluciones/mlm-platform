/**
 * @fileoverview CRM Sub-Controllers Barrel Export
 * @description Re-exports all CRM-related controller modules from a single entry point.
 *              Re-exporta todos los módulos de controladores CRM desde un único punto de entrada.
 * @module controllers/crm
 * @author MLM Development Team
 */

// Lead Controller exports
export {
  createLeadValidation,
  updateLeadValidation,
  getLeads,
  getLeadById,
  createLead,
  importLeads,
  exportLeads,
  updateLead,
  deleteLead,
} from './LeadController.js';

// Task Controller exports
export {
  createTaskValidation,
  createTask,
  completeTask,
  getLeadTasks,
  getUpcomingTasks,
} from './TaskController.js';

// Communication Controller exports
export { addCommunication, getLeadCommunications } from './CommunicationController.js';

// Analytics Controller exports
export {
  getCRMStats,
  getAnalyticsReport,
  getCRMAlerts,
  exportAnalyticsReport,
} from './AnalyticsController.js';

// Automation Controller exports
export { getAutomationStatus, getAutomationExecutions } from './AutomationController.js';
