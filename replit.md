# ZDSPGC Student Portal

## Overview
A complete Expo React Native mobile app for the Zamboanga Del Sur Provincial Government College (ZDSPGC). Features role-based authentication with separate portals for students and administrators.

## Architecture

### Stack
- **Frontend**: Expo React Native with expo-router (file-based routing)
- **Backend**: Express + TypeScript REST API on port 5000
- **State**: React Query for server state, AsyncStorage for persistence
- **Fonts**: Inter (400/500/600/700) via @expo-google-fonts/inter
- **Theme**: Deep royal blue (#1A3A6B) and gold (#D4A843)

### Key Files
- `app/_layout.tsx` — Root layout with providers (QueryClient, Auth, GestureHandler)
- `app/index.tsx` — Login screen (role-based redirect after login)
- `app/(tabs)/` — Student portal tabs (Home, Grades, Schedule, Profile)
- `app/(admin)/` — Admin portal tabs (Dashboard, Students, Grades, Schedule, Announcements)
- `app/announcements.tsx` — Student announcements stack screen
- `lib/auth-context.tsx` — Role-based auth (student + admin) via AsyncStorage
- `lib/api.ts` — API client + typed functions for all endpoints
- `lib/mock-data.ts` — Static data for student-side views
- `constants/colors.ts` — ZDSPGC brand colors
- `server/routes.ts` — All REST API endpoints with in-memory store

## Auth System
- **Role-based**: After login, users are redirected to student or admin portal
- **Storage**: Token stored in AsyncStorage (`@zdspgc_token`), user in `@zdspgc_user`
- **Backend**: `POST /api/auth/login` returns `{ token, role, user }`
- **Admin routes**: Protected with Bearer token middleware

## Demo Credentials
- **Student**: ID `2024-0001` / password `student123`
- **Student**: ID `2024-0002` / password `student123`
- **Admin**: username `admin` / password `admin123`

## Student Portal Features
- Dashboard with student info card, quick actions, semester stats
- Grades screen with GPA summary and color-coded grade cards
- Schedule screen with day-selector and time-column cards
- Profile screen with personal info and change password modal
- Announcements screen (stack route)

## Admin Portal Features
- Dashboard with stats cards (students, announcements, courses, schedules)
- Manage Students: CRUD with search by ID/name/course, form validation
- Manage Grades: Filter by student, CRUD grade records
- Manage Schedule: Filter by day, CRUD schedule items
- Manage Announcements: CRUD with important flag, category, and date

## Backend API Endpoints
- `POST /api/auth/login` — Unified login (student + admin)
- `POST /api/auth/logout` — Invalidate token
- `GET /api/admin/stats` — Dashboard stats (auth required)
- `GET/POST/PUT/DELETE /api/admin/students` — Student management
- `GET/POST/PUT/DELETE /api/admin/grades` — Grade management
- `GET/POST/PUT/DELETE /api/admin/schedule` — Schedule management
- `GET/POST/PUT/DELETE /api/admin/announcements` — Announcement management

## Design Notes
- Never use emojis; use Ionicons from @expo/vector-icons
- Web insets: 67px top, 34px bottom (applied via Platform.OS checks)
- Tab bar: paddingBottom 100 for FlatList content
- NativeTabs with liquid glass used for student tabs on iOS 26+
- Admin tabs use dark navy tab bar matching the brand

## Workflows
- **Start Backend**: `npm run server:dev` (port 5000)
- **Start Frontend**: `npm run expo:dev` (port 8081)
