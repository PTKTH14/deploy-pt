
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { TablesInsert } from '@/integrations/supabase/types';

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
