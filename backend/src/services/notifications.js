const nodemailer = require('nodemailer');
const twilio = require('twilio');
const axios = require('axios');
const cron = require('node-cron');
const pool = require('../config/database');

let emailTransporter = null;
let twilioClient = null;

function initializeServices() {
  if (process.env.SMTP_HOST) {
    emailTransporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  if (process.env.TWILIO_SID && process.env.TWILIO_AUTH_TOKEN) {
    twilioClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
  }
}

async function sendEmail(to, subject, html) {
  if (!emailTransporter) {
    console.log('Email not configured, skipping:', subject);
    return false;
  }

  try {
    await emailTransporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      html
    });
    return true;
  } catch (error) {
    console.error('Email error:', error);
    return false;
  }
}

async function sendWhatsApp(to, message) {
  if (!twilioClient) {
    console.log('WhatsApp not configured, skipping:', message.substring(0, 50));
    return false;
  }

  try {
    await twilioClient.messages.create({
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}`,
      to: `whatsapp:${to}`,
      body: message
    });
    return true;
  } catch (error) {
    console.error('WhatsApp error:', error);
    return false;
  }
}

async function sendSlackNotification(channel, message) {
  try {
    const integrations = await pool.query(
      'SELECT * FROM slack_integrations WHERE is_active = true'
    );

    for (const integration of integrations.rows) {
      const targetChannel = channel || integration.channel_id;

      if (integration.webhook_url && !channel) {
        await axios.post(integration.webhook_url, { text: message });
      } else if (integration.bot_token) {
        await axios.post('https://slack.com/api/chat.postMessage', {
          channel: targetChannel,
          text: message
        }, {
          headers: {
            Authorization: `Bearer ${integration.bot_token}`,
            'Content-Type': 'application/json'
          }
        });
      }
    }
    return true;
  } catch (error) {
    console.error('Slack notification error:', error);
    return false;
  }
}

async function sendTeamsNotification(teamId, channelId, message) {
  try {
    const integrations = await pool.query(
      'SELECT * FROM teams_integrations WHERE is_active = true'
    );

    for (const integration of integrations.rows) {
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
              [accessToken, integration.user_id]
            );
            if (refreshRes.data.refresh_token) {
              await pool.query(
                'UPDATE teams_integrations SET refresh_token = $1 WHERE user_id = $2',
                [refreshRes.data.refresh_token, integration.user_id]
              );
            }
          }
        } catch (e) {}
      }

      const targetTeamId = teamId || integration.team_id;
      const targetChannelId = channelId || integration.channel_id;

      await axios.post(
        `https://graph.microsoft.com/v1.0/teams/${targetTeamId}/channels/${targetChannelId}/messages`,
        {
          body: {
            contentType: 'text',
            content: message
          }
        },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
    }
    return true;
  } catch (error) {
    console.error('Teams notification error:', error);
    return false;
  }
}

