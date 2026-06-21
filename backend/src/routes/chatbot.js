const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { processMessage, getHistory, saveMessage, clearHistory } = require('../services/chatbot');
const { AppError } = require('../middleware/errorHandler');
const pagination = require('../middleware/pagination');

router.use(auth);

router.post('/chat', async (req, res, next) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      throw new AppError('Message is required', 400);
    }

    await saveMessage(req.user.id, 'user', message.trim(), req.user.organization_id);

    const response = await processMessage(req.user.id, message.trim(), req.user.organization_id);

    await saveMessage(req.user.id, 'assistant', response.text, req.user.organization_id, {
      suggestions: response.suggestions,
      quickActions: response.quickActions,
      language: response.language
    });

    res.json(response);
  } catch (error) {
    next(error);
  }
});

router.get('/history', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const history = await getHistory(req.user.id, req.user.organization_id, limit);
    res.json(history);
  } catch (error) {
    next(error);
  }
});

router.delete('/history', async (req, res, next) => {
  try {
    await clearHistory(req.user.id, req.user.organization_id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

module.exports = router;
