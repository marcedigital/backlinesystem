// src/context/AdminAuthContext.tsx
"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

type AdminUser = {
  id: string;
  email: string;
  name: string;
};

type AdminAuthContextType = {
  isAuthenticated: boolean;
  admin: AdminUser | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
};

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Check if admin is already logged in on initial load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Try to get admin data from cookie
        const response = await fetch('/api/admin/auth/check');
        if (response.ok) {
          const data = await response.json();
          setAdmin(data.admin);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Auth check error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      setAdmin(data.admin);
      setIsAuthenticated(true);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/admin/logout', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setAdmin(null);
      setIsAuthenticated(false);
    }
  };

  return (
    <AdminAuthContext.Provider value={{ isAuthenticated, admin, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export default AdminAuthProvider;