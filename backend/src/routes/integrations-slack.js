const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { auth } = require('../middleware/auth');
const axios = require('axios');
const { AppError } = require('../middleware/errorHandler');

router.use(auth);

const SLACK_API = 'https://slack.com/api';

router.post('/connect', async (req, res, next) => {
  try {
    const scopes = [
      'channels:read', 'chat:write', 'incoming-webhook',
      'groups:read', 'users:read', 'team:read'
    ].join(',');

    const params = new URLSearchParams({
      client_id: process.env.SLACK_CLIENT_ID,
      scope: scopes,
      redirect_uri: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/integrations/slack/callback`,
      state: req.user.id
    });

    res.json({ url: `https://slack.com/oauth/v2/authorize?${params.toString()}` });
  } catch (error) {
    next(error);
  }
});

router.get('/callback', async (req, res, next) => {
  const { code, state } = req.query;

  try {
    const tokenRes = await axios.post('https://slack.com/api/oauth.v2.access', null, {
      params: {
        client_id: process.env.SLACK_CLIENT_ID,
        client_secret: process.env.SLACK_CLIENT_SECRET,
        code,
        redirect_uri: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/integrations/slack/callback`
      }
    });

    const data = tokenRes.data;
    if (!data.ok) {
      return res.redirect('/settings?error=slack_auth');
    }

    const botToken = data.access_token;
    const teamId = data.team?.id || data.team_id;
    const botUserId = data.bot_user_id;

    const testRes = await axios.get(`${SLACK_API}/auth.test`, {
      headers: { Authorization: `Bearer ${botToken}` }
    });

    const channelId = data.incoming_webhook?.channel_id || '';
    const channelName = data.incoming_webhook?.channel || '';
    const webhookUrl = data.incoming_webhook?.url || '';

    await pool.query(`
      INSERT INTO slack_integrations (user_id, team_id, bot_token, channel_id, channel_name, webhook_url, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, true)
      ON CONFLICT (user_id)
      DO UPDATE SET team_id = $2, bot_token = $3, channel_id = $4, channel_name = $5, webhook_url = $6, is_active = true, updated_at = CURRENT_TIMESTAMP
    `, [state, teamId, botToken, channelId, channelName, webhookUrl]);

    res.redirect('/settings?connected=slack');
  } catch (error) {
    next(error);
  }
});

router.post('/test', async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT * FROM slack_integrations WHERE user_id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Slack not connected', 400);
    }

    const integration = result.rows[0];

    if (integration.webhook_url) {
      await axios.post(integration.webhook_url, {
        text: 'ERP System Test Notification',
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '✅ *ERP System Test*\nYour Slack integration is working correctly.'
            }
          }
        ]
      });
    } else if (integration.bot_token && integration.channel_id) {
      await axios.post(`${SLACK_API}/chat.postMessage`, {
        channel: integration.channel_id,
        text: '✅ ERP System Test\nYour Slack integration is working correctly.'
      }, {
        headers: {
          Authorization: `Bearer ${integration.bot_token}`,
          'Content-Type': 'application/json'
        }
      });
    }

    res.json({ message: 'Test message sent successfully' });
  } catch (error) {
    next(error);
  }
});

router.post('/notify', async (req, res, next) => {
  try {
    const { message, channel } = req.body;

    const result = await pool.query(
      'SELECT * FROM slack_integrations WHERE user_id = $1 AND is_active = true',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Slack not connected', 400);
    }

    const integration = result.rows[0];
    const targetChannel = channel || integration.channel_id;

    if (integration.webhook_url && !channel) {
      await axios.post(integration.webhook_url, { text: message });
    } else {
      await axios.post(`${SLACK_API}/chat.postMessage`, {
        channel: targetChannel,
        text: message
      }, {
        headers: {
          Authorization: `Bearer ${integration.bot_token}`,
          'Content-Type': 'application/json'
        }
      });
    }

    res.json({ message: 'Notification sent successfully' });
  } catch (error) {
    next(error);
  }
});

router.get('/status', async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT id, team_id, channel_id, channel_name, is_active, created_at FROM slack_integrations WHERE user_id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.json({ connected: false });
    }

    const integration = result.rows[0];
    let apiWorking = false;

    try {
      const testRes = await axios.get(`${SLACK_API}/auth.test`, {
        headers: { Authorization: `Bearer ${integration.bot_token || ''}` }
      });
      apiWorking = testRes.data.ok;
    } catch (e) {
      apiWorking = false;
    }

    res.json({
      connected: integration.is_active,
      team_id: integration.team_id,
      channel_id: integration.channel_id,
      channel_name: integration.channel_name,
      api_working: apiWorking,
      connected_since: integration.created_at
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/disconnect', async (req, res, next) => {
  try {
    await pool.query('DELETE FROM slack_integrations WHERE user_id = $1', [req.user.id]);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

module.exports = router;
