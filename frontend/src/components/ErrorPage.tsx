import type { ReactNode } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { Box, Button, Typography } from '@mui/material'
import LockOutlined from '@mui/icons-material/LockOutlined'
import SearchOff from '@mui/icons-material/SearchOff'
import ErrorOutline from '@mui/icons-material/ErrorOutline'

interface Props { code: 403 | 404 | 500; title: string; message: ReactNode; home?: string; homeLabel?: string }

/** Full-width error state used for 403 / 404 / 500 screens (admin and public). */
export default function ErrorPage({ code, title, message, home = '/', homeLabel = 'Back to home' }: Props) {
  const Icon = code === 403 ? LockOutlined : code === 404 ? SearchOff : ErrorOutline
  return (
    <Box sx={{ textAlign: 'center', py: { xs: 6, md: 10 }, px: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
      <Box aria-hidden sx={{ width: 88, height: 88, borderRadius: '50%', display: 'grid', placeItems: 'center', bgcolor: 'action.hover', color: 'primary.main' }}><Icon sx={{ fontSize: 44 }} /></Box>
      <Typography component="h1" variant="h4">{code} – {title}</Typography>
      <Typography color="text.secondary" sx={{ maxWidth: 480 }}>{message}</Typography>
      <Button component={RouterLink} to={home} variant="contained" sx={{ mt: 2 }}>{homeLabel}</Button>
    </Box>
  )
}
