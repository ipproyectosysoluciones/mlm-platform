/**
 * @fileoverview CommunicationController - Communication tracking endpoints
 * @description Handles communication records for CRM leads.
 *              Gestiona registros de comunicación para leads.
 * @module controllers/crm/CommunicationController
 * @author MLM Development Team
 */

import { Response } from 'express';
import { crmService } from '../../services/CRMService';
import type { AuthenticatedRequest } from '../../middleware/auth.middleware';

/**
 * Add a communication record
 * Agrega un registro de comunicación
 *
 * @param req - Path params: leadId, Body: type, direction, subject, content, metadata
 * @param res - Response with created communication
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
 * Obtiene todas las comunicaciones de un lead
 *
 * @param req - Path params: leadId
 * @param res - Response with communications list
 */
export async function getLeadCommunications(req: AuthenticatedRequest, res: Response) {
  const comms = await crmService.getLeadCommunications(req.params.leadId, req.user!.id);
  res.json({ success: true, data: comms });
}
