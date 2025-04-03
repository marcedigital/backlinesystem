"use client";

import React, { 
  createContext, 
  useState, 
  useContext, 
  ReactNode, 
  useEffect 
} from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { signOut } from "next-auth/react";

// Correctly define the User type
interface User {
  id: string;
  email: string;
  name: string;
  role: 'customer' | 'admin';
}

// Authentication context interface
interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  signup: (userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phoneNumber?: string;
  }) => Promise<boolean>;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Create context with proper initialization
const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => false,
  logout: () => {},
  signup: async () => false,
  isAuthenticated: false,
  isLoading: true
});

// Provider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Check for existing token on initial load
  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      
      // Only check for token in localStorage
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (token && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser) as User;
          setUser(parsedUser);
        } catch (error) {
          // Clear invalid stored data
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
      
      setIsLoading(false);
    };
    
    checkAuth();
  }, []);

  // Login function
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/auth?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`, {
        method: 'GET'
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.message || 'Login failed');
        return false;
      }

      const data = await response.json();
      
      // Store token and user info
      localStorage.setItem('token', data.token);
      
      // Store user info (excluding sensitive data)
      const userToStore: User = {
        id: data.user._id,
        email: data.user.email,
        name: `${data.user.firstName} ${data.user.lastName}`,
        role: 'customer'
      };
      localStorage.setItem('user', JSON.stringify(userToStore));
      
      // Set user in state
      setUser(userToStore);
      
      toast.success('Login successful');
      return true;
    } catch (error) {
      console.error('Login error:', error);
      toast.error('An unexpected error occurred');
      return false;
    }
  };

  // Signup function
  const signup = async (userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phoneNumber?: string;
  }): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.message || 'Signup failed');
        return false;
      }

      const data = await response.json();
      
      // Store token and user info
      localStorage.setItem('token', data.token);
      
      // Store user info (excluding sensitive data)
      const userToStore: User = {
        id: data.user._id,
        email: data.user.email,
        name: `${data.user.firstName} ${data.user.lastName}`,
        role: 'customer'
      };
      localStorage.setItem('user', JSON.stringify(userToStore));
      
      // Set user in state
      setUser(userToStore);
      
      toast.success('Signup successful');
      return true;
    } catch (error) {
      console.error('Signup error:', error);
      toast.error('An unexpected error occurred');
      return false;
    }
  };

  // Logout function
  const logout = () => {
    // Sign out from NextAuth if it was used
    signOut({ redirect: false }).catch(console.error);
    
    // Also clear localStorage for custom auth
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Clear user state
    setUser(null);
    
    // Redirect to login page
    router.push('/login');
    
    toast.success('Logged out successfully');
  };

  // Check if user is authenticated
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ 
      user, 
      login,
      logout, 
      signup, 
      isAuthenticated,
      isLoading
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  return context;
};