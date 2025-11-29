'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

// Define user type
interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

// Define auth context type
interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<void>;
  clearError: () => void;
}

// Create auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();

  // Set isClient to true when component mounts (client-side only)
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Mock a user persistence check (only run on client side)
  useEffect(() => {
    if (!isClient) return;

    const checkUserLoggedIn = async () => {
      setLoading(true);
      try {
        // In a real app, this would be an API call to validate session
        const storedUser = localStorage.getItem('nextradeUser');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Failed to restore session', error);
        if (isClient) {
          localStorage.removeItem('nextradeUser');
        }
      } finally {
        setLoading(false);
      }
    };

    checkUserLoggedIn();
  }, [isClient]);

  // Mock login functionality
  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // In a real app, this would be an API call to a backend auth service
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
      
      // Simple validation (in a real app, this would be handled by the backend)
      if (email === 'demo@nextrade.com' && password === 'password123') {
        const newUser = {
          id: '1',
          name: 'Demo User',
          email: 'demo@nextrade.com',
          avatarUrl: 'https://placehold.co/200x200/111827/FFFFFF?text=DU',
        };
        
        setUser(newUser);
        if (isClient) {
          localStorage.setItem('nextradeUser', JSON.stringify(newUser));
        }
        router.push('/dashboard');
      } else {
        throw new Error('Invalid email or password');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Mock register functionality
  const register = async (name: string, email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // In a real app, this would be an API call to a backend auth service
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
      
      // Simple validation (in a real app, this would be handled by the backend)
      if (email && password && name) {
        const newUser = {
          id: '1',
          name,
          email,
          avatarUrl: 'https://placehold.co/200x200/111827/FFFFFF?text=NU',
        };
        
        setUser(newUser);
        if (isClient) {
          localStorage.setItem('nextradeUser', JSON.stringify(newUser));
        }
        router.push('/dashboard');
      } else {
        throw new Error('Please fill in all required fields');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Mock logout functionality
  const logout = () => {
    setUser(null);
    if (isClient) {
      localStorage.removeItem('nextradeUser');
    }
    router.push('/');
  };

  // Mock forgot password functionality
  const forgotPassword = async (email: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // In a real app, this would be an API call to send a reset email
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
      
      // Simple validation
      if (!email) {
        throw new Error('Please enter your email address');
      }
      
      // Show success message (in a real app, we would rely on the API response)
      router.push('/auth/login?reset=requested');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Clear any auth errors
  const clearError = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        register,
        logout,
        forgotPassword,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 