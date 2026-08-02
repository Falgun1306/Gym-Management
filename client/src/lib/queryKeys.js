/**
 * Centralized Query Key Factory
 *
 * Provides structured, hierarchical query keys for TanStack React Query.
 * Each domain has a root key and builder functions for specific queries.
 * This enables precise cache invalidation (e.g., invalidate all members,
 * or just a single member by ID).
 *
 * Pattern:
 *   queryKeys.members.all          → ['members']
 *   queryKeys.members.list(params) → ['members', 'list', params]
 *   queryKeys.members.detail(id)   → ['members', 'detail', id]
 */
export const queryKeys = {
  // ── Auth & User ──
  auth: {
    all: ['auth'],
    me: () => ['auth', 'me'],
  },

  // ── Dashboard ──
  dashboard: {
    all: ['dashboard'],
    admin: () => ['dashboard', 'admin'],
    trainer: () => ['dashboard', 'trainer'],
    member: () => ['dashboard', 'member'],
  },

  // ── Members ──
  members: {
    all: ['members'],
    list: (params) => ['members', 'list', params],
    detail: (id) => ['members', 'detail', id],
    attendance: (id, params) => ['members', id, 'attendance', params],
    payments: (id, params) => ['members', id, 'payments', params],
    subscriptions: (id) => ['members', id, 'subscriptions'],
    workoutPlans: (id) => ['members', id, 'workout-plans'],
    dietPlans: (id) => ['members', id, 'diet-plans'],
    progress: (id) => ['members', id, 'progress'],
    notifications: (params) => ['members', 'notifications', params],
    applications: () => ['members', 'applications'],
  },

  // ── Trainers ──
  trainers: {
    all: ['trainers'],
    list: (params) => ['trainers', 'list', params],
    detail: (id) => ['trainers', 'detail', id],
    members: (params) => ['trainers', 'members', params],
    memberDetail: (memberId) => ['trainers', 'members', memberId],
    schedule: () => ['trainers', 'schedule'],
    classBookings: (params) => ['trainers', 'class-bookings', params],
  },

  // ── Trainer Applications ──
  trainerApplications: {
    all: ['trainer-applications'],
    list: (params) => ['trainer-applications', 'list', params],
    detail: (id) => ['trainer-applications', 'detail', id],
  },

  // ── Membership Plans ──
  membershipPlans: {
    all: ['membership-plans'],
    list: (params) => ['membership-plans', 'list', params],
    detail: (id) => ['membership-plans', 'detail', id],
  },

  // ── Memberships ──
  memberships: {
    all: ['memberships'],
    list: (params) => ['memberships', 'list', params],
    detail: (id) => ['memberships', 'detail', id],
  },

  // ── Attendance ──
  attendance: {
    all: ['attendance'],
    list: (params) => ['attendance', 'list', params],
    myAttendance: (params) => ['attendance', 'me', params],
  },

  // ── Exercises ──
  exercises: {
    all: ['exercises'],
    list: (params) => ['exercises', 'list', params],
    search: (query) => ['exercises', 'search', query],
    detail: (id) => ['exercises', 'detail', id],
  },

  // ── Workout Plans ──
  workoutPlans: {
    all: ['workout-plans'],
    list: (params) => ['workout-plans', 'list', params],
    detail: (id) => ['workout-plans', 'detail', id],
  },

  // ── Diet Plans ──
  dietPlans: {
    all: ['diet-plans'],
    list: (params) => ['diet-plans', 'list', params],
    detail: (id) => ['diet-plans', 'detail', id],
  },

  // ── Progress Logs ──
  progress: {
    all: ['progress'],
    member: (memberId, params) => ['progress', memberId, params],
  },

  // ── Payments ──
  payments: {
    all: ['payments'],
    list: (params) => ['payments', 'list', params],
    detail: (id) => ['payments', 'detail', id],
    myPayments: (params) => ['payments', 'me', params],
  },

  // ── Gym Classes ──
  gymClasses: {
    all: ['gym-classes'],
    list: (params) => ['gym-classes', 'list', params],
    detail: (id) => ['gym-classes', 'detail', id],
  },

  // ── Equipment ──
  equipment: {
    all: ['equipment'],
    list: (params) => ['equipment', 'list', params],
    detail: (id) => ['equipment', 'detail', id],
  },

  // ── Complaints ──
  complaints: {
    all: ['complaints'],
    list: (params) => ['complaints', 'list', params],
    detail: (id) => ['complaints', 'detail', id],
  },

  // ── Notifications ──
  notifications: {
    all: ['notifications'],
    list: (params) => ['notifications', 'list', params],
  },

  // ── Reports ──
  reports: {
    all: ['reports'],
    attendance: (params) => ['reports', 'attendance', params],
    revenue: (params) => ['reports', 'revenue', params],
  },

  // ── Coupons ──
  coupons: {
    all: ['coupons'],
    list: (params) => ['coupons', 'list', params],
    detail: (id) => ['coupons', 'detail', id],
  },
};
