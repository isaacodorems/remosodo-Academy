import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import type { User } from '../types';
import * as authService from '../services/authService';

type AuthModalView = 'login' | 'signup' | 'reset';

interface AuthContextType {
  currentUser: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  signUp: (email: string, password: string, role: 'student' | 'tutor') => Promise<{ success: boolean; message: string }>;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; message: string }>;
  isAuthModalOpen: boolean;
  authModalView: AuthModalView;
  openAuthModal: (view: AuthModalView) => void;
  closeAuthModal: () => void;
  setAuthModalView: (view: AuthModalView) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => authService.getCurrentUser());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalView, setAuthModalView] = useState<AuthModalView>('login');

  const openAuthModal = useCallback((view: AuthModalView) => {
    setAuthModalView(view);
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
  }, []);

  const login = async (email: string, password: string) => {
    const result = await authService.login(email, password);
    if (result.success) {
      setCurrentUser(authService.getCurrentUser());
      closeAuthModal();
    }
    return result;
  };

  const logout = () => {
    authService.logout();
    setCurrentUser(null);
  };

  const signUp = async (email: string, password: string, role: 'student' | 'tutor') => {
    const result = await authService.signUp(email, password, role);
    if (result.success) {
      setCurrentUser(authService.getCurrentUser());
      closeAuthModal();
    }
    return result;
  };

  const requestPasswordReset = async (email: string) => {
      return authService.requestPasswordReset(email);
  }

  const value = {
    currentUser,
    login,
    logout,
    signUp,
    requestPasswordReset,
    isAuthModalOpen,
    authModalView,
    openAuthModal,
    closeAuthModal,
    setAuthModalView,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};