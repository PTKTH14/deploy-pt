
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { TablesInsert } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';

export const useAppointments = (filters?: {
  department?: string;
  date?: string;
  center?: 'รพ.สต.ต้า' | 'รพ.สต.พระเนตร' | 'ทต.ป่าตาล';
}) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['appointments', filters, user?.role],
    queryFn: async () => {
      let query = supabase
        .from('appointments')
        .select('*')
        .order('appointment_date', { ascending: true });

      // กรองตามบทบาทผู้ใช้
      if (user?.role !== 'pt' && filters?.department && filters.department !== 'เคสร่วม') {
        // สำหรับ user ที่ไม่ใช่ PT ให้เห็นเฉพาะแผนกตัวเอง
        const departmentMap: { [key: string]: string } = {
          'กายภาพ': 'กายภาพบำบัด',
          'แผนไทย': 'แผนไทย',
          'แผนจีน': 'แผนจีน'
        };
        
        const mappedDepartment = departmentMap[filters.department] || filters.department;
        query = query.contains('departments', [mappedDepartment]);
      } else if (user?.role === 'pt' && filters?.department && filters.department !== 'เคสร่วม') {
        // PT เห็นได้ทุกแผนก
        const departmentMap: { [key: string]: string } = {
          'กายภาพ': 'กายภาพบำบัด',
          'แผนไทย': 'แผนไทย',
          'แผนจีน': 'แผนจีน'
        };
        
        const mappedDepartment = departmentMap[filters.department] || filters.department;
        query = query.contains('departments', [mappedDepartment]);
      }

      if (filters?.date) {
        query = query.eq('appointment_date', filters.date);
      }

      if (filters?.center) {
        query = query.eq('center', filters.center);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    },
  });
};

export const useAddAppointment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (appointment: TablesInsert<'appointments'>) => {
      const { data, error } = await supabase
        .from('appointments')
        .insert([appointment])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
};
