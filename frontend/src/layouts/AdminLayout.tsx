import { useState, type ReactNode } from 'react'
import { Link as RouterLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { AppBar, Avatar, Box, Button, Divider, Drawer, IconButton, List, ListItemButton, ListItemIcon, ListItemText, ListSubheader, Toolbar, Tooltip, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import MenuIcon from '@mui/icons-material/Menu'
import DashboardOutlined from '@mui/icons-material/DashboardOutlined'
import DescriptionOutlined from '@mui/icons-material/DescriptionOutlined'
import ArticleOutlined from '@mui/icons-material/ArticleOutlined'
import PermMediaOutlined from '@mui/icons-material/PermMediaOutlined'
import CategoryOutlined from '@mui/icons-material/CategoryOutlined'
import LocalOfferOutlined from '@mui/icons-material/LocalOfferOutlined'
import PeopleOutline from '@mui/icons-material/PeopleOutline'
import SettingsOutlined from '@mui/icons-material/SettingsOutlined'
import OpenInNew from '@mui/icons-material/OpenInNew'
import Logout from '@mui/icons-material/Logout'
import { useAuth } from '../app/AuthContext'
import BrandLogo from '../components/BrandLogo'
import { brand, tokens } from '../theme'

interface NavItem { to: string; label: string; icon: ReactNode; end?: boolean; admin?: boolean }
const groups: { title: string; items: NavItem[] }[] = [
  { title: 'Overview', items: [{ to: '/admin', label: 'Dashboard', icon: <DashboardOutlined />, end: true }] },
  { title: 'Content', items: [
    { to: '/admin/pages', label: 'Pages', icon: <DescriptionOutlined /> }, { to: '/admin/posts', label: 'Posts', icon: <ArticleOutlined /> },
    { to: '/admin/media', label: 'Media', icon: <PermMediaOutlined /> }, { to: '/admin/categories', label: 'Categories', icon: <CategoryOutlined /> },
    { to: '/admin/tags', label: 'Tags', icon: <LocalOfferOutlined /> },
  ] },
  { title: 'Administration', items: [
    { to: '/admin/users', label: 'Users', icon: <PeopleOutline />, admin: true }, { to: '/admin/settings', label: 'Settings', icon: <SettingsOutlined />, admin: true },
  ] },
]

const W = tokens.layout.sidebarWidth
const navy = brand.colors.navy

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const nav = useNavigate()
  const loc = useLocation()
  const [open, setOpen] = useState(false)

  const drawer = (
    <Box component="nav" aria-label="Admin navigation" sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: navy, color: 'common.white' }}>
      <Toolbar sx={{ minHeight: tokens.layout.topBarHeight, px: 2.5 }}><BrandLogo variant="light" height={34} /></Toolbar>
      <Divider sx={{ borderColor: alpha('#fff', 0.1) }} />
      <Box sx={{ flex: 1, overflowY: 'auto', py: 1 }}>
        {groups.map((g) => {
          const visible = g.items.filter((i) => !i.admin || user?.role === 'Admin')
          if (!visible.length) return null
          return (
            <List key={g.title} dense disablePadding subheader={<ListSubheader disableSticky sx={{ bgcolor: 'transparent', color: alpha('#fff', 0.6), fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', lineHeight: '32px', px: 2.5, mt: 1 }}>{g.title}</ListSubheader>}>
              {visible.map((i) => {
                const selected = i.end ? loc.pathname === i.to : loc.pathname.startsWith(i.to)
                return (
                  <ListItemButton key={i.to} component={RouterLink} to={i.to} selected={selected} onClick={() => setOpen(false)} aria-current={selected ? 'page' : undefined}
                    sx={{ mx: 1.5, my: 0.25, borderRadius: 2, minHeight: 44, color: alpha('#fff', 0.85),
                      '& .MuiListItemIcon-root': { color: 'inherit', minWidth: 38 },
                      '&:hover': { bgcolor: alpha('#fff', 0.08) },
                      '&.Mui-selected': { bgcolor: brand.colors.primary, color: '#fff', '&:hover': { bgcolor: brand.colors.primary } } }}>
                    <ListItemIcon aria-hidden>{i.icon}</ListItemIcon><ListItemText primary={i.label} primaryTypographyProps={{ fontWeight: selected ? 700 : 500 }} />
                  </ListItemButton>
                )
              })}
            </List>
          )
        })}
      </Box>
      <Divider sx={{ borderColor: alpha('#fff', 0.1) }} />
      <List sx={{ py: 1 }}>
        <ListItemButton component={RouterLink} to="/" target="_blank" rel="noopener" sx={{ mx: 1.5, borderRadius: 2, minHeight: 44, color: alpha('#fff', 0.85), '&:hover': { bgcolor: alpha('#fff', 0.08) } }}>
          <ListItemIcon aria-hidden sx={{ color: 'inherit', minWidth: 38 }}><OpenInNew /></ListItemIcon><ListItemText primary="View site" />
        </ListItemButton>
      </List>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Box component="a" href="#admin-main" sx={{ position: 'absolute', left: -9999, '&:focus': { left: 8, top: 8, zIndex: 2000, bgcolor: 'background.paper', p: 1, borderRadius: 1 } }}>Skip to content</Box>
      <AppBar position="fixed" color="inherit" elevation={0} sx={{ zIndex: (t) => t.zIndex.drawer + 1, ml: { md: `${W}px` }, width: { md: `calc(100% - ${W}px)` }, bgcolor: 'background.paper', color: 'text.primary', borderBottom: 1, borderColor: 'divider' }}>
        <Toolbar sx={{ minHeight: tokens.layout.topBarHeight, gap: 1 }}>
          <IconButton edge="start" aria-label="Open navigation" onClick={() => setOpen(true)} sx={{ display: { md: 'none' } }}><MenuIcon /></IconButton>
          <Box sx={{ display: { md: 'none' }, minWidth: 0 }}><BrandLogo height={28} /></Box>
          <Box sx={{ flexGrow: 1 }} />
          <Tooltip title="My profile">
            <IconButton component={RouterLink} to="/admin/profile" aria-label="My profile" sx={{ p: 0.5 }}>
              <Avatar sx={{ width: 34, height: 34, bgcolor: 'primary.main', fontSize: '0.9rem' }}>{(user?.displayName ?? '?').charAt(0).toUpperCase()}</Avatar>
            </IconButton>
          </Tooltip>
          <Typography noWrap sx={{ display: { xs: 'none', md: 'block' }, maxWidth: 260, fontWeight: 600 }}>{user?.displayName} ({user?.role})</Typography>
          <Button color="inherit" startIcon={<Logout />} onClick={async () => { await logout(); nav('/login') }} sx={{ color: 'text.secondary' }}>Sign out</Button>
        </Toolbar>
      </AppBar>
      <Drawer variant="temporary" open={open} onClose={() => setOpen(false)} ModalProps={{ keepMounted: true }} sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { width: W, maxWidth: '85vw', border: 0 } }}>{drawer}</Drawer>
      <Drawer variant="permanent" sx={{ display: { xs: 'none', md: 'block' }, width: W, flexShrink: 0, '& .MuiDrawer-paper': { width: W, border: 0 } }} open>{drawer}</Drawer>
      <Box component="main" id="admin-main" sx={{ flexGrow: 1, minWidth: 0, width: { md: `calc(100% - ${W}px)` }, px: { xs: 2, sm: 3, lg: 4 }, pb: 4 }}>
        <Toolbar sx={{ minHeight: tokens.layout.topBarHeight }} />
        <Box sx={{ maxWidth: tokens.layout.contentMaxWidth, mx: 'auto', pt: { xs: 2, md: 3 } }}><Outlet /></Box>
      </Box>
    </Box>
  )
}
