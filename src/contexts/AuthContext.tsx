
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: any | null;
  userProfile: any | null;
  loading: boolean;
  signIn: (username: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in from localStorage
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      setUserProfile(userData);
    }
    setLoading(false);
  }, []);

  const signIn = async (username: string, password: string) => {
    try {
      console.log('Attempting login with username:', username);
      
      // Check if user exists in users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single();

      console.log('User data from database:', userData);
      console.log('User error:', userError);

      if (userError || !userData) {
        return { error: { message: "ไม่พบข้อมูลผู้ใช้ในระบบ" } };
      }

      // Check if password matches
      if (userData.password !== password) {
        console.log('Password mismatch:', userData.password, 'vs', password);
        return { error: { message: "รหัสผ่านไม่ถูกต้อง" } };
      }

      // Set user session
      setUser(userData);
      setUserProfile(userData);
      
      // Store in localStorage for persistence
      localStorage.setItem('currentUser', JSON.stringify(userData));
      
      console.log('Login successful for user:', userData);
      return { error: null };
    } catch (error) {
      console.error('Login error:', error);
      return { error: { message: "เกิดข้อผิดพลาดในการเข้าสู่ระบบ" } };
    }
  };

  const signOut = async () => {
    setUser(null);
    setUserProfile(null);
    localStorage.removeItem('currentUser');
  };

  const value = {
    user,
    userProfile,
    loading,
    signIn,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
