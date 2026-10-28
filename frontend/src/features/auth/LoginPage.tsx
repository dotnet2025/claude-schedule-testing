import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Alert, Box, Button, Paper, TextField, Typography } from '@mui/material'
import { useAuth } from '../../app/AuthContext'

export default function LoginPage() {
  const { user, login } = useAuth()
  const nav = useNavigate()
  const loc = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const from = (loc.state as { from?: string } | null)?.from ?? '/admin'

  if (user) return <Navigate to={from} replace />

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (busy) return
    const v: typeof errors = {}
    if (!email.trim()) v.email = 'Email or username is required'
    if (!password) v.password = 'Password is required'
    setErrors(v)
    if (Object.keys(v).length) return
    setBusy(true); setError(null)
    try { await login(email.trim(), password); nav(from, { replace: true }) }
    catch (err) { setError((err as Error).message) }
    finally { setBusy(false) }
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', p: 2, bgcolor: 'grey.100' }}>
      <Paper component="form" onSubmit={submit} noValidate sx={{ p: 4, width: '100%', maxWidth: 400 }}>
        <Typography component="h1" variant="h5" gutterBottom>Sign in to the CMS</Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <TextField label="Email or username" type="text" fullWidth margin="normal" value={email} onChange={(e) => setEmail(e.target.value)}
          error={!!errors.email} helperText={errors.email} autoComplete="username" autoFocus />
        <TextField label="Password" type="password" fullWidth margin="normal" value={password} onChange={(e) => setPassword(e.target.value)}
          error={!!errors.password} helperText={errors.password} autoComplete="current-password" />
        <Button type="submit" variant="contained" fullWidth size="large" sx={{ mt: 2 }} disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</Button>
      </Paper>
    </Box>
  )
}
