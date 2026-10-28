export type Role = 'Admin' | 'Editor'
export interface User { id: number; email: string; displayName: string; role: Role; isActive: boolean; createdAt?: string; firstName?: string; lastName?: string; username?: string; phone?: string | null }
export interface Company { companyId: number; companyCode: string; companyName: string; isActive: boolean; createdAt: string; updatedAt: string; activeUserCount: number }
export interface CompanyUser {
  companyUserId: number; companyId: number; companyCode: string; companyName: string; companyIsActive: boolean
  userId: number; userName: string; username: string; email: string; phone?: string | null; systemRole: Role; userIsActive: boolean
  isActive: boolean; isPrimaryCompany: boolean; createdAt: string; updatedAt: string
}
export interface UserCompany { companyUserId: number; companyId: number; companyCode: string; companyName: string; companyIsActive: boolean; isActive: boolean; isPrimaryCompany: boolean; createdAt: string }
export interface CreateCompanyUserInput { firstName: string; lastName: string; username: string; email: string; phone?: string; role: string; password: string; isActive: boolean; isPrimaryCompany: boolean }
export interface CreatedCompanyUserResult { user: User; assignment: CompanyUser }
export interface AuthResponse { accessToken: string; expiresAt: string; refreshToken: string; user: User }
export interface Paged<T> { items: T[]; total: number; page: number; pageSize: number; totalPages: number }
export interface Taxonomy { id: number; name: string; slug: string; description?: string | null; postCount: number }
export interface ContentSummary { id: number; title: string; slug: string; status: 'Draft' | 'Published'; createdAt: string; updatedAt: string; publishedAt?: string | null; author?: string | null }
export interface Content {
  id: number; title: string; slug: string; content: string; shortDescription?: string | null; excerpt?: string | null
  featuredImageId?: number | null; featuredImageUrl?: string | null; metaTitle?: string | null; metaDescription?: string | null
  status: 'Draft' | 'Published'; createdAt: string; updatedAt: string; publishedAt?: string | null
  createdBy?: string | null; updatedBy?: string | null; categories: Taxonomy[]; tags: Taxonomy[]; concurrencyStamp: string
}
export interface ContentInput {
  title: string; slug?: string; content: string; shortDescription?: string; excerpt?: string
  featuredImageId?: number | null; metaTitle?: string; metaDescription?: string
  categoryIds?: number[]; tagIds?: number[]; concurrencyStamp?: string
}
export interface Media { id: number; originalName: string; contentType: string; size: number; url: string; createdAt: string }
export interface Settings {
  websiteName: string; description?: string | null; logoId?: number | null; faviconId?: number | null
  logoUrl?: string | null; faviconUrl?: string | null; contactEmail?: string | null; footerText?: string | null
  defaultSeoTitle?: string | null; defaultSeoDescription?: string | null
}
export interface Dashboard {
  totalPages: number; totalPosts: number; publishedPosts: number; draftPosts: number; mediaFiles: number
  totalUsers: number | null; recent: { id: number; type: 'page' | 'post'; title: string; status: string; updatedAt: string }[]
}
export interface PublicSummary { id: number; title: string; slug: string; summary?: string | null; featuredImageUrl?: string | null; publishedAt?: string | null; author?: string | null }
export interface PublicContent extends PublicSummary { content: string; metaTitle?: string | null; metaDescription?: string | null; categories: Taxonomy[]; tags: Taxonomy[] }
