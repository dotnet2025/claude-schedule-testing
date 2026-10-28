import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Alert, Box, Button, TextField, Typography } from '@mui/material'
import BrandLogo from '../../components/BrandLogo'
import { brand } from '../../theme'
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
    if (!email.trim()) v.email = 'Email is required'
    else if (!/^\S+@\S+\.\S+$/.test(email)) v.email = 'Enter a valid email address'
    if (!password) v.password = 'Password is required'
    setErrors(v)
    if (Object.keys(v).length) return
    setBusy(true); setError(null)
    try { await login(email.trim(), password); nav(from, { replace: true }) }
    catch (err) { setError((err as Error).message) }
    finally { setBusy(false) }
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, bgcolor: 'background.default' }}>
      <Box sx={{ display: { xs: 'none', md: 'flex' }, flexDirection: 'column', justifyContent: 'space-between', p: 6, color: 'common.white',
        background: `linear-gradient(145deg, ${brand.colors.navy} 0%, ${brand.colors.navyLight} 60%, ${brand.colors.primary} 130%)` }}>
        <BrandLogo variant="light" height={40} />
        <Box>
          <Typography component="p" variant="h2" sx={{ maxWidth: 440 }}>{brand.tagline}</Typography>
          <Typography sx={{ mt: 2, maxWidth: 420, opacity: 0.85 }}>Manage pages, posts, media and your whole website from one secure workspace.</Typography>
        </Box>
        <Typography variant="body2" sx={{ opacity: 0.7 }}>&copy; {new Date().getFullYear()} {brand.name}</Typography>
      </Box>
      <Box sx={{ display: 'grid', placeItems: 'center', p: { xs: 2, sm: 4 } }}>
        <Box component="form" onSubmit={submit} noValidate sx={{ width: '100%', maxWidth: 420, bgcolor: 'background.paper', p: { xs: 3, sm: 5 }, borderRadius: 4, boxShadow: { xs: 1, md: 'none' }, border: { xs: 1, md: 0 }, borderColor: 'divider' }}>
          <Box sx={{ display: { md: 'none' }, mb: 3 }}><BrandLogo height={36} /></Box>
          <Typography component="h1" variant="h4" gutterBottom>Sign in to the CMS</Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>Enter your credentials to access the admin area.</Typography>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <TextField label="Email" type="email" fullWidth margin="normal" value={email} onChange={(e) => setEmail(e.target.value)}
            error={!!errors.email} helperText={errors.email} autoComplete="username" autoFocus />
          <TextField label="Password" type="password" fullWidth margin="normal" value={password} onChange={(e) => setPassword(e.target.value)}
            error={!!errors.password} helperText={errors.password} autoComplete="current-password" />
          <Button type="submit" variant="contained" fullWidth size="large" sx={{ mt: 3 }} disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</Button>
        </Box>
      </Box>
    </Box>
  )
}
