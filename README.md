# 🌿 Thaiba Garden Media Manager

A comprehensive mobile-first media management system built with Next.js 15, featuring role-based access control, task management, calendar, attendance tracking, file management, and reporting.

## ✨ Features

### 🔐 Authentication & Role-Based Access Control (RBAC)
- **Three User Roles:**
  - **Admin**: Full system access, user management, broadcast notifications
  - **Team**: Task management, event creation, attendance tracking
  - **Guest**: Limited access, task creation requests

### 📋 Task Management
- **Multiple Views**: List, Kanban board, and Calendar views
- **Smart Features**:
  - Role-based create/edit permissions
  - Debounced auto-save (1-second delay)
  - Status tracking (To Do, In Progress, Review, Done)
  - Priority levels (Low, Medium, High, Urgent)
  - Task assignment and due dates
  - Search and advanced filtering
- **Guest Workflow**: Guest-created tasks automatically notify admins

### 📅 Calendar & Events
- **Event Management**: Create and view upcoming events
- **Task Integration**: Display tasks with due dates
- **Attendance System**:
  - Team members: Check-in/Check-out functionality
  - Admins: View real-time attendance summary
  - Historical attendance tracking

### 📁 File Management
- **Visibility Controls**: 
  - `ALL`: Public access for everyone
  - `TEAM`: Team members and admins only
  - `GUEST`: Guest users can view
- **Features**:
  - Folder organization
  - File type and size tracking
  - Search and filter capabilities
  - Download functionality

### 📊 Reports & Analytics
- **Role-Scoped Reports**:
  - **Admin**: Full system analytics and user metrics
  - **Team**: Personal task statistics
  - **Guest**: Own task request history
- **Metrics**:
  - Total, completed, and overdue tasks
  - Status and priority breakdowns
  - Top contributors (Admin only)

### 🔔 Notifications
- **Real-time Notifications**: Bell icon with unread count
- **Notification Types**:
  - Task assignments
  - Guest task creation alerts (for admins)
  - Broadcast messages (admin-only)
  - Task due date reminders
- **Mark as Read**: Click to dismiss notifications

### 🎨 UI/UX Features
- **Mobile-First Design**: Optimized for Android/iOS with responsive web support
- **Dark Mode**: System-aware theme with manual toggle
- **Bottom Navigation**: Quick access to all modules (mobile)
- **Floating Action Button (FAB)**: Quick task/event creation
- **Health Indicator**: Real-time API status monitoring
- **Gradient Backgrounds**: Beautiful dark gradient theme
- **Toast Notifications**: User-friendly feedback
- **Empty States**: Helpful messages when no data

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ or Bun
- Database is pre-configured with Turso (SQLite)

### Installation

1. **Clone and Install**:
```bash
npm install
# or
bun install
```

2. **Environment Setup**:
The `.env` file is already configured with database credentials.

3. **Run Development Server**:
```bash
npm run dev
# or
bun dev
```

