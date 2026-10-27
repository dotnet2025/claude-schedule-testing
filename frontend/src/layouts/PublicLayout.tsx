import { useState, type FormEvent } from 'react'
import { Link as RouterLink, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { settingsApi, publicApi } from '../api/endpoints'
import { useAsync } from '../hooks/useAsync'
import type { PublicSummary, Settings } from '../types'
import '../styles/public.css'

export default function PublicLayout() {
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const [menu, setMenu] = useState(false)
  const settings = useAsync<Settings | null>(() => settingsApi.get().catch(() => null), [])
  const pages = useAsync<PublicSummary[]>(() => publicApi.pages().then((p) => p.items).catch(() => []), [])
  const s = settings.data

  useEffect(() => {
    if (s?.faviconUrl) {
      let l = document.head.querySelector<HTMLLinkElement>('link[rel="icon"]')
      if (!l) { l = document.createElement('link'); l.rel = 'icon'; document.head.appendChild(l) }
      l.href = s.faviconUrl
    }
  }, [s?.faviconUrl])

  const search = (e: FormEvent) => { e.preventDefault(); if (q.trim()) nav(`/search?q=${encodeURIComponent(q.trim())}`) }
  return (
    <div className="site">
      <a href="#main" className="skip">Skip to content</a>
      <header className="site-header">
        <RouterLink to="/" className="brand">{s?.logoUrl && <img src={s.logoUrl} alt="" height={32} />}<span>{s?.websiteName ?? 'Site'}</span></RouterLink>
        <button className="menu-btn" aria-expanded={menu} aria-controls="site-nav" onClick={() => setMenu(!menu)}>Menu</button>
        <nav id="site-nav" aria-label="Main" className={menu ? 'open' : ''} onClick={() => setMenu(false)}>
          <NavLink to="/" end>Home</NavLink><NavLink to="/blog">Blog</NavLink>
          {(pages.data ?? []).map((p) => <NavLink key={p.id} to={`/pages/${p.slug}`}>{p.title}</NavLink>)}
        </nav>
        <form role="search" onSubmit={search}><input aria-label="Search" placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} /></form>
      </header>
      <main id="main"><Outlet context={s} /></main>
      <footer className="site-footer"><p>{s?.footerText ?? ''}</p>{s?.contactEmail && <p><a href={`mailto:${s.contactEmail}`}>{s.contactEmail}</a></p>}</footer>
    </div>
  )
}
