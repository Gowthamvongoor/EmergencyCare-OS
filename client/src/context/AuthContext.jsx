import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('emergencycare_token');
    const storedUser = localStorage.getItem('emergencycare_user');
    const storedPerms = localStorage.getItem('emergencycare_permissions');

    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
        if (storedPerms) setPermissions(JSON.parse(storedPerms));
        
        // Refresh profile in background
        api.getMe()
          .then(res => {
            setUser(res.user);
            setPermissions(res.permissions);
            localStorage.setItem('emergencycare_user', JSON.stringify(res.user));
            localStorage.setItem('emergencycare_permissions', JSON.stringify(res.permissions));
          })
          .catch(() => {
            // Token expired
            logout();
          })
          .finally(() => setLoading(false));
      } catch (e) {
        logout();
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await api.login(email, password);
    localStorage.setItem('emergencycare_token', res.token);
    localStorage.setItem('emergencycare_user', JSON.stringify(res.user));
    localStorage.setItem('emergencycare_permissions', JSON.stringify(res.permissions));
    setUser(res.user);
    setPermissions(res.permissions);
    return res.user;
  };

  const logout = () => {
    localStorage.removeItem('emergencycare_token');
    localStorage.removeItem('emergencycare_user');
    localStorage.removeItem('emergencycare_permissions');
    setUser(null);
    setPermissions({});
  };

  // Check if current user has role or permission
  const hasRole = (roles) => {
    if (!user) return false;
    if (typeof roles === 'string') return user.role === roles;
    if (Array.isArray(roles)) return roles.includes(user.role);
    return false;
  };

  const can = (resourceKey, action = 'READ') => {
    if (!user) return false;
    if (user.role === 'Admin') return true; // Superuser override
    const perms = permissions[resourceKey] || [];
    return perms.includes(action);
  };

  return (
    <AuthContext.Provider value={{ user, permissions, loading, login, logout, hasRole, can }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
