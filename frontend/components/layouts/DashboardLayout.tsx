'use client';

import { ReactNode, useState, useCallback } from 'react';

import Header from './Header';
import Sidebar from './Sidebar';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const openSidebar = useCallback(() => setSidebarOpen(true), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  return (
    <div className="min-h-screen bg-surface">
      {/* Desktop sidebar — fixed */}
      <aside className="hidden md:flex flex-col h-screen w-64 fixed left-0 top-0 z-40">
        <Sidebar />
      </aside>

      {/* Main content */}
      <main className="flex-1 md:ml-64 min-h-screen flex flex-col">
        <Header onMenuClick={openSidebar} />

        <div className="flex-1 px-4 sm:px-6 lg:px-8 py-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>

      {/* Mobile sidebar drawer */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50" onClick={closeSidebar}>
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" />

          {/* Slide-in sidebar */}
          <aside
            className="absolute inset-y-0 left-0 w-64 bg-surface-container-low dark:bg-slate-900 animate-slide-in-left"
            onClick={(e) => e.stopPropagation()}
          >
            <Sidebar onClose={closeSidebar} />
          </aside>
        </div>
      )}
    </div>
  );
}
