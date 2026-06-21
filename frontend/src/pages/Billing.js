import React, { useState, useEffect } from 'react';
import { CreditCard, Check, X, AlertTriangle, RefreshCw, Download, Crown, Zap, Building2, Star } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const planIcons = { free: Star, starter: Zap, professional: Crown, enterprise: Building2 };
const planColors = {
  free: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-600 dark:text-gray-300', border: 'border-gray-300 dark:border-gray-600' },
  starter: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-500' },
  professional: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-500' },
  enterprise: { bg: 'bg-[#F7E5A9]/30', text: 'text-[#9A7432]', border: 'border-[#CBA358]' }
};

const featureLabels = {
  dashboard: 'Tableau de bord',
  products: 'Gestion des produits',
  contacts: 'CRM - Contacts',
  projects: 'Gestion de projets',
  invoices: 'Facturation',
  employees: 'Gestion RH',
  reports: 'Rapports avancés',
  chatbot: 'Assistant IA',
  export: 'Export de données',
  custom_fields: 'Champs personnalisés',
  api_access: 'Accès API',
  priority_support: 'Support prioritaire',
  white_label: 'White label',
  dedicated_server: 'Serveur dédié',
  sla_guarantee: 'Garantie SLA 99.9%'
};

const integrationLabels = {
  google: 'Google Calendar',
  slack: 'Slack',
  teams: 'Microsoft Teams'
};

const notificationLabels = {
  email: 'Notifications email',
  whatsapp: 'Notifications WhatsApp',
  in_app: 'Notifications in-app'
};

const defaultPlans = [
  {
    name: 'Free', slug: 'free', price_monthly: 0, price_yearly: 0,
    max_users: 1, max_products: 50,
    features: { dashboard: true, products: true, contacts: true, projects: false, invoices: true, employees: false, reports: false, chatbot: true, integrations: { google: false, slack: false, teams: false }, notifications: { email: false, whatsapp: false, in_app: true }, export: false, custom_fields: false, api_access: false, priority_support: false }
  },
  {
    name: 'Starter', slug: 'starter', price_monthly: 29, price_yearly: 290,
    max_users: 5, max_products: 500,
    features: { dashboard: true, products: true, contacts: true, projects: true, invoices: true, employees: true, reports: false, chatbot: true, integrations: { google: true, slack: false, teams: false }, notifications: { email: true, whatsapp: false, in_app: true }, export: true, custom_fields: false, api_access: false, priority_support: false }
  },
  {
    name: 'Professional', slug: 'professional', price_monthly: 79, price_yearly: 790,
    max_users: 25, max_products: -1,
    features: { dashboard: true, products: true, contacts: true, projects: true, invoices: true, employees: true, reports: true, chatbot: true, integrations: { google: true, slack: true, teams: true }, notifications: { email: true, whatsapp: true, in_app: true }, export: true, custom_fields: true, api_access: true, priority_support: false }
  },
  {
    name: 'Enterprise', slug: 'enterprise', price_monthly: 199, price_yearly: 1990,
    max_users: -1, max_products: -1,
    features: { dashboard: true, products: true, contacts: true, projects: true, invoices: true, employees: true, reports: true, chatbot: true, integrations: { google: true, slack: true, teams: true }, notifications: { email: true, whatsapp: true, in_app: true }, export: true, custom_fields: true, api_access: true, priority_support: true, white_label: true, dedicated_server: true, sla_guarantee: true }
  }
];

function parseFeatures(features) {
  if (!features) return defaultPlans[0].features;
  if (typeof features === 'string') {
    try { return JSON.parse(features); } catch { return defaultPlans[0].features; }
  }
  return features;
}

