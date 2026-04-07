import { Router, Router as ExpressRouter } from 'express';
import authRoutes from './auth.routes';
import botRoutes from './bot.routes';
import userRoutes from './user.routes';
import commissionRoutes from './commission.routes';
import dashboardRoutes from './dashboard.routes';
import productRoutes from './product.routes';
import orderRoutes from './order.routes';
import walletRoutes from './wallet.routes';
import twoFactorRoutes from './twoFactor.routes';
import pushRoutes from './push.routes';
import publicRoutes from './public.routes';
import landingPublicRoutes from './landing-public.routes';
import giftCardRoutes from './gift-cards.routes';
import {
  templateRouter as emailTemplateRoutes,
  campaignRouter as emailCampaignRoutes,
} from './email-campaigns.routes';
import cartRoutes from './carts.routes';
import adminProductRoutes from './admin-product.routes';
import adminCategoryRoutes from './admin-category.routes';
import categoryRoutes from './category.routes';
import vendorRoutes from './vendor.routes';
import adminVendorRoutes from './admin-vendor.routes';
import propertyRoutes from './property.routes';
import adminPropertyRoutes from './admin-property.routes';
import tourRoutes from './tour.routes';
import adminTourRoutes from './admin-tour.routes';
import reservationRouter from './reservation.routes';
import adminReservationRouter from './admin-reservation.routes';
import contractRoutes from './contract.routes';
import adminContractRoutes from './admin-contract.routes';
import addressRoutes from './address.routes';
import shippingRoutes from './shipping.routes';
import achievementRoutes from './achievement.routes';
import leaderboardRoutes from './leaderboard.routes';
import webhookInternalRoutes from './webhook-internal.routes';

const router: ExpressRouter = Router();

router.use('/auth', authRoutes);
router.use('/auth/2fa', twoFactorRoutes); // 2FA routes
router.use('/bot', botRoutes); // WhatsApp bot internal API
router.use('/users', userRoutes);
router.use('/commissions', commissionRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/products', productRoutes);
router.use('/orders', orderRoutes);
router.use('/wallet', walletRoutes);
router.use('/wallets', walletRoutes); // Alias for test compatibility
router.use('/push', pushRoutes);
router.use('/gift-cards', giftCardRoutes);
router.use('/email-templates', emailTemplateRoutes);
router.use('/email-campaigns', emailCampaignRoutes);
router.use('/carts', cartRoutes);

// Category routes (public read, admin write)
router.use('/categories', categoryRoutes);

// Admin category routes (full CRUD)
router.use('/admin/categories', adminCategoryRoutes);

// Admin product routes (full CRUD + inventory)
router.use('/admin/products', adminProductRoutes);

// Vendor routes
router.use('/vendors', vendorRoutes);

// Admin vendor routes
router.use('/admin/vendors', adminVendorRoutes);

// Property routes (public)
router.use('/properties', propertyRoutes);

// Admin property routes
router.use('/admin/properties', adminPropertyRoutes);

// Tour routes (public)
router.use('/tours', tourRoutes);

// Admin tour routes
router.use('/admin/tours', adminTourRoutes);

// Reservation routes (public)
router.use('/reservations', reservationRouter);

// Admin reservation routes
router.use('/admin/reservations', adminReservationRouter);

// Contract routes (user)
router.use('/contracts', contractRoutes);

// Admin contract routes
router.use('/admin/contracts', adminContractRoutes);

// Shipping address routes (user)
router.use('/addresses', addressRoutes);

// Shipping and tracking routes
router.use('/', shippingRoutes);

// Achievement routes
router.use('/achievements', achievementRoutes);

// Leaderboard routes
router.use('/leaderboard', leaderboardRoutes);

// Internal webhook routes (for n8n and internal services)
// Rutas de webhook interno (para n8n y servicios internos)
router.use('/webhooks/internal', webhookInternalRoutes);

// Profile public routes (MUST be before publicRoutes to avoid /profile/:code conflict)
import profilePublicRoutes from './profile-public.routes';
router.use('/public/profile', profilePublicRoutes);

router.use('/public/landing', landingPublicRoutes);
router.use('/public', publicRoutes);

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
