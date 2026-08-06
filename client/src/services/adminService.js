import api from '@/lib/axios';

/**
 * Admin API service layer.
 * Maps 1:1 to backend routes in server/src/routes/admin.router.js & server/src/routes/gymClass.router.js
 */

// ── Dashboard ──
export async function getAdminDashboard() {
  return api.get('/admins/dashboard');
}

// ── Profile ──
export async function getAdminProfile() {
  return api.get('/admins/me');
}

export async function updateAdminProfile(data) {
  return api.patch('/admins/me', data);
}

// ── Members ──
export async function listMembers(params = {}) {
  return api.get('/admins/members', { params });
}

export async function getMemberById(id) {
  return api.get(`/admins/members/${id}`);
}

export async function updateMember(id, data) {
  return api.patch(`/admins/members/${id}`, data);
}

export async function deleteMember(id) {
  return api.delete(`/admins/members/${id}`);
}

export async function assignTrainerToMember(memberId, trainerId) {
  return api.patch(`/admins/members/${memberId}/assign-trainer`, { trainerId });
}

export async function removeTrainerFromMember(memberId) {
  return api.patch(`/admins/members/${memberId}/remove-trainer`);
}

// ── Trainers ──
export async function listTrainers(params = {}) {
  return api.get('/admins/trainers', { params });
}

export async function getTrainerById(id) {
  return api.get(`/admins/trainers/${id}`);
}

export async function directPromoteToTrainer(data) {
  return api.post('/admins/trainers/promote', data);
}

export async function updateTrainer(id, data) {
  return api.patch(`/admins/trainers/${id}`, data);
}

export async function removeTrainer(id) {
  return api.delete(`/admins/trainers/${id}`);
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

export async function rejectTrainerApplication(id, payload = '') {
  const reasonText = typeof payload === 'string' ? payload : (payload?.rejectionReason || payload?.reason || '');
  return api.patch(`/admins/trainer-applications/${id}/reject`, {
    rejectionReason: reasonText,
    reason: reasonText,
  });
}

// ── Membership Plans ──
export async function listMembershipPlans(params = {}) {
  return api.get('/admins/membership-plans', { params });
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

// ── Individual Memberships ──
export async function listMemberships(params = {}) {
  return api.get('/admins/memberships', { params });
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

export async function bookClass(classId) {
  return api.post(`/gym-classes/${classId}/book`);
}

export async function cancelBooking(bookingId) {
  return api.patch(`/gym-classes/bookings/${bookingId}/cancel`);
}

// ── Payments & Billing ──
export async function listAdminPayments(params = {}) {
  return api.get('/admins/payments', { params });
}

export async function getAdminPaymentById(id) {
  return api.get(`/admins/payments/${id}`);
}

export async function createAdminPayment(data) {
  return api.post('/admins/payments', data);
}

export async function approvePayment(id) {
  return api.patch(`/admins/payments/${id}/approve`);
}

// ── Attendance ──
export async function listAdminAttendance(params = {}) {
  return api.get('/admins/attendance', { params });
}

// ── Complaints ──
export async function listAdminComplaints(params = {}) {
  return api.get('/admins/complaints', { params });
}

export async function resolveComplaint(id, status, resolution) {
  return api.patch(`/admins/complaints/${id}`, { status, resolution });
}

// ── Equipment ──
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

// ── Reports ──
export async function getAttendanceReport(params = {}) {
  return api.get('/admins/attendance/report', { params });
}

export async function getRevenueReport(params = {}) {
  return api.get('/reports/revenue', { params });
}
