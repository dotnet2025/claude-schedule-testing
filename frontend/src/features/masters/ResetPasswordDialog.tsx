import { useEffect, useState } from 'react'
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, TextField } from '@mui/material'
import { usersApi } from '../../api/endpoints'
import type { User } from '../../types'

interface Props { user: User | null; onClose: () => void; onDone: () => void }

export default function ResetPasswordDialog({ user, onClose, onDone }: Props) {
  const [pw, setPw] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  useEffect(() => { setPw(''); setConfirm(''); setError(null) }, [user])

  const submit = async () => {
    if (!user || busy) return
    if (pw.length < 8 || !/[A-Za-z]/.test(pw) || !/\d/.test(pw)) return setError('Password must be at least 8 characters and contain a letter and a digit.')
    if (pw !== confirm) return setError('Passwords do not match.')
    setBusy(true); setError(null)
    try { await usersApi.resetPassword(user.id, pw); setPw(''); setConfirm(''); onDone() }
    catch (e) { setError((e as Error).message) } finally { setBusy(false) }
  }

  return (
    <Dialog open={!!user} onClose={onClose} fullWidth maxWidth="xs" aria-labelledby="reset-title">
      <DialogTitle id="reset-title">Reset password</DialogTitle>
      <DialogContent>
        <DialogContentText>Set a new password for {user?.displayName} ({user?.email}). All of their active sessions will be signed out.</DialogContentText>
        {error && <Alert severity="error" sx={{ mt: 1 }}>{error}</Alert>}
        <TextField label="New password" type="password" fullWidth margin="dense" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" />
        <TextField label="Confirm new password" type="password" fullWidth margin="dense" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={busy}>Cancel</Button>
        <Button variant="contained" onClick={submit} disabled={busy}>{busy ? 'Resetting…' : 'Reset password'}</Button>
      </DialogActions>
    </Dialog>
  )
}
