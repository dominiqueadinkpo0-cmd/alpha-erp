const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { auth } = require('../middleware/auth');
const { google } = require('googleapis');
const { AppError } = require('../middleware/errorHandler');

router.use(auth);

let oauth2Client = null;

router.get('/google/status', async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT * FROM integrations WHERE user_id = $1 AND provider = $2',
      [req.user.id, 'google']
    );
    res.json({
      connected: result.rows.length > 0,
      calendar: result.rows[0]?.calendar_sync || false
    });
  } catch (error) {
    next(error);
  }
});

router.get('/google/auth', (req, res, next) => {
  try {
    oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events'
    ];

    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state: req.user.id
    });

    res.json({ url });
  } catch (error) {
    next(error);
  }
});

router.get('/google/callback', async (req, res, next) => {
  const { code, state } = req.query;

  try {
    const tokens = await oauth2Client.getToken(code);

    await pool.query(`
      INSERT INTO integrations (user_id, provider, access_token, refresh_token, calendar_sync)
      VALUES ($1, 'google', $2, $3, true)
      ON CONFLICT (user_id, provider)
      DO UPDATE SET access_token = $2, refresh_token = $3, calendar_sync = true, updated_at = CURRENT_TIMESTAMP
    `, [state, tokens.access_token, tokens.refresh_token]);

    res.redirect('/settings?connected=google');
  } catch (error) {
    next(error);
  }
});

router.post('/google/sync', async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT * FROM integrations WHERE user_id = $1 AND provider = $2',
      [req.user.id, 'google']
    );

    if (result.rows.length === 0) {
      throw new AppError('Google not connected', 400);
    }

    const integration = result.rows[0];

    oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );

    oauth2Client.setCredentials({
      access_token: integration.access_token,
      refresh_token: integration.refresh_token
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const events = await calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date().toISOString(),
      maxResults: 100,
      singleEvents: true,
      orderBy: 'startTime'
    });

    for (const event of events.data.items || []) {
      const startDate = event.start?.dateTime || event.start?.date;
      const endDate = event.end?.dateTime || event.end?.date;

      await pool.query(`
        INSERT INTO calendar_events (user_id, google_event_id, title, description, start_date, end_date, location)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (google_event_id)
        DO UPDATE SET title = $3, description = $4, start_date = $5, end_date = $6, location = $7, updated_at = CURRENT_TIMESTAMP
      `, [
        req.user.id,
        event.id,
        event.summary || 'No Title',
        event.description || '',
        startDate,
        endDate,
        event.location || ''
      ]);
    }

    await pool.query(
      'UPDATE integrations SET last_sync = CURRENT_TIMESTAMP WHERE user_id = $1 AND provider = $2',
      [req.user.id, 'google']
    );

    res.json({
      synced: (events.data.items || []).length,
      message: 'Calendar synced successfully'
    });
  } catch (error) {
    next(error);
  }
});

router.get('/google/events', async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT * FROM calendar_events WHERE user_id = $1 ORDER BY start_date ASC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

router.post('/google/events', async (req, res, next) => {
  try {
    const { title, description, start_date, end_date, location } = req.body;

    const integration = await pool.query(
      'SELECT * FROM integrations WHERE user_id = $1 AND provider = $2',
      [req.user.id, 'google']
    );

    if (integration.rows.length === 0) {
      throw new AppError('Google not connected', 400);
    }

    oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );

    oauth2Client.setCredentials({
      access_token: integration.rows[0].access_token,
      refresh_token: integration.rows[0].refresh_token
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const event = await calendar.events.insert({
      calendarId: 'primary',
      resource: {
        summary: title,
        description,
        location,
        start: { dateTime: start_date },
        end: { dateTime: end_date }
      }
    });

    await pool.query(`
      INSERT INTO calendar_events (user_id, google_event_id, title, description, start_date, end_date, location)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [req.user.id, event.data.id, title, description, start_date, end_date, location]);

    res.status(201).json(event.data);
  } catch (error) {
    next(error);
  }
});

router.delete('/google/disconnect', async (req, res, next) => {
  try {
    await pool.query(
      'DELETE FROM integrations WHERE user_id = $1 AND provider = $2',
      [req.user.id, 'google']
    );
    await pool.query(
      'DELETE FROM calendar_events WHERE user_id = $1',
      [req.user.id]
    );
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

module.exports = router;
