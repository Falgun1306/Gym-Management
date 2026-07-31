import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import * as adminService from '@/services/adminService';
import toast from 'react-hot-toast';

// ── Admin Profile Hooks ──

export function useAdminProfile() {
  return useQuery({
    queryKey: queryKeys.auth.me(),
    queryFn: () => adminService.getAdminProfile(),
    select: (res) => res.data,
  });
}

export function useUpdateAdminProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => adminService.updateAdminProfile(data),
    onSuccess: (res) => {
      toast.success(res.message || 'Profile updated successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me() });
    },
    onError: (err) => toast.error(err.message || 'Profile update failed'),
  });
}

// ── Trainer Applications Hooks ──

export function useTrainerApplications(params = {}) {
  return useQuery({
    queryKey: queryKeys.trainerApplications.list(params),
    queryFn: () => adminService.listTrainerApplications(params),
    keepPreviousData: true,
    staleTime: 10_000,
    select: (res) => ({ applications: res.data, pagination: res.pagination }),
  });
}

export function useApproveTrainerApp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => adminService.approveTrainerApplication(id, data),
    onSuccess: (res) => {
      toast.success(res.message || 'Application approved!');
      queryClient.invalidateQueries({ queryKey: queryKeys.trainerApplications.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.trainers.all });
    },
    onError: (err) => toast.error(err.message || 'Approval failed'),
  });
}

export function useRejectTrainerApp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, rejectionReason }) => adminService.rejectTrainerApplication(id, rejectionReason),
    onSuccess: (res) => {
      toast.success(res.message || 'Application rejected');
      queryClient.invalidateQueries({ queryKey: queryKeys.trainerApplications.all });
    },
    onError: (err) => toast.error(err.message || 'Rejection failed'),
  });
}

// ── Trainers Management Hooks ──

export function useTrainers(params = {}) {
  return useQuery({
    queryKey: queryKeys.trainers.list(params),
    queryFn: () => adminService.listTrainers(params),
    keepPreviousData: true,
    staleTime: 10_000,
    select: (res) => res.data,
  });
}

export function useTrainerDetail(id) {
  return useQuery({
    queryKey: queryKeys.trainers.detail(id),
    queryFn: () => adminService.getTrainerById(id),
    enabled: !!id,
    select: (res) => res.data,
  });
}

export function usePromoteTrainer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => adminService.promoteMemberToTrainer(data),
    onSuccess: (res) => {
      toast.success(res.message || 'Member promoted to Trainer');
      queryClient.invalidateQueries({ queryKey: queryKeys.trainers.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.members.all });
    },
    onError: (err) => toast.error(err.message || 'Promotion failed'),
  });
}

export function useUpdateTrainer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => adminService.updateTrainer(id, data),
    onSuccess: (res, { id }) => {
      toast.success(res.message || 'Trainer updated');
      queryClient.invalidateQueries({ queryKey: queryKeys.trainers.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.trainers.all });
    },
    onError: (err) => toast.error(err.message || 'Update failed'),
  });
}

export function useRemoveTrainer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => adminService.removeTrainer(id),
    onSuccess: (res) => {
      toast.success(res.message || 'Trainer removed');
      queryClient.invalidateQueries({ queryKey: queryKeys.trainers.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.members.all });
    },
    onError: (err) => toast.error(err.message || 'Removal failed'),
  });
}

export function useAssignTrainer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ memberId, trainerId }) => adminService.assignTrainerToMember(memberId, trainerId),
    onSuccess: (res) => {
      toast.success(res.message || 'Trainer assigned to member');
      queryClient.invalidateQueries({ queryKey: queryKeys.members.all });
    },
    onError: (err) => toast.error(err.message || 'Assignment failed'),
  });
}

export function useRemoveTrainerFromMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (memberId) => adminService.removeTrainerFromMember(memberId),
    onSuccess: (res) => {
      toast.success(res.message || 'Trainer removed from member');
      queryClient.invalidateQueries({ queryKey: queryKeys.members.all });
    },
    onError: (err) => toast.error(err.message || 'Operation failed'),
  });
}

// ── Membership Plans Hooks ──

export function useMembershipPlans() {
  return useQuery({
    queryKey: queryKeys.membershipPlans.all,
    queryFn: () => adminService.listMembershipPlans(),
    select: (res) => res.data,
  });
}

export function useCreateMembershipPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => adminService.createMembershipPlan(data),
    onSuccess: (res) => {
      toast.success(res.message || 'Membership plan created');
      queryClient.invalidateQueries({ queryKey: queryKeys.membershipPlans.all });
    },
    onError: (err) => toast.error(err.message || 'Creation failed'),
  });
}

export function useUpdateMembershipPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => adminService.updateMembershipPlan(id, data),
    onSuccess: (res) => {
      toast.success(res.message || 'Membership plan updated');
      queryClient.invalidateQueries({ queryKey: queryKeys.membershipPlans.all });
    },
    onError: (err) => toast.error(err.message || 'Update failed'),
  });
}

export function useDeleteMembershipPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => adminService.deleteMembershipPlan(id),
    onSuccess: (res) => {
      toast.success(res.message || 'Membership plan deleted');
      queryClient.invalidateQueries({ queryKey: queryKeys.membershipPlans.all });
    },
    onError: (err) => toast.error(err.message || 'Deletion failed'),
  });
}

// ── Memberships (Subscriptions) Hooks ──

export function useMemberships(params = {}) {
  return useQuery({
    queryKey: queryKeys.memberships.list(params),
    queryFn: () => adminService.listMemberships(params),
    keepPreviousData: true,
    select: (res) => ({ memberships: res.data, pagination: res.pagination }),
  });
}

export function useAssignMembership() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => adminService.assignMembership(data),
    onSuccess: (res) => {
      toast.success(res.message || 'Membership assigned');
      queryClient.invalidateQueries({ queryKey: queryKeys.memberships.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.members.all });
    },
    onError: (err) => toast.error(err.message || 'Assignment failed'),
  });
}

export function useUnfreezeMembership() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => adminService.unfreezeMembership(id),
    onSuccess: (res) => {
      toast.success(res.message || 'Membership unfrozen');
      queryClient.invalidateQueries({ queryKey: queryKeys.memberships.all });
    },
    onError: (err) => toast.error(err.message || 'Unfreeze failed'),
  });
}

// ── Gym Classes Control Hooks ──

export function useGymClasses(params = {}) {
  return useQuery({
    queryKey: queryKeys.gymClasses.list(params),
    queryFn: () => adminService.listGymClasses(params),
    select: (res) => res.data,
  });
}

export function useCreateGymClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => adminService.createGymClass(data),
    onSuccess: (res) => {
      toast.success(res.message || 'Gym class created');
      queryClient.invalidateQueries({ queryKey: queryKeys.gymClasses.all });
    },
    onError: (err) => toast.error(err.message || 'Creation failed'),
  });
}

export function useUpdateGymClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => adminService.updateGymClass(id, data),
    onSuccess: (res) => {
      toast.success(res.message || 'Gym class updated');
      queryClient.invalidateQueries({ queryKey: queryKeys.gymClasses.all });
    },
    onError: (err) => toast.error(err.message || 'Update failed'),
  });
}

export function useDeleteGymClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => adminService.deleteGymClass(id),
    onSuccess: (res) => {
      toast.success(res.message || 'Gym class deleted');
      queryClient.invalidateQueries({ queryKey: queryKeys.gymClasses.all });
    },
    onError: (err) => toast.error(err.message || 'Deletion failed'),
  });
}

// ── Payments & Invoices Hooks ──

export function useAdminPayments(params = {}) {
  return useQuery({
    queryKey: queryKeys.payments.list(params),
    queryFn: () => adminService.listAdminPayments(params),
    keepPreviousData: true,
    select: (res) => ({ payments: res.data, pagination: res.pagination }),
  });
}

export function usePaymentDetail(id) {
  return useQuery({
    queryKey: queryKeys.payments.detail(id),
    queryFn: () => adminService.getAdminPaymentById(id),
    enabled: !!id,
    select: (res) => res.data,
  });
}

export function useCreateAdminPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => adminService.createAdminPayment(data),
    onSuccess: (res) => {
      toast.success(res.message || 'Payment recorded successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
    onError: (err) => toast.error(err.message || 'Payment recording failed'),
  });
}

// ── Equipment Inventory Hooks ──

export function useEquipment(params = {}) {
  return useQuery({
    queryKey: queryKeys.equipment.list(params),
    queryFn: () => adminService.listEquipment(params),
    select: (res) => res.data,
  });
}

export function useCreateEquipment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => adminService.createEquipment(data),
    onSuccess: (res) => {
      toast.success(res.message || 'Equipment added');
      queryClient.invalidateQueries({ queryKey: queryKeys.equipment.all });
    },
    onError: (err) => toast.error(err.message || 'Addition failed'),
  });
}

export function useUpdateEquipment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => adminService.updateEquipment(id, data),
    onSuccess: (res) => {
      toast.success(res.message || 'Equipment updated');
      queryClient.invalidateQueries({ queryKey: queryKeys.equipment.all });
    },
    onError: (err) => toast.error(err.message || 'Update failed'),
  });
}

export function useDeleteEquipment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => adminService.deleteEquipment(id),
    onSuccess: (res) => {
      toast.success(res.message || 'Equipment deleted');
      queryClient.invalidateQueries({ queryKey: queryKeys.equipment.all });
    },
    onError: (err) => toast.error(err.message || 'Deletion failed'),
  });
}

// ── Complaints Hooks ──

export function useAdminComplaints(params = {}) {
  return useQuery({
    queryKey: queryKeys.complaints.list(params),
    queryFn: () => adminService.listAdminComplaints(params),
    select: (res) => res.data,
  });
}

export function useResolveComplaint() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, resolution }) => adminService.resolveComplaint(id, { resolution }),
    onSuccess: (res) => {
      toast.success(res.message || 'Complaint resolved');
      queryClient.invalidateQueries({ queryKey: queryKeys.complaints.all });
    },
    onError: (err) => toast.error(err.message || 'Resolution failed'),
  });
}

// ── Reports Hooks ──

export function useAttendanceReport(params = {}) {
  return useQuery({
    queryKey: queryKeys.reports.attendance(params),
    queryFn: () => adminService.getAttendanceReport(params),
    select: (res) => res.data,
  });
}

export function useRevenueReport(params = {}) {
  return useQuery({
    queryKey: queryKeys.reports.revenue(params),
    queryFn: () => adminService.getRevenueReport(params),
    select: (res) => res.data,
  });
}
