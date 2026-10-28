import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Alert, Autocomplete, Box, Button, Paper, Stack, TextField, Typography } from '@mui/material'
import Grid from '@mui/material/Grid'
import { categoriesApi, pagesApi, postsApi, tagsApi } from '../../api/endpoints'
import { useAsync } from '../../hooks/useAsync'
import { ErrorView, Loading } from '../../components/StateViews'
import PageHeader from '../../components/PageHeader'
import StatusChip from '../../components/StatusChip'
import RichTextEditor from '../../components/RichTextEditor'
import MediaPicker from '../media/MediaPicker'
import { useToast } from '../../app/Toast'
import { slugify } from '../../utils/format'
import type { Content, ContentInput, Taxonomy } from '../../types'
import type { ContentKind } from './ContentListPage'

interface Form { title: string; slug: string; content: string; summary: string; metaTitle: string; metaDescription: string; featuredImageId: number | null; featuredImageUrl: string | null; categories: Taxonomy[]; tags: Taxonomy[] }
const blank: Form = { title: '', slug: '', content: '', summary: '', metaTitle: '', metaDescription: '', featuredImageId: null, featuredImageUrl: null, categories: [], tags: [] }

export function validate(f: Pick<Form, 'title' | 'slug' | 'metaTitle' | 'metaDescription'>) {
  const e: Record<string, string> = {}
  if (!f.title.trim()) e.title = 'Title is required'
  else if (f.title.length > 200) e.title = 'Title must be 200 characters or fewer'
  if (f.slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(f.slug)) e.slug = 'Use lowercase letters, numbers and single hyphens'
  if (f.metaTitle.length > 200) e.metaTitle = 'Meta title must be 200 characters or fewer'
  if (f.metaDescription.length > 400) e.metaDescription = 'Meta description must be 400 characters or fewer'
  return e
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}><Typography variant="subtitle1" component="h2" sx={{ mb: 1.5 }}>{title}</Typography><Stack spacing={2}>{children}</Stack></Paper>
}

