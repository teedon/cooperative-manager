/**
 * Date formatting utilities for consistent date display throughout the app
 */

/**
 * Format a date string to a localized date display
 * @param dateString - ISO date string or date-only string (YYYY-MM-DD)
 * @param options - Intl.DateTimeFormatOptions for customization
 */
export const formatDate = (dateString: string, options?: Intl.DateTimeFormatOptions): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, options);
};

/**
 * Format a date string to show date and time
 */
export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString();
};

/**
 * Get a date string in YYYY-MM-DD format for form inputs
 */
export const toDateInputValue = (date: Date = new Date()): string => {
  return date.toISOString().split('T')[0];
};

/**
 * Format relative time (e.g., "2 days ago", "in 3 hours")
 */
export const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (Math.abs(diffDays) === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Tomorrow';
  } else if (diffDays === -1) {
    return 'Yesterday';
  } else if (diffDays > 0) {
    return `In ${diffDays} days`;
  } else {
    return `${Math.abs(diffDays)} days ago`;
  }
};

/**
 * Format currency amount in Nigerian Naira
 */
export const formatCurrency = (amount: number, currency = 'NGN'): string => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Format allocation method enum to display text
 */
export const formatAllocationMethod = (method: string): string => {
  const methodMap: Record<string, string> = {
    first_come: 'First Come, First Served',
    proportional: 'Proportional',
    admin_override: 'Admin Override',
  };
  return methodMap[method] || method.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
};

/**
 * Format loan/group buy status to display text
 */
export const formatStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    disbursed: 'Disbursed',
    repaying: 'Repaying',
    completed: 'Completed',
    defaulted: 'Defaulted',
    verified: 'Verified',
    open: 'Open',
    closed: 'Closed',
    finalized: 'Finalized',
    cancelled: 'Cancelled',
    active: 'Active',
    upcoming: 'Upcoming',
    overdue: 'Overdue',
  };
  return statusMap[status] || status.charAt(0).toUpperCase() + status.slice(1);
};
