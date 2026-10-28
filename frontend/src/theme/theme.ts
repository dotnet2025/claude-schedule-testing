import { alpha, createTheme, type Shadows } from '@mui/material/styles'
import { brand } from './brand'
import { tokens } from './tokens'

const c = brand.colors

/** MUI needs exactly 25 elevation levels: 0 none, 1-2 card, 3-8 raised, 9-24 overlay. */
const shadows = ['none', ...Array.from({ length: 24 }, (_, i) => (i < 2 ? tokens.shadow.card : i < 8 ? tokens.shadow.raised : tokens.shadow.overlay))] as Shadows

/**
 * Central MUI theme. All colour, typography, shape, shadow and component overrides live here so
 * screens never need hard-coded colours.
 */
export const theme = createTheme({
  breakpoints: { values: { xs: 0, sm: 600, md: 900, lg: 1200, xl: 1536 } },
  palette: {
    mode: 'light',
    primary: { main: c.primary, light: c.primaryLight, dark: c.primaryDark, contrastText: '#ffffff' },
    secondary: { main: c.secondaryText, light: c.secondary, contrastText: '#ffffff' },
    success: { main: c.success },
    warning: { main: c.warning },
    error: { main: c.error },
    info: { main: c.info },
    background: { default: c.background, paper: c.surface },
    text: { primary: c.textPrimary, secondary: c.textSecondary },
    divider: c.border,
  },
  shape: { borderRadius: tokens.radius.md },
  typography: {
    fontFamily: brand.font.family,
    h1: { fontSize: '2.25rem', fontWeight: 700, letterSpacing: '-0.02em' },
    h2: { fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.015em' },
    h3: { fontSize: '1.5rem', fontWeight: 700 },
    h4: { fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.01em' },
    h5: { fontSize: '1.25rem', fontWeight: 600 },
    h6: { fontSize: '1.0625rem', fontWeight: 600 },
    subtitle1: { fontWeight: 600 },
    body2: { fontSize: '0.875rem' },
    button: { textTransform: 'none', fontWeight: 600, letterSpacing: 0 },
  },
  shadows: shadows,
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: c.background, WebkitFontSmoothing: 'antialiased' },
        'a:focus-visible, button:focus-visible, [role="button"]:focus-visible': { outline: `2px solid ${c.primaryLight}`, outlineOffset: 2 },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: tokens.radius.md,
          transition: `background-color ${tokens.transition}, box-shadow ${tokens.transition}, border-color ${tokens.transition}`,
          '@media (pointer: coarse)': { minHeight: tokens.touchTarget },
        },
        sizeMedium: { padding: '8px 18px' },
        sizeLarge: { padding: '11px 24px', fontSize: '1rem' },
        containedPrimary: { '&:hover': { backgroundColor: c.primaryDark, boxShadow: tokens.shadow.raised } },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: { transition: `background-color ${tokens.transition}`, '@media (pointer: coarse)': { minWidth: tokens.touchTarget, minHeight: tokens.touchTarget } },
      },
    },
    MuiToggleButton: { styleOverrides: { root: { textTransform: 'none', '@media (pointer: coarse)': { minHeight: tokens.touchTarget } } } },
    MuiPaper: { defaultProps: { elevation: 0 }, styleOverrides: { root: { backgroundImage: 'none' }, outlined: { borderColor: c.border } } },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: { root: { border: `1px solid ${c.border}`, borderRadius: tokens.radius.lg, boxShadow: tokens.shadow.card, transition: `box-shadow ${tokens.transition}, transform ${tokens.transition}` } },
    },
    MuiTextField: { defaultProps: { variant: 'outlined' } },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: c.surface,
          borderRadius: tokens.radius.md,
          transition: `box-shadow ${tokens.transition}`,
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: c.primaryLight },
          '&.Mui-focused': { boxShadow: `0 0 0 3px ${alpha(c.primaryLight, 0.25)}` },
        },
        input: { '@media (pointer: coarse)': { minHeight: 24 } },
      },
    },
    MuiChip: { styleOverrides: { root: { fontWeight: 600, borderRadius: tokens.radius.pill } } },
    MuiTableContainer: { styleOverrides: { root: { borderRadius: tokens.radius.lg } } },
    MuiTableHead: {
      styleOverrides: {
        root: { '& .MuiTableCell-root': { backgroundColor: alpha(c.primary, 0.04), color: c.textSecondary, fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' } },
      },
    },
    MuiTableCell: { styleOverrides: { root: { borderColor: c.border, padding: '12px 16px' } } },
    MuiTableRow: { styleOverrides: { root: { transition: `background-color ${tokens.transition}`, '&.MuiTableRow-hover:hover': { backgroundColor: alpha(c.primary, 0.04) } } } },
    MuiDialog: { styleOverrides: { paper: { borderRadius: tokens.radius.lg, boxShadow: tokens.shadow.overlay } } },
    MuiDialogTitle: { styleOverrides: { root: { fontWeight: 700, fontSize: '1.125rem' } } },
    MuiDialogActions: { styleOverrides: { root: { padding: '12px 24px 20px', gap: 8 } } },
    MuiAlert: { styleOverrides: { root: { borderRadius: tokens.radius.md } } },
    MuiTooltip: { styleOverrides: { tooltip: { backgroundColor: c.navy, fontSize: '0.75rem' } } },
    MuiListItemButton: {
      styleOverrides: { root: { transition: `background-color ${tokens.transition}`, '@media (pointer: coarse)': { minHeight: tokens.touchTarget } } },
    },
    MuiPagination: { defaultProps: { color: 'primary', shape: 'rounded' } },
  },
})
