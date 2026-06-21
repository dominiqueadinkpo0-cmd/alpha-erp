const pool = require('./database');
const bcrypt = require('bcryptjs');

async function seed() {
  try {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    await pool.query(`
      INSERT INTO users (email, password, first_name, last_name, role, department)
      VALUES ('admin@erp.com', $1, 'Admin', 'System', 'admin', 'Management')
      ON CONFLICT (email) DO NOTHING
    `, [hashedPassword]);

    await pool.query(`
      INSERT INTO categories (name, type, description) VALUES
      ('Electronics', 'product', 'Electronic devices and accessories'),
      ('Furniture', 'product', 'Office and home furniture'),
      ('Services', 'service', 'Professional services')
      ON CONFLICT DO NOTHING
    `);

    await pool.query(`
      INSERT INTO products (name, sku, description, category_id, price, cost, quantity, min_quantity) VALUES
      ('Laptop Pro 15', 'ELEC-001', 'High performance laptop', 1, 1299.99, 899.99, 50, 10),
      ('Wireless Mouse', 'ELEC-002', 'Ergonomic wireless mouse', 1, 29.99, 12.99, 200, 50),
      ('Office Desk', 'FURN-001', 'Modern office desk', 2, 449.99, 249.99, 30, 5),
      ('Ergonomic Chair', 'FURN-002', 'Comfortable office chair', 2, 349.99, 189.99, 25, 5)
      ON CONFLICT (sku) DO NOTHING
    `);

    await pool.query(`
      INSERT INTO contacts (type, first_name, last_name, email, phone, company) VALUES
      ('customer', 'Jean', 'Dupont', 'jean.dupont@email.com', '+33612345678', 'Dupont SARL'),
      ('customer', 'Marie', 'Martin', 'marie.martin@email.com', '+33698765432', 'Martin & Co'),
      ('supplier', 'Tech', 'Supply', 'contact@techsupply.com', '+33145678901', 'Tech Supply Inc'),
      ('supplier', 'Furniture', 'Pro', 'info@furniturepro.com', '+33123456789', 'Furniture Pro')
    `);

    console.log('Seed completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

seed();
