'use client';

import React from 'react';
import { TopBar } from '@/components/TopBar';
import { BottomNav } from '@/components/BottomNav';
import { FAB } from '@/components/FAB';
import { useAuth } from '@/contexts/AuthContext';
import { usePathname } from 'next/navigation';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();

  // Don't show layout on login page
  const isLoginPage = pathname === '/login';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <TopBar />
      <main className="pb-20 md:pb-6">
        <div className="container max-w-7xl mx-auto px-4 py-6">
          {children}
        </div>
      </main>
      <BottomNav />
      <FAB />
    </div>
  );
}
