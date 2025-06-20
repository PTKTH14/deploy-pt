export type CenterType = 'รพ.สต.ต้า' | 'รพ.สต.พระเนตร' | 'ทต.ป่าตาล';

export type AppointmentStatus = 'new' | 'processing' | 'done' | 'cancelled' | 'completed' | 'เสร็จสิ้น' | 'มาตามนัด' | 'confirmed' | 'attended' | 'missed' | 'rescheduled';

export type AppointmentType = 'in' | 'out';

export type TimePeriod = 'ในเวลาราชการ' | 'นอกเวลาราชการ';

export type Department = 'กายภาพบำบัด' | 'แผนไทย' | 'แผนจีน';

export interface Appointment {
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

export interface AppointmentFilters {
  date?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  department?: Department | 'เคสร่วม' | 'นอกเวลา' | 'ศูนย์บริการ';
  view?: string;
  appointment_type?: AppointmentType;
  time_period?: TimePeriod;
  center?: CenterType;
}

export interface QueryError {
  message: string;
  details?: any;
} 