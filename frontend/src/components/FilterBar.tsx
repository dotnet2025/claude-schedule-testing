import type { ReactNode } from 'react'
import { Paper, Stack } from '@mui/material'

/** Search / filter row shown above listings; stacks on small screens. */
export default function FilterBar({ children }: { children: ReactNode }) {
  return (
    <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 3 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', sm: 'center' }} useFlexGap flexWrap="wrap">{children}</Stack>
    </Paper>
  )
}
