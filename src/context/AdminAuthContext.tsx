"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

type AdminAuthContextType = {
  isAuthenticated: boolean;
  login: (email: string, password: string) => boolean;
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
  
  // Check local storage for auth status on initial load
  useEffect(() => {
    // Use try-catch to handle cases where localStorage might not be available
    try {
      const authStatus = localStorage.getItem('adminAuth');
      if (authStatus === 'true') {
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Error accessing localStorage:', error);
    }
  }, []);

  const login = (email: string, password: string) => {
    // This is a dummy authentication
    // In a real app, you would verify with a backend
    if (email && password) {
      setIsAuthenticated(true);
      try {
        localStorage.setItem('adminAuth', 'true');
      } catch (error) {
        console.error('Error writing to localStorage:', error);
      }
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    try {
      localStorage.removeItem('adminAuth');
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  };

  return (
    <AdminAuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export default AdminAuthProvider;