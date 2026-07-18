import React, { useEffect, useState } from 'react';
import './Home.css';

const Home = () => {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    setUser(storedUser);
    setIsAdmin(storedUser?.role === 'super_admin');
  }, []);

  if (!user) return <div className="home-container">No user found. Please login.</div>;

  return (
    <div className="home-container">
      <div className="home-message">
        {isAdmin ? 'Welcome Admin' : `Welcome user to ${user.department}`}
      </div>
    </div>
  );
};

export default Home; 