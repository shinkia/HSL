import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';

import PublicLayout from '@/components/forum/PublicLayout';
import Home from '@/pages/Home';
import PostDetail from '@/pages/PostDetail';
import CategoryPage from '@/pages/CategoryPage';
import TagPage from '@/pages/TagPage';
import CategoriesPage from '@/pages/CategoriesPage';
import TagsPage from '@/pages/TagsPage';
import StaticPage from '@/pages/StaticPage';
import SearchPage from '@/pages/SearchPage';
import VerifyPending from '@/pages/VerifyPending';
import ProfilePage from '@/pages/ProfilePage';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import PostsList from '@/pages/admin/PostsList';
import PostEditor from '@/components/admin/PostEditor';
import CategoriesManager from '@/pages/admin/CategoriesManager';
import TagsManager from '@/pages/admin/TagsManager';
import MediaLibrary from '@/pages/admin/MediaLibrary';
import UsersManager from '@/pages/admin/UsersManager';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/posts/:slug" element={<PostDetail />} />
        <Route path="/category/:slug" element={<CategoryPage />} />
        <Route path="/tag/:slug" element={<TagPage />} />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/tags" element={<TagsPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/verify-pending" element={<VerifyPending />} />
        <Route path="/user/:username" element={<ProfilePage />} />
        <Route path="/about" element={<StaticPage />} />
        <Route path="/contact" element={<StaticPage />} />
        <Route path="/terms" element={<StaticPage />} />
        <Route path="/privacy" element={<StaticPage />} />
        <Route path="*" element={<PageNotFound />} />
      </Route>
      <Route element={<AdminLayout />}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/posts" element={<PostsList />} />
        <Route path="/admin/posts/new" element={<PostEditor />} />
        <Route path="/admin/posts/:id" element={<PostEditor />} />
        <Route path="/admin/categories" element={<CategoriesManager />} />
        <Route path="/admin/tags" element={<TagsManager />} />
        <Route path="/admin/media" element={<MediaLibrary />} />
        <Route path="/admin/users" element={<UsersManager />} />
      </Route>
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App