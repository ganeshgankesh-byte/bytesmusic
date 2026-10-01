import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Search from "./pages/Search";
import History from "./pages/History";
import Likes from "./pages/Likes";
import Login from "./pages/Login";
import Register from "./pages/Register";
import PlaylistPage from "./pages/PlaylistPage";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminSongs from "./pages/admin/AdminSongs";
import AdminArtists from "./pages/admin/AdminArtists";
import AdminAlbums from "./pages/admin/AdminAlbums";
import AdminPlaylists from "./pages/admin/AdminPlaylists";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminHomepage from "./pages/admin/AdminHomepage";
import NotFound from "./pages/NotFound";

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, loading } = useAuth();
  if (loading) return <div className="flex h-screen items-center justify-center text-mint-500">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<Search />} />
        <Route path="/history" element={<History />} />
        <Route path="/likes" element={<Likes />} />
        <Route path="/playlist/:id" element={<PlaylistPage />} />
      </Route>

      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="songs" element={<AdminSongs />} />
        <Route path="artists" element={<AdminArtists />} />
        <Route path="albums" element={<AdminAlbums />} />
        <Route path="playlists" element={<AdminPlaylists />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="homepage" element={<AdminHomepage />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
