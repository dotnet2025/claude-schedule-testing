import { Box } from '@mui/material'
import { brand } from '../theme'

interface Props { height?: number; variant?: 'dark' | 'light'; src?: string | null }

/** Renders the brand logo with an explicit height only, so the aspect ratio is never distorted. */
export default function BrandLogo({ height = 36, variant = 'dark', src }: Props) {
  const url = src || (variant === 'light' ? brand.logo.srcLight : brand.logo.src)
  return <Box component="img" src={url} alt={brand.logo.alt} sx={{ height, width: 'auto', maxWidth: '100%', display: 'block', objectFit: 'contain' }} />
}
