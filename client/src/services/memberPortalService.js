import api from '@/lib/axios';

/**
 * Member Portal API Service Layer.
 * Maps to backend endpoints in server/src/routes/member.router.js,
 * attendance.router.js, dashboard.router.js, coupon.router.js, and payment.router.js.
 */

// ─── Profile & Account ───────────────────────────────────────────────────────
export async function getMyProfile() {
  return api.get('/members/me');
}

export async function createMyProfile(data) {
  return api.post('/members/me', data);
}

export async function updateMyProfile(data) {
  return api.patch('/members/me', data);
}

// ─── Member Dashboard ────────────────────────────────────────────────────────
export async function getMemberDashboard() {
  return api.get('/dashboards/member');
}

// ─── Membership & Subscriptions ──────────────────────────────────────────────
export async function getMySubscriptions() {
  return api.get('/members/me/subscriptions');
}

export async function freezeMembership(membershipId, data) {
  return api.patch(`/members/me/memberships/${membershipId}/freeze`, data);
}

export async function unfreezeMembership(membershipId) {
  return api.patch(`/members/me/memberships/${membershipId}/unfreeze`);
}

// ─── Attendance & QR Code ────────────────────────────────────────────────────
export async function getMyAttendance(params = {}) {
  return api.get('/members/me/attendance', { params });
}

export async function generateMemberQrCode() {
  return api.get('/attendance/me/qr-code');
}

export async function memberCheckIn() {
  return api.post('/attendance/check-in');
}

export async function memberCheckOut() {
  return api.post('/attendance/check-out');
}

// ─── Workout & Diet Plans ─────────────────────────────────────────────────────
export async function getMyWorkoutPlans() {
  return api.get('/members/me/workout-plans');
}

export async function getMyDietPlans() {
  return api.get('/members/me/diet-plans');
}

// ─── Progress Tracking ────────────────────────────────────────────────────────
export async function getMyProgress() {
  return api.get('/members/me/progress');
}

export async function logMyProgress(data) {
  return api.post('/members/me/progress', data);
}

// ─── Gym Classes & Bookings ──────────────────────────────────────────────────
export async function listMemberGymClasses(params = {}) {
  return api.get('/members/gym-classes', { params });
}

export async function bookGymClass(classId) {
  return api.post(`/members/gym-classes/${classId}/book`);
}

export async function cancelGymClass(bookingId) {
  return api.patch(`/members/gym-classes/bookings/${bookingId}/cancel`);
}

// ─── Payments & Invoices ─────────────────────────────────────────────────────
export async function getMyPayments(params = {}) {
  return api.get('/members/me/payments', { params });
}

export async function downloadPaymentInvoice(paymentId) {
  return api.get(`/payments/${paymentId}/invoice`);
}

// ─── Coupons & Referrals ─────────────────────────────────────────────────────
export async function getMyReferralLink() {
  return api.get('/coupons/my-referral-link');
}

export async function validateCoupon(code) {
  return api.get(`/coupons/validate/${code}`);
}

// ─── Complaints & Support ────────────────────────────────────────────────────
export async function createComplaint(data) {
  return api.post('/members/complaints', data);
}

export async function getMyComplaints() {
  return api.get('/complaints/me');
}

// ─── Trainer Application ─────────────────────────────────────────────────────
export async function applyForTrainer(data) {
  return api.post('/members/apply-trainer', data);
}

export async function getMyTrainerApplications() {
  return api.get('/members/my-applications');
}

// ─── Memberships (Purchase & Listing) ────────────────────────────────────────
export async function getAvailableMembershipPlans() {
  return api.get('/members/membership-plans');
}

export async function purchaseMembership({ planId, paymentMethod }) {
  return api.post('/members/memberships/purchase', { planId, paymentMethod });
}

// ─── Trainer Ratings ─────────────────────────────────────────────────────────────────
export async function submitTrainerRating(data) {
  return api.post('/members/me/trainer-rating', data);
}

export async function getMyTrainerRatings() {
  return api.get('/members/me/trainer-ratings');
}

export async function verifyPayment(data) {
  return api.post('/payments/verify', data);
}

export async function failPayment(paymentId) {
  return api.post(`/payments/${paymentId}/fail`);
}

export async function retryPayment(paymentId) {
  return api.post(`/payments/${paymentId}/retry`);
}
