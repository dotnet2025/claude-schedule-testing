import { useEffect, useState, type FormEvent } from 'react'
import { Alert, Box, Button, Paper, Stack, TextField, Typography } from '@mui/material'
import { settingsApi } from '../../api/endpoints'
import { useAsync } from '../../hooks/useAsync'
import { ErrorView, Loading } from '../../components/StateViews'
import PageHeader from '../../components/PageHeader'
import MediaPicker from '../media/MediaPicker'
import { useToast } from '../../app/Toast'
import type { Settings } from '../../types'

export default function SettingsPage() {
  const toast = useToast()
  const { data, error, loading, reload } = useAsync(() => settingsApi.get(), [])
  const [s, setS] = useState<Settings | null>(null)
  const [picker, setPicker] = useState<'logo' | 'favicon' | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  useEffect(() => { if (data) setS(data) }, [data])
  if (loading) return <Loading />
  if (error || !s) return <ErrorView message={error ?? 'Failed to load settings'} onRetry={reload} />
  const set = (patch: Partial<Settings>) => setS({ ...s, ...patch })

  const save = async (e: FormEvent) => {
    e.preventDefault()
    if (saving) return
    if (!s.websiteName.trim()) return setErr('Website name is required')
    if (s.contactEmail && !/^\S+@\S+\.\S+$/.test(s.contactEmail)) return setErr('Contact email is not valid')
    setSaving(true); setErr(null)
    try { setS(await settingsApi.update(s)); toast('Settings saved') } catch (x) { setErr((x as Error).message) } finally { setSaving(false) }
  }

  return (
    <Box component="form" onSubmit={save} noValidate sx={{ maxWidth: 840 }}>
      <PageHeader title="Website settings" subtitle="General information, SEO defaults and branding for the public site." breadcrumbs={[{ label: 'Dashboard', to: '/admin' }, { label: 'Settings' }]}
        actions={<Button type="submit" variant="contained" disabled={saving}>{saving ? 'Saving…' : 'Save settings'}</Button>} />
      {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}
      <Stack spacing={3}>
        <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3 }}>
          <Typography variant="h6" component="h2" sx={{ mb: 2 }}>General</Typography>
          <Stack spacing={2}>
            <TextField label="Website name" required value={s.websiteName} onChange={(e) => set({ websiteName: e.target.value })} />
            <TextField label="Description" multiline minRows={2} value={s.description ?? ''} onChange={(e) => set({ description: e.target.value })} />
            <TextField label="Contact email" value={s.contactEmail ?? ''} onChange={(e) => set({ contactEmail: e.target.value })} />
            <TextField label="Footer text" value={s.footerText ?? ''} onChange={(e) => set({ footerText: e.target.value })} />
          </Stack>
        </Paper>
        <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3 }}>
          <Typography variant="h6" component="h2" sx={{ mb: 2 }}>SEO defaults</Typography>
          <Stack spacing={2}>
            <TextField label="Default SEO title" value={s.defaultSeoTitle ?? ''} onChange={(e) => set({ defaultSeoTitle: e.target.value })} />
            <TextField label="Default SEO description" multiline minRows={2} value={s.defaultSeoDescription ?? ''} onChange={(e) => set({ defaultSeoDescription: e.target.value })} />
          </Stack>
        </Paper>
        <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3 }}>
          <Typography variant="h6" component="h2" sx={{ mb: 2 }}>Branding</Typography>
          <Stack spacing={2} divider={<Box sx={{ borderTop: 1, borderColor: 'divider' }} />}>
            {(['logo', 'favicon'] as const).map((k) => (
              <Stack key={k} direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
                <Box sx={{ width: { sm: 160 }, height: 72, display: 'grid', placeItems: 'center', bgcolor: 'action.hover', borderRadius: 2, flexShrink: 0 }}>
                  {s[`${k}Url`] ? <img src={s[`${k}Url`]!} alt={k} style={{ maxHeight: 56, maxWidth: '90%', objectFit: 'contain' }} /> : <Typography variant="caption" color="text.secondary">No {k}</Typography>}
                </Box>
                <Box sx={{ flexGrow: 1 }}><Typography sx={{ textTransform: 'capitalize', fontWeight: 600 }}>{k}</Typography></Box>
                <Stack direction="row" spacing={1}>
                  <Button variant="outlined" onClick={() => setPicker(k)}>Select {k}</Button>
                  {s[`${k}Id`] && <Button color="error" onClick={() => set(k === 'logo' ? { logoId: null, logoUrl: null } : { faviconId: null, faviconUrl: null })}>Remove</Button>}
                </Stack>
              </Stack>
            ))}
          </Stack>
        </Paper>
      </Stack>
      <MediaPicker open={!!picker} imagesOnly onClose={() => setPicker(null)}
        onSelect={(m) => { set(picker === 'logo' ? { logoId: m.id, logoUrl: m.url } : { faviconId: m.id, faviconUrl: m.url }); setPicker(null) }} />
    </Box>
  )
}
