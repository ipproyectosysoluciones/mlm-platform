import { Router, Router as ExpressRouter } from 'express';
import authRoutes from './auth.routes.js';
import botRoutes from './bot.routes.js';
import userRoutes from './user.routes.js';
import commissionRoutes from './commission.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import productRoutes from './product.routes.js';
import orderRoutes from './order.routes.js';
import walletRoutes from './wallet.routes.js';
import adminWalletRoutes from './admin-wallet.routes.js';
import webhookPayoutRoutes from './webhook-payout.routes.js';
import { featureGuard } from '../middleware/featureGuard.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import twoFactorRoutes from './twoFactor.routes.js';
import pushRoutes from './push.routes.js';
import publicRoutes from './public.routes.js';
import landingPublicRoutes from './landing-public.routes.js';
import giftCardRoutes from './gift-cards.routes.js';
import {
  templateRouter as emailTemplateRoutes,
  campaignRouter as emailCampaignRoutes,
} from './email-campaigns.routes.js';
import cartRoutes from './carts.routes.js';
import adminProductRoutes from './admin-product.routes.js';
import adminCategoryRoutes from './admin-category.routes.js';
import categoryRoutes from './category.routes.js';
import vendorRoutes from './vendor.routes.js';
import adminVendorRoutes from './admin-vendor.routes.js';
import contractRoutes from './contract.routes.js';
import adminContractRoutes from './admin-contract.routes.js';
import addressRoutes from './address.routes.js';
import shippingRoutes from './shipping.routes.js';
import achievementRoutes from './achievement.routes.js';
import leaderboardRoutes from './leaderboard.routes.js';
import invoiceRoutes from './invoices.routes.js';

// Sprint 9 — previously orphaned routes (fix #126)
// Sprint 9 — rutas previamente huérfanas (fix #126)
import adminReservationRoutes from './admin-reservation.routes.js';
import adminTourRoutes from './admin-tour.routes.js';
import adminPropertyRoutes from './admin-property.routes.js';
import propertyRoutes from './property.routes.js';
import tourRoutes from './tour.routes.js';
import botLeadsRoutes from './bot-leads.routes.js';

// Relocated from app.ts → centralised in router index (fix #126)
// Reubicado de app.ts → centralizado en índice de rutas (fix #126)
import commissionConfigRoutes from './commission-config.routes.js';

const router: ExpressRouter = Router();

router.use('/auth', authRoutes);
router.use('/auth/2fa', twoFactorRoutes); // 2FA routes
router.use('/bot', botRoutes); // WhatsApp bot internal API
router.use('/users', userRoutes);
router.use('/commissions', commissionRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/products', productRoutes);
router.use('/orders', orderRoutes);
router.use('/wallet', featureGuard('cryptoWallet'), walletRoutes);
router.use('/wallets', featureGuard('cryptoWallet'), walletRoutes); // Alias for test compatibility
router.use('/admin/wallet', adminWalletRoutes);

// Payout webhooks — no featureGuard, raw body needed
router.use('/payment', webhookPayoutRoutes);
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

// Invoice routes (Issue #153 — DB migration)
// Rutas de facturas (Issue #153 — migración a DB)
router.use('/invoices', invoiceRoutes);

// Sprint 9 — Admin reservation routes (previously orphaned)
// Sprint 9 — Rutas admin de reservas (previamente huérfanas)
router.use('/admin/reservations', adminReservationRoutes);

// Sprint 9 — Admin tour routes (previously orphaned)
// Sprint 9 — Rutas admin de tours (previamente huérfanas)
router.use('/admin/tours', adminTourRoutes);

// Sprint 9 — Admin property routes (previously orphaned)
// Sprint 9 — Rutas admin de propiedades (previamente huérfanas)
router.use('/admin/properties', adminPropertyRoutes);

// Sprint 9 — Public property routes (previously orphaned)
// Sprint 9 — Rutas públicas de propiedades (previamente huérfanas)
router.use('/properties', propertyRoutes);

// Sprint 9 — Public tour routes (previously orphaned)
// Sprint 9 — Rutas públicas de tours (previamente huérfanas)
router.use('/tours', tourRoutes);

// Sprint 9 — Bot leads routes (previously orphaned)
// Sprint 9 — Rutas de leads del bot (previamente huérfanas)
router.use('/bot/leads', botLeadsRoutes);

// Sprint 9 — Commission config (relocated from app.ts)
// Sprint 9 — Config de comisiones (reubicado de app.ts)
router.use('/admin/commissions', commissionConfigRoutes);

// Profile public routes (MUST be before publicRoutes to avoid /profile/:code conflict)
import profilePublicRoutes from './profile-public.routes.js';
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
