const WebSocket = require('ws');
const jwt = require('jsonwebtoken');

let wss = null;
const clients = new Map();

function initializeWebSocket(server) {
  wss = new WebSocket.Server({ server });

  wss.on('connection', (ws, req) => {
    const token = new URL(req.url, 'http://localhost').searchParams.get('token');
    
    if (!token) {
      ws.close(1008, 'Token required');
      return;
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.id;
      
      clients.set(userId, ws);
      console.log(`WebSocket connected: ${userId}`);

      ws.on('close', () => {
        clients.delete(userId);
        console.log(`WebSocket disconnected: ${userId}`);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        clients.delete(userId);
      });

      ws.send(JSON.stringify({ type: 'connected', message: 'Connected to ERP system' }));
    } catch (error) {
      ws.close(1008, 'Invalid token');
    }
  });

  console.log('WebSocket server initialized');
}

function broadcastToUser(userId, data) {
  const client = clients.get(userId);
  if (client && client.readyState === WebSocket.OPEN) {
    client.send(JSON.stringify(data));
  }
}

function broadcastToAll(data) {
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

function notifyProductUpdate(userId, product) {
  broadcastToUser(userId, {
    type: 'product_update',
    data: product,
    timestamp: new Date().toISOString()
  });
}

function notifyStockAlert(userId, product) {
  broadcastToUser(userId, {
    type: 'stock_alert',
    data: product,
    message: `Stock bas: ${product.name} (${product.quantity} restants)`,
    timestamp: new Date().toISOString()
  });
}

function notifyInvoiceUpdate(userId, invoice) {
  broadcastToUser(userId, {
    type: 'invoice_update',
    data: invoice,
    timestamp: new Date().toISOString()
  });
}

function notifyProjectUpdate(userId, project) {
  broadcastToUser(userId, {
    type: 'project_update',
    data: project,
    timestamp: new Date().toISOString()
  });
}

function notifyNewNotification(userId, notification) {
  broadcastToUser(userId, {
    type: 'notification',
    data: notification,
    timestamp: new Date().toISOString()
  });
}

module.exports = {
  initializeWebSocket,
  broadcastToUser,
  broadcastToAll,
  notifyProductUpdate,
  notifyStockAlert,
  notifyInvoiceUpdate,
  notifyProjectUpdate,
  notifyNewNotification
};
