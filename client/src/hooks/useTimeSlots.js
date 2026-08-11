import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getMyTimeSlots,
  setMyTimeSlot,
  updateMyTimeSlot,
  deleteMyTimeSlot,
  getTrainerTimeSlotOverview,
  createTimeSlotAdvisory,
  deleteTimeSlotAdvisory,
} from '@/services/timeSlotService';
import toast from 'react-hot-toast';

// ─── Member Hooks ───
export function useMyTimeSlots() {
  return useQuery({
    queryKey: ['my-time-slots'],
    queryFn: getMyTimeSlots,
    staleTime: 1000 * 60 * 5,
  });
}

export function useSetMyTimeSlot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: setMyTimeSlot,
    onSuccess: (res) => {
      toast.success(res?.message || 'Time slot saved! Trainer notified.');
      queryClient.invalidateQueries({ queryKey: ['my-time-slots'] });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to save time slot');
    },
  });
}

export function useUpdateMyTimeSlot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ slotId, data }) => updateMyTimeSlot(slotId, data),
    onSuccess: (res) => {
      toast.success(res?.message || 'Time slot updated! Trainer notified.');
      queryClient.invalidateQueries({ queryKey: ['my-time-slots'] });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to update time slot');
    },
  });
}

export function useDeleteMyTimeSlot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteMyTimeSlot,
    onSuccess: (res) => {
      toast.success(res?.message || 'Time slot deleted!');
      queryClient.invalidateQueries({ queryKey: ['my-time-slots'] });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to delete time slot');
    },
  });
}

// ─── Trainer / Admin Hooks ───
export function useTrainerTimeSlotOverview(params = {}) {
  return useQuery({
    queryKey: ['trainer-time-slot-overview', params],
    queryFn: () => getTrainerTimeSlotOverview(params),
    staleTime: 1000 * 10, // 10s
    refetchInterval: 15000, // Auto refetch every 15s for live check-in/out updates
  });
}

export function useCreateTimeSlotAdvisory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTimeSlotAdvisory,
    onSuccess: (res) => {
      toast.success(res?.message || 'Space advisory logged successfully!');
      queryClient.invalidateQueries({ queryKey: ['trainer-time-slot-overview'] });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to log advisory');
    },
  });
}

export function useDeleteTimeSlotAdvisory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTimeSlotAdvisory,
    onSuccess: () => {
      toast.success('Advisory removed');
      queryClient.invalidateQueries({ queryKey: ['trainer-time-slot-overview'] });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to delete advisory');
    },
  });
}
