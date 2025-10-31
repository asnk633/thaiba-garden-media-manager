'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Task, User } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Grid3x3, LayoutList, Calendar as CalendarIcon, Filter, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function TasksPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<'list' | 'kanban' | 'calendar'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchTasks();
    fetchUsers();
  }, [user, router]);

  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        institutionId: user!.institutionId.toString(),
        limit: '100',
      });

      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (priorityFilter !== 'all') params.append('priority', priorityFilter);
      if (searchQuery) params.append('search', searchQuery);

      const response = await fetch(`/api/tasks?${params}`);
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      } else {
        toast.error('Failed to fetch tasks');
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Error loading tasks');
    } finally {
      setIsLoading(false);
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

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (user) fetchTasks();
    }, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, statusFilter, priorityFilter]);

  const getUserName = (userId: number | null) => {
    if (!userId) return 'Unassigned';
    const foundUser = users.find(u => u.id === userId);
    return foundUser?.fullName || 'Unknown';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-blue-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done': return 'bg-green-500 text-white';
      case 'in_progress': return 'bg-purple-500 text-white';
      case 'review': return 'bg-indigo-500 text-white';
      case 'todo': return 'bg-gray-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const TaskCard = ({ task }: { task: Task }) => (
    <Card 
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => router.push(`/tasks/${task.id}`)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base line-clamp-2">{task.title}</CardTitle>
          <Badge className={getPriorityColor(task.priority)}>
            {task.priority}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {task.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {task.description}
          </p>
        )}
        <div className="flex items-center justify-between text-xs">
          <Badge variant="outline" className={getStatusColor(task.status)}>
            {task.status.replace('_', ' ')}
          </Badge>
          <span className="text-muted-foreground">
            {getUserName(task.assignedToId)}
          </span>
        </div>
        {task.dueDate && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <CalendarIcon className="h-3 w-3" />
            {new Date(task.dueDate).toLocaleDateString()}
          </div>
        )}
      </CardContent>
    </Card>
  );

  const KanbanColumn = ({ status, title }: { status: string; title: string }) => {
    const columnTasks = tasks.filter(t => t.status === status);
    return (
      <div className="flex-1 min-w-[280px]">
        <div className="bg-muted/50 rounded-lg p-3 mb-3">
          <h3 className="font-semibold flex items-center justify-between">
            {title}
            <Badge variant="secondary">{columnTasks.length}</Badge>
          </h3>
        </div>
        <div className="space-y-3">
          {columnTasks.map(task => (
            <TaskCard key={task.id} task={task} />
          ))}
          {columnTasks.length === 0 && (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No tasks
            </div>
          )}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold">Tasks</h1>
        <div className="flex gap-2">
          <Button
            variant={view === 'list' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setView('list')}
          >
            <LayoutList className="h-4 w-4" />
          </Button>
          <Button
            variant={view === 'kanban' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setView('kanban')}
          >
            <Grid3x3 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="todo">To Do</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="review">Review</SelectItem>
            <SelectItem value="done">Done</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      {tasks.length === 0 ? (
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center text-center space-y-3">
            <AlertCircle className="h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-semibold">No tasks found</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              {searchQuery || statusFilter !== 'all' || priorityFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Get started by creating your first task'}
            </p>
            <Button onClick={() => router.push('/tasks/new')}>
              Create Task
            </Button>
          </div>
        </Card>
      ) : view === 'list' ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tasks.map(task => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          <KanbanColumn status="todo" title="To Do" />
          <KanbanColumn status="in_progress" title="In Progress" />
          <KanbanColumn status="review" title="Review" />
          <KanbanColumn status="done" title="Done" />
        </div>
      )}
    </div>
  );
}
