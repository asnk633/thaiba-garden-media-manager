'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Event, Task, Attendance } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar as CalendarIcon, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function CalendarPage() {
  const { user, hasRole } = useAuth();
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [todayAttendance, setTodayAttendance] = useState<Attendance | null>(null);
  const [isCheckingIn, setIsCheckingIn] = useState(false);

  const isTeamMember = hasRole('team');
  const isAdmin = hasRole('admin');

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
      await Promise.all([
        fetchEvents(),
        fetchTasks(),
        isTeamMember || isAdmin ? fetchAttendance() : Promise.resolve(),
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      const response = await fetch(`/api/events?institutionId=${user!.institutionId}&limit=50`);
      if (response.ok) {
        const data = await response.json();
        setEvents(data);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const fetchTasks = async () => {
    try {
      const response = await fetch(`/api/tasks?institutionId=${user!.institutionId}&limit=50`);
      if (response.ok) {
        const data = await response.json();
        setTasks(data.filter((t: Task) => t.dueDate));
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const fetchAttendance = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(
        isAdmin 
          ? `/api/attendance?institutionId=${user!.institutionId}&date=${today}`
          : `/api/attendance?userId=${user!.id}&date=${today}`
      );
      if (response.ok) {
        const data = await response.json();
        setAttendance(data);
        if (!isAdmin) {
          setTodayAttendance(data.find((a: Attendance) => !a.checkOut) || null);
        }
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  };

  const handleCheckIn = async () => {
    setIsCheckingIn(true);
    try {
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user!.id,
          institutionId: user!.institutionId,
        }),
      });

      if (response.ok) {
        const newAttendance = await response.json();
        setTodayAttendance(newAttendance);
        toast.success('Checked in successfully');
        fetchAttendance();
      } else {
        toast.error('Failed to check in');
      }
    } catch (error) {
      console.error('Error checking in:', error);
      toast.error('Error checking in');
    } finally {
      setIsCheckingIn(false);
    }
  };

  const handleCheckOut = async () => {
    if (!todayAttendance) return;

    setIsCheckingIn(true);
    try {
      const response = await fetch(`/api/attendance?id=${todayAttendance.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checkOut: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        setTodayAttendance(null);
        toast.success('Checked out successfully');
        fetchAttendance();
      } else {
        toast.error('Failed to check out');
      }
    } catch (error) {
      console.error('Error checking out:', error);
      toast.error('Error checking out');
    } finally {
      setIsCheckingIn(false);
    }
  };

  const getUpcomingItems = () => {
    const now = new Date();
    const items: Array<{ type: 'event' | 'task'; data: Event | Task; date: Date }> = [];

    events.forEach(event => {
      const startTime = new Date(event.startTime);
      if (startTime >= now) {
        items.push({ type: 'event', data: event, date: startTime });
      }
    });

    tasks.forEach(task => {
      if (task.dueDate) {
        const dueDate = new Date(task.dueDate);
        if (dueDate >= now) {
          items.push({ type: 'task', data: task, date: dueDate });
        }
      }
    });

    return items.sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, 10);
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

  const upcomingItems = getUpcomingItems();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Calendar</h1>
      </div>

      {/* Attendance Section for Team Members */}
      {isTeamMember && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Attendance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                {todayAttendance ? (
                  <>
                    <p className="text-sm text-muted-foreground">
                      Checked in at {new Date(todayAttendance.checkIn).toLocaleTimeString()}
                    </p>
                    <Badge className="mt-2 bg-green-500 text-white">
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      Checked In
                    </Badge>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    You haven't checked in today
                  </p>
                )}
              </div>
              <Button
                onClick={todayAttendance ? handleCheckOut : handleCheckIn}
                disabled={isCheckingIn}
                variant={todayAttendance ? 'outline' : 'default'}
              >
                {todayAttendance ? 'Check Out' : 'Check In'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Attendance Summary for Admins */}
      {isAdmin && attendance.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Today's Attendance Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {attendance.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-2 w-2 rounded-full ${
                        record.checkOut ? 'bg-gray-400' : 'bg-green-500'
                      }`}
                    />
                    <div>
                      <p className="text-sm font-medium">User ID: {record.userId}</p>
                      <p className="text-xs text-muted-foreground">
                        In: {new Date(record.checkIn).toLocaleTimeString()}
                        {record.checkOut && ` • Out: ${new Date(record.checkOut).toLocaleTimeString()}`}
                      </p>
                    </div>
                  </div>
                  <Badge variant={record.checkOut ? 'secondary' : 'default'}>
                    {record.checkOut ? 'Completed' : 'Active'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Events & Tasks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Upcoming
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CalendarIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No upcoming events or tasks</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingItems.map((item, index) => (
                <div
                  key={`${item.type}-${(item.data as any).id}-${index}`}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => {
                    if (item.type === 'task') {
                      router.push(`/tasks/${(item.data as Task).id}`);
                    }
                  }}
                >
                  <div className="flex-shrink-0 mt-1">
                    {item.type === 'event' ? (
                      <CalendarIcon className="h-4 w-4 text-primary" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-orange-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{item.data.title}</p>
                      <Badge variant="outline" className="flex-shrink-0">
                        {item.type}
                      </Badge>
                    </div>
                    {item.data.description && (
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {item.data.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {item.type === 'event'
                        ? `${new Date((item.data as Event).startTime).toLocaleString()} - ${new Date((item.data as Event).endTime).toLocaleTimeString()}`
                        : `Due: ${item.date.toLocaleDateString()}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <CalendarIcon className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{events.length}</p>
              <p className="text-sm text-muted-foreground">Total Events</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-orange-500" />
              <p className="text-2xl font-bold">{tasks.length}</p>
              <p className="text-sm text-muted-foreground">Tasks with Due Dates</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Clock className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <p className="text-2xl font-bold">{attendance.length}</p>
              <p className="text-sm text-muted-foreground">
                {isAdmin ? "Today's Attendance" : 'Your Attendance Records'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
