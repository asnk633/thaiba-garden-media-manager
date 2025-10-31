'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutGrid, Calendar, BarChart3, FolderOpen, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  path: string;
}

const navItems: NavItem[] = [
  { label: 'Tasks', icon: <LayoutGrid className="h-5 w-5" />, path: '/tasks' },
  { label: 'Calendar', icon: <Calendar className="h-5 w-5" />, path: '/calendar' },
  { label: 'Reports', icon: <BarChart3 className="h-5 w-5" />, path: '/reports' },
  { label: 'Files', icon: <FolderOpen className="h-5 w-5" />, path: '/files' },
  { label: 'Profile', icon: <User className="h-5 w-5" />, path: '/profile' },
];

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
      <nav className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.path || pathname?.startsWith(item.path + '/');
          return (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className={cn(
                'flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {item.icon}
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
