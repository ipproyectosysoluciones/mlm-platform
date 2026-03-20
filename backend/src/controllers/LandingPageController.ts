import { Response } from 'express';
import { landingPageService } from '../services/LandingPageService';
import type { ApiResponse } from '../types';
import type { AuthenticatedRequest } from '../middleware/auth.middleware';
import type { Request } from 'express';

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

export async function getLandingPageStats(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.user!.id;

  const stats = await landingPageService.getStats(userId);

  const response: ApiResponse<typeof stats> = {
    success: true,
    data: stats,
  };

  res.json(response);
}

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
