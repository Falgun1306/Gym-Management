import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import {
  listMembers,
  getMemberById,
  updateMember,
  deleteMember,
} from '@/services/memberService';
import toast from 'react-hot-toast';

/**
 * React Query hooks for member operations (admin-scoped).
 */

/**
 * Fetch paginated member list with search & filters.
 * @param {Object} params - { page, limit, search, membershipStatus }
 */
export function useMembers(params = {}) {
  return useQuery({
    queryKey: queryKeys.members.list(params),
    queryFn: () => listMembers(params),
    keepPreviousData: true,
    staleTime: 15_000,
    select: (response) => ({
      members: response.data,
      pagination: response.pagination,
    }),
  });
}

/**
 * Fetch a single member by ID (detail view).
 * @param {string} id
 */
export function useMember(id) {
  return useQuery({
    queryKey: queryKeys.members.detail(id),
    queryFn: () => getMemberById(id),
    enabled: !!id,
    staleTime: 15_000,
    select: (response) => response.data,
  });
}

/**
 * Mutation: Update a member's profile.
 * Invalidates both the member detail and the members list cache.
 */
export function useUpdateMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => updateMember(id, data),
    onSuccess: (response, { id }) => {
      toast.success(response.message || 'Member updated successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.members.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.members.all });
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update member');
    },
  });
}

/**
 * Mutation: Delete a member.
 * Invalidates the members list cache.
 */
export function useDeleteMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => deleteMember(id),
    onSuccess: (response) => {
      toast.success(response.message || 'Member deleted successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.members.all });
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete member');
    },
  });
}
