import { Router } from 'express';
import { body } from 'express-validator';
import * as ShippingAddressController from '../controllers/ShippingAddressController.js';
import { authenticate, requireUser } from '../middleware/auth.middleware.js';

/**
 * @fileoverview Shipping Address Routes
 * @description API endpoints for user shipping address management
 * @module routes/address
 */

const router = Router();

// Validation rules
const addressValidationRules = {
  create: [
    body('recipientName').notEmpty().withMessage('Recipient name is required'),
    body('street').notEmpty().withMessage('Street is required'),
    body('city').notEmpty().withMessage('City is required'),
    body('state').notEmpty().withMessage('State is required'),
    body('postalCode').notEmpty().withMessage('Postal code is required'),
    body('country').isLength({ min: 2, max: 3 }).withMessage('Country must be 2-3 characters'),
    body('label').optional().isString().isLength({ max: 100 }),
    body('phone').optional().isString().isLength({ max: 50 }),
    body('instructions').optional().isString(),
    body('isDefault').optional().isBoolean(),
  ],
  update: [
    body('recipientName').optional().notEmpty().withMessage('Recipient name cannot be empty'),
    body('street').optional().notEmpty().withMessage('Street cannot be empty'),
    body('city').optional().notEmpty().withMessage('City cannot be empty'),
    body('state').optional().notEmpty().withMessage('State cannot be empty'),
    body('postalCode').optional().notEmpty().withMessage('Postal code cannot be empty'),
    body('country')
      .optional()
      .isLength({ min: 2, max: 3 })
      .withMessage('Country must be 2-3 characters'),
    body('label').optional().isString().isLength({ max: 100 }),
    body('phone').optional().isString().isLength({ max: 50 }),
    body('instructions').optional().isString(),
    body('isDefault').optional().isBoolean(),
  ],
};

// All routes require authentication
router.use(authenticate);
router.use(requireUser);

// CRUD routes

/**
 * @swagger
 * /addresses:
 *   post:
 *     summary: Create a shipping address / Crear dirección de envío
 *     description: Creates a new shipping address for the authenticated user
 *     tags: [Address]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - recipientName
 *               - street
 *               - city
 *               - state
 *               - postalCode
 *               - country
 *             properties:
 *               recipientName:
 *                 type: string
 *                 description: Recipient name / Nombre del destinatario
 *               street:
 *                 type: string
 *                 description: Street address / Dirección
 *               city:
 *                 type: string
 *                 description: City / Ciudad
 *               state:
 *                 type: string
 *                 description: State or department / Departamento
 *               postalCode:
 *                 type: string
 *                 description: Postal code / Código postal
 *               country:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 3
 *                 description: Country code (ISO 3166-1) / Código de país
 *               label:
 *                 type: string
 *                 maxLength: 100
 *                 description: Custom label for the address / Etiqueta personalizada
 *               phone:
 *                 type: string
 *                 maxLength: 50
 *                 description: Contact phone number / Teléfono de contacto
 *               instructions:
 *                 type: string
 *                 description: Delivery instructions / Instrucciones de entrega
 *               isDefault:
 *                 type: boolean
 *                 description: Set as default address / Establecer como dirección predeterminada
 *     responses:
 *       201:
 *         description: Address created / Dirección creada
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
 *         description: Validation error / Error de validación
 *       401:
 *         description: Not authenticated / No autenticado
 *       500:
 *         description: Internal error / Error interno
 */
router.post('/', addressValidationRules.create, ShippingAddressController.createAddress);

/**
 * @swagger
 * /addresses:
 *   get:
 *     summary: List shipping addresses / Listar direcciones de envío
 *     description: Returns all shipping addresses for the authenticated user (default first)
 *     tags: [Address]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Addresses retrieved / Direcciones obtenidas
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
router.get('/', ShippingAddressController.getAddresses);

/**
 * @swagger
 * /addresses/{id}:
 *   get:
 *     summary: Get address by ID / Obtener dirección por ID
 *     description: Returns a specific shipping address for the authenticated user
 *     tags: [Address]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Address UUID / UUID de la dirección
 *     responses:
 *       200:
 *         description: Address retrieved / Dirección obtenida
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
 *         description: Address not found / Dirección no encontrada
 *       401:
 *         description: Not authenticated / No autenticado
 *       500:
 *         description: Internal error / Error interno
 */
router.get('/:id', ShippingAddressController.getAddress);

/**
 * @swagger
 * /addresses/{id}:
 *   put:
 *     summary: Update shipping address / Actualizar dirección de envío
 *     description: Updates an existing shipping address for the authenticated user
 *     tags: [Address]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Address UUID / UUID de la dirección
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               recipientName:
 *                 type: string
 *                 description: Recipient name / Nombre del destinatario
 *               street:
 *                 type: string
 *                 description: Street address / Dirección
 *               city:
 *                 type: string
 *                 description: City / Ciudad
 *               state:
 *                 type: string
 *                 description: State or department / Departamento
 *               postalCode:
 *                 type: string
 *                 description: Postal code / Código postal
 *               country:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 3
 *                 description: Country code (ISO 3166-1) / Código de país
 *               label:
 *                 type: string
 *                 maxLength: 100
 *                 description: Custom label for the address / Etiqueta personalizada
 *               phone:
 *                 type: string
 *                 maxLength: 50
 *                 description: Contact phone number / Teléfono de contacto
 *               instructions:
 *                 type: string
 *                 description: Delivery instructions / Instrucciones de entrega
 *               isDefault:
 *                 type: boolean
 *                 description: Set as default address / Establecer como dirección predeterminada
 *     responses:
 *       200:
 *         description: Address updated / Dirección actualizada
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
 *         description: Validation error or address not found / Error de validación o dirección no encontrada
 *       401:
 *         description: Not authenticated / No autenticado
 *       500:
 *         description: Internal error / Error interno
 */
router.put('/:id', addressValidationRules.update, ShippingAddressController.updateAddress);

/**
 * @swagger
 * /addresses/{id}:
 *   delete:
 *     summary: Delete shipping address / Eliminar dirección de envío
 *     description: Soft-deletes a shipping address (cannot delete default address)
 *     tags: [Address]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Address UUID / UUID de la dirección
 *     responses:
 *       200:
 *         description: Address deleted / Dirección eliminada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *       400:
 *         description: Cannot delete default address or address not found / No se puede eliminar dirección predeterminada
 *       401:
 *         description: Not authenticated / No autenticado
 *       500:
 *         description: Internal error / Error interno
 */
router.delete('/:id', ShippingAddressController.deleteAddress);

/**
 * @swagger
 * /addresses/{id}/default:
 *   put:
 *     summary: Set address as default / Establecer dirección como predeterminada
 *     description: Sets a shipping address as the default for the authenticated user
 *     tags: [Address]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Address UUID / UUID de la dirección
 *     responses:
 *       200:
 *         description: Default address updated / Dirección predeterminada actualizada
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
 *         description: Address not found / Dirección no encontrada
 *       401:
 *         description: Not authenticated / No autenticado
 *       500:
 *         description: Internal error / Error interno
 */
router.put('/:id/default', ShippingAddressController.setDefaultAddress);

export default router;
