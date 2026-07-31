import api from '@/lib/axios';

/**
 * Dashboard API service layer.
 * Maps to backend routes in server/src/routes/dashboard.router.js
 */

/** GET /api/v1/dashboards/admin */
export const getAdminDashboard = () => api.get('/dashboards/admin');

/** GET /api/v1/dashboards/trainer */
export const getTrainerDashboard = () => api.get('/dashboards/trainer');

/** GET /api/v1/dashboards/member */
export const getMemberDashboard = () => api.get('/dashboards/member');
