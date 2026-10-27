import { useState } from 'react'
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import { categoriesApi, tagsApi } from '../../api/endpoints'
import { useAsync } from '../../hooks/useAsync'
import { Empty, ErrorView, Loading } from '../../components/StateViews'
import ConfirmDialog from '../../components/ConfirmDialog'
import { useToast } from '../../app/Toast'
import type { Taxonomy } from '../../types'

export default function TaxonomyPage({ kind }: { kind: 'categories' | 'tags' }) {
  const api = kind === 'categories' ? categoriesApi : tagsApi
  const noun = kind === 'categories' ? 'category' : 'tag'
  const toast = useToast()
  const { data, error, loading, reload } = useAsync(() => api.list(), [kind])
  const [editing, setEditing] = useState<Taxonomy | 'new' | null>(null)
  const [toDelete, setToDelete] = useState<Taxonomy | null>(null)
  const [form, setForm] = useState({ name: '', slug: '', description: '' })
  const [formError, setFormError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const open = (t: Taxonomy | 'new') => { setEditing(t); setFormError(null); setForm(t === 'new' ? { name: '', slug: '', description: '' } : { name: t.name, slug: t.slug, description: t.description ?? '' }) }
  const save = async () => {
    if (busy) return
    if (!form.name.trim()) { setFormError('Name is required'); return }
    setBusy(true); setFormError(null)
    try {
      const body = { name: form.name.trim(), slug: form.slug || undefined, description: kind === 'categories' ? form.description || undefined : undefined }
      if (editing === 'new') await api.create(body); else if (editing) await api.update(editing.id, body)
      toast('Saved'); setEditing(null); reload()
    } catch (e) { setFormError((e as Error).message) } finally { setBusy(false) }
  }
  const remove = async () => {
    if (!toDelete) return
    setBusy(true)
    try { await api.remove(toDelete.id); toast('Deleted'); setToDelete(null); reload() } catch (e) { toast((e as Error).message, 'error') } finally { setBusy(false) }
  }

  return (
    <Stack spacing={2}>
      <Stack direction="row" justifyContent="space-between"><Typography component="h1" variant="h4" sx={{ textTransform: 'capitalize' }}>{kind}</Typography>
        <Button variant="contained" onClick={() => open('new')}>New {noun}</Button></Stack>
      {loading ? <Loading /> : error ? <ErrorView message={error} /> : !data || data.length === 0 ? <Empty message={`No ${kind} yet.`} /> : (
        <Box sx={{ overflowX: 'auto' }}><Table size="small">
          <TableHead><TableRow><TableCell>Name</TableCell><TableCell>Slug</TableCell><TableCell>Posts</TableCell><TableCell align="right">Actions</TableCell></TableRow></TableHead>
          <TableBody>{data.map((t) => (
            <TableRow key={t.id}><TableCell>{t.name}</TableCell><TableCell>{t.slug}</TableCell><TableCell>{t.postCount}</TableCell>
              <TableCell align="right"><IconButton aria-label={`Edit ${t.name}`} onClick={() => open(t)}><EditIcon fontSize="small" /></IconButton>
                <IconButton aria-label={`Delete ${t.name}`} color="error" onClick={() => setToDelete(t)}><DeleteIcon fontSize="small" /></IconButton></TableCell></TableRow>
          ))}</TableBody></Table></Box>
      )}
      <Dialog open={!!editing} onClose={() => setEditing(null)} fullWidth maxWidth="xs">
        <DialogTitle>{editing === 'new' ? `New ${noun}` : `Edit ${noun}`}</DialogTitle>
        <DialogContent>
          {formError && <Alert severity="error" sx={{ mb: 1 }}>{formError}</Alert>}
          <TextField label="Name" fullWidth margin="dense" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <TextField label="Slug" fullWidth margin="dense" value={form.slug} helperText="Leave blank to generate from the name" onChange={(e) => setForm({ ...form, slug: e.target.value })} />
          {kind === 'categories' && <TextField label="Description" fullWidth margin="dense" multiline value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />}
        </DialogContent>
        <DialogActions><Button onClick={() => setEditing(null)}>Cancel</Button><Button variant="contained" onClick={save} disabled={busy}>Save</Button></DialogActions>
      </Dialog>
      <ConfirmDialog open={!!toDelete} busy={busy} title={`Delete ${noun}?`} message={`"${toDelete?.name}" will be removed from all posts. The posts themselves are kept.`} onConfirm={remove} onCancel={() => setToDelete(null)} />
    </Stack>
  )
}
