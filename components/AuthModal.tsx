import React from 'react';
import { useAuth } from '../context/AuthContext';
import Login from './Login';
import SignUp from './SignUp';
import PasswordReset from './PasswordReset';

const AuthModal: React.FC = () => {
  const { isAuthModalOpen, closeAuthModal, authModalView, setAuthModalView } = useAuth();

  if (!isAuthModalOpen) {
    return null;
  }

  const renderContent = () => {
    switch (authModalView) {
      case 'signup':
        return <SignUp onSwitchView={() => setAuthModalView('login')} />;
      case 'reset':
        return <PasswordReset onSwitchView={() => setAuthModalView('login')} />;
      case 'login':
      default:
        return <Login onSwitchToSignUp={() => setAuthModalView('signup')} onSwitchToReset={() => setAuthModalView('reset')} />;
    }
  };

  return (
    <div 
        className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fade-in-fast"
        onClick={closeAuthModal}
    >
      <div 
        className="bg-slate-800 rounded-lg shadow-2xl w-full max-w-md border border-slate-700 animate-slide-up-fast"
        onClick={(e) => e.stopPropagation()} // Prevent closing modal when clicking inside
      >
        <div className="p-6 relative">
             <button onClick={closeAuthModal} className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
             </button>
            {renderContent()}
        </div>
      </div>
       <style>{`
        @keyframes fade-in-fast {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in-fast {
          animation: fade-in-fast 0.2s ease-out forwards;
        }
        @keyframes slide-up-fast {
          from { opacity: 0; transform: translateY(20px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-slide-up-fast {
          animation: slide-up-fast 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default AuthModal;