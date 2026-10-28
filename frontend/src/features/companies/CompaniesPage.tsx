import { useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, IconButton, Link, Pagination, Stack, Switch, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import { companiesApi } from '../../api/endpoints'
import { useAsync, useDebounced } from '../../hooks/useAsync'
import { Empty, ErrorView, Loading } from '../../components/StateViews'
import { useToast } from '../../app/Toast'

/** MINIMAL Company master (prerequisite, see docs/known-issues.md KI-020): list, search and create. */
export default function CompaniesPage() {
  const toast = useToast()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const q = useDebounced(search)
  const { data, error, loading, reload } = useAsync(() => companiesApi.list({ search: q, page, pageSize: 10 }), [q, page])
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ companyCode: '', companyName: '', isActive: true })
  const [formError, setFormError] = useState<string | null>(null)
  const save = async () => {
    if (!form.companyCode.trim() || !form.companyName.trim()) return setFormError('Company code and name are required')
    try { await companiesApi.create(form); toast('Company created'); setOpen(false); setForm({ companyCode: '', companyName: '', isActive: true }); reload() }
    catch (e) { setFormError((e as Error).message) }
  }
  return (
    <Stack spacing={2}>
      <Stack direction="row" justifyContent="space-between"><Typography component="h1" variant="h4">Company Master</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setFormError(null); setOpen(true) }}>New company</Button></Stack>
      <TextField label="Search companies" size="small" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} sx={{ maxWidth: 320 }} />
      {loading ? <Loading /> : error ? <ErrorView message={error} /> : !data || data.items.length === 0 ? <Empty message="No companies found." /> : (
        <Box sx={{ overflowX: 'auto' }}><Table size="small" aria-label="Companies">
          <TableHead><TableRow><TableCell>Code</TableCell><TableCell>Name</TableCell><TableCell>Status</TableCell><TableCell>Active users</TableCell><TableCell align="right">Actions</TableCell></TableRow></TableHead>
          <TableBody>{data.items.map((c) => (
            <TableRow key={c.companyId} hover><TableCell>{c.companyCode}</TableCell><TableCell>{c.companyName}</TableCell>
              <TableCell><Chip size="small" label={c.isActive ? 'Active' : 'Inactive'} color={c.isActive ? 'success' : 'default'} /></TableCell>
              <TableCell>{c.activeUserCount}</TableCell>
              <TableCell align="right"><IconButton component="span" disableRipple><Link component={RouterLink} to={`/admin/masters/companies/${c.companyId}`} aria-label={`Details ${c.companyCode}`}>Details</Link></IconButton></TableCell></TableRow>
          ))}</TableBody></Table></Box>
      )}
      {data && data.totalPages > 1 && <Pagination count={data.totalPages} page={page} onChange={(_, p) => setPage(p)} />}
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>New company</DialogTitle>
        <DialogContent>
          {formError && <Alert severity="error" sx={{ mb: 1 }}>{formError}</Alert>}
          <TextField label="Company code" fullWidth margin="dense" value={form.companyCode} onChange={(e) => setForm({ ...form, companyCode: e.target.value })} slotProps={{ htmlInput: { maxLength: 30 } }} />
          <TextField label="Company name" fullWidth margin="dense" value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} slotProps={{ htmlInput: { maxLength: 200 } }} />
          <FormControlLabel control={<Switch checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />} label="Active" />
        </DialogContent>
        <DialogActions><Button onClick={() => setOpen(false)}>Cancel</Button><Button variant="contained" onClick={save}>Save</Button></DialogActions>
      </Dialog>
    </Stack>
  )
}
