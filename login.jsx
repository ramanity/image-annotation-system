import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';

function authenticate(username, password) {
  return true;
}

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  sessionStorage.setItem('isLoggedIn', 'false');
  const handleLogin = () => {
    const isAuthenticated = authenticate(username, password);

    if (isAuthenticated) {
      console.log('Login successful.')
      sessionStorage.setItem('userLoggedin', username);
      window.location.href = 'index.html'; 
    } else {
      alert('Login failed');
    }
  };

  return (
    <div>
      <h2>Login Page</h2>
      <form>
        <label>
          Username: 
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </label>
        <br/>
        <label>
          Password: 
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <br/>
        <button type="button" onClick={handleLogin}>
          Login
        </button>
      </form>
    </div>
  );
};


const domLoginNode = document.getElementById('login-root');
const root = createRoot(domLoginNode);
root.render(<Login />);
