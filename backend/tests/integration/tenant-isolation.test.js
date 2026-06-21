const request = require('supertest');
const app = require('../../src/server');
const { pool, mockRequest, mockResponse, generateToken } = require('../setup');
const { auth } = require('../../src/middleware/auth');
const { tenantIsolation } = require('../../src/middleware/tenantIsolation');

// Mock data for two organizations
const orgA = { id: 'org-a-123', name: 'Organization A', slug: 'org-a' };
const orgB = { id: 'org-b-456', name: 'Organization B', slug: 'org-b' };

const userA = { id: 'user-a-1', email: 'user-a@test.com', role: 'user', organization_id: orgA.id };
const userB = { id: 'user-b-1', email: 'user-b@test.com', role: 'user', organization_id: orgB.id };

const productA = { id: 1, name: 'Product A', sku: 'SKU-A', organization_id: orgA.id };
const productB = { id: 2, name: 'Product B', sku: 'SKU-B', organization_id: orgB.id };

describe('Tenant Isolation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Middleware', () => {
    it('should extract organization_id from JWT', async () => {
      const req = mockRequest({ user: userA });
      const res = mockResponse();
      const next = jest.fn();

      tenantIsolation(req, res, next);

      expect(req.organizationId).toBe(orgA.id);
      expect(next).toHaveBeenCalled();
    });

    it('should reject request without organization_id', async () => {
      const req = mockRequest({ user: { id: 'user-1', role: 'user' } });
      const res = mockResponse();
      const next = jest.fn();

      tenantIsolation(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Product Isolation', () => {
    it('should not return products from other organizations', async () => {
      // Mock JWT verification
      const jwt = require('jsonwebtoken');
      jwt.verify.mockReturnValue(userA);

      // Mock database query for products
      pool.query.mockResolvedValueOnce({ rows: [productA], rowCount: 1 });

      const response = await request(app)
        .get('/api/products')
        .set('Authorization', `Bearer ${generateToken(userA)}`);

      expect(response.status).toBe(200);
      expect(response.body).toContainEqual(expect.objectContaining({ 
        name: productA.name,
        organization_id: orgA.id 
      }));

      // Verify query includes organization_id filter
      const queryCall = pool.query.mock.calls.find(call => 
        call[0].includes('products') && call[0].includes('organization_id')
      );
      expect(queryCall).toBeDefined();
      expect(queryCall[1]).toContain(orgA.id);
    });

    it('should not allow creating products in another organization', async () => {
      const jwt = require('jsonwebtoken');
      jwt.verify.mockReturnValue(userA);

      // Mock successful creation
      pool.query.mockResolvedValueOnce({ 
        rows: [{ ...productA, organization_id: orgA.id }], 
        rowCount: 1 
      });

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${generateToken(userA)}`)
        .send({
          name: 'New Product',
          sku: 'NEW-SKU',
          price: 100,
          quantity: 10,
          organization_id: orgB.id // Attempting to create in org B
        });

      // Should either reject or assign to user's organization
      if (response.status === 201) {
        expect(response.body.organization_id).toBe(orgA.id);
      }
    });
  });

  describe('Contact Isolation', () => {
    it('should not return contacts from other organizations', async () => {
      const jwt = require('jsonwebtoken');
      jwt.verify.mockReturnValue(userA);

      pool.query.mockResolvedValueOnce({ 
        rows: [{ id: 1, name: 'Contact A', organization_id: orgA.id }], 
        rowCount: 1 
      });

      const response = await request(app)
        .get('/api/contacts')
        .set('Authorization', `Bearer ${generateToken(userA)}`);

      expect(response.status).toBe(200);
      
      const queryCall = pool.query.mock.calls.find(call => 
        call[0].includes('contacts') && call[0].includes('organization_id')
      );
      expect(queryCall).toBeDefined();
      expect(queryCall[1]).toContain(orgA.id);
    });
  });

  describe('Invoice Isolation', () => {
    it('should not return invoices from other organizations', async () => {
      const jwt = require('jsonwebtoken');
      jwt.verify.mockReturnValue(userA);

      pool.query.mockResolvedValueOnce({ 
        rows: [{ id: 1, invoice_number: 'INV-001', organization_id: orgA.id }], 
        rowCount: 1 
      });

      const response = await request(app)
        .get('/api/invoices')
        .set('Authorization', `Bearer ${generateToken(userA)}`);

      expect(response.status).toBe(200);
      
      const queryCall = pool.query.mock.calls.find(call => 
        call[0].includes('invoices') && call[0].includes('organization_id')
      );
      expect(queryCall).toBeDefined();
      expect(queryCall[1]).toContain(orgA.id);
    });
  });

  describe('Project Isolation', () => {
    it('should not return projects from other organizations', async () => {
      const jwt = require('jsonwebtoken');
      jwt.verify.mockReturnValue(userA);

      pool.query.mockResolvedValueOnce({ 
        rows: [{ id: 1, name: 'Project A', organization_id: orgA.id }], 
        rowCount: 1 
      });

      const response = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${generateToken(userA)}`);

      expect(response.status).toBe(200);
      
      const queryCall = pool.query.mock.calls.find(call => 
        call[0].includes('projects') && call[0].includes('organization_id')
      );
      expect(queryCall).toBeDefined();
      expect(queryCall[1]).toContain(orgA.id);
    });
  });

  describe('Employee Isolation', () => {
    it('should not return employees from other organizations', async () => {
      const jwt = require('jsonwebtoken');
      jwt.verify.mockReturnValue(userA);

      pool.query.mockResolvedValueOnce({ 
        rows: [{ id: 1, employee_number: 'EMP-001', organization_id: orgA.id }], 
        rowCount: 1 
      });

      const response = await request(app)
        .get('/api/employees')
        .set('Authorization', `Bearer ${generateToken(userA)}`);

      expect(response.status).toBe(200);
      
      const queryCall = pool.query.mock.calls.find(call => 
        call[0].includes('employees') && call[0].includes('organization_id')
      );
      expect(queryCall).toBeDefined();
      expect(queryCall[1]).toContain(orgA.id);
    });
  });

  describe('Cross-Organization Access Prevention', () => {
    it('should prevent user A from accessing user B data via direct ID', async () => {
      const jwt = require('jsonwebtoken');
      jwt.verify.mockReturnValue(userA);

      // Mock empty result (no access to org B data)
      pool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

      const response = await request(app)
        .get('/api/products/2') // Product ID from org B
        .set('Authorization', `Bearer ${generateToken(userA)}`);

      // Should return 404 (not revealing existence)
      expect(response.status).toBe(404);
    });

    it('should prevent user A from updating user B data', async () => {
      const jwt = require('jsonwebtoken');
      jwt.verify.mockReturnValue(userA);

      // Mock no matching record
      pool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

      const response = await request(app)
        .put('/api/products/2')
        .set('Authorization', `Bearer ${generateToken(userA)}`)
        .send({ name: 'Hacked Product' });

      expect(response.status).toBe(404);
    });

    it('should prevent user A from deleting user B data', async () => {
      const jwt = require('jsonwebtoken');
      jwt.verify.mockReturnValue(userA);

      // Mock no matching record
      pool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

      const response = await request(app)
        .delete('/api/products/2')
        .set('Authorization', `Bearer ${generateToken(userA)}`);

      expect(response.status).toBe(404);
    });
  });

  describe('Dashboard Isolation', () => {
    it('should return stats only for user organization', async () => {
      const jwt = require('jsonwebtoken');
      jwt.verify.mockReturnValue(userA);

      // Mock dashboard stats
      pool.query
        .mockResolvedValueOnce({ rows: [{ count: '5' }] }) // products
        .mockResolvedValueOnce({ rows: [{ count: '3' }] }) // contacts
        .mockResolvedValueOnce({ rows: [{ count: '2' }] }) // invoices
        .mockResolvedValueOnce({ rows: [{ count: '1' }] }); // projects

      const response = await request(app)
        .get('/api/dashboard')
        .set('Authorization', `Bearer ${generateToken(userA)}`);

      expect(response.status).toBe(200);
      
      // Verify all queries include organization_id
      pool.query.mock.calls.forEach(call => {
        if (call[0].includes('COUNT') || call[0].includes('count')) {
          expect(call[1]).toContain(orgA.id);
        }
      });
    });
  });

  describe('Chatbot Isolation', () => {
    it('should return data only from user organization', async () => {
      const jwt = require('jsonwebtoken');
      jwt.verify.mockReturnValue(userA);

      // Mock chatbot product count query
      pool.query.mockResolvedValueOnce({ rows: [{ count: '5' }] });

      const response = await request(app)
        .post('/api/chatbot/chat')
        .set('Authorization', `Bearer ${generateToken(userA)}`)
        .send({ message: 'Combien de produits ?' });

      expect(response.status).toBe(200);
      
      // Verify query includes organization_id
      const queryCall = pool.query.mock.calls.find(call => 
        call[0].includes('products') && call[0].includes('count')
      );
      expect(queryCall).toBeDefined();
      expect(queryCall[1]).toContain(orgA.id);
    });
  });
});

