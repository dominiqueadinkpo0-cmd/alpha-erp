import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AlertTriangle, X } from 'lucide-react';

export default function TrialBanner() {
  const [trial, setTrial] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const { user, token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || !token) return;

    const fetchTrial = async () => {
      try {
        const response = await fetch('/api/trial/status', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setTrial(data);
        }
      } catch (err) {
        console.error('Failed to fetch trial status');
      }
    };

    fetchTrial();
    const interval = setInterval(fetchTrial, 60000);
    return () => clearInterval(interval);
  }, [user, token]);

  if (!user || dismissed || !trial) return null;

  if (trial.expired) {
    return (
      <div className="bg-red-600 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertTriangle size={20} />
          <span className="font-semibold">Free trial expired. Please upgrade to continue.</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/billing')}
            className="bg-white text-red-600 px-4 py-1.5 rounded-lg font-semibold hover:bg-red-50 transition-colors"
          >
            Upgrade
          </button>
          <button onClick={() => setDismissed(true)} className="hover:opacity-75 transition-opacity">
            <X size={20} />
          </button>
        </div>
      </div>
    );
  }

  if (!trial.isActive) return null;

  const daysText = trial.daysRemaining === 1
    ? '1 day remaining'
    : `${trial.daysRemaining} days remaining`;
  const bgColor = trial.daysRemaining <= 7 ? 'bg-orange-500' : 'bg-yellow-500';
  const textColor = trial.daysRemaining <= 7 ? 'text-orange-900' : 'text-yellow-900';

  return (
    <div className={`${bgColor} ${textColor} px-4 py-3 flex items-center justify-between`}>
      <div className="flex items-center gap-3">
        <AlertTriangle size={20} />
        <span className="font-semibold">Free trial: {daysText}</span>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/billing')}
          className="bg-white text-gray-900 px-4 py-1.5 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
        >
          Upgrade
        </button>
        <button onClick={() => setDismissed(true)} className="hover:opacity-75 transition-opacity">
          <X size={20} />
        </button>
      </div>
    </div>
  );
}
