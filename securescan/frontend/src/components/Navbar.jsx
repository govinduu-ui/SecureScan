import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu,
  Bell,
  LogOut,
  Sliders,
  SlidersHorizontal,
  ChevronDown,
  Search,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCustomization } from '../context/CustomizationContext';

export default function Navbar({ onToggleSidebar }) {
  const { user, logout } = useAuth();
  const { settings } = useCustomization();
  const navigate = useNavigate();

  const [targetInput, setTargetInput] = useState('');
  const [selectedEnv, setSelectedEnv] = useState('production');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const menuRef = useRef(null);
  const notifRef = useRef(null);

  // Close menus on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Global hotkey support (Ctrl+K or Slash based on preferences)
  useEffect(() => {
    const hotkeyPref = settings?.navigation?.quickScanHotkey || 'ctrl_k';
    if (hotkeyPref === 'disabled') return;

    function handleKeyDown(event) {
      const activeEl = document.activeElement;
      const isInputFocused =
        activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.isContentEditable);

      if (hotkeyPref === 'ctrl_k' && (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        const input = document.getElementById('navbar-quick-target-input');
        if (input) {
          input.focus();
          input.select();
        }
      } else if (hotkeyPref === 'slash' && event.key === '/' && !isInputFocused) {
        event.preventDefault();
        const input = document.getElementById('navbar-quick-target-input');
        if (input) {
          input.focus();
          input.select();
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [settings?.navigation?.quickScanHotkey]);

  const handleQuickScan = (e) => {
    e.preventDefault();
    if (!targetInput.trim()) return;
    navigate(`/scanner?target=${encodeURIComponent(targetInput.trim())}`);
    setTargetInput('');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="fixed top-0 left-0 lg:left-64 right-0 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200 z-40 flex items-center justify-between px-4 lg:px-6">
      {/* Left: Mobile Toggle + Env Selector + Quick URL Scan Input */}
      <div className="flex items-center gap-3 flex-1 max-w-2xl">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label="Open sidebar"
          className="lg:hidden p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Environment Selector */}
        <div className="hidden sm:flex items-center bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg gap-1.5">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Env:
          </span>
          <select
            value={selectedEnv}
            onChange={(e) => setSelectedEnv(e.target.value)}
            aria-label="Select environment"
            className="bg-transparent text-xs text-indigo-700 font-semibold focus:outline-none cursor-pointer pr-1 border-0 p-0"
          >
            <option value="production" className="bg-white text-slate-800">
              Production
            </option>
            <option value="staging" className="bg-white text-slate-800">
              Staging
            </option>
            <option value="development" className="bg-white text-slate-800">
              Development
            </option>
          </select>
        </div>

        {/* Quick URL Scan Input */}
        <form onSubmit={handleQuickScan} className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            id="navbar-quick-target-input"
            type="text"
            value={targetInput}
            onChange={(e) => setTargetInput(e.target.value)}
            placeholder={`Scan website (e.g. https://example.com)... ${
              settings?.navigation?.quickScanHotkey === 'ctrl_k'
                ? '(Ctrl+K)'
                : settings?.navigation?.quickScanHotkey === 'slash'
                ? '(/)'
                : ''
            }`}
            aria-label="Scan website URL"
            className="w-full bg-slate-50 border border-slate-200 py-1.5 pl-9 pr-3 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-colors"
          />
        </form>
      </div>

      {/* Right: System Status + Notifications + User Avatar */}
      <div className="flex items-center gap-3">
        {/* System Online Status Pill */}
        <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>System Online</span>
        </div>

        {/* Notification Bell */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            aria-label="View notifications"
            className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-600 rounded-full ring-2 ring-white" />
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-lg p-3 z-50">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-900">
                  Notifications
                </span>
                <span className="text-[11px] text-indigo-600 font-semibold cursor-pointer hover:underline" onClick={() => setNotificationsOpen(false)}>
                  Mark all as read
                </span>
              </div>
              <div className="flex flex-col gap-2 py-2">
                <div className="p-2.5 rounded-lg bg-indigo-50/60 border border-indigo-100 text-xs">
                  <div className="flex items-center justify-between text-[11px] text-indigo-900 font-semibold">
                    <span>Scan Completed</span>
                    <span className="text-slate-400 font-normal">10m ago</span>
                  </div>
                  <p className="text-slate-600 mt-0.5 text-xs">
                    Audit for <span className="font-mono font-medium text-slate-800">example.com</span> finished with Score 85 (Grade B+).
                  </p>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                  <div className="flex items-center justify-between text-[11px] text-slate-800 font-semibold">
                    <span>Weekly Summary</span>
                    <span className="text-slate-400 font-normal">1h ago</span>
                  </div>
                  <p className="text-slate-600 mt-0.5 text-xs">
                    Your weekly security audit summary report is ready for review.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            aria-label="User account menu"
            className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-800 font-bold text-xs">
              {user?.name ? user.name[0].toUpperCase() : 'U'}
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl p-2 z-50">
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="font-bold text-xs text-slate-900 truncate">
                  {user?.name || user?.username || 'Security Analyst'}
                </p>
                <p className="text-[11px] text-slate-500 truncate mt-0.5 font-mono">
                  {user?.email}
                </p>
                <span className="inline-block mt-1.5 text-[10px] px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100">
                  Administrator
                </span>
              </div>

              <div className="flex flex-col py-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    navigate('/customization');
                  }}
                  className="flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors text-left font-medium"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Customization</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    navigate('/settings');
                  }}
                  className="flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors text-left font-medium"
                >
                  <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Platform Settings</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    navigate('/scanner');
                  }}
                  className="flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors text-left font-medium"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-indigo-600" />
                  <span>New Scan</span>
                </button>
              </div>

              <div className="border-t border-slate-100 pt-1">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded-lg transition-colors text-left font-medium"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