export default function ContentEditPage({ kind }: { kind: ContentKind }) {
  const api = kind === 'pages' ? pagesApi : postsApi
  const { id } = useParams()
  const isNew = !id
  const nav = useNavigate()
  const toast = useToast()
  const [form, setForm] = useState<Form>(blank)
  const [loaded, setLoaded] = useState<Content | null>(null)
  const [slugTouched, setSlugTouched] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const existing = useAsync(() => (isNew ? Promise.resolve(null) : api.get(Number(id))), [kind, id])
  const cats = useAsync(() => (kind === 'posts' ? categoriesApi.list() : Promise.resolve([] as Taxonomy[])), [kind])
  const tags = useAsync(() => (kind === 'posts' ? tagsApi.list() : Promise.resolve([] as Taxonomy[])), [kind])

  useEffect(() => {
    const c = existing.data
    if (!c) return
    setLoaded(c); setSlugTouched(true)
    setForm({ title: c.title, slug: c.slug, content: c.content, summary: (kind === 'pages' ? c.shortDescription : c.excerpt) ?? '', metaTitle: c.metaTitle ?? '', metaDescription: c.metaDescription ?? '', featuredImageId: c.featuredImageId ?? null, featuredImageUrl: c.featuredImageUrl ?? null, categories: c.categories, tags: c.tags })
  }, [existing.data, kind])

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }))
  const onTitle = (title: string) => setForm((f) => ({ ...f, title, slug: !slugTouched && isNew ? slugify(title) : f.slug }))

  const save = async (e?: FormEvent, publish?: boolean) => {
    e?.preventDefault()
    if (saving) return // guards double submit
    const v = validate(form); setErrors(v); setServerError(null)
    if (Object.keys(v).length) return
    const input: ContentInput = {
      title: form.title.trim(), slug: form.slug || undefined, content: form.content, metaTitle: form.metaTitle || undefined, metaDescription: form.metaDescription || undefined,
      featuredImageId: form.featuredImageId, concurrencyStamp: loaded?.concurrencyStamp,
      ...(kind === 'pages' ? { shortDescription: form.summary } : { excerpt: form.summary, categoryIds: form.categories.map((c) => c.id), tagIds: form.tags.map((t) => t.id) }),
    }
    setSaving(true)
    try {
      let saved = isNew ? await api.create(input) : await api.update(Number(id), input)
      if (publish !== undefined && (saved.status === 'Published') !== publish) saved = await (publish ? api.publish(saved.id) : api.unpublish(saved.id))
      toast(publish === true ? 'Saved and published' : publish === false ? 'Saved and unpublished' : 'Saved')
      if (isNew) nav(`/admin/${kind}/${saved.id}/edit`, { replace: true })
      else setLoaded(saved)
    } catch (err) { setServerError((err as Error).message) } finally { setSaving(false) }
  }

  if (!isNew && existing.loading) return <Loading />
  if (existing.error) return <ErrorView message={existing.error} onRetry={existing.reload} />
  const noun = kind === 'pages' ? 'page' : 'post'
  const label = kind === 'pages' ? 'Pages' : 'Posts'
  const published = loaded?.status === 'Published'

  return (
    <Box component="form" onSubmit={save} noValidate aria-label={`${noun} form`}>
      <PageHeader title={isNew ? `New ${noun}` : `Edit ${noun}`} badge={loaded && <StatusChip label={loaded.status} />}
        breadcrumbs={[{ label: 'Dashboard', to: '/admin' }, { label, to: `/admin/${kind}` }, { label: isNew ? `New ${noun}` : `Edit ${noun}` }]}
        subtitle={loaded ? `Last updated by ${loaded.updatedBy ?? loaded.createdBy ?? 'unknown'}` : undefined} />
      {serverError && <Alert severity="error" sx={{ mb: 2 }}>{serverError}</Alert>}
      <Grid container spacing={3} alignItems="flex-start">
        <Grid size={{ xs: 12, lg: 8 }}>
          <Stack spacing={3}>
            <Section title="Content">
              <TextField label="Title" required value={form.title} onChange={(e) => onTitle(e.target.value)} error={!!errors.title} helperText={errors.title} />
              <TextField label="Slug" value={form.slug} onChange={(e) => { setSlugTouched(true); set('slug', e.target.value) }} error={!!errors.slug}
                helperText={errors.slug ?? 'Auto-generated from the title; existing slugs are preserved when editing.'} />
              <RichTextEditor value={form.content} onChange={(h) => set('content', h)} />
              <TextField label={kind === 'pages' ? 'Short description' : 'Excerpt'} multiline minRows={2} value={form.summary} onChange={(e) => set('summary', e.target.value)} />
            </Section>
            <Section title="Search engine optimisation">
              <TextField label="Meta title" value={form.metaTitle} onChange={(e) => set('metaTitle', e.target.value)} error={!!errors.metaTitle} helperText={errors.metaTitle ?? `${form.metaTitle.length}/200`} />
              <TextField label="Meta description" multiline minRows={2} value={form.metaDescription} onChange={(e) => set('metaDescription', e.target.value)} error={!!errors.metaDescription} helperText={errors.metaDescription ?? `${form.metaDescription.length}/400`} />
            </Section>
          </Stack>
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }} sx={{ position: { lg: 'sticky' }, top: { lg: 88 } }}>
          <Stack spacing={3}>
            <Section title="Publish">
              <Button type="submit" variant="contained" disabled={saving}>{saving ? 'Saving…' : 'Save draft'}</Button>
              {published
                ? <Button variant="outlined" disabled={saving} onClick={() => save(undefined, false)}>Save &amp; unpublish</Button>
                : <Button variant="outlined" color="success" disabled={saving} onClick={() => save(undefined, true)}>Save &amp; publish</Button>}
              <Button color="inherit" onClick={() => nav(`/admin/${kind}`)}>Cancel</Button>
            </Section>
            {kind === 'posts' && (
              <Section title="Organise">
                <Autocomplete multiple options={cats.data ?? []} value={form.categories} getOptionLabel={(o) => o.name} isOptionEqualToValue={(a, b) => a.id === b.id}
                  onChange={(_, v) => set('categories', v)} renderInput={(p) => <TextField {...p} label="Categories" />} />
                <Autocomplete multiple options={tags.data ?? []} value={form.tags} getOptionLabel={(o) => o.name} isOptionEqualToValue={(a, b) => a.id === b.id}
                  onChange={(_, v) => set('tags', v)} renderInput={(p) => <TextField {...p} label="Tags" />} />
              </Section>
            )}
            <Section title="Featured image">
              {form.featuredImageUrl && <Box component="img" src={form.featuredImageUrl} alt="Featured" sx={{ width: '100%', maxHeight: 220, objectFit: 'cover', borderRadius: 2, border: 1, borderColor: 'divider' }} />}
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                <Button variant="outlined" onClick={() => setPickerOpen(true)}>{form.featuredImageId ? 'Change image' : 'Select image'}</Button>
                {form.featuredImageId && <Button color="error" onClick={() => { set('featuredImageId', null); set('featuredImageUrl', null) }}>Remove image</Button>}
              </Stack>
            </Section>
          </Stack>
        </Grid>
      </Grid>
      <MediaPicker open={pickerOpen} imagesOnly onClose={() => setPickerOpen(false)} onSelect={(m) => { set('featuredImageId', m.id); set('featuredImageUrl', m.url); setPickerOpen(false) }} />
    </Box>
  )
}
