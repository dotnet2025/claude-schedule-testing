import { useEffect, useState } from 'react'
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, TextField, Typography, Box } from '@mui/material'
import Grid from '@mui/material/Grid'
import { companiesApi, usersApi } from '../../api/endpoints'
import type { Company, Role, User } from '../../types'
import type { DialogMode } from './CompanyFormDialog'

interface Form { firstName: string; lastName: string; username: string; email: string; phone: string; companyId: string; role: Role; password: string }
const empty: Form = { firstName: '', lastName: '', username: '', email: '', phone: '', companyId: '', role: 'Editor', password: '' }

export function validateUser(f: Form, creating: boolean): Record<string, string> {
  const e: Record<string, string> = {}
  if (!f.firstName.trim()) e.firstName = 'First name is required'
  if (!f.lastName.trim()) e.lastName = 'Last name is required'
  if (!f.username.trim()) e.username = 'Username is required'
  else if (!/^[A-Za-z0-9._-]{3,100}$/.test(f.username.trim())) e.username = '3–100 characters: letters, digits, ".", "_" or "-"'
  if (!f.email.trim()) e.email = 'Email is required'
  else if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) e.email = 'Enter a valid email address'
  if (f.phone.length > 25) e.phone = 'Maximum 25 characters'
  if (creating && (f.password.length < 8 || !/[A-Za-z]/.test(f.password) || !/\d/.test(f.password))) e.password = 'At least 8 characters, with a letter and a digit'
  return e
}

interface Props { open: boolean; mode: DialogMode; user: User | null; onClose: () => void; onSaved: (u: User) => void }

export default function UserFormDialog({ open, mode, user, onClose, onSaved }: Props) {
  const [form, setForm] = useState<Form>(empty)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [companies, setCompanies] = useState<Company[]>([])
  const readOnly = mode === 'view'

  useEffect(() => {
    if (!open) return
    setErrors({}); setFormError(null)
    setForm(user && mode !== 'create'
      ? { firstName: user.firstName ?? '', lastName: user.lastName ?? '', username: user.username ?? '', email: user.email, phone: user.phone ?? '', companyId: user.companyId ? String(user.companyId) : '', role: user.role, password: '' }
      : empty)
    let cancelled = false
    companiesApi.list({ isActive: true, pageSize: 100, sortBy: 'name' }).then((r) => { if (!cancelled) setCompanies(r.items) }).catch(() => { /* optional list */ })
    return () => { cancelled = true }
  }, [open, user, mode])

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value })
  const field = (k: keyof Form, label: string, extra: Record<string, unknown> = {}) => (
    <TextField label={label} fullWidth size="small" value={form[k]} onChange={set(k)} error={!!errors[k]} helperText={errors[k]} disabled={readOnly} {...extra} />
  )

  const save = async () => {
    if (busy || readOnly) return
    const creating = mode === 'create'
    const v = validateUser(form, creating)
    setErrors(v)
    if (Object.keys(v).length) return
    setBusy(true); setFormError(null)
    const profile = {
      firstName: form.firstName.trim(), lastName: form.lastName.trim(), username: form.username.trim(), email: form.email.trim(),
      phone: form.phone.trim() || null, companyId: form.companyId ? Number(form.companyId) : null,
    }
    try {
      let saved: User
      if (creating) saved = await usersApi.create({ ...profile, password: form.password, role: form.role })
      else {
        saved = await usersApi.update(user!.id, profile)
        if (form.role !== user!.role) saved = await usersApi.setRole(user!.id, form.role)
      }
      onSaved(saved)
    } catch (e) { setFormError((e as Error).message) } finally { setBusy(false) }
  }

  const companyOptions = user?.companyId && !companies.some((c) => c.companyId === user.companyId)
    ? [...companies, { companyId: user.companyId, companyName: user.companyName ?? `Company ${user.companyId}`, companyCode: '' } as Company] : companies

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" aria-labelledby="user-dialog-title">
      <DialogTitle id="user-dialog-title">{mode === 'create' ? 'Add user' : mode === 'edit' ? 'Edit user' : 'User details'}</DialogTitle>
      <DialogContent>
        {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid size={{ xs: 12, sm: 6 }}>{field('firstName', 'First name', { required: true, slotProps: { htmlInput: { maxLength: 100 } } })}</Grid>
          <Grid size={{ xs: 12, sm: 6 }}>{field('lastName', 'Last name', { required: true, slotProps: { htmlInput: { maxLength: 100 } } })}</Grid>
          <Grid size={{ xs: 12, sm: 6 }}>{field('username', 'Username', { required: true, autoComplete: 'off' })}</Grid>
          <Grid size={{ xs: 12, sm: 6 }}>{field('email', 'Email', { required: true, type: 'email' })}</Grid>
          <Grid size={{ xs: 12, sm: 6 }}>{field('phone', 'Phone', { slotProps: { htmlInput: { maxLength: 25 } } })}</Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField select label="Company" fullWidth size="small" value={form.companyId} onChange={set('companyId')} disabled={readOnly}>
              <MenuItem value="">None</MenuItem>
              {companyOptions.map((c) => <MenuItem key={c.companyId} value={String(c.companyId)}>{c.companyName}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField select label="Role" fullWidth size="small" value={form.role} onChange={set('role')} disabled={readOnly}>
              <MenuItem value="Admin">Admin</MenuItem><MenuItem value="Editor">Editor</MenuItem>
            </TextField>
          </Grid>
          {mode === 'create' && <Grid size={{ xs: 12, sm: 6 }}>{field('password', 'Password', { required: true, type: 'password', autoComplete: 'new-password' })}</Grid>}
          {readOnly && user && (
            <Grid size={12}>
              <Box sx={{ color: 'text.secondary', typography: 'body2' }}>
                <Typography variant="body2">Status: {user.isActive ? 'Active' : 'Inactive'}</Typography>
                <Typography variant="body2">Last login: {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never'}</Typography>
                {user.createdAt && <Typography variant="body2">Created {new Date(user.createdAt).toLocaleString()}</Typography>}
                {user.updatedAt && <Typography variant="body2">Updated {new Date(user.updatedAt).toLocaleString()}</Typography>}
              </Box>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{readOnly ? 'Close' : 'Cancel'}</Button>
        {!readOnly && <Button variant="contained" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save'}</Button>}
      </DialogActions>
    </Dialog>
  )
}
