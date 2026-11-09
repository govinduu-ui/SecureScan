export const SEVERITY_LEVELS = ['critical', 'high', 'medium', 'low', 'info'];

export const SEVERITY_COLORS = {
  critical: { text: 'text-cyber-critical', bg: 'bg-cyber-critical/10', border: 'border-cyber-critical/30', hex: '#F43F5E' },
  high: { text: 'text-cyber-critical', bg: 'bg-cyber-critical/10', border: 'border-cyber-critical/30', hex: '#F43F5E' },
  medium: { text: 'text-cyber-warning', bg: 'bg-cyber-warning/10', border: 'border-cyber-warning/30', hex: '#F59E0B' },
  low: { text: 'text-cyber-info', bg: 'bg-cyber-info/10', border: 'border-cyber-info/30', hex: '#38BDF8' },
  info: { text: 'text-cyber-blue', bg: 'bg-cyber-blue/10', border: 'border-cyber-blue/30', hex: '#2563EB' },
};

export const SCAN_STATUSES = {
  pending: 'Pending',
  running: 'Running',
  completed: 'Completed',
  failed: 'Failed',
};

export const INSPECTION_PROFILES = [
  { value: 'passive', label: 'Passive Scan', description: 'Non-intrusive analysis of headers, SSL, and configuration' },
  { value: 'standard', label: 'Standard Scan', description: 'Comprehensive security assessment' },
  { value: 'aggressive', label: 'Deep Scan', description: 'Thorough analysis including active probing' },
];

export const DIAGNOSTIC_CHECKS = [
  { id: 'dns_resolution', name: 'DNS Resolution', category: 'Network' },
  { id: 'ssl_certificate', name: 'SSL/TLS Certificate', category: 'Encryption' },
  { id: 'ssl_protocols', name: 'Protocol Versions', category: 'Encryption' },
  { id: 'hsts', name: 'HTTP Strict Transport Security', category: 'Headers' },
  { id: 'content_security_policy', name: 'Content Security Policy', category: 'Headers' },
  { id: 'x_frame_options', name: 'X-Frame-Options', category: 'Headers' },
  { id: 'x_content_type', name: 'X-Content-Type-Options', category: 'Headers' },
  { id: 'referrer_policy', name: 'Referrer Policy', category: 'Headers' },
  { id: 'permissions_policy', name: 'Permissions Policy', category: 'Headers' },
  { id: 'cors_policy', name: 'CORS Configuration', category: 'Headers' },
  { id: 'cookies', name: 'Cookie Security', category: 'Session' },
  { id: 'mixed_content', name: 'Mixed Content', category: 'Content' },
  { id: 'server_info', name: 'Server Information Disclosure', category: 'Information' },
];

export const SCORE_CATEGORIES = [
  { key: 'ssl', label: 'SSL/TLS' },
  { key: 'headers', label: 'Security Headers' },
  { key: 'cookies', label: 'Cookie Security' },
  { key: 'content', label: 'Content Security' },
  { key: 'server', label: 'Server Configuration' },
];

export const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
  { path: '/scanner', label: 'Web Scanner', icon: 'Radar' },
  { path: '/scans', label: 'Scan History', icon: 'History' },
  { path: '/reports', label: 'Reports', icon: 'FileText' },
  { path: '/settings', label: 'Settings', icon: 'Settings' },
];
