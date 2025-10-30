import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface SignUpProps {
  onSwitchView: () => void;
}

const SignUp: React.FC<SignUpProps> = ({ onSwitchView }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'student' | 'tutor'>('student');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setError('');
    setSuccess('');
    setIsLoading(true);
    const result = await signUp(email, password, role);
    if (result.success) {
        setSuccess(result.message);
        // Clear form
        setEmail('');
        setPassword('');
        setConfirmPassword('');
    } else {
        setError(result.message);
    }
    setIsLoading(false);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-white text-center mb-6">Create Your Account</h2>
      {error && <p className="bg-red-900/50 text-red-300 text-sm p-3 rounded-md mb-4 text-center">{error}</p>}
      {success && <p className="bg-green-900/50 text-green-300 text-sm p-3 rounded-md mb-4 text-center">{success}</p>}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="signup-email" className="block text-sm font-medium text-slate-300">Email</label>
          <input type="email" id="signup-email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
        </div>
        <div>
          <label htmlFor="signup-password"className="block text-sm font-medium text-slate-300">Password</label>
          <input type="password" id="signup-password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
        </div>
        <div>
          <label htmlFor="confirm-password"className="block text-sm font-medium text-slate-300">Confirm Password</label>
          <input type="password" id="confirm-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
        </div>
        <div>
            <span className="block text-sm font-medium text-slate-300 mb-2">I am a...</span>
            <div className="grid grid-cols-2 gap-4">
                <button type="button" onClick={() => setRole('student')} className={`py-3 px-4 rounded-md text-sm font-semibold transition-colors ${role === 'student' ? 'bg-indigo-600 text-white ring-2 ring-indigo-400' : 'bg-slate-700 hover:bg-slate-600'}`}>
                    Student
                </button>
                 <button type="button" onClick={() => setRole('tutor')} className={`py-3 px-4 rounded-md text-sm font-semibold transition-colors ${role === 'tutor' ? 'bg-indigo-600 text-white ring-2 ring-indigo-400' : 'bg-slate-700 hover:bg-slate-600'}`}>
                    Tutor
                </button>
            </div>
        </div>
        <div>
          <button type="submit" disabled={isLoading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-slate-600">
            {isLoading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </div>
      </form>
      <p className="mt-6 text-center text-sm text-slate-400">
        Already have an account?{' '}
        <button onClick={onSwitchView} className="font-medium text-indigo-400 hover:text-indigo-300">
          Login
        </button>
      </p>
    </div>
  );
};

export default SignUp;