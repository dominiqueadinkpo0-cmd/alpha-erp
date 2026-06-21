const { jest } = require('@jest/globals');

jest.mock('../src/config/database', () => {
  const mockPool = {
    query: jest.fn(),
    connect: jest.fn(),
    end: jest.fn(),
    on: jest.fn(),
  };
  return mockPool;
});

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'mock-jwt-token'),
  verify: jest.fn(),
}));

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn(() => 'hashed-password'),
}));

process.env.JWT_SECRET = 'test-secret-key';
process.env.JWT_EXPIRES_IN = '24h';
process.env.NODE_ENV = 'test';

const pool = require('../src/config/database');

const createMockQuery = (rows) => {
  return jest.fn().mockResolvedValue({ rows, rowCount: rows.length });
};

const createMockQueryChain = (rows) => {
  const fn = jest.fn().mockResolvedValue({ rows, rowCount: rows.length });
  return fn;
};

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn().mockReturnValue(res);
  res.getHeader = jest.fn().mockReturnValue(null);
  return res;
};

const mockRequest = (overrides = {}) => ({
  body: {},
  params: {},
  query: {},
  headers: {},
  user: null,
  ip: '127.0.0.1',
  ...overrides,
});

const generateToken = (payload) => {
  const jwt = require('jsonwebtoken');
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });
};

beforeEach(() => {
  jest.clearAllMocks();
});

module.exports = {
  pool,
  createMockQuery,
  createMockQueryChain,
  mockResponse,
  mockRequest,
  generateToken,
};
