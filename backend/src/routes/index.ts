import { Router, Router as ExpressRouter } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import commissionRoutes from './commission.routes';
import dashboardRoutes from './dashboard.routes';
import productRoutes from './product.routes';
import orderRoutes from './order.routes';
import walletRoutes from './wallet.routes';

const router: ExpressRouter = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/commissions', commissionRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/products', productRoutes);
router.use('/orders', orderRoutes);
router.use('/wallet', walletRoutes);

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check / Verificar estado del servidor
 *     description: Retorna el estado del servidor. Returns server status and timestamp.
 *     tags: [health]
 *     responses:
 *       200:
 *         description: Servidor funcionando correctamente / Server is running
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 timestamp:
 *                   type: string
 *                   example: 2026-03-27T12:00:00.000Z
 */

router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
