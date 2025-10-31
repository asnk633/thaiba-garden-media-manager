'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { User, Mail, Shield, Building, Calendar, Bell, Send, Loader2, Upload } from 'lucide-react';
import { toast } from 'sonner';

export default function ProfilePage() {
  const { user, hasRole, logout } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState({ title: '', message: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', user!.id.toString());

      const response = await fetch('/api/upload/avatar', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('Avatar uploaded successfully');
        
        // Update local storage
        const updatedUser = { ...user!, avatarUrl: data.avatarUrl };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        // Reload page to show new avatar
        window.location.reload();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to upload avatar');
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Error uploading avatar');
    } finally {
      setIsUploading(false);
    }
  };

  const handleBroadcast = async () => {
    if (!broadcastMessage.title || !broadcastMessage.message) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      // Fetch all users
      const response = await fetch(`/api/users?institutionId=${user!.institutionId}&limit=100`);
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const users = await response.json();

      // Send notification to all users
      const notificationPromises = users.map((u: any) =>
        fetch('/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: u.id,
            type: 'broadcast',
            title: broadcastMessage.title,
            message: broadcastMessage.message,
            metadata: { broadcastBy: user!.id },
          }),
        })
      );

      await Promise.all(notificationPromises);
      toast.success('Broadcast sent to all users');
      setBroadcastMessage({ title: '', message: '' });
    } catch (error) {
      console.error('Error sending broadcast:', error);
      toast.error('Failed to send broadcast');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-500 text-white';
      case 'team': return 'bg-blue-500 text-white';
      case 'guest': return 'bg-gray-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold">Profile</h1>

      {/* Profile Info */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={user.avatarUrl || undefined} />
                <AvatarFallback className="text-2xl">
                  {user.fullName.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <Button
                size="icon"
                variant="secondary"
                className="absolute bottom-0 right-0 h-8 w-8 rounded-full"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
            </div>

            <div className="flex-1 text-center sm:text-left space-y-2">
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <h2 className="text-2xl font-bold">{user.fullName}</h2>
                <Badge className={getRoleBadgeColor(user.role)}>
                  {user.role}
                </Badge>
              </div>

              <div className="space-y-1 text-sm text-muted-foreground">
                <div className="flex items-center gap-2 justify-center sm:justify-start">
                  <Mail className="h-4 w-4" />
                  {user.email}
                </div>
                <div className="flex items-center gap-2 justify-center sm:justify-start">
                  <Shield className="h-4 w-4" />
                  User ID: {user.id}
                </div>
                <div className="flex items-center gap-2 justify-center sm:justify-start">
                  <Building className="h-4 w-4" />
                  Institution ID: {user.institutionId}
                </div>
                <div className="flex items-center gap-2 justify-center sm:justify-start">
                  <Calendar className="h-4 w-4" />
                  Joined: {new Date(user.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input value={user.fullName} disabled />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={user.email} disabled />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Avatar</Label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {isUploading ? 'Uploading...' : 'Upload New Avatar'}
                </Button>
                <p className="text-xs text-muted-foreground">
                  Max 5MB, images only
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Broadcast Notifications - Admin Only */}
      {hasRole('admin') && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Broadcast Notification
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="broadcast-title">Title</Label>
                <Input
                  id="broadcast-title"
                  value={broadcastMessage.title}
                  onChange={(e) => setBroadcastMessage({ ...broadcastMessage, title: e.target.value })}
                  placeholder="Enter notification title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="broadcast-message">Message</Label>
                <Textarea
                  id="broadcast-message"
                  value={broadcastMessage.message}
                  onChange={(e) => setBroadcastMessage({ ...broadcastMessage, message: e.target.value })}
                  placeholder="Enter your message to all users"
                  rows={4}
                />
              </div>

              <Button 
                onClick={handleBroadcast}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Broadcast to All Users
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Role Permissions */}
      <Card>
        <CardHeader>
          <CardTitle>Role Permissions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {user.role === 'admin' && (
              <>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-sm">Full system access</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-sm">Create, edit, and delete all tasks</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-sm">Create and manage events</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-sm">Upload and manage files</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-sm">View all reports and analytics</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-sm">Send broadcast notifications</span>
                </div>
              </>
            )}

            {user.role === 'team' && (
              <>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                  <span className="text-sm">Create and edit tasks</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                  <span className="text-sm">Create events</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                  <span className="text-sm">View team and public files</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                  <span className="text-sm">Attendance check-in/check-out</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                  <span className="text-sm">View personal reports</span>
                </div>
              </>
            )}

            {user.role === 'guest' && (
              <>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-gray-500" />
                  <span className="text-sm">Create task requests (triggers admin notification)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-gray-500" />
                  <span className="text-sm">View public and guest-accessible files</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-gray-500" />
                  <span className="text-sm">View own task requests</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-gray-500" />
                  <span className="text-sm">Limited calendar access</span>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardContent className="pt-6">
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => {
              logout();
              router.push('/login');
            }}
          >
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}