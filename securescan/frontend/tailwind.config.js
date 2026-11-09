/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'cyber-base': '#F8FAFC',
        'cyber-raised': '#FFFFFF',
        'cyber-overlay': '#F1F5F9',
        'cyber-border': '#E2E8F0',
        'cyber-border-active': '#CBD5E1',
        'cyber-cyan': '#4F46E5', // Charming Indigo Accent
        'cyber-blue': '#2563EB',
        'cyber-violet': '#7C3AED',
        'cyber-critical': '#E11D48',
        'cyber-warning': '#D97706',
        'cyber-info': '#4F46E5',
        'cyber-success': '#10B981',
        'cyber-text': '#0F172A',
        'cyber-text-secondary': '#475569',
        'cyber-text-muted': '#64748B',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '8px',
        md: '10px',
        lg: '12px',
        xl: '16px',
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};
