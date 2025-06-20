import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Define types
type CenterType = 'รพ.สต.ต้า' | 'รพ.สต.พระเนตร' | 'ทต.ป่าตาล';
type Department = 'กายภาพบำบัด' | 'แผนไทย' | 'แผนจีน';
type AppointmentStatus = 'new' | 'processing' | 'done' | 'cancelled' | 'completed' | 'เสร็จสิ้น' | 'มาตามนัด' | 'confirmed' | 'attended' | 'missed' | 'rescheduled';
type AppointmentType = 'in' | 'out';
type TimePeriod = 'ในเวลาราชการ' | 'นอกเวลาราชการ';

// Define interfaces
interface Appointment {
  id: string;
  patient_id: string;
  full_name?: string;
  hn?: string;
  phone_number?: string;
  address?: string;
  appointment_date: string;
  appointment_time?: string;
  departments: Department[];
  department?: Department;
  table_number?: number | null;
  status: AppointmentStatus;
  appointment_type: AppointmentType;
  time_period: TimePeriod;
  center?: CenterType;
  note?: string;
  created_at?: string;
  updated_at?: string;
  location?: string;
}

interface AppointmentFilters {
  department?: Department | 'เคสร่วม' | 'นอกเวลา' | 'ศูนย์บริการ';
  date?: string;
  dateRange?: { start: string; end: string };
  center?: CenterType;
  view?: string;
  appointment_type?: AppointmentType;
  time_period?: TimePeriod;
}

interface QueryError {
  message: string;
  details?: any;
}

export const useAppointments = (filters?: AppointmentFilters) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['appointments', filters, user?.role],
    queryFn: async (): Promise<Appointment[]> => {
      try {
        console.log('Fetching appointments with filters:', filters);

        let query = supabase
          .from('appointments')
          .select('*');

        // Add date or date range filter first
        if (filters?.dateRange) {
          console.log('Applying date range filter:', filters.dateRange);
          
          // Validate date range
          if (!filters.dateRange.start || !filters.dateRange.end) {
            console.error('Invalid date range provided:', filters.dateRange);
          } else {
            query = query
              .gte('appointment_date', filters.dateRange.start)
              .lte('appointment_date', filters.dateRange.end);
          }
        } else if (filters?.date) {
          console.log('Applying single date filter:', filters.date);
          query = query.eq('appointment_date', filters.date);
        }

        // Department filtering logic with type safety
        if (filters?.department) {
          console.log('Applying department filter:', filters.department);

          switch (filters.department) {
            case 'กายภาพบำบัด':
              // กายภาพบำบัด - filter by table number or show joint cases
              query = query.contains('departments', ['กายภาพบำบัด']);
              if (filters.view && filters.view !== 'summary') {
                const tableNumber = parseInt(filters.view.replace('table', ''));
                query = query.eq('table_number', tableNumber);
              } else if (filters.view === 'summary') {
                query = query.is('table_number', null);
              }
              break;

            case 'แผนจีน':
              // แผนจีน - filter by user login and table
              query = query.contains('departments', ['แผนจีน']);
              if (user?.role === 'TCM1') {
                query = query.eq('table_number', 1);
              } else if (user?.role === 'TCM2') {
                query = query.eq('table_number', 2);
              }
              break;

            case 'แผนไทย':
              // แผนไทย - show all department appointments
              query = query.contains('departments', ['แผนไทย']);
              break;

            case 'เคสร่วม':
              // เคสร่วม - get appointments with multiple departments
              console.log('Querying joint cases - showing appointments with multiple departments');
              // Get all appointments, we'll filter for multiple departments client-side
              query = query
                .not('departments', 'is', null);
              break;

            case 'นอกเวลา':
              // นอกเวลาราชการ - filter by time period and user department
            query = query.eq('time_period', 'นอกเวลาราชการ');
              if (user?.role === 'pt') {
                query = query.contains('departments', ['กายภาพบำบัด']);
              } else if (user?.role) {
                // Convert user role to department if needed
                const userDept = user.role === 'pt' ? 'กายภาพบำบัด' : 
                                 user.role === 'ttm' ? 'แผนไทย' :
                                 user.role === 'tcm' ? 'แผนจีน' : user.role;
                query = query.contains('departments', [userDept as any]);
              }
              break;

            case 'ศูนย์บริการ':
              // ศูนย์บริการ - filter by center
              if (filters.center) {
                query = query.eq('center', filters.center);
              }
              break;
          }
        }

        // Add appointment_type filter if provided
        if (filters?.appointment_type) {
          query = query.eq('appointment_type', filters.appointment_type);
        }

        // Add time_period filter if provided
        if (filters?.time_period && filters.department !== 'นอกเวลา') {
          query = query.eq('time_period', filters.time_period);
        }

        // Order by date and time
        query = query
          .order('appointment_date', { ascending: true })
                    .order('appointment_time', { ascending: true });

        console.log('Final query:', query);
        const { data, error } = await query;
      
        if (error) {
          console.error('Supabase query error:', error);
          throw {
            message: 'Failed to fetch appointments',
            details: error
          } as QueryError;
        }

        if (!data) {
          console.warn('No appointments found');
          return [];
        }

        console.log(`Raw query results: ${data.length} appointments`);
        
        // Transform and filter data
        const appointments = data as any[];
        
        // Filter for joint cases if needed
        const filteredAppointments = appointments
          .filter(apt => {
            if (filters?.department === 'เคสร่วม') {
              const departments = Array.isArray(apt.departments) ? apt.departments : [];
              const deptCount = departments.length;
              const hasMultipleDepts = deptCount >= 2;
              console.log('Checking joint case:', {
                id: apt.id,
                name: apt.full_name,
                departments,
                deptCount,
                isJointCase: hasMultipleDepts,
                table_number: apt.table_number
              });
              return hasMultipleDepts;
            }
            return true;
          })
          .map(apt => ({
            ...apt,
            departments: Array.isArray(apt.departments) ? apt.departments : []
          }));

        console.log(`Final filtered appointments: ${filteredAppointments.length} appointments`);
        return filteredAppointments as Appointment[];
      } catch (error) {
        console.error('Error in useAppointments:', error);
        throw {
          message: 'Unexpected error while fetching appointments',
          details: error
        } as QueryError;
      }
    },
    staleTime: 1000 * 60, // Consider data fresh for 1 minute
    gcTime: 1000 * 60 * 30, // Keep unused data in cache for 30 minutes
    refetchOnWindowFocus: false, // Disable refetch on window focus to prevent flickering
    refetchOnMount: true, // Enable refetch on mount
  });
};

// Export useAddAppointment hook
export const useAddAppointment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (newAppointment: Partial<Appointment>): Promise<Appointment> => {
      try {
        // Ensure we're passing a valid object, not an array
        const appointmentData = { ...newAppointment };
        
      const { data, error } = await supabase
        .from('appointments')
          .insert([appointmentData])
        .select()
        .single();
      
        if (error) {
          throw {
            message: 'Failed to add appointment',
            details: error
          } as QueryError;
        }

        if (!data) {
          throw {
            message: 'No data returned after adding appointment'
          } as QueryError;
        }

        return data as Appointment;
      } catch (error) {
        console.error('Error in addAppointment:', error);
        throw {
          message: 'Unexpected error while adding appointment',
          details: error
        } as QueryError;
      }
    },
    onSuccess: (data) => {
      // Invalidate all appointment queries to ensure consistency
      queryClient.invalidateQueries({
        queryKey: ['appointments']
      });
      
      // Invalidate specific date query if we know the appointment date
      if (data.appointment_date) {
        queryClient.invalidateQueries({
          queryKey: ['appointments', { date: data.appointment_date }]
        });
      }
    }
  });
};

// Export types
export type {
  Appointment,
  AppointmentFilters,
  Department,
  AppointmentStatus,
  CenterType,
  AppointmentType,
  TimePeriod,
  QueryError
};
