const { body, param, query, validationResult } = require('express-validator');

const validate = (validations) => {
  return async (req, res, next) => {
    for (const validation of validations) {
      const result = await validation.run(req);
      if (result.errors.length) break;
    }
    next();
  };
};

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        statusCode: 400,
        errors: errors.array().map(e => ({ field: e.path, message: e.msg }))
      }
    });
  }
  next();
};

const loginSchema = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
];

const registerSchema = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('first_name').trim().notEmpty().withMessage('First name is required'),
  body('last_name').trim().notEmpty().withMessage('Last name is required')
];

const productSchema = [
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('sku').trim().notEmpty().withMessage('SKU is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('quantity').isInt({ min: 0 }).withMessage('Quantity must be a non-negative integer')
];

const contactSchema = [
  body('type').isIn(['customer', 'vendor', 'lead']).withMessage('Type must be customer, vendor, or lead'),
  body('first_name').trim().notEmpty().withMessage('First name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required')
];

const invoiceSchema = [
  body('type').isIn(['invoice', 'purchase']).withMessage('Type must be invoice or purchase'),
  body('contact_id').isInt({ min: 1 }).withMessage('Valid contact ID is required'),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required')
];

const projectSchema = [
  body('name').trim().notEmpty().withMessage('Project name is required'),
  body('status').optional().isIn(['planning', 'in_progress', 'on_hold', 'completed', 'cancelled']).withMessage('Invalid status'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority')
];

module.exports = {
  validate,
  validateRequest,
  loginSchema,
  registerSchema,
  productSchema,
  contactSchema,
  invoiceSchema,
  projectSchema
};
