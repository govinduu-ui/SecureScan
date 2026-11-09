/**
 * Format a date string to a readable format.
 */
export function formatDate(dateStr) {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format a date string to include time.
 */
export function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format a relative time from now.
 */
export function formatRelativeTime(dateStr) {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateStr);
}

/**
 * Get letter grade from score.
 */
export function getGrade(score) {
  if (score == null) return '—';
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

/**
 * Get color class for a grade.
 */
export function getGradeColor(grade) {
  const colors = {
    A: 'text-cyber-success',
    B: 'text-cyber-cyan',
    C: 'text-cyber-warning',
    D: 'text-cyber-critical',
    F: 'text-cyber-critical',
  };
  return colors[grade] || 'text-cyber-text-muted';
}

/**
 * Get color class for score value.
 */
export function getScoreColor(score) {
  if (score == null) return 'text-cyber-text-muted';
  if (score >= 90) return 'text-cyber-success';
  if (score >= 80) return 'text-cyber-cyan';
  if (score >= 70) return 'text-cyber-warning';
  return 'text-cyber-critical';
}

/**
 * Get color hex for score value.
 */
export function getScoreHex(score) {
  if (score == null) return '#64748B';
  if (score >= 90) return '#10B981';
  if (score >= 80) return '#00E5FF';
  if (score >= 70) return '#F59E0B';
  return '#F43F5E';
}

/**
 * Get scan status display info.
 */
export function getScanStatusInfo(status) {
  const map = {
    pending: { label: 'Pending', color: 'text-cyber-text-muted', bg: 'bg-cyber-text-muted/10' },
    running: { label: 'Running', color: 'text-cyber-cyan', bg: 'bg-cyber-cyan/10' },
    completed: { label: 'Completed', color: 'text-cyber-success', bg: 'bg-cyber-success/10' },
    failed: { label: 'Failed', color: 'text-cyber-critical', bg: 'bg-cyber-critical/10' },
  };
  return map[status] || map.pending;
}

/**
 * Truncate a URL for display.
 */
export function truncateUrl(url, maxLen = 40) {
  if (!url) return '—';
  if (url.length <= maxLen) return url;
  return url.substring(0, maxLen) + '…';
}

/**
 * Extract domain from URL.
 */
export function extractDomain(url) {
  if (!url) return '—';
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

/**
 * Format number with commas.
 */
export function formatNumber(num) {
  if (num == null) return '0';
  return num.toLocaleString();
}

/**
 * Format percentage.
 */
export function formatPercent(value, decimals = 0) {
  if (value == null) return '0%';
  return `${value.toFixed(decimals)}%`;
}

/**
 * Capitalize first letter.
 */
export function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Get severity order for sorting (higher = more severe).
 */
export function severityOrder(severity) {
  const order = { critical: 5, high: 4, medium: 3, low: 2, info: 1 };
  return order[severity?.toLowerCase()] || 0;
}
