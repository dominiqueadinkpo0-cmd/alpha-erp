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

async function sendSlackNotification(channel, message, organizationId = null) {
  try {
    let query = 'SELECT * FROM slack_integrations WHERE is_active = true';
    const params = [];
    
    if (organizationId) {
      query += ' AND organization_id = $1';
      params.push(organizationId);
    }
    
    const integrations = await pool.query(query, params);

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

async function sendTeamsNotification(teamId, channelId, message, organizationId = null) {
  try {
    let query = 'SELECT * FROM teams_integrations WHERE is_active = true';
    const params = [];
    
    if (organizationId) {
      query += ' AND organization_id = $1';
      params.push(organizationId);
    }
    
    const integrations = await pool.query(query, params);

    for (const integration of integrations.rows) {
      if (integration.access_token) {
        const targetTeamId = teamId || integration.team_id;
        const targetChannelId = channelId || integration.channel_id;
        
        await axios.post(
          `https://graph.microsoft.com/v1.0/teams/${targetTeamId}/channels/${targetChannelId}/messages`,
          {
            body: {
              content: message,
              contentType: 'text'
            }
          },
          {
            headers: {
              Authorization: `Bearer ${integration.access_token}`,
              'Content-Type': 'application/json'
            }
          }
        );
      }
    }
    return true;
  } catch (error) {
    console.error('Teams notification error:', error);
    return false;
  }
}

function generateDailyReportHTML(stats) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #9A7432;">📊 Rapport Quotidien ERP</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>💰 Revenus</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">€${stats.daily_revenue.toLocaleString()}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>📦 Commandes</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${stats.orders_count}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>🛒 Nouveaux clients</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${stats.new_contacts}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>⚠️ Alertes stock</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${stats.low_stock_count} produits</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>📋 Projets actifs</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${stats.active_projects}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>👥 Employés</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${stats.active_employees}</td></tr>
      </table>
      <p style="color: #666; font-size: 12px;">ERP System - Alpha Omega Digital</p>
    </div>
  `;
}

function generateDailyReportText(stats) {
  return `
📊 Rapport Quotidien ERP

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

async function getDailyStats(organizationId) {
  const today = new Date().toISOString().split('T')[0];

  const [revenue, orders, contacts, stock, projects, employees] = await Promise.all([
    pool.query(`
      SELECT COALESCE(SUM(total), 0) as total
      FROM invoices 
      WHERE type = 'invoice' AND DATE(issue_date) = $1 AND organization_id = $2
    `, [today, organizationId]),
    pool.query(`
      SELECT COUNT(*) as count
      FROM invoices 
      WHERE DATE(created_at) = $1 AND organization_id = $2
    `, [today, organizationId]),
    pool.query(`
      SELECT COUNT(*) as count
      FROM contacts 
      WHERE DATE(created_at) = $1 AND organization_id = $2
    `, [today, organizationId]),
    pool.query(`
      SELECT COUNT(*) as count
      FROM products 
      WHERE is_active = true AND quantity <= min_quantity AND organization_id = $1
    `, [organizationId]),
    pool.query(`
      SELECT COUNT(*) as count
      FROM projects 
      WHERE status IN ('active', 'planning') AND organization_id = $1
    `, [organizationId]),
    pool.query(`
      SELECT COUNT(*) as count
      FROM employees 
      WHERE status = 'active' AND organization_id = $1
    `, [organizationId])
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
    // Get all active organizations
    const organizations = await pool.query(
      'SELECT id, name FROM organizations WHERE is_active = true'
    );

    for (const org of organizations.rows) {
      const users = await pool.query(`
        SELECT u.*, n.email_enabled, n.whatsapp_enabled, n.whatsapp_number
        FROM users u
        LEFT JOIN notification_settings n ON u.id = n.user_id
        WHERE u.is_active = true AND u.organization_id = $1 
        AND (n.email_enabled = true OR n.whatsapp_enabled = true)
      `, [org.id]);

      const stats = await getDailyStats(org.id);

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
          INSERT INTO notifications (user_id, type, title, message, data, organization_id)
          VALUES ($1, 'daily_report', 'Rapport Quotidien', $2, $3, $4)
        `, [user.id, `Rapport du ${new Date().toLocaleDateString('fr-FR')}`, JSON.stringify(stats), org.id]);
      }

      const slackReportText = generateDailyReportText(stats);
      await sendSlackNotification(null, slackReportText, org.id);
      await sendTeamsNotification(null, null, slackReportText, org.id);

      console.log(`Daily notifications sent for organization ${org.name}: ${users.rows.length} users`);
    }
  } catch (error) {
    console.error('Daily notification error:', error);
  }
}

async function checkLowStock() {
  try {
    // Get all active organizations
    const organizations = await pool.query(
      'SELECT id FROM organizations WHERE is_active = true'
    );

    for (const org of organizations.rows) {
      const products = await pool.query(`
        SELECT p.*, u.email, u.id as user_id
        FROM products p
        CROSS JOIN users u
        WHERE p.is_active = true AND p.quantity <= p.min_quantity 
        AND u.is_active = true AND p.organization_id = $1 AND u.organization_id = $1
      `, [org.id]);

      for (const product of products.rows) {
        const message = `⚠️ Stock bas: ${product.name}\nQuantité: ${product.quantity}\nMinimum: ${product.min_quantity}`;
        
        await sendEmail(product.email, `⚠️ Alerte Stock: ${product.name}`, `<p>${message.replace(/\n/g, '<br>')}</p>`);
        
        await pool.query(`
          INSERT INTO notifications (user_id, type, title, message, data, organization_id)
          VALUES ($1, 'low_stock', 'Alerte Stock', $2, $3, $4)
        `, [product.user_id, message, JSON.stringify({ product_id: product.id }), org.id]);
      }
    }
  } catch (error) {
    console.error('Low stock check error:', error);
  }
}

async function checkOverdueInvoices() {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Get all active organizations
    const organizations = await pool.query(
      'SELECT id FROM organizations WHERE is_active = true'
    );

    for (const org of organizations.rows) {
      const invoices = await pool.query(`
        SELECT i.*, c.first_name || ' ' || c.last_name as contact_name, u.email, u.id as user_id
        FROM invoices i
        JOIN contacts c ON i.contact_id = c.id
        JOIN users u ON i.user_id = u.id
        WHERE i.status = 'pending' AND i.due_date < $1 AND i.organization_id = $2
      `, [today, org.id]);

      for (const invoice of invoices.rows) {
        const message = `📋 Facture en retard: ${invoice.invoice_number}\nClient: ${invoice.contact_name}\nMontant: €${invoice.total}\nÉchéance: ${invoice.due_date}`;
        
        await sendEmail(invoice.email, `⚠️ Facture en retard: ${invoice.invoice_number}`, `<p>${message.replace(/\n/g, '<br>')}</p>`);
        
        await pool.query(`
          INSERT INTO notifications (user_id, type, title, message, data, organization_id)
          VALUES ($1, 'overdue_invoice', 'Facture en retard', $2, $3, $4)
        `, [invoice.user_id, message, JSON.stringify({ invoice_id: invoice.id }), org.id]);
      }
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
