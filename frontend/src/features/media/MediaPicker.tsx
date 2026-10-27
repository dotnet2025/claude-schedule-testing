import { useState } from 'react'
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, ImageList, ImageListItem, ImageListItemBar, TextField } from '@mui/material'
import { mediaApi } from '../../api/endpoints'
import { useAsync, useDebounced } from '../../hooks/useAsync'
import { Empty, ErrorView, Loading } from '../../components/StateViews'
import type { Media } from '../../types'

interface Props { open: boolean; imagesOnly?: boolean; onClose: () => void; onSelect: (m: Media) => void }

export default function MediaPicker({ open, imagesOnly, onClose, onSelect }: Props) {
  const [search, setSearch] = useState('')
  const q = useDebounced(search)
  const { data, error, loading } = useAsync(() => (open ? mediaApi.list({ search: q, type: imagesOnly ? 'image' : undefined, pageSize: 60 }) : Promise.resolve(null)), [open, q, imagesOnly])
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" aria-labelledby="picker-title">
      <DialogTitle id="picker-title">Select media</DialogTitle>
      <DialogContent>
        <TextField label="Search by filename" size="small" fullWidth value={search} onChange={(e) => setSearch(e.target.value)} sx={{ my: 1 }} />
        {loading ? <Loading /> : error ? <ErrorView message={error} /> : !data || data.items.length === 0 ? <Empty message="No media found." /> : (
          <ImageList cols={3} gap={8}>
            {data.items.map((m) => (
              <ImageListItem key={m.id} sx={{ cursor: 'pointer' }}>
                <button type="button" aria-label={`Select ${m.originalName}`} onClick={() => onSelect(m)} style={{ all: 'unset', cursor: 'pointer', display: 'block' }}>
                  {m.contentType.startsWith('image/') ? <img src={m.url} alt={m.originalName} loading="lazy" style={{ width: '100%', height: 140, objectFit: 'cover' }} /> : <div style={{ height: 140, display: 'grid', placeItems: 'center' }}>PDF</div>}
                  <ImageListItemBar title={m.originalName} />
                </button>
              </ImageListItem>
            ))}
          </ImageList>
        )}
      </DialogContent>
      <DialogActions><Button onClick={onClose}>Cancel</Button></DialogActions>
    </Dialog>
  )
}
