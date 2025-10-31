import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

// Institutions table
export const institutions = sqliteTable('institutions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  createdAt: text('created_at').notNull(),
});

// Users table
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  fullName: text('full_name').notNull(),
  avatarUrl: text('avatar_url'),
  role: text('role').notNull(), // 'admin', 'team', 'guest'
  institutionId: integer('institution_id').notNull().references(() => institutions.id),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Tasks table
export const tasks = sqliteTable('tasks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  description: text('description'),
  status: text('status').notNull(), // 'todo', 'in_progress', 'review', 'done'
  priority: text('priority').notNull(), // 'low', 'medium', 'high', 'urgent'
  assignedToId: integer('assigned_to_id').references(() => users.id),
  createdById: integer('created_by_id').notNull().references(() => users.id),
  institutionId: integer('institution_id').notNull().references(() => institutions.id),
  dueDate: text('due_date'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Events table
export const events = sqliteTable('events', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  description: text('description'),
  startTime: text('start_time').notNull(),
  endTime: text('end_time').notNull(),
  createdById: integer('created_by_id').notNull().references(() => users.id),
  institutionId: integer('institution_id').notNull().references(() => institutions.id),
  createdAt: text('created_at').notNull(),
});

// Notifications table
export const notifications = sqliteTable('notifications', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  type: text('type').notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  read: integer('read', { mode: 'boolean' }).notNull().default(false),
  metadata: text('metadata', { mode: 'json' }),
  createdAt: text('created_at').notNull(),
});

// Attendance table
export const attendance = sqliteTable('attendance', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  checkIn: text('check_in').notNull(),
  checkOut: text('check_out'),
  institutionId: integer('institution_id').notNull().references(() => institutions.id),
  createdAt: text('created_at').notNull(),
});

// Files table
export const files = sqliteTable('files', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  fileUrl: text('file_url').notNull(),
  fileType: text('file_type').notNull(),
  fileSize: integer('file_size').notNull(),
  folder: text('folder'),
  visibility: text('visibility').notNull(), // 'all', 'team', 'guest'
  uploadedById: integer('uploaded_by_id').notNull().references(() => users.id),
  institutionId: integer('institution_id').notNull().references(() => institutions.id),
  createdAt: text('created_at').notNull(),
});