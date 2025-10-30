import React from 'react';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
    onHomeClick: () => void;
    onDashboardClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onHomeClick, onDashboardClick }) => {
  const { currentUser, logout, openAuthModal } = useAuth();

  return (
    <header className="bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50 shadow-lg shadow-slate-900/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div 
            className="flex items-center cursor-pointer"
            onClick={onHomeClick}
          >
             <svg className="h-8 w-8 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span className="ml-3 text-2xl font-bold text-white">Remsodo Academy</span>
          </div>
          <div className="flex items-center space-x-4">
            {currentUser ? (
              <>
                <span className="text-sm text-slate-300 hidden sm:block">
                  Welcome, <span className="font-semibold text-white">{currentUser.email}</span>
                </span>
                 <button 
                  onClick={onDashboardClick}
                  className="text-slate-300 hover:text-white transition-colors text-sm font-semibold"
                >
                  Dashboard
                </button>
                <button 
                  onClick={logout}
                  className="bg-red-600 text-white text-sm font-semibold px-4 py-2 rounded-md hover:bg-red-500 transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => openAuthModal('login')}
                  className="text-slate-300 hover:text-white transition-colors text-sm font-semibold"
                >
                  Login
                </button>
                <button 
                  onClick={() => openAuthModal('signup')}
                  className="bg-indigo-600 text-white text-sm font-semibold px-4 py-2 rounded-md hover:bg-indigo-500 transition-colors"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;