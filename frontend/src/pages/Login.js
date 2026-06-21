import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Lock, Mail, Sun, Moon, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import AlphaOmegaLogo, { AlphaOmegaText } from '../components/AlphaOmegaLogo';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [trialInfo, setTrialInfo] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await login(email, password);
      toast.success('Connexion réussie');
      if (response?.trial) {
        setTrialInfo(response.trial);
      }
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Échec de la connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <button
        onClick={toggleTheme}
        className="fixed top-4 right-4 p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors z-50"
      >
        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
      </button>
      <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <AlphaOmegaLogo size={120} />
          <div className="mt-4">
            <AlphaOmegaText size="md" />
          </div>
          <p className="text-gray-500 dark:text-gray-400 mt-4">Connectez-vous à votre compte</p>
        </div>

        {trialInfo && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            trialInfo.expired
              ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
              : trialInfo.daysRemaining <= 7
              ? 'bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800'
              : 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
          }`}>
            <AlertTriangle size={20} className={
              trialInfo.expired ? 'text-red-500' : trialInfo.daysRemaining <= 7 ? 'text-orange-500' : 'text-yellow-500'
            } />
            <div>
              <p className={`text-sm font-semibold ${
                trialInfo.expired ? 'text-red-700 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'
              }`}>
                {trialInfo.expired
                  ? 'Free trial expired'
                  : `Free trial: ${trialInfo.daysRemaining} days remaining`}
              </p>
              {!trialInfo.expired && trialInfo.expiresAt && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Expires: {new Date(trialInfo.expiresAt).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={20} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-[#334155] rounded-lg focus:ring-2 focus:ring-[#CBA358] focus:border-transparent bg-white dark:bg-[#0f172a] text-gray-900 dark:text-gray-100"
                placeholder="admin@erp.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Mot de passe</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={20} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-[#334155] rounded-lg focus:ring-2 focus:ring-[#CBA358] focus:border-transparent bg-white dark:bg-[#0f172a] text-gray-900 dark:text-gray-100"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#9A7432] via-[#CBA358] to-[#D8B467] text-white py-3 rounded-lg font-semibold hover:from-[#7A5C28] hover:via-[#A88545] hover:to-[#B89A52] transition-all shadow-lg shadow-[#CBA358]/30 disabled:opacity-50"
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <div className="mt-6 p-4 bg-gray-50 dark:bg-[#0f172a] rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
            Démo : <span className="font-mono">admin@erp.com</span> / <span className="font-mono">admin123</span>
          </p>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            En vous connectant, vous acceptez nos{' '}
            <Link to="/terms" className="text-[#CBA358] hover:underline">Conditions d'Utilisation</Link>
            {' '}et notre{' '}
            <Link to="/privacy" className="text-[#CBA358] hover:underline">Politique de Confidentialité</Link>
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            © 2026 Alpha Omega Digital. Tous droits réservés.
          </p>
        </div>
      </div>
    </div>
  );
}
