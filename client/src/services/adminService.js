import api from '@/lib/axios';

/**
 * Admin API service layer.
 * Maps directly to Express routes in:
 * - server/src/routes/admin.router.js (/api/v1/admins)
 * - server/src/routes/equipment.router.js (/api/v1/equipment)
 * - server/src/routes/report.router.js (/api/v1/reports)
 * - server/src/routes/complaint.router.js (/api/v1/complaints)
 */

// ── Profile & Dashboard ──
export async function getAdminProfile() {
  return api.get('/admins/me');
}

export async function updateAdminProfile(data) {
  return api.patch('/admins/me', data);
}

export async function getAdminDashboardStats() {
  return api.get('/admins/dashboard');
}

// ── Trainer Applications ──
export async function listTrainerApplications(params = {}) {
  return api.get('/admins/trainer-applications', { params });
}

export async function getTrainerApplicationById(id) {
  return api.get(`/admins/trainer-applications/${id}`);
}

export async function approveTrainerApplication(id, data = {}) {
  return api.patch(`/admins/trainer-applications/${id}/approve`, data);
}

export async function rejectTrainerApplication(id, rejectionReason) {
  return api.patch(`/admins/trainer-applications/${id}/reject`, { rejectionReason });
}

// ── Trainers Management ──
export async function listTrainers(params = {}) {
  return api.get('/admins/trainers', { params });
}

export async function getTrainerById(id) {
  return api.get(`/admins/trainers/${id}`);
}

export async function promoteMemberToTrainer(data) {
  return api.post('/admins/trainers/promote', data);
}

export async function updateTrainer(id, data) {
  return api.patch(`/admins/trainers/${id}`, data);
}

export async function removeTrainer(id) {
  return api.delete(`/admins/trainers/${id}`);
}

export async function assignTrainerToMember(memberId, trainerId) {
  return api.patch(`/admins/members/${memberId}/assign-trainer`, { trainerId });
}

export async function removeTrainerFromMember(memberId) {
  return api.patch(`/admins/members/${memberId}/remove-trainer`);
}

// ── Membership Plans ──
export async function listMembershipPlans() {
  return api.get('/admins/membership-plans');
}

export async function createMembershipPlan(data) {
  return api.post('/admins/membership-plans', data);
}

export async function updateMembershipPlan(id, data) {
  return api.patch(`/admins/membership-plans/${id}`, data);
}

export async function deleteMembershipPlan(id) {
  return api.delete(`/admins/membership-plans/${id}`);
}

// ── Memberships & Subscriptions ──
export async function listMemberships(params = {}) {
  return api.get('/admins/memberships', { params });
}

export async function getMembershipById(id) {
  return api.get(`/admins/memberships/${id}`);
}

export async function assignMembership(data) {
  return api.post('/admins/memberships', data);
}

export async function unfreezeMembership(id) {
  return api.patch(`/admins/memberships/${id}/unfreeze`);
}

// ── Gym Classes ──
export async function listGymClasses(params = {}) {
  return api.get('/gym-classes', { params });
}

export async function createGymClass(data) {
  return api.post('/admins/gym-classes', data);
}

export async function updateGymClass(id, data) {
  return api.patch(`/admins/gym-classes/${id}`, data);
}

export async function deleteGymClass(id) {
  return api.delete(`/admins/gym-classes/${id}`);
}

// ── Payments & Billing ──
export async function listAdminPayments(params = {}) {
  return api.get('/admins/payments', { params });
}

export async function getAdminPaymentById(id) {
  return api.get(`/admins/payments/${id}`);
}

export async function createAdminPayment(data) {
  return api.post('/payments/create', data);
}

// ── Attendance ──
export async function listAdminAttendance(params = {}) {
  return api.get('/admins/attendance', { params });
}

// ── Equipment Inventory ──
export async function listEquipment(params = {}) {
  return api.get('/equipment', { params });
}

export async function createEquipment(data) {
  return api.post('/equipment', data);
}

export async function updateEquipment(id, data) {
  return api.patch(`/equipment/${id}`, data);
}

export async function deleteEquipment(id) {
  return api.delete(`/equipment/${id}`);
}

// ── Complaints & Ticketing ──
export async function listAdminComplaints(params = {}) {
  return api.get('/admins/complaints', { params });
}

export async function resolveComplaint(id, data) {
  return api.patch(`/admins/complaints/${id}`, data);
}

// ── Reports & Analytics ──
export async function getAttendanceReport(params = {}) {
  return api.get('/reports/attendance', { params });
}

export async function getRevenueReport(params = {}) {
  return api.get('/reports/revenue', { params });
}
