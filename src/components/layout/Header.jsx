/**
 * Header Component
 * Top navigation bar with user info and logout
 */

import { LogOut, User, Sparkles } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Header() {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 px-6 py-4 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-11 h-11 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center shadow-soft">
              <span className="text-white font-bold text-lg">SC</span>
            </div>
            <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-amber-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-primary-600 to-secondary-500 bg-clip-text text-transparent">
              Social Concierge
            </h1>
            <p className="text-xs text-gray-500 font-medium">Admin Dashboard</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-xl">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-secondary-400 rounded-lg flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">{admin?.name || 'Admin'}</p>
              <p className="text-xs text-gray-500">{admin?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
