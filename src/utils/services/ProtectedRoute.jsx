import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axiosInstance from '../axios';

const ProtectedRoute = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // First check if we have user data in context
        if (user) {
          const currentPath = location.pathname.substring(1); // Remove leading slash
          
          // Check if user has access to this route based on department
          if (user.role === 'admin' || 
              currentPath === user.department || 
              (currentPath === 'accounts-and-finance' && user.department === 'accounts_and_finance')) {
            setAuthenticated(true);
          } else {
            console.error('Unauthorized access to route:', currentPath);
            setAuthenticated(false);
          }
          setLoading(false);
          return;
        }

        // If no user in context, verify with backend
        const response = await axiosInstance.get('/auth/me');
        if (response.data.user) {
          const userData = response.data.user;
          const currentPath = location.pathname.substring(1);

          if (userData.role === 'admin' || 
              currentPath === userData.department || 
              (currentPath === 'accounts-and-finance' && userData.department === 'accounts_and_finance')) {
            setAuthenticated(true);
          } else {
            console.error('Unauthorized access to route:', currentPath);
            setAuthenticated(false);
          }
        } else {
          setAuthenticated(false);
        }
      } catch (error) {
        console.error('Authentication check failed:', error);
        setAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [location, user]);

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