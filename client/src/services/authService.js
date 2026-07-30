import api from '@/lib/axios';

/**
 * Auth API service layer.
 * Maps to backend routes in server/src/routes/user.router.js
 *
 * All functions return the unwrapped ApiResponse.data from our Axios interceptor:
 *   { data: { user, token }, message: '...' }
 */

/**
 * POST /api/v1/users/login
 * @param {{ email: string, password: string }} credentials
 */
export async function loginUser(credentials) {
  return api.post('/users/login', credentials);
}

/**
 * POST /api/v1/users/register
 * @param {{ username: string, email: string, password: string, confirmPassword: string }} data
 */
export async function registerUser(data) {
  return api.post('/users/register', data);
}

/**
 * POST /api/v1/users/logout (requires auth cookie)
 */
export async function logoutUser() {
  return api.post('/users/logout');
}

/**
 * POST /api/v1/users/forgot-password
 * @param {{ email: string }} data
 */
export async function forgotPassword(data) {
  return api.post('/users/forgot-password', data);
}

/**
 * POST /api/v1/users/reset-password
 * @param {{ token: string, newPassword: string, confirmPassword: string }} data
 */
export async function resetPassword(data) {
  return api.post('/users/reset-password', data);
}