function generateDailyReportHTML(stats) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
        .content { padding: 30px; }
        .stat-card { background: #f8f9fa; border-radius: 8px; padding: 15px; margin-bottom: 15px; }
        .stat-label { color: #6c757d; font-size: 14px; }
        .stat-value { font-size: 24px; font-weight: bold; color: #333; }
        .stat-value.positive { color: #28a745; }
        .stat-value.negative { color: #dc3545; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📊 Rapport Quotidien ERP</h1>
          <p>${new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <div class="content">
          <div class="stat-card">
            <div class="stat-label">💰 Revenus du jour</div>
            <div class="stat-value positive">€${stats.daily_revenue.toLocaleString()}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">📦 Commandes</div>
            <div class="stat-value">${stats.orders_count}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">🛒 Nouveaux clients</div>
            <div class="stat-value">${stats.new_contacts}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">⚠️ Alertes stock</div>
            <div class="stat-value ${stats.low_stock_count > 0 ? 'negative' : ''}">${stats.low_stock_count} produits</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">📋 Projets actifs</div>
            <div class="stat-value">${stats.active_projects}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">👥 Employés présents</div>
            <div class="stat-value">${stats.active_employees}</div>
          </div>
        </div>
        <div class="footer">
          <p>ERP System - Rapport automatique</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateDailyReportText(stats) {
  return `
📊 RAPPORT QUOTIDIEN ERP
📅 ${new Date().toLocaleDateString('fr-FR')}

💰 Revenus: €${stats.daily_revenue.toLocaleString()}
📦 Commandes: ${stats.orders_count}
🛒 Nouveaux clients: ${stats.new_contacts}
⚠️ Alertes stock: ${stats.low_stock_count} produits
📋 Projets actifs: ${stats.active_projects}
👥 Employés: ${stats.active_employees}

---
ERP System
  `.trim();
}

async function getDailyStats() {
  const today = new Date().toISOString().split('T')[0];

  const [revenue, orders, contacts, stock, projects, employees] = await Promise.all([
    pool.query(`
      SELECT COALESCE(SUM(total), 0) as total
      FROM invoices 
      WHERE type = 'invoice' AND DATE(issue_date) = $1
    `, [today]),
    pool.query(`
      SELECT COUNT(*) as count
      FROM invoices 
      WHERE DATE(created_at) = $1
    `, [today]),
    pool.query(`
      SELECT COUNT(*) as count
      FROM contacts 
      WHERE DATE(created_at) = $1
    `, [today]),
    pool.query(`
      SELECT COUNT(*) as count
      FROM products 
      WHERE is_active = true AND quantity <= min_quantity
    `),
    pool.query(`
      SELECT COUNT(*) as count
      FROM projects 
      WHERE status IN ('active', 'planning')
    `),
    pool.query(`
      SELECT COUNT(*) as count
      FROM employees 
      WHERE status = 'active'
    `)
  ]);

  return {
    daily_revenue: parseFloat(revenue.rows[0].total) || 0,
    orders_count: parseInt(orders.rows[0].count) || 0,
    new_contacts: parseInt(contacts.rows[0].count) || 0,
    low_stock_count: parseInt(stock.rows[0].count) || 0,
    active_projects: parseInt(projects.rows[0].count) || 0,
    active_employees: parseInt(employees.rows[0].count) || 0
  };
}

async function sendDailyNotifications() {
  try {
    const users = await pool.query(`
      SELECT u.*, n.email_enabled, n.whatsapp_enabled, n.whatsapp_number
      FROM users u
      LEFT JOIN notification_settings n ON u.id = n.user_id
      WHERE u.is_active = true AND (n.email_enabled = true OR n.whatsapp_enabled = true)
    `);

    const stats = await getDailyStats();

    for (const user of users.rows) {
      if (user.email_enabled && user.email) {
        const html = generateDailyReportHTML(stats);
        await sendEmail(user.email, '📊 Rapport Quotidien ERP', html);
      }

      if (user.whatsapp_enabled && user.whatsapp_number) {
        const text = generateDailyReportText(stats);
        await sendWhatsApp(user.whatsapp_number, text);
      }

      await pool.query(`
        INSERT INTO notifications (user_id, type, title, message, data)
        VALUES ($1, 'daily_report', 'Rapport Quotidien', $2, $3)
      `, [user.id, `Rapport du ${new Date().toLocaleDateString('fr-FR')}`, JSON.stringify(stats)]);
    }

    const slackReportText = generateDailyReportText(stats);
    await sendSlackNotification(null, slackReportText);
    await sendTeamsNotification(null, null, slackReportText);

    console.log('Daily notifications sent to', users.rows.length, 'users');
  } catch (error) {
    console.error('Daily notification error:', error);
  }
}

async function checkLowStock() {
  try {
    const products = await pool.query(`
      SELECT p.*, u.email, u.id as user_id
      FROM products p
      CROSS JOIN users u
      WHERE p.is_active = true AND p.quantity <= p.min_quantity AND u.is_active = true
    `);

    for (const product of products.rows) {
      const message = `⚠️ Stock bas: ${product.name}\nQuantité: ${product.quantity}\nMinimum: ${product.min_quantity}`;
      
      await sendEmail(product.email, `⚠️ Alerte Stock: ${product.name}`, `<p>${message.replace(/\n/g, '<br>')}</p>`);
      
      await pool.query(`
        INSERT INTO notifications (user_id, type, title, message, data)
        VALUES ($1, 'low_stock', 'Alerte Stock', $2, $3)
      `, [product.user_id, message, JSON.stringify({ product_id: product.id })]);
    }
  } catch (error) {
    console.error('Low stock check error:', error);
  }
}

async function checkOverdueInvoices() {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const invoices = await pool.query(`
      SELECT i.*, c.first_name || ' ' || c.last_name as contact_name, u.email, u.id as user_id
      FROM invoices i
      JOIN contacts c ON i.contact_id = c.id
      JOIN users u ON i.user_id = u.id
      WHERE i.status = 'pending' AND i.due_date < $1
    `, [today]);

    for (const invoice of invoices.rows) {
      const message = `📋 Facture en retard: ${invoice.invoice_number}\nClient: ${invoice.contact_name}\nMontant: €${invoice.total}\nÉchéance: ${invoice.due_date}`;
      
      await sendEmail(invoice.email, `⚠️ Facture en retard: ${invoice.invoice_number}`, `<p>${message.replace(/\n/g, '<br>')}</p>`);
      
      await pool.query(`
        INSERT INTO notifications (user_id, type, title, message, data)
        VALUES ($1, 'overdue_invoice', 'Facture en retard', $2, $3)
      `, [invoice.user_id, message, JSON.stringify({ invoice_id: invoice.id })]);
    }
  } catch (error) {
    console.error('Overdue invoice check error:', error);
  }
}

function startCronJobs() {
  cron.schedule('0 8 * * *', () => {
    console.log('Running daily notifications...');
    sendDailyNotifications();
  });

  cron.schedule('0 */4 * * *', () => {
    console.log('Checking low stock...');
    checkLowStock();
  });

  cron.schedule('0 9 * * *', () => {
    console.log('Checking overdue invoices...');
    checkOverdueInvoices();
  });

  console.log('Cron jobs started');
}

module.exports = {
  initializeServices,
  sendEmail,
  sendWhatsApp,
  sendSlackNotification,
  sendTeamsNotification,
  sendDailyNotifications,
  checkLowStock,
  checkOverdueInvoices,
  startCronJobs
};
