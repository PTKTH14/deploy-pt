
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useAppointmentStats = (filters?: {
  start_date?: string;
  end_date?: string;
}) => {
  return useQuery({
    queryKey: ['appointment_stats', filters],
    queryFn: async () => {
      let query = supabase
        .from('appointments')
        .select('*');

      if (filters?.start_date) {
        query = query.gte('appointment_date', filters.start_date);
      }
      
      if (filters?.end_date) {
        query = query.lte('appointment_date', filters.end_date);
      }

      const { data, error } = await query;
      
      if (error) throw error;

      // Process data for statistics
      const stats = {
        total: data?.length || 0,
        by_department: {},
        by_status: {},
        by_type: {},
        by_center: {},
        recent_appointments: data?.slice(0, 5) || []
      };

      data?.forEach(appointment => {
        // Department stats
        appointment.departments?.forEach(dept => {
          stats.by_department[dept] = (stats.by_department[dept] || 0) + 1;
        });

        // Status stats
        if (appointment.status) {
          stats.by_status[appointment.status] = (stats.by_status[appointment.status] || 0) + 1;
        }

        // Type stats
        if (appointment.appointment_type) {
          stats.by_type[appointment.appointment_type] = (stats.by_type[appointment.appointment_type] || 0) + 1;
        }

        // Center stats
        if (appointment.center) {
          stats.by_center[appointment.center] = (stats.by_center[appointment.center] || 0) + 1;
        }
      });

      return stats;
    },
  });
};

export const useHomeVisitStats = () => {
  return useQuery({
    queryKey: ['home_visit_stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('home_visits')
        .select('*');
      
      if (error) throw error;

      const stats = {
        total: data?.length || 0,
        by_patient_type: {},
        average_adl: 0,
        total_visits: 0,
        recent_visits: data?.slice(0, 5) || []
      };

      let totalAdl = 0;
      let totalVisitCount = 0;

      data?.forEach(visit => {
        // Patient type stats
        if (visit.patient_type) {
          stats.by_patient_type[visit.patient_type] = (stats.by_patient_type[visit.patient_type] || 0) + 1;
        }

        // ADL calculation
        totalAdl += visit.adl || 0;
        totalVisitCount += visit.visit_count || 0;
      });

      stats.average_adl = data?.length ? Math.round(totalAdl / data.length) : 0;
      stats.total_visits = totalVisitCount;

      return stats;
    },
  });
};
