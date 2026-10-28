import { useState } from 'react'
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, Checkbox } from '@mui/material'
import { companiesApi, companyUsersApi, usersApi } from '../../api/endpoints'
import { useToast } from '../../app/Toast'
import type { Company, User } from '../../types'
import RemoteAutocomplete from './RemoteAutocomplete'
import { companyLabel, userLabel } from './labels'

interface Props {
  open: boolean
  /** When set (opened from Company Details) the company is preselected and locked. */
  company?: Pick<Company, 'companyId' | 'companyCode' | 'companyName'> | null
  onClose: () => void
  onDone: () => void
}

/** Assign an EXISTING user to a company. Re-assigning an inactive mapping reactivates it (server rule). */
export default function AssignUserDialog({ open, company, onClose, onDone }: Props) {
  const toast = useToast()
  const [selCompany, setSelCompany] = useState<Company | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [isPrimary, setPrimary] = useState(false)
  const [isActive, setActive] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errs, setErrs] = useState<{ company?: string; user?: string }>({})
  const companyId = company?.companyId ?? selCompany?.companyId

  const close = () => { setSelCompany(null); setUser(null); setPrimary(false); setActive(true); setError(null); setErrs({}); onClose() }
  const submit = async () => {
    if (busy) return
    const e = { company: companyId ? undefined : 'Select a company', user: user ? undefined : 'Select a user' }
    setErrs(e); if (e.company || e.user) return
    if (isPrimary && !isActive) return setError('An inactive assignment cannot be the primary company.')
    setBusy(true); setError(null)
    try {
      await companyUsersApi.assign({ companyId: companyId!, userId: user!.id, isActive, isPrimaryCompany: isPrimary })
      toast('User assigned'); close(); onDone()
    } catch (err) { setError((err as Error).message) } finally { setBusy(false) }
  }

  return (
    <Dialog open={open} onClose={close} fullWidth maxWidth="sm" aria-labelledby="assign-user-title">
      <DialogTitle id="assign-user-title">Assign existing user</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}
        {company
          ? <RemoteAutocomplete<Pick<Company, 'companyId' | 'companyCode' | 'companyName'>> label="Company" value={company} onChange={() => {}} disabled fetchOptions={async () => [company]} getLabel={companyLabel} getKey={(c) => c.companyId} />
          : <RemoteAutocomplete<Company> label="Company" required value={selCompany} onChange={setSelCompany} error={errs.company}
              fetchOptions={async (q) => (await companiesApi.list({ search: q, isActive: true, pageSize: 20 })).items} getLabel={companyLabel} getKey={(c) => c.companyId} />}
        <RemoteAutocomplete<User> label="User" required value={user} onChange={setUser} error={errs.user}
          fetchOptions={async (q) => (await usersApi.list({ search: q, pageSize: 20 })).items} getLabel={userLabel} getKey={(u) => u.id} />
        <FormControlLabel control={<Checkbox checked={isPrimary} onChange={(e) => setPrimary(e.target.checked)} />} label="Primary company" />
        <FormControlLabel control={<Checkbox checked={isActive} onChange={(e) => setActive(e.target.checked)} />} label="Active" />
      </DialogContent>
      <DialogActions><Button onClick={close} disabled={busy}>Cancel</Button><Button variant="contained" onClick={submit} disabled={busy}>Assign user</Button></DialogActions>
    </Dialog>
  )
}
