import { Router } from 'express';
import {
  createLandingPage,
  getMyLandingPages,
  getLandingPageStats,
  getLandingPageById,
  updateLandingPage,
  deleteLandingPage,
  getPublicLandingPage,
  trackConversion,
} from '../controllers/LandingPageController';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/landing/:slug', getPublicLandingPage);
router.post('/landing/:slug/convert', trackConversion);

router.post('/landing', authenticate, createLandingPage);
router.get('/landing', authenticate, getMyLandingPages);
router.get('/landing/stats', authenticate, getLandingPageStats);
router.get('/landing/:id', authenticate, getLandingPageById);
router.put('/landing/:id', authenticate, updateLandingPage);
router.delete('/landing/:id', authenticate, deleteLandingPage);

export default router;
