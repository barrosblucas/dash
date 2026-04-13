'use client';

import { ReactNode } from 'react';
import { useState } from 'react';

import { useThemeStore } from '@/stores/themeStore';

import Header from './Header';
import Sidebar from './Sidebar';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme } = useThemeStore();

  return (
    <div className="min-h-screen bg-dark-950">
      {/* Sidebar - hidden on mobile */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <Sidebar />
      </aside>

      {/* Main content area */}
      <div className="lg:pl-64">
        {/* Header */}
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

        {/* Page content */}
        <main className="py-6 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className={`lg:hidden fixed inset-0 z-40 backdrop-blur-sm ${theme === 'dark' ? 'bg-dark-950/80' : 'bg-dark-950/60'}`}>
          <div className="fixed inset-y-0 left-0 w-64 bg-dark-900 shadow-xl">
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}