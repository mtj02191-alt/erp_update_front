import React from 'react';
import Navbar from '../Navbar';
import Welcome from '../common/welcome/Welcome';

const Procurements = () => {
  return (
    <>
      <Navbar />
      <Welcome 
        title="Welcome to the Procurements Department"
        message="Use the sidebar to access procurement reports and features."
      />
    </>
  );
};

export default Procurements; 