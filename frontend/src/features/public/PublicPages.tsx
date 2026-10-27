import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { publicApi } from '../../api/endpoints'
import { useAsync } from '../../hooks/useAsync'
import { useDocumentMeta } from '../../hooks/useDocumentMeta'
import { ApiError } from '../../api/client'
import { formatDate } from '../../utils/format'
import type { Paged, PublicSummary } from '../../types'

const Status = ({ loading, error, empty, children }: { loading: boolean; error: string | null; empty?: boolean; children: React.ReactNode }) =>
  loading ? <p role="status">Loading…</p> : error ? <p role="alert">Something went wrong: {error}</p> : empty ? <p>Nothing here yet.</p> : <>{children}</>

export function PostCards({ items }: { items: PublicSummary[] }) {
  return (
    <div className="cards">
      {items.map((p) => (
        <article className="card" key={p.id}>
          {p.featuredImageUrl && <img src={p.featuredImageUrl} alt="" loading="lazy" />}
          <div className="card-body">
            <h2><Link to={`/blog/${p.slug}`}>{p.title}</Link></h2>
            <p className="meta">{p.publishedAt ? formatDate(p.publishedAt) : ''}{p.author ? ` · ${p.author}` : ''}</p>
            {p.summary && <p>{p.summary}</p>}
          </div>
        </article>
      ))}
    </div>
  )
}

function Pager({ data, onPage }: { data: Paged<PublicSummary>; onPage: (p: number) => void }) {
  if (data.totalPages <= 1) return null
  return (
    <nav className="pager" aria-label="Pagination">
      <button disabled={data.page <= 1} onClick={() => onPage(data.page - 1)}>Previous</button>
      <span>Page {data.page} of {data.totalPages}</span>
      <button disabled={data.page >= data.totalPages} onClick={() => onPage(data.page + 1)}>Next</button>
    </nav>
  )
}

function PostList({ category, heading }: { category?: string; heading: string }) {
  const [page, setPage] = useState(1)
  const { data, loading, error } = useAsync(() => publicApi.posts({ category, page, pageSize: 6 }), [category, page])
  useDocumentMeta(heading, undefined, category ? `/category/${category}` : '/blog')
  return (
    <>
      <h1>{heading}</h1>
      <Status loading={loading} error={error} empty={!data || data.items.length === 0}>
        {data && <><PostCards items={data.items} /><Pager data={data} onPage={setPage} /></>}
      </Status>
    </>
  )
}

export const HomePage = () => <PostList heading="Latest posts" />
export const BlogPage = () => <PostList heading="Blog" />
export function CategoryPage() { const { slug } = useParams(); return <PostList key={slug} category={slug} heading={`Category: ${slug}`} /> }

export function NotFoundPage() {
  useDocumentMeta('Page not found')
  return <><h1>404 – Page not found</h1><p>The page you requested does not exist. <Link to="/">Return home</Link>.</p></>
}

function Article({ loader, slug, base }: { loader: (s: string) => ReturnType<typeof publicApi.post>; slug: string; base: string }) {
  const { data, loading, error } = useAsync(() => loader(slug), [slug])
  useDocumentMeta(data ? (data.metaTitle || data.title) : null, data ? (data.metaDescription || data.summary) : null, data ? `${base}/${data.slug}` : undefined)
  const notFound = error && /not found/i.test(error)
  useEffect(() => { window.scrollTo?.(0, 0) }, [slug])
  if (notFound) return <NotFoundPage />
  return (
    <Status loading={loading} error={error}>
      {data && (
        <article className="article">
          <h1>{data.title}</h1>
          <p className="meta">{data.publishedAt ? formatDate(data.publishedAt) : ''}{data.author ? ` · ${data.author}` : ''}</p>
          {data.featuredImageUrl && <img src={data.featuredImageUrl} alt="" />}
          {/* Content is sanitised server-side with an allowlist before storage. */}
          <div dangerouslySetInnerHTML={{ __html: data.content }} />
          {data.categories.length > 0 && <p>{data.categories.map((c) => <Link key={c.id} to={`/category/${c.slug}`}>{c.name} </Link>)}</p>}
        </article>
      )}
    </Status>
  )
}

export function PostDetailPage() {
  const { slug = '' } = useParams()
  const related = useAsync(() => publicApi.related(slug).catch(() => [] as PublicSummary[]), [slug])
  return (
    <>
      <Article loader={publicApi.post} slug={slug} base="/blog" />
      {related.data && related.data.length > 0 && <section aria-label="Related posts"><h2>Related posts</h2><PostCards items={related.data} /></section>}
    </>
  )
}
export function CmsPage() { const { slug = '' } = useParams(); return <Article loader={publicApi.page} slug={slug} base="/pages" /> }

export function SearchPage() {
  const [params] = useSearchParams()
  const q = params.get('q') ?? ''
  const { data, loading, error } = useAsync(() => (q ? publicApi.search(q) : Promise.resolve([])), [q])
  useDocumentMeta(`Search: ${q}`)
  return (
    <>
      <h1>Search results{q ? ` for “${q}”` : ''}</h1>
      <Status loading={loading} error={error} empty={!q || !data || data.length === 0}>
        <ul>{(data ?? []).map((r) => {
          const [kind, slug] = r.slug.split(/:(.+)/)
          return <li key={r.slug}><Link to={kind === 'page' ? `/pages/${slug}` : `/blog/${slug}`}>{r.title}</Link>{r.summary && <p>{r.summary}</p>}</li>
        })}</ul>
      </Status>
    </>
  )
}

export const isNotFound = (e: unknown) => e instanceof ApiError && e.status === 404
