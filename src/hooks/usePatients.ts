
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert } from '@/integrations/supabase/types';

export type Patient = Tables<'patients'>;

export const usePatients = () => {
  return useQuery({
    queryKey: ['patients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .order('full_name');
      
      if (error) throw error;
      return data;
    },
  });
};

export const useSearchPatients = (searchTerm: string) => {
  return useQuery({
    queryKey: ['patients', 'search', searchTerm],
    queryFn: async () => {
      if (!searchTerm.trim()) return [];
      
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .or(`full_name.ilike.%${searchTerm}%,hn.ilike.%${searchTerm}%,cid.ilike.%${searchTerm}%`)
        .order('full_name')
        .limit(10);
      
      if (error) throw error;
      return data;
    },
    enabled: !!searchTerm.trim(),
  });
};

export const useAddPatient = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (patient: TablesInsert<'patients'>) => {
      const { data, error } = await supabase
        .from('patients')
        .insert([patient])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
    },
  });
};
