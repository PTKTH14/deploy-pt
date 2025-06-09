
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { TablesInsert } from '@/integrations/supabase/types';

export const useAppointments = (filters?: {
  department?: string;
  date?: string;
  center?: 'รพ.สต.ต้า' | 'รพ.สต.พระเนตร' | 'ทต.ป่าตาล';
}) => {
  return useQuery({
    queryKey: ['appointments', filters],
    queryFn: async () => {
      let query = supabase
        .from('appointments')
        .select('*')
        .order('appointment_date', { ascending: true });

      if (filters?.department && filters.department !== 'เคสร่วม') {
        query = query.contains('departments', [filters.department]);
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
