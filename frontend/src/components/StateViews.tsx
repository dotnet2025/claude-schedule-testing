import type { ReactNode } from 'react'
import { Alert, Box, Button, CircularProgress, Skeleton, Typography } from '@mui/material'
import InboxOutlined from '@mui/icons-material/InboxOutlined'

export const Loading = ({ label = 'Loading…' }: { label?: string }) => (
  <Box role="status" aria-live="polite" sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 4, justifyContent: 'center', color: 'text.secondary' }}>
    <CircularProgress size={24} /> <Typography>{label}</Typography>
  </Box>
)

export const ErrorView = ({ message, onRetry }: { message: string; onRetry?: () => void }) => (
  <Alert severity="error" sx={{ my: 2 }} action={onRetry ? <Button color="inherit" size="small" onClick={onRetry}>Retry</Button> : undefined}>{message}</Alert>
)

export const Empty = ({ message, action, icon }: { message: string; action?: ReactNode; icon?: ReactNode }) => (
  <Box sx={{ p: { xs: 4, md: 6 }, textAlign: 'center', color: 'text.secondary', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
    <Box sx={{ width: 56, height: 56, borderRadius: '50%', bgcolor: 'action.hover', display: 'grid', placeItems: 'center', color: 'text.secondary' }} aria-hidden>
      {icon ?? <InboxOutlined />}
    </Box>
    <Typography>{message}</Typography>
    {action}
  </Box>
)

/** Placeholder rows shown while a table loads (announced via a visually hidden status). */
export function TableSkeleton({ rows = 5, label = 'Loading…' }: { rows?: number; label?: string }) {
  return (
    <Box role="status" aria-live="polite" sx={{ p: 2 }}>
      <Box component="span" sx={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>{label}</Box>
      {Array.from({ length: rows }, (_, i) => <Skeleton key={i} variant="rounded" height={40} sx={{ mb: 1 }} />)}
    </Box>
  )
}
