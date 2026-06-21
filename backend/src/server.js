const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const contactRoutes = require('./routes/contacts');
const projectRoutes = require('./routes/projects');
const invoiceRoutes = require('./routes/invoices');
const dashboardRoutes = require('./routes/dashboard');
const employeeRoutes = require('./routes/employees');
const reportRoutes = require('./routes/reports');
const integrationRoutes = require('./routes/integrations');
const slackIntegrationRoutes = require('./routes/integrations-slack');
const teamsIntegrationRoutes = require('./routes/integrations-teams');
const notificationRoutes = require('./routes/notifications');
const subscriptionRoutes = require('./routes/subscription');
const chatbotRoutes = require('./routes/chatbot');
const trialRoutes = require('./routes/trial');

const cron = require('node-cron');
const { initializeServices, startCronJobs } = require('./services/notifications');
const { initializeWebSocket } = require('./services/websocket');
const { generalLimiter, authLimiter, sanitizeInput, requestLogger } = require('./middleware/security');
const { errorHandler } = require('./middleware/errorHandler');
const redis = require('./config/redis');
const auditLog = require('./middleware/audit');
const auditRoutes = require('./routes/audit');
const backupRoutes = require('./routes/backup');
const { createBackup } = require('./services/backup');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(sanitizeInput);
app.use(requestLogger);

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/products', generalLimiter, productRoutes);
app.use('/api/contacts', generalLimiter, contactRoutes);
app.use('/api/projects', generalLimiter, projectRoutes);
app.use('/api/invoices', generalLimiter, invoiceRoutes);
app.use('/api/dashboard', generalLimiter, dashboardRoutes);
app.use('/api/employees', generalLimiter, employeeRoutes);
app.use('/api/reports', generalLimiter, reportRoutes);
app.use('/api/integrations', generalLimiter, integrationRoutes);
app.use('/api/integrations/slack', generalLimiter, slackIntegrationRoutes);
app.use('/api/integrations/teams', generalLimiter, teamsIntegrationRoutes);
app.use('/api/notifications', generalLimiter, notificationRoutes);
app.use('/api/subscription', generalLimiter, subscriptionRoutes);
app.use('/api/chatbot', generalLimiter, chatbotRoutes);
app.use('/api/trial', generalLimiter, trialRoutes);

app.use('/api/audit', auditRoutes);
app.use('/api/backup', backupRoutes);

const apiPathsToAudit = [
  '/api/products', '/api/contacts', '/api/projects', '/api/invoices',
  '/api/employees', '/api/reports', '/api/integrations', '/api/notifications',
  '/api/subscription', '/api/chatbot', '/api/audit', '/api/backup',
  '/api/integrations/slack', '/api/integrations/teams', '/api/trial'
];
apiPathsToAudit.forEach(p => app.use(p, auditLog));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

initializeServices();
initializeWebSocket(server);
startCronJobs();

cron.schedule('0 2 * * *', async () => {
  try {
    console.log('Starting daily backup...');
    await createBackup();
    console.log('Daily backup completed');
  } catch (error) {
    console.error('Daily backup failed:', error.message);
  }
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket available on ws://localhost:${PORT}`);
  console.log(`Redis caching: ${redis.isConnected() ? 'connected' : 'not available'}`);
});

module.exports = app;
