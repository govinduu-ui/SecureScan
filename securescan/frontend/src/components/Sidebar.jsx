import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Radar,
  History,
  FileCheck2,
  Sliders,
  SlidersHorizontal,
  X,
  Shield,
  User,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ isOpen, onClose }) {
  const { user } = useAuth();
  const location = useLocation();

  const navItems = [
    {
      to: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      to: '/scanner',
      label: 'Web Scanner',
      icon: Radar,
    },
    {
      to: '/scans',
      label: 'Scan History',
      icon: History,
    },
    {
      to: '/reports',
      label: 'Audit Reports',
      icon: FileCheck2,
    },
    {
      to: '/customization',
      label: 'Customization',
      icon: SlidersHorizontal,
    },
    {
      to: '/settings',
      label: 'Settings',
      icon: Sliders,
    },
  ];

  const handleLinkClick = () => {
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white border-r border-slate-200 z-50 flex flex-col justify-between transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col">
          {/* Header Branding */}
          <div className="h-16 px-5 flex items-center justify-between border-b border-slate-200 bg-white">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
                <Shield className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-base tracking-tight text-slate-900 leading-none">
                  SecureScan
                </span>
                <span className="text-[11px] text-slate-500 mt-0.5">
                  Security Assessment
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                className="lg:hidden text-slate-400 hover:text-slate-600 p-1"
                onClick={onClose}
                aria-label="Close menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Nav Section Label */}
          <div className="px-5 py-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Navigation
            </span>
          </div>

          {/* Navigation Items */}
          <nav className="flex flex-col px-3 gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to;

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={handleLinkClick}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs transition-colors duration-150 ${
                    isActive
                      ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom Profile Workspace Widget */}
        <div className="p-3.5 bg-slate-50 m-3 rounded-xl border border-slate-200 flex flex-col gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
              {user?.name ? user.name[0].toUpperCase() : 'U'}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-slate-800 truncate">
                {user?.name || user?.username || 'Security Analyst'}
              </span>
              <span className="text-[10px] text-slate-500 truncate font-mono">
                {user?.email || 'user@example.com'}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-[11px]">
            <span className="text-slate-500">Plan:</span>
            <span className="font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
              Standard
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
