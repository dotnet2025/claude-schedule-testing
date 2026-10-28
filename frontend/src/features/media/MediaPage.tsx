import { useRef, useState } from 'react'
import { Box, Button, Card, CardActions, CardContent, CardMedia, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, InputAdornment, MenuItem, Pagination, Stack, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material'
import UploadFile from '@mui/icons-material/UploadFile'
import SearchIcon from '@mui/icons-material/Search'
import PictureAsPdf from '@mui/icons-material/PictureAsPdf'
import Grid from '@mui/material/Grid'
import DeleteIcon from '@mui/icons-material/Delete'
import ContentCopy from '@mui/icons-material/ContentCopy'
import { mediaApi } from '../../api/endpoints'
import { useAsync, useDebounced } from '../../hooks/useAsync'
import { Empty, ErrorView, TableSkeleton } from '../../components/StateViews'
import DataTable, { type Column } from '../../components/DataTable'
import PageHeader from '../../components/PageHeader'
import FilterBar from '../../components/FilterBar'
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

  const actions = (m: Media) => (
    <>
      <Button size="small" onClick={() => setDetails(m)}>Details</Button>
      <IconButton aria-label={`Copy URL of ${m.originalName}`} onClick={() => copy(m)}><ContentCopy fontSize="small" /></IconButton>
      <IconButton aria-label={`Delete ${m.originalName}`} color="error" onClick={() => setToDelete(m)}><DeleteIcon fontSize="small" /></IconButton>
    </>
  )
  const columns: Column<Media>[] = [
    { key: 'name', header: 'Name', render: (m) => <Typography sx={{ fontWeight: 600, overflowWrap: 'anywhere' }}>{m.originalName}</Typography> },
    { key: 'type', header: 'Type', hideBelow: 'sm', render: (m) => m.contentType },
    { key: 'size', header: 'Size', render: (m) => formatBytes(m.size) },
    { key: 'uploaded', header: 'Uploaded', hideBelow: 'md', render: (m) => formatDate(m.createdAt) },
    { key: 'actions', header: '', align: 'right', render: (m) => <Stack direction="row" justifyContent="flex-end" alignItems="center" sx={{ whiteSpace: 'nowrap' }}>{actions(m)}</Stack> },
  ]

  return (
    <>
      <PageHeader title="Media library" subtitle="Upload and manage images and documents." breadcrumbs={[{ label: 'Dashboard', to: '/admin' }, { label: 'Media' }]}
        actions={
          <Button variant="contained" component="label" disabled={busy} startIcon={<UploadFile />}>
            {busy ? 'Uploading…' : 'Upload files'}
            <input ref={input} hidden type="file" multiple accept=".jpg,.jpeg,.png,.gif,.webp,.pdf" onChange={(e) => upload(e.target.files)} aria-label="Upload files" />
          </Button>
        } />
      <FilterBar>
        <TextField label="Search by filename" size="small" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} sx={{ minWidth: { sm: 280 } }}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }} />
        <TextField select label="File type" size="small" value={type} onChange={(e) => { setType(e.target.value); setPage(1) }} sx={{ minWidth: 160 }}>
          <MenuItem value="">All</MenuItem><MenuItem value="image">Images</MenuItem><MenuItem value="document">Documents</MenuItem>
        </TextField>
        <ToggleButtonGroup size="small" exclusive value={view} onChange={(_, v) => v && setView(v)} aria-label="View mode" sx={{ ml: { sm: 'auto' } }}>
          <ToggleButton value="grid">Grid</ToggleButton><ToggleButton value="list">List</ToggleButton>
        </ToggleButtonGroup>
      </FilterBar>
      {view === 'list' ? (
        <DataTable columns={columns} rows={data?.items} getKey={(m) => m.id} loading={loading} error={error} onRetry={reload} emptyMessage="No media files yet." caption="Media files"
          page={page} totalPages={data?.totalPages} onPage={setPage} minWidth={480} />
      ) : loading ? <TableSkeleton /> : error ? <ErrorView message={error} onRetry={reload} /> : !data || data.items.length === 0 ? <Empty message="No media files yet." /> : (
        <>
          <Grid container spacing={2}>
            {data.items.map((m) => (
              <Grid key={m.id} size={{ xs: 12, sm: 6, md: 4, xl: 3 }}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', '&:hover': { boxShadow: 3 } }}>
                  {m.contentType.startsWith('image/')
                    ? <CardMedia component="img" height="160" image={m.url} alt={m.originalName} sx={{ objectFit: 'cover', bgcolor: 'action.hover' }} />
                    : <Box sx={{ height: 160, display: 'grid', placeItems: 'center', bgcolor: 'action.hover', color: 'text.secondary' }}><Stack alignItems="center"><PictureAsPdf fontSize="large" aria-hidden /><Typography variant="caption">PDF</Typography></Stack></Box>}
                  <CardContent sx={{ flexGrow: 1 }}><Typography noWrap title={m.originalName} sx={{ fontWeight: 600 }}>{m.originalName}</Typography><Typography variant="caption" color="text.secondary">{formatBytes(m.size)}</Typography></CardContent>
                  <CardActions sx={{ px: 2, pb: 1.5 }}>{actions(m)}</CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
          {data.totalPages > 1 && <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}><Pagination count={data.totalPages} page={page} onChange={(_, p) => setPage(p)} /></Box>}
        </>
      )}
      <Dialog open={!!details} onClose={() => setDetails(null)} fullWidth maxWidth="xs">
        <DialogTitle>File details</DialogTitle>
        <DialogContent>{details && <Stack spacing={0.75} sx={{ overflowWrap: 'anywhere' }}><Typography>Name: {details.originalName}</Typography><Typography>Type: {details.contentType}</Typography>
          <Typography>Size: {formatBytes(details.size)}</Typography><Typography>Uploaded: {formatDate(details.createdAt)}</Typography><Typography>URL: {details.url}</Typography></Stack>}</DialogContent>
        <DialogActions><Button onClick={() => setDetails(null)}>Close</Button></DialogActions>
      </Dialog>
      <ConfirmDialog open={!!toDelete} busy={busy} title="Delete media?" message={`"${toDelete?.originalName}" will be permanently deleted. Content using it as a featured image will lose the image.`} onConfirm={remove} onCancel={() => setToDelete(null)} />
    </>
  )
}
