import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import {
  getAdminDashboard,
  getTrainerDashboard,
  getMemberDashboard,
} from '@/services/dashboardService';

/**
 * React Query hooks for dashboard data.
 * Auto-refetches every 30 seconds for real-time stat updates.
 */

/**
 * Fetch admin dashboard statistics.
 * Response shape: { totalMembers, activeMembers, totalTrainers,
 *   activeMemberships, monthlyRevenue, pendingPayments, attendanceToday }
 */
export function useAdminDashboard(options = {}) {
  return useQuery({
    queryKey: queryKeys.dashboard.admin(),
    queryFn: getAdminDashboard,
    refetchInterval: 30_000,
    staleTime: 10_000,
    select: (response) => response.data,
    ...options,
  });
}

/**
 * Fetch trainer dashboard statistics.
 * Response shape: { trainerProfile, assignedMembersCount,
 *   workoutPlansCount, dietPlansCount, gymClassesCount }
 */
export function useTrainerDashboard(options = {}) {
  return useQuery({
    queryKey: queryKeys.dashboard.trainer(),
    queryFn: getTrainerDashboard,
    refetchInterval: 30_000,
    staleTime: 10_000,
    select: (response) => response.data,
    ...options,
  });
}

/**
 * Fetch member dashboard statistics.
 * Response shape: { memberProfile, activeMembership,
 *   assignedWorkoutsCount, assignedDietsCount, totalVisits, unreadNotificationsCount }
 */
export function useMemberDashboard(options = {}) {
  return useQuery({
    queryKey: queryKeys.dashboard.member(),
    queryFn: getMemberDashboard,
    refetchInterval: 30_000,
    staleTime: 10_000,
    select: (response) => response.data,
    ...options,
  });
}
