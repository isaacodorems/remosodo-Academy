import type { User } from '../types';

// In a real app, this would be in a secure, httpOnly cookie.
// Here we use localStorage for demonstration purposes.
const TOKEN_KEY = 'remsodo_auth_token';
const USERS_KEY = 'remsodo_users';

// --- Helper Functions ---

const getUsers = (): Record<string, any> => {
  try {
    const users = localStorage.getItem(USERS_KEY);
    return users ? JSON.parse(users) : {};
  } catch {
    return {};
  }
};

const saveUsers = (users: Record<string, any>) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

// Mock hashing function
const mockHash = (password: string): string => {
  // This is NOT secure. For demonstration only.
  return `hashed_${password}_salted`;
};

// Mock JWT creation
const createToken = (user: User): string => {
    const payload = {
        ...user,
        iat: Date.now(),
        exp: Date.now() + 1000 * 60 * 60 * 24 // 24 hours expiration
    };
    return btoa(JSON.stringify(payload)); // Base64 encode the payload
};

// Mock JWT decoding
const decodeToken = (token: string): { user: User, exp: number } | null => {
    try {
        const payload = JSON.parse(atob(token));
        return { user: { email: payload.email, role: payload.role }, exp: payload.exp };
    } catch {
        return null;
    }
}


// --- Public API ---

export const signUp = async (email: string, password: string, role: 'student' | 'tutor'): Promise<{ success: boolean; message: string }> => {
  return new Promise(resolve => {
    setTimeout(() => {
      const users = getUsers();
      if (users[email.toLowerCase()]) {
        resolve({ success: false, message: 'An account with this email already exists.' });
        return;
      }
      users[email.toLowerCase()] = {
        passwordHash: mockHash(password),
        role,
      };
      saveUsers(users);

      // Auto-login the user by creating and storing a token
      const user: User = { email: email.toLowerCase(), role };
      const token = createToken(user);
      localStorage.setItem(TOKEN_KEY, token);

      resolve({ success: true, message: 'Account created successfully!' });
    }, 500); // Simulate network latency
  });
};

export const login = async (email: string, password: string): Promise<{ success: boolean; message: string }> => {
    return new Promise(resolve => {
        setTimeout(() => {
            const users = getUsers();
            const userData = users[email.toLowerCase()];
            if (!userData || userData.passwordHash !== mockHash(password)) {
                resolve({ success: false, message: 'Invalid email or password.' });
                return;
            }
            
            const user: User = { email: email.toLowerCase(), role: userData.role };
            const token = createToken(user);
            localStorage.setItem(TOKEN_KEY, token);

            resolve({ success: true, message: 'Logged in successfully.' });
        }, 500);
    });
};

export const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('remsodo_currentCourse'); // Also clear current course on logout
};

export const getCurrentUser = (): User | null => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return null;

    const decoded = decodeToken(token);
    if (!decoded || decoded.exp < Date.now()) {
        // Token is invalid or expired
        logout();
        return null;
    }
    
    return decoded.user;
};


export const requestPasswordReset = async (email: string): Promise<{ success: boolean; message: string }> => {
    return new Promise(resolve => {
        setTimeout(() => {
            const users = getUsers();
            if (!users[email.toLowerCase()]) {
                 // Don't reveal if the user exists for security, but for demo we will.
                 resolve({ success: false, message: 'No account found with that email.' });
                 return;
            }
            // In a real app, you would send an email with a reset link.
            console.log(`Password reset email sent to ${email} (simulation).`);
            resolve({ success: true, message: 'If an account exists, a password reset link has been sent.' });
        }, 500);
    });
};