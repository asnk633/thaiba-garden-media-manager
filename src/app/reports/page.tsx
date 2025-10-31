'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Task, User } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart3, TrendingUp, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function ReportsPage() {
  const { user, hasRole } = useAuth();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isAdmin = hasRole('admin');
  const isTeam = hasRole('team');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchData();
  }, [user, router]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      await Promise.all([fetchTasks(), fetchUsers()]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTasks = async () => {
    try {
      const params = new URLSearchParams({
        institutionId: user!.institutionId.toString(),
        limit: '1000',
      });

      // Role-based filtering
      if (isTeam && !isAdmin) {
        params.append('assignedToId', user!.id.toString());
      } else if (!isAdmin && !isTeam) {
        // Guest sees only their created tasks
        params.append('createdById', user!.id.toString());
      }

      const response = await fetch(`/api/tasks?${params}`);
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Error loading reports');
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch(`/api/users?institutionId=${user!.institutionId}&limit=100`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const getStats = () => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'done').length;
    const inProgress = tasks.filter(t => t.status === 'in_progress').length;
    const overdue = tasks.filter(t => {
      if (!t.dueDate) return false;
      return new Date(t.dueDate) < new Date() && t.status !== 'done';
    }).length;
    const urgent = tasks.filter(t => t.priority === 'urgent').length;

    return { total, completed, inProgress, overdue, urgent };
  };

  const getTasksByStatus = () => {
    return {
      todo: tasks.filter(t => t.status === 'todo').length,
      in_progress: tasks.filter(t => t.status === 'in_progress').length,
      review: tasks.filter(t => t.status === 'review').length,
      done: tasks.filter(t => t.status === 'done').length,
    };
  };

  const getTasksByPriority = () => {
    return {
      low: tasks.filter(t => t.priority === 'low').length,
      medium: tasks.filter(t => t.priority === 'medium').length,
      high: tasks.filter(t => t.priority === 'high').length,
      urgent: tasks.filter(t => t.priority === 'urgent').length,
    };
  };

  const getUserTaskCounts = () => {
    if (!isAdmin) return [];
    
    const counts = users.map(u => ({
      user: u,
      assigned: tasks.filter(t => t.assignedToId === u.id).length,
      completed: tasks.filter(t => t.assignedToId === u.id && t.status === 'done').length,
    }));

    return counts.sort((a, b) => b.assigned - a.assigned).slice(0, 5);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  const stats = getStats();
  const statusCounts = getTasksByStatus();
  const priorityCounts = getTasksByPriority();
  const userCounts = getUserTaskCounts();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Reports</h1>
        <Badge variant="outline">
          {isAdmin ? 'Full Access' : isTeam ? 'Your Tasks' : 'Your Requests'}
        </Badge>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <BarChart3 className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total Tasks</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <p className="text-2xl font-bold">{stats.completed}</p>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Clock className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <p className="text-2xl font-bold">{stats.inProgress}</p>
              <p className="text-sm text-muted-foreground">In Progress</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-orange-500" />
              <p className="text-2xl font-bold">{stats.overdue}</p>
              <p className="text-sm text-muted-foreground">Overdue</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 text-red-500" />
              <p className="text-2xl font-bold">{stats.urgent}</p>
              <p className="text-sm text-muted-foreground">Urgent</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Tasks by Status */}
        <Card>
          <CardHeader>
            <CardTitle>Tasks by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(statusCounts).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`h-3 w-3 rounded-full ${
                      status === 'done' ? 'bg-green-500' :
                      status === 'in_progress' ? 'bg-blue-500' :
                      status === 'review' ? 'bg-purple-500' :
                      'bg-gray-500'
                    }`} />
                    <span className="text-sm capitalize">{status.replace('_', ' ')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{count}</span>
                    <span className="text-xs text-muted-foreground">
                      ({stats.total > 0 ? Math.round((count / stats.total) * 100) : 0}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tasks by Priority */}
        <Card>
          <CardHeader>
            <CardTitle>Tasks by Priority</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(priorityCounts).map(([priority, count]) => (
                <div key={priority} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`h-3 w-3 rounded-full ${
                      priority === 'urgent' ? 'bg-red-500' :
                      priority === 'high' ? 'bg-orange-500' :
                      priority === 'medium' ? 'bg-yellow-500' :
                      'bg-blue-500'
                    }`} />
                    <span className="text-sm capitalize">{priority}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{count}</span>
                    <span className="text-xs text-muted-foreground">
                      ({stats.total > 0 ? Math.round((count / stats.total) * 100) : 0}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Contributors - Admin Only */}
      {isAdmin && userCounts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Contributors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {userCounts.map(({ user: u, assigned, completed }) => (
                <div key={u.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium">{u.fullName}</p>
                    <p className="text-xs text-muted-foreground">{u.role}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{assigned} assigned</p>
                    <p className="text-xs text-muted-foreground">{completed} completed</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
