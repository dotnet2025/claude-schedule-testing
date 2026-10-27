import { useEffect, useState, type FormEvent } from 'react'
import { Alert, Button, Paper, Stack, TextField, Typography } from '@mui/material'
import { settingsApi } from '../../api/endpoints'
import { useAsync } from '../../hooks/useAsync'
import { ErrorView, Loading } from '../../components/StateViews'
import MediaPicker from '../media/MediaPicker'
import { useToast } from '../../app/Toast'
import type { Settings } from '../../types'

export default function SettingsPage() {
  const toast = useToast()
  const { data, error, loading } = useAsync(() => settingsApi.get(), [])
  const [s, setS] = useState<Settings | null>(null)
  const [picker, setPicker] = useState<'logo' | 'favicon' | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  useEffect(() => { if (data) setS(data) }, [data])
  if (loading) return <Loading />
  if (error || !s) return <ErrorView message={error ?? 'Failed to load settings'} />
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
    <Stack component="form" spacing={2} onSubmit={save} noValidate sx={{ maxWidth: 720 }}>
      <Typography component="h1" variant="h4">Website settings</Typography>
      {err && <Alert severity="error">{err}</Alert>}
      <TextField label="Website name" required value={s.websiteName} onChange={(e) => set({ websiteName: e.target.value })} />
      <TextField label="Description" multiline minRows={2} value={s.description ?? ''} onChange={(e) => set({ description: e.target.value })} />
      <TextField label="Contact email" value={s.contactEmail ?? ''} onChange={(e) => set({ contactEmail: e.target.value })} />
      <TextField label="Footer text" value={s.footerText ?? ''} onChange={(e) => set({ footerText: e.target.value })} />
      <TextField label="Default SEO title" value={s.defaultSeoTitle ?? ''} onChange={(e) => set({ defaultSeoTitle: e.target.value })} />
      <TextField label="Default SEO description" multiline minRows={2} value={s.defaultSeoDescription ?? ''} onChange={(e) => set({ defaultSeoDescription: e.target.value })} />
      {(['logo', 'favicon'] as const).map((k) => (
        <Paper key={k} variant="outlined" sx={{ p: 2 }}>
          <Typography sx={{ textTransform: 'capitalize' }}>{k}</Typography>
          {s[`${k}Url`] && <img src={s[`${k}Url`]!} alt={k} style={{ maxHeight: 64, display: 'block', margin: '8px 0' }} />}
          <Stack direction="row" spacing={1}>
            <Button onClick={() => setPicker(k)}>Select {k}</Button>
            {s[`${k}Id`] && <Button color="error" onClick={() => set(k === 'logo' ? { logoId: null, logoUrl: null } : { faviconId: null, faviconUrl: null })}>Remove</Button>}
          </Stack>
        </Paper>
      ))}
      <Button type="submit" variant="contained" disabled={saving} sx={{ alignSelf: 'flex-start' }}>{saving ? 'Saving…' : 'Save settings'}</Button>
      <MediaPicker open={!!picker} imagesOnly onClose={() => setPicker(null)}
        onSelect={(m) => { set(picker === 'logo' ? { logoId: m.id, logoUrl: m.url } : { faviconId: m.id, faviconUrl: m.url }); setPicker(null) }} />
    </Stack>
  )
}
