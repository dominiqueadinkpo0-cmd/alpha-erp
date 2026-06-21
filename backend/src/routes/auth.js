const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require('../config/database');
const { auth, adminOnly } = require('../middleware/auth');
const { validate, validateRequest, loginSchema, registerSchema } = require('../middleware/validate');
const { AppError } = require('../middleware/errorHandler');
const { trialGuard, getTrialStatus, getClientIp } = require('../middleware/trialGuard');

router.post('/login', validate(loginSchema), validateRequest, async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      throw new AppError('Invalid credentials', 401);
    }

    const user = result.rows[0];

    if (!user.is_active) {
      throw new AppError('Account disabled', 403);
    }

    // Check organization is active
    if (user.organization_id) {
      const orgResult = await pool.query(
        'SELECT is_active FROM organizations WHERE id = $1',
        [user.organization_id]
      );
      if (orgResult.rows.length === 0 || !orgResult.rows[0].is_active) {
        throw new AppError('Organization is suspended', 403);
      }
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      throw new AppError('Invalid credentials', 401);
    }

    // Force password change on first login (if password_changed_at is null)
    const forcePasswordChange = !user.password_changed_at && user.role === 'admin';

    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role,
        organization_id: user.organization_id 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    const ip = getClientIp(req);
    const trialStatus = await getTrialStatus(ip);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        department: user.department,
        organization_id: user.organization_id
      },
      trial: {
        isActive: trialStatus.isActive,
        expiresAt: trialStatus.expiresAt,
        daysRemaining: trialStatus.daysRemaining,
        expired: !trialStatus.isActive && trialStatus.expiresAt !== null
      },
      forcePasswordChange
    });
  } catch (error) {
    next(error);
  }
});

router.post('/register', validate(registerSchema), validateRequest, trialGuard, async (req, res, next) => {
  try {
    const { email, password, first_name, last_name, department } = req.body;

    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      throw new AppError('Email already exists', 409);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Get or create default organization
    let orgResult = await pool.query('SELECT id FROM organizations WHERE slug = $1', ['default']);
    if (orgResult.rows.length === 0) {
      orgResult = await pool.query(
        'INSERT INTO organizations (name, slug) VALUES ($1, $2) RETURNING id',
        ['Alpha ERP - Compte par défaut', 'default']
      );
    }
    const organizationId = orgResult.rows[0].id;

    const result = await pool.query(
      'INSERT INTO users (email, password, first_name, last_name, department, organization_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, email, first_name, last_name, role',
      [email, hashedPassword, first_name, last_name, department, organizationId]
    );

    if (req.trial) {
      await pool.query(
        'UPDATE ip_trials SET user_id = $1 WHERE id = $2',
        [result.rows[0].id, req.trial.id]
      );
    }

    const token = jwt.sign(
      { id: result.rows[0].id, email, role: 'user', organization_id: organizationId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(201).json({
      token,
      user: { ...result.rows[0], organization_id: organizationId },
      trial: req.trial || null
    });
  } catch (error) {
    next(error);
  }
});

// Register a new organization with admin user
router.post('/register-organization', async (req, res, next) => {
  try {
    const { organization_name, slug, email, password, first_name, last_name } = req.body;

    // Validate required fields
    if (!organization_name || !slug || !email || !password || !first_name || !last_name) {
      throw new AppError('All fields are required', 400);
    }

    // Validate slug format
    if (!/^[a-z0-9-]+$/.test(slug)) {
      throw new AppError('Slug must contain only lowercase letters, numbers, and hyphens', 400);
    }

    // Check slug uniqueness
    const existingOrg = await pool.query('SELECT id FROM organizations WHERE slug = $1', [slug]);
    if (existingOrg.rows.length > 0) {
      throw new AppError('Organization slug already exists', 409);
    }

    // Check email uniqueness globally
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      throw new AppError('Email already exists', 409);
    }

    // Validate password strength
    if (password.length < 8) {
      throw new AppError('Password must be at least 8 characters', 400);
    }

    // Create organization
    const orgResult = await pool.query(
      'INSERT INTO organizations (name, slug) VALUES ($1, $2) RETURNING id',
      [organization_name, slug]
    );
    const organizationId = orgResult.rows[0].id;

    // Create admin user
    const hashedPassword = await bcrypt.hash(password, 10);
    const userResult = await pool.query(
      `INSERT INTO users (email, password, first_name, last_name, role, organization_id, password_changed_at) 
       VALUES ($1, $2, $3, $4, 'admin', $5, CURRENT_TIMESTAMP) 
       RETURNING id, email, first_name, last_name, role`,
      [email, hashedPassword, first_name, last_name, organizationId]
    );

    // Create default subscription (free plan)
    const freePlan = await pool.query('SELECT id FROM plans WHERE slug = $1', ['free']);
    if (freePlan.rows.length > 0) {
      const now = new Date();
      const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      await pool.query(
        `INSERT INTO subscriptions (user_id, plan_id, organization_id, status, billing_cycle, current_period_start, current_period_end)
         VALUES ($1, $2, $3, 'active', 'monthly', $4, $5)`,
        [userResult.rows[0].id, freePlan.rows[0].id, organizationId, now, thirtyDaysLater]
      );
    }

    // Generate token
    const token = jwt.sign(
      { 
        id: userResult.rows[0].id, 
        email, 
        role: 'admin',
        organization_id: organizationId 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    // TODO: Send welcome email via nodemailer
    // const transporter = require('../config/email');
    // await transporter.sendMail({ ... });

    res.status(201).json({
      token,
      organization: {
        id: organizationId,
        name: organization_name,
        slug
      },
      user: userResult.rows[0]
    });
  } catch (error) {
    next(error);
  }
});

// Change password (forced on first login)
router.post('/change-password', auth, async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      throw new AppError('Current and new password are required', 400);
    }

    if (new_password.length < 8) {
      throw new AppError('New password must be at least 8 characters', 400);
    }

    const userResult = await pool.query('SELECT password FROM users WHERE id = $1', [req.user.id]);
    if (userResult.rows.length === 0) {
      throw new AppError('User not found', 404);
    }

    const validPassword = await bcrypt.compare(current_password, userResult.rows[0].password);
    if (!validPassword) {
      throw new AppError('Current password is incorrect', 401);
    }

    const hashedPassword = await bcrypt.hash(new_password, 10);
    await pool.query(
      'UPDATE users SET password = $1, password_changed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [hashedPassword, req.user.id]
    );

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
});

router.get('/me', auth, async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.department, u.organization_id,
              o.name as organization_name, o.slug as organization_slug
       FROM users u
       LEFT JOIN organizations o ON u.organization_id = o.id
       WHERE u.id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      throw new AppError('User not found', 404);
    }

    const user = result.rows[0];
    user.forcePasswordChange = !user.password_changed_at && user.role === 'admin';

    res.json(user);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
