# Alpha ERP - Système de Gestion Intégré

Développé par **Alpha Omega Digital**

Application ERP complète pour la gestion d'entreprise avec intégrations tierces, notifications multi-canal et assistant IA.

---

## 📞 Contact

- **Email** : alphaomegadigital35@gmail.com
- **WhatsApp** : +229 01 67 72 80 61

---

## 🚀 Installation Rapide

### Linux/Mac
```bash
chmod +x install.sh
./install.sh
./start.sh
```

### Windows
```cmd
install.bat
start.bat
```

### Application Desktop
```bash
cd desktop
npm install
npm run dev
```

---

## ✨ Fonctionnalités

| Module | Description |
|--------|-------------|
| **Dashboard** | Vue d'ensemble avec graphiques et alertes |
| **Produits** | Gestion des produits, stock, alertes stock bas |
| **Contacts** | CRM - Clients et fournisseurs |
| **Projets** | Projets, tâches, suivi d'avancement |
| **Factures** | Factures d'achat/vente, calcul TVA |
| **Employés** | Gestion RH, congés |
| **Rapports** | Rapports financiers, inventaire, ventes |
| **Paramètres** | Intégrations et notifications |
| **Administration** | Interface staff (admin uniquement) |
| **Abonnement** | Gestion des plans et facturation |
| **Assistant IA** | Chatbot pour aide et questions |

---

## 🔌 Intégrations Tiers

| Service | Statut | Description |
|---------|--------|-------------|
| **Google Calendar** | ✅ Disponible | Sync événements, deadlines projets |
| **Slack** | ✅ Disponible | Notifications vers canaux Slack |
| **Microsoft Teams** | ✅ Disponible | Notifications vers équipes Teams |

### Configuration Google Calendar
```env
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/integrations/google/callback
```

### Configuration Slack
```env
SLACK_CLIENT_ID=your-client-id
SLACK_CLIENT_SECRET=your-client-secret
SLACK_SIGNING_SECRET=your-signing-secret
```

### Configuration Microsoft Teams
```env
TEAMS_CLIENT_ID=your-client-id
TEAMS_CLIENT_SECRET=your-client-secret
TEAMS_TENANT_ID=your-tenant-id
```

---

## 📱 Notifications Multi-Canal

| Canal | Configuration |
|-------|---------------|
| **Email** | SMTP (Gmail, Outlook, etc.) |
| **WhatsApp** | Twilio API |
| **Slack** | Bot Token / Webhook |
| **Microsoft Teams** | Graph API |
| **In-App** | WebSocket temps réel |

### Configuration Email (SMTP)
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Configuration WhatsApp (Twilio)
```env
TWILIO_SID=your-sid
TWILIO_AUTH_TOKEN=your-token
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
```

---

## 💳 Plans d'Abonnement

| Plan | Prix | Utilisateurs | Produits | Features |
|------|------|-------------|----------|----------|
| **Free** | Gratuit | 1 | 50 | Fonctionnalités de base |
| **Starter** | 29€/mois | 5 | 500 | Email notifications |
| **Professional** | 79€/mois | 25 | Illimité | Toutes intégrations, rapports |
| **Enterprise** | 199€/mois | Illimité | Illimité | Support prioritaire, custom |

---

## 🤖 Assistant IA

Le chatbot intégré permet de :
- Poser des questions sur les fonctionnalités
- Consulter les données en langage naturel
- Obtenir des guides pas à pas
- Supporte le Français et l'Anglais

---

## 🖥️ Application Desktop

Le logiciel est installable comme une application native :
- **Windows** : Installateur NSIS
- **macOS** : DMG
- **Linux** : AppImage, .deb

```bash
cd desktop
npm install
npm run build
```

---

## 📊 Rapports Inclus

- **Financier** : Revenus, dépenses, profit, évolution mensuelle
- **Inventaire** : Valeur stock, produits en rupture, par catégorie
- **Ventes** : Top produits, top clients, ventes quotidiennes

---

## 🎨 Design Premium

- Fond blanc premium avec ombres subtiles
- **Dark Mode** : Thème sombre intégré (toggle dans le header)
- Animations fluides
- 100% responsive (mobile, tablette, desktop)
- Composants réutilisables (DataTable, Modal, Pagination, SearchBar, StatCard, ConfirmDialog)
- Logo Alpha Omega Digital (SVG doré)

