const pool = require('../config/database');

const AI_MODELS = {
  mimo: {
    name: 'MiMo',
    description: 'Modèle par défaut - Rapide et efficace',
    provider: 'local',
    endpoint: process.env.MIMO_API_ENDPOINT || 'http://localhost:11434/api/generate',
    model: process.env.MIMO_MODEL || 'mimo:latest',
    maxTokens: 2048,
    temperature: 0.7
  },
  gemma4: {
    name: 'Gemma 4',
    description: 'Modèle avancé - Plus précis et détaillé',
    provider: 'local',
    endpoint: process.env.GEMMA4_API_ENDPOINT || 'http://localhost:11434/api/generate',
    model: process.env.GEMMA4_MODEL || 'gemma4:latest',
    maxTokens: 4096,
    temperature: 0.6
  }
};

let currentModel = 'mimo';

const featureKeywords = {
  products: ['product', 'products', 'inventory', 'stock', 'sku', 'produit', 'produits', 'inventaire', 'article', 'articles'],
  invoices: ['invoice', 'invoices', 'facture', 'factures', 'bill', 'bills', 'payment', 'paiement', 'quote', 'devis'],
  contacts: ['contact', 'contacts', 'client', 'clients', 'customer', 'customers', 'fournisseur', 'supplier', 'person', 'people'],
  projects: ['project', 'projects', 'projet', 'projets', 'task', 'tasks', 'tache', 'taches', 'milestone'],
  employees: ['employee', 'employees', 'employe', 'employes', 'staff', 'personnel', 'team', 'equipe', 'hr', 'leave', 'conge'],
  dashboard: ['dashboard', 'overview', 'stats', 'statistics', 'tableau de bord', 'resume', 'summary'],
  reports: ['report', 'reports', 'rapport', 'rapports', 'analytics', 'export', 'csv', 'pdf'],
  integrations: ['integration', 'integrations', 'google', 'slack', 'teams', 'calendar', 'integrate', 'integrer', 'connecter'],
  subscription: ['plan', 'abonnement', 'subscription', 'billing', 'facturation', 'upgrade', 'premium']
};

