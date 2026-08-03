/**
 * @fileoverview Payment Routes
 * @description API endpoints for payment operations
 * @module routes/payment
 */

import { Router } from 'express';
import { PaymentPayPalController } from '../controllers/PaymentPayPalController.js';
import { PaymentMercadoPagoController } from '../controllers/PaymentMercadoPagoController.js';
import { MercadoPagoOAuthController } from '../controllers/MercadoPagoOAuthController.js';
import { authenticate, requireVendor } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * @swagger
 * /payment/paypal/create:
 *   post:
 *     summary: Create a PayPal order / Crear orden de PayPal
 *     description: Creates a new PayPal order and returns an approval URL for the buyer
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *                 minimum: 0.01
 *                 description: Payment amount / Monto del pago
 *               currency:
 *                 type: string
 *                 default: USD
 *                 description: Currency code / Código de moneda
 *               description:
 *                 type: string
 *                 description: Payment description / Descripción del pago
 *               orderId:
 *                 type: string
 *                 description: Internal order ID / ID de pedido interno
 *     responses:
 *       201:
 *         description: PayPal order created / Orden de PayPal creada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     orderId:
 *                       type: string
 *                     status:
 *                       type: string
 *                     approvalUrl:
 *                       type: string
 *       400:
 *         description: Invalid amount / Monto inválido
 *       401:
 *         description: Not authenticated / No autenticado
 *       500:
 *         description: Internal error / Error interno
 */
router.post('/paypal/create', authenticate, PaymentPayPalController.createOrder);

/**
 * @swagger
 * /payment/paypal/capture:
 *   post:
 *     summary: Capture a PayPal order / Capturar orden de PayPal
 *     description: Captures a previously approved PayPal order
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *             properties:
 *               orderId:
 *                 type: string
 *                 description: PayPal order ID (17-char alphanumeric) / ID de orden PayPal
 *               internalOrderId:
 *                 type: string
 *                 description: Internal order ID / ID de pedido interno
 *     responses:
 *       200:
 *         description: Payment captured / Pago capturado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     orderId:
 *                       type: string
 *                     status:
 *                       type: string
 *                     captureId:
 *                       type: string
 *                     amount:
 *                       type: number
 *                     currency:
 *                       type: string
 *       400:
 *         description: Missing or invalid order ID / ID de orden faltante o inválido
 *       401:
 *         description: Not authenticated / No autenticado
 *       500:
 *         description: Internal error / Error interno
 */
router.post('/paypal/capture', authenticate, PaymentPayPalController.captureOrder);

/**
 * @swagger
 * /payment/paypal/webhook:
 *   post:
 *     summary: PayPal webhook endpoint / Endpoint de webhook de PayPal
 *     description: Receives and verifies PayPal webhook events (capture completed, refund)
 *     tags: [Payment]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *               event_type:
 *                 type: string
 *                 enum:
 *                   - CHECKOUT.ORDER.APPROVED
 *                   - PAYMENT.CAPTURE.COMPLETED
 *                   - PAYMENT.CAPTURE.REFUNDED
 *               resource:
 *                 type: object
 *     responses:
 *       200:
 *         description: Webhook acknowledged / Webhook recibido
 *       400:
 *         description: Empty request body / Body de petición vacío
 *       403:
 *         description: Invalid webhook signature / Firma de webhook inválida
 */
router.post('/paypal/webhook', PaymentPayPalController.webhook);

/**
 * @swagger
 * /payment/paypal/{orderId}:
 *   get:
 *     summary: Get PayPal order status / Obtener estado de orden de PayPal
 *     description: Returns the current status of a PayPal order
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: PayPal order ID (17-char alphanumeric) / ID de orden PayPal
 *     responses:
 *       200:
 *         description: Order status retrieved / Estado de orden obtenido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       400:
 *         description: Missing or invalid order ID / ID de orden faltante o inválido
 *       401:
 *         description: Not authenticated / No autenticado
 *       500:
 *         description: Internal error / Error interno
 */
router.get('/paypal/:orderId', authenticate, PaymentPayPalController.getOrder);

// ============================================
// MercadoPago Routes
// ============================================

/**
 * @swagger
 * /payment/mercadopago/create-preference:
 *   post:
 *     summary: Create MercadoPago preference / Crear preferencia de MercadoPago
 *     description: Creates a MercadoPago payment preference and returns checkout URLs
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *             properties:
 *               items:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     productId:
 *                       type: string
 *                     title:
 *                       type: string
 *                     name:
 *                       type: string
 *                     description:
 *                       type: string
 *                     quantity:
 *                       type: integer
 *                       default: 1
 *                     currency_id:
 *                       type: string
 *                       default: COP
 *                     unit_price:
 *                       type: number
 *                     price:
 *                       type: number
 *               externalReference:
 *                 type: string
 *                 description: External reference (user ID) / Referencia externa (ID de usuario)
 *               description:
 *                 type: string
 *                 description: Payment description / Descripción del pago
 *     responses:
 *       201:
 *         description: Preference created / Preferencia creada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     preferenceId:
 *                       type: string
 *                     initPoint:
 *                       type: string
 *                     sandboxInitPoint:
 *                       type: string
 *       400:
 *         description: Invalid items / Items inválidos
 *       401:
 *         description: Not authenticated / No autenticado
 *       500:
 *         description: Internal error / Error interno
 */
router.post(
  '/mercadopago/create-preference',
  authenticate,
  PaymentMercadoPagoController.createPreference
);

