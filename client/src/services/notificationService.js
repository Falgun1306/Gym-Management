import api from '@/lib/axios';

/**
 * Notification API service layer.
 * All functions return the unwrapped ApiResponse from our Axios interceptor.
 */

// ─── User Notifications ────────────────────────────────────────────────────────

/** GET /api/v1/notifications/me */
export const getMyNotifications = () => api.get('/notifications/me');

/** PATCH /api/v1/notifications/me/read-all */
export const markAllRead = () => api.patch('/notifications/me/read-all');

/** PATCH /api/v1/notifications/me/:id/read */
export const markNotificationRead = (id) => api.patch(`/notifications/me/${id}/read`);

// ─── Admin Notifications ─────────────────────────────────────────────────────

/** POST /api/v1/notifications */
export const createNotification = (data) => api.post('/notifications', data);

/** POST /api/v1/notifications/bulk */
export const sendBulkNotification = (data) => api.post('/notifications/bulk', data);

/** GET /api/v1/notifications/:id */
export const getNotificationById = (id) => api.get(`/notifications/${id}`);

/** DELETE /api/v1/notifications/:id */
export const deleteNotification = (id) => api.delete(`/notifications/${id}`);
