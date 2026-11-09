import React, { useState } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { useCustomization } from '../context/CustomizationContext';
import { ChevronRight } from 'lucide-react';

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { settings } = useCustomization();
  const location = useLocation();

  const isFluid = settings?.layout?.containerWidth === 'fluid';
  const showBreadcrumbs = settings?.navigation?.showBreadcrumbs ?? true;

  // Generate breadcrumb items from current path
  const pathParts = location.pathname.split('/').filter(Boolean);

  const getBreadcrumbLabel = (part, idx) => {
    if (part === 'dashboard') return 'Dashboard';
    if (part === 'scanner') return 'Web Scanner';
    if (part === 'scans') return 'Scan History';
    if (part === 'reports') return 'Audit Reports';
    if (part === 'customization') return 'Customization';
    if (part === 'settings') return 'Settings';
    if (part === 'findings') return 'Findings';
    if (part.length > 12) return `${part.slice(0, 8)}…`;
    return part;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased selection:bg-indigo-500/15 selection:text-indigo-900">
      {/* Sidebar Navigation */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Viewport Container */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        {/* Sticky Top Header */}
        <Navbar onToggleSidebar={() => setSidebarOpen(true)} />

        {/* Optional Breadcrumb Bar */}
        {showBreadcrumbs && pathParts.length > 0 && (
          <nav
            aria-label="Breadcrumb"
            className={`pt-20 pb-0 w-full ${
              isFluid ? 'px-4 sm:px-6 lg:px-8' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'
            }`}
          >
            <ol className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
              <li>
                <Link to="/dashboard" className="hover:text-slate-800 transition-colors">
                  Console
                </Link>
              </li>
              {pathParts.map((part, index) => {
                const routeTo = `/${pathParts.slice(0, index + 1).join('/')}`;
                const isLast = index === pathParts.length - 1;
                return (
                  <React.Fragment key={routeTo}>
                    <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
                    <li>
                      {isLast ? (
                        <span className="font-semibold text-slate-800 capitalize" aria-current="page">
                          {getBreadcrumbLabel(part, index)}
                        </span>
                      ) : (
                        <Link to={routeTo} className="hover:text-slate-800 capitalize transition-colors">
                          {getBreadcrumbLabel(part, index)}
                        </Link>
                      )}
                    </li>
                  </React.Fragment>
                );
              })}
            </ol>
          </nav>
        )}

        {/* Content Outlet */}
        <main
          className={`flex-1 ${showBreadcrumbs ? 'pt-4' : 'pt-20'} pb-12 w-full ${
            isFluid ? 'px-4 sm:px-6 lg:px-8' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'
          }`}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
