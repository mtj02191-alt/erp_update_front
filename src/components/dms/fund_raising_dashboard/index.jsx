import React from 'react';
import Navbar from '../../Navbar';
import PageHeader from '../../common/PageHeader';
import FundraisingDashboard from '../../common/charts/fundraising_dashboard';

const FundRaisingDashboardPage = () => {
  return (
    <>
      <Navbar />
      <div className="list-wrapper">
        <PageHeader
          title="Fund Raising Dashboard"
          showBackButton={false}
          showAdd={false}
        />
        <div className="list-content">
          <FundraisingDashboard months={12} />
        </div>
      </div>
    </>
  );
};

export default FundRaisingDashboardPage;

