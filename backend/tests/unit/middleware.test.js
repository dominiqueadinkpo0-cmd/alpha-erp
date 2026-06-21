const { AppError, errorHandler } = require('../../src/middleware/errorHandler');
const { rateLimit } = require('../../src/middleware/security');
const pagination = require('../../src/middleware/pagination');
const { mockResponse, mockRequest } = require('../setup');

describe('rateLimit', () => {
  it('allows requests under limit', () => {
    const limiter = rateLimit(3, 60000);
    const req = mockRequest({ ip: '10.0.0.1' });
    const res = mockResponse();
    const next = jest.fn();

    limiter(req, res, next);
    limiter(req, res, next);
    limiter(req, res, next);

    expect(next).toHaveBeenCalledTimes(3);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('blocks after limit exceeded', () => {
    const limiter = rateLimit(2, 60000);
    const req = mockRequest({ ip: '10.0.0.2' });
    const res = mockResponse();
    const next = jest.fn();

    limiter(req, res, next);
    limiter(req, res, next);
    limiter(req, res, next);

    expect(next).toHaveBeenCalledTimes(2);
    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'RATE_LIMIT_EXCEEDED' })
    );
  });
});

describe('pagination', () => {
  it('sets default pagination values', () => {
    const req = mockRequest({ query: {} });
    const res = mockResponse();
    const next = jest.fn();

    pagination(req, res, next);

    expect(req.pagination).toEqual({ page: 1, limit: 20, offset: 0 });
    expect(next).toHaveBeenCalled();
  });

  it('reads page and limit from query', () => {
    const req = mockRequest({ query: { page: '3', limit: '10' } });
    const res = mockResponse();
    const next = jest.fn();

    pagination(req, res, next);

    expect(req.pagination).toEqual({ page: 3, limit: 10, offset: 20 });
  });

  it('caps limit at 100', () => {
    const req = mockRequest({ query: { limit: '500' } });
    const res = mockResponse();
    const next = jest.fn();

    pagination(req, res, next);

    expect(req.pagination.limit).toBe(100);
  });

  it('wraps array response with pagination metadata', () => {
    const req = mockRequest({ query: { page: '1', limit: '5' } });
    const originalJson = jest.fn().mockReturnValue({});
    const res = {
      json: originalJson,
      getHeader: jest.fn().mockReturnValue('15'),
      setHeader: jest.fn(),
    };

    pagination(req, res, jest.fn());
    res.json([{ id: 1 }, { id: 2 }]);

    expect(originalJson).toHaveBeenCalledWith({
      data: [{ id: 1 }, { id: 2 }],
      pagination: { page: 1, limit: 5, total: 15, totalPages: 3 },
    });
  });

  it('does not wrap non-array response', () => {
    const req = mockRequest({ query: {} });
    const originalJson = jest.fn().mockReturnValue({});
    const res = {
      json: originalJson,
      getHeader: jest.fn(),
      setHeader: jest.fn(),
    };

    pagination(req, res, jest.fn());
    res.json({ message: 'ok' });

    expect(originalJson).toHaveBeenCalledWith({ message: 'ok' });
  });
});

describe('errorHandler', () => {
  let req, res, next;

  beforeEach(() => {
    req = mockRequest();
    res = mockResponse();
    next = jest.fn();
  });

  it('handles JsonWebTokenError', () => {
    const err = new Error('jwt malformed');
    err.name = 'JsonWebTokenError';
    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.objectContaining({ code: 'INVALID_TOKEN' }) })
    );
  });

  it('handles TokenExpiredError', () => {
    const err = new Error('jwt expired');
    err.name = 'TokenExpiredError';
    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.objectContaining({ code: 'TOKEN_EXPIRED' }) })
    );
  });

  it('handles PostgreSQL unique violation', () => {
    const err = new Error('duplicate key');
    err.code = '23505';
    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.objectContaining({ code: 'DUPLICATE_ENTRY' }) })
    );
  });

  it('handles AppError', () => {
    const err = new AppError('Not found', 404);
    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.objectContaining({ message: 'Not found' }) })
    );
  });

  it('handles generic error in non-production', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'test';
    const err = new Error('something broke');
    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(500);
    process.env.NODE_ENV = originalEnv;
  });
});

describe('AppError', () => {
  it('sets message and statusCode', () => {
    const err = new AppError('Bad request', 400);
    expect(err.message).toBe('Bad request');
    expect(err.statusCode).toBe(400);
    expect(err.isOperational).toBe(true);
  });

  it('is an instance of Error', () => {
    const err = new AppError('test', 500);
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(AppError);
  });
});
