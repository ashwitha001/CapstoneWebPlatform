import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { v4 as uuidv4 } from 'uuid';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../main';

// Define user roles
export type UserRole = 'guest' | 'guide' | 'admin';

// Define user interface
interface User {
  uid: string;
  email: string | null;
  name: string | null;
  displayName: string | null;
  role: UserRole;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  register: (name: string, email: string, password: string, role: UserRole) => Promise<boolean>;
  registerGuide: (name: string, email: string) => Promise<string>;
  verifyGuideToken: (token: string) => { valid: boolean; email?: string; name?: string };
  completeGuideRegistration: (token: string, password: string) => Promise<boolean>;
  isLoading: boolean;
}

// Store guide registration tokens
interface GuideToken {
  token: string;
  email: string;
  name: string;
  expiresAt: number; // timestamp
}

// Create an empty context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Define the hook
function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Define the provider component
const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [guideTokens, setGuideTokens] = useState<GuideToken[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('Setting up auth state listener...');
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('Auth state changed:', firebaseUser?.email);
      try {
        if (firebaseUser) {
          // Get additional user data from Firestore
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const user = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              name: userData.name,
              displayName: firebaseUser.displayName,
              role: userData.role,
              createdAt: userData.createdAt
            };
            console.log('Setting user state:', user);
            setUser(user);
          } else {
            console.log('No user document found in Firestore');
            setUser(null);
          }
        } else {
          console.log('No Firebase user');
          setUser(null);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    });

    // Load guide tokens from localStorage
    const storedTokens = localStorage.getItem('guideTokens');
    if (storedTokens) {
      setGuideTokens(JSON.parse(storedTokens));
    }

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const register = async (name: string, email: string, password: string, role: UserRole): Promise<boolean> => {
    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update profile with name
      await updateProfile(userCredential.user, {
        displayName: name
      });

      // Store additional user data in Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        name,
        email,
        role,
        createdAt: new Date().toISOString()
      });

      // Verify the document was created by reading it back
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      if (!userDoc.exists()) {
        throw new Error('Failed to create user document');
      }

      // Set the user data immediately
      const userData = {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        name: name,
        displayName: name,
        role: role,
        createdAt: new Date().toISOString()
      };
      setUser(userData);

      toast({
        title: "Registration successful",
        description: "Your account has been created and you are now logged in.",
      });

      // Navigate to the appropriate dashboard based on role
      switch (role) {
        case 'admin':
          navigate('/admin-dashboard');
          break;
        case 'guide':
          navigate('/guide-dashboard');
          break;
        default:
          navigate('/dashboard');
      }

      return true;
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        variant: "destructive",
        title: "Registration failed",
        description: error instanceof Error ? error.message : "An error occurred during registration",
      });
      return false;
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log('Attempting login for:', email);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('Login successful:', userCredential.user.email);
      
      // The user state will be updated by the onAuthStateChanged listener
      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
      
      return true;
    } catch (error) {
      console.error('Login error:', error);
      toast({
        variant: "destructive",
        title: "Login failed",
        description: "Invalid email or password",
      });
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      // Clear any user data first
      setUser(null);
      // Then sign out from Firebase
      await signOut(auth);
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        variant: "destructive",
        title: "Logout failed",
        description: "An error occurred during logout",
      });
    }
  };

  const registerGuide = async (name: string, email: string): Promise<string> => {
    try {
      // Check if email already exists in Firebase Auth
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where("email", "==", email));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        toast({
          variant: "destructive",
          title: "Guide registration failed",
          description: "Email already in use",
        });
        return "";
      }

      // Generate token
      const token = uuidv4();
      
      // Store token with 24 hour expiry
      const newToken: GuideToken = {
        token,
        email,
        name,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000
      };

      const updatedTokens = [...guideTokens, newToken];
      setGuideTokens(updatedTokens);
      localStorage.setItem('guideTokens', JSON.stringify(updatedTokens));

      console.log(`Guide registration link for ${email}: /guide-registration/${token}`);
      
      toast({
        title: "Guide registration initiated",
        description: `Registration link generated for ${email}`,
      });

      return token;
    } catch (error) {
      console.error('Guide registration error:', error);
      toast({
        variant: "destructive",
        title: "Guide registration failed",
        description: "An error occurred during guide registration",
      });
      return "";
    }
  };

  const verifyGuideToken = (token: string) => {
    // Clean expired tokens
    const currentTokens = guideTokens.filter(t => t.expiresAt > Date.now());
    
    if (currentTokens.length !== guideTokens.length) {
      setGuideTokens(currentTokens);
      localStorage.setItem('guideTokens', JSON.stringify(currentTokens));
    }

    const foundToken = currentTokens.find(t => t.token === token);
    
    if (!foundToken) {
      return { valid: false };
    }

    return { 
      valid: true,
      email: foundToken.email,
      name: foundToken.name
    };
  };

  const completeGuideRegistration = async (token: string, password: string): Promise<boolean> => {
    const tokenData = verifyGuideToken(token);
    if (!tokenData.valid || !tokenData.email || !tokenData.name) {
      toast({
        variant: "destructive",
        title: "Registration failed",
        description: "Invalid or expired registration link",
      });
      return false;
    }

    try {
      // Register the guide in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, tokenData.email, password);
      
      // Update profile with name
      await updateProfile(userCredential.user, {
        displayName: tokenData.name
      });

      // Store additional user data in Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        name: tokenData.name,
        email: tokenData.email,
        role: 'guide',
        createdAt: new Date().toISOString()
      });

      // Remove the used token
      const updatedTokens = guideTokens.filter(t => t.token !== token);
      setGuideTokens(updatedTokens);
      localStorage.setItem('guideTokens', JSON.stringify(updatedTokens));

      toast({
        title: "Registration successful",
        description: "Your guide account has been created. Please login.",
      });

      return true;
    } catch (error) {
      console.error('Guide registration completion error:', error);
      toast({
        variant: "destructive",
        title: "Registration failed",
        description: error instanceof Error ? error.message : "An error occurred during registration",
      });
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      isAuthenticated: !!user,
      register,
      registerGuide,
      verifyGuideToken,
      completeGuideRegistration,
      isLoading
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthProvider, useAuth };
