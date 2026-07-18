import React from 'react';
import Navbar from '../Navbar';
import Sidebar from '../common/Sidebar/Sidebar';
import Welcome from '../common/welcome/Welcome';
import './Store.css';

const Store = () => {
  return (
    <>
      <Navbar />
      <Sidebar />
      <Welcome 
        title="Store Management" 
        message="Welcome to the Store Management module. Use the sidebar to access store reports and manage daily activities."
      />
    </>
  );
};

export default Store; 