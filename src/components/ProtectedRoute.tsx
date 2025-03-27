import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, UserRole } from '../context/AuthContext';
import { toast } from 'sonner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole | UserRole[];
  blockRole?: UserRole | UserRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole,
  blockRole
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  
  // Improved scroll to top behavior for all dashboard routes
  useEffect(() => {
    if (location.pathname.includes('dashboard') || 
        location.pathname.includes('/admin/') || 
        location.pathname === '/dashboard' || 
        location.pathname === '/guide-dashboard' || 
        location.pathname === '/admin-dashboard') {
      window.scrollTo(0, 0);
    }
  }, [location.pathname]);

  // Show loading state while auth state is being determined
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin h-8 w-8 border-4 border-green-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  
  // Check if user has blocked role
  if (blockRole && user?.role) {
    const blockedRoles = Array.isArray(blockRole) ? blockRole : [blockRole];
    if (blockedRoles.includes(user.role)) {
      // Show toast message for guides trying to book hikes
      if (location.pathname.includes('/book') && user.role === 'guide') {
        toast.error("Guides cannot book hikes");
        // Return user to the previous page (hike detail) instead of redirecting to dashboard
        return <Navigate to={location.pathname.replace('/book', '')} replace />;
      }
      
      // Show toast message for admins trying to book hikes
      if (location.pathname.includes('/book') && user.role === 'admin') {
        toast.error("Admins cannot book hikes");
        // Return user to the previous page (hike detail) instead of redirecting to dashboard
        return <Navigate to={location.pathname.replace('/book', '')} replace />;
      }
      
      // Redirect to homepage instead of dashboard
      return <Navigate to="/" replace />;
    }
  }
  
  // If no role requirement or user has the required role, show the protected content
  if (!requiredRole || 
      (typeof requiredRole === 'string' && user?.role === requiredRole) ||
      (Array.isArray(requiredRole) && user?.role && requiredRole.includes(user.role))) {
    return <>{children}</>;
  }
  
  // If user doesn't have the required role, redirect to homepage
  return <Navigate to="/" replace />;
};

export default ProtectedRoute;
