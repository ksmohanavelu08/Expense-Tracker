import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';

/**
 * Format currency amount with the user's preferred currency symbol
 */
export const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount));
};

/**
 * Format a date string into a human-friendly format
 */
export const formatDate = (dateStr, formatStr = 'MMM dd, yyyy') => {
  try {
    const date = new Date(dateStr);
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, formatStr);
  } catch {
    return dateStr;
  }
};

/**
 * Format date for input[type="date"] value (YYYY-MM-DD)
 */
export const formatDateForInput = (dateStr) => {
  try {
    return format(new Date(dateStr), 'yyyy-MM-dd');
  } catch {
    return '';
  }
};

/**
 * Get relative time (e.g. "2 hours ago")
 */
export const timeAgo = (dateStr) => {
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
  } catch {
    return dateStr;
  }
};

/**
 * Category color mapping for charts and UI badges
 */
export const CATEGORY_COLORS = {
  'Food & Dining': '#f5894a',
  'Transport': '#42a8f5',
  'Housing & Rent': '#7c6af7',
  'Healthcare': '#3dd68c',
  'Entertainment': '#f56bb3',
  'Shopping': '#f5c842',
  'Education': '#42d8d0',
  'Travel': '#9d8fff',
  'Utilities': '#f25c5c',
  'Investments': '#3dd68c',
  'Income': '#3dd68c',
  'Other': '#8888a0',
};

/**
 * Get category color with fallback
 */
export const getCategoryColor = (category) => {
  return CATEGORY_COLORS[category] || '#8888a0';
};

/**
 * Category emoji mapping
 */
export const CATEGORY_ICONS = {
  'Food & Dining': '🍽️',
  'Transport': '🚗',
  'Housing & Rent': '🏠',
  'Healthcare': '💊',
  'Entertainment': '🎬',
  'Shopping': '🛍️',
  'Education': '📚',
  'Travel': '✈️',
  'Utilities': '⚡',
  'Investments': '📈',
  'Income': '💰',
  'Other': '📦',
};

export const getCategoryIcon = (category) => {
  return CATEGORY_ICONS[category] || '📦';
};

/**
 * List of all available categories
 */
export const CATEGORIES = [
  'Food & Dining',
  'Transport',
  'Housing & Rent',
  'Healthcare',
  'Entertainment',
  'Shopping',
  'Education',
  'Travel',
  'Utilities',
  'Investments',
  'Income',
  'Other',
];

/**
 * Truncate text to a max length with ellipsis
 */
export const truncate = (str, maxLen = 50) => {
  if (!str) return '';
  return str.length > maxLen ? str.slice(0, maxLen) + '...' : str;
};

/**
 * Debounce function for search inputs
 */
export const debounce = (fn, delay) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

/**
 * Get month name from month number (1-12)
 */
export const getMonthName = (month) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[month - 1] || '';
};