const featureGuides = {
  products: {
    en: { title: 'Managing Products', steps: ['Go to Products from the sidebar menu', 'Click "Add Product" to create a new product entry', 'Fill in the product name, SKU (unique identifier), price, and cost', 'Set the minimum quantity threshold for low-stock alerts', 'Use the search bar to find products by name or SKU', 'Click on a product to view details and stock movements', 'Use the stock adjustment button to add or remove inventory'] },
    fr: { title: 'Gérer les Produits', steps: ['Accédez à Produits depuis le menu latéral', 'Cliquez sur "Ajouter un Produit" pour créer une nouvelle entrée', 'Remplissez le nom, le SKU (identifiant unique), le prix et le coût', 'Définissez le seuil de quantité minimale pour les alertes de stock bas', 'Utilisez la barre de recherche pour trouver des produits par nom ou SKU', 'Cliquez sur un produit pour voir les détails et les mouvements de stock', 'Utilisez le bouton d\'ajustement de stock pour ajouter ou retirer des articles'] }
  },
  invoices: {
    en: { title: 'Managing Invoices', steps: ['Go to Invoices from the sidebar menu', 'Click "Create Invoice" to generate a new invoice', 'Select the contact (customer/supplier) for this invoice', 'Add line items with descriptions, quantities, and unit prices', 'Set the tax rate if applicable', 'Save as Draft or mark as Sent directly', 'Track payment status and mark as Paid when received'] },
    fr: { title: 'Gérer les Factures', steps: ['Accédez à Factures depuis le menu latéral', 'Cliquez sur "Créer une Facture" pour générer une nouvelle facture', 'Sélectionnez le contact (client/fournisseur) pour cette facture', 'Ajoutez des lignes avec descriptions, quantités et prix unitaires', 'Définissez le taux de TVA si applicable', 'Enregistrez en brouillon ou marquez comme envoyée directement', 'Suivez le statut de paiement et marquez comme payée quand reçue'] }
  },
  contacts: {
    en: { title: 'Managing Contacts', steps: ['Go to Contacts from the sidebar menu', 'Click "Add Contact" to create a new contact', 'Choose the contact type: Customer, Supplier, or Partner', 'Fill in the name, email, phone, and company details', 'Use the search to quickly find contacts', 'Click on a contact to view their full profile'] },
    fr: { title: 'Gérer les Contacts', steps: ['Accédez à Contacts depuis le menu latéral', 'Cliquez sur "Ajouter un Contact" pour créer un nouveau contact', 'Choisissez le type: Client, Fournisseur ou Partenaire', 'Remplissez le nom, email, téléphone et les informations de l\'entreprise', 'Utilisez la recherche pour trouver rapidement des contacts', 'Cliquez sur un contact pour voir son profil complet'] }
  },
  projects: {
    en: { title: 'Managing Projects', steps: ['Go to Projects from the sidebar menu', 'Click "New Project" to start a new project', 'Set the project name, description, and client', 'Define start and end dates for the project timeline', 'Create tasks within the project and assign them to team members', 'Track project progress through the progress bar'] },
    fr: { title: 'Gérer les Projets', steps: ['Accédez à Projets depuis le menu latéral', 'Cliquez sur "Nouveau Projet" pour démarrer un nouveau projet', 'Définissez le nom, la description et le client du projet', 'Établissez les dates de début et de fin pour le calendrier', 'Créez des tâches et assignez-les aux membres de l\'équipe', 'Suivez la progression via la barre de progression'] }
  },
  employees: {
    en: { title: 'Managing Employees', steps: ['Go to Employees from the sidebar menu', 'Click "Add Employee" to register a new employee', 'Fill in employee number, position, and department', 'Set the hire date and salary information', 'Manage leave requests through the Leave section'] },
    fr: { title: 'Gérer les Employés', steps: ['Accédez à Employés depuis le menu latéral', 'Cliquez sur "Ajouter un Employé" pour enregistrer un nouvel employé', 'Remplissez le numéro d\'employé, le poste et le département', 'Définissez la date d\'embauche et les informations de salaire', 'Gérez les demandes de congés dans la section Congés'] }
  },
  dashboard: {
    en: { title: 'Using the Dashboard', steps: ['The Dashboard shows your key business metrics at a glance', 'View total revenue, pending invoices, and recent orders', 'Check the low-stock alerts section for inventory warnings', 'Monitor active projects and their progress', 'Export reports from the Reports section'] },
    fr: { title: 'Utiliser le Tableau de Bord', steps: ['Le tableau de bord affiche vos métriques commerciales principales', 'Consultez le revenu total, les factures en attente et les commandes récentes', 'Vérifiez la section d\'alertes de stock bas', 'Surveillez les projets actifs et leur progression', 'Exportez les rapports depuis la section Rapports'] }
  },
  integrations: {
    en: { title: 'Managing Integrations', steps: ['Go to Settings from the sidebar menu', 'Click on the Integrations tab', 'Connect Google Calendar for event sync', 'Connect Slack for team notifications', 'Connect Microsoft Teams for collaboration', 'Test each integration after connecting'] },
    fr: { title: 'Gérer les Intégrations', steps: ['Accédez à Paramètres depuis le menu latéral', 'Cliquez sur l\'onglet Intégrations', 'Connectez Google Calendar pour la synchronisation', 'Connectez Slack pour les notifications d\'équipe', 'Connectez Microsoft Teams pour la collaboration', 'Testez chaque intégration après connexion'] }
  }
};

