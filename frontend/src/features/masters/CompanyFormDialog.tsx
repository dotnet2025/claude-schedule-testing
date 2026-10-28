import { useEffect, useState } from 'react'
import { Alert, Avatar, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, Stack, Switch, TextField, Typography } from '@mui/material'
import Grid from '@mui/material/Grid'
import { companiesApi } from '../../api/endpoints'
import MediaPicker from '../media/MediaPicker'
import type { Company, CompanyInput } from '../../types'

export type DialogMode = 'create' | 'edit' | 'view'

const empty: CompanyInput = {
  companyCode: '', companyName: '', email: '', phone: '', website: '', addressLine1: '', addressLine2: '', city: '', state: '', country: '', postalCode: '',
  logoMediaId: null, isActive: true,
}
const limits: Partial<Record<keyof CompanyInput, number>> = {
  companyCode: 30, companyName: 200, phone: 25, addressLine1: 250, addressLine2: 250, city: 100, state: 100, country: 100, postalCode: 20,
}

export function validateCompany(f: CompanyInput): Record<string, string> {
  const e: Record<string, string> = {}
  if (!f.companyCode.trim()) e.companyCode = 'Company code is required'
  if (!f.companyName.trim()) e.companyName = 'Company name is required'
  for (const [k, max] of Object.entries(limits)) {
    const v = (f as unknown as Record<string, string | null | undefined>)[k]
    if (v && v.length > max) e[k] = `Maximum ${max} characters`
  }
  if (f.email && !/^\S+@\S+\.\S+$/.test(f.email)) e.email = 'Enter a valid email address'
  if (f.website) {
    try { const u = new URL(f.website); if (u.protocol !== 'http:' && u.protocol !== 'https:') throw new Error() } catch { e.website = 'Enter a valid http(s) URL' }
  }
  return e
}

interface Props { open: boolean; mode: DialogMode; company: Company | null; onClose: () => void; onSaved: (c: Company) => void }

export default function CompanyFormDialog({ open, mode, company, onClose, onSaved }: Props) {
  const [form, setForm] = useState<CompanyInput>(empty)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [picker, setPicker] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const readOnly = mode === 'view'

  useEffect(() => {
    if (!open) return
    setErrors({}); setFormError(null)
    if (company && mode !== 'create') {
      const { companyId, logoUrl: lu, createdAt, updatedAt, createdById, createdByName, updatedById, updatedByName, userCount, ...rest } = company
      void companyId; void createdAt; void updatedAt; void createdById; void createdByName; void updatedById; void updatedByName; void userCount
      setForm({ ...empty, ...Object.fromEntries(Object.entries(rest).map(([k, v]) => [k, v ?? ''])), logoMediaId: rest.logoMediaId ?? null } as CompanyInput)
      setLogoUrl(lu ?? null)
    } else { setForm(empty); setLogoUrl(null) }
  }, [open, company, mode])

  const set = (k: keyof CompanyInput) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value })
  const text = (k: keyof CompanyInput, label: string, extra: Record<string, unknown> = {}) => (
    <TextField label={label} fullWidth size="small" value={(form[k] as string) ?? ''} onChange={set(k)} error={!!errors[k]} helperText={errors[k]}
      disabled={readOnly} slotProps={{ htmlInput: { maxLength: limits[k] } }} {...extra} />
  )

  const save = async () => {
    if (busy || readOnly) return
    const v = validateCompany(form)
    setErrors(v)
    if (Object.keys(v).length) return
    setBusy(true); setFormError(null)
    const payload: CompanyInput = { ...form, companyCode: form.companyCode.trim(), companyName: form.companyName.trim() }
    try {
      const saved = mode === 'create' ? await companiesApi.create(payload) : await companiesApi.update(company!.companyId, payload)
      onSaved(saved)
    } catch (e) { setFormError((e as Error).message) } finally { setBusy(false) }
  }

  const title = mode === 'create' ? 'Add company' : mode === 'edit' ? 'Edit company' : 'Company details'
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" aria-labelledby="company-dialog-title">
      <DialogTitle id="company-dialog-title">{title}</DialogTitle>
      <DialogContent>
        {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid size={{ xs: 12, sm: 4 }}>{text('companyCode', 'Company code', { required: true })}</Grid>
          <Grid size={{ xs: 12, sm: 8 }}>{text('companyName', 'Company name', { required: true })}</Grid>
          <Grid size={{ xs: 12, sm: 6 }}>{text('email', 'Email', { type: 'email' })}</Grid>
          <Grid size={{ xs: 12, sm: 6 }}>{text('phone', 'Phone')}</Grid>
          <Grid size={12}>{text('website', 'Website', { placeholder: 'https://example.com' })}</Grid>
          <Grid size={12}>{text('addressLine1', 'Address line 1')}</Grid>
          <Grid size={12}>{text('addressLine2', 'Address line 2')}</Grid>
          <Grid size={{ xs: 12, sm: 4 }}>{text('city', 'City')}</Grid>
          <Grid size={{ xs: 12, sm: 4 }}>{text('state', 'State')}</Grid>
          <Grid size={{ xs: 12, sm: 4 }}>{text('country', 'Country')}</Grid>
          <Grid size={{ xs: 12, sm: 4 }}>{text('postalCode', 'Postal code')}</Grid>
          <Grid size={{ xs: 12, sm: 8 }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar variant="rounded" src={logoUrl ?? undefined} alt={logoUrl ? 'Company logo' : ''} sx={{ width: 56, height: 56 }}>{form.companyName.trim().charAt(0).toUpperCase() || '?'}</Avatar>
              {!readOnly && <Button variant="outlined" onClick={() => setPicker(true)}>{form.logoMediaId ? 'Change logo' : 'Select logo'}</Button>}
              {!readOnly && form.logoMediaId != null && <Button color="inherit" onClick={() => { setForm({ ...form, logoMediaId: null }); setLogoUrl(null) }}>Remove logo</Button>}
              {readOnly && !logoUrl && <Typography color="text.secondary">No logo</Typography>}
            </Stack>
          </Grid>
          <Grid size={12}>
            <FormControlLabel control={<Switch checked={form.isActive} disabled={readOnly} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />} label="Active" />
          </Grid>
          {readOnly && company && (
            <Grid size={12}>
              <Box sx={{ color: 'text.secondary', typography: 'body2' }}>
                <div>Users assigned: {company.userCount}</div>
                <div>Created {new Date(company.createdAt).toLocaleString()}{company.createdByName ? ` by ${company.createdByName}` : ''}</div>
                <div>Updated {new Date(company.updatedAt).toLocaleString()}{company.updatedByName ? ` by ${company.updatedByName}` : ''}</div>
              </Box>
            </Grid>
          )}
        </Grid>
        <MediaPicker open={picker} imagesOnly onClose={() => setPicker(false)} onSelect={(m) => { setForm({ ...form, logoMediaId: m.id }); setLogoUrl(m.url); setPicker(false) }} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{readOnly ? 'Close' : 'Cancel'}</Button>
        {!readOnly && <Button variant="contained" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save'}</Button>}
      </DialogActions>
    </Dialog>
  )
}
