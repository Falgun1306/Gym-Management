/**
 * Constants mapping backend enum values to display labels and colors.
 * These directly mirror the Prisma schema enums in server/prisma/schema.prisma.
 */

// ── Roles ──
export const ROLES = {
  ADMIN: 'Admin',
  TRAINER: 'Trainer',
  MEMBER: 'Member',
};

// ── Membership Status ──
export const MEMBERSHIP_STATUS = {
  PENDING: { label: 'Pending', color: 'bg-status-pending text-white' },
  ACTIVE: { label: 'Active', color: 'bg-status-active text-white' },
  EXPIRED: { label: 'Expired', color: 'bg-status-expired text-white' },
  CANCELLED: { label: 'Cancelled', color: 'bg-status-cancelled text-white' },
  SUSPENDED: { label: 'Suspended', color: 'bg-status-suspended text-white' },
};

// ── Payment Status ──
export const PAYMENT_STATUS = {
  PENDING: { label: 'Pending', color: 'bg-status-pending text-white' },
  SUCCESS: { label: 'Success', color: 'bg-status-success text-white' },
  FAILED: { label: 'Failed', color: 'bg-status-failed text-white' },
  REFUNDED: { label: 'Refunded', color: 'bg-status-refunded text-white' },
};

// ── Equipment Status ──
export const EQUIPMENT_STATUS = {
  AVAILABLE: { label: 'Available', color: 'bg-status-active text-white' },
  IN_USE: { label: 'In Use', color: 'bg-indigo-600 text-white' },
  UNDER_MAINTENANCE: { label: 'Under Maintenance', color: 'bg-status-maintenance text-white' },
  DAMAGED: { label: 'Damaged', color: 'bg-status-expired text-white' },
  RETIRED: { label: 'Retired', color: 'bg-status-cancelled text-white' },
};

// ── Complaint Status ──
export const COMPLAINT_STATUS = {
  OPEN: { label: 'Open', color: 'bg-status-expired text-white' },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-status-pending text-white' },
  RESOLVED: { label: 'Resolved', color: 'bg-status-active text-white' },
  REJECTED: { label: 'Rejected', color: 'bg-status-cancelled text-white' },
};

// ── Application Status ──
export const APPLICATION_STATUS = {
  PENDING: { label: 'Pending', color: 'bg-status-pending text-white' },
  APPROVED: { label: 'Approved', color: 'bg-status-active text-white' },
  REJECTED: { label: 'Rejected', color: 'bg-status-expired text-white' },
};

// ── Class Booking Status ──
export const CLASS_BOOKING_STATUS = {
  BOOKED: { label: 'Booked', color: 'bg-indigo-600 text-white' },
  CANCELLED: { label: 'Cancelled', color: 'bg-status-cancelled text-white' },
  ATTENDED: { label: 'Attended', color: 'bg-status-active text-white' },
  NO_SHOW: { label: 'No Show', color: 'bg-status-expired text-white' },
};

// ── Gender ──
export const GENDER = {
  MALE: 'Male',
  FEMALE: 'Female',
  OTHER: 'Other',
};

// ── Muscle Groups ──
export const MUSCLE_GROUPS = {
  CHEST: 'Chest',
  BACK: 'Back',
  SHOULDERS: 'Shoulders',
  BICEPS: 'Biceps',
  TRICEPS: 'Triceps',
  LEGS: 'Legs',
  ABS: 'Abs',
  CARDIO: 'Cardio',
  FULL_BODY: 'Full Body',
};

// ── Exercise Difficulty ──
export const EXERCISE_DIFFICULTY = {
  BEGINNER: { label: 'Beginner', color: 'bg-status-active text-white' },
  INTERMEDIATE: { label: 'Intermediate', color: 'bg-status-pending text-white' },
  ADVANCED: { label: 'Advanced', color: 'bg-status-expired text-white' },
};

// ── Trainer Specialization ──
export const TRAINER_SPECIALIZATION = {
  STRENGTH: 'Strength',
  BODYBUILDING: 'Bodybuilding',
  WEIGHT_LOSS: 'Weight Loss',
  CROSSFIT: 'CrossFit',
  YOGA: 'Yoga',
  CARDIO: 'Cardio',
  POWERLIFTING: 'Powerlifting',
  FUNCTIONAL: 'Functional',
  GENERAL_FITNESS: 'General Fitness',
};

// ── Payment Methods ──
export const PAYMENT_METHODS = {
  CASH: 'Cash',
  UPI: 'UPI',
  CREDIT_CARD: 'Credit Card',
  DEBIT_CARD: 'Debit Card',
  NET_BANKING: 'Net Banking',
  ONLINE: 'Online',
};

// ── Notification Types ──
export const NOTIFICATION_TYPES = {
  MEMBERSHIP: 'Membership',
  PAYMENT: 'Payment',
  DIET: 'Diet',
  WORKOUT: 'Workout',
  CLASS: 'Class',
  GENERAL: 'General',
};

// ── Discount Types ──
export const DISCOUNT_TYPES = {
  PERCENTAGE: 'Percentage',
  FIXED_AMOUNT: 'Fixed Amount',
  FREE_DAYS: 'Free Days',
};

// ── Days of Week (for trainer schedule) ──
export const DAYS_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];