function detectLanguage(message) {
  const lower = message.toLowerCase();
  const frWords = ['bonjour', 'salut', 'comment', 'quelle', 'quel', 'aide', 'merci', 'oui', 'non', 'mais', 'avec', 'pour', 'dans', 'sur', 'combien', 'montre', 'créer', 'ajouter', 'supprimer', 'modifier', 'stock', 'facture', 'projet', 'employé', 'contact', 'produit', 'abonnement', 'intégration'];
  const enWords = ['hello', 'hi', 'hey', 'how', 'what', 'help', 'thanks', 'yes', 'no', 'show', 'create', 'add', 'delete', 'edit', 'stock', 'invoice', 'project', 'employee', 'contact', 'product', 'subscription', 'integration'];

  let frScore = 0, enScore = 0;
  for (const word of frWords) { if (lower.includes(word)) frScore++; }
  for (const word of enWords) { if (lower.includes(word)) enScore++; }
  return frScore > enScore ? 'fr' : 'en';
}

function getFeatureGuide(feature, lang) {
  const guide = featureGuides[feature];
  if (!guide || !guide[lang]) return null;
  const g = guide[lang];
  return `**${g.title}**\n\n${g.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}`;
}

async function getDatabaseAnswer(query, lang, organizationId) {
  const lower = query.toLowerCase();
  const isFR = lang === 'fr';

  if (lower.match(/\b(count|nombre|combien).*(product|produit)/) || lower.match(/\b(product|produit).*(count|nombre|combien)/)) {
    const result = await pool.query('SELECT COUNT(*) as count FROM products WHERE is_active = true AND organization_id = $1', [organizationId]);
    return isFR ? `Il y a actuellement **${result.rows[0].count} produits** actifs.` : `There are currently **${result.rows[0].count} active products**.`;
  }

  if (lower.match(/\b(low.?stock|stock.?bas|stock.?alert)/)) {
    const result = await pool.query('SELECT name, quantity, min_quantity FROM products WHERE is_active = true AND quantity <= min_quantity AND organization_id = $1 ORDER BY quantity ASC', [organizationId]);
    if (result.rows.length === 0) return isFR ? 'Aucun produit en stock bas.' : 'No products low on stock.';
    const list = result.rows.map(p => `- ${p.name}: ${p.quantity} (min: ${p.min_quantity})`).join('\n');
    return isFR ? `**${result.rows.length} produits en stock bas:**\n\n${list}` : `**${result.rows.length} products low on stock:**\n\n${list}`;
  }

  if (lower.match(/\b(count|nombre|combien).*(contact|client)/) || lower.match(/\b(contact|client).*(count|nombre|combien)/)) {
    const result = await pool.query('SELECT COUNT(*) as count FROM contacts WHERE is_active = true AND organization_id = $1', [organizationId]);
    return isFR ? `**${result.rows[0].count} contacts** enregistrés.` : `**${result.rows[0].count} contacts** registered.`;
  }

  if (lower.match(/\b(count|nombre|combien).*(invoice|facture)/) || lower.match(/\b(invoice|facture).*(count|nombre|combien)/)) {
    const result = await pool.query('SELECT COUNT(*) as count FROM invoices WHERE status != $1 AND organization_id = $2', ['draft', organizationId]);
    return isFR ? `**${result.rows[0].count} factures** (hors brouillons).` : `**${result.rows[0].count} invoices** (excluding drafts).`;
  }

  if (lower.match(/\b(pending|en attente|impayée).*(invoice|facture)/) || lower.match(/\b(invoice|facture).*(pending|en attente|impayée)/)) {
    const result = await pool.query('SELECT COUNT(*) as count, COALESCE(SUM(total - paid_amount), 0) as total FROM invoices WHERE status = $1 AND organization_id = $2', ['pending', organizationId]);
    const { count, total } = result.rows[0];
    return isFR ? `**${count} factures en attente** pour **€${parseFloat(total).toLocaleString()}**.` : `**${count} pending invoices** totaling **€${parseFloat(total).toLocaleString()}**.`;
  }

  if (lower.match(/\b(count|nombre|combien).*(project|projet)/) || lower.match(/\b(project|projet).*(active|actif)/)) {
    const result = await pool.query('SELECT COUNT(*) as count FROM projects WHERE status IN ($1, $2) AND organization_id = $3', ['active', 'planning', organizationId]);
    return isFR ? `**${result.rows[0].count} projets actifs** ou en planification.` : `**${result.rows[0].count} active or planning projects**.`;
  }

  if (lower.match(/\b(count|nombre|combien).*(employee|employé|staff)/) || lower.match(/\b(employee|employé|staff).*(active|actif)/)) {
    const result = await pool.query('SELECT COUNT(*) as count FROM employees WHERE status = $1 AND organization_id = $2', ['active', organizationId]);
    return isFR ? `**${result.rows[0].count} employés actifs**.` : `**${result.rows[0].count} active employees**.`;
  }

  if (lower.match(/\b(revenue|revenu|chiffre).*(facture|invoice|sale|vente)/) || lower.match(/\b(total|somme).*(payé|paid)/)) {
    const result = await pool.query('SELECT COALESCE(SUM(total), 0) as total_revenue, COALESCE(SUM(paid_amount), 0) as total_paid FROM invoices WHERE type = $1 AND organization_id = $2', ['invoice', organizationId]);
    const { total_revenue, total_paid } = result.rows[0];
    const pending = parseFloat(total_revenue) - parseFloat(total_paid);
    return isFR
      ? `**Résumé des ventes:**\n- Chiffre d'affaires: **€${parseFloat(total_revenue).toLocaleString()}**\n- Reçu: **€${parseFloat(total_paid).toLocaleString()}**\n- En attente: **€${pending.toLocaleString()}**`
      : `**Sales Summary:**\n- Revenue: **€${parseFloat(total_revenue).toLocaleString()}**\n- Received: **€${parseFloat(total_paid).toLocaleString()}**\n- Pending: **€${pending.toLocaleString()}**`;
  }

  if (lower.match(/\b(show|afficher|lister|voir).*(product|produit)/)) {
    const result = await pool.query('SELECT name, sku, quantity, price FROM products WHERE is_active = true AND organization_id = $1 ORDER BY name LIMIT 10', [organizationId]);
    if (result.rows.length === 0) return isFR ? 'Aucun produit trouvé.' : 'No products found.';
    return isFR ? `**Produits:**\n\n${result.rows.map(p => `- ${p.name} (${p.sku}) - Qty: ${p.quantity} - €${p.price}`).join('\n')}` : `**Products:**\n\n${result.rows.map(p => `- ${p.name} (${p.sku}) - Qty: ${p.quantity} - €${p.price}`).join('\n')}`;
  }

  if (lower.match(/\b(show|afficher|lister|voir).*(project|projet)/)) {
    const result = await pool.query('SELECT name, status, priority, progress FROM projects WHERE status IN ($1, $2) AND organization_id = $3 ORDER BY name LIMIT 10', ['active', 'planning', organizationId]);
    if (result.rows.length === 0) return isFR ? 'Aucun projet actif.' : 'No active projects.';
    return isFR ? `**Projets:**\n\n${result.rows.map(p => `- ${p.name} (${p.status}) - ${p.priority} - ${p.progress}%`).join('\n')}` : `**Projects:**\n\n${result.rows.map(p => `- ${p.name} (${p.status}) - ${p.priority} - ${p.progress}%`).join('\n')}`;
  }

  if (lower.match(/\b(show|afficher|lister|voir).*(invoice|facture)/)) {
    const result = await pool.query(`SELECT i.invoice_number, i.total, i.status, c.first_name || ' ' || c.last_name as contact_name FROM invoices i LEFT JOIN contacts c ON i.contact_id = c.id WHERE i.status != $1 AND i.organization_id = $2 ORDER BY i.created_at DESC LIMIT 10`, ['draft', organizationId]);
    if (result.rows.length === 0) return isFR ? 'Aucune facture.' : 'No invoices.';
    return isFR ? `**Factures:**\n\n${result.rows.map(i => `- ${i.invoice_number} - ${i.contact_name} - €${i.total} (${i.status})`).join('\n')}` : `**Invoices:**\n\n${result.rows.map(i => `- ${i.invoice_number} - ${i.contact_name} - €${i.total} (${i.status})`).join('\n')}`;
  }

  if (lower.match(/\b(show|afficher|lister|voir).*(employee|employé)/)) {
    const result = await pool.query('SELECT employee_number, position, department FROM employees WHERE status = $1 AND organization_id = $2 LIMIT 10', ['active', organizationId]);
    if (result.rows.length === 0) return isFR ? 'Aucun employé actif.' : 'No active employees.';
    return isFR ? `**Employés:**\n\n${result.rows.map(e => `- ${e.employee_number} - ${e.position || 'N/A'} - ${e.department || 'N/A'}`).join('\n')}` : `**Employees:**\n\n${result.rows.map(e => `- ${e.employee_number} - ${e.position || 'N/A'} - ${e.department || 'N/A'}`).join('\n')}`;
  }

  return null;
}

