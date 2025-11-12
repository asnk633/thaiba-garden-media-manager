// src/app/api/_lib/auth.ts
// RBAC helpers for API routes

import { NextRequest } from 'next/server';
import { UserRole } from '@/types';

export interface AuthUser {
  id: number;
  email: string;
  fullName: string;
  role: UserRole;
  institutionId: number;
}

/**
 * Extract user from request headers (simplified for demo)
 * In production, validate JWT token or session cookie
 */
export function getUserFromRequest(req: NextRequest): AuthUser | null {
  try {
    const userHeader = req.headers.get('x-user-data');
    if (!userHeader) return null;
    
    const user = JSON.parse(userHeader) as AuthUser;
    return user;
  } catch {
    return null;
  }
}

/**
 * Check if user has required role
 */
export function hasRole(user: AuthUser | null, roles: UserRole | UserRole[]): boolean {
  if (!user) return false;
  const roleArray = Array.isArray(roles) ? roles : [roles];
  return roleArray.includes(user.role);
}

/**
 * Check if user is admin
 */
export function isAdmin(user: AuthUser | null): boolean {
  return hasRole(user, 'admin');
}

/**
 * Check if user can modify resource (owner or admin)
 */
export function canModify(user: AuthUser | null, resourceOwnerId: number): boolean {
  if (!user) return false;
  return user.id === resourceOwnerId || isAdmin(user);
}

/**
 * Validate task status transition based on user role
 */
export function canChangeTaskStatus(
  user: AuthUser | null,
  currentStatus: string,
  newStatus: string
): boolean {
  if (!user) return false;

  // Admin can change any status
  if (isAdmin(user)) return true;

  // Team can move tasks through workflow
  if (user.role === 'team') {
    const validTransitions: Record<string, string[]> = {
      'todo': ['in_progress'],
      'in_progress': ['review', 'todo'],
      'review': ['done', 'in_progress'],
      'done': [], // Can't change from done without admin
    };
    return validTransitions[currentStatus]?.includes(newStatus) ?? false;
  }

  // Guest cannot change status
  return false;
}
