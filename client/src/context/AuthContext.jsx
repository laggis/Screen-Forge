import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { auth } from '../utils/api';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('sf_token');
    if (!token) { setLoading(false); return; }
    try {
      const { data } = await auth.me();
      setUser(data);
    } catch {
      localStorage.removeItem('sf_token');
      localStorage.removeItem('sf_user');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUser(); }, [loadUser]);

  const login = (token, userData) => {
    localStorage.setItem('sf_token', token);
    localStorage.setItem('sf_user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('sf_token');
    localStorage.removeItem('sf_user');
    setUser(null);
  };

  const refresh = () => loadUser();

  return (
    <AuthCtx.Provider value={{ user, loading, login, logout, refresh }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
