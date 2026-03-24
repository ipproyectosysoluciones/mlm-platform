/**
 * @fileoverview LandingPageController - Landing page management endpoints
 * @description Handles CRUD operations for marketing landing pages including creation,
 *              editing, analytics tracking, and public viewing.
 *              Gestiona operaciones CRUD para landing pages de marketing incluyendo creación,
 *              edición, seguimiento analítico y visualización pública.
 * @module controllers/LandingPageController
 * @author MLM Development Team
 */
import { Response } from 'express';
import { landingPageService } from '../services/LandingPageService';
import type { ApiResponse } from '../types';
import type { AuthenticatedRequest } from '../middleware/auth.middleware';
import type { Request } from 'express';

/**
 * Create a new landing page
 * Crear una nueva landing page
 *
 * @route POST /api/landing-pages
 * @access Authenticated
 * @param {AuthenticatedRequest} req - Request with landing page data
 * @param {Response} res - Response with created page
 */
export async function createLandingPage(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.user!.id;

  const page = await landingPageService.create({
    userId,
    title: req.body.title,
    description: req.body.description,
    template: req.body.template || 'hero',
    content: req.body.content,
    slug: req.body.slug,
    metaTitle: req.body.metaTitle,
    metaDescription: req.body.metaDescription,
  });

  const response: ApiResponse<typeof page> = {
    success: true,
    data: page,
  };

  res.status(201).json(response);
}

/**
 * Get all landing pages for the authenticated user
 * Obtiene todas las landing pages del usuario autenticado
 *
 * @route GET /api/landing
 * @access Authenticated
 * @param {AuthenticatedRequest} req - Request with query params: limit, offset
 * @param {Response} res - Response with array of landing pages
 */
export async function getMyLandingPages(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.user!.id;
  const limit = parseInt(req.query.limit as string) || 20;
  const offset = parseInt(req.query.offset as string) || 0;

  const pages = await landingPageService.findByUserId(userId, limit, offset);

  const response: ApiResponse<typeof pages> = {
    success: true,
    data: pages,
  };

  res.json(response);
}

/**
 * Get statistics for user's landing pages
 * Obtiene estadísticas de las landing pages del usuario
 *
 * @route GET /api/landing/stats
 * @access Authenticated
 * @param {AuthenticatedRequest} req - Authenticated request
 * @param {Response} res - Response with stats: totalPages, activePages, totalViews, totalConversions, conversionRate
 */
export async function getLandingPageStats(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.user!.id;

  const stats = await landingPageService.getStats(userId);

  const response: ApiResponse<typeof stats> = {
    success: true,
    data: stats,
  };

  res.json(response);
}

/**
 * Get landing page by ID
 * Obtiene una landing page por ID
 *
 * @route GET /api/landing/:id
 * @access Authenticated (owner or admin)
 * @param {AuthenticatedRequest} req - Request with landing page ID in params
 * @param {Response} res - Response with landing page details
 * @returns {403} If not authorized, {404} if not found
 */
export async function getLandingPageById(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const userId = req.user!.id;

  const page = await landingPageService.findById(id);

  if (!page) {
    res.status(404).json({ success: false, error: 'Landing page not found' });
    return;
  }

  if (page.userId !== userId && req.user!.role !== 'admin') {
    res.status(403).json({ success: false, error: 'Not authorized' });
    return;
  }

  const response: ApiResponse<typeof page> = {
    success: true,
    data: page,
  };

  res.json(response);
}

/**
 * Update a landing page
 * Actualiza una landing page
 *
 * @route PUT /api/landing/:id
 * @access Authenticated (owner or admin)
 * @param {AuthenticatedRequest} req - Request with landing page ID in params and update data in body
 * @param {Response} res - Response with updated landing page
 * @returns {403} If not authorized, {404} if not found
 */
export async function updateLandingPage(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const userId = req.user!.id;

  const existingPage = await landingPageService.findById(id);

  if (!existingPage) {
    res.status(404).json({ success: false, error: 'Landing page not found' });
    return;
  }

  if (existingPage.userId !== userId && req.user!.role !== 'admin') {
    res.status(403).json({ success: false, error: 'Not authorized' });
    return;
  }

  const page = await landingPageService.update(id, req.body);

  const response: ApiResponse<typeof page> = {
    success: true,
    data: page,
  };

  res.json(response);
}

/**
 * Delete a landing page
 * Elimina una landing page
 *
 * @route DELETE /api/landing/:id
 * @access Authenticated (owner or admin)
 * @param {AuthenticatedRequest} req - Request with landing page ID in params
 * @param {Response} res - Success response
 * @returns {403} If not authorized, {404} if not found
 */
export async function deleteLandingPage(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const userId = req.user!.id;

  const existingPage = await landingPageService.findById(id);

  if (!existingPage) {
    res.status(404).json({ success: false, error: 'Landing page not found' });
    return;
  }

  if (existingPage.userId !== userId && req.user!.role !== 'admin') {
    res.status(403).json({ success: false, error: 'Not authorized' });
    return;
  }

  await landingPageService.delete(id);

  const response: ApiResponse<null> = {
    success: true,
    data: null,
  };

  res.json(response);
}

/**
 * Get public landing page by slug
 * Obtiene landing page pública por slug
 *
 * @route GET /api/landing/:slug
 * @access Public
 * @param {Request} req - Request with slug in params
 * @param {Response} res - Response with landing page data (increments views)
 * @returns {404} If not found
 */
export async function getPublicLandingPage(req: Request, res: Response): Promise<void> {
  const { slug } = req.params;

  const page = await landingPageService.findBySlug(slug);

  if (!page) {
    res.status(404).json({ success: false, error: 'Landing page not found' });
    return;
  }

  await landingPageService.incrementViews(page.id);

  const response: ApiResponse<typeof page> = {
    success: true,
    data: page,
  };

  res.json(response);
}

/**
 * Track conversion for a landing page
 * Registra conversión para una landing page
 *
 * @route POST /api/landing/:slug/convert
 * @access Public
 * @param {Request} req - Request with slug in params
 * @param {Response} res - Success response (increments conversions)
 * @returns {404} If not found
 */
export async function trackConversion(req: Request, res: Response): Promise<void> {
  const { slug } = req.params;

  const page = await landingPageService.findBySlug(slug);

  if (!page) {
    res.status(404).json({ success: false, error: 'Landing page not found' });
    return;
  }

  await landingPageService.incrementConversions(page.id);

  const response: ApiResponse<null> = {
    success: true,
    data: null,
  };

  res.json(response);
}
