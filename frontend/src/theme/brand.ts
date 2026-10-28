/**
 * Single source of truth for branding. Replace values here to re-brand the whole CMS.
 *
 * Brand: WeblineIndia (https://www.weblineindia.com/). Colour #2196f3 is the `theme-color`
 * published on the official site; the other palette values are our own derived shades chosen
 * to meet WCAG AA contrast on white (see README "Design system").
 *
 * LOGO: the official logo (https://www.weblineindia.com/assets/img/weblineindia-logo-dark.svg)
 * could not be downloaded in the build environment (egress blocked, see docs/known-issues.md KI-013),
 * so a clearly marked placeholder is used. Drop the real file into `public/brand/` and change `logo.src`.
 */
export const brand = {
  name: 'WeblineIndia',
  productName: 'WeblineIndia CMS',
  tagline: 'Content management, simplified.',
  siteUrl: 'https://www.weblineindia.com/',
  documentTitle: 'WeblineIndia CMS',
  logo: {
    /** Logo for light backgrounds. */
    src: '/brand/logo-placeholder.svg',
    /** Logo for dark backgrounds (sidebar / login hero). */
    srcLight: '/brand/logo-placeholder-white.svg',
    alt: 'WeblineIndia',
    /** Natural aspect ratio (w/h). Rendered with an explicit height only, so it is never distorted. */
    aspect: 200 / 48,
    isPlaceholder: true,
  },
  favicon: '/favicon.svg',
  colors: {
    primary: '#1565c0', // 5.75:1 on white
    primaryLight: '#2196f3', // official brand blue (accent, large text / graphics only)
    primaryDark: '#0d47a1',
    secondary: '#ef6c00', // 3.3:1 on white; use for non-text accents. Text uses secondaryText
    secondaryText: '#b34700', // 5.3:1 on white
    navy: '#0b1f3a', // sidebar / login hero background
    navyLight: '#13315c',
    background: '#f4f7fb',
    surface: '#ffffff',
    textPrimary: '#0b1f3a',
    textSecondary: '#475569', // 7.5:1 on white
    border: '#e2e8f0',
    success: '#2e7d32',
    warning: '#b45309',
    error: '#c62828',
    info: '#0277bd',
  },
  font: {
    family: '"Inter", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
} as const

export type Brand = typeof brand
