import { useEffect, useState } from 'react'
import { Alert, Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, Typography } from '@mui/material'
import { companyUsersApi } from '../../api/endpoints'
import { useToast } from '../../app/Toast'
import type { CompanyUser } from '../../types'

interface Props { item: CompanyUser | null; onClose: () => void; onDone: () => void }

/** Only the assignment status and the primary flag can be edited; company and user are read-only. */
export default function EditCompanyUserDialog({ item, onClose, onDone }: Props) {
  const toast = useToast()
  const [isActive, setActive] = useState(true)
  const [isPrimary, setPrimary] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => { if (item) { setActive(item.isActive); setPrimary(item.isPrimaryCompany); setError(null) } }, [item])

  const submit = async () => {
    if (!item || busy) return
    if (isPrimary && !isActive) return setError('An inactive assignment cannot be the primary company.')
    setBusy(true); setError(null)
    try { await companyUsersApi.update(item.companyUserId, { isActive, isPrimaryCompany: isPrimary }); toast('Assignment updated'); onClose(); onDone() }
    catch (e) { setError((e as Error).message) } finally { setBusy(false) }
  }
  return (
    <Dialog open={!!item} onClose={onClose} fullWidth maxWidth="xs" aria-labelledby="edit-cu-title">
      <DialogTitle id="edit-cu-title">Edit assignment</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}
        <Typography variant="body2" color="text.secondary">Company</Typography><Typography gutterBottom>{item?.companyName} ({item?.companyCode})</Typography>
        <Typography variant="body2" color="text.secondary">User</Typography><Typography gutterBottom>{item?.userName} — {item?.email}</Typography>
        <FormControlLabel control={<Checkbox checked={isActive} onChange={(e) => { setActive(e.target.checked); if (!e.target.checked) setPrimary(false) }} />} label="Active" />
        <FormControlLabel control={<Checkbox checked={isPrimary} disabled={!isActive} onChange={(e) => setPrimary(e.target.checked)} />} label="Primary company" />
        <Typography variant="caption" color="text.secondary" display="block">Making this the primary company replaces the user's current primary company.</Typography>
      </DialogContent>
      <DialogActions><Button onClick={onClose} disabled={busy}>Cancel</Button><Button variant="contained" onClick={submit} disabled={busy}>Save</Button></DialogActions>
    </Dialog>
  )
}
