import { Router } from 'express';
import { body } from 'express-validator';
import * as ShippingAddressController from '../controllers/ShippingAddressController';
import { authenticate, requireUser } from '../middleware/auth.middleware';

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
router.post('/', addressValidationRules.create, ShippingAddressController.createAddress);

router.get('/', ShippingAddressController.getAddresses);

router.get('/:id', ShippingAddressController.getAddress);

router.put('/:id', addressValidationRules.update, ShippingAddressController.updateAddress);

router.delete('/:id', ShippingAddressController.deleteAddress);

router.put('/:id/default', ShippingAddressController.setDefaultAddress);

export default router;
