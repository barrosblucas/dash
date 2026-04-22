'use client';

import { ReactNode, useState } from 'react';


import Header from './Header';
import Sidebar from './Sidebar';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Removido block mounted para evitar a regressão de SSR

  return (
    <div className="min-h-screen relative bg-surface text-on-surface overflow-x-hidden">
      {/* ── Dynamic Ambient Background for Inner Pages ── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary/3 blur-[120px] mix-blend-multiply animate-float" />
        <div className="absolute bottom-[10%] -right-[10%] w-[40%] h-[40%] rounded-full bg-secondary/3 blur-[100px] mix-blend-multiply animate-float" style={{ animationDelay: '3s' }} />

        {/* Dark mode adjustments */}
        <div className="hidden dark:block absolute inset-0 bg-surface/90 backdrop-blur-[100px]" />
      </div>

      {/* Sidebar — desktop fixed */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col z-30">
        <div className="flex-1 flex flex-col h-full pl-6 py-6 pb-6">
          <div className="flex-1 rounded-[2.5rem] overflow-hidden glass-card shadow-ambient border-none mr-2">
            <Sidebar />
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-72 relative z-10 flex flex-col min-h-screen">
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 flex"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="absolute inset-0 bg-surface/80 backdrop-blur-md transition-opacity" />
          <div
            className="relative flex-1 flex w-full max-w-xs animate-slide-in-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex-1 h-full bg-surface-container-lowest shadow-ambient-lg rounded-r-[2.5rem] overflow-hidden p-2">
              <Sidebar onClose={() => setSidebarOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
