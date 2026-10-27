import { useState } from 'react'
import { Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, IconButton, MenuItem, Pagination, Stack, Switch, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import { usersApi } from '../../api/endpoints'
import { useAsync, useDebounced } from '../../hooks/useAsync'
import { Empty, ErrorView, Loading } from '../../components/StateViews'
import ConfirmDialog from '../../components/ConfirmDialog'
import { useToast } from '../../app/Toast'
import type { User } from '../../types'

const emptyForm = { email: '', displayName: '', password: '', role: 'Editor', isActive: true }

export default function UsersPage() {
  const toast = useToast()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const q = useDebounced(search)
  const { data, error, loading, reload } = useAsync(() => usersApi.list({ search: q, page, pageSize: 10 }), [q, page])
  const [editing, setEditing] = useState<User | 'new' | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState<string | null>(null)
  const [toDelete, setToDelete] = useState<User | null>(null)
  const [busy, setBusy] = useState(false)

  const open = (u: User | 'new') => { setEditing(u); setFormError(null); setForm(u === 'new' ? emptyForm : { email: u.email, displayName: u.displayName, password: '', role: u.role, isActive: u.isActive }) }
  const save = async () => {
    if (busy) return
    if (!form.displayName.trim()) return setFormError('Display name is required')
    if (editing === 'new' && !/^\S+@\S+\.\S+$/.test(form.email)) return setFormError('Enter a valid email address')
    if (editing === 'new' && form.password.length < 8) return setFormError('Password must be at least 8 characters')
    setBusy(true); setFormError(null)
    try {
      if (editing === 'new') await usersApi.create({ email: form.email, displayName: form.displayName, password: form.password, role: form.role })
      else if (editing) await usersApi.update(editing.id, { displayName: form.displayName, role: form.role, isActive: form.isActive, newPassword: form.password || undefined })
      toast('User saved'); setEditing(null); reload()
    } catch (e) { setFormError((e as Error).message) } finally { setBusy(false) }
  }
  const remove = async () => {
    if (!toDelete) return
    setBusy(true)
    try { await usersApi.remove(toDelete.id); toast('User deleted'); setToDelete(null); reload() } catch (e) { toast((e as Error).message, 'error'); setToDelete(null) } finally { setBusy(false) }
  }

  return (
    <Stack spacing={2}>
      <Stack direction="row" justifyContent="space-between"><Typography component="h1" variant="h4">Users</Typography><Button variant="contained" onClick={() => open('new')}>New user</Button></Stack>
      <TextField label="Search users" size="small" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} sx={{ maxWidth: 320 }} />
      {loading ? <Loading /> : error ? <ErrorView message={error} /> : !data || data.items.length === 0 ? <Empty message="No users found." /> : (
        <Box sx={{ overflowX: 'auto' }}><Table size="small">
          <TableHead><TableRow><TableCell>Name</TableCell><TableCell>Email</TableCell><TableCell>Role</TableCell><TableCell>Status</TableCell><TableCell align="right">Actions</TableCell></TableRow></TableHead>
          <TableBody>{data.items.map((u) => (
            <TableRow key={u.id}><TableCell>{u.displayName}</TableCell><TableCell>{u.email}</TableCell><TableCell>{u.role}</TableCell>
              <TableCell><Chip size="small" label={u.isActive ? 'Active' : 'Inactive'} color={u.isActive ? 'success' : 'default'} /></TableCell>
              <TableCell align="right"><IconButton aria-label={`Edit ${u.email}`} onClick={() => open(u)}><EditIcon fontSize="small" /></IconButton>
                <IconButton aria-label={`Delete ${u.email}`} color="error" onClick={() => setToDelete(u)}><DeleteIcon fontSize="small" /></IconButton></TableCell></TableRow>
          ))}</TableBody></Table></Box>
      )}
      {data && data.totalPages > 1 && <Pagination count={data.totalPages} page={page} onChange={(_, p) => setPage(p)} />}
      <Dialog open={!!editing} onClose={() => setEditing(null)} fullWidth maxWidth="xs">
        <DialogTitle>{editing === 'new' ? 'New user' : 'Edit user'}</DialogTitle>
        <DialogContent>
          {formError && <Alert severity="error" sx={{ mb: 1 }}>{formError}</Alert>}
          <TextField label="Email" fullWidth margin="dense" type="email" disabled={editing !== 'new'} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <TextField label="Display name" fullWidth margin="dense" value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} />
          <TextField label={editing === 'new' ? 'Password' : 'Reset password (optional)'} type="password" fullWidth margin="dense" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} autoComplete="new-password" />
          <TextField select label="Role" fullWidth margin="dense" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}><MenuItem value="Admin">Admin</MenuItem><MenuItem value="Editor">Editor</MenuItem></TextField>
          {editing !== 'new' && <FormControlLabel control={<Switch checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />} label="Active" />}
        </DialogContent>
        <DialogActions><Button onClick={() => setEditing(null)}>Cancel</Button><Button variant="contained" onClick={save} disabled={busy}>Save</Button></DialogActions>
      </Dialog>
      <ConfirmDialog open={!!toDelete} busy={busy} title="Delete user?" message={`${toDelete?.email} will be permanently deleted.`} onConfirm={remove} onCancel={() => setToDelete(null)} />
    </Stack>
  )
}
