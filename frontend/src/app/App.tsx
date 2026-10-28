import { Route, Routes } from 'react-router-dom'
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
import SettingsPage from '../features/settings/SettingsPage'
import ProfilePage from '../features/profile/ProfilePage'
import ErrorPage from '../components/ErrorPage'
import { BlogPage, CategoryPage, CmsPage, HomePage, NotFoundPage, PostDetailPage, SearchPage } from '../features/public/PublicPages'

const AdminNotFound = () => <ErrorPage code={404} title="Page not found" message="The admin page you requested does not exist." home="/admin" homeLabel="Back to dashboard" />

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
          <Route path="profile" element={<ProfilePage />} />
          <Route element={<ProtectedRoute roles={['Admin']} />}>
            <Route path="users" element={<UsersPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<AdminNotFound />} />
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
