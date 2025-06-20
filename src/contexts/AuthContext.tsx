import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type User = Database['public']['Tables']['users']['Row'];

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isLoading: boolean;
  isError: boolean;
  errorMessage: string | null;
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
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  useEffect(() => {
    // Check for existing session with retry logic
    const checkSession = async () => {
      try {
        setIsLoading(true);
        setIsError(false);
        setErrorMessage(null);
        
        // Check for stored user
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            
            // Validate the user by making a quick check to the database
            const { data, error } = await supabase
              .from('users')
              .select('id')
              .eq('id', parsedUser.id)
              .single();
              
            if (error) {
              console.warn('Stored user validation failed:', error.message);
              // Clear invalid session
              localStorage.removeItem('currentUser');
              setUser(null);
            } else {
              // User is valid
              setUser(parsedUser);
            }
          } catch (parseError) {
            console.error('Failed to parse stored user:', parseError);
            localStorage.removeItem('currentUser');
          }
        }
      } catch (error) {
        console.error('Session check error:', error);
        setIsError(true);
        setErrorMessage('ไม่สามารถตรวจสอบสถานะการเข้าสู่ระบบได้');
        
        // Implement retry logic
        if (retryCount < MAX_RETRIES) {
          const nextRetry = retryCount + 1;
          setRetryCount(nextRetry);
          
          // Exponential backoff
          const delay = Math.min(1000 * 2 ** nextRetry, 10000);
          setTimeout(checkSession, delay);
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, [retryCount]);

  const login = async (username: string, password: string) => {
    try {
      setIsLoading(true);
      setIsError(false);
      setErrorMessage(null);
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .eq('password', password)
        .single();

      if (error || !data) {
        setIsError(true);
        setErrorMessage('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
        return { success: false, error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' };
      }

      setUser(data);
      localStorage.setItem('currentUser', JSON.stringify(data));
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      setIsError(true);
      setErrorMessage('เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
      return { success: false, error: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, isError, errorMessage }}>
      {children}
    </AuthContext.Provider>
  );
};
