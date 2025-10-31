# Thaiba Garden Media Manager — Remaining TODO List

## 🚨 HIGH PRIORITY (Production Blockers)

### 5. Kanban Drag-and-Drop
**Status**: Not Started  
**Estimated Cost**: ~2000 tokens  
**Estimated Time**: 45 minutes  

**Tasks**:
- [ ] Install `@dnd-kit/core` and `@dnd-kit/sortable`
- [ ] Wrap Kanban board with DndContext
- [ ] Make task cards draggable with useDraggable hook
- [ ] Make columns droppable with useDroppable hook
- [ ] Implement optimistic UI update on drag
- [ ] Send PATCH request to `/api/tasks/:id` on drop
- [ ] Handle 409 conflict (revert + toast)
- [ ] Add role check (Admin/Team only)
- [ ] Add drag indicator cursor styles

**Files to Modify**:
- `src/app/tasks/page.tsx` (Kanban section)
- `package.json` (add @dnd-kit dependencies)

**Acceptance Criteria**:
- Admin and Team can drag tasks between columns
- Guest users see static Kanban (no drag)
- Status updates persist to database
- Conflicts revert with error toast
- Smooth animations during drag

**NPM Command**:
```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

---

### 6. Full Calendar View (Month/Week)
**Status**: Not Started  
**Estimated Cost**: ~2500 tokens  
**Estimated Time**: 60 minutes  

**Tasks**:
- [ ] Install `react-day-picker` or `@fullcalendar/react`
- [ ] Replace list view with calendar grid
- [ ] Render tasks on due dates
- [ ] Render events on start/end date ranges
- [ ] Add month/week toggle
- [ ] Implement tap-to-view drawer
- [ ] Hook drawer to existing task edit modal
- [ ] Add legend for task statuses
- [ ] Ensure role-based data scoping

**Files to Modify**:
- `src/app/calendar/page.tsx`
- `package.json`

**Acceptance Criteria**:
- Calendar shows month and week views
- Tasks appear on correct due dates
- Events span multiple days correctly
- Clicking date/task opens details drawer
- Calendar respects role permissions

**NPM Command**:
```bash
npm install react-day-picker date-fns
# OR
npm install @fullcalendar/react @fullcalendar/daygrid @fullcalendar/timegrid
```

---

## 📊 MEDIUM PRIORITY (Feature Completion)

### 7. Advanced Reports & Charts
**Status**: Partially Implemented (basic stats only)  
**Estimated Cost**: ~1800 tokens  
**Estimated Time**: 50 minutes  

**Tasks**:
- [ ] Replace progress bars with Recharts components
- [ ] Create server endpoints for report data:
  - `/api/reports/tasks-by-status`
  - `/api/reports/completion-rate?range=7|30|90`
  - `/api/reports/overdue-count`
  - `/api/reports/attendance-heatmap?days=30`
- [ ] Add time range filters (7/30/90 days)
- [ ] Create BarChart for tasks by status
- [ ] Create LineChart for completion rate over time
- [ ] Create AreaChart for attendance heatmap
- [ ] Add role-scoped queries (Admin: all, Team: self, Guest: own)

**Files to Modify**:
- `src/app/reports/page.tsx`
- `src/app/api/reports/route.ts` (new)

**Acceptance Criteria**:
- Recharts displays visual analytics
- Time filters update charts dynamically
- Admin sees team-wide data
- Team sees personal data only
- Guest sees own task requests only

---

### 8. Real-time Notifications (Replace Polling)
**Status**: Currently 30s polling  
**Estimated Cost**: ~1500 tokens  
**Estimated Time**: 40 minutes  

**Tasks**:
- [ ] Choose: Supabase Realtime OR custom WebSocket
- [ ] Create notification subscription service
- [ ] Update TopBar to subscribe on mount
- [ ] Remove setInterval polling
- [ ] Handle connection errors gracefully
- [ ] Add reconnection logic
- [ ] Emit server-side on notification insert

**Files to Modify**:
- `src/lib/realtime.ts` (new)
- `src/components/TopBar.tsx`
- `src/app/api/notifications/route.ts`

**Alternative**: If Supabase not available, use Server-Sent Events (SSE)

**Acceptance Criteria**:
- Notifications appear instantly (< 2s)
- No polling intervals
- Connection indicator in UI
- Auto-reconnect on network issues

---

### 9. Push Notification Foundation (Stubs)
**Status**: Not Started  
**Estimated Cost**: ~1200 tokens  
**Estimated Time**: 35 minutes  

**Tasks**:
- [ ] Create `.env.example` with Expo push keys
- [ ] Create `scripts/sendBroadcastExample.ts`
- [ ] Add push token storage to `users` table (optional column)
- [ ] Create server function `sendExpoPush(token, title, message)`
- [ ] Hook into Admin broadcast composer
- [ ] Hook into Guest task notification
- [ ] Log payload instead of sending (stub mode)
- [ ] Provide instructions for Expo setup

**Files to Create**:
- `scripts/sendBroadcastExample.ts`
- `.env.example` (update)

**Files to Modify**:
- `src/app/profile/page.tsx` (broadcast hook)
- `src/app/api/tasks/route.ts` (guest notification hook)

**Acceptance Criteria**:
- Script logs Expo push payload format
- Instructions provided for FCM/APNs setup
- No actual pushes sent (safe for testing)
- Ready for production token swap

**.env.example Addition**:
```env
# Expo Push Notifications (optional)
EXPO_ACCESS_TOKEN=your_expo_token_here
```

---

## 🎨 LOW PRIORITY (Polish & UX)

### 10. Role-Based Welcome Dashboard
**Status**: Home redirects to /tasks  
**Estimated Cost**: ~1000 tokens  
**Estimated Time**: 30 minutes  

**Tasks**:
- [ ] Create actual dashboard at `/`
- [ ] Add role-specific inspiring welcome messages
- [ ] Show quick stats (my tasks, overdue, next event)
- [ ] Add social media links section
- [ ] Design different layouts per role

**Files to Modify**:
- `src/app/page.tsx`

---

### 11. Registration/Signup Page
**Status**: Login only  
**Estimated Cost**: ~1000 tokens  
**Estimated Time**: 30 minutes  

**Tasks**:
- [ ] Create `/register` page
- [ ] Form fields: fullName, email, password, institution selection
- [ ] Default role assignment logic
- [ ] Validation and error handling
- [ ] Auto-login after registration
- [ ] Link from login page

**Files to Create**:
- `src/app/register/page.tsx`

---

### 12. Testing Coverage
**Status**: No tests exist  
**Estimated Cost**: ~4000 tokens  
**Estimated Time**: 2 hours  

**Tasks**:
- [ ] Setup Vitest for unit tests
- [ ] Setup Playwright for e2e tests
- [ ] Write API route tests (5 endpoints)
- [ ] Write component tests (TopBar, FAB, TaskCard)
- [ ] Write e2e tests (login, create task, upload file)
- [ ] Add test scripts to package.json

**Files to Create**:
- `vitest.config.ts`
- `playwright.config.ts`
- `src/tests/api/*.test.ts`
- `src/tests/components/*.test.tsx`
- `e2e/*.spec.ts`

---

### 13. Mobile App (Expo)
**Status**: Web only  
**Estimated Cost**: ~8000 tokens  
**Estimated Time**: 4-5 hours  

**Tasks**:
- [ ] Initialize Expo project
- [ ] Setup Expo Router (file-based routing)
- [ ] Create shared UI package (optional monorepo)
- [ ] Implement authentication with SecureStore
- [ ] Create mobile versions of all screens
- [ ] Setup Expo push notifications
- [ ] Configure APNs and FCM
- [ ] Add app icons and splash screens
- [ ] Build for Android/iOS

**Note**: This is a major undertaking and likely outside scope of current deliverable.

---

### 14. Offline Support & PWA
**Status**: Not Started  
**Estimated Cost**: ~2000 tokens  
**Estimated Time**: 50 minutes  

**Tasks**:
- [ ] Add service worker
- [ ] Configure next.config for PWA
- [ ] Implement offline task drafting
- [ ] Add sync queue for offline actions
- [ ] Cache API responses
- [ ] Add manifest.json
- [ ] Add offline indicator in UI

---

## 📈 SUMMARY

| Priority | Item | Status | Tokens | Time |
|----------|------|--------|--------|------|
| HIGH | Kanban Drag-and-Drop | Not Started | ~2000 | 45m |
| HIGH | Full Calendar View | Not Started | ~2500 | 60m |
| MEDIUM | Advanced Reports | Partial | ~1800 | 50m |
| MEDIUM | Real-time Notifications | Polling | ~1500 | 40m |
| MEDIUM | Push Notification Stubs | Not Started | ~1200 | 35m |
| LOW | Welcome Dashboard | Redirect | ~1000 | 30m |
| LOW | Registration Page | Missing | ~1000 | 30m |
| LOW | Testing Coverage | None | ~4000 | 120m |
| LOW | Mobile App (Expo) | N/A | ~8000 | 240m+ |
| LOW | Offline/PWA | Not Started | ~2000 | 50m |

**Total Remaining Work**:
- **Estimated Tokens**: ~25,000
- **Estimated Time**: ~11 hours
- **Completion**: 56% done (4/9 HIGH+MEDIUM items)

---

## 🎯 RECOMMENDED NEXT ACTIONS

For **Part 3** deliverable, prioritize in this order:

1. ✅ **Kanban Drag-and-Drop** (HIGH, quick win)
2. ✅ **Full Calendar View** (HIGH, user-visible)
3. ✅ **Advanced Reports** (MEDIUM, visual impact)
4. ⚠️ **Real-time Notifications** (MEDIUM, skip if Supabase unavailable)
5. ✅ **Push Stubs** (MEDIUM, prep for mobile)

**Stop condition**: After completing items 1-3 above, the app will have all critical features functional. Items 4-5 are optional enhancements.

---

**Last Updated**: January 2025  
**Part**: 2 of 3  
**Next Deliverable**: Part 3 (Kanban + Calendar + Reports)
