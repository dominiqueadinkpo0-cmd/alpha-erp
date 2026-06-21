import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';
import TrialBanner from './components/TrialBanner';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Contacts from './pages/Contacts';
import Projects from './pages/Projects';
import Invoices from './pages/Invoices';
import Employees from './pages/Employees';
import Reports from './pages/Reports';
import SettingsPage from './pages/Settings';
import StaffDashboard from './pages/StaffDashboard';
import Billing from './pages/Billing';
import TermsOfUse from './pages/TermsOfUse';
import PrivacyPolicy from './pages/PrivacyPolicy';
import ChatBot from './components/ChatBot';
import AuditLog from './pages/AuditLog';
import Backups from './pages/Backups';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="flex items-center justify-center h-screen dark:text-gray-300">Loading...</div>;
  }
  
  return user ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Toaster position="top-right" />
          <ChatBot />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/terms" element={<TermsOfUse />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/" element={
              <PrivateRoute>
                <TrialBanner />
                <Layout />
              </PrivateRoute>
            }>
              <Route index element={<Dashboard />} />
              <Route path="products" element={<Products />} />
              <Route path="contacts" element={<Contacts />} />
              <Route path="projects" element={<Projects />} />
              <Route path="invoices" element={<Invoices />} />
              <Route path="employees" element={<Employees />} />
              <Route path="reports" element={<Reports />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="staff" element={<StaffDashboard />} />
              <Route path="billing" element={<Billing />} />
              <Route path="audit" element={<AuditLog />} />
              <Route path="backups" element={<Backups />} />
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