async function callAIModel(prompt, systemPrompt) {
  const model = AI_MODELS[currentModel];
  try {
    const axios = require('axios');
    const response = await axios.post(model.endpoint, {
      model: model.model,
      prompt: prompt,
      system: systemPrompt,
      stream: false,
      options: { temperature: model.temperature, num_predict: model.maxTokens }
    }, { timeout: 30000 });
    return response.data.response || null;
  } catch (error) {
    console.error('AI model error:', error.message);
    return null;
  }
}

const SYSTEM_PROMPT_FR = `Tu es l'assistant IA du logiciel ERP Alpha ERP développé par Alpha Omega Digital. Tu aide les utilisateurs à utiliser le logiciel. Tu peux répondre sur les fonctionnalités (produits, factures, contacts, projets, employés), donner des guides d'utilisation, et répondre aux questions sur les données. Sois concis et utile. Réponds toujours en français.`;

const SYSTEM_PROMPT_EN = `You are the AI assistant for Alpha ERP software by Alpha Omega Digital. You help users use the software. You can answer about features (products, invoices, contacts, projects, employees), provide usage guides, and answer data questions. Be concise and helpful. Always respond in English.`;

async function processMessage(userId, message, organizationId) {
  const lang = detectLanguage(message);
  const lower = message.toLowerCase().trim();

  if (lower === 'switch mimo' || lower === 'utiliser mimo') {
    currentModel = 'mimo';
    return { text: lang === 'fr' ? 'Modèle changé vers **MiMo** (par défaut).' : 'Model switched to **MiMo** (default).', suggestions: [], quickActions: [], language: lang };
  }
  if (lower === 'switch gemma' || lower === 'utiliser gemma') {
    currentModel = 'gemma4';
    return { text: lang === 'fr' ? 'Modèle changé vers **Gemma 4** (avancé).' : 'Model switched to **Gemma 4** (advanced).', suggestions: [], quickActions: [], language: lang };
  }
  if (lower === 'model' || lower === 'modèle' || lower === 'which model' || lower === 'quel modèle') {
    return { text: lang === 'fr' ? `Modèle actuel: **${AI_MODELS[currentModel].name}** (${AI_MODELS[currentModel].description})\n\nModèles disponibles:\n- **MiMo** - Rapide et efficace (défaut)\n- **Gemma 4** - Plus précis et détaillé\n\nTapez "switch mimo" ou "switch gemma" pour changer.` : `Current model: **${AI_MODELS[currentModel].name}** (${AI_MODELS[currentModel].description})\n\nAvailable models:\n- **MiMo** - Fast and efficient (default)\n- **Gemma 4** - More precise and detailed\n\nType "switch mimo" or "switch gemma" to change.`, suggestions: [], quickActions: [], language: lang };
  }

  const greetings = {
    en: ['hello', 'hi', 'hey', 'good morning', 'good afternoon'],
    fr: ['bonjour', 'salut', 'bonsoir', 'coucou']
  };
  for (const [langKey, patterns] of Object.entries(greetings)) {
    if (patterns.some(p => lower === p || lower.startsWith(p + ' '))) {
      return { text: langKey === 'fr' ? 'Bonjour ! Je suis votre assistant Alpha ERP. Je peux vous aider avec les produits, factures, contacts, projets et employés. Comment puis-je vous aider ?' : 'Hello! I\'m your Alpha ERP assistant. I can help with products, invoices, contacts, projects, and employees. How can I help?', suggestions: [], quickActions: [], language: langKey };
    }
  }

  const dbAnswer = await getDatabaseAnswer(lower, lang, organizationId);
  if (dbAnswer) {
    const quickActions = [];
    if (lower.includes('product') || lower.includes('produit')) quickActions.push({ label: lang === 'fr' ? 'Produits' : 'Products', action: 'navigate', path: '/products' });
    if (lower.includes('invoice') || lower.includes('facture')) quickActions.push({ label: lang === 'fr' ? 'Factures' : 'Invoices', action: 'navigate', path: '/invoices' });
    if (lower.includes('project') || lower.includes('projet')) quickActions.push({ label: lang === 'fr' ? 'Projets' : 'Projects', action: 'navigate', path: '/projects' });
    return { text: dbAnswer, suggestions: [], quickActions, language: lang };
  }

  for (const [feature, keywords] of Object.entries(featureKeywords)) {
    if (keywords.some(k => lower.includes(k))) {
      const isGuide = lower.match(/(how|comment|guide|help|tutorial|step|faire|puisse|tutoriel)/);
      if (isGuide && featureGuides[feature]) {
        const guide = getFeatureGuide(feature, lang);
        const quickActions = [{ label: lang === 'fr' ? `Voir ${feature}` : `View ${feature}`, action: 'navigate', path: `/${feature === 'dashboard' ? '' : feature}` }];
        return { text: guide, suggestions: [], quickActions, language: lang };
      }
    }
  }

  const aiResponse = await callAIModel(message, lang === 'fr' ? SYSTEM_PROMPT_FR : SYSTEM_PROMPT_EN);
  if (aiResponse) {
    return { text: aiResponse, suggestions: [], quickActions: [], language: lang, model: currentModel };
  }

  const fallback = lang === 'fr'
    ? 'Je ne suis pas sûr de comprendre. Voici ce que je peux faire :\n\n- **Données** : "Combien de produits ?", "Stock bas", "Factures en attente"\n- **Guides** : "Comment créer une facture ?", "Comment gérer les contacts ?"\n- **Modèles** : "Quel modèle ?", "Switch gemma"\n\nTapez "aide" pour plus d\'informations.'
    : 'I\'m not sure I understand. Here\'s what I can do:\n\n- **Data**: "How many products?", "Low stock", "Pending invoices"\n- **Guides**: "How to create an invoice?", "How to manage contacts?"\n- **Models**: "Which model?", "Switch gemma"\n\nType "help" for more information.';

  return { text: fallback, suggestions: [], quickActions: [], language: lang };
}

async function getHistory(userId, organizationId, limit = 50) {
  const result = await pool.query('SELECT role, content, metadata, created_at FROM chat_messages WHERE user_id = $1 AND organization_id = $2 ORDER BY created_at DESC LIMIT $3', [userId, organizationId, limit]);
  return result.rows.reverse();
}

async function saveMessage(userId, role, content, organizationId, metadata = {}) {
  await pool.query('INSERT INTO chat_messages (user_id, role, content, metadata, organization_id) VALUES ($1, $2, $3, $4, $5)', [userId, role, content, JSON.stringify(metadata), organizationId]);
}

async function clearHistory(userId, organizationId) {
  await pool.query('DELETE FROM chat_messages WHERE user_id = $1 AND organization_id = $2', [userId, organizationId]);
}

module.exports = { processMessage, getHistory, saveMessage, clearHistory, detectLanguage, AI_MODELS };