4. **Open**: Navigate to [http://localhost:3000](http://localhost:3000)

## 👥 Demo Accounts

The application comes pre-seeded with demo accounts:

### Admin Users
- **Email**: `admin@thaiba.com`
- **Email**: `manager@thaiba.com`
- **Password**: `demo`
- **Permissions**: Full system access, broadcast notifications, all reports

### Team Members
- **Email**: `john@thaiba.com` (John Doe)
- **Email**: `jane@thaiba.com` (Jane Smith)
- **Email**: `mike@thaiba.com` (Mike Johnson)
- **Password**: `demo`
- **Permissions**: Task management, events, attendance, team files

### Guest Users
- **Email**: `guest1@thaiba.com` (Guest One)
- **Email**: `guest2@thaiba.com` (Guest Two)
- **Password**: `demo`
- **Permissions**: Create task requests, view public files

## 📱 Application Structure

```
src/
├── app/
│   ├── login/              # Authentication page
│   ├── tasks/              # Task management module
│   │   ├── [id]/          # Task detail/edit page
│   │   └── new/           # Create new task
│   ├── calendar/           # Calendar & attendance
│   │   └── new/           # Create new event
│   ├── files/              # File management
│   ├── reports/            # Analytics dashboard
│   └── profile/            # User profile & broadcast
├── components/
│   ├── ui/                 # Shadcn UI components
│   ├── TopBar.tsx         # Navigation header
│   ├── BottomNav.tsx      # Mobile navigation
│   ├── FAB.tsx            # Floating action button
│   └── AppLayout.tsx      # Main layout wrapper
├── contexts/
│   ├── AuthContext.tsx    # Authentication state
│   └── ThemeContext.tsx   # Theme management
├── db/
│   ├── schema.ts          # Database schema
│   └── seeds/             # Demo data
└── types/
    └── index.ts           # TypeScript types
```

## 🗄️ Database Schema

### Tables
- **institutions**: Organization data
- **users**: User accounts with roles
- **tasks**: Task management with assignments
- **events**: Calendar events
- **notifications**: User notifications
- **attendance**: Check-in/check-out records
- **files**: File metadata with visibility controls

### API Endpoints
All CRUD operations available at:
- `/api/institutions`
- `/api/users`
- `/api/tasks`
- `/api/events`
- `/api/notifications`
- `/api/attendance`
- `/api/files`

## 🎯 Key Features by Role

### Admin Capabilities
- ✅ Create, edit, delete all tasks
- ✅ Manage all events
- ✅ Upload and manage files
- ✅ View complete attendance records
- ✅ Access all analytics and reports
- ✅ Send broadcast notifications to all users
- ✅ Full system monitoring

### Team Member Capabilities
- ✅ Create and edit own tasks
- ✅ Create events
- ✅ Check-in/check-out attendance
- ✅ View team and public files
- ✅ Access personal reports
- ✅ Receive notifications

### Guest Capabilities
- ✅ Create task requests (notifies admins)
- ✅ View own task requests
- ✅ View public and guest-accessible files
- ✅ Limited calendar access
- ✅ View own reports

## 🛠️ Technology Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: Turso (SQLite)
- **ORM**: Drizzle ORM
- **UI Components**: Shadcn/UI + Radix UI
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **Notifications**: Sonner (Toast)
- **State Management**: React Context API

## 🎨 Design System

### Colors
- **Primary**: Green/Emerald theme (Thaiba Garden branding)
- **Status Colors**:
  - Done: Green
  - In Progress: Blue
  - Review: Purple
  - To Do: Gray
- **Priority Colors**:
  - Urgent: Red
  - High: Orange
  - Medium: Yellow
  - Low: Blue

### Layout
- **Mobile-First**: Bottom navigation + FAB
- **Desktop**: Top navigation bar
- **Responsive Breakpoints**: sm, md, lg, xl
- **Dark Mode**: Full system support with gradient backgrounds

## 📊 Demo Data

The application includes 80+ pre-seeded records:
- 1 Institution (Thaiba Garden Media)
- 7 Users (2 admins, 3 team, 2 guests)
- 15 Tasks with various statuses and priorities
- 8 Upcoming events
- 10 Attendance records
- 8 Files with different visibility levels
- 5 Notifications

## 📝 Notes

- **Auto-save**: Task edits auto-save after 1 second of inactivity
- **Real-time Updates**: Notifications poll every 30 seconds
- **Mobile Optimized**: Touch-friendly UI with bottom navigation
- **Accessibility**: Proper ARIA labels and keyboard navigation
- **Error Handling**: User-friendly error messages and validation

## 🚧 Future Enhancements

- Avatar upload functionality
- File upload interface for admins
- Drag-and-drop task reordering in Kanban
- Real-time collaboration with Supabase Realtime
- Push notifications via Expo (mobile app)
- Advanced filtering and saved views
- Bulk operations on tasks
- Export reports to PDF/CSV

## 📄 License

MIT License - Feel free to use this project for your own purposes.

---

**Built with ❤️ using Next.js 15 and Shadcn/UI**