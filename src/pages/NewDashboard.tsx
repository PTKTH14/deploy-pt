
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import { supabase } from '@/integrations/supabase/client';

interface Appointment {
  patient_id: string;
  full_name: string;
  appointment_time: string;
  note: string;
}

const NewDashboard = () => {
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const { userProfile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchTodayAppointments();
  }, []);

  const fetchTodayAppointments = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('appointments')
        .select('patient_id, full_name, appointment_time, note')
        .eq('appointment_date', today)
        .order('appointment_time', { ascending: true });

      if (error) {
        console.error('Error fetching appointments:', error);
      } else {
        setTodayAppointments(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    return timeString.substring(0, 5); // HH:MM format
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ยินดีต้อนรับ, {userProfile?.full_name}
          </h1>
          <p className="text-gray-600">
            วันนี้ {new Date().toLocaleDateString('th-TH', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">นัดหมายวันนี้</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayAppointments.length}</div>
              <p className="text-xs text-muted-foreground">
                รายการ
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ผู้ป่วยทั้งหมด</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayAppointments.length}</div>
              <p className="text-xs text-muted-foreground">
                คนในวันนี้
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">การดำเนินการ</CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => navigate('/appointments/new')}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                นัดหมายใหม่
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>นัดหมายวันนี้</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-4">กำลังโหลด...</div>
            ) : todayAppointments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                ไม่มีนัดหมายในวันนี้
              </div>
            ) : (
              <div className="space-y-4">
                {todayAppointments.map((appointment, index) => (
                  <div 
                    key={`${appointment.patient_id}-${index}`}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <h3 className="font-semibold">{appointment.full_name}</h3>
                      <p className="text-sm text-gray-600">
                        เวลา: {formatTime(appointment.appointment_time)}
                      </p>
                      {appointment.note && (
                        <p className="text-sm text-gray-500">
                          หมายเหตุ: {appointment.note}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NewDashboard;
