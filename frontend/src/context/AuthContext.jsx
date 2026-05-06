import React, { createContext, useContext, useState, useCallback } from 'react';
import { setToken } from '../services/api';

const AuthContext = createContext(null);

const TOKEN_KEY = 'ws_token';
const USER_KEY  = 'ws_user';

export function AuthProvider({ children }) {
  const [user,  setUser]  = useState(() => {
    try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; }
  });
  const [token, setTokenState] = useState(() => {
    const t = localStorage.getItem(TOKEN_KEY);
    if (t) setToken(t);
    return t;
  });

  const login = useCallback((userData, jwtToken) => {
    localStorage.setItem(TOKEN_KEY, jwtToken);
    localStorage.setItem(USER_KEY,  JSON.stringify(userData));
    setUser(userData);
    setTokenState(jwtToken);
    setToken(jwtToken);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
    setTokenState(null);
    setToken(null);
  }, []);

  const isAuthenticated = !!token;

  const hasRole = useCallback((...roles) => {
    return user && roles.includes(user.role);
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
