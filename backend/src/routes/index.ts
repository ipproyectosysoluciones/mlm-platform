import { Router, Router as ExpressRouter } from 'express';
import authRoutes from './auth.routes';
import botRoutes from './bot.routes';
import userRoutes from './user.routes';
import commissionRoutes from './commission.routes';
import dashboardRoutes from './dashboard.routes';
import productRoutes from './product.routes';
import orderRoutes from './order.routes';
import walletRoutes from './wallet.routes';
import { featureGuard } from '../middleware/featureGuard';
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
import contractRoutes from './contract.routes';
import adminContractRoutes from './admin-contract.routes';
import addressRoutes from './address.routes';
import shippingRoutes from './shipping.routes';
import achievementRoutes from './achievement.routes';
import leaderboardRoutes from './leaderboard.routes';
import invoiceRoutes from './invoices.routes';

// Sprint 9 — previously orphaned routes (fix #126)
// Sprint 9 — rutas previamente huérfanas (fix #126)
import adminReservationRoutes from './admin-reservation.routes';
import adminTourRoutes from './admin-tour.routes';
import adminPropertyRoutes from './admin-property.routes';
import propertyRoutes from './property.routes';
import tourRoutes from './tour.routes';
import botLeadsRoutes from './bot-leads.routes';

// Relocated from app.ts → centralised in router index (fix #126)
// Reubicado de app.ts → centralizado en índice de rutas (fix #126)
import commissionConfigRoutes from './commission-config.routes';

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