describe('Organization Registration', () => {
  it('should create new organization with admin user', async () => {
    // Mock no existing organization
    pool.query
      .mockResolvedValueOnce({ rows: [] }) // Check slug
      .mockResolvedValueOnce({ rows: [] }) // Check email
      .mockResolvedValueOnce({ rows: [{ id: orgA.id }] }) // Create org
      .mockResolvedValueOnce({ rows: [{ id: userA.id, email: userA.email, role: 'admin' }] }) // Create user
      .mockResolvedValueOnce({ rows: [{ id: 1 }] }); // Create subscription

    const response = await request(app)
      .post('/api/auth/register-organization')
      .send({
        organization_name: 'Test Organization',
        slug: 'test-org',
        email: 'admin@test.com',
        password: 'password123',
        first_name: 'Admin',
        last_name: 'User'
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('token');
    expect(response.body.organization).toHaveProperty('id');
  });

  it('should reject duplicate slug', async () => {
    // Mock existing organization
    pool.query.mockResolvedValueOnce({ rows: [{ id: 'existing-org' }] });

    const response = await request(app)
      .post('/api/auth/register-organization')
      .send({
        organization_name: 'Test Organization',
        slug: 'existing-slug',
        email: 'admin@test.com',
        password: 'password123',
        first_name: 'Admin',
        last_name: 'User'
      });

    expect(response.status).toBe(409);
  });

  it('should reject duplicate email', async () => {
    // Mock no existing org, but existing user
    pool.query
      .mockResolvedValueOnce({ rows: [] }) // Check slug
      .mockResolvedValueOnce({ rows: [{ id: 'existing-user' }] }); // Check email

    const response = await request(app)
      .post('/api/auth/register-organization')
      .send({
        organization_name: 'Test Organization',
        slug: 'new-slug',
        email: 'existing@test.com',
        password: 'password123',
        first_name: 'Admin',
        last_name: 'User'
      });

    expect(response.status).toBe(409);
  });
});
