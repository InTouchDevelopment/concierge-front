/**
 * Register Page (One-time use)
 * Modern styled admin registration
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { register as registerService } from '../services/auth';
import { Mail, Lock, User, Loader2, Sparkles, UserPlus, AlertCircle, ArrowRight } from 'lucide-react';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      const admin = await registerService(email, password, name);
      login(admin);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-500 to-secondary-500 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent-500/20 rounded-full blur-3xl"></div>
      <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-secondary-400/20 rounded-full blur-2xl"></div>

      <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-md p-8 relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-xl shadow-primary-500/30 relative">
            <span className="text-white font-bold text-2xl">SC</span>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-400 rounded-full flex items-center justify-center shadow-lg">
              <UserPlus className="w-3 h-3 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Create Admin Account</h1>
          <p className="text-gray-500 mt-2 text-sm">Set up your administrator profile</p>
        </div>

        {error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Full Name
            </label>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-icon"
                placeholder="Enter your full name"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-icon"
                placeholder="admin@company.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Password
            </label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-icon"
                placeholder="••••••••"
                required
                minLength={8}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
              <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
              Must be at least 8 characters
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-3.5 text-base"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating Account...
              </>
            ) : (
              <>
                Create Account
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <p className="text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 hover:text-primary-700 font-semibold transition-colors">
              Sign In
            </Link>
          </p>
        </div>

        {/* Feature badges */}
        <div className="mt-6 flex items-center justify-center gap-4">
          <span className="flex items-center gap-1.5 text-xs text-gray-400">
            <Sparkles className="w-3 h-3" />
            Secure
          </span>
          <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
          <span className="flex items-center gap-1.5 text-xs text-gray-400">
            <Sparkles className="w-3 h-3" />
            Fast Setup
          </span>
          <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
          <span className="flex items-center gap-1.5 text-xs text-gray-400">
            <Sparkles className="w-3 h-3" />
            Admin Access
          </span>
        </div>
      </div>
    </div>
  );
}
