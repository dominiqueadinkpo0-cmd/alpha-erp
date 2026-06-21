const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { auth } = require('../middleware/auth');
const axios = require('axios');
const { AppError } = require('../middleware/errorHandler');

router.use(auth);

const GRAPH_API = 'https://graph.microsoft.com/v1.0';

router.post('/connect', async (req, res, next) => {
  try {
    const scopes = [
      'ChannelMessage.Send',
      'Team.ReadBasic.All',
      'Channel.ReadBasic.All',
      'User.Read'
    ].join(' ');

    const params = new URLSearchParams({
      client_id: process.env.TEAMS_CLIENT_ID,
      response_type: 'code',
      redirect_uri: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/integrations/teams/callback`,
      response_mode: 'query',
      scope: scopes,
      state: req.user.id
    });

    res.json({ url: `https://login.microsoftonline.com/${process.env.TEAMS_TENANT_ID || 'common'}/oauth2/v2.0/authorize?${params.toString()}` });
  } catch (error) {
    next(error);
  }
});

router.get('/callback', async (req, res, next) => {
  const { code, state } = req.query;

  try {
    const tokenRes = await axios.post(
      `https://login.microsoftonline.com/${process.env.TEAMS_TENANT_ID || 'common'}/oauth2/v2.0/token`,
      new URLSearchParams({
        client_id: process.env.TEAMS_CLIENT_ID,
        client_secret: process.env.TEAMS_CLIENT_SECRET,
        code,
        redirect_uri: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/integrations/teams/callback`,
        grant_type: 'authorization_code',
        scope: 'ChannelMessage.Send Team.ReadBasic.All Channel.ReadBasic.All User.Read'
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const tokens = tokenRes.data;

    const meRes = await axios.get(`${GRAPH_API}/me`, {
      headers: { Authorization: `Bearer ${tokens.access_token}` }
    });

    const tenantId = meRes.data.officeTenantId || process.env.TEAMS_TENANT_ID || '';

    let teamsData = [];
    try {
      const teamsRes = await axios.get(`${GRAPH_API}/me/joinedTeams`, {
        headers: { Authorization: `Bearer ${tokens.access_token}` }
      });
      teamsData = teamsRes.data.value || [];
    } catch (e) {}

    const teamId = teamsData[0]?.id || '';
    let channelsData = [];
    if (teamId) {
      try {
        const channelsRes = await axios.get(`${GRAPH_API}/teams/${teamId}/channels`, {
          headers: { Authorization: `Bearer ${tokens.access_token}` }
        });
        channelsData = channelsRes.data.value || [];
      } catch (e) {}
    }

    const channelId = channelsData.find(c => c.displayName === 'General')?.id || channelsData[0]?.id || '';
    const channelName = channelsData.find(c => c.displayName === 'General')?.displayName || channelsData[0]?.displayName || '';

    await pool.query(`
      INSERT INTO teams_integrations (user_id, tenant_id, access_token, refresh_token, team_id, channel_id, channel_name, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, true)
      ON CONFLICT (user_id)
      DO UPDATE SET tenant_id = $2, access_token = $3, refresh_token = $4, team_id = $5, channel_id = $6, channel_name = $7, is_active = true, updated_at = CURRENT_TIMESTAMP
    `, [state, tenantId, tokens.access_token, tokens.refresh_token, teamId, channelId, channelName]);

    res.redirect('/settings?connected=teams');
  } catch (error) {
    next(error);
  }
});

router.post('/test', async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT * FROM teams_integrations WHERE user_id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Teams not connected', 400);
    }

    const integration = result.rows[0];
    let accessToken = integration.access_token;

    if (integration.refresh_token) {
      try {
        const refreshRes = await axios.post(
          `https://login.microsoftonline.com/${integration.tenant_id || 'common'}/oauth2/v2.0/token`,
          new URLSearchParams({
            client_id: process.env.TEAMS_CLIENT_ID,
            client_secret: process.env.TEAMS_CLIENT_SECRET,
            refresh_token: integration.refresh_token,
            grant_type: 'refresh_token',
            scope: 'ChannelMessage.Send Team.ReadBasic.All Channel.ReadBasic.All User.Read'
          }),
          { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        );

        if (refreshRes.data.access_token) {
          accessToken = refreshRes.data.access_token;
          await pool.query(
            'UPDATE teams_integrations SET access_token = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2',
            [accessToken, req.user.id]
          );
          if (refreshRes.data.refresh_token) {
            await pool.query(
              'UPDATE teams_integrations SET refresh_token = $1 WHERE user_id = $2',
              [refreshRes.data.refresh_token, req.user.id]
            );
          }
        }
      } catch (e) {}
    }

    await axios.post(
      `${GRAPH_API}/teams/${integration.team_id}/channels/${integration.channel_id}/messages`,
      {
        body: {
          contentType: 'text',
          content: '✅ ERP System Test\nYour Teams integration is working correctly.'
        }
      },
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    res.json({ message: 'Test message sent successfully' });
  } catch (error) {
    next(error);
  }
});

router.post('/notify', async (req, res, next) => {
  try {
    const { message, teamId, channelId } = req.body;

    const result = await pool.query(
      'SELECT * FROM teams_integrations WHERE user_id = $1 AND is_active = true',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Teams not connected', 400);
    }

    const integration = result.rows[0];
    let accessToken = integration.access_token;

    if (integration.refresh_token) {
      try {
        const refreshRes = await axios.post(
          `https://login.microsoftonline.com/${integration.tenant_id || 'common'}/oauth2/v2.0/token`,
          new URLSearchParams({
            client_id: process.env.TEAMS_CLIENT_ID,
            client_secret: process.env.TEAMS_CLIENT_SECRET,
            refresh_token: integration.refresh_token,
            grant_type: 'refresh_token',
            scope: 'ChannelMessage.Send Team.ReadBasic.All Channel.ReadBasic.All User.Read'
          }),
          { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        );

        if (refreshRes.data.access_token) {
          accessToken = refreshRes.data.access_token;
          await pool.query(
            'UPDATE teams_integrations SET access_token = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2',
            [accessToken, req.user.id]
          );
          if (refreshRes.data.refresh_token) {
            await pool.query(
              'UPDATE teams_integrations SET refresh_token = $1 WHERE user_id = $2',
              [refreshRes.data.refresh_token, req.user.id]
            );
          }
        }
      } catch (e) {}
    }

    const targetTeamId = teamId || integration.team_id;
    const targetChannelId = channelId || integration.channel_id;

    await axios.post(
      `${GRAPH_API}/teams/${targetTeamId}/channels/${targetChannelId}/messages`,
      {
        body: {
          contentType: 'text',
          content: message
        }
      },
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    res.json({ message: 'Notification sent successfully' });
  } catch (error) {
    next(error);
  }
});

router.get('/status', async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT id, team_id, channel_id, channel_name, is_active, created_at FROM teams_integrations WHERE user_id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.json({ connected: false });
    }

    const integration = result.rows[0];
    let apiWorking = false;

    try {
      const meRes = await axios.get(`${GRAPH_API}/me`, {
        headers: { Authorization: `Bearer ${integration.access_token || ''}` }
      });
      apiWorking = meRes.status === 200;
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
    await pool.query('DELETE FROM teams_integrations WHERE user_id = $1', [req.user.id]);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

module.exports = router;
