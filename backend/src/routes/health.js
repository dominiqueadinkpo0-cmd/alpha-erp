const express = require('express');
const router = express.Router();
const pool = require('../config/database');

router.get('/', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      db: 'connected'
    });
  } catch (err) {
    res.status(503).json({ status: 'error', db: 'disconnected' });
  }
});

module.exports = router;
