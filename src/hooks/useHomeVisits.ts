
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { TablesInsert } from '@/integrations/supabase/types';

export const useHomeVisits = (filters?: {
  patient_type?: string;
  visitor_id?: string;
}) => {
  return useQuery({
    queryKey: ['home_visits', filters],
    queryFn: async () => {
      let query = supabase
        .from('home_visits')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.patient_type) {
        query = query.eq('patient_type', filters.patient_type);
      }

      if (filters?.visitor_id) {
        query = query.eq('visitor_id', filters.visitor_id);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    },
  });
};

export const useAddHomeVisit = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (homeVisit: TablesInsert<'home_visits'>) => {
      const { data, error } = await supabase
        .from('home_visits')
        .insert([homeVisit])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['home_visits'] });
    },
  });
};
