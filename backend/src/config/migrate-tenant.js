const pool = require('./database');

const tenantMigration = `
-- =====================================================
-- MULTI-TENANT MIGRATION
-- Adds organization isolation to Alpha ERP
-- =====================================================

-- 1. Create organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  plan_id INTEGER REFERENCES plans(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_active ON organizations(is_active);

-- 2. Add organization_id to all business tables
-- Using DO blocks to handle columns that may already exist

DO $$ BEGIN
  ALTER TABLE users ADD COLUMN organization_id UUID REFERENCES organizations(id);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE categories ADD COLUMN organization_id UUID REFERENCES organizations(id);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE products ADD COLUMN organization_id UUID REFERENCES organizations(id);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE stock_movements ADD COLUMN organization_id UUID REFERENCES organizations(id);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE contacts ADD COLUMN organization_id UUID REFERENCES organizations(id);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE projects ADD COLUMN organization_id UUID REFERENCES organizations(id);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE tasks ADD COLUMN organization_id UUID REFERENCES organizations(id);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE invoices ADD COLUMN organization_id UUID REFERENCES organizations(id);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE invoice_items ADD COLUMN organization_id UUID REFERENCES organizations(id);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE expenses ADD COLUMN organization_id UUID REFERENCES organizations(id);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE employees ADD COLUMN organization_id UUID REFERENCES organizations(id);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE leaves ADD COLUMN organization_id UUID REFERENCES organizations(id);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE activity_logs ADD COLUMN organization_id UUID REFERENCES organizations(id);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE integrations ADD COLUMN organization_id UUID REFERENCES organizations(id);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE calendar_events ADD COLUMN organization_id UUID REFERENCES organizations(id);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE notifications ADD COLUMN organization_id UUID REFERENCES organizations(id);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE notification_settings ADD COLUMN organization_id UUID REFERENCES organizations(id);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE slack_integrations ADD COLUMN organization_id UUID REFERENCES organizations(id);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE teams_integrations ADD COLUMN organization_id UUID REFERENCES organizations(id);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE chat_messages ADD COLUMN organization_id UUID REFERENCES organizations(id);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE subscriptions ADD COLUMN organization_id UUID REFERENCES organizations(id);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE billing_history ADD COLUMN organization_id UUID REFERENCES organizations(id);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- 3. Add password_changed_at to users for first-login forced change
DO $$ BEGIN
  ALTER TABLE users ADD COLUMN password_changed_at TIMESTAMP;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- 4. Create composite indexes for tenant isolation queries
CREATE INDEX IF NOT EXISTS idx_users_org ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_categories_org ON categories(organization_id);
CREATE INDEX IF NOT EXISTS idx_products_org ON products(organization_id);
CREATE INDEX IF NOT EXISTS idx_products_org_sku ON products(organization_id, sku);
CREATE INDEX IF NOT EXISTS idx_stock_movements_org ON stock_movements(organization_id);
CREATE INDEX IF NOT EXISTS idx_contacts_org ON contacts(organization_id);
CREATE INDEX IF NOT EXISTS idx_projects_org ON projects(organization_id);
CREATE INDEX IF NOT EXISTS idx_tasks_org ON tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_invoices_org ON invoices(organization_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_org ON invoice_items(organization_id);
CREATE INDEX IF NOT EXISTS idx_expenses_org ON expenses(organization_id);
CREATE INDEX IF NOT EXISTS idx_employees_org ON employees(organization_id);
CREATE INDEX IF NOT EXISTS idx_leaves_org ON leaves(organization_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_org ON activity_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_integrations_org ON integrations(organization_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_org ON calendar_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_notifications_org ON notifications(organization_id);
CREATE INDEX IF NOT EXISTS idx_notification_settings_org ON notification_settings(organization_id);
CREATE INDEX IF NOT EXISTS idx_slack_integrations_org ON slack_integrations(organization_id);
CREATE INDEX IF NOT EXISTS idx_teams_integrations_org ON teams_integrations(organization_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_org ON chat_messages(organization_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_org ON subscriptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_billing_history_org ON billing_history(organization_id);

-- 5. Migrate existing data: create default organization and assign all data
DO $$
DECLARE
  default_org_id UUID;
BEGIN
  -- Create default organization if it doesn't exist
  INSERT INTO organizations (name, slug, is_active)
  VALUES ('Alpha ERP - Compte par défaut', 'default', true)
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO default_org_id;

  -- If the insert was skipped (slug already exists), fetch the existing one
  IF default_org_id IS NULL THEN
    SELECT id INTO default_org_id FROM organizations WHERE slug = 'default';
  END IF;

  -- Assign all existing data to default organization
  UPDATE users SET organization_id = default_org_id WHERE organization_id IS NULL;
  UPDATE categories SET organization_id = default_org_id WHERE organization_id IS NULL;
  UPDATE products SET organization_id = default_org_id WHERE organization_id IS NULL;
  UPDATE stock_movements SET organization_id = default_org_id WHERE organization_id IS NULL;
  UPDATE contacts SET organization_id = default_org_id WHERE organization_id IS NULL;
  UPDATE projects SET organization_id = default_org_id WHERE organization_id IS NULL;
  UPDATE tasks SET organization_id = default_org_id WHERE organization_id IS NULL;
  UPDATE invoices SET organization_id = default_org_id WHERE organization_id IS NULL;
  UPDATE invoice_items SET organization_id = default_org_id WHERE organization_id IS NULL;
  UPDATE expenses SET organization_id = default_org_id WHERE organization_id IS NULL;
  UPDATE employees SET organization_id = default_org_id WHERE organization_id IS NULL;
  UPDATE leaves SET organization_id = default_org_id WHERE organization_id IS NULL;
  UPDATE activity_logs SET organization_id = default_org_id WHERE organization_id IS NULL;
  UPDATE integrations SET organization_id = default_org_id WHERE organization_id IS NULL;
  UPDATE calendar_events SET organization_id = default_org_id WHERE organization_id IS NULL;
  UPDATE notifications SET organization_id = default_org_id WHERE organization_id IS NULL;
  UPDATE notification_settings SET organization_id = default_org_id WHERE organization_id IS NULL;
  UPDATE slack_integrations SET organization_id = default_org_id WHERE organization_id IS NULL;
  UPDATE teams_integrations SET organization_id = default_org_id WHERE organization_id IS NULL;
  UPDATE chat_messages SET organization_id = default_org_id WHERE organization_id IS NULL;
  UPDATE subscriptions SET organization_id = default_org_id WHERE organization_id IS NULL;
  UPDATE billing_history SET organization_id = default_org_id WHERE organization_id IS NULL;

  RAISE NOTICE 'Default organization created/updated with id: %', default_org_id;
END $$;

-- 6. Make organization_id NOT NULL after data migration
-- (safe because all existing data is now assigned)
DO $$ BEGIN
  ALTER TABLE users ALTER COLUMN organization_id SET NOT NULL;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE categories ALTER COLUMN organization_id SET NOT NULL;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE products ALTER COLUMN organization_id SET NOT NULL;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE stock_movements ALTER COLUMN organization_id SET NOT NULL;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE contacts ALTER COLUMN organization_id SET NOT NULL;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE projects ALTER COLUMN organization_id SET NOT NULL;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE tasks ALTER COLUMN organization_id SET NOT NULL;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE invoices ALTER COLUMN organization_id SET NOT NULL;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE invoice_items ALTER COLUMN organization_id SET NOT NULL;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE expenses ALTER COLUMN organization_id SET NOT NULL;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE employees ALTER COLUMN organization_id SET NOT NULL;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE leaves ALTER COLUMN organization_id SET NOT NULL;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE activity_logs ALTER COLUMN organization_id SET NOT NULL;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE integrations ALTER COLUMN organization_id SET NOT NULL;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE calendar_events ALTER COLUMN organization_id SET NOT NULL;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE notifications ALTER COLUMN organization_id SET NOT NULL;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE notification_settings ALTER COLUMN organization_id SET NOT NULL;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE slack_integrations ALTER COLUMN organization_id SET NOT NULL;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE teams_integrations ALTER COLUMN organization_id SET NOT NULL;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE chat_messages ALTER COLUMN organization_id SET NOT NULL;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE subscriptions ALTER COLUMN organization_id SET NOT NULL;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE billing_history ALTER COLUMN organization_id SET NOT NULL;
EXCEPTION WHEN others THEN NULL;
END $$;
`;

async function migrateTenant() {
  try {
    await pool.query(tenantMigration);
    console.log('Multi-tenant migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Multi-tenant migration failed:', error);
    process.exit(1);
  }
}

migrateTenant();
