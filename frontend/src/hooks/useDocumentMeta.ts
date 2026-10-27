import { useEffect } from 'react'

/** Sets document title and meta description (client-side; see docs/architecture.md for SSR/prerender notes). */
export function useDocumentMeta(title?: string | null, description?: string | null, canonicalPath?: string) {
  useEffect(() => {
    if (title) document.title = title
    const setMeta = (name: string, content?: string | null) => {
      let el = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`)
      if (!content) { el?.remove(); return }
      if (!el) { el = document.createElement('meta'); el.name = name; document.head.appendChild(el) }
      el.content = content
    }
    setMeta('description', description)
    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (canonicalPath) {
      if (!link) { link = document.createElement('link'); link.rel = 'canonical'; document.head.appendChild(link) }
      link.href = window.location.origin + canonicalPath
    } else link?.remove()
  }, [title, description, canonicalPath])
}
