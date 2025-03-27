import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Index from "./pages/Index";
import Hikes from "./pages/Hikes";
import HikeDetail from "./pages/HikeDetail";
import BookHike from "./pages/BookHike";
import About from "./pages/About";
import Donate from "./pages/Donate";
import JoinUs from "./pages/JoinUs";
import Login from "./pages/Login";
import Register from "./pages/Register";
import GuideRegistration from "./pages/GuideRegistration";
import WaiverSigning from "./pages/WaiverSigning";
import NotFound from "./pages/NotFound";
import GuestDashboard from "./pages/dashboards/GuestDashboard";
import GuideDashboard from "./pages/dashboards/GuideDashboard";
import AdminDashboard from "./pages/dashboards/AdminDashboard";
import ManageHikes from "./pages/admin/ManageHikes";
import ManageGuides from "./pages/admin/ManageGuides";
import ManageSchedules from "./pages/admin/ManageSchedules";
import Reports from "./pages/admin/Reports";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <HashRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/hikes" element={<Hikes />} />
            <Route path="/hikes/:hikeId" element={<HikeDetail />} />
            <Route path="/hikes/:hikeId/book" element={
              <ProtectedRoute requiredRole="guest" blockRole={["guide", "admin"]}>
                <BookHike />
              </ProtectedRoute>
            } />
            <Route path="/about" element={<About />} />
            <Route path="/donate" element={<Donate />} />
            <Route path="/join-us" element={<JoinUs />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/guide-registration/:token" element={<GuideRegistration />} />
            <Route path="/waiver/:hikeId" element={
              <ProtectedRoute requiredRole="guest">
                <WaiverSigning />
              </ProtectedRoute>
            } />
            
            {/* Protected dashboard routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute requiredRole="guest">
                <GuestDashboard />
              </ProtectedRoute>
            } />
            <Route path="/guide-dashboard" element={
              <ProtectedRoute requiredRole="guide">
                <GuideDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin-dashboard" element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            } />
            
            {/* Admin section routes */}
            <Route path="/admin/hikes" element={
              <ProtectedRoute requiredRole="admin">
                <ManageHikes />
              </ProtectedRoute>
            } />
            <Route path="/admin/guides" element={
              <ProtectedRoute requiredRole="admin">
                <ManageGuides />
              </ProtectedRoute>
            } />
            <Route path="/admin/schedules" element={
              <ProtectedRoute requiredRole="admin">
                <ManageSchedules />
              </ProtectedRoute>
            } />
            <Route path="/admin/reports" element={
              <ProtectedRoute requiredRole="admin">
                <Reports />
              </ProtectedRoute>
            } />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </HashRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
