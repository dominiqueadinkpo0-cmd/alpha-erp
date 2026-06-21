const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { auth, adminOnly } = require('../middleware/auth');

router.use(auth);
router.use(adminOnly);

router.get('/logs', async (req, res, next) => {
  try {
    const { user_id, entity_type, date_from, date_to, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    let query = `
      SELECT al.*, u.first_name || ' ' || u.last_name as user_name, u.email as user_email
      FROM activity_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE 1=1
    `;
    let countQuery = 'SELECT COUNT(*) FROM activity_logs al WHERE 1=1';
    const params = [];
    const countParams = [];

    if (user_id) {
      params.push(user_id);
      countParams.push(user_id);
      query += ` AND al.user_id = $${params.length}`;
      countQuery += ` AND al.user_id = $${countParams.length}`;
    }

    if (entity_type) {
      params.push(entity_type);
      countParams.push(entity_type);
      query += ` AND al.entity_type = $${params.length}`;
      countQuery += ` AND al.entity_type = $${countParams.length}`;
    }

    if (date_from) {
      params.push(date_from);
      countParams.push(date_from);
      query += ` AND al.created_at >= $${params.length}`;
      countQuery += ` AND al.created_at >= $${countParams.length}`;
    }

    if (date_to) {
      params.push(date_to);
      countParams.push(date_to);
      query += ` AND al.created_at <= $${params.length}`;
      countQuery += ` AND al.created_at <= $${countParams.length}`;
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    query += ` ORDER BY al.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit), offset);

    const result = await pool.query(query, params);

    res.json({
      logs: result.rows,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    next(error);
  }
});

router.get('/stats', async (req, res, next) => {
  try {
    const actionsPerDay = await pool.query(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM activity_logs
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);

    const topUsers = await pool.query(`
      SELECT al.user_id, u.first_name || ' ' || u.last_name as user_name, u.email, COUNT(*) as action_count
      FROM activity_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE al.created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY al.user_id, u.first_name, u.last_name, u.email
      ORDER BY action_count DESC
      LIMIT 10
    `);

    const topActions = await pool.query(`
      SELECT action, COUNT(*) as count
      FROM activity_logs
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY action
      ORDER BY count DESC
      LIMIT 10
    `);

    const totalLogs = await pool.query('SELECT COUNT(*) FROM activity_logs');

    res.json({
      actionsPerDay: actionsPerDay.rows,
      topUsers: topUsers.rows,
      topActions: topActions.rows,
      totalLogs: parseInt(totalLogs.rows[0].count)
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
