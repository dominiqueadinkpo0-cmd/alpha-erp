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
const healthRoutes = require('./routes/health');
const { createBackup } = require('./services/backup');
const { auth } = require('./middleware/auth');
const { tenantIsolation } = require('./middleware/tenantIsolation');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(sanitizeInput);
app.use(requestLogger);

// Auth routes (no tenant isolation needed)
app.use('/api/health', healthRoutes);
app.use('/api/auth', authLimiter, authRoutes);

// Business routes with tenant isolation
// Tenant isolation runs AFTER auth, BEFORE route handler
const businessRoutes = [
  { path: '/api/products', router: productRoutes },
  { path: '/api/contacts', router: contactRoutes },
  { path: '/api/projects', router: projectRoutes },
  { path: '/api/invoices', router: invoiceRoutes },
  { path: '/api/dashboard', router: dashboardRoutes },
  { path: '/api/employees', router: employeeRoutes },
  { path: '/api/reports', router: reportRoutes },
  { path: '/api/integrations', router: integrationRoutes },
  { path: '/api/integrations/slack', router: slackIntegrationRoutes },
  { path: '/api/integrations/teams', router: teamsIntegrationRoutes },
  { path: '/api/notifications', router: notificationRoutes },
  { path: '/api/subscription', router: subscriptionRoutes },
  { path: '/api/chatbot', router: chatbotRoutes },
  { path: '/api/audit', router: auditRoutes },
  { path: '/api/backup', router: backupRoutes },
];

businessRoutes.forEach(({ path, router }) => {
  app.use(path, generalLimiter, auth, tenantIsolation, router);
});

// Trial routes (no tenant isolation - global anti-abuse)
app.use('/api/trial', generalLimiter, trialRoutes);

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
