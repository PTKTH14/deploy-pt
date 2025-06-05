
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import PTStatusModal from '@/components/PTStatusModal';
import { supabase } from '@/integrations/supabase/client';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPTModal, setShowPTModal] = useState(false);
  const { signIn, user, userProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    console.log('User changed:', user);
    console.log('UserProfile changed:', userProfile);
    
    if (user && userProfile) {
      checkPTStatus();
    }
  }, [user, userProfile]);

  const checkPTStatus = async () => {
    if (userProfile?.role === 'pt') {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('pt_status')
        .select('*')
        .eq('user_id', userProfile.id)
        .eq('date', today)
        .single();

      console.log('PT Status check:', { data, error, today, userId: userProfile.id });

      if (error || !data) {
        setShowPTModal(true);
      } else {
        navigate('/');
      }
    } else {
      navigate('/');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('Starting login process...');
      const { error } = await signIn(username, password);
      
      if (error) {
        toast({
          title: "เกิดข้อผิดพลาดในการเข้าสู่ระบบ",
          description: error.message || "กรุณาลองใหม่อีกครั้ง",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "กรุณาลองใหม่อีกครั้ง",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePTStatusSaved = () => {
    setShowPTModal(false);
    navigate('/');
  };

  if (user && userProfile) {
    return (
      <>
        <PTStatusModal
          open={showPTModal}
          onStatusSaved={handlePTStatusSaved}
          userId={userProfile.id}
        />
        {!showPTModal && <div className="min-h-screen flex items-center justify-center">กำลังเข้าสู่ระบบ...</div>}
      </>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">เข้าสู่ระบบ</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">ชื่อผู้ใช้</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">รหัสผ่าน</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button 
              type="submit" 
              className="w-full"
              disabled={loading}
            >
              {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
