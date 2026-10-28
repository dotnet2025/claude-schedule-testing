import type { ReactNode } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { Box, Button, Card, CardContent, List, ListItemButton, ListItemText, Paper, Skeleton, Stack, Typography } from '@mui/material'
import Grid from '@mui/material/Grid'
import { alpha } from '@mui/material/styles'
import DescriptionOutlined from '@mui/icons-material/DescriptionOutlined'
import ArticleOutlined from '@mui/icons-material/ArticleOutlined'
import CheckCircleOutline from '@mui/icons-material/CheckCircleOutline'
import EditNote from '@mui/icons-material/EditNote'
import PermMediaOutlined from '@mui/icons-material/PermMediaOutlined'
import PeopleOutline from '@mui/icons-material/PeopleOutline'
import { dashboardApi } from '../../api/endpoints'
import { useAsync } from '../../hooks/useAsync'
import { Empty, ErrorView, Loading } from '../../components/StateViews'
import PageHeader from '../../components/PageHeader'
import StatusChip from '../../components/StatusChip'
import { useAuth } from '../../app/AuthContext'
import { formatDate } from '../../utils/format'

type Tone = 'primary' | 'success' | 'warning' | 'info' | 'secondary'
interface Stat { label: string; value: number | null; icon: ReactNode; tone: Tone }

function StatCard({ label, value, icon, tone }: Stat) {
  return (
    <Card sx={{ height: '100%', '&:hover': { boxShadow: 3 } }}>
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box aria-hidden sx={{ width: 48, height: 48, borderRadius: 3, display: 'grid', placeItems: 'center', flexShrink: 0, color: `${tone}.main`, bgcolor: (t) => alpha(t.palette[tone].main, 0.1) }}>{icon}</Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography color="text.secondary" variant="body2" noWrap>{label}</Typography>
          <Typography variant="h4" component="p" aria-label={label}>{value}</Typography>
        </Box>
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const { data, error, loading, reload } = useAsync(() => dashboardApi.get(), [])
  const header = <PageHeader title="Dashboard" subtitle={user ? `Welcome back, ${user.displayName}.` : undefined} />
  if (loading) return <>{header}<Grid container spacing={2}>{Array.from({ length: 5 }, (_, i) => <Grid key={i} size={{ xs: 12, sm: 6, lg: 4, xl: 2 }}><Skeleton variant="rounded" height={88} /></Grid>)}</Grid><Loading /></>
  if (error || !data) return <>{header}<ErrorView message={error ?? 'Failed to load dashboard'} onRetry={reload} /></>
  const stats: Stat[] = [
    { label: 'Total pages', value: data.totalPages, icon: <DescriptionOutlined />, tone: 'primary' },
    { label: 'Total posts', value: data.totalPosts, icon: <ArticleOutlined />, tone: 'info' },
    { label: 'Published posts', value: data.publishedPosts, icon: <CheckCircleOutline />, tone: 'success' },
    { label: 'Draft posts', value: data.draftPosts, icon: <EditNote />, tone: 'warning' },
    { label: 'Media files', value: data.mediaFiles, icon: <PermMediaOutlined />, tone: 'secondary' },
  ]
  if (user?.role === 'Admin' && data.totalUsers !== null) stats.push({ label: 'Total users', value: data.totalUsers, icon: <PeopleOutline />, tone: 'primary' })
  return (
    <Stack spacing={3}>
      {header}
      <Grid container spacing={2}>
        {stats.map((s) => <Grid key={s.label} size={{ xs: 12, sm: 6, lg: 4, xl: 2 }}><StatCard {...s} /></Grid>)}
      </Grid>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 4 }}>
          <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>Quick actions</Typography>
            <Stack spacing={1.5}>
              <Button component={RouterLink} to="/admin/pages/new" variant="contained">Create page</Button>
              <Button component={RouterLink} to="/admin/posts/new" variant="contained">Create post</Button>
              <Button component={RouterLink} to="/admin/media" variant="outlined">Upload media</Button>
              {user?.role === 'Admin' && <Button component={RouterLink} to="/admin/users" variant="outlined">Manage users</Button>}
            </Stack>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, height: '100%' }}>
            <Typography variant="h6">Recently updated</Typography>
            {data.recent.length === 0 ? <Empty message="No content yet. Create your first page or post." /> : (
              <List disablePadding sx={{ mt: 1 }}>
                {data.recent.map((r) => (
                  <ListItemButton key={`${r.type}-${r.id}`} component={RouterLink} to={`/admin/${r.type}s/${r.id}/edit`} sx={{ borderRadius: 2, gap: 1 }}>
                    <ListItemText primary={r.title} secondary={`${r.type} · ${formatDate(r.updatedAt)}`} primaryTypographyProps={{ noWrap: true, fontWeight: 600 }} />
                    <StatusChip label={r.status} />
                  </ListItemButton>
                ))}
              </List>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Stack>
  )
}
