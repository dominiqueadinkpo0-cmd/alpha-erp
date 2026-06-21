const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { auth } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');
const pagination = require('../middleware/pagination');
const { cacheMiddleware, invalidateCache } = require('../middleware/cache');

router.use(auth);

router.get('/', cacheMiddleware(120), pagination, async (req, res, next) => {
  try {
    const { status, department, search } = req.query;
    const { limit, offset } = req.pagination;
    let query = `
      SELECT e.*,
        u.first_name || ' ' || u.last_name as user_name,
        u.email as user_email
      FROM employees e
      LEFT JOIN users u ON e.user_id = u.id
    `;
    let countQuery = 'SELECT COUNT(*) FROM employees e LEFT JOIN users u ON e.user_id = u.id';
    const params = [];
    const countParams = [];
    const conditions = [];
    const countConditions = [];

    if (status) {
      params.push(status);
      countParams.push(status);
      conditions.push(`e.status = $${params.length}`);
      countConditions.push(`e.status = $${countParams.length}`);
    }

    if (department) {
      params.push(department);
      countParams.push(department);
      conditions.push(`e.department = $${params.length}`);
      countConditions.push(`e.department = $${countParams.length}`);
    }

    if (search) {
      params.push(`%${search}%`);
      countParams.push(`%${search}%`);
      conditions.push(`(u.first_name ILIKE $${params.length} OR u.last_name ILIKE $${params.length} OR e.employee_number ILIKE $${params.length})`);
      countConditions.push(`(u.first_name ILIKE $${countParams.length} OR u.last_name ILIKE $${countParams.length} OR e.employee_number ILIKE $${countParams.length})`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
      countQuery += ' WHERE ' + countConditions.join(' AND ');
    }

    const countResult = await pool.query(countQuery, countParams);
    res.setHeader('X-Total-Count', countResult.rows[0].count);

    query += ' ORDER BY e.created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

router.get('/stats/overview', async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'active') as active,
        COUNT(*) FILTER (WHERE status = 'inactive') as inactive,
        COUNT(DISTINCT department) as departments,
        AVG(salary) as avg_salary
      FROM employees
    `);

    const byDepartment = await pool.query(`
      SELECT department, COUNT(*) as count
      FROM employees
      WHERE status = 'active'
      GROUP BY department
      ORDER BY count DESC
    `);

    res.json({
      overview: result.rows[0],
      by_department: byDepartment.rows
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT e.*,
        u.first_name || ' ' || u.last_name as user_name,
        u.email as user_email
       FROM employees e
       LEFT JOIN users u ON e.user_id = u.id
       WHERE e.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Employee not found', 404);
    }

    const leaves = await pool.query(
      'SELECT * FROM leaves WHERE employee_id = $1 ORDER BY start_date DESC',
      [req.params.id]
    );

    res.json({ ...result.rows[0], leaves: leaves.rows });
  } catch (error) {
    next(error);
  }
});

router.post('/', invalidateCache('/employees*'), async (req, res, next) => {
  try {
    const { user_id, employee_number, position, department, hire_date, salary, emergency_contact, emergency_phone } = req.body;

    const result = await pool.query(
      `INSERT INTO employees (user_id, employee_number, position, department, hire_date, salary, emergency_contact, emergency_phone)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [user_id, employee_number, position, department, hire_date, salary, emergency_contact, emergency_phone]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', invalidateCache('/employees*'), async (req, res, next) => {
  try {
    const { position, department, salary, status, emergency_contact, emergency_phone } = req.body;

    const result = await pool.query(
      `UPDATE employees SET position=$1, department=$2, salary=$3, status=$4,
       emergency_contact=$5, emergency_phone=$6, updated_at=CURRENT_TIMESTAMP
       WHERE id=$7 RETURNING *`,
      [position, department, salary, status, emergency_contact, emergency_phone, req.params.id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Employee not found', 404);
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.post('/:id/leaves', invalidateCache('/employees*'), async (req, res, next) => {
  try {
    const { type, start_date, end_date, days, notes } = req.body;

    const result = await pool.query(
      `INSERT INTO leaves (employee_id, type, start_date, end_date, days, notes)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.params.id, type, start_date, end_date, days, notes]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.put('/:employeeId/leaves/:leaveId', invalidateCache('/employees*'), async (req, res, next) => {
  try {
    const { status } = req.body;

    const result = await pool.query(
      `UPDATE leaves SET status=$1, approved_by=$2 WHERE id=$3 AND employee_id=$4 RETURNING *`,
      [status, req.user.id, req.params.leaveId, req.params.employeeId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Leave not found', 404);
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
