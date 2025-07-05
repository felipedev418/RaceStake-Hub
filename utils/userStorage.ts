interface RegisteredUser {
  email: string;
  password: string;
  registeredAt: string;
}

interface AuthenticatedUser {
  email: string;
  authenticated: boolean;
  needs2FA: boolean;
}

const REGISTERED_USERS_KEY = 'registered_users';
const CURRENT_USER_KEY = 'user';

// Simple hash function for password storage (not for production use)
const hashPassword = (password: string): string => {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
};

// Get all registered users
export const getRegisteredUsers = (): RegisteredUser[] => {
  try {
    const users = localStorage.getItem(REGISTERED_USERS_KEY);
    return users ? JSON.parse(users) : [];
  } catch (error) {
    console.error('Error getting registered users:', error);
    return [];
  }
};

// Register a new user
export const registerUser = (email: string, password: string): boolean => {
  try {
    const users = getRegisteredUsers();
    
    // Check if user already exists
    const existingUser = users.find(user => user.email === email);
    if (existingUser) {
      return false; // User already exists
    }
    
    // Add new user
    const newUser: RegisteredUser = {
      email,
      password: hashPassword(password),
      registeredAt: new Date().toISOString(),
    };
    
    users.push(newUser);
    localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(users));
    
    return true;
  } catch (error) {
    console.error('Error registering user:', error);
    return false;
  }
};

// Authenticate user
export const authenticateUser = (email: string, password: string): boolean => {
  try {
    const users = getRegisteredUsers();
    const user = users.find(user => user.email === email);
    
    if (!user) {
      return false;
    }
    
    return user.password === hashPassword(password);
  } catch (error) {
    console.error('Error authenticating user:', error);
    return false;
  }
};

// Set current authenticated user
export const setCurrentUser = (email: string, authenticated: boolean = true, needs2FA: boolean = true): void => {
  try {
    const user: AuthenticatedUser = {
      email,
      authenticated,
      needs2FA,
    };
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  } catch (error) {
    console.error('Error setting current user:', error);
  }
};

// Get current user
export const getCurrentUser = (): AuthenticatedUser | null => {
  try {
    const userStr = localStorage.getItem(CURRENT_USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

// Update current user
export const updateCurrentUser = (updates: Partial<AuthenticatedUser>): void => {
  try {
    const currentUser = getCurrentUser();
    if (currentUser) {
      const updatedUser = { ...currentUser, ...updates };
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));
    }
  } catch (error) {
    console.error('Error updating current user:', error);
  }
};

// Sign out user
export const signOutUser = (): void => {
  try {
    localStorage.removeItem(CURRENT_USER_KEY);
  } catch (error) {
    console.error('Error signing out user:', error);
  }
};

// Check if user is registered
export const isUserRegistered = (email: string): boolean => {
  try {
    const users = getRegisteredUsers();
    return users.some(user => user.email === email);
  } catch (error) {
    console.error('Error checking if user is registered:', error);
    return false;
  }
}; 