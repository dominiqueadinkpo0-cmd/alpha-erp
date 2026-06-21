const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { auth } = require('../middleware/auth');
const { validate, validateRequest, contactSchema } = require('../middleware/validate');
const { AppError } = require('../middleware/errorHandler');
const pagination = require('../middleware/pagination');
const { cacheMiddleware, invalidateCache } = require('../middleware/cache');

router.use(auth);

router.get('/', cacheMiddleware(120), pagination, async (req, res, next) => {
  try {
    const { type, search } = req.query;
    const { limit, offset } = req.pagination;
    let query = 'SELECT * FROM contacts WHERE is_active = true';
    let countQuery = 'SELECT COUNT(*) FROM contacts WHERE is_active = true';
    const params = [];
    const countParams = [];

    if (type) {
      params.push(type);
      countParams.push(type);
      query += ` AND type = $${params.length}`;
      countQuery += ` AND type = $${countParams.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      countParams.push(`%${search}%`);
      const cond = ` AND (first_name ILIKE $${params.length} OR last_name ILIKE $${params.length} OR company ILIKE $${params.length})`;
      query += cond;
      countQuery += cond;
    }

    const countResult = await pool.query(countQuery, countParams);
    res.setHeader('X-Total-Count', countResult.rows[0].count);

    query += ' ORDER BY first_name, last_name LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM contacts WHERE id = $1', [req.params.id]);

    if (result.rows.length === 0) {
      throw new AppError('Contact not found', 404);
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.post('/', invalidateCache('/contacts*'), validate(contactSchema), validateRequest, async (req, res, next) => {
  try {
    const { type, first_name, last_name, email, phone, company, address, city, country, notes } = req.body;

    const result = await pool.query(
      `INSERT INTO contacts (type, first_name, last_name, email, phone, company, address, city, country, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [type, first_name, last_name, email, phone, company, address, city, country, notes]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', invalidateCache('/contacts*'), validate(contactSchema), validateRequest, async (req, res, next) => {
  try {
    const { type, first_name, last_name, email, phone, company, address, city, country, notes } = req.body;

    const result = await pool.query(
      `UPDATE contacts SET type=$1, first_name=$2, last_name=$3, email=$4, phone=$5,
       company=$6, address=$7, city=$8, country=$9, notes=$10, updated_at=CURRENT_TIMESTAMP
       WHERE id=$11 RETURNING *`,
      [type, first_name, last_name, email, phone, company, address, city, country, notes, req.params.id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Contact not found', 404);
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', invalidateCache('/contacts*'), async (req, res, next) => {
  try {
    await pool.query('UPDATE contacts SET is_active = false WHERE id = $1', [req.params.id]);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

module.exports = router;
