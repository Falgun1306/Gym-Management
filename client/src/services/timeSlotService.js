import api from '@/lib/axios';

/**
 * Member Time Slot & Gym Space Management Service
 */

// ─── Member APIs ───
export async function getMyTimeSlots() {
  return api.get('/time-slots/my-slots');
}

export async function setMyTimeSlot(data) {
  return api.post('/time-slots/my-slots', data);
}

export async function updateMyTimeSlot(slotId, data) {
  return api.patch(`/time-slots/my-slots/${slotId}`, data);
}

export async function deleteMyTimeSlot(slotId) {
  return api.delete(`/time-slots/my-slots/${slotId}`);
}

// ─── Trainer / Admin Space & Equipment Management APIs ───
export async function getTrainerTimeSlotOverview(params = {}) {
  return api.get('/time-slots/overview', { params });
}

export async function createTimeSlotAdvisory(data) {
  return api.post('/time-slots/advisories', data);
}

export async function deleteTimeSlotAdvisory(advisoryId) {
  return api.delete(`/time-slots/advisories/${advisoryId}`);
}
