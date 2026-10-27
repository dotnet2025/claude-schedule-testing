import { useRef, useState } from 'react'
import { Box, Button, Card, CardActions, CardContent, CardMedia, Dialog, DialogContent, DialogTitle, IconButton, MenuItem, Pagination, Stack, TextField, ToggleButton, ToggleButtonGroup, Typography, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material'
import Grid from '@mui/material/Grid'
import DeleteIcon from '@mui/icons-material/Delete'
import ContentCopy from '@mui/icons-material/ContentCopy'
import { mediaApi } from '../../api/endpoints'
import { useAsync, useDebounced } from '../../hooks/useAsync'
import { Empty, ErrorView, Loading } from '../../components/StateViews'
import ConfirmDialog from '../../components/ConfirmDialog'
import { useToast } from '../../app/Toast'
import { formatBytes, formatDate } from '../../utils/format'
import type { Media } from '../../types'

export default function MediaPage() {
  const toast = useToast()
  const [search, setSearch] = useState('')
  const [type, setType] = useState('')
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [page, setPage] = useState(1)
  const [toDelete, setToDelete] = useState<Media | null>(null)
  const [details, setDetails] = useState<Media | null>(null)
  const [busy, setBusy] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  const q = useDebounced(search)
  const { data, error, loading, reload } = useAsync(() => mediaApi.list({ search: q, type, page, pageSize: 12 }), [q, type, page])

  const upload = async (files: FileList | null) => {
    if (!files?.length || busy) return
    setBusy(true)
    for (const f of Array.from(files)) {
      try { await mediaApi.upload(f); toast(`Uploaded ${f.name}`) } catch (e) { toast(`${f.name}: ${(e as Error).message}`, 'error') }
    }
    setBusy(false); if (input.current) input.current.value = ''; reload()
  }
  const copy = async (m: Media) => {
    try { await navigator.clipboard.writeText(window.location.origin + m.url); toast('URL copied') } catch { toast('Could not copy URL', 'error') }
  }
  const remove = async () => {
    if (!toDelete) return
    setBusy(true)
    try { await mediaApi.remove(toDelete.id); toast('Media deleted'); setToDelete(null); reload() } catch (e) { toast((e as Error).message, 'error') } finally { setBusy(false) }
  }

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1}>
        <Typography component="h1" variant="h4">Media library</Typography>
        <Button variant="contained" component="label" disabled={busy}>
          {busy ? 'Uploading…' : 'Upload files'}
          <input ref={input} hidden type="file" multiple accept=".jpg,.jpeg,.png,.gif,.webp,.pdf" onChange={(e) => upload(e.target.files)} aria-label="Upload files" />
        </Button>
      </Stack>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
        <TextField label="Search by filename" size="small" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
        <TextField select label="File type" size="small" value={type} onChange={(e) => { setType(e.target.value); setPage(1) }} sx={{ minWidth: 140 }}>
          <MenuItem value="">All</MenuItem><MenuItem value="image">Images</MenuItem><MenuItem value="document">Documents</MenuItem>
        </TextField>
        <ToggleButtonGroup size="small" exclusive value={view} onChange={(_, v) => v && setView(v)} aria-label="View mode">
          <ToggleButton value="grid">Grid</ToggleButton><ToggleButton value="list">List</ToggleButton>
        </ToggleButtonGroup>
      </Stack>
      {loading ? <Loading /> : error ? <ErrorView message={error} /> : !data || data.items.length === 0 ? <Empty message="No media files yet." /> : view === 'grid' ? (
        <Grid container spacing={2}>
          {data.items.map((m) => (
            <Grid key={m.id} size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                {m.contentType.startsWith('image/') ? <CardMedia component="img" height="140" image={m.url} alt={m.originalName} /> : <Box sx={{ height: 140, display: 'grid', placeItems: 'center' }}>PDF</Box>}
                <CardContent><Typography noWrap title={m.originalName}>{m.originalName}</Typography><Typography variant="caption">{formatBytes(m.size)}</Typography></CardContent>
                <CardActions>
                  <Button size="small" onClick={() => setDetails(m)}>Details</Button>
                  <IconButton aria-label={`Copy URL of ${m.originalName}`} onClick={() => copy(m)}><ContentCopy fontSize="small" /></IconButton>
                  <IconButton aria-label={`Delete ${m.originalName}`} color="error" onClick={() => setToDelete(m)}><DeleteIcon fontSize="small" /></IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Box sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead><TableRow><TableCell>Name</TableCell><TableCell>Type</TableCell><TableCell>Size</TableCell><TableCell>Uploaded</TableCell><TableCell /></TableRow></TableHead>
            <TableBody>{data.items.map((m) => (
              <TableRow key={m.id}><TableCell>{m.originalName}</TableCell><TableCell>{m.contentType}</TableCell><TableCell>{formatBytes(m.size)}</TableCell><TableCell>{formatDate(m.createdAt)}</TableCell>
                <TableCell><Button size="small" onClick={() => setDetails(m)}>Details</Button>
                  <IconButton aria-label={`Copy URL of ${m.originalName}`} onClick={() => copy(m)}><ContentCopy fontSize="small" /></IconButton>
                  <IconButton aria-label={`Delete ${m.originalName}`} color="error" onClick={() => setToDelete(m)}><DeleteIcon fontSize="small" /></IconButton></TableCell></TableRow>
            ))}</TableBody>
          </Table>
        </Box>
      )}
      {data && data.totalPages > 1 && <Pagination count={data.totalPages} page={page} onChange={(_, p) => setPage(p)} />}
      <Dialog open={!!details} onClose={() => setDetails(null)}>
        <DialogTitle>File details</DialogTitle>
        <DialogContent>{details && <Stack spacing={0.5}><Typography>Name: {details.originalName}</Typography><Typography>Type: {details.contentType}</Typography>
          <Typography>Size: {formatBytes(details.size)}</Typography><Typography>Uploaded: {formatDate(details.createdAt)}</Typography><Typography>URL: {details.url}</Typography></Stack>}</DialogContent>
      </Dialog>
      <ConfirmDialog open={!!toDelete} busy={busy} title="Delete media?" message={`"${toDelete?.originalName}" will be permanently deleted. Content using it as a featured image will lose the image.`} onConfirm={remove} onCancel={() => setToDelete(null)} />
    </Stack>
  )
}
