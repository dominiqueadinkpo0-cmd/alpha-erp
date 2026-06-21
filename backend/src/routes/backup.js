const express = require('express');
const router = express.Router();
const { auth, adminOnly } = require('../middleware/auth');
const { createBackup, listBackups, restoreBackup, deleteBackup } = require('../services/backup');

router.use(auth);
router.use(adminOnly);

router.post('/create', async (req, res, next) => {
  try {
    const result = await createBackup();
    res.json({ message: 'Backup created successfully', ...result });
  } catch (error) {
    next(error);
  }
});

router.get('/list', async (req, res, next) => {
  try {
    const backups = await listBackups();
    res.json(backups);
  } catch (error) {
    next(error);
  }
});

router.post('/restore', async (req, res, next) => {
  try {
    const { filename } = req.body;
    if (!filename) {
      return res.status(400).json({ error: 'Filename is required' });
    }
    const result = await restoreBackup(filename);
    res.json({ message: 'Backup restored successfully', ...result });
  } catch (error) {
    next(error);
  }
});

router.delete('/:filename', async (req, res, next) => {
  try {
    const result = await deleteBackup(req.params.filename);
    res.json({ message: 'Backup deleted successfully', ...result });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