/**
 * @swagger
 * /payment/mercadopago/process:
 *   post:
 *     summary: Process direct payment / Procesar pago directo
 *     description: Processes a direct payment with card token via MercadoPago
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - paymentMethodId
 *               - transactionAmount
 *               - payer
 *             properties:
 *               token:
 *                 type: string
 *                 description: Card token from MercadoPago SDK / Token de tarjeta del SDK
 *               issuerId:
 *                 type: string
 *                 description: Card issuer ID / ID del emisor
 *               paymentMethodId:
 *                 type: string
 *                 description: Payment method ID / ID del método de pago
 *               transactionAmount:
 *                 type: number
 *                 description: Transaction amount / Monto de la transacción
 *               installments:
 *                 type: integer
 *                 default: 1
 *                 description: Number of installments / Cuotas
 *               description:
 *                 type: string
 *                 description: Payment description / Descripción del pago
 *               externalReference:
 *                 type: string
 *                 description: External reference / Referencia externa
 *               payer:
 *                 type: object
 *                 required:
 *                   - email
 *                 properties:
 *                   email:
 *                     type: string
 *                     format: email
 *                     description: Payer email / Email del pagador
 *                   identification:
 *                     type: object
 *                     description: Payer identification / Identificación del pagador
 *     responses:
 *       200:
 *         description: Payment processed / Pago procesado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     paymentId:
 *                       type: string
 *                     status:
 *                       type: string
 *                     statusDetail:
 *                       type: string
 *                     paymentType:
 *                       type: string
 *                     transactionAmount:
 *                       type: number
 *                     currency:
 *                       type: string
 *       400:
 *         description: Missing required fields / Campos requeridos faltantes
 *       401:
 *         description: Not authenticated / No autenticado
 *       500:
 *         description: Internal error / Error interno
 */
router.post('/mercadopago/process', authenticate, PaymentMercadoPagoController.processPayment);

/**
 * @swagger
 * /payment/mercadopago/payment/{paymentId}:
 *   get:
 *     summary: Get MercadoPago payment status / Obtener estado de pago de MercadoPago
 *     description: Returns the status of a specific MercadoPago payment
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *         description: MercadoPago payment ID / ID de pago de MercadoPago
 *     responses:
 *       200:
 *         description: Payment status retrieved / Estado de pago obtenido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       400:
 *         description: Missing payment ID / ID de pago faltante
 *       401:
 *         description: Not authenticated / No autenticado
 *       500:
 *         description: Internal error / Error interno
 */
router.get(
  '/mercadopago/payment/:paymentId',
  authenticate,
  PaymentMercadoPagoController.getPayment
);

/**
 * @swagger
 * /payment/mercadopago/payment-methods:
 *   get:
 *     summary: Get available payment methods / Obtener métodos de pago disponibles
 *     description: Returns the list of available MercadoPago payment methods
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Payment methods retrieved / Métodos de pago obtenidos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         description: Not authenticated / No autenticado
 *       500:
 *         description: Internal error / Error interno
 */
router.get(
  '/mercadopago/payment-methods',
  authenticate,
  PaymentMercadoPagoController.getPaymentMethods
);

/**
 * @swagger
 * /payment/mercadopago/webhook:
 *   post:
 *     summary: MercadoPago webhook endpoint / Endpoint de webhook de MercadoPago
 *     description: Receives and processes MercadoPago payment notifications (IPN and Webhooks API)
 *     tags: [Payment]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *               topic:
 *                 type: string
 *                 description: IPN topic (e.g. payment)
 *               action:
 *                 type: string
 *                 description: Webhook action (e.g. payment.updated)
 *               data:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *     responses:
 *       200:
 *         description: Webhook acknowledged / Webhook recibido
 *       401:
 *         description: Invalid webhook signature / Firma de webhook inválida
 */
router.post('/mercadopago/webhook', PaymentMercadoPagoController.webhook);

/**
 * @swagger
 * /payment/mercadopago/oauth/authorize:
 *   get:
 *     summary: Start MercadoPago OAuth for a vendor / Iniciar OAuth MercadoPago
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Authorization URL + state / URL de autorización + state
 *       403:
 *         description: Vendor not approved / Vendor no aprobado
 */
router.get(
  '/mercadopago/oauth/authorize',
  authenticate,
  requireVendor,
  MercadoPagoOAuthController.authorize
);

/**
 * @swagger
 * /payment/mercadopago/oauth/callback:
 *   post:
 *     summary: OAuth callback (code exchange) / Callback OAuth
 *     tags: [Payment]
 *     responses:
 *       200:
 *         description: Tokens stored / Tokens guardados
 */
router.post('/mercadopago/oauth/callback', MercadoPagoOAuthController.callback);

/**
 * @swagger
 * /payment/mercadopago/oauth/refresh:
 *   post:
 *     summary: Refresh OAuth tokens / Renovar tokens OAuth
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tokens refreshed / Tokens renovados
 *       409:
 *         description: CONNECT_MP_REQUIRED — reconnection needed
 */
router.post(
  '/mercadopago/oauth/refresh',
  authenticate,
  requireVendor,
  MercadoPagoOAuthController.refresh
);

/**
 * @swagger
 * /payment/mercadopago/oauth/status:
 *   get:
 *     summary: Connection status / Estado de conexión
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Connection status / Estado de conexión
 */
router.get(
  '/mercadopago/oauth/status',
  authenticate,
  requireVendor,
  MercadoPagoOAuthController.status
);

/**
 * @swagger
 * /payment/mercadopago/oauth/disconnect:
 *   post:
 *     summary: Disconnect MercadoPago account / Desconectar cuenta
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Disconnected / Desconectado
 */
router.post(
  '/mercadopago/oauth/disconnect',
  authenticate,
  requireVendor,
  MercadoPagoOAuthController.disconnect
);

export default router;
