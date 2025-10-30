import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface LoginProps {
  onSwitchToSignUp: () => void;
  onSwitchToReset: () => void;
}

const Login: React.FC<LoginProps> = ({ onSwitchToSignUp, onSwitchToReset }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    const result = await login(email, password);
    if (!result.success) {
      setError(result.message);
    }
    // On success, the modal will be closed by the context
    setIsLoading(false);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-white text-center mb-6">Welcome Back</h2>
      {error && <p className="bg-red-900/50 text-red-300 text-sm p-3 rounded-md mb-4 text-center">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-300">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div>
          <label htmlFor="password"className="block text-sm font-medium text-slate-300">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div className="text-right">
          <button type="button" onClick={onSwitchToReset} className="text-sm text-indigo-400 hover:text-indigo-300">
            Forgot password?
          </button>
        </div>
        <div>
          <button type="submit" disabled={isLoading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-slate-600">
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </div>
      </form>
      <p className="mt-6 text-center text-sm text-slate-400">
        Don't have an account?{' '}
        <button onClick={onSwitchToSignUp} className="font-medium text-indigo-400 hover:text-indigo-300">
          Sign up
        </button>
      </p>
    </div>
  );
};

export default Login;