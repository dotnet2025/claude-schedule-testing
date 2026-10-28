import { useState } from 'react'
import { Alert, Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, MenuItem, TextField } from '@mui/material'
import { companiesApi } from '../../api/endpoints'
import { useToast } from '../../app/Toast'
import type { Company } from '../../types'
import RemoteAutocomplete from './RemoteAutocomplete'
import { companyLabel } from './labels'

interface Props {
  open: boolean
  company?: Pick<Company, 'companyId' | 'companyCode' | 'companyName'> | null
  onClose: () => void
  onDone: () => void
}
const empty = { firstName: '', lastName: '', username: '', email: '', phone: '', role: 'Editor', password: '', isActive: true, isPrimaryCompany: false }

/** Create a NEW user (through User Master, server side, in one transaction with the assignment). */
export default function CreateCompanyUserDialog({ open, company, onClose, onDone }: Props) {
  const toast = useToast()
  const [form, setForm] = useState(empty)
  const [selCompany, setSelCompany] = useState<Company | null>(null)
  const [errs, setErrs] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const companyId = company?.companyId ?? selCompany?.companyId
  const set = (k: keyof typeof empty, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }))

  const validate = () => {
    const e: Record<string, string> = {}
    if (!companyId) e.company = 'Select a company'
    if (!form.firstName.trim()) e.firstName = 'First name is required'
    if (!form.lastName.trim()) e.lastName = 'Last name is required'
    if (form.username.trim().length < 3) e.username = 'Username must be at least 3 characters'
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Enter a valid email address'
    if (form.phone.length > 25) e.phone = 'Phone must be at most 25 characters'
    if (form.password.length < 8 || !/[A-Za-z]/.test(form.password) || !/\d/.test(form.password)) e.password = 'Password must be at least 8 characters with a letter and a digit'
    if (form.isPrimaryCompany && !form.isActive) e.isPrimaryCompany = 'An inactive assignment cannot be primary'
    return e
  }
  const close = () => { setForm(empty); setSelCompany(null); setErrs({}); setError(null); onClose() }
  const submit = async () => {
    if (busy) return
    const e = validate(); setErrs(e); if (Object.keys(e).length) return
    setBusy(true); setError(null)
    try {
      await companiesApi.createUser(companyId!, { ...form, phone: form.phone || undefined })
      toast('User created and assigned'); close(); onDone()
    } catch (err) { setError((err as Error).message) } finally { setBusy(false) }
  }
  const field = (k: keyof typeof empty, label: string, extra: object = {}) =>
    <TextField label={label} margin="dense" fullWidth value={form[k] as string} onChange={(e) => set(k, e.target.value)} error={!!errs[k]} helperText={errs[k]} {...extra} />

  return (
    <Dialog open={open} onClose={close} fullWidth maxWidth="sm" aria-labelledby="create-cu-title">
      <DialogTitle id="create-cu-title">Create new user</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}
        {company
          ? <RemoteAutocomplete<Pick<Company, 'companyId' | 'companyCode' | 'companyName'>> label="Company" value={company} onChange={() => {}} disabled fetchOptions={async () => [company]} getLabel={companyLabel} getKey={(c) => c.companyId} />
          : <RemoteAutocomplete<Company> label="Company" required value={selCompany} onChange={setSelCompany} error={errs.company}
              fetchOptions={async (q) => (await companiesApi.list({ search: q, isActive: true, pageSize: 20 })).items} getLabel={companyLabel} getKey={(c) => c.companyId} />}
        {field('firstName', 'First name', { required: true })}
        {field('lastName', 'Last name', { required: true })}
        {field('username', 'Username', { required: true, autoComplete: 'off' })}
        {field('email', 'Email', { required: true, type: 'email' })}
        {field('phone', 'Phone')}
        <TextField select label="System role" margin="dense" fullWidth value={form.role} onChange={(e) => set('role', e.target.value)}>
          <MenuItem value="Admin">Admin</MenuItem><MenuItem value="Editor">Editor</MenuItem>
        </TextField>
        {field('password', 'Initial password', { required: true, type: 'password', autoComplete: 'new-password' })}
        <FormControlLabel control={<Checkbox checked={form.isPrimaryCompany} onChange={(e) => set('isPrimaryCompany', e.target.checked)} />} label="Primary company" />
        <FormControlLabel control={<Checkbox checked={form.isActive} onChange={(e) => set('isActive', e.target.checked)} />} label="Active" />
        {errs.isPrimaryCompany && <Alert severity="warning">{errs.isPrimaryCompany}</Alert>}
      </DialogContent>
      <DialogActions><Button onClick={close} disabled={busy}>Cancel</Button><Button variant="contained" onClick={submit} disabled={busy}>Create user</Button></DialogActions>
    </Dialog>
  )
}
