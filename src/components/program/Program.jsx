import React from 'react';
import './Program.css';
import '../../styles/variables.css';
import '../../styles/components.css';
import Navbar from '../Navbar';
import Welcome from '../common/welcome/Welcome';

const Program = () => {
  return (
    <>
      <Navbar />
        <Welcome 
          title="Welcome to the MTJF Solutions"
          message="Here you can manage and view everything related to Molana Tariq Jameel Foundation ."
        />
    </>
  );
};

export default Program; 