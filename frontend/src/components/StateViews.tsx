import { Alert, Box, CircularProgress, Typography } from '@mui/material'

export const Loading = ({ label = 'Loading…' }: { label?: string }) => (
  <Box role="status" aria-live="polite" sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 4, justifyContent: 'center' }}>
    <CircularProgress size={24} /> <Typography>{label}</Typography>
  </Box>
)
export const ErrorView = ({ message }: { message: string }) => <Alert severity="error" sx={{ my: 2 }}>{message}</Alert>
export const Empty = ({ message }: { message: string }) => (
  <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}><Typography>{message}</Typography></Box>
)
