import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface PasswordResetProps {
  onSwitchView: () => void;
}

const PasswordReset: React.FC<PasswordResetProps> = ({ onSwitchView }) => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { requestPasswordReset } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setIsLoading(true);
    const result = await requestPasswordReset(email);
    setMessage(result.message);
    setIsLoading(false);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-white text-center mb-6">Reset Password</h2>
      {message && <p className="bg-blue-900/50 text-blue-300 text-sm p-3 rounded-md mb-4 text-center">{message}</p>}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="reset-email" className="block text-sm font-medium text-slate-300">Email Address</label>
          <input
            type="email"
            id="reset-email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Enter your account email"
          />
        </div>
        <div>
          <button type="submit" disabled={isLoading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-slate-600">
            {isLoading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </div>
      </form>

      <p className="mt-6 text-center text-sm text-slate-400">
        Remembered your password?{' '}
        <button onClick={onSwitchView} className="font-medium text-indigo-400 hover:text-indigo-300">
          Back to Login
        </button>
      </p>
    </div>
  );
};

export default PasswordReset;