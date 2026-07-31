import api from '@/lib/axios';

/**
 * Member API service layer.
 * Maps to backend routes in server/src/routes/admin.router.js (admin-scoped member operations)
 *
 * All routes require ADMIN role.
 */

/**
 * List members with pagination, search, and filters.
 * GET /api/v1/admins/members?page=&limit=&search=&membershipStatus=
 * @param {Object} params - { page, limit, search, membershipStatus }
 */
export async function listMembers(params = {}) {
  return api.get('/admins/members', { params });
}

/**
 * Get a single member by ID (includes user, trainer, memberships, payments).
 * GET /api/v1/admins/members/:id
 * @param {string} id
 */
export async function getMemberById(id) {
  return api.get(`/admins/members/${id}`);
}

/**
 * Update a member's profile fields.
 * PATCH /api/v1/admins/members/:id
 * @param {string} id
 * @param {Object} data - { firstName, lastName, phone, gender, dob, ... }
 */
export async function updateMember(id, data) {
  return api.patch(`/admins/members/${id}`, data);
}

/**
 * Delete a member.
 * DELETE /api/v1/admins/members/:id
 * @param {string} id
 */
export async function deleteMember(id) {
  return api.delete(`/admins/members/${id}`);
}
