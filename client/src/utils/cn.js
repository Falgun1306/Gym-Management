import clsx from 'clsx';

/**
 * Utility to merge Tailwind classes conditionally.
 * Combines clsx for conditional class names.
 *
 * @example
 *   cn('px-4 py-2', isActive && 'bg-accent-600', className)
 */
export function cn(...inputs) {
  return clsx(inputs);
}
