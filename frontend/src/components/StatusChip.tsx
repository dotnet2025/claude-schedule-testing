import { Chip } from '@mui/material'

type Tone = 'success' | 'default' | 'warning' | 'error' | 'info'
const toneFor = (label: string): Tone => {
  switch (label.toLowerCase()) {
    case 'published': case 'active': return 'success'
    case 'draft': case 'inactive': return 'default'
    case 'admin': return 'info'
    default: return 'default'
  }
}

/** Consistent status/role chip. Tone is derived from the label unless given. */
export default function StatusChip({ label, tone }: { label: string; tone?: Tone }) {
  const t = tone ?? toneFor(label)
  return <Chip size="small" label={label} color={t} variant={t === 'default' ? 'outlined' : 'filled'} sx={{ minWidth: 72 }} />
}