---

## 📁 Structure du Projet

```
erp-system/
├── install.sh              # Installateur automatique
├── start.sh                # Lance le système
├── stop.sh                 # Arrête le système
├── backup.sh               # Sauvegarde la base
├── restore.sh              # Restaure une sauvegarde
├── build.sh                # Build frontend + desktop
├── backend/
│   ├── src/
│   │   ├── routes/         # API endpoints
│   │   ├── services/       # Notifications, WebSocket, Chatbot
│   │   ├── middleware/     # Auth JWT, Subscription
│   │   └── config/         # Database, migrations
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/          # Toutes les pages
│   │   ├── components/     # Layout, ChatBot
│   │   ├── hooks/          # WebSocket hook
│   │   └── context/        # Auth context
│   └── package.json
├── desktop/
│   ├── main.js             # Electron main process
│   ├── preload.js          # Preload script
│   └── electron-builder.yml
├── docker-compose.yml
└── README.md
```

---

## 🔧 Variables d'Environnement

```env
# Base de données
DB_HOST=localhost
DB_PORT=5432
DB_NAME=erp_database
DB_USER=erp_user
DB_PASSWORD=auto-generated

# JWT
JWT_SECRET=auto-generated
JWT_EXPIRES_IN=7d

# Google Calendar
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:5000/api/integrations/google/callback

# Slack
SLACK_CLIENT_ID=
SLACK_CLIENT_SECRET=
SLACK_SIGNING_SECRET=

# Microsoft Teams
TEAMS_CLIENT_ID=
TEAMS_CLIENT_SECRET=
TEAMS_TENANT_ID=

# Email SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=

# WhatsApp Twilio
TWILIO_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_FROM=
```

---

## 📦 Commandes Utiles

| Commande | Description |
|----------|-------------|
| `./start.sh` | Démarrer le système |
| `./stop.sh` | Arrêter le système |
| `./backup.sh` | Sauvegarder la base |
| `./restore.sh <file>` | Restaurer une sauvegarde |
| `./build.sh` | Build frontend + desktop |
| `npm test` | Lancer les tests |
| `npm run migrate` | Relancer les migrations |
| `npm run seed` | Données de démo |
| `npm run seed:subscriptions` | Seed plans d'abonnement |

---

## 🔒 Sécurité

- **Rate Limiting** : 100 req/15min général, 5 req/15min pour l'auth
- **Validation** : express-validator sur tous les inputs
- **Chiffrement** : bcrypt pour les mots de passe
- **JWT** : Tokens avec expiration configurable
- **Audit Log** : Traçabilité complète des actions
- **Cache Redis** : Dégradation gracieuse si indisponible

---

## 📊 Monitoring & Maintenance

- **Audit Log** : `/audit` - Journal complet des actions (admin)
- **Sauvegardes** : `/backups` - Gestion des backups (admin)
- **Backup auto** : Cron job quotidien à 2h du matin
- **Redis Cache** : Dashboard (60s), rapports (5min), listes (2min)

---

## 🔐 Identifiants par Défaut

- **Email** : admin@erp.com
- **Mot de passe** : admin123

---

## 📋 Prérequis

- Node.js 16+
- PostgreSQL 12+
- Redis (optionnel, pour le cache)
- Ollama (optionnel, pour les modèles IA)
- npm ou yarn

---

## 🤝 Stack Technique

- **Frontend** : React 18, Tailwind CSS, Recharts
- **Backend** : Node.js, Express.js, WebSocket
- **Desktop** : Electron
- **Base de données** : PostgreSQL
- **Cache** : Redis (optionnel, dégradation gracieuse)
- **Auth** : JWT
- **Intégrations** : Google Calendar, Slack, Microsoft Teams, Twilio, Nodemailer
- **IA** : MiMo (défaut), Gemma 4 (avancé) via Ollama
- **Sécurité** : Rate limiting, validation, chiffrement bcrypt
- **Tests** : Jest + Supertest
- **Icônes** : Lucide React

---

## 📄 Mentions Légales

- **Propriétaire** : Alpha Omega Digital
- **Conditions d'utilisation** : [/terms](/terms)
- **Politique de confidentialité** : [/privacy](/privacy)

---

© 2026 Alpha Omega Digital. Tous droits réservés.
