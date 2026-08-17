import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';

const NavigationHistoryContext = createContext({
  canGoBack: false,
  previousPath: null,
});

/**
 * Tracks in-app route history so PageHeader can prefer navigate(-1)
 * and fall back to a safe default when the user has no prior app page.
 */
export const NavigationHistoryProvider = ({ children }) => {
  const location = useLocation();
  const [stack, setStack] = useState([]);

  useEffect(() => {
    const full = `${location.pathname}${location.search}`;
    setStack((prev) => {
      if (prev[prev.length - 1] === full) return prev;
      return [...prev.slice(-29), full];
    });
  }, [location.pathname, location.search]);

  const value = useMemo(() => {
    const canGoBack = stack.length > 1;
    return {
      canGoBack,
      previousPath: canGoBack ? stack[stack.length - 2] : null,
    };
  }, [stack]);

  return (
    <NavigationHistoryContext.Provider value={value}>
      {children}
    </NavigationHistoryContext.Provider>
  );
};

export const useNavigationHistory = () => useContext(NavigationHistoryContext);
