/**
 * @fileoverview Communications Controller - Communication records endpoints
 * @description Handles communication history for CRM leads
 * @module controllers/crm/communications
 */
import { Response } from 'express';
import { crmService } from '../../services/CRMService';
import type { AuthenticatedRequest } from '../../middleware/auth.middleware';

/**
 * Add a communication record
 */
export async function addCommunication(req: AuthenticatedRequest, res: Response) {
  const comm = await crmService.addCommunication({
    leadId: req.params.leadId,
    userId: req.user!.id,
    ...req.body,
  });
  res.status(201).json({ success: true, data: comm });
}

/**
 * Get all communications for a lead
 */
export async function getLeadCommunications(req: AuthenticatedRequest, res: Response) {
  const comms = await crmService.getLeadCommunications(req.params.leadId, req.user!.id);
  res.json({ success: true, data: comms });
}
