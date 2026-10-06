const base = { width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true }

export const IconeAtelier = () => (
  <svg {...base}><path d="M3 15l9 5 9-5-9-5-9 5z" /><path d="M12 10V4" /><circle cx="12" cy="5" r="2.2" /></svg>
)
export const IconeAgents = () => (
  <svg {...base}><circle cx="9" cy="8" r="3.2" /><path d="M3.5 19c.8-3.2 3-5 5.5-5s4.7 1.8 5.5 5" /><circle cx="17" cy="9" r="2.4" /><path d="M16 14.2c2.3.2 3.9 1.8 4.5 4.8" /></svg>
)
export const IconePlus = () => (
  <svg {...base} strokeWidth={2.4}><path d="M12 5v14M5 12h14" /></svg>
)
export const IconeGraine = () => (
  <svg {...base} width={18} height={18}><path d="M12 20c-4-2-6-5.5-6-9 0-3 2.5-6 6-7 3.5 1 6 4 6 7 0 3.5-2 7-6 9z" fill="currentColor" stroke="none" /><path d="M12 8v9" stroke="#FBF8F1" /></svg>
)
export const IconeElan = () => (
  <svg {...base} width={18} height={18}><path d="M4 16c3-6 6-8 9-8M13 8l-1 4M13 8l-4-.5" /><circle cx="18" cy="6" r="2.5" fill="currentColor" stroke="none" /></svg>
)
