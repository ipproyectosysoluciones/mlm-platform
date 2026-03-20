import { Router, Router as ExpressRouter } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import commissionRoutes from './commission.routes';
import dashboardRoutes from './dashboard.routes';

const router: ExpressRouter = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/commissions', commissionRoutes);
router.use('/dashboard', dashboardRoutes);

router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