export default function Billing() {
  const [subscription, setSubscription] = useState(null);
  const [plans, setPlans] = useState(defaultPlans);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [billingCycle, setBillingCycle] = useState('monthly');

  useEffect(() => {
    Promise.all([
      api.get('/subscription/current').catch(() => ({ data: null })),
      api.get('/subscription/plans').catch(() => ({ data: defaultPlans })),
      api.get('/subscription/invoices').catch(() => ({ data: [] }))
    ]).then(([subRes, plansRes, invRes]) => {
      setSubscription(subRes.data);
      if (plansRes.data?.length) setPlans(plansRes.data);
      setInvoices(invRes.data?.invoices || invRes.data || []);
    }).finally(() => setLoading(false));
  }, []);

  const handleUpgrade = async (planId) => {
    try {
      const currentSub = subscription?.subscription;
      if (currentSub?.status === 'active') {
        await api.post('/subscription/upgrade', { plan_id: planId });
      } else {
        await api.post('/subscription/subscribe', { plan_id: planId, billing_cycle: billingCycle });
      }
      toast.success('Abonnement mis à jour!');
      window.location.reload();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de la mise à jour');
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await api.post('/subscription/cancel');
      toast.success('Abonnement annulé');
      setShowCancelModal(false);
      setSubscription(prev => prev ? { ...prev, subscription: { ...prev.subscription, status: 'cancelled' } } : prev);
    } catch {
      toast.error('Erreur lors de l\'annulation');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><RefreshCw className="animate-spin text-[#CBA358]" size={24} /></div>;

  const currentPlan = subscription?.plan;
  const currentSub = subscription?.subscription;
  const currentPlanSlug = currentPlan?.slug || 'free';

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-6">
      <div className="flex items-center gap-3">
        <div className="bg-gradient-to-br from-[#9A7432] to-[#CBA358] p-3 rounded-xl"><CreditCard size={24} className="text-white" /></div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Abonnement & Facturation</h1>
          <p className="text-gray-500 dark:text-gray-400">Gérez votre abonnement et vos paiements</p>
        </div>
      </div>

      <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-gray-200 dark:border-[#334155] p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Plan actuel</p>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">{currentPlan?.name || 'Free'}</h2>
            <p className="text-2xl font-semibold text-[#9A7432] mt-1">
              €{currentPlan?.price_monthly || 0}<span className="text-sm text-gray-500 dark:text-gray-400 font-normal">/mois</span>
            </p>
            {currentSub?.current_period_end && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                {currentSub?.status === 'cancelled' ? 'Annule le' : 'Renouvellement'}: {new Date(currentSub.current_period_end).toLocaleDateString('fr-FR')}
              </p>
            )}
          </div>
          {currentSub?.status === 'active' && (
            <button onClick={() => setShowCancelModal(true)} className="px-4 py-2 border border-red-300 dark:border-red-800/50 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-sm font-medium transition-colors">
              Annuler l'abonnement
            </button>
          )}
        </div>

        {currentPlan?.features && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-[#334155]">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Fonctionnalités incluses</h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(parseFeatures(currentPlan.features)).map(([key, val]) => {
                if (typeof val === 'object') {
                  return Object.entries(val).map(([k, v]) => v && (
                    <span key={`${key}-${k}`} className="px-3 py-1 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-medium">
                      {integrationLabels[k] || notificationLabels[k] || k}
                    </span>
                  ));
                }
                return val && (
                  <span key={key} className="px-3 py-1 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-medium">
                    {featureLabels[key] || key}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Plans disponibles</h2>
          <div className="flex bg-gray-100 dark:bg-[#0f172a] rounded-lg p-1">
            <button onClick={() => setBillingCycle('monthly')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${billingCycle === 'monthly' ? 'bg-white dark:bg-[#1e293b] shadow text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}`}>
              Mensuel
            </button>
            <button onClick={() => setBillingCycle('yearly')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${billingCycle === 'yearly' ? 'bg-white dark:bg-[#1e293b] shadow text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}`}>
              Annuel <span className="text-green-600 dark:text-green-400 text-xs">-17%</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => {
            const slug = plan.slug || plan.name?.toLowerCase();
            const isCurrent = slug === currentPlanSlug;
            const price = billingCycle === 'yearly' ? (plan.price_yearly || 0) : (plan.price_monthly || 0);
            const monthlyPrice = billingCycle === 'yearly' ? Math.round(price / 12) : price;
            const colors = planColors[slug] || planColors.free;
            const Icon = planIcons[slug] || Star;
            const features = parseFeatures(plan.features);

            return (
              <div key={slug} className={`bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border-2 p-6 transition-all hover:shadow-lg ${isCurrent ? `${colors.border}` : 'border-transparent hover:border-gray-200 dark:hover:border-[#334155]'}`}>
                <div className="text-center mb-6">
                  <div className={`w-12 h-12 ${colors.bg} rounded-xl flex items-center justify-center mx-auto mb-3`}>
                    <Icon size={24} className={colors.text} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{plan.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{plan.description}</p>
                  <div className="mt-3">
                    <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">€{monthlyPrice}</span>
                    <span className="text-gray-500 dark:text-gray-400 text-sm">/mois</span>
                  </div>
                  {billingCycle === 'yearly' && plan.price_yearly > 0 && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">€{plan.price_yearly}/an</p>
                  )}
                </div>

                <div className="space-y-2 mb-6">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Limites</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Utilisateurs</span>
                    <span className="font-medium dark:text-gray-200">{plan.max_users === -1 ? 'Illimité' : plan.max_users}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Produits</span>
                    <span className="font-medium dark:text-gray-200">{plan.max_products === -1 ? 'Illimité' : plan.max_products}</span>
                  </div>
                </div>

                <div className="space-y-2 mb-6">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Modules</p>
                  {['dashboard', 'products', 'contacts', 'projects', 'invoices', 'employees', 'reports', 'chatbot'].map(key => (
                    <div key={key} className="flex items-center gap-2 text-sm">
                      {features[key] ? <Check size={14} className="text-green-500" /> : <X size={14} className="text-gray-300 dark:text-gray-600" />}
                      <span className={features[key] ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-600'}>{featureLabels[key]}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 mb-6">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Intégrations</p>
                  {Object.entries(features.integrations || {}).map(([key, val]) => (
                    <div key={key} className="flex items-center gap-2 text-sm">
                      {val ? <Check size={14} className="text-green-500" /> : <X size={14} className="text-gray-300 dark:text-gray-600" />}
                      <span className={val ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-600'}>{integrationLabels[key]}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 mb-6">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Notifications</p>
                  {Object.entries(features.notifications || {}).map(([key, val]) => (
                    <div key={key} className="flex items-center gap-2 text-sm">
                      {val ? <Check size={14} className="text-green-500" /> : <X size={14} className="text-gray-300 dark:text-gray-600" />}
                      <span className={val ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-600'}>{notificationLabels[key]}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 mb-6">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Extras</p>
                  {['export', 'custom_fields', 'api_access', 'priority_support', 'white_label', 'dedicated_server', 'sla_guarantee'].map(key => features[key] && (
                    <div key={key} className="flex items-center gap-2 text-sm">
                      <Check size={14} className="text-green-500" />
                      <span className="text-gray-700 dark:text-gray-300">{featureLabels[key]}</span>
                    </div>
                  ))}
                </div>

                {isCurrent ? (
                  <div className="text-center py-3 bg-gray-100 dark:bg-[#0f172a] text-gray-600 dark:text-gray-400 rounded-xl text-sm font-medium">
                    Plan actuel
                  </div>
                ) : (
                  <button onClick={() => handleUpgrade(plan.id)} className={`w-full py-3 rounded-xl text-sm font-semibold transition-all ${
                    plan.price_monthly > 0 ? 'bg-gradient-to-r from-[#9A7432] to-[#CBA358] text-white hover:from-[#7A5C28] hover:to-[#A88545]' : 'bg-gray-100 dark:bg-[#0f172a] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#334155]'
                  }`}>
                    {currentPlan?.price_monthly > 0 && plan.price_monthly > currentPlan.price_monthly ? 'Upgrade' : 'Commencer'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-gray-200 dark:border-[#334155]">
        <div className="p-6 border-b border-gray-100 dark:border-[#334155]">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Historique de facturation</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 dark:border-[#334155] bg-gray-50 dark:bg-[#0f172a]">
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Facture</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Montant</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Statut</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Action</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length === 0 ? (
                <tr><td colSpan="5" className="text-center py-8 text-gray-500 dark:text-gray-400">Aucun historique</td></tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-gray-50 dark:border-[#334155] hover:bg-gray-50 dark:hover:bg-[#0f172a] transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{new Date(inv.created_at || inv.date).toLocaleDateString('fr-FR')}</td>
                    <td className="px-6 py-4 text-sm font-mono text-gray-700 dark:text-gray-300">{inv.invoice_number}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">€{(inv.amount || 0).toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        inv.status === 'paid' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                        inv.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {inv.status === 'paid' ? 'Payé' : inv.status === 'pending' ? 'En attente' : inv.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button className="text-[#9A7432] hover:text-[#7A5C28] text-sm flex items-center gap-1 font-medium">
                        <Download size={14} /> PDF
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1e293b] rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle size={24} className="text-red-500" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Annuler l'abonnement</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Êtes-vous sûr de vouloir annuler votre abonnement ? Vous perdrez l'accès aux fonctionnalités premium à la fin de votre période de facturation.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowCancelModal(false)} className="px-4 py-2 border border-gray-200 dark:border-[#334155] rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-[#334155] dark:text-gray-300 transition-colors">
                Garder l'abonnement
              </button>
              <button onClick={handleCancel} disabled={cancelling} className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors">
                {cancelling ? 'Annulation...' : 'Oui, annuler'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
