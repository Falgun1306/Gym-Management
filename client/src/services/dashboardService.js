import api from '@/lib/axios';

/**
 * Dashboard API service layer.
 * Maps to backend routes in server/src/routes/dashboard.router.js
 *
 * GET /api/v1/dashboards/admin   → auth + ADMIN
 * GET /api/v1/dashboards/trainer → auth + TRAINER
 * GET /api/v1/dashboards/member  → auth + MEMBER
 */

/**
 * Fetch admin dashboard statistics.
 * Returns: { totalMembers, activeMembers, totalTrainers, activeMemberships,
 *            monthlyRevenue, pendingPayments, attendanceToday }
 */
export async function getAdminDashboard() {
  return api.get('/dashboards/admin');
}

/**
 * Fetch trainer dashboard statistics.
 * Returns: { trainerProfile, assignedMembersCount, workoutPlansCount,
 *            dietPlansCount, gymClassesCount }
 */
export async function getTrainerDashboard() {
  return api.get('/dashboards/trainer');
}

/**
 * Fetch member dashboard statistics.
 * Returns: { memberProfile, activeMembership, assignedWorkoutsCount,
 *            assignedDietsCount, totalVisits, unreadNotificationsCount }
 */
export async function getMemberDashboard() {
  return api.get('/dashboards/member');
}
