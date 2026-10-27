import { Link as RouterLink } from 'react-router-dom'
import { Button, Card, CardContent, List, ListItem, ListItemText, Paper, Stack, Typography, Chip } from '@mui/material'
import Grid from '@mui/material/Grid'
import { dashboardApi } from '../../api/endpoints'
import { useAsync } from '../../hooks/useAsync'
import { Empty, ErrorView, Loading } from '../../components/StateViews'
import { useAuth } from '../../app/AuthContext'
import { formatDate } from '../../utils/format'

export default function DashboardPage() {
  const { user } = useAuth()
  const { data, error, loading } = useAsync(() => dashboardApi.get(), [])
  if (loading) return <Loading />
  if (error || !data) return <ErrorView message={error ?? 'Failed to load dashboard'} />
  const stats: [string, number | null][] = [
    ['Total pages', data.totalPages], ['Total posts', data.totalPosts], ['Published posts', data.publishedPosts],
    ['Draft posts', data.draftPosts], ['Media files', data.mediaFiles],
  ]
  if (user?.role === 'Admin' && data.totalUsers !== null) stats.push(['Total users', data.totalUsers])
  return (
    <Stack spacing={3}>
      <Typography component="h1" variant="h4">Dashboard</Typography>
      <Grid container spacing={2}>
        {stats.map(([label, value]) => (
          <Grid key={label} size={{ xs: 6, md: 4, lg: 2 }}>
            <Card><CardContent>
              <Typography color="text.secondary" variant="body2">{label}</Typography>
              <Typography variant="h4" aria-label={label}>{value}</Typography>
            </CardContent></Card>
          </Grid>
        ))}
      </Grid>
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>Quick actions</Typography>
        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
          <Button component={RouterLink} to="/admin/pages/new" variant="contained">Create page</Button>
          <Button component={RouterLink} to="/admin/posts/new" variant="contained">Create post</Button>
          <Button component={RouterLink} to="/admin/media" variant="outlined">Upload media</Button>
          {user?.role === 'Admin' && <Button component={RouterLink} to="/admin/users" variant="outlined">Manage users</Button>}
        </Stack>
      </Paper>
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6">Recently updated</Typography>
        {data.recent.length === 0 ? <Empty message="No content yet. Create your first page or post." /> : (
          <List>
            {data.recent.map((r) => (
              <ListItem key={`${r.type}-${r.id}`} component={RouterLink} to={`/admin/${r.type}s/${r.id}/edit`} sx={{ color: 'inherit' }}
                secondaryAction={<Chip size="small" label={r.status} color={r.status === 'Published' ? 'success' : 'default'} />}>
                <ListItemText primary={r.title} secondary={`${r.type} · ${formatDate(r.updatedAt)}`} />
              </ListItem>
            ))}
          </List>
        )}
      </Paper>
    </Stack>
  )
}
