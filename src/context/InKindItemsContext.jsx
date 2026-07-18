import React, { createContext, useContext, useState, useEffect } from 'react';
import axiosInstance from '../utils/axios';

const InKindItemsContext = createContext(null);

export const InKindItemsProvider = ({ children }) => {
  const [inKindItems, setInKindItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchInKindItems = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch all in-kind items without pagination
      const response = await axiosInstance.get('/dms/in-kind-items/list', {params: {page: 1, pageSize: 1000}});
      
      if (response.data.success) {
        console.log("response.data.data", response.data.data);
        setInKindItems(response?.data?.data?.data || []);
      } else {
        setError('Failed to fetch in-kind items');
      }
    } catch (err) {
      console.error('Error fetching in-kind items:', err);
      setError('Failed to fetch in-kind items. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const refetchInKindItems = () => {
    fetchInKindItems();
  };

  // Fetch in-kind items on context initialization
  useEffect(() => {
    fetchInKindItems();
  }, []);

  const value = {
    inKindItems,
    loading,
    error,
    refetchInKindItems
  };

  return (
    <InKindItemsContext.Provider value={value}>
      {children}
    </InKindItemsContext.Provider>
  );
};

export const useInKindItems = () => {
  const context = useContext(InKindItemsContext);
  if (!context) {
    throw new Error('useInKindItems must be used within an InKindItemsProvider');
  }
  return context;
};
