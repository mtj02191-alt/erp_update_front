import React, { useState } from 'react';
import axiosInstance from '../../../../utils/axios';
import { IoReloadOutline } from "react-icons/io5";

const ReloadButton = ({ 
  context = true, 
  contextRefetch = null, 
  onReload = null, 
  apiUrl = null,
  className = '',
  disabled = false,
  children = 'Reload'
}) => {
  const [isReloading, setIsReloading] = useState(false);

  const handleReload = async () => {
    if (disabled || isReloading) return;

    setIsReloading(true);

    try {
      if (context && contextRefetch) {
        // Context reload - just call the refetch function
        await contextRefetch();
      } else if (apiUrl && onReload) {
        // Custom reload with API call
        const response = await axiosInstance.get(apiUrl);
        onReload(response.data);
      } else if (onReload) {
        // Custom reload without API call
        onReload();
      }
    } catch (error) {
      console.error('Reload error:', error);
    } finally {
      setIsReloading(false);
    }
  };

  return (
    <button 
      className={`reload-btn ${className}`}
      onClick={handleReload}
      disabled={disabled || isReloading}
    >
      {isReloading ? 'Loading...' : <IoReloadOutline />}
    </button>
  );
};

export default ReloadButton;