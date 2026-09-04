import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

const parseJsonResponse = async (res) => {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch (e) {
    return { message: 'Server connection error. Please try again.' };
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('eduflow_token') || null);
  const [loading, setLoading] = useState(true);

  // Fetch current user if token exists
  useEffect(() => {
    const loadUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await parseJsonResponse(res);
          setUser(data.user);
        } else {
          // Invalid or expired token
          logout();
        }
      } catch (err) {
        console.error('Failed to load user session:', err);
        logout();
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [token]);

  const login = async (email, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await parseJsonResponse(res);
    if (!res.ok) {
      throw new Error(data.message || 'Login failed. Invalid credentials or server unavailable.');
    }
    localStorage.setItem('eduflow_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const register = async (formData) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    const data = await parseJsonResponse(res);
    if (!res.ok) {
      throw new Error(data.message || 'Registration failed.');
    }
    localStorage.setItem('eduflow_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('eduflow_token');
    localStorage.removeItem('eduflow_offline_tasks');
    setToken(null);
    setUser(null);
  };

  const joinOrganization = async (join_code) => {
    const res = await fetch('/api/organizations/join', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ join_code })
    });
    const data = await parseJsonResponse(res);
    if (!res.ok) {
      throw new Error(data.message || 'Failed to join organization.');
    }
    // Refresh user profile
    const meRes = await fetch('/api/auth/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (meRes.ok) {
      const meData = await parseJsonResponse(meRes);
      setUser(meData.user);
    }
    return data;
  };

  const createOrganization = async (name) => {
    const res = await fetch('/api/organizations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ name })
    });
    const data = await parseJsonResponse(res);
    if (!res.ok) {
      throw new Error(data.message || 'Failed to create organization.');
    }
    // Refresh user profile
    const meRes = await fetch('/api/auth/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (meRes.ok) {
      const meData = await parseJsonResponse(meRes);
      setUser(meData.user);
    }
    return data;
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      login,
      register,
      logout,
      joinOrganization,
      createOrganization,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
