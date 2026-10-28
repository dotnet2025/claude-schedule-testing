import { useState } from 'react'
import { Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, MenuItem, Pagination, Stack, Table, TableBody, TableCell, TableHead, TableRow, TableSortLabel, TextField, Tooltip, Typography } from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import VisibilityIcon from '@mui/icons-material/Visibility'
import StarIcon from '@mui/icons-material/Star'
import { companiesApi, companyUsersApi } from '../../api/endpoints'
import { useAsync, useDebounced } from '../../hooks/useAsync'
import { Empty, ErrorView, Loading } from '../../components/StateViews'
import ConfirmDialog from '../../components/ConfirmDialog'
import { useToast } from '../../app/Toast'
import type { Company, CompanyUser } from '../../types'
import AssignUserDialog from './AssignUserDialog'
import CreateCompanyUserDialog from './CreateCompanyUserDialog'
import EditCompanyUserDialog from './EditCompanyUserDialog'
import RemoteAutocomplete from './RemoteAutocomplete'
import { companyLabel } from './labels'

type FixedCompany = Pick<Company, 'companyId' | 'companyCode' | 'companyName'>
interface Props {
  /** When set the list is scoped to this company (Company Details → Users tab): company columns/filter are hidden. */
  fixedCompany?: FixedCompany
  /** Refresh hook for the parent (e.g. company user counts). */
  onChanged?: () => void
}
const fmt = (iso: string) => new Date(iso).toLocaleDateString()
const tri = (v: string) => (v === '' ? undefined : v === 'true')

