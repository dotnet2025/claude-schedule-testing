import type { ReactNode } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { Box, Breadcrumbs, Link, Stack, Typography } from '@mui/material'
import NavigateNext from '@mui/icons-material/NavigateNext'

export interface Crumb { label: string; to?: string }
interface Props { title: ReactNode; subtitle?: ReactNode; breadcrumbs?: Crumb[]; actions?: ReactNode; badge?: ReactNode }

/** Page title + optional breadcrumb trail + primary actions. The title is always the page's single <h1>. */
export default function PageHeader({ title, subtitle, breadcrumbs, actions, badge }: Props) {
  return (
    <Box sx={{ mb: { xs: 2, md: 3 } }}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumbs aria-label="Breadcrumb" separator={<NavigateNext fontSize="small" />} sx={{ mb: 1, '& .MuiBreadcrumbs-ol': { flexWrap: 'wrap' } }}>
          {breadcrumbs.map((c, i) => c.to && i < breadcrumbs.length - 1
            ? <Link key={c.label + i} component={RouterLink} to={c.to} underline="hover" color="text.secondary" variant="body2">{c.label}</Link>
            : <Typography key={c.label + i} variant="body2" color="text.primary" aria-current="page">{c.label}</Typography>)}
        </Breadcrumbs>
      )}
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} spacing={2}>
        <Box sx={{ minWidth: 0 }}>
          <Stack direction="row" alignItems="center" spacing={1.5} useFlexGap flexWrap="wrap">
            <Typography component="h1" variant="h4" sx={{ overflowWrap: 'anywhere' }}>{title}</Typography>
            {badge}
          </Stack>
          {subtitle && <Typography color="text.secondary" sx={{ mt: 0.5 }}>{subtitle}</Typography>}
        </Box>
        {actions && <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ flexShrink: 0 }}>{actions}</Stack>}
      </Stack>
    </Box>
  )
}
