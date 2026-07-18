import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();

  // Helper function to check if user has access to current route
  const hasRouteAccess = (userData, currentPath) => {
    // Super admin has access to everything
    if (userData.role === 'super_admin') {
      return true;
    }

    // Admin has access to everything in their department
    if (userData.role === 'admin') {
      return currentPath.startsWith(`/${userData.department}`);
    }

    // Regular users have limited access to their department
    if (userData.role === 'user') {
      // Check if route is in user's department
      const isInDepartment = currentPath.startsWith(`/${userData.department}`);
      
      if (!isInDepartment) {
        return false;
      }

      // Users can only access CREATE and LIST routes
      const isCreateRoute = currentPath.includes('/add') || currentPath.includes('/create');
      const isListRoute = !currentPath.includes('/update/') && 
                         !currentPath.includes('/edit/') && 
                         !currentPath.includes('/view/') && 
                         !currentPath.includes('/delete/');
      
      return isCreateRoute || isListRoute;
    }

    return false;
  };

  useEffect(() => {
    // Wait for AuthContext to finish loading before checking route access
    if (authLoading) {
      setLoading(true);
      return;
    }

    // If AuthContext has finished loading and there's no user, user is not authenticated
    if (!user) {
      setAuthenticated(false);
      setLoading(false);
      return;
    }

    // Check route access based on user data from AuthContext
    const currentPath = location.pathname;
    if (hasRouteAccess(user, currentPath)) {
      setAuthenticated(true);
    } else {
      console.error('Unauthorized access to route:', currentPath);
      setAuthenticated(false);
    }
    
    setLoading(false);
  }, [location, user, authLoading]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!authenticated) {
    console.log('Not authenticated, redirecting to login');
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return children;
};

// Higher-order component to wrap multiple routes
export const ProtectedRoutes = ({ children }) => {
  return <ProtectedRoute>{children}</ProtectedRoute>;
};

export default ProtectedRoute; 