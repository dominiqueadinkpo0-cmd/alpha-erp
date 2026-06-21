const pool = require('./database');

const plans = [
  {
    name: 'Free',
    slug: 'free',
    description: 'Pour démarrer avec les bases',
    price_monthly: 0,
    price_yearly: 0,
    max_users: 1,
    max_products: 50,
    features: JSON.stringify({
      dashboard: true,
      products: true,
      contacts: true,
      projects: false,
      invoices: true,
      employees: false,
      reports: false,
      chatbot: true,
      integrations: { google: false, slack: false, teams: false },
      notifications: { email: false, whatsapp: false, in_app: true },
      export: false,
      custom_fields: false,
      api_access: false,
      priority_support: false
    })
  },
  {
    name: 'Starter',
    slug: 'starter',
    description: 'Pour les petites entreprises',
    price_monthly: 29,
    price_yearly: 290,
    max_users: 5,
    max_products: 500,
    features: JSON.stringify({
      dashboard: true,
      products: true,
      contacts: true,
      projects: true,
      invoices: true,
      employees: true,
      reports: false,
      chatbot: true,
      integrations: { google: true, slack: false, teams: false },
      notifications: { email: true, whatsapp: false, in_app: true },
      export: true,
      custom_fields: false,
      api_access: false,
      priority_support: false
    })
  },
  {
    name: 'Professional',
    slug: 'professional',
    description: 'Pour les équipes en croissance',
    price_monthly: 79,
    price_yearly: 790,
    max_users: 25,
    max_products: -1,
    features: JSON.stringify({
      dashboard: true,
      products: true,
      contacts: true,
      projects: true,
      invoices: true,
      employees: true,
      reports: true,
      chatbot: true,
      integrations: { google: true, slack: true, teams: true },
      notifications: { email: true, whatsapp: true, in_app: true },
      export: true,
      custom_fields: true,
      api_access: true,
      priority_support: false
    })
  },
  {
    name: 'Enterprise',
    slug: 'enterprise',
    description: 'Pour les grandes organisations',
    price_monthly: 199,
    price_yearly: 1990,
    max_users: -1,
    max_products: -1,
    features: JSON.stringify({
      dashboard: true,
      products: true,
      contacts: true,
      projects: true,
      invoices: true,
      employees: true,
      reports: true,
      chatbot: true,
      integrations: { google: true, slack: true, teams: true },
      notifications: { email: true, whatsapp: true, in_app: true },
      export: true,
      custom_fields: true,
      api_access: true,
      priority_support: true,
      white_label: true,
      dedicated_server: true,
      sla_guarantee: true
    })
  }
];

async function seedPlans() {
  try {
    for (const plan of plans) {
      await pool.query(
        `INSERT INTO plans (name, slug, description, price_monthly, price_yearly, max_users, max_products, features)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (slug) DO UPDATE SET
           name = EXCLUDED.name,
           description = EXCLUDED.description,
           price_monthly = EXCLUDED.price_monthly,
           price_yearly = EXCLUDED.price_yearly,
           max_users = EXCLUDED.max_users,
           max_products = EXCLUDED.max_products,
           features = EXCLUDED.features`,
        [plan.name, plan.slug, plan.description, plan.price_monthly, plan.price_yearly, plan.max_users, plan.max_products, plan.features]
      );
    }
    console.log('Plans seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Seed plans error:', error);
    process.exit(1);
  }
}

seedPlans();
