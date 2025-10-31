'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { Task, User } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, Trash2, Save } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function TaskDetailPage() {
  const { user, hasRole } = useAuth();
  const router = useRouter();
  const params = useParams();
  const taskId = params.id as string;
  
  const [task, setTask] = useState<Task | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    assignedToId: '',
    dueDate: '',
  });

  const canEdit = hasRole(['admin', 'team']) || (task && user?.id === task.createdById);
  const canDelete = hasRole(['admin']) || (task && user?.id === task.createdById);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchTask();
    fetchUsers();
  }, [user, router, taskId]);

  const fetchTask = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/tasks?id=${taskId}`);
      if (response.ok) {
        const data = await response.json();
        setTask(data);
        setFormData({
          title: data.title,
          description: data.description || '',
          status: data.status,
          priority: data.priority,
          assignedToId: data.assignedToId?.toString() || '',
          dueDate: data.dueDate ? data.dueDate.split('T')[0] : '',
        });
      } else {
        toast.error('Task not found');
        router.push('/tasks');
      }
    } catch (error) {
      console.error('Error fetching task:', error);
      toast.error('Error loading task');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch(`/api/users?institutionId=${user!.institutionId}&limit=100`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data.filter((u: User) => u.role !== 'guest'));
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  // Auto-save with debounce
  useEffect(() => {
    if (!task || !canEdit) return;
    
    const debounce = setTimeout(() => {
      const hasChanges = 
        formData.title !== task.title ||
        formData.description !== (task.description || '') ||
        formData.status !== task.status ||
        formData.priority !== task.priority ||
        formData.assignedToId !== (task.assignedToId?.toString() || '') ||
        formData.dueDate !== (task.dueDate ? task.dueDate.split('T')[0] : '');

      if (hasChanges && formData.title) {
        handleAutoSave();
      }
    }, 1000);

    return () => clearTimeout(debounce);
  }, [formData]);

  const handleAutoSave = async () => {
    if (!canEdit) return;

    try {
      const response = await fetch(`/api/tasks?id=${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          assignedToId: formData.assignedToId ? parseInt(formData.assignedToId) : null,
          dueDate: formData.dueDate || null,
        }),
      });

      if (response.ok) {
        const updatedTask = await response.json();
        setTask(updatedTask);
      }
    } catch (error) {
      console.error('Auto-save error:', error);
    }
  };

  const handleSave = async () => {
    if (!canEdit) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/tasks?id=${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          assignedToId: formData.assignedToId ? parseInt(formData.assignedToId) : null,
          dueDate: formData.dueDate || null,
        }),
      });

      if (response.ok) {
        const updatedTask = await response.json();
        setTask(updatedTask);
        toast.success('Task updated successfully');
      } else {
        toast.error('Failed to update task');
      }
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Error updating task');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!canDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/tasks?id=${taskId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Task deleted successfully');
        router.push('/tasks');
      } else {
        toast.error('Failed to delete task');
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Error deleting task');
    } finally {
      setIsDeleting(false);
    }
  };

  const getUserName = (userId: number | null) => {
    if (!userId) return 'Unassigned';
    const foundUser = users.find(u => u.id === userId);
    return foundUser?.fullName || 'Unknown';
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!task) {
    return null;
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Task Details</h1>
        </div>
        {canDelete && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="icon">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Task</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this task? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Delete'
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Edit Task</CardTitle>
            <div className="flex gap-2">
              <Badge variant="outline">ID: {task.id}</Badge>
              {!canEdit && <Badge variant="secondary">Read Only</Badge>}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter task title"
                required
                disabled={!canEdit}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter task description"
                rows={4}
                disabled={!canEdit}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                  disabled={!canEdit}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="review">Review</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value })}
                  disabled={!canEdit}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="assignedTo">Assign To</Label>
                <Select
                  value={formData.assignedToId}
                  onValueChange={(value) => setFormData({ ...formData, assignedToId: value })}
                  disabled={!canEdit}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Unassigned</SelectItem>
                    {users.map(user => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  disabled={!canEdit}
                />
              </div>
            </div>

            {canEdit && (
              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={isSaving} className="flex-1">
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Back
                </Button>
              </div>
            )}

            <div className="pt-4 border-t space-y-2 text-sm text-muted-foreground">
              <div className="flex justify-between">
                <span>Created by:</span>
                <span>{getUserName(task.createdById)}</span>
              </div>
              <div className="flex justify-between">
                <span>Created at:</span>
                <span>{new Date(task.createdAt).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Last updated:</span>
                <span>{new Date(task.updatedAt).toLocaleString()}</span>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
