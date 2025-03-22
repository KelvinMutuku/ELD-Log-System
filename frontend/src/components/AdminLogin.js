import React from 'react';

const AdminLogin = () => {
  return (
    <div className="login-container">
      <h2>Admin Login</h2>
      <form className="login-form">
        <input type="text" placeholder="Admin ID" />
        <input type="password" placeholder="Password" />
        <button type="submit">Login</button>
      </form>
    </div>
  );
};

export default AdminLogin;