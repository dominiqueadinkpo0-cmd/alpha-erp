jest.mock('../../src/config/database', () => ({
  query: jest.fn(),
  connect: jest.fn(),
  end: jest.fn(),
  on: jest.fn(),
}));

const express = require('express');
const request = require('supertest');
const pool = require('../../src/config/database');
const jwt = require('jsonwebtoken');
const invoiceRoutes = require('../../src/routes/invoices');
const { errorHandler } = require('../../src/middleware/errorHandler');
const { generalLimiter } = require('../../src/middleware/security');

const app = express();
app.use(express.json());
app.use('/api/invoices', generalLimiter, invoiceRoutes);
app.use(errorHandler);

const token = jwt.sign({ id: 1, email: 'test@example.com', role: 'admin' }, process.env.JWT_SECRET);

const mockInvoice = {
  id: 1,
  invoice_number: 'INV-1000',
  type: 'invoice',
  contact_id: 1,
  status: 'pending',
  issue_date: '2024-01-15',
  due_date: '2024-02-15',
  subtotal: 100,
  tax_rate: 10,
  tax_amount: 10,
  total: 110,
  paid_amount: 0,
  notes: 'Test invoice',
  user_id: 1,
};

const mockItems = [
  { id: 1, invoice_id: 1, description: 'Widget', quantity: 2, unit_price: 50, total: 100 },
];

beforeEach(() => {
  jest.clearAllMocks();
});

describe('GET /api/invoices', () => {
  it('returns paginated invoice list', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ count: '1' }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [mockInvoice], rowCount: 1 });

    const res = await request(app)
      .get('/api/invoices')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.pagination).toBeDefined();
  });

  it('returns 401 without auth token', async () => {
    const res = await request(app).get('/api/invoices');
    expect(res.status).toBe(401);
  });

  it('applies type filter', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ count: '1' }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [mockInvoice], rowCount: 1 });

    const res = await request(app)
      .get('/api/invoices?type=invoice')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  it('applies status filter', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ count: '1' }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [mockInvoice], rowCount: 1 });

    const res = await request(app)
      .get('/api/invoices?status=pending')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });
});

describe('POST /api/invoices', () => {
  it('creates invoice with items', async () => {
    pool.query
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ rows: [mockInvoice], rowCount: 1 })
      .mockResolvedValueOnce({ rowCount: 1 })
      .mockResolvedValueOnce({});

    const res = await request(app)
      .post('/api/invoices')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'invoice',
        contact_id: 1,
        status: 'pending',
        issue_date: '2024-01-15',
        due_date: '2024-02-15',
        tax_rate: 10,
        notes: 'Test invoice',
        items: [{ description: 'Widget', quantity: 2, unit_price: 50 }],
      });

    expect(res.status).toBe(201);
    expect(res.body.invoice_number).toMatch(/^INV-/);
  });

  it('returns 400 with missing items', async () => {
    const res = await request(app)
      .post('/api/invoices')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'invoice',
        contact_id: 1,
        items: [],
      });

    expect(res.status).toBe(400);
  });

  it('returns 400 with invalid type', async () => {
    const res = await request(app)
      .post('/api/invoices')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'invalid',
        contact_id: 1,
        items: [{ description: 'Widget', quantity: 1, unit_price: 50 }],
      });

    expect(res.status).toBe(400);
  });
});

describe('GET /api/invoices/:id', () => {
  it('returns invoice with items', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [mockInvoice], rowCount: 1 })
      .mockResolvedValueOnce({ rows: mockItems, rowCount: 1 });

    const res = await request(app)
      .get('/api/invoices/1')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.invoice_number).toBe('INV-1000');
    expect(res.body.items).toHaveLength(1);
  });

  it('returns 404 for non-existent invoice', async () => {
    pool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(app)
      .get('/api/invoices/999')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});
