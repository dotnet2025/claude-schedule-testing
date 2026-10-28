import { useState, type FormEvent } from 'react'
import { Alert, Avatar, Box, Button, Paper, Stack, TextField, Typography } from '@mui/material'
import Grid from '@mui/material/Grid'
import { authApi } from '../../api/endpoints'
import { useAuth } from '../../app/AuthContext'
import { useToast } from '../../app/Toast'
import PageHeader from '../../components/PageHeader'
import StatusChip from '../../components/StatusChip'

/** Mirrors the backend rule: at least 8 characters containing a letter and a digit (max 128). */
export function validatePasswordChange(current: string, next: string, confirm: string) {
  const e: { current?: string; next?: string; confirm?: string } = {}
  if (!current) e.current = 'Current password is required'
  if (!next) e.next = 'New password is required'
  else if (next.length < 8) e.next = 'Password must be at least 8 characters'
  else if (next.length > 128) e.next = 'Password must be 128 characters or fewer'
  else if (!/[A-Za-z]/.test(next) || !/\d/.test(next)) e.next = 'Password must contain a letter and a digit'
  if (!e.next && confirm !== next) e.confirm = 'Passwords do not match'
  return e
}

export default function ProfilePage() {
  const { user } = useAuth()
  const toast = useToast()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState<ReturnType<typeof validatePasswordChange>>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (busy) return
    const v = validatePasswordChange(current, next, confirm)
    setErrors(v); setServerError(null)
    if (Object.keys(v).length) return
    setBusy(true)
    try {
      await authApi.changePassword(current, next)
      toast('Password changed')
      setCurrent(''); setNext(''); setConfirm('')
    } catch (err) { setServerError((err as Error).message) } finally { setBusy(false) }
  }

  if (!user) return null
  return (
    <>
      <PageHeader title="My profile" subtitle="Your account details and password." breadcrumbs={[{ label: 'Dashboard', to: '/admin' }, { label: 'My profile' }]} />
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 5, lg: 4 }}>
          <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, textAlign: 'center' }}>
            <Avatar sx={{ width: 72, height: 72, mx: 'auto', mb: 2, bgcolor: 'primary.main', fontSize: '1.75rem' }}>{user.displayName.charAt(0).toUpperCase()}</Avatar>
            <Typography variant="h6" sx={{ overflowWrap: 'anywhere' }}>{user.displayName}</Typography>
            <Typography color="text.secondary" sx={{ overflowWrap: 'anywhere', mb: 1.5 }}>{user.email}</Typography>
            <StatusChip label={user.role} tone={user.role === 'Admin' ? 'info' : 'default'} />
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 7, lg: 8 }}>
          <Paper component="form" onSubmit={submit} noValidate variant="outlined" aria-label="Change password" sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, maxWidth: 560 }}>
            <Typography variant="h6" component="h2" gutterBottom>Change password</Typography>
            {serverError && <Alert severity="error" sx={{ mb: 2 }}>{serverError}</Alert>}
            <Stack spacing={2}>
              <TextField label="Current password" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} error={!!errors.current} helperText={errors.current} autoComplete="current-password" />
              <TextField label="New password" type="password" value={next} onChange={(e) => setNext(e.target.value)} error={!!errors.next}
                helperText={errors.next ?? 'At least 8 characters, including a letter and a digit.'} autoComplete="new-password" />
              <TextField label="Confirm new password" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} error={!!errors.confirm} helperText={errors.confirm} autoComplete="new-password" />
              <Box><Button type="submit" variant="contained" disabled={busy}>{busy ? 'Saving…' : 'Update password'}</Button></Box>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </>
  )
}
