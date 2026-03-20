import { Router } from 'express';
import { getPublicProfile, getSitemapUsers } from '../controllers/PublicController';

const router = Router();

router.get('/profile/:code', getPublicProfile);
router.get('/sitemap/users', getSitemapUsers);

export default router;
