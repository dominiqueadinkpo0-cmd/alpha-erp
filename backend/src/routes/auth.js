const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const { auth } = require('../middleware/auth');
const { validate, validateRequest, loginSchema, registerSchema } = require('../middleware/validate');
const { AppError } = require('../middleware/errorHandler');
const { trialGuard, getTrialStatus, getClientIp } = require('../middleware/trialGuard');

router.post('/login', validate(loginSchema), validateRequest, async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    if (result.rows.length === 0) {
      throw new AppError('Invalid credentials', 401);
    }

    const user = result.rows[0];

    if (!user.is_active) {
      throw new AppError('Account disabled', 403);
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      throw new AppError('Invalid credentials', 401);
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
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
        department: user.department
      },
      trial: {
        isActive: trialStatus.isActive,
        expiresAt: trialStatus.expiresAt,
        daysRemaining: trialStatus.daysRemaining,
        expired: !trialStatus.isActive && trialStatus.expiresAt !== null
      }
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

    const result = await pool.query(
      'INSERT INTO users (email, password, first_name, last_name, department) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, first_name, last_name, role',
      [email, hashedPassword, first_name, last_name, department]
    );

    if (req.trial) {
      await pool.query(
        'UPDATE ip_trials SET user_id = $1 WHERE id = $2',
        [result.rows[0].id, req.trial.id]
      );
    }

    const token = jwt.sign(
      { id: result.rows[0].id, email, role: 'user' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(201).json({
      token,
      user: result.rows[0],
      trial: req.trial || null
    });
  } catch (error) {
    next(error);
  }
});

router.get('/me', auth, async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT id, email, first_name, last_name, role, department FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      throw new AppError('User not found', 404);
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
