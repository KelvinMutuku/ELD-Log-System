// src/components/UserLogin.js
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';

const UserLogin = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://localhost:8000/api/login/', {
                username,
                password
            });
            
            localStorage.setItem('access_token', response.data.access);
            localStorage.setItem('is_admin', response.data.is_admin);
            
            if(response.data.is_admin) {
                navigate('/admin-dashboard');
            } else {
                navigate('/user-dashboard');
            }
        } catch (err) {
            setError('Invalid username or password');
        }
    };

    return (
        <div className="login-container">
            <h2>Login</h2>
            {error && <p className="error-message">{error}</p>}
            <form className="login-form" onSubmit={handleSubmit}>
                <input 
                    type="text" 
                    placeholder="Username" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />
                <input 
                    type="password" 
                    placeholder="Password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <button type="submit">Login</button>
                <div className="auth-links">
    <p>Don't have an account? <Link to="/driver-register">Sign up here</Link></p>
</div>
            </form>
        </div>
    );
};

export default UserLogin;