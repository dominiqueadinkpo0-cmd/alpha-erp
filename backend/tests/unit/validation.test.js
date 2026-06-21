const { validationResult } = require('express-validator');
const { loginSchema, productSchema, contactSchema, registerSchema } = require('../../src/middleware/validate');

const runValidation = async (schema, body) => {
  const req = { body };
  for (const validation of schema) {
    await validation.run(req);
  }
  return validationResult(req);
};

describe('loginSchema', () => {
  it('valid input passes', async () => {
    const result = await runValidation(loginSchema, {
      email: 'test@example.com',
      password: 'password123',
    });
    expect(result.isEmpty()).toBe(true);
  });

  it('missing email fails', async () => {
    const result = await runValidation(loginSchema, {
      password: 'password123',
    });
    expect(result.isEmpty()).toBe(false);
    expect(result.array()[0].path).toBe('email');
  });

  it('invalid email format fails', async () => {
    const result = await runValidation(loginSchema, {
      email: 'not-an-email',
      password: 'password123',
    });
    expect(result.isEmpty()).toBe(false);
  });

  it('missing password fails', async () => {
    const result = await runValidation(loginSchema, {
      email: 'test@example.com',
    });
    expect(result.isEmpty()).toBe(false);
    expect(result.array()[0].path).toBe('password');
  });
});

describe('productSchema', () => {
  it('valid input passes', async () => {
    const result = await runValidation(productSchema, {
      name: 'Widget',
      sku: 'WDG-001',
      price: 29.99,
      quantity: 100,
    });
    expect(result.isEmpty()).toBe(true);
  });

  it('invalid price fails', async () => {
    const result = await runValidation(productSchema, {
      name: 'Widget',
      sku: 'WDG-001',
      price: -5,
      quantity: 100,
    });
    expect(result.isEmpty()).toBe(false);
    expect(result.array()[0].path).toBe('price');
  });

  it('missing name fails', async () => {
    const result = await runValidation(productSchema, {
      sku: 'WDG-001',
      price: 10,
      quantity: 5,
    });
    expect(result.isEmpty()).toBe(false);
  });

  it('negative quantity fails', async () => {
    const result = await runValidation(productSchema, {
      name: 'Widget',
      sku: 'WDG-001',
      price: 10,
      quantity: -1,
    });
    expect(result.isEmpty()).toBe(false);
    expect(result.array()[0].path).toBe('quantity');
  });
});

describe('contactSchema', () => {
  it('valid input passes', async () => {
    const result = await runValidation(contactSchema, {
      type: 'customer',
      first_name: 'John',
      email: 'john@example.com',
    });
    expect(result.isEmpty()).toBe(true);
  });

  it('missing type fails', async () => {
    const result = await runValidation(contactSchema, {
      first_name: 'John',
      email: 'john@example.com',
    });
    expect(result.isEmpty()).toBe(false);
    expect(result.array()[0].path).toBe('type');
  });

  it('invalid type fails', async () => {
    const result = await runValidation(contactSchema, {
      type: 'invalid',
      first_name: 'John',
      email: 'john@example.com',
    });
    expect(result.isEmpty()).toBe(false);
  });

  it('missing email fails', async () => {
    const result = await runValidation(contactSchema, {
      type: 'vendor',
      first_name: 'Jane',
    });
    expect(result.isEmpty()).toBe(false);
  });
});

describe('registerSchema', () => {
  it('valid input passes', async () => {
    const result = await runValidation(registerSchema, {
      email: 'new@example.com',
      password: 'securepass123',
      first_name: 'Jane',
      last_name: 'Doe',
    });
    expect(result.isEmpty()).toBe(true);
  });

  it('short password fails', async () => {
    const result = await runValidation(registerSchema, {
      email: 'new@example.com',
      password: 'short',
      first_name: 'Jane',
      last_name: 'Doe',
    });
    expect(result.isEmpty()).toBe(false);
    expect(result.array().some(e => e.path === 'password')).toBe(true);
  });

  it('missing first_name fails', async () => {
    const result = await runValidation(registerSchema, {
      email: 'new@example.com',
      password: 'securepass123',
      last_name: 'Doe',
    });
    expect(result.isEmpty()).toBe(false);
  });
});
