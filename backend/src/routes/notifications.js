const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { auth } = require('../middleware/auth');
const { sendEmail, sendWhatsApp } = require('../services/notifications');
const { AppError } = require('../middleware/errorHandler');
const pagination = require('../middleware/pagination');

router.use(auth);

router.get('/', pagination, async (req, res, next) => {
  try {
    const { limit, offset } = req.pagination;

    const countResult = await pool.query('SELECT COUNT(*) FROM notifications WHERE user_id = $1', [req.user.id]);
    res.setHeader('X-Total-Count', countResult.rows[0].count);

    const result = await pool.query(`
      SELECT * FROM notifications
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `, [req.user.id, limit, offset]);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

router.get('/unread', async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT COUNT(*) as count FROM notifications
      WHERE user_id = $1 AND read = false
    `, [req.user.id]);
    res.json({ count: parseInt(result.rows[0].count) });
  } catch (error) {
    next(error);
  }
});

router.put('/:id/read', async (req, res, next) => {
  try {
    await pool.query(
      'UPDATE notifications SET read = true WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    next(error);
  }
});

router.put('/read-all', async (req, res, next) => {
  try {
    await pool.query(
      'UPDATE notifications SET read = true WHERE user_id = $1',
      [req.user.id]
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await pool.query(
      'DELETE FROM notifications WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.get('/settings', async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT * FROM notification_settings WHERE user_id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.json({
        email_enabled: true,
        whatsapp_enabled: false,
        whatsapp_number: '',
        daily_report: true,
        stock_alerts: true,
        invoice_alerts: true,
        project_updates: true
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.put('/settings', async (req, res, next) => {
  try {
    const { email_enabled, whatsapp_enabled, whatsapp_number, daily_report, stock_alerts, invoice_alerts, project_updates } = req.body;

    const result = await pool.query(`
      INSERT INTO notification_settings (user_id, email_enabled, whatsapp_enabled, whatsapp_number, daily_report, stock_alerts, invoice_alerts, project_updates)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (user_id)
      DO UPDATE SET email_enabled = $2, whatsapp_enabled = $3, whatsapp_number = $4,
      daily_report = $5, stock_alerts = $6, invoice_alerts = $7, project_updates = $8, updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [req.user.id, email_enabled, whatsapp_enabled, whatsapp_number, daily_report, stock_alerts, invoice_alerts, project_updates]);

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.post('/test-email', async (req, res, next) => {
  try {
    const result = await pool.query('SELECT email FROM users WHERE id = $1', [req.user.id]);
    const email = result.rows[0]?.email;

    if (!email) {
      throw new AppError('No email found', 400);
    }

    const sent = await sendEmail(email, 'Test ERP System', '<h1>✅ Configuration Email OK</h1><p>Votre système de notifications est correctement configuré.</p>');

    if (sent) {
      res.json({ message: 'Test email sent' });
    } else {
      throw new AppError('Failed to send email', 500);
    }
  } catch (error) {
    next(error);
  }
});

router.post('/test-whatsapp', async (req, res, next) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      throw new AppError('Phone number required', 400);
    }

    const sent = await sendWhatsApp(phone, '✅ Test ERP System - Votre WhatsApp est configuré!');

    if (sent) {
      res.json({ message: 'Test WhatsApp sent' });
    } else {
      throw new AppError('Failed to send WhatsApp', 500);
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;
