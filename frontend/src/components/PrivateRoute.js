import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const PrivateRoute = ({ isAdmin = false }) => {
    const authToken = localStorage.getItem('access_token');
    const userIsAdmin = localStorage.getItem('is_admin') === 'true';

    if (!authToken) return <Navigate to="/user-login" />;
    if (isAdmin && !userIsAdmin) return <Navigate to="/user-dashboard" />;
    
    return <Outlet />;
};

export default PrivateRoute;