import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth.js';
import { useAppState } from '../hooks/useAppState.jsx';
import { Lock, User, Key, Eye, EyeOff, AlertCircle, ShieldCheck, Mail, X, Sprout } from 'lucide-react';
import { fbResetPassword } from '../services/firebaseAuth.js';

export default function Login() {
  const { login } = useAuth();
  const { state, dispatch } = useAppState();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Forgot Password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');

  const firebaseEnabled = !!state.settings?.firebaseEnabled;

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await login(username, password);

    if (!result.success) {
      setError(result.message || 'Login failed. Please check your credentials.');
      setIsLoading(false);
    }
  };

  const handleResetSettings = () => {
    if (window.confirm('Reset server connection settings? This will log you out.')) {
      dispatch({ type: 'RESET_SETTINGS' });
    }
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      setForgotError('Please enter your email address.');
      return;
    }
    setForgotError('');
    setForgotSuccess('');
    setForgotLoading(true);

    try {
      const res = await fbResetPassword(forgotEmail.trim());
      if (res.success) {
        setForgotSuccess('Password reset link sent! Please check your email inbox.');
        setForgotEmail('');
      } else {
        setForgotError(res.message || 'Failed to send reset email.');
      }
    } catch (err) {
      setForgotError(err.message || 'An error occurred.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950 flex items-center justify-center z-[20000] overflow-hidden">
      {/* Decorative background glow blobs */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-emerald-500/15 rounded-full blur-[80px] animate-pulse pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-teal-500/10 rounded-full blur-[100px] animate-pulse pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-600/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Main glassmorphism card */}
      <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl shadow-2xl p-8 w-full max-w-md mx-4 relative z-10 animate-[modalPopIn_0.4s_cubic-bezier(0.16,1,0.3,1)]">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 mb-4 shadow-lg shadow-emerald-500/20">
            <Sprout className="w-9 h-9 animate-[bounce_3s_infinite]" />
          </div>
          <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-300">
            Welcome Back
          </h2>
          <p className="text-slate-400 text-sm mt-2 font-medium">
            to <span className="text-emerald-400 font-semibold">Miklens Trial Manager</span>
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-950/40 border border-red-800/50 rounded-2xl mb-6">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-300 font-medium">{error}</p>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Username</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                <User className="w-5 h-5" />
              </span>
              <input
                type="text"
                required
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="block w-full pl-11 pr-4 py-3 bg-slate-950/50 border border-slate-800 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-100 placeholder-slate-600 sm:text-sm transition-all outline-none focus:bg-slate-950"
                placeholder="Type your username"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Password</label>
              {firebaseEnabled && (
                <button
                  type="button"
                  onClick={() => {
                    setForgotError('');
                    setForgotSuccess('');
                    setShowForgotModal(true);
                  }}
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold focus:outline-none transition-colors"
                >
                  Forgot Password?
                </button>
              )}
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                <Key className="w-5 h-5" />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="block w-full pl-11 pr-12 py-3 bg-slate-950/50 border border-slate-800 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-100 placeholder-slate-600 sm:text-sm transition-all outline-none focus:bg-slate-950"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                tabIndex="-1"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-2xl shadow-lg shadow-emerald-950/40 text-base font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 cursor-pointer"
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-800/80 text-center space-y-3">
          <button
            type="button"
            onClick={handleResetSettings}
            className="text-xs font-semibold text-slate-400 hover:text-emerald-400 transition-colors"
          >
            Reset Server Connection Settings
          </button>
          <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-500/80" />
            <span>Secure Multi-User Authentication Active</span>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-[21000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-4 relative animate-[modalPopIn_0.3s_ease-out]">
            <button
              onClick={() => setShowForgotModal(false)}
              className="absolute right-4 top-4 p-1.5 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="text-center pb-2">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-950/50 text-emerald-400 border border-emerald-800/30 mb-3 animate-[pulse_2s_infinite]">
                <Mail className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-slate-100">Forgot Password</h3>
              <p className="text-xs text-slate-400 mt-1">Enter your registered email address below, and we'll send you a password reset link.</p>
            </div>

            <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
              {forgotError && (
                <div className="flex items-center gap-2.5 p-3 bg-red-950/40 border border-red-800/50 rounded-xl">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <p className="text-xs text-red-300 font-medium">{forgotError}</p>
                </div>
              )}
              {forgotSuccess && (
                <div className="flex items-center gap-2.5 p-3 bg-emerald-950/40 border border-emerald-800/50 rounded-xl">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <p className="text-xs text-emerald-300 font-medium">{forgotSuccess}</p>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Email Address</label>
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={e => setForgotEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950/50 border border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-100 placeholder-slate-600 text-sm transition-all focus:bg-slate-950"
                  placeholder="e.g. user@example.com"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-bold rounded-2xl text-sm disabled:opacity-50 transition-all cursor-pointer"
                >
                  {forgotLoading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

