import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  LayoutDashboard, Package, Users, FolderKanban, FileText, 
  UserCog, LogOut, Menu, X, ChevronDown, BarChart3, Settings,
  Shield, CreditCard, Sun, Moon
} from 'lucide-react';
import AlphaOmegaLogo from './AlphaOmegaLogo';

const menuItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/products', label: 'Produits', icon: Package },
  { path: '/contacts', label: 'Contacts', icon: Users },
  { path: '/projects', label: 'Projets', icon: FolderKanban },
  { path: '/invoices', label: 'Factures', icon: FileText },
  { path: '/employees', label: 'Employés', icon: UserCog },
  { path: '/reports', label: 'Rapports', icon: BarChart3 },
  { path: '/settings', label: 'Paramètres', icon: Settings },
  { path: '/billing', label: 'Abonnement', icon: CreditCard },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-[#0f172a]">
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white dark:bg-[#1e293b] border-r border-gray-200 dark:border-[#334155] transition-all duration-300 flex flex-col`}>
        <div className="p-4 flex items-center justify-between border-b border-gray-100 dark:border-[#334155]">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <AlphaOmegaLogo size={40} />
              <div>
                <h1 className="text-sm font-bold text-gray-900 dark:text-gray-100">Alpha ERP</h1>
                <p className="text-[10px] text-[#CBA358]">by Alpha Omega Digital</p>
              </div>
            </div>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-gray-100 dark:hover:bg-[#334155] rounded-lg text-gray-500 dark:text-gray-400">
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
        
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm ${
                location.pathname === item.path 
                  ? 'bg-[#F7E5A9]/10 text-[#9A7432] font-medium' 
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#334155] hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <item.icon size={18} />
              {sidebarOpen && <span>{item.label}</span>}
            </Link>
          ))}
          {user?.role === 'admin' && (
            <Link
              to="/staff"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm ${
                location.pathname === '/staff' 
                  ? 'bg-[#F7E5A9]/10 text-[#9A7432] font-medium' 
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#334155] hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <Shield size={18} />
              {sidebarOpen && <span>Administration</span>}
            </Link>
          )}
        </nav>

        <div className="p-3 border-t border-gray-100 dark:border-[#334155]">
          <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 w-full hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-all text-sm">
            <LogOut size={18} />
            {sidebarOpen && <span>Déconnexion</span>}
          </button>
          {sidebarOpen && (
            <div className="mt-3 px-3 py-2 bg-gray-50 dark:bg-[#0f172a] rounded-lg">
              <p className="text-[10px] text-gray-400 text-center">
                © 2026 Alpha Omega Digital
              </p>
            </div>
          )}
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white dark:bg-[#1e293b] border-b border-gray-200 dark:border-[#334155] px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {menuItems.find(item => item.path === location.pathname)?.label || 
               (location.pathname === '/staff' ? 'Administration' : 'Alpha ERP')}
            </h2>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 hover:bg-gray-100 dark:hover:bg-[#334155] rounded-lg text-gray-500 dark:text-gray-400 transition-colors"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            
            <div className="relative">
              <button 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 dark:hover:bg-[#334155] rounded-lg transition-colors"
              >
                <div className="w-9 h-9 bg-gradient-to-br from-[#9A7432] to-[#CBA358] rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  {user?.first_name?.[0]}{user?.last_name?.[0]}
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{user?.first_name} {user?.last_name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.role}</p>
                </div>
                <ChevronDown size={16} className="text-gray-400 dark:text-gray-500" />
              </button>
              
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#1e293b] rounded-xl shadow-lg border border-gray-200 dark:border-[#334155] z-50 overflow-hidden">
                  <div className="p-4 border-b border-gray-100 dark:border-[#334155]">
                    <p className="font-medium text-gray-900 dark:text-gray-100">{user?.first_name} {user?.last_name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
                  </div>
                  <div className="p-2">
                    <Link to="/settings" className="block px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#334155] rounded-lg" onClick={() => setDropdownOpen(false)}>
                      Paramètres
                    </Link>
                    <Link to="/billing" className="block px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#334155] rounded-lg" onClick={() => setDropdownOpen(false)}>
                      Abonnement
                    </Link>
                    <Link to="/terms" className="block px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#334155] rounded-lg" onClick={() => setDropdownOpen(false)}>
                      Conditions d'utilisation
                    </Link>
                    <Link to="/privacy" className="block px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#334155] rounded-lg" onClick={() => setDropdownOpen(false)}>
                      Politique de confidentialité
                    </Link>
                  </div>
                  <div className="p-2 border-t border-gray-100 dark:border-[#334155]">
                    <button 
                      onClick={handleLogout}
                      className="w-full px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                    >
                      Déconnexion
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto bg-gray-50 dark:bg-[#0f172a]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
