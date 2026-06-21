jest.mock('../../src/config/database', () => ({
  query: jest.fn(),
  connect: jest.fn(),
  end: jest.fn(),
  on: jest.fn(),
}));

const express = require('express');
const request = require('supertest');
const pool = require('../../src/config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authRoutes = require('../../src/routes/auth');
const { errorHandler } = require('../../src/middleware/errorHandler');
const { authLimiter } = require('../../src/middleware/security');

const app = express();
app.use(express.json());
app.use('/api/auth', authLimiter, authRoutes);
app.use(errorHandler);

const mockUser = {
  id: 1,
  email: 'test@example.com',
  password: 'hashed-password',
  first_name: 'John',
  last_name: 'Doe',
  role: 'admin',
  department: 'Engineering',
  is_active: true,
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('POST /api/auth/login', () => {
  it('returns token with valid credentials', async () => {
    pool.query.mockResolvedValueOnce({ rows: [mockUser], rowCount: 1 });
    bcrypt.compare.mockResolvedValueOnce(true);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toBe('test@example.com');
  });

  it('returns 401 with invalid credentials', async () => {
    pool.query.mockResolvedValueOnce({ rows: [mockUser], rowCount: 1 });
    bcrypt.compare.mockResolvedValueOnce(false);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'wrongpassword' });

    expect(res.status).toBe(401);
  });

  it('returns 401 when user not found', async () => {
    pool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nonexistent@example.com', password: 'password123' });

    expect(res.status).toBe(401);
  });

  it('returns 400 with invalid email format', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'not-an-email', password: 'password123' });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/register', () => {
  it('creates user with valid data', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })
      .mockResolvedValueOnce({ rows: [{ id: 1, email: 'new@example.com', first_name: 'Jane', last_name: 'Doe', role: 'user' }], rowCount: 1 });
    bcrypt.hash.mockResolvedValueOnce('hashed-password');

    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'new@example.com', password: 'securepass123', first_name: 'Jane', last_name: 'Doe' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toBe('new@example.com');
  });

  it('returns 409 with duplicate email', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ id: 1 }], rowCount: 1 });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'existing@example.com', password: 'securepass123', first_name: 'Jane', last_name: 'Doe' });

    expect(res.status).toBe(409);
  });

  it('returns 400 with short password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'new@example.com', password: 'short', first_name: 'Jane', last_name: 'Doe' });

    expect(res.status).toBe(400);
  });
});

describe('GET /api/auth/me', () => {
  it('returns user with valid token', async () => {
    const token = jwt.sign({ id: 1, email: 'test@example.com', role: 'admin' }, process.env.JWT_SECRET);
    pool.query.mockResolvedValueOnce({ rows: [mockUser], rowCount: 1 });

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.email).toBe('test@example.com');
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns 401 with invalid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid-token');

    expect(res.status).toBe(401);
  });
});
