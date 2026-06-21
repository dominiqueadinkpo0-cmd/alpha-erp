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
const contactRoutes = require('../../src/routes/contacts');
const { errorHandler } = require('../../src/middleware/errorHandler');
const { generalLimiter } = require('../../src/middleware/security');

const app = express();
app.use(express.json());
app.use('/api/contacts', generalLimiter, contactRoutes);
app.use(errorHandler);

const token = jwt.sign({ id: 1, email: 'test@example.com', role: 'admin' }, process.env.JWT_SECRET);

const mockContact = {
  id: 1,
  type: 'customer',
  first_name: 'John',
  last_name: 'Smith',
  email: 'john@example.com',
  phone: '+1234567890',
  company: 'Acme Corp',
  address: '123 Main St',
  city: 'New York',
  country: 'USA',
  notes: 'VIP client',
  is_active: true,
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('GET /api/contacts', () => {
  it('returns paginated contact list', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ count: '2' }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [mockContact, { ...mockContact, id: 2 }], rowCount: 2 });

    const res = await request(app)
      .get('/api/contacts')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.pagination).toBeDefined();
  });

  it('returns 401 without auth token', async () => {
    const res = await request(app).get('/api/contacts');
    expect(res.status).toBe(401);
  });

  it('applies type filter', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ count: '1' }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [mockContact], rowCount: 1 });

    const res = await request(app)
      .get('/api/contacts?type=customer')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  it('applies search filter', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ count: '1' }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [mockContact], rowCount: 1 });

    const res = await request(app)
      .get('/api/contacts?search=John')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });
});

describe('POST /api/contacts', () => {
  it('creates contact', async () => {
    pool.query.mockResolvedValueOnce({ rows: [mockContact], rowCount: 1 });

    const res = await request(app)
      .post('/api/contacts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'customer',
        first_name: 'John',
        last_name: 'Smith',
        email: 'john@example.com',
      });

    expect(res.status).toBe(201);
    expect(res.body.first_name).toBe('John');
  });

  it('returns 400 with missing required fields', async () => {
    const res = await request(app)
      .post('/api/contacts')
      .set('Authorization', `Bearer ${token}`)
      .send({ first_name: 'John' });

    expect(res.status).toBe(400);
  });

  it('returns 400 with invalid type', async () => {
    const res = await request(app)
      .post('/api/contacts')
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'invalid', first_name: 'John', email: 'john@example.com' });

    expect(res.status).toBe(400);
  });
});

describe('PUT /api/contacts/:id', () => {
  it('updates contact', async () => {
    const updated = { ...mockContact, first_name: 'Jane' };
    pool.query.mockResolvedValueOnce({ rows: [updated], rowCount: 1 });

    const res = await request(app)
      .put('/api/contacts/1')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'customer',
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane@example.com',
      });

    expect(res.status).toBe(200);
    expect(res.body.first_name).toBe('Jane');
  });

  it('returns 404 for non-existent contact', async () => {
    pool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(app)
      .put('/api/contacts/999')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'customer',
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane@example.com',
      });

    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/contacts/:id', () => {
  it('soft deletes contact', async () => {
    pool.query.mockResolvedValueOnce({ rowCount: 1 });

    const res = await request(app)
      .delete('/api/contacts/1')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(204);
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('is_active'),
      [1]
    );
  });
});
