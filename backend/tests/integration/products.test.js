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
const productRoutes = require('../../src/routes/products');
const { errorHandler } = require('../../src/middleware/errorHandler');
const { generalLimiter } = require('../../src/middleware/security');

const app = express();
app.use(express.json());
app.use('/api/products', generalLimiter, productRoutes);
app.use(errorHandler);

const token = jwt.sign({ id: 1, email: 'test@example.com', role: 'admin' }, process.env.JWT_SECRET);

const mockProduct = {
  id: 1,
  name: 'Widget',
  sku: 'WDG-001',
  description: 'A widget',
  category_id: null,
  price: 29.99,
  cost: 10.0,
  quantity: 100,
  min_quantity: 10,
  unit: 'pcs',
  is_active: true,
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('GET /api/products', () => {
  it('returns paginated product list', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ count: '2' }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [mockProduct, { ...mockProduct, id: 2 }], rowCount: 2 });

    const res = await request(app)
      .get('/api/products')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.pagination).toBeDefined();
    expect(res.body.pagination.page).toBe(1);
  });

  it('returns 401 without auth token', async () => {
    const res = await request(app).get('/api/products');
    expect(res.status).toBe(401);
  });

  it('applies search filter', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ count: '1' }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [mockProduct], rowCount: 1 });

    const res = await request(app)
      .get('/api/products?search=Widget')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('ILIKE'),
      expect.arrayContaining(['%Widget%'])
    );
  });

  it('applies category filter', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ count: '1' }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [mockProduct], rowCount: 1 });

    const res = await request(app)
      .get('/api/products?category=1')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });
});

describe('POST /api/products', () => {
  it('creates product', async () => {
    pool.query.mockResolvedValueOnce({ rows: [mockProduct], rowCount: 1 });

    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Widget', sku: 'WDG-001', price: 29.99, quantity: 100 });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Widget');
  });

  it('returns 400 with invalid data', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: '', sku: '', price: -1, quantity: -1 });

    expect(res.status).toBe(400);
  });
});

describe('PUT /api/products/:id', () => {
  it('updates product', async () => {
    const updatedProduct = { ...mockProduct, name: 'Updated Widget' };
    pool.query.mockResolvedValueOnce({ rows: [updatedProduct], rowCount: 1 });

    const res = await request(app)
      .put('/api/products/1')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Updated Widget', sku: 'WDG-001', price: 39.99, quantity: 50 });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Updated Widget');
  });

  it('returns 404 for non-existent product', async () => {
    pool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(app)
      .put('/api/products/999')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Widget', sku: 'WDG-001', price: 29.99, quantity: 100 });

    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/products/:id', () => {
  it('soft deletes product', async () => {
    pool.query.mockResolvedValueOnce({ rowCount: 1 });

    const res = await request(app)
      .delete('/api/products/1')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(204);
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('is_active'),
      [1]
    );
  });
});

describe('GET /api/products/:id', () => {
  it('returns product by id', async () => {
    pool.query.mockResolvedValueOnce({ rows: [mockProduct], rowCount: 1 });

    const res = await request(app)
      .get('/api/products/1')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(1);
  });

  it('returns 404 for non-existent product', async () => {
    pool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(app)
      .get('/api/products/999')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});
