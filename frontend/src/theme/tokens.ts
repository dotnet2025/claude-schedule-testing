/** Non-colour design tokens (spacing scale, radii, shadows, layout sizes). Colours live in brand.ts. */
export const tokens = {
  radius: { sm: 6, md: 10, lg: 14, pill: 999 },
  shadow: {
    card: '0 1px 2px rgba(11, 31, 58, 0.06), 0 1px 3px rgba(11, 31, 58, 0.08)',
    raised: '0 4px 12px rgba(11, 31, 58, 0.10)',
    overlay: '0 12px 32px rgba(11, 31, 58, 0.18)',
  },
  layout: { sidebarWidth: 264, sidebarCollapsedWidth: 76, topBarHeight: 64, contentMaxWidth: 1440 },
  /** Minimum interactive size on touch devices (WCAG 2.5.5 / Apple HIG: 44px). */
  touchTarget: 44,
  transition: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
} as const
