import React from 'react';
import Navbar from '../Navbar';
import Sidebar from '../common/Sidebar/Sidebar';
import Welcome from '../common/welcome/Welcome';
import './AccountsAndFinance.css';

const AccountsAndFinance = () => {
  return (
    <>
      <Navbar />
      <Sidebar />
      <Welcome 
        title="Accounts & Finance Management" 
        message="Welcome to the Accounts & Finance Management module. Use the sidebar to access financial reports and manage daily activities."
      />
    </>
  );
};

export default AccountsAndFinance; 