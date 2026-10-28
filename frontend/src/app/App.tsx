import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from '../routes/ProtectedRoute'
import AdminLayout from '../layouts/AdminLayout'
import PublicLayout from '../layouts/PublicLayout'
import LoginPage from '../features/auth/LoginPage'
import DashboardPage from '../features/dashboard/DashboardPage'
import ContentListPage from '../features/pages/ContentListPage'
import ContentEditPage from '../features/pages/ContentEditPage'
import MediaPage from '../features/media/MediaPage'
import TaxonomyPage from '../features/categories/TaxonomyPage'
import UsersPage from '../features/users/UsersPage'
import CompaniesPage from '../features/companies/CompaniesPage'
import CompanyDetailsPage from '../features/companies/CompanyDetailsPage'
import CompanyUserList from '../features/companies/CompanyUserList'
import SettingsPage from '../features/settings/SettingsPage'
import { BlogPage, CategoryPage, CmsPage, HomePage, NotFoundPage, PostDetailPage, SearchPage } from '../features/public/PublicPages'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute roles={['Admin', 'Editor']} />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="pages" element={<ContentListPage kind="pages" />} />
          <Route path="pages/new" element={<ContentEditPage kind="pages" />} />
          <Route path="pages/:id/edit" element={<ContentEditPage kind="pages" />} />
          <Route path="posts" element={<ContentListPage kind="posts" />} />
          <Route path="posts/new" element={<ContentEditPage kind="posts" />} />
          <Route path="posts/:id/edit" element={<ContentEditPage kind="posts" />} />
          <Route path="media" element={<MediaPage />} />
          <Route path="categories" element={<TaxonomyPage kind="categories" />} />
          <Route path="tags" element={<TaxonomyPage kind="tags" />} />
          <Route element={<ProtectedRoute roles={['Admin']} />}>
            <Route path="users" element={<UsersPage />} />
            <Route path="masters" element={<Navigate to="companies" replace />} />
            <Route path="masters/companies" element={<CompaniesPage />} />
            <Route path="masters/companies/:id" element={<CompanyDetailsPage />} />
            <Route path="masters/users" element={<UsersPage />} />
            <Route path="masters/company-users" element={<CompanyUserList />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
      <Route element={<PublicLayout />}>
        <Route index element={<HomePage />} />
        <Route path="blog" element={<BlogPage />} />
        <Route path="blog/:slug" element={<PostDetailPage />} />
        <Route path="pages/:slug" element={<CmsPage />} />
        <Route path="category/:slug" element={<CategoryPage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
