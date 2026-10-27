import { useState } from 'react'
import { Link as RouterLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { AppBar, Box, Breadcrumbs, Button, Divider, Drawer, IconButton, List, ListItemButton, ListItemText, Toolbar, Typography, Link } from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import { useAuth } from '../app/AuthContext'

const WIDTH = 220
const items = [
  { to: '/admin', label: 'Dashboard', end: true }, { to: '/admin/pages', label: 'Pages' }, { to: '/admin/posts', label: 'Posts' },
  { to: '/admin/media', label: 'Media' }, { to: '/admin/categories', label: 'Categories' }, { to: '/admin/tags', label: 'Tags' },
  { to: '/admin/users', label: 'Users', admin: true }, { to: '/admin/settings', label: 'Settings', admin: true },
]

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const nav = useNavigate()
  const loc = useLocation()
  const [open, setOpen] = useState(false)
  const crumbs = loc.pathname.split('/').filter(Boolean)

  const drawer = (
    <Box component="nav" aria-label="Admin navigation">
      <Toolbar><Typography variant="h6">CMS Admin</Typography></Toolbar>
      <Divider />
      <List>
        {items.filter((i) => !i.admin || user?.role === 'Admin').map((i) => {
          const selected = i.end ? loc.pathname === i.to : loc.pathname.startsWith(i.to)
          return <ListItemButton key={i.to} component={RouterLink} to={i.to} selected={selected} onClick={() => setOpen(false)} aria-current={selected ? 'page' : undefined}><ListItemText primary={i.label} /></ListItemButton>
        })}
        <ListItemButton component={RouterLink} to="/" target="_blank"><ListItemText primary="View site" /></ListItemButton>
      </List>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar position="fixed" sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton color="inherit" edge="start" aria-label="Open navigation" onClick={() => setOpen(true)} sx={{ mr: 1, display: { md: 'none' } }}><MenuIcon /></IconButton>
          <Typography sx={{ flexGrow: 1 }} noWrap>{user?.displayName} ({user?.role})</Typography>
          <Button color="inherit" onClick={async () => { await logout(); nav('/login') }}>Sign out</Button>
        </Toolbar>
      </AppBar>
      <Drawer variant="temporary" open={open} onClose={() => setOpen(false)} ModalProps={{ keepMounted: true }} sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { width: WIDTH } }}>{drawer}</Drawer>
      <Drawer variant="permanent" sx={{ display: { xs: 'none', md: 'block' }, width: WIDTH, '& .MuiDrawer-paper': { width: WIDTH } }} open>{drawer}</Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 3 }, minWidth: 0 }}>
        <Toolbar />
        <Breadcrumbs aria-label="Breadcrumb" sx={{ mb: 2 }}>
          {crumbs.map((c, i) => i === crumbs.length - 1
            ? <Typography key={c + i} color="text.primary" sx={{ textTransform: 'capitalize' }}>{c}</Typography>
            : <Link key={c + i} component={RouterLink} underline="hover" color="inherit" to={'/' + crumbs.slice(0, i + 1).join('/')} sx={{ textTransform: 'capitalize' }}>{c}</Link>)}
        </Breadcrumbs>
        <Outlet />
      </Box>
    </Box>
  )
}
