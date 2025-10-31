'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Sun, Moon, User, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'next/navigation';
import { Notification } from '@/types';

export function TopBar() {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [healthStatus, setHealthStatus] = useState<'healthy' | 'error'>('healthy');

  useEffect(() => {
    if (user) {
      fetchNotifications();
      checkHealth();
      // Poll for notifications every 30 seconds
      const interval = setInterval(fetchNotifications, 30000);
      // Check health every 60 seconds
      const healthInterval = setInterval(checkHealth, 60000);
      return () => {
        clearInterval(interval);
        clearInterval(healthInterval);
      };
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const response = await fetch(`/api/notifications?userId=${user?.id}&read=false&limit=5`);
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const checkHealth = async () => {
    try {
      const response = await fetch('/api/health');
      if (response.ok) {
        const data = await response.json();
        setHealthStatus(data.status === 'healthy' ? 'healthy' : 'error');
      } else {
        setHealthStatus('error');
      }
    } catch {
      setHealthStatus('error');
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      await fetch(`/api/notifications?id=${notificationId}&read=true`, {
        method: 'PATCH',
      });
      fetchNotifications();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const unreadCount = notifications.length;

  return (
    <div className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Thaiba Garden
          </h1>
          {healthStatus === 'healthy' ? (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-500" />
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-9 w-9"
          >
            {isDark ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>

          {/* Notifications */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 relative">
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                  >
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              <div className="flex items-center justify-between border-b px-4 py-3">
                <h3 className="font-semibold">Notifications</h3>
                {unreadCount > 0 && (
                  <Badge variant="secondary">{unreadCount} new</Badge>
                )}
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-sm text-muted-foreground">
                    No new notifications
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="border-b p-4 hover:bg-accent cursor-pointer transition-colors"
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{notification.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(notification.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </PopoverContent>
          </Popover>

          {/* Profile Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-9 gap-2 px-2">
                <Avatar className="h-7 w-7">
                  <AvatarImage src={user?.avatarUrl || undefined} />
                  <AvatarFallback>
                    {user?.fullName?.split(' ').map(n => n[0]).join('') || 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium hidden sm:inline">
                  {user?.fullName}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span>{user?.fullName}</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    {user?.email}
                  </span>
                  <Badge variant="outline" className="mt-1 w-fit">
                    {user?.role}
                  </Badge>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/profile')}>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}