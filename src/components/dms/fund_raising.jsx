import React from 'react';
import Sidebar from '../common/Sidebar/Sidebar';
import Welcome from '../common/welcome/Welcome';
import FundraisingDashboard from '../common/charts/fundraising_dashboard';
import '../store/Store.css';
import Navbar from '../Navbar';

const FundRaising = () => {
  return (
    <>
      <Navbar />
      <Sidebar />
      <Welcome
        title="Fund Raising Management"
        message="Overview of fundraising performance: totals, donors, and trends."
      />
      <FundraisingDashboard months={12} />
    </>
  );
};

export default FundRaising; 