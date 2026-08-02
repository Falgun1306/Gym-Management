import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import {
  getMyProfile,
  createMyProfile,
  updateMyProfile,
  getMemberDashboard,
  getMySubscriptions,
  freezeMembership,
  unfreezeMembership,
  getMyAttendance,
  generateMemberQrCode,
  memberCheckIn,
  memberCheckOut,
  getMyWorkoutPlans,
  getMyDietPlans,
  getMyProgress,
  logMyProgress,
  listMemberGymClasses,
  bookGymClass,
  cancelGymClass,
  getMyPayments,
  getMyReferralLink,
  validateCoupon,
  createComplaint,
  getMyComplaints,
  applyForTrainer,
  getMyTrainerApplications,
} from '@/services/memberPortalService';
import toast from 'react-hot-toast';

// ─── Profile Hooks ───────────────────────────────────────────────────────────
export function useMemberProfile() {
  return useQuery({
    queryKey: queryKeys.members.detail('me'),
    queryFn: async () => {
      try {
        const res = await getMyProfile();
        return res.data;
      } catch (err) {
        // If 404, the profile doesn't exist yet — return null instead of erroring
        if (err.status === 404 || err.message?.includes('not found') || err.message?.includes('complete your profile')) {
          return null;
        }
        throw err;
      }
    },
    staleTime: 30_000,
    retry: (failureCount, error) => {
      // Don't retry 404s — the profile simply doesn't exist
      if (error?.status === 404) return false;
      return failureCount < 2;
    },
  });
}

export function useCreateMemberProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => createMyProfile(data),
    onSuccess: (res) => {
      toast.success(res.message || 'Profile setup completed successfully!');
      queryClient.invalidateQueries({ queryKey: queryKeys.members.detail('me') });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.member() });
    },
    onError: (err) => toast.error(err.message || 'Failed to complete profile setup'),
  });
}

export function useUpdateMemberProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => updateMyProfile(data),
    onSuccess: (res) => {
      toast.success(res.message || 'Profile updated successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.members.detail('me') });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.member() });
    },
    onError: (err) => toast.error(err.message || 'Failed to update profile'),
  });
}

// ─── Dashboard Hook ──────────────────────────────────────────────────────────
export function useMemberDashboard() {
  return useQuery({
    queryKey: queryKeys.dashboard.member(),
    queryFn: getMemberDashboard,
    staleTime: 15_000,
    select: (res) => res.data,
  });
}

// ─── Subscriptions & Freeze Hooks ────────────────────────────────────────────
export function useMemberSubscriptions() {
  return useQuery({
    queryKey: queryKeys.members.subscriptions('me'),
    queryFn: getMySubscriptions,
    staleTime: 30_000,
    select: (res) => res.data,
  });
}

export function useFreezeMembership() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ membershipId, durationDays, reason }) =>
      freezeMembership(membershipId, { durationDays, reason }),
    onSuccess: (res) => {
      toast.success(res.message || 'Membership frozen successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.member() });
      queryClient.invalidateQueries({ queryKey: queryKeys.members.subscriptions('me') });
    },
    onError: (err) => toast.error(err.message || 'Failed to freeze membership'),
  });
}

export function useUnfreezeMembership() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (membershipId) => unfreezeMembership(membershipId),
    onSuccess: (res) => {
      toast.success(res.message || 'Membership resumed successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.member() });
      queryClient.invalidateQueries({ queryKey: queryKeys.members.subscriptions('me') });
    },
    onError: (err) => toast.error(err.message || 'Failed to resume membership'),
  });
}

// ─── Attendance & QR Code Hooks ─────────────────────────────────────────────
export function useMemberAttendance(params = {}) {
  return useQuery({
    queryKey: queryKeys.attendance.myAttendance(params),
    queryFn: () => getMyAttendance(params),
    staleTime: 15_000,
    select: (res) => res.data,
  });
}

export function useMemberQrCode(enabled = false) {
  return useQuery({
    queryKey: ['attendance', 'me', 'qr-code'],
    queryFn: generateMemberQrCode,
    enabled,
    staleTime: 60_000,
    select: (res) => res.data,
  });
}

export function useMemberCheckIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: memberCheckIn,
    onSuccess: (res) => {
      toast.success(res.message || 'Checked in successfully!');
      queryClient.invalidateQueries({ queryKey: queryKeys.attendance.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.member() });
    },
    onError: (err) => toast.error(err.message || 'Check-in failed'),
  });
}

export function useMemberCheckOut() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: memberCheckOut,
    onSuccess: (res) => {
      toast.success(res.message || 'Checked out successfully!');
      queryClient.invalidateQueries({ queryKey: queryKeys.attendance.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.member() });
    },
    onError: (err) => toast.error(err.message || 'Check-out failed'),
  });
}

// ─── Workout & Diet Plans Hooks ──────────────────────────────────────────────
export function useMemberWorkoutPlans() {
  return useQuery({
    queryKey: queryKeys.members.workoutPlans('me'),
    queryFn: getMyWorkoutPlans,
    staleTime: 30_000,
    select: (res) => res.data,
  });
}

export function useMemberDietPlans() {
  return useQuery({
    queryKey: queryKeys.members.dietPlans('me'),
    queryFn: getMyDietPlans,
    staleTime: 30_000,
    select: (res) => res.data,
  });
}

// ─── Progress Tracking Hooks ──────────────────────────────────────────────────
export function useMemberProgress() {
  return useQuery({
    queryKey: queryKeys.members.progress('me'),
    queryFn: getMyProgress,
    staleTime: 15_000,
    select: (res) => res.data,
  });
}

export function useLogMemberProgress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => logMyProgress(data),
    onSuccess: (res) => {
      toast.success(res.message || 'Progress logged successfully!');
      queryClient.invalidateQueries({ queryKey: queryKeys.members.progress('me') });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.member() });
    },
    onError: (err) => toast.error(err.message || 'Failed to log progress'),
  });
}

// ─── Gym Classes & Booking Hooks ─────────────────────────────────────────────
export function useMemberGymClasses(params = {}) {
  return useQuery({
    queryKey: queryKeys.gymClasses.list(params),
    queryFn: () => listMemberGymClasses(params),
    staleTime: 15_000,
    select: (res) => res.data,
  });
}

export function useBookGymClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (classId) => bookGymClass(classId),
    onSuccess: (res) => {
      toast.success(res.message || 'Gym class booked successfully!');
      queryClient.invalidateQueries({ queryKey: queryKeys.gymClasses.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.member() });
    },
    onError: (err) => toast.error(err.message || 'Failed to book gym class'),
  });
}

export function useCancelGymClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (bookingId) => cancelGymClass(bookingId),
    onSuccess: (res) => {
      toast.success(res.message || 'Class booking cancelled successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.gymClasses.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.member() });
    },
    onError: (err) => toast.error(err.message || 'Failed to cancel booking'),
  });
}

// ─── Payments & Referral Hooks ───────────────────────────────────────────────
export function useMemberPayments(params = {}) {
  return useQuery({
    queryKey: queryKeys.payments.myPayments(params),
    queryFn: () => getMyPayments(params),
    staleTime: 30_000,
    select: (res) => ({
      payments: res.data,
      pagination: res.pagination,
    }),
  });
}

export function useMemberReferralLink() {
  return useQuery({
    queryKey: ['coupons', 'my-referral-link'],
    queryFn: getMyReferralLink,
    staleTime: 600_000,
    select: (res) => res.data,
  });
}

// ─── Complaints & Support Hooks ──────────────────────────────────────────────
export function useCreateComplaint() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => createComplaint(data),
    onSuccess: (res) => {
      toast.success(res.message || 'Complaint submitted successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.complaints.all });
    },
    onError: (err) => toast.error(err.message || 'Failed to submit complaint'),
  });
}

export function useMemberComplaints() {
  return useQuery({
    queryKey: queryKeys.complaints.list({ me: true }),
    queryFn: getMyComplaints,
    staleTime: 15_000,
    select: (res) => res.data,
  });
}

// ─── Trainer Applications Hooks ──────────────────────────────────────────────
export function useApplyForTrainer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => applyForTrainer(data),
    onSuccess: (res) => {
      toast.success(res.message || 'Trainer application submitted successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.members.applications() });
    },
    onError: (err) => toast.error(err.message || 'Failed to submit application'),
  });
}

export function useMemberTrainerApplications() {
  return useQuery({
    queryKey: queryKeys.members.applications(),
    queryFn: getMyTrainerApplications,
    staleTime: 30_000,
    select: (res) => res.data,
  });
}
