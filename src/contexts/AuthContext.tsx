
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
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
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile(session.user.email!);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchUserProfile(session.user.email!);
        } else {
          setUserProfile(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (email: string) => {
    try {
      // Extract username from email (remove @system.local suffix)
      const username = email.replace('@system.local', '');
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single();
      
      if (error) {
        console.error('Error fetching user profile:', error);
        setUserProfile(null);
      } else {
        setUserProfile(data);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setUserProfile(null);
    }
  };

  const signIn = async (username: string, password: string) => {
    try {
      // First check if user exists in users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single();

      if (userError || !userData) {
        return { error: { message: "ไม่พบข้อมูลผู้ใช้ในระบบ" } };
      }

      // Check if password matches
      if (userData.password !== password) {
        return { error: { message: "รหัสผ่านไม่ถูกต้อง" } };
      }

      // Create a session by signing in with the username as email
      const { error } = await supabase.auth.signInWithPassword({
        email: username + '@system.local',
        password: 'dummy-password',
      });
      
      if (error) {
        // If auth fails, try to create the user first
        const { error: signUpError } = await supabase.auth.signUp({
          email: username + '@system.local',
          password: 'dummy-password',
        });

        if (!signUpError) {
          // Try signing in again
          const { error: retryError } = await supabase.auth.signInWithPassword({
            email: username + '@system.local',
            password: 'dummy-password',
          });
          return { error: retryError };
        }
        return { error: signUpError };
      }

      return { error: null };
    } catch (error) {
      console.error('Login error:', error);
      return { error: { message: "เกิดข้อผิดพลาดในการเข้าสู่ระบบ" } };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
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