/** Company Users listing (server-side search / filter / sort / paging) shared by the Masters screen and the company Users tab. */
export default function CompanyUserList({ fixedCompany, onChanged }: Props) {
  const toast = useToast()
  const [search, setSearch] = useState('')
  const [filterCompany, setFilterCompany] = useState<Company | null>(null)
  const [userStatus, setUserStatus] = useState('')
  const [assignStatus, setAssignStatus] = useState('')
  const [sortBy, setSortBy] = useState('company')
  const [desc, setDesc] = useState(false)
  const [page, setPage] = useState(1)
  const q = useDebounced(search)
  const companyId = fixedCompany?.companyId ?? filterCompany?.companyId
  const { data, error, loading, reload } = useAsync(() => companyUsersApi.list({
    search: q, companyId, userIsActive: tri(userStatus), assignmentIsActive: tri(assignStatus), sortBy, desc, page, pageSize: 10,
  }), [q, companyId, userStatus, assignStatus, sortBy, desc, page])

  const [assignOpen, setAssignOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<CompanyUser | null>(null)
  const [viewing, setViewing] = useState<CompanyUser | null>(null)
  const [removing, setRemoving] = useState<CompanyUser | null>(null)
  const [busy, setBusy] = useState(false)
  const refresh = () => { reload(); onChanged?.() }
  const reset = <T,>(fn: (v: T) => void) => (v: T) => { fn(v); setPage(1) }
  const sort = (col: string) => { if (sortBy === col) setDesc(!desc); else { setSortBy(col); setDesc(false) } setPage(1) }
  const head = (col: string, label: string) => (
    <TableCell sortDirection={sortBy === col ? (desc ? 'desc' : 'asc') : false}>
      <TableSortLabel active={sortBy === col} direction={desc ? 'desc' : 'asc'} onClick={() => sort(col)}>{label}</TableSortLabel>
    </TableCell>
  )
  const remove = async () => {
    if (!removing) return
    setBusy(true)
    try { await companyUsersApi.unassign(removing.companyUserId); toast('Assignment removed'); setRemoving(null); refresh() }
    catch (e) { toast((e as Error).message, 'error'); setRemoving(null) } finally { setBusy(false) }
  }

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="space-between">
        {!fixedCompany && <Typography component="h1" variant="h4">Company Users</Typography>}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ ml: 'auto' }}>
          <Button variant="outlined" onClick={() => setAssignOpen(true)}>Add existing user</Button>
          <Button variant="contained" onClick={() => setCreateOpen(true)}>Create new user</Button>
        </Stack>
      </Stack>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems={{ md: 'flex-start' }}>
        <TextField label="Search company or user" size="small" value={search} onChange={(e) => reset(setSearch)(e.target.value)} sx={{ minWidth: 260, mt: 1 }} />
        {!fixedCompany && (
          <Box sx={{ minWidth: 260 }}>
            <RemoteAutocomplete<Company> label="Filter by company" value={filterCompany} onChange={reset(setFilterCompany)}
              fetchOptions={async (s) => (await companiesApi.list({ search: s, pageSize: 20 })).items} getLabel={companyLabel} getKey={(c) => c.companyId} />
          </Box>
        )}
        <TextField select size="small" label="User status" value={userStatus} onChange={(e) => reset(setUserStatus)(e.target.value)} sx={{ minWidth: 150, mt: 1 }}>
          <MenuItem value="">All</MenuItem><MenuItem value="true">Active</MenuItem><MenuItem value="false">Inactive</MenuItem>
        </TextField>
        <TextField select size="small" label="Assignment status" value={assignStatus} onChange={(e) => reset(setAssignStatus)(e.target.value)} sx={{ minWidth: 170, mt: 1 }}>
          <MenuItem value="">All</MenuItem><MenuItem value="true">Active</MenuItem><MenuItem value="false">Inactive</MenuItem>
        </TextField>
      </Stack>

      {loading ? <Loading /> : error ? <ErrorView message={error} /> : !data || data.items.length === 0 ? (
        <Empty message={fixedCompany && !q && !userStatus && !assignStatus
          ? 'No users are assigned to this company yet. Use “Add existing user” or “Create new user” to get started.'
          : 'No assignments match your filters.'} />
      ) : (
        <Box sx={{ overflowX: 'auto' }}>
          <Table size="small" aria-label="Company users">
            <TableHead><TableRow>
              {!fixedCompany && head('company', 'Company')}{!fixedCompany && head('code', 'Code')}
              {head('user', 'User')}{head('username', 'Username')}{head('email', 'Email')}{head('role', 'Role')}
              {head('status', 'Status')}{head('primary', 'Primary')}{head('created', 'Assigned')}
              <TableCell align="right">Actions</TableCell>
            </TableRow></TableHead>
            <TableBody>{data.items.map((m) => (
              <TableRow key={m.companyUserId} hover>
                {!fixedCompany && <TableCell>{m.companyName}</TableCell>}{!fixedCompany && <TableCell>{m.companyCode}</TableCell>}
                <TableCell>{m.userName}{!m.userIsActive && <Chip size="small" label="User inactive" sx={{ ml: 1 }} />}</TableCell>
                <TableCell>{m.username}</TableCell><TableCell>{m.email}</TableCell><TableCell>{m.systemRole}</TableCell>
                <TableCell><Chip size="small" label={m.isActive ? 'Active' : 'Inactive'} color={m.isActive ? 'success' : 'default'} /></TableCell>
                <TableCell>{m.isPrimaryCompany ? <Tooltip title="Primary company"><StarIcon color="warning" fontSize="small" aria-label="Primary company" /></Tooltip> : '—'}</TableCell>
                <TableCell>{fmt(m.createdAt)}</TableCell>
                <TableCell align="right">
                  <IconButton aria-label={`View ${m.email} in ${m.companyCode}`} onClick={() => setViewing(m)}><VisibilityIcon fontSize="small" /></IconButton>
                  <IconButton aria-label={`Edit ${m.email} in ${m.companyCode}`} onClick={() => setEditing(m)}><EditIcon fontSize="small" /></IconButton>
                  <IconButton aria-label={`Remove ${m.email} from ${m.companyCode}`} color="error" disabled={!m.isActive} onClick={() => setRemoving(m)}><DeleteIcon fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            ))}</TableBody>
          </Table>
        </Box>
      )}
      {data && data.totalPages > 1 && <Pagination count={data.totalPages} page={page} onChange={(_, p) => setPage(p)} />}

      <AssignUserDialog open={assignOpen} company={fixedCompany} onClose={() => setAssignOpen(false)} onDone={refresh} />
      <CreateCompanyUserDialog open={createOpen} company={fixedCompany} onClose={() => setCreateOpen(false)} onDone={refresh} />
      <EditCompanyUserDialog item={editing} onClose={() => setEditing(null)} onDone={refresh} />
      <ConfirmDialog open={!!removing} busy={busy} title="Remove assignment?" confirmLabel="Remove"
        message={`${removing?.userName} will be unassigned from ${removing?.companyName}. The user and the company are kept; if this is the primary company the primary flag is cleared.`}
        onConfirm={remove} onCancel={() => setRemoving(null)} />
      <Dialog open={!!viewing} onClose={() => setViewing(null)} fullWidth maxWidth="xs" aria-labelledby="view-cu-title">
        <DialogTitle id="view-cu-title">Assignment details</DialogTitle>
        <DialogContent>
          {viewing && (
            <Stack spacing={1}>
              {([['Company', `${viewing.companyName} (${viewing.companyCode})`], ['User', viewing.userName], ['Username', viewing.username], ['Email', viewing.email],
                ['Phone', viewing.phone ?? '—'], ['System role', viewing.systemRole], ['User status', viewing.userIsActive ? 'Active' : 'Inactive'],
                ['Assignment', viewing.isActive ? 'Active' : 'Inactive'], ['Primary company', viewing.isPrimaryCompany ? 'Yes' : 'No'],
                ['Assigned', new Date(viewing.createdAt).toLocaleString()], ['Last updated', new Date(viewing.updatedAt).toLocaleString()]] as const).map(([k, v]) => (
                <Box key={k}><Typography variant="caption" color="text.secondary">{k}</Typography><Typography>{v}</Typography></Box>
              ))}
            </Stack>
          )}
        </DialogContent>
        <DialogActions><Button onClick={() => setViewing(null)}>Close</Button></DialogActions>
      </Dialog>
    </Stack>
  )
}
