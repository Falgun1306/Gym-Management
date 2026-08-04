import api from '@/lib/axios';

/**
 * Trainer API service layer.
 * Maps 1:1 to backend routes in server/src/routes/trainer.router.js & exercise.router.js
 *
 * All functions return the unwrapped ApiResponse from our Axios interceptor.
 */

// ─── Profile ─────────────────────────────────────────────────────────────────

/** GET /api/v1/trainers/me */
export const getMyProfile = () => api.get('/trainers/me');

/** PATCH /api/v1/trainers/me */
export const updateMyProfile = (data) => api.patch('/trainers/me', data);

// ─── Assigned Members ────────────────────────────────────────────────────────

/** GET /api/v1/trainers/me/members */
export const getMyMembers = (params) => api.get('/trainers/me/members', { params });

/** GET /api/v1/trainers/me/members/:memberId */
export const getMyMemberById = (memberId) => api.get(`/trainers/me/members/${memberId}`);

// ─── Schedule ────────────────────────────────────────────────────────────────

/** GET /api/v1/trainers/me/schedule */
export const getMySchedule = () => api.get('/trainers/me/schedule');

/** PATCH /api/v1/trainers/me/schedule */
export const updateMySchedule = (data) => api.patch('/trainers/me/schedule', data);

/** GET /api/v1/trainers/me/time-off */
export const getTimeOffs = () => api.get('/trainers/me/time-off');

/** POST /api/v1/trainers/me/time-off */
export const createTimeOff = (data) => api.post('/trainers/me/time-off', data);

/** DELETE /api/v1/trainers/me/time-off/:timeOffId */
export const deleteTimeOff = (timeOffId) => api.delete(`/trainers/me/time-off/${timeOffId}`);

// ─── Workout Plans CRUD ──────────────────────────────────────────────────────

/** POST /api/v1/trainers/workout-plans */
export const createWorkoutPlan = (data) => api.post('/trainers/workout-plans', data);

/** GET /api/v1/trainers/workout-plans */
export const getWorkoutPlans = (params) => api.get('/trainers/workout-plans', { params });

/** GET /api/v1/trainers/workout-plans/:id */
export const getWorkoutPlanById = (id) => api.get(`/trainers/workout-plans/${id}`);

/** PATCH /api/v1/trainers/workout-plans/:id */
export const updateWorkoutPlan = (id, data) => api.patch(`/trainers/workout-plans/${id}`, data);

/** DELETE /api/v1/trainers/workout-plans/:id */
export const deleteWorkoutPlan = (id) => api.delete(`/trainers/workout-plans/${id}`);

/** POST /api/v1/trainers/workout-plans/:planId/assign/:memberId */
export const assignWorkoutPlan = (planId, memberId) =>
  api.post(`/trainers/workout-plans/${planId}/assign/${memberId}`);

// ─── Diet Plans CRUD ─────────────────────────────────────────────────────────

/** POST /api/v1/trainers/diet-plans */
export const createDietPlan = (data) => api.post('/trainers/diet-plans', data);

/** GET /api/v1/trainers/diet-plans */
export const getDietPlans = (params) => api.get('/trainers/diet-plans', { params });

/** GET /api/v1/trainers/diet-plans/:id */
export const getDietPlanById = (id) => api.get(`/trainers/diet-plans/${id}`);

/** PATCH /api/v1/trainers/diet-plans/:id */
export const updateDietPlan = (id, data) => api.patch(`/trainers/diet-plans/${id}`, data);

/** DELETE /api/v1/trainers/diet-plans/:id */
export const deleteDietPlan = (id) => api.delete(`/trainers/diet-plans/${id}`);

/** POST /api/v1/trainers/diet-plans/:planId/assign/:memberId */
export const assignDietPlan = (planId, memberId) =>
  api.post(`/trainers/diet-plans/${planId}/assign/${memberId}`);

// ─── Progress Tracking ──────────────────────────────────────────────────────

/** POST /api/v1/trainers/members/:memberId/progress */
export const logMemberProgress = (memberId, data) =>
  api.post(`/trainers/members/${memberId}/progress`, data);

/** GET /api/v1/trainers/members/:memberId/progress */
export const getMemberProgress = (memberId, params) =>
  api.get(`/trainers/members/${memberId}/progress`, { params });

// ─── Member Attendance ──────────────────────────────────────────────────────

/** GET /api/v1/trainers/members/:memberId/attendance */
export const getMemberAttendance = (memberId, params) =>
  api.get(`/trainers/members/${memberId}/attendance`, { params });

/** POST /api/v1/trainers/members/:memberId/attendance */
export const markMemberAttendance = (memberId, data) =>
  api.post(`/trainers/members/${memberId}/attendance`, data);

// ─── Exercises ──────────────────────────────────────────────────────────────

/** POST /api/v1/exercises */
export const createExercise = (data) => api.post('/exercises', data);

/** GET /api/v1/trainers/exercises */
export const listExercises = (params) => api.get('/trainers/exercises', { params });

/** GET /api/v1/trainers/exercises/search?q= */
export const searchExercises = (params) => api.get('/trainers/exercises/search', { params });

/** PATCH /api/v1/trainers/exercises/:id */
export const updateExercise = (id, data) => api.patch(`/trainers/exercises/${id}`, data);

/** DELETE /api/v1/trainers/exercises/:id */
export const deleteExercise = (id) => api.delete(`/trainers/exercises/${id}`);

// ─── Class Bookings ─────────────────────────────────────────────────────────

/** GET /api/v1/trainers/class-bookings */
export const getClassBookings = (params) => api.get('/trainers/class-bookings', { params });

// ─── QR Check-in ────────────────────────────────────────────────────────────

/** POST /api/v1/attendance/qr/scan */
export const scanQrCode = (qrToken) => api.post('/attendance/qr/scan', { qrToken });
