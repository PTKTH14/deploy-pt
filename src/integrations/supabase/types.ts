// AUTO-GENERATED: Supabase table types for shift_schedules and shift_slots

export type ShiftSchedule = {
  id: string; // uuid
  date: string; // date (ISO string)
  shift: string; // 'morning' | 'afternoon' (หรือ text อื่น)
  day_type: string; // 'weekday' | 'weekend' | 'holiday' | 'sunday' (หรือ text อื่น)
  is_complete: boolean | null;
  total_required: number | null;
  created_at: string | null; // timestamp
  updated_at: string | null; // timestamp
};

export type ShiftSlot = {
  id: string; // uuid
  schedule_id: string | null; // uuid
  user_id: string; // text
  role: string; // text
  assigned_by: string | null; // text
  confidence_score: number | null;
  created_at: string | null; // timestamp
};
