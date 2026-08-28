import React, { useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const navigate = useNavigate();
  const { token, logout } = useAuth();

  const displayName = localStorage.getItem('username');
  const avatarLetter = (displayName && displayName.charAt(0).toUpperCase()) || 'U';

  const goHomeOrDashboard = useCallback(() => {
    if (token) navigate('/dashboard');
    else navigate('/');
  }, [navigate, token]);

  const handleLogout = useCallback(() => {
    logout();
    navigate('/');
  }, [logout, navigate]);

  return (
    <nav className="sticky top-0 z-50 glass-panel border-x-0 border-t-0 border-b border-white/5 bg-[#030712]/70">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          <button
            onClick={goHomeOrDashboard}
            className="flex items-center space-x-3 group focus:outline-none"
            aria-label="HireSim Home"
          >
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 shadow-lg shadow-blue-500/20">
              <span className="font-bold text-white tracking-tighter">HS</span>
            </div>
            <span className="text-xl font-bold text-white tracking-tight">HireSim</span>
          </button>

          {!token ? (
            <div className="flex space-x-3 items-center">
              <Link to="/login" className="text-gray-300 hover:text-white px-4 py-2 text-sm font-medium transition">
                Sign In
              </Link>
              <Link to="/register" className="bg-white hover:bg-gray-100 text-gray-900 px-5 py-2 text-sm font-semibold rounded-lg transition shadow-md">
                Get Started
              </Link>
            </div>
          ) : (
            <div className="flex items-center space-x-6">
              <div className="hidden md:flex items-center space-x-3 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
                <div className="w-7 h-7 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center shadow-sm">
                  <span className="text-white text-xs font-bold">{avatarLetter}</span>
                </div>
                <span className="text-gray-200 text-sm font-medium pr-1">{displayName}</span>
              </div>

              <button
                onClick={handleLogout}
                className="text-gray-400 hover:text-white text-sm font-medium transition flex items-center gap-1.5"
              >
                <span>Log out</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}