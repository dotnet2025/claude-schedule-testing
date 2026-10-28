import { api, qs } from './client'
import type { AuthResponse, Company, CompanyUser, CreateCompanyUserInput, CreatedCompanyUserResult, UserCompany, Content, ContentInput, ContentSummary, Dashboard, Media, Paged, PublicContent, PublicSummary, Settings, Taxonomy, User } from '../types'

export const authApi = {
  login: (email: string, password: string) => api<AuthResponse>('/api/auth/login', { method: 'POST', json: { email, password } }),
  logout: () => api<void>('/api/auth/logout', { method: 'POST', json: {} }),
  me: () => api<User>('/api/auth/me'),
  changePassword: (currentPassword: string, newPassword: string) => api<void>('/api/auth/change-password', { method: 'POST', json: { currentPassword, newPassword } }),
}

export type ListParams = { search?: string; status?: string; sortBy?: string; desc?: boolean; page?: number; pageSize?: number }
const contentApi = (base: 'pages' | 'posts') => ({
  list: (p: ListParams) => api<Paged<ContentSummary>>(`/api/${base}${qs(p)}`),
  get: (id: number) => api<Content>(`/api/${base}/${id}`),
  create: (d: ContentInput) => api<Content>(`/api/${base}`, { method: 'POST', json: d }),
  update: (id: number, d: ContentInput) => api<Content>(`/api/${base}/${id}`, { method: 'PUT', json: d }),
  remove: (id: number) => api<void>(`/api/${base}/${id}`, { method: 'DELETE' }),
  publish: (id: number) => api<Content>(`/api/${base}/${id}/publish`, { method: 'PATCH' }),
  unpublish: (id: number) => api<Content>(`/api/${base}/${id}/unpublish`, { method: 'PATCH' }),
})
export const pagesApi = contentApi('pages')
export const postsApi = contentApi('posts')

const taxApi = (base: 'categories' | 'tags') => ({
  list: () => api<Taxonomy[]>(`/api/${base}`),
  create: (d: { name: string; slug?: string; description?: string }) => api<Taxonomy>(`/api/${base}`, { method: 'POST', json: d }),
  update: (id: number, d: { name: string; slug?: string; description?: string }) => api<Taxonomy>(`/api/${base}/${id}`, { method: 'PUT', json: d }),
  remove: (id: number) => api<void>(`/api/${base}/${id}`, { method: 'DELETE' }),
})
export const categoriesApi = taxApi('categories')
export const tagsApi = taxApi('tags')

export const mediaApi = {
  list: (p: { search?: string; type?: string; page?: number; pageSize?: number }) => api<Paged<Media>>(`/api/media${qs(p)}`),
  upload: (file: File) => { const f = new FormData(); f.append('file', file); return api<Media>('/api/media', { method: 'POST', body: f }) },
  remove: (id: number) => api<void>(`/api/media/${id}`, { method: 'DELETE' }),
}

export const usersApi = {
  list: (p: { search?: string; page?: number; pageSize?: number }) => api<Paged<User>>(`/api/users${qs(p)}`),
  create: (d: { email: string; displayName: string; password: string; role: string }) => api<User>('/api/users', { method: 'POST', json: d }),
  update: (id: number, d: { displayName: string; role: string; isActive: boolean; newPassword?: string }) => api<User>(`/api/users/${id}`, { method: 'PUT', json: d }),
  remove: (id: number) => api<void>(`/api/users/${id}`, { method: 'DELETE' }),
}

export const settingsApi = {
  get: () => api<Settings>('/api/settings'),
  update: (s: Settings) => api<Settings>('/api/settings', { method: 'PUT', json: s }),
}
export const dashboardApi = { get: () => api<Dashboard>('/api/dashboard') }

export const publicApi = {
  posts: (p: { category?: string; tag?: string; search?: string; page?: number; pageSize?: number }) => api<Paged<PublicSummary>>(`/api/public/posts${qs(p)}`),
  post: (slug: string) => api<PublicContent>(`/api/public/posts/${encodeURIComponent(slug)}`),
  related: (slug: string) => api<PublicSummary[]>(`/api/public/posts/${encodeURIComponent(slug)}/related`),
  pages: () => api<Paged<PublicSummary>>('/api/public/pages?pageSize=50'),
  page: (slug: string) => api<PublicContent>(`/api/public/pages/${encodeURIComponent(slug)}`),
  search: (q: string) => api<PublicSummary[]>(`/api/public/search${qs({ q })}`),
}

export type CompanyUserQuery = {
  search?: string; companyId?: number; userId?: number; userIsActive?: boolean; assignmentIsActive?: boolean
  sortBy?: string; desc?: boolean; page?: number; pageSize?: number
}
export const companiesApi = {
  list: (p: { search?: string; isActive?: boolean; page?: number; pageSize?: number }) => api<Paged<Company>>(`/api/companies${qs(p)}`),
  get: (id: number) => api<Company>(`/api/companies/${id}`),
  create: (d: { companyCode: string; companyName: string; isActive: boolean }) => api<Company>('/api/companies', { method: 'POST', json: d }),
  update: (id: number, d: { companyCode: string; companyName: string; isActive: boolean }) => api<Company>(`/api/companies/${id}`, { method: 'PUT', json: d }),
  users: (id: number, p: { search?: string; assignmentIsActive?: boolean; page?: number; pageSize?: number }) => api<Paged<CompanyUser>>(`/api/companies/${id}/users${qs(p)}`),
  createUser: (id: number, d: CreateCompanyUserInput) => api<CreatedCompanyUserResult>(`/api/companies/${id}/users`, { method: 'POST', json: d }),
  assignExisting: (id: number, d: { userId: number; isActive: boolean; isPrimaryCompany: boolean }) => api<CompanyUser>(`/api/companies/${id}/users/assign`, { method: 'POST', json: d }),
}
export const companyUsersApi = {
  list: (p: CompanyUserQuery) => api<Paged<CompanyUser>>(`/api/company-users${qs(p)}`),
  get: (id: number) => api<CompanyUser>(`/api/company-users/${id}`),
  assign: (d: { companyId: number; userId: number; isActive: boolean; isPrimaryCompany: boolean }) => api<CompanyUser>('/api/company-users', { method: 'POST', json: d }),
  update: (id: number, d: { isActive: boolean; isPrimaryCompany: boolean }) => api<CompanyUser>(`/api/company-users/${id}`, { method: 'PUT', json: d }),
  unassign: (id: number) => api<void>(`/api/company-users/${id}`, { method: 'DELETE' }),
  forUser: (userId: number) => api<UserCompany[]>(`/api/users/${userId}/companies`),
}
