// @ts-nocheck - Temporarily disable type checking for this file
// 📁 enhancedShiftScheduler.ts - ระบบจัดเวรขั้นสูง v2.0
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { format } from 'date-fns';
// @ts-ignore - Using existing supabase client
import { supabase } from '@/integrations/supabase/client';

dayjs.extend(utc);
dayjs.extend(timezone);

// 📌 เพิ่มโหมดจำลอง (Simulation Mode)
export const USE_SIMULATION_MODE = false; // ปิดโหมดจำลองเพื่อเชื่อมต่อกับฐานข้อมูลจริง

// 📌 ข้อมูลจำลองสำหรับโหมดจำลอง
const MOCK_CONFIG: ShiftConfig = {
  weekday_shift: 'afternoon',
  weekend_shift: 'morning',
  holiday_shift: 'morning',
  formats: {
    // วันทำงานปกติ (จันทร์-ศุกร์)
    weekday: [{ PT: 2, PT_ASST: 1 }], // กลับเป็น PT 2 คน และผู้ช่วย 1 คน (รวม 3 คน)
    // วันหยุดสุดสัปดาห์ (เสาร์)
    weekend: [{ PT: 1, PT_ASST: 1 }],
    // วันหยุดนักขัตฤกษ์
    holiday: [{ PT: 1, PT_ASST: 1 }],
  },
  // เพิ่มรูปแบบเวรทางเลือกที่สามารถเลือกใช้ได้
  alternative_formats: {
    weekday_alt1: [{ PT: 2, PT_ASST: 2 }],
    weekday_alt2: [{ PT: 1, PT_ASST: 2 }],
    weekend_alt1: [{ PT: 1, PT_ASST: 0 }],
  },
  // เลือกใช้รูปแบบเวรปัจจุบัน
  active_format: 'default', // 'default', 'alt1', 'alt2'
  max_consecutive_days: 2,  // ปรับลดจาก 3 เป็น 2 วัน
  min_rest_days: 1,         // ปรับลดจาก 2 เป็น 1 วัน เพื่อให้จัดเวรได้ถี่ขึ้น
  fair_distribution_weight: 1.2,  // เพิ่มน้ำหนักการกระจายเวรให้มากขึ้น
  // เพิ่มค่าพิเศษสำหรับผู้ช่วย
  pt_asst_max_consecutive_days: 3,  // ผู้ช่วยสามารถขึ้นเวรติดต่อกันได้มากกว่า PT
  pt_asst_min_rest_days: 0,         // ผู้ช่วยไม่จำเป็นต้องมีวันพักระหว่างเวร
};

const MOCK_HOLIDAYS = [
  '2025-01-01', // วันขึ้นปีใหม่
  '2025-02-12', // วันมาฆบูชา
  '2025-04-06', // วันจักรี
  '2025-04-13', // วันสงกรานต์
  '2025-04-14', // วันสงกรานต์
  '2025-04-15', // วันสงกรานต์
  '2025-05-01', // วันแรงงานแห่งชาติ
  '2025-05-05', // วันฉัตรมงคล
  '2025-06-03', // วันเฉลิมพระชนมพรรษาสมเด็จพระนางเจ้าฯ พระบรมราชินี
  '2025-06-10', // วันวิสาขบูชา
  '2025-07-28', // วันเฉลิมพระชนมพรรษา
  '2025-08-12', // วันแม่แห่งชาติ
  '2025-10-13', // วันคล้ายวันสวรรคต
  '2025-10-23', // วันปิยมหาราช
  '2025-12-05', // วันพ่อแห่งชาติ
  '2025-12-10', // วันรัฐธรรมนูญ
  '2025-12-31', // วันสิ้นปี
];

const MOCK_PERSONNEL: Personnel[] = [
  { id: '1', name: 'น.ส.ชนัฐปภา วีระแสง', role: 'PT', position: 'นักกายภาพบำบัดชำนาญการ', active: true, shift_preference: 'morning' },
  { id: '2', name: 'ว่าที่ ร.ต.หญิงภัทรลักษณ์ อิ่นคำ', role: 'PT', position: 'นักกายภาพบำบัดชำนาญการ', active: true, shift_preference: 'any' },
  { id: '3', name: 'นายเจษฎาพงษ์ ปัญญา', role: 'PT', position: 'นักกายภาพบำบัด', active: true, shift_preference: 'afternoon' },
  { id: '4', name: 'นางสาวสุภารัตน์ เจริญราช', role: 'PT', position: 'นักกายภาพบำบัด', active: true, shift_preference: 'any' },
  { id: '5', name: 'นางสาวฐิตาภรณ์ หงส์ทอง', role: 'PT', position: 'นักกายภาพบำบัด', active: true, shift_preference: 'morning' },
  { id: '6', name: 'นายวีระศักดิ์ กันทะ', role: 'PT_ASST', position: 'ผู้ช่วยนักกายภาพบำบัด', active: true, shift_preference: 'any' },
  { id: '7', name: 'นายณรงค์ฤทธิ์ สร้างแก้ว', role: 'PT_ASST', position: 'ผู้ช่วยนักกายภาพบำบัด', active: true, shift_preference: 'afternoon' },
  { id: '8', name: 'นายนฤดล ยาติ', role: 'PT_ASST', position: 'ผู้ช่วยนักกายภาพบำบัด', active: true, shift_preference: 'morning' },
  { id: '9', name: 'นางสาวกีรติกา ธิทะ', role: 'PT_ASST', position: 'ผู้ช่วยนักกายภาพบำบัด', active: true, shift_preference: 'any' },
];

const MOCK_SHIFT_REQUESTS: ShiftRequest[] = [
  { id: '1', user_id: '1', date: '2025-06-05', request_type: 'want', reason: 'ต้องการเข้าเวรวันนี้', created_at: '2025-05-20' },
  { id: '2', user_id: '2', date: '2025-06-10', request_type: 'decline', reason: 'มีธุระส่วนตัว', created_at: '2025-05-21' },
  { id: '3', user_id: '3', date: '2025-06-15', request_type: 'want', reason: 'สะดวกทำงานวันนี้', created_at: '2025-05-22' },
  { id: '4', user_id: '4', date: '2025-06-20', request_type: 'decline', reason: 'ไม่สะดวก', created_at: '2025-05-23' },
];

// 📌 Interface สำหรับ Type Safety
export interface ShiftConfig {
  weekday_shift: 'morning' | 'afternoon';
  weekend_shift: 'morning' | 'afternoon';  
  holiday_shift: 'morning' | 'afternoon';
  formats: {
    weekday: Array<Record<string, number>>;
    weekend: Array<Record<string, number>>;
    holiday: Array<Record<string, number>>;
  };
  // รูปแบบเวรทางเลือกเพิ่มเติม
  alternative_formats?: {
    [key: string]: Array<Record<string, number>>;
  };
  // เลือกใช้รูปแบบเวรปัจจุบัน
  active_format?: 'default' | 'alt1' | 'alt2' | string;
  max_consecutive_days?: number;
  min_rest_days?: number;
  fair_distribution_weight?: number;
  // เพิ่มค่าพิเศษสำหรับผู้ช่วย
  pt_asst_max_consecutive_days?: number;
  pt_asst_min_rest_days?: number;
}

export interface Personnel {
  id: string;
  name: string;
  role: string;
  position: string;
  active: boolean;
  shift_preference?: 'morning' | 'afternoon' | 'any';
  max_shifts_per_month?: number;
  seniority_level?: number;
  department?: string;
}

export interface ShiftRequest {
  id: string;
  user_id: string;
  date: string;
  request_type: 'want' | 'decline' | 'emergency_only' | 'leave';
  reason?: string;
  created_at: string;
}

export interface ShiftSlot {
  user_id: string;
  role: string;
  assigned_by: 'auto' | 'manual' | 'request';
  confidence_score?: number;
}

export interface DaySchedule {
  date: string;
  shift: 'morning' | 'afternoon';
  day_type: 'weekday' | 'weekend' | 'holiday' | 'sunday';
  slots: ShiftSlot[];
  is_complete: boolean;
  total_required: number;
  warnings?: string[];
  _allSlots?: ShiftSlot[];
}

// 📌 โหลดและแคช config
let cachedConfig: ShiftConfig | null = null;
async function getShiftConfig(userConfig?: Partial<ShiftConfig>): Promise<ShiftConfig> {
  // ถ้ามีการส่งค่า userConfig มา ให้ใช้ค่านั้นแทนที่ค่าเดิม
  if (userConfig) {
    console.log('🔧 ใช้การตั้งค่าจากผู้ใช้:', userConfig);
    
    // ถ้าอยู่ในโหมดจำลอง ให้ผสมค่าจาก MOCK_CONFIG กับ userConfig
    if (USE_SIMULATION_MODE) {
      const mergedConfig = { ...MOCK_CONFIG };
      
      // อัปเดตค่าจาก userConfig
      if (userConfig.formats) {
        mergedConfig.formats = {
          ...mergedConfig.formats,
          ...userConfig.formats
        };
      }
      
      // อัปเดตค่าอื่นๆ
      if (userConfig.weekday_shift) mergedConfig.weekday_shift = userConfig.weekday_shift;
      if (userConfig.weekend_shift) mergedConfig.weekend_shift = userConfig.weekend_shift;
      if (userConfig.holiday_shift) mergedConfig.holiday_shift = userConfig.holiday_shift;
      
      console.log('🎭 โหมดจำลอง: ใช้การตั้งค่าเวรผสม');
      return mergedConfig;
    }
    
    // ถ้าไม่ได้อยู่ในโหมดจำลอง ให้อัปเดตค่าใน DB
    try {
      // @ts-ignore - Tables not properly typed in supabase client
      await supabase
        .from('shift_config')
        .update({ value: userConfig })
        .eq('key', 'default');
      
      cachedConfig = null; // ล้างแคชเพื่อให้โหลดค่าใหม่
    } catch (error) {
      console.error('❌ เกิดข้อผิดพลาดในการอัปเดตการตั้งค่าเวร:', error);
    }
  }

  // ถ้าอยู่ในโหมดจำลอง ให้ใช้ข้อมูลจำลอง
  if (USE_SIMULATION_MODE) {
    console.log('🎭 โหมดจำลอง: ใช้การตั้งค่าเวรจำลอง');
    return MOCK_CONFIG;
  }

  if (cachedConfig) {
    console.log('💾 ใช้การตั้งค่าเวรจากแคช');
    return cachedConfig;
  }
  
  try {
    console.log('📥 กำลังโหลดการตั้งค่าเวรจาก Supabase...');
    // @ts-ignore - Tables not properly typed in supabase client
    const { data, error } = await supabase
      .from('shift_config')
      .select('value')
      .eq('key', 'default')
      .single();
      
    if (error) {
      console.error('❌ เกิดข้อผิดพลาดในการดึงการตั้งค่าเวรจาก Supabase:', error);
      throw error;
    }
    
    console.log('✅ โหลดการตั้งค่าเวรจาก Supabase สำเร็จ');
    cachedConfig = data.value;
    return cachedConfig;
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดในการดึงการตั้งค่าเวร:', error);
    console.warn('⚠️ ใช้การตั้งค่าเวรจำลองแทน');
    return MOCK_CONFIG;
  }
}

// 📌 โหลดวันหยุดแบบมีประสิทธิภาพ
async function getHolidays(year?: number): Promise<string[]> {
  // ถ้าอยู่ในโหมดจำลอง ให้ใช้ข้อมูลจำลอง
  if (USE_SIMULATION_MODE) {
    console.log('🎭 โหมดจำลอง: ใช้ข้อมูลวันหยุดจำลอง');
    if (year) {
      const yearStr = year.toString();
      const filteredHolidays = MOCK_HOLIDAYS.filter(date => date.startsWith(yearStr));
      console.log(`📅 วันหยุดจำลองสำหรับปี ${year}:`, filteredHolidays.length, 'วัน');
      return filteredHolidays;
    }
    console.log('📅 วันหยุดจำลองทั้งหมด:', MOCK_HOLIDAYS.length, 'วัน');
    return MOCK_HOLIDAYS;
  }

  try {
    console.log('📥 กำลังโหลดข้อมูลวันหยุดจาก Supabase...');
    // ลองดึงข้อมูลจากตาราง holidays ก่อน
    let holidayDates: string[] = [];
    
    // @ts-ignore - Tables not properly typed in supabase client
    let query = supabase.from('holidays').select('*');
    
    if (year) {
      const startYear = `${year}-01-01`;
      const endYear = `${year}-12-31`;
      try {
        query = query.gte('date', startYear).lte('date', endYear);
      } catch (e) {
        console.warn('⚠️ ไม่สามารถกรองตามวันที่ได้ในตาราง holidays:', e);
      }
    }
    
    const { data: holidaysData, error: holidaysError } = await query;
    
    // ถ้าไม่มีข้อมูลจากตาราง holidays ลองดึงจากตาราง public_holidays แทน
    if (holidaysError || !holidaysData || holidaysData.length === 0) {
      console.warn('⚠️ ไม่พบข้อมูลในตาราง holidays ลองใช้ตาราง public_holidays แทน');
      
      // @ts-ignore - Tables not properly typed in supabase client
      let publicQuery = supabase.from('public_holidays').select('*');
      
      if (year) {
        const startYear = `${year}-01-01`;
        const endYear = `${year}-12-31`;
        try {
          publicQuery = publicQuery.gte('date', startYear).lte('date', endYear);
        } catch (e) {
          console.warn('⚠️ ไม่สามารถกรองตามวันที่ได้ในตาราง public_holidays:', e);
        }
      }
      
      const { data: publicData, error: publicError } = await publicQuery;
      
      if (publicError || !publicData || publicData.length === 0) {
        console.warn('⚠️ ไม่พบข้อมูลวันหยุดในฐานข้อมูล ใช้ข้อมูลจำลองแทน');
        return MOCK_HOLIDAYS;
      }
      
      // ใช้ข้อมูลจากตาราง public_holidays
      const extractedDates = extractDatesFromData(publicData);
      console.log('✅ โหลดข้อมูลวันหยุดจากตาราง public_holidays สำเร็จ:', extractedDates.length, 'วัน');
      return extractedDates;
    }
    
    // ใช้ข้อมูลจากตาราง holidays
    const extractedDates = extractDatesFromData(holidaysData);
    console.log('✅ โหลดข้อมูลวันหยุดจากตาราง holidays สำเร็จ:', extractedDates.length, 'วัน');
    return extractedDates;
    
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดในการดึงข้อมูลวันหยุด:', error);
    console.warn('⚠️ ใช้ข้อมูลวันหยุดจำลองแทน');
    return MOCK_HOLIDAYS;
  }
}

// ฟังก์ชันช่วยสกัดวันที่จากข้อมูล
function extractDatesFromData(data: any[]): string[] {
  if (!data || data.length === 0) return [];
  
  const firstRow = data[0];
  let dateField = 'date';
  
  if (typeof firstRow.date === 'string') {
    dateField = 'date';
  } else if (typeof firstRow.holiday_date === 'string') {
    dateField = 'holiday_date';
  } else {
    // ถ้าไม่มีคอลัมน์ date หรือ holiday_date ให้หาคอลัมน์แรกที่มีค่าเป็น string ที่อาจจะเป็นวันที่
    const possibleDateField = Object.keys(firstRow).find(key => 
      typeof firstRow[key] === 'string' && 
      firstRow[key].match(/^\d{4}-\d{2}-\d{2}/)
    );
    
    if (possibleDateField) {
      dateField = possibleDateField;
    } else {
      console.warn('ไม่พบคอลัมน์วันที่ในข้อมูล');
      return [];
    }
  }
  
  return data.map((d: any) => d[dateField]);
}

// 📌 ปรับปรุงการตรวจสอบประเภทวัน
function getDayType(date: string, holidays: string[]): 'weekday' | 'weekend' | 'holiday' | 'sunday' {
  const d = dayjs(date);
  
  // ตรวจสอบวันหยุดนักขัตฤกษ์ก่อน
  if (holidays.includes(date)) return 'holiday';
  
  // วันอาทิตย์ - ไม่มีเวร
  if (d.day() === 0) return 'sunday';
  
  // วันเสาร์
  if (d.day() === 6) return 'weekend';
  
  return 'weekday';
}

// 📌 โหลดบุคลากรพร้อมข้อมูลเพิ่มเติม
async function getPersonnel(): Promise<Personnel[]> {
  // ถ้าอยู่ในโหมดจำลอง ให้ใช้ข้อมูลจำลอง
  if (USE_SIMULATION_MODE) {
    console.log('🎭 โหมดจำลอง: ใช้ข้อมูลบุคลากรจำลอง');
    return MOCK_PERSONNEL;
  }

  try {
    console.log('📥 กำลังโหลดข้อมูลบุคลากรจาก Supabase...');
    // @ts-ignore - Tables not properly typed in supabase client
    const { data, error } = await supabase
      .from('personnel')
      .select('*')
      .eq('active', true);
      
    if (error) {
      console.error('❌ เกิดข้อผิดพลาดในการดึงข้อมูลบุคลากรจาก Supabase:', error);
      throw error;
    }

    console.log('✅ โหลดข้อมูลบุคลากรจาก Supabase สำเร็จ:', data?.length || 0, 'รายการ');

    // แปลงข้อมูลให้ตรงกับ Personnel interface
    const convertedData = data.map((person: any) => {
      // ตรวจสอบชื่อ
      const name = person.name || person.full_name || `${person.first_name || ''} ${person.last_name || ''}`.trim();
      
      // ตรวจสอบตำแหน่ง
      const position = person.position || person.title || '';
      
      // กำหนดบทบาทให้ยืดหยุ่นมากขึ้น
      let role = person.role || '';
      
      // ถ้าไม่มีบทบาทที่กำหนดไว้ชัดเจน ให้ตรวจสอบจากตำแหน่ง
      if (!role || role === '') {
        // ตรวจสอบตำแหน่งว่ามีคำว่า "ผู้ช่วย" หรือไม่ โดยไม่สนใจตัวพิมพ์เล็ก/ใหญ่
        if (position.toLowerCase().includes('ผู้ช่วย') || 
            position.toLowerCase().includes('assistant') || 
            position.toLowerCase().includes('asst')) {
          role = 'PT_ASST';
        } else {
          // ถ้าไม่มีคำว่า "ผู้ช่วย" ให้สันนิษฐานว่าเป็น PT
          role = 'PT';
        }
      }
      
      // แปลงบทบาทให้เป็นรูปแบบมาตรฐาน
      if (role.toUpperCase() === 'PT_ASST' || 
          role.toUpperCase() === 'PTASST' || 
          role.toUpperCase() === 'PT-ASST' || 
          role.toUpperCase() === 'ASSISTANT') {
        role = 'PT_ASST';
      } else if (role.toUpperCase() === 'PT' || 
                role.toUpperCase() === 'THERAPIST' || 
                role.toUpperCase() === 'PHYSICAL_THERAPIST') {
        role = 'PT';
      }
      
      console.log(`👤 บุคลากร: ${name}, ตำแหน่ง: ${position}, บทบาท: ${role}`);

      return {
      id: person.id.toString(),
        name: name,
        role: role,
        position: position,
      active: person.active !== false,
      shift_preference: person.shift_preference || 'any'
      };
    });

    // ตรวจสอบว่ามีทั้ง PT และ PT_ASST หรือไม่
    const hasPT = convertedData.some(person => person.role === 'PT');
    const hasPTAsst = convertedData.some(person => person.role === 'PT_ASST');
    
    console.log(`👨‍⚕️ นักกายภาพบำบัด: ${convertedData.filter(p => p.role === 'PT').length} คน, 👨‍⚕️ ผู้ช่วย: ${convertedData.filter(p => p.role === 'PT_ASST').length} คน`);

    if (!hasPT || !hasPTAsst) {
      console.warn('⚠️ ไม่พบบุคลากรทั้งประเภท PT และ PT_ASST ในระบบ');
      if (!hasPT && convertedData.length > 0) {
        // ถ้าไม่มี PT แต่มีบุคลากรอื่น ให้กำหนดบุคลากรคนแรกเป็น PT
        convertedData[0].role = 'PT';
        console.log(`🔄 กำหนดให้ ${convertedData[0].name} เป็น PT`);
      }
      if (!hasPTAsst && convertedData.length > 1) {
        // ถ้าไม่มี PT_ASST แต่มีบุคลากรอื่น ให้กำหนดบุคลากรคนที่สองเป็น PT_ASST
        convertedData[1].role = 'PT_ASST';
        console.log(`🔄 กำหนดให้ ${convertedData[1].name} เป็น PT_ASST`);
      }
    }

    return convertedData;
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดในการดึงข้อมูลบุคลากร:', error);
    // หากเกิดข้อผิดพลาด ให้ใช้ข้อมูลจำลองแทน
    console.warn('⚠️ ใช้ข้อมูลบุคลากรจำลองแทน');
    return MOCK_PERSONNEL;
  }
}

// 📌 โหลดคำขอเวรแบบมีประสิทธิภาพ
async function getShiftRequests(start: string, end: string): Promise<ShiftRequest[]> {
  // ถ้าอยู่ในโหมดจำลอง ให้ใช้ข้อมูลจำลอง
  if (USE_SIMULATION_MODE) {
    return MOCK_SHIFT_REQUESTS.filter(req => 
      req.date >= start && req.date <= end
    );
  }

  try {
    // @ts-ignore - Tables not properly typed in supabase client
    const { data, error } = await supabase
      .from('shift_requests')
      .select('*')
      .gte('date', start)
      .lte('date', end);
      
    if (error) throw error;
    
    // แปลงข้อมูลให้ตรงกับ ShiftRequest interface
    return data.map((request: any) => ({
      id: request.id.toString(),
      user_id: request.user_id.toString(),
      date: request.date,
      request_type: request.request_type || request.type || 'want',
      reason: request.reason || request.comment || '',
      created_at: request.created_at || new Date().toISOString()
    }));
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการดึงข้อมูลคำขอเวร:', error);
    // หากเกิดข้อผิดพลาด ให้คืนค่าอาร์เรย์ว่าง
    return [];
  }
}

// 📌 โหลดประวัติการทำงานเวรล่าสุด
async function getRecentShiftHistory(personnelIds: string[], days: number = 30): Promise<Record<string, any[]>> {
  // ถ้าอยู่ในโหมดจำลอง ให้ใช้ข้อมูลจำลองว่างเปล่า (ไม่มีประวัติเวรเก่า)
  if (USE_SIMULATION_MODE) {
    const history: Record<string, any[]> = {};
    personnelIds.forEach(id => {
      history[id] = [];
    });
    return history;
  }

  const since = dayjs().subtract(days, 'days').format('YYYY-MM-DD');
  
  const { data, error } = await supabase
    .from('shift_slots')
    .select(`
      user_id,
      shift_schedules!inner (
        date,
        shift
      )
    `)
    .in('user_id', personnelIds)
    .gte('shift_schedules.date', since)
    
  if (error) {
    console.error('เกิดข้อผิดพลาดในการดึงประวัติเวร:', error);
    throw error;
  }
  
  const history: Record<string, any[]> = {};
  for (const record of data) {
    if (!history[record.user_id]) {
        history[record.user_id] = [];
    }
    if (record.shift_schedules) {
      history[record.user_id].push({
        schedule_date: record.shift_schedules.date,
        shift: record.shift_schedules.shift
      });
    }
  }

  // เรียงลำดับประวัติของแต่ละคนตามวันที่ล่าสุด
  for (const userId in history) {
    history[userId].sort((a, b) => dayjs(b.schedule_date).diff(dayjs(a.schedule_date)));
  }
  
  return history;
}

// 📌 คำนวณคะแนนความเหมาะสมในการได้รับเวร
function calculateAssignmentScore(
  person: Personnel, 
  date: string, 
  dayType: 'weekday' | 'weekend' | 'holiday',
  shiftHistory: any[],
  requests: ShiftRequest[],
  currentCounts: Record<string, number>,
  schedule: DaySchedule[], // เพิ่มตารางเวรที่จัดไปแล้ว
  prevDays: number = 2,  // ปรับลดจาก 3 เป็น 2 วัน เพื่อให้สอดคล้องกับการปรับ min_rest_days
  maxConsecutiveDays: number = 2, // จำนวนวันติดกันสูงสุดที่อนุญาต
  randomnessFactor: number = 0, // ปัจจัยความสุ่มเพิ่มเติม (0 = ไม่มีความสุ่ม, 10 = สุ่มมาก)
  config: ShiftConfig = MOCK_CONFIG // เพิ่มการรับค่า config
): number {
  let score = 100; // คะแนนเริ่มต้น
  
  // ปรับสมดุลให้บุคลากรใหม่: ถ้าไม่มีประวัติทำงานเลย (เป็นคนใหม่) ให้ลดคะแนนเริ่มต้นลงเล็กน้อย
  if (shiftHistory.length === 0) {
    score -= 5; // ลดคะแนนเพื่อไม่ให้ถูกเลือกบ่อยเกินไปในช่วงแรก (ลดจาก 10 เป็น 5)
  }
  
  // ใช้ค่าพิเศษสำหรับผู้ช่วย
  if (person.role === 'PT_ASST') {
    maxConsecutiveDays = config.pt_asst_max_consecutive_days || maxConsecutiveDays;
    prevDays = Math.max(1, prevDays); // ต้องตรวจสอบอย่างน้อย 1 วันย้อนหลัง
    
    // ให้ความสำคัญกับการจัดผู้ช่วยให้ครบ
    score += 20; // เพิ่มคะแนนให้ผู้ช่วยเพื่อให้มีโอกาสถูกเลือกมากขึ้น (ลดจาก 30 เป็น 20)
    
    // เพิ่มคะแนนพิเศษสำหรับผู้ช่วยที่มีเวรน้อย
    const assistantIds = MOCK_PERSONNEL.filter(p => p.role === 'PT_ASST').map(p => p.id);
    const assistantCounts = Object.fromEntries(
      Object.entries(currentCounts).filter(([id, _]) => assistantIds.includes(id))
    );
    
    if (Object.keys(assistantCounts).length > 0) {
      const avgAssistantShifts = Object.values(assistantCounts).reduce((a, b) => a + b, 0) / Object.keys(assistantCounts).length;
      
      if ((currentCounts[person.id] || 0) < avgAssistantShifts) {
        // ให้คะแนนเพิ่มสำหรับผู้ช่วยที่มีเวรน้อยกว่าค่าเฉลี่ย
        score += 50; // เพิ่มจาก 40 เป็น 50
      }
    }
    
    // ตรวจสอบว่าวันนี้มีผู้ช่วยครบหรือยัง
    const todaySchedule = schedule.find(s => s.date === date);
    if (todaySchedule) {
      const assistantsAssigned = todaySchedule.slots.filter(s => s.role === 'PT_ASST').length;
      
      // ถ้ายังไม่มีผู้ช่วยในวันนี้เลย ให้คะแนนเพิ่มเพื่อบังคับให้จัดผู้ช่วย
      if (assistantsAssigned === 0) {
        score += 100; // เพิ่มคะแนนมากๆ เพื่อให้แน่ใจว่าจะได้รับการจัดเวร
      }
    }
  } else {
    // สำหรับ PT ปกติ
    const ptIds = MOCK_PERSONNEL.filter(p => p.role === 'PT').map(p => p.id);
    const ptCounts = Object.fromEntries(
      Object.entries(currentCounts).filter(([id, _]) => ptIds.includes(id))
    );
    
    if (Object.keys(ptCounts).length > 0) {
      const avgPTShifts = Object.values(ptCounts).reduce((a, b) => a + b, 0) / Object.keys(ptCounts).length;
      
      if ((currentCounts[person.id] || 0) < avgPTShifts) {
        // ให้คะแนนเพิ่มสำหรับนักกายภาพที่มีเวรน้อยกว่าค่าเฉลี่ย
        score += 50; // เพิ่มจาก 40 เป็น 50
      }
    }
  }
  
  // เพิ่มค่าสุ่มตามปัจจัยที่กำหนด แต่ลดลงเพื่อให้มีผลน้อยลง
  if (randomnessFactor > 0) {
    // สร้างค่าสุ่มระหว่าง -randomnessFactor/2 ถึง +randomnessFactor/2 (ลดลงครึ่งหนึ่ง)
    const randomAdjustment = (Math.random() * 2 - 1) * (randomnessFactor / 2);
    score += randomAdjustment;
  }
  
  // 📊 กระจายเวรให้เท่าเทียมกัน (ยิ่งทำน้อย ยิ่งได้คะแนนสูง)
  const totalAssigned = currentCounts[person.id] || 0;
  
  // คำนวณค่าเฉลี่ยแยกตามบทบาท (PT หรือ PT_ASST)
  let avgAssigned = 0;
  let maxInRole = 0;
  let minInRole = Number.MAX_SAFE_INTEGER;
  let allCountsInRole: number[] = [];
  
  if (person.role === 'PT') {
    const ptCounts = Object.entries(currentCounts)
      .filter(([id, _]) => MOCK_PERSONNEL.find(p => p.id === id)?.role === 'PT')
      .map(([_, count]) => count);
    
    avgAssigned = ptCounts.length > 0 ? ptCounts.reduce((a, b) => a + b, 0) / ptCounts.length : 0;
    maxInRole = ptCounts.length > 0 ? Math.max(...ptCounts) : 0;
    minInRole = ptCounts.length > 0 ? Math.min(...ptCounts) : 0;
    allCountsInRole = ptCounts;
  } else {
    const assistantCounts = Object.entries(currentCounts)
      .filter(([id, _]) => MOCK_PERSONNEL.find(p => p.id === id)?.role === 'PT_ASST')
      .map(([_, count]) => count);
    
    avgAssigned = assistantCounts.length > 0 ? assistantCounts.reduce((a, b) => a + b, 0) / assistantCounts.length : 0;
    maxInRole = assistantCounts.length > 0 ? Math.max(...assistantCounts) : 0;
    minInRole = assistantCounts.length > 0 ? Math.min(...assistantCounts) : 0;
    allCountsInRole = assistantCounts;
  }
  
  // เพิ่มน้ำหนักให้มากขึ้นเพื่อให้กระจายเวรมากขึ้น
  const distributionWeight = 80; // เพิ่มน้ำหนักให้การกระจายเวรมากขึ้น (เพิ่มจาก 40 เป็น 80)
  
  // คำนวณความแตกต่างระหว่างจำนวนเวรของบุคลากรนี้กับค่าเฉลี่ย
  const difference = avgAssigned - totalAssigned;
  
  // ตรวจสอบความแตกต่างระหว่างจำนวนเวรมากสุดและน้อยสุดในกลุ่มเดียวกัน
  const maxDifference = maxInRole - minInRole;
  
  // ถ้าบุคลากรนี้มีเวรน้อยกว่าค่าเฉลี่ย ให้คะแนนเพิ่ม
  if (difference > 0) {
    // ยิ่งมีเวรน้อยกว่าค่าเฉลี่ยมาก ยิ่งได้คะแนนมาก
    const distributionBonus = difference * distributionWeight;
    
    // จำกัดเพดานโบนัสเพื่อป้องกันไม่ให้บุคลากรใหม่ได้คะแนนสูงเกินไป
    const cappedBonus = Math.min(distributionBonus, 120); // เพิ่มจาก 80 เป็น 120
    score += cappedBonus;
    
    // เพิ่มโบนัสพิเศษเพื่อบังคับให้กระจายเวรเท่ากัน
    if (maxDifference >= 2 && totalAssigned === minInRole) {
      // ถ้าความแตกต่างระหว่างมากสุดกับน้อยสุดมากกว่า 2 และบุคลากรนี้มีเวรน้อยสุด
      score += 200; // เพิ่มคะแนนมากๆ เพื่อบังคับให้ได้รับการจัดเวร
    }
  } else if (difference < 0) {
    // ถ้ามีเวรมากกว่าค่าเฉลี่ย ให้หักคะแนน
    const penalty = Math.abs(difference) * distributionWeight * 2.0; // เพิ่มบทลงโทษให้มากขึ้น (เพิ่มจาก 1.5 เป็น 2.0)
    score -= Math.min(penalty, 150); // จำกัดการหักคะแนนไม่เกิน 150 (เพิ่มจาก 100)
    
    // เพิ่มบทลงโทษพิเศษเพื่อป้องกันไม่ให้คนที่มีเวรมากอยู่แล้วได้รับเวรเพิ่ม
    if (maxDifference >= 2 && totalAssigned === maxInRole) {
      // ถ้าความแตกต่างระหว่างมากสุดกับน้อยสุดมากกว่า 2 และบุคลากรนี้มีเวรมากสุด
      score -= 300; // หักคะแนนมากๆ เพื่อป้องกันไม่ให้ได้รับการจัดเวรเพิ่ม
    }
  }
  
  // กระจายเวรเช้า (ช) ให้เท่าเทียมกัน
  if (dayType === 'weekend' || dayType === 'holiday') {
    // ตรวจสอบจำนวนเวรเช้าที่ได้รับ
    const morningShifts = shiftHistory.filter(s => s.shift === 'morning').length;
    
    // ถ้าได้รับเวรเช้ามากกว่าค่าเฉลี่ย ให้ลดคะแนนลง
    const avgMorningShifts = 1; // ค่าเฉลี่ยเวรเช้าต่อคน (ปรับตามความเหมาะสม)
    if (morningShifts > avgMorningShifts) {
      score -= (morningShifts - avgMorningShifts) * 30; // เพิ่มจาก 25 เป็น 30
    }
  }
  
  // 🔍 ตรวจสอบการอยู่เวรติดกัน
  const checkConsecutiveDays = () => {
    let consecutiveDays = 0;
    const today = dayjs(date);

    // ตรวจสอบย้อนหลังไปเรื่อยๆ (สูงสุด 10 วัน) จนกว่าจะไม่เจอเวร
    for (let i = 1; i < 10; i++) {
      const prevDate = today.subtract(i, 'day');
      const prevDateStr = prevDate.format('YYYY-MM-DD');
      
      let wasOnShift = false;

      // 1. ตรวจสอบในตารางเวรที่กำลังสร้าง (schedule)
      const prevSchedule = schedule.find(s => s.date === prevDateStr);
      if (prevSchedule && prevSchedule.slots.some(slot => slot.user_id === person.id)) {
        wasOnShift = true;
      }

      // 2. ถ้าไม่เจอ ให้ไปหาในประวัติการทำงาน (shiftHistory)
      if (!wasOnShift) {
        if (shiftHistory.some(h => h.schedule_date === prevDateStr)) {
          wasOnShift = true;
        }
      }

      if (wasOnShift) {
        consecutiveDays++;
      } else {
        // หยุดนับทันทีเมื่อเจอวันว่าง
        break;
      }
    }
    
    return consecutiveDays;
  };
  
  const consecutiveDays = checkConsecutiveDays();
  
  // ถ้าอยู่เวรติดกันเกิน maxConsecutiveDays วัน ให้หักคะแนนมาก
  if (consecutiveDays >= maxConsecutiveDays) {
    // หากเป็นผู้ช่วย ให้หักคะแนนน้อยลง
    const penaltyFactor = person.role === 'PT_ASST' ? 25 : 50;
    score -= (consecutiveDays - maxConsecutiveDays + 1) * penaltyFactor;
  }
  
  // 🎯 ความต้องการเวรวันนี้
  const wantRequest = requests.find(r => 
    (r.user_id === person.id || r.userId === person.id) && 
    r.date === date && 
    (r.request_type === 'want' || r.type === 'preferred')
  );
  if (wantRequest) {
    score += 40; // ให้คะแนนคงที่สำหรับการขอเวร
  }
  
  // ❌ การปฏิเสธเวรวันนี้
  const declineRequest = requests.find(r => 
    (r.user_id === person.id || r.userId === person.id) && 
    r.date === date && 
    (r.request_type === 'decline' || r.type === 'avoided')
  );
  if (declineRequest) {
    score -= 75; // หักคะแนนคงที่สำหรับการปฏิเสธเวร
  }
  
  // 🌅 ความชอบประเภทเวร
  const currentShift = dayType === 'weekday' ? 'afternoon' : 'morning'; // ปรับตามที่แก้ไขในการตั้งค่า
  if (person.shift_preference && person.shift_preference !== 'any') {
    score += person.shift_preference === currentShift ? 20 : -10;
  }
  
  return Math.max(0, score);
}

// 📌 อัลกอริทึมจัดเวรแบบง่าย
export async function generateEnhancedShifts(
  start: string, 
  end: string,
  options: {
    forceBalance?: boolean;
    prioritizeRequests?: boolean;
    allowOverride?: boolean;
    shiftRequests?: ShiftRequest[];
    randomnessFactor?: number;
    userConfig?: Partial<ShiftConfig>;
    personnel?: Personnel[];
  } = {}
): Promise<DaySchedule[]> {
  
  console.log('🚀 เริ่มจัดเวรแบบง่าย...', { start, end, options });
  
  try {
    // โหลดข้อมูลทั้งหมด
    console.log('📥 กำลังโหลดข้อมูล...');
    const personnelList = options.personnel || await getPersonnel();
    const [config, holidays] = await Promise.all([
      getShiftConfig(options.userConfig),
      getHolidays(dayjs(start).year()),
    ]);
    
    // ใช้คำขอเวรที่ส่งมาหรือโหลดจาก DB
    const requests = options.shiftRequests || await getShiftRequests(start, end);
    
    // แยกบุคลากรตามบทบาท
    const ptPersonnel = personnelList.filter(p => p.role === 'PT');
    const ptAssistantPersonnel = personnelList.filter(p => p.role === 'PT_ASST');
    
    console.log(`👨‍⚕️ นักกายภาพบำบัด: ${ptPersonnel.length} คน, 👨‍⚕️ ผู้ช่วย: ${ptAssistantPersonnel.length} คน`);
    
    // ตรวจสอบว่ามีบุคลากรทั้งสองประเภทหรือไม่
    if (ptPersonnel.length === 0) {
      throw new Error('ไม่พบข้อมูลนักกายภาพบำบัด กรุณาเพิ่มบุคลากรประเภทนักกายภาพบำบัด (PT) อย่างน้อย 1 คน');
    }
    
    if (ptAssistantPersonnel.length === 0) {
      throw new Error('ไม่พบข้อมูลผู้ช่วยนักกายภาพบำบัด กรุณาเพิ่มบุคลากรประเภทผู้ช่วย (PT_ASST) อย่างน้อย 1 คน');
    }
    
    // สร้างตารางเวรแบบง่าย
    const result: DaySchedule[] = [];
    let current = dayjs(start);
    const endDate = dayjs(end);
    
    // แสดงรายชื่อบุคลากรทั้งหมดเพื่อตรวจสอบ
    console.log('รายชื่อนักกายภาพบำบัด (PT):');
    ptPersonnel.forEach(p => console.log(`- ${p.name} (${p.position})`));
    console.log('รายชื่อผู้ช่วยนักกายภาพบำบัด (PT_ASST):');
    ptAssistantPersonnel.forEach(p => console.log(`- ${p.name} (${p.position})`));
    
    // สร้างตัวแปรเก็บจำนวนเวรของแต่ละคน
    const shiftCounts: Record<string, number> = {};
    personnelList.forEach(p => {
      shiftCounts[p.id] = 0;
    });
    
    // เตรียมข้อมูลประวัติการทำเวร
    const shiftHistory = await getRecentShiftHistory(
      personnelList.map(p => p.id),
      30 // ดูประวัติย้อนหลัง 30 วัน
    );
    
    // นับจำนวนเวรในเดือนก่อนของแต่ละคน
    const previousMonthCounts: Record<string, number> = {};
    
    // วันแรกของเดือนก่อน
    const previousMonthStart = dayjs(start).subtract(1, 'month').startOf('month').format('YYYY-MM-DD');
    // วันสุดท้ายของเดือนก่อน
    const previousMonthEnd = dayjs(start).subtract(1, 'day').format('YYYY-MM-DD');
    
    console.log(`📅 กำลังตรวจสอบประวัติเวรเดือนก่อน: ${previousMonthStart} ถึง ${previousMonthEnd}`);
    
    // นับจำนวนเวรในเดือนก่อนของแต่ละคนจากประวัติ
    personnelList.forEach(person => {
      const history = shiftHistory[person.id] || [];
      const shiftsInPreviousMonth = history.filter(shift => 
        shift.schedule_date >= previousMonthStart && 
        shift.schedule_date <= previousMonthEnd
      ).length;
      
      previousMonthCounts[person.id] = shiftsInPreviousMonth;
    });
    
    // จัดอันดับ PT ตามจำนวนเวรในเดือนก่อน (น้อยไปมาก)
    const rankedPT = [...ptPersonnel].sort((a, b) => 
      (previousMonthCounts[a.id] || 0) - (previousMonthCounts[b.id] || 0)
    );
    
    // จัดอันดับ PT_ASST ตามจำนวนเวรในเดือนก่อน (น้อยไปมาก)
    const rankedPTAsst = [...ptAssistantPersonnel].sort((a, b) => 
      (previousMonthCounts[a.id] || 0) - (previousMonthCounts[b.id] || 0)
    );
    
    console.log('📊 ลำดับ PT ตามจำนวนเวรในเดือนก่อน (น้อยไปมาก):');
    rankedPT.forEach(p => console.log(`- ${p.name}: ${previousMonthCounts[p.id] || 0} เวร`));
    
    console.log('📊 ลำดับ PT_ASST ตามจำนวนเวรในเดือนก่อน (น้อยไปมาก):');
    rankedPTAsst.forEach(p => console.log(`- ${p.name}: ${previousMonthCounts[p.id] || 0} เวร`));
    
    // คำนวณจำนวนวันทั้งหมดที่ต้องจัด (ไม่รวมวันอาทิตย์)
    let totalDays = 0;
    let tempCurrent = dayjs(start);
    while (tempCurrent.isBefore(endDate) || tempCurrent.isSame(endDate)) {
      const dateStr = tempCurrent.format('YYYY-MM-DD');
      const dayType = getDayType(dateStr, holidays);
      if (dayType !== 'sunday') {
        totalDays++;
      }
      tempCurrent = tempCurrent.add(1, 'day');
    }
    
    // คำนวณจำนวนเวรเฉลี่ยต่อคนที่ควรได้รับ
    const avgPTShiftsPerPerson = Math.ceil(totalDays * config.formats.weekday[0].PT / ptPersonnel.length);
    const avgPTAsstShiftsPerPerson = Math.ceil(totalDays * config.formats.weekday[0].PT_ASST / ptAssistantPersonnel.length);
    
    console.log(`📊 จำนวนวันทั้งหมด: ${totalDays} วัน`);
    console.log(`📊 จำนวนเวรเฉลี่ยต่อ PT: ${avgPTShiftsPerPerson} เวร`);
    console.log(`📊 จำนวนเวรเฉลี่ยต่อ PT_ASST: ${avgPTAsstShiftsPerPerson} เวร`);
    
    // สร้างคิวสำหรับการหมุนเวียน PT และ PT_ASST
    let ptQueue = [...rankedPT];
    let ptAsstQueue = [...rankedPTAsst];
    
    // ตรวจสอบว่าเป็นเดือนเริ่มต้นหรือไม่ (กรกฎาคม 2025)
    const isInitialMonth = dayjs(start).format('YYYY-MM') === '2025-07';
    // --- เพิ่ม logic เวรเช้า (ช) ---
    // 1. คำนวณวันหยุด (weekend/holiday) ทั้งหมดในเดือนนี้
    let morningDays: {date: string, type: 'weekend'|'holiday'}[] = [];
    let tempDay = dayjs(start);
    while (tempDay.isBefore(endDate) || tempDay.isSame(endDate)) {
      const dateStr = tempDay.format('YYYY-MM-DD');
      const dayType = getDayType(dateStr, holidays);
      if (dayType === 'weekend' || dayType === 'holiday') {
        morningDays.push({date: dateStr, type: dayType});
      }
      tempDay = tempDay.add(1, 'day');
    }
    // 2. นับจำนวนเวรเช้าในเดือนก่อนของแต่ละคน (ถ้าไม่ใช่เดือนเริ่มต้น)
    const prevMorningCounts: Record<string, number> = {};
    if (!isInitialMonth) {
      personnelList.forEach(person => {
        const history = shiftHistory[person.id] || [];
        const morningShifts = history.filter(shift =>
          shift.schedule_date >= previousMonthStart &&
          shift.schedule_date <= previousMonthEnd &&
          shift.shift === 'morning'
        ).length;
        prevMorningCounts[person.id] = morningShifts;
      });
    } else {
      personnelList.forEach(person => { prevMorningCounts[person.id] = 0; });
    }
    // 3. สร้างคิวหมุนเวียนเวรเช้า (PT, PT_ASST) ตามจำนวนเวรเช้าเดือนก่อน (น้อยไปมาก) หรือใช้ลำดับรายชื่อถ้าเป็นเดือนเริ่มต้น
    let morningPTQueue = isInitialMonth ? [...ptPersonnel] : [...ptPersonnel].sort((a, b) => (prevMorningCounts[a.id]||0)-(prevMorningCounts[b.id]||0));
    let morningPTAsstQueue = isInitialMonth ? [...ptAssistantPersonnel] : [...ptAssistantPersonnel].sort((a, b) => (prevMorningCounts[a.id]||0)-(prevMorningCounts[b.id]||0));
    // 4. เตรียมตัวแปรนับเวรเช้าเดือนนี้
    const thisMonthMorningCounts: Record<string, number> = {};
    personnelList.forEach(p=>{thisMonthMorningCounts[p.id]=0;});
    // 5. วนลูปจัดเวรเช้าในวันหยุด/นักขัตฤกษ์
    // --- แก้ไขให้แน่ใจว่าทุก PT_ASST ได้เวรเช้าอย่างน้อย 1 ครั้ง ---
    const asstGotMorning: Record<string, boolean> = {};
    ptAssistantPersonnel.forEach(p => { asstGotMorning[p.id] = false; });
    let asstQueueIdx = 0;
    for(const {date, type} of morningDays) {
      // PT
      let pt = morningPTQueue.shift();
      while(pt && !pt.active) pt = morningPTQueue.shift();
      if(pt) {
        thisMonthMorningCounts[pt.id]++;
        morningPTQueue.push(pt);
      }
      // PT_ASST
      let asst = morningPTAsstQueue.shift();
      while(asst && !asst.active) asst = morningPTAsstQueue.shift();
      if(asst) {
        thisMonthMorningCounts[asst.id]++;
        morningPTAsstQueue.push(asst);
        asstGotMorning[asst.id] = true;
      }
    }
    // ถ้ามี PT_ASST ที่ยังไม่ได้เวรเช้าเลย ให้สุ่มแทนในวันเช้าที่เหลือ
    const asstNoMorning = Object.entries(asstGotMorning).filter(([id, got]) => !got).map(([id])=>id);
    if (asstNoMorning.length > 0 && morningDays.length > 0) {
      let idx = 0;
      for(const id of asstNoMorning) {
        // หาเช้าวันที่ยังไม่มี PT_ASST ซ้ำ
        for(const {date} of morningDays) {
          if (Object.values(morningPTAsstMap).includes(id)) continue; // ข้ามถ้าได้ไปแล้ว
          morningPTAsstMap[date] = id;
          thisMonthMorningCounts[id]++;
          idx++;
          if(idx >= asstNoMorning.length) break;
        }
      }
    }
    // 6. สร้าง map สำหรับ lookup ว่าแต่ละวันควรเป็นใคร (PT, PT_ASST)
    const morningPTMap: Record<string, string> = {};
    const morningPTAsstMap: Record<string, string> = {};
    tempDay = dayjs(start);
    let ptIdx=0, asstIdx=0;
    for(const {date} of morningDays) {
      // PT
      while(ptIdx<ptPersonnel.length && !ptPersonnel[ptIdx].active) ptIdx++;
      morningPTMap[date] = ptPersonnel[ptIdx%ptPersonnel.length].id;
      ptIdx++;
      // PT_ASST
      while(asstIdx<ptAssistantPersonnel.length && !ptAssistantPersonnel[asstIdx].active) asstIdx++;
      morningPTAsstMap[date] = ptAssistantPersonnel[asstIdx%ptAssistantPersonnel.length].id;
      asstIdx++;
    }
    
    while (current.isBefore(endDate) || current.isSame(endDate)) {
      const dateStr = current.format('YYYY-MM-DD');
      const dayType = getDayType(dateStr, holidays);
      
      // ข้ามวันอาทิตย์
      if (dayType === 'sunday') {
        current = current.add(1, 'day');
        continue;
      }
      
      // กำหนดช่วงเวลาเวรตามประเภทวัน
      const shiftTime = config[`${dayType}_shift`];
      
      // กำหนดจำนวนบุคลากรที่ต้องการตามประเภทวัน
      let requiredPT = 0;
      let requiredPTAsst = 0;
      
      if (dayType === 'weekday') {
        requiredPT = config.formats.weekday[0].PT;
        requiredPTAsst = config.formats.weekday[0].PT_ASST;
      } else if (dayType === 'weekend') {
        requiredPT = config.formats.weekend[0].PT;
        requiredPTAsst = config.formats.weekend[0].PT_ASST;
      } else if (dayType === 'holiday') {
        requiredPT = config.formats.holiday[0].PT;
        requiredPTAsst = config.formats.holiday[0].PT_ASST;
      }
      
      // สร้างตารางเวรสำหรับวันนี้
      const daySchedule: DaySchedule = {
        date: dateStr,
        shift: shiftTime,
        day_type: dayType,
        slots: [],
        is_complete: false,
        total_required: requiredPT + requiredPTAsst,
        warnings: []
      };
      
      // หาคำขอเวรสำหรับวันนี้
      const dayRequests = requests.filter(r => r.date === dateStr);
      
      // แยกคำขอเวรตามประเภท
      const wantRequests = dayRequests.filter(r => r.request_type === 'want' || r.type === 'preferred');
      const declineRequests = dayRequests.filter(r => 
        r.request_type === 'decline' || 
        r.request_type === 'leave' || 
        r.type === 'avoided' || 
        r.type === 'leave'
      );
      
      // สร้างรายชื่อบุคลากรที่พร้อมทำงานวันนี้ (ไม่ได้ขอหยุด)
      const availablePT = ptPersonnel.filter(p => 
        !declineRequests.some(r => (r.user_id === p.id) || (r.userId === p.id))
      );
      
      const availablePTAsst = ptAssistantPersonnel.filter(p => 
        !declineRequests.some(r => (r.user_id === p.id) || (r.userId === p.id))
      );
      
      // จัดเวรให้คนที่ขอเวรก่อน
      // 1. จัดเวรให้ PT ที่ขอเวร
      const ptWantRequests = wantRequests.filter(r => 
        ptPersonnel.some(p => (p.id === r.user_id) || (p.id === r.userId))
      );
      
      const assignedPTIds: string[] = [];
      
      for (let i = 0; i < Math.min(requiredPT, ptWantRequests.length); i++) {
        const request = ptWantRequests[i];
        const person = ptPersonnel.find(p => (p.id === request.user_id) || (p.id === request.userId));
        
        if (person) {
          daySchedule.slots.push({
            user_id: person.id,
            role: 'PT',
            assigned_by: 'request',
            confidence_score: 100
          });
          
          // เพิ่มจำนวนเวรของบุคลากรนี้
          shiftCounts[person.id] = (shiftCounts[person.id] || 0) + 1;
          assignedPTIds.push(person.id);
          
          // ลบออกจากคิว และนำไปต่อท้าย
          ptQueue = ptQueue.filter(p => p.id !== person.id);
          ptQueue.push(person);
        }
      }
      
      // 2. จัดเวรให้ PT_ASST ที่ขอเวร
      const ptAsstWantRequests = wantRequests.filter(r => 
        ptAssistantPersonnel.some(p => (p.id === r.user_id) || (p.id === r.userId))
      );
      
      const assignedPTAsstIds: string[] = [];
      
      for (let i = 0; i < Math.min(requiredPTAsst, ptAsstWantRequests.length); i++) {
        const request = ptAsstWantRequests[i];
        const person = ptAssistantPersonnel.find(p => (p.id === request.user_id) || (p.id === request.userId));
        
        if (person) {
          daySchedule.slots.push({
            user_id: person.id,
            role: 'PT_ASST',
            assigned_by: 'request',
            confidence_score: 100
          });
          
          // เพิ่มจำนวนเวรของบุคลากรนี้
          shiftCounts[person.id] = (shiftCounts[person.id] || 0) + 1;
          assignedPTAsstIds.push(person.id);
          
          // ลบออกจากคิว และนำไปต่อท้าย
          ptAsstQueue = ptAsstQueue.filter(p => p.id !== person.id);
          ptAsstQueue.push(person);
        }
      }
      
      // 3. จัดเวรให้ PT ที่เหลือโดยใช้คิวหมุนเวียน
      const ptNeeded = requiredPT - assignedPTIds.length;
      
      // กรองคิวเฉพาะคนที่พร้อมทำงานวันนี้และยังไม่ได้รับการจัดเวร
      const availablePTQueue = ptQueue.filter(p => 
        availablePT.some(ap => ap.id === p.id) && 
        !assignedPTIds.includes(p.id)
      );
      
      for (let i = 0; i < Math.min(ptNeeded, availablePTQueue.length); i++) {
        const person = availablePTQueue[i];
        
        daySchedule.slots.push({
          user_id: person.id,
          role: 'PT',
          assigned_by: 'auto',
          confidence_score: 90
        });
        
        // เพิ่มจำนวนเวรของบุคลากรนี้
        shiftCounts[person.id] = (shiftCounts[person.id] || 0) + 1;
        
        // ลบออกจากคิว และนำไปต่อท้าย
        ptQueue = ptQueue.filter(p => p.id !== person.id);
        ptQueue.push(person);
      }
      
      // 4. จัดเวรให้ PT_ASST ที่เหลือโดยใช้คิวหมุนเวียน
      const ptAsstNeeded = requiredPTAsst - assignedPTAsstIds.length;
      
      // กรองคิวเฉพาะคนที่พร้อมทำงานวันนี้และยังไม่ได้รับการจัดเวร
      const availablePTAsstQueue = ptAsstQueue.filter(p => 
        availablePTAsst.some(ap => ap.id === p.id) && 
        !assignedPTAsstIds.includes(p.id)
      );
      
      for (let i = 0; i < Math.min(ptAsstNeeded, availablePTAsstQueue.length); i++) {
        const person = availablePTAsstQueue[i];
        
          daySchedule.slots.push({
            user_id: person.id,
          role: 'PT_ASST',
          assigned_by: 'auto',
          confidence_score: 90
        });
        
        // เพิ่มจำนวนเวรของบุคลากรนี้
        shiftCounts[person.id] = (shiftCounts[person.id] || 0) + 1;
        
        // ลบออกจากคิว และนำไปต่อท้าย
        ptAsstQueue = ptAsstQueue.filter(p => p.id !== person.id);
        ptAsstQueue.push(person);
      }
      
      // ตรวจสอบว่าจัดเวรได้ครบหรือไม่
      daySchedule.is_complete = daySchedule.slots.length === daySchedule.total_required;
      
      // เพิ่มคำเตือนถ้าจัดเวรไม่ครบ
      if (!daySchedule.is_complete) {
        const ptCount = daySchedule.slots.filter(s => s.role === 'PT').length;
        const ptAsstCount = daySchedule.slots.filter(s => s.role === 'PT_ASST').length;
        
        if (ptCount < requiredPT) {
          daySchedule.warnings?.push(`ขาดนักกายภาพบำบัด ${requiredPT - ptCount} คน`);
        }
        
        if (ptAsstCount < requiredPTAsst) {
          daySchedule.warnings?.push(`ขาดผู้ช่วยนักกายภาพบำบัด ${requiredPTAsst - ptAsstCount} คน`);
        }
      }
      
      // เพิ่มตารางเวรวันนี้เข้าไปในผลลัพธ์
      result.push(daySchedule);
      
      // เลื่อนไปวันถัดไป
      current = current.add(1, 'day');
      
      // แสดงความคืบหน้าทุก 7 วัน
      if (result.length % 7 === 0) {
        console.log(`🔄 จัดตารางเวรไปแล้ว ${result.length} วัน`);
      }
    }
    
    // แสดงสรุปจำนวนเวรของแต่ละคน
    console.log('📊 สรุปจำนวนเวรของแต่ละคน:');
    
    // แยกตามบทบาท
    console.log('นักกายภาพบำบัด (PT):');
    ptPersonnel.forEach(person => {
      console.log(`- ${person.name}: ${shiftCounts[person.id] || 0} เวร (เดือนก่อน: ${previousMonthCounts[person.id] || 0} เวร)`);
    });
    
    console.log('ผู้ช่วยนักกายภาพบำบัด (PT_ASST):');
    ptAssistantPersonnel.forEach(person => {
      console.log(`- ${person.name}: ${shiftCounts[person.id] || 0} เวร (เดือนก่อน: ${previousMonthCounts[person.id] || 0} เวร)`);
    });
    
    // สรุปผลการจัดเวร
    const completeCount = result.filter(d => d.is_complete).length;
    console.log(`✅ จัดเวรเสร็จสิ้น: ${completeCount}/${result.length} วันที่จัดครบ`);
    
    return result;
    
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดในการจัดเวร:', error);
    throw new Error(`ไม่สามารถสร้างตารางเวรได้: ${error.message}`);
  }
}

// 📌 บันทึกผลการจัดเวรลงฐานข้อมูล
export async function saveShiftSchedule(schedule: DaySchedule[]): Promise<void> {
  // ถ้าอยู่ในโหมดจำลอง ให้แค่จำลองการบันทึกสำเร็จ
  if (USE_SIMULATION_MODE) {
    console.log('โหมดจำลอง: บันทึกตารางเวรสำเร็จ', schedule.length, 'รายการ');
    return Promise.resolve();
  }

  if (!schedule || schedule.length === 0) {
    console.log('ไม่มีข้อมูลตารางเวรให้บันทึก');
    return;
  }

  try {
    // 1. ลบข้อมูลเก่าของเดือนที่กำลังจะบันทึก เพื่อเริ่มใหม่ทั้งหมด
    const startDate = schedule[0].date;
    const endDate = schedule[schedule.length - 1].date;

    const { error: deleteError } = await supabase
      .from('shift_schedules')
      .delete()
      .gte('date', startDate)
      .lte('date', endDate);

    if (deleteError) {
      console.error('เกิดข้อผิดพลาดในการลบข้อมูลเวรเก่า:', deleteError);
      throw deleteError;
    }

    // 2. บันทึก/อัปเดต ตารางเวรหลัก (shift_schedules) และดึง id กลับมา
    const scheduleData = schedule.map(day => ({
      date: day.date,
      shift: day.shift,
      day_type: day.day_type,
      is_complete: day.is_complete,
      total_required: day.total_required
    }));

    const { data: savedSchedules, error: scheduleError } = await supabase
      .from('shift_schedules')
      .insert(scheduleData) // เปลี่ยนจาก upsert เป็น insert
      .select('id, date'); // ขอ id และ date กลับมา
      
    if (scheduleError) throw scheduleError;

    // 3. สร้าง Map เพื่อจับคู่ date กับ schedule_id
    const dateToScheduleIdMap = new Map<string, string>();
    savedSchedules.forEach(s => {
      dateToScheduleIdMap.set(s.date, s.id);
    });

    // 4. เตรียมข้อมูลสำหรับ shift_slots โดยใช้ schedule_id ที่ถูกต้อง
    const slotData = schedule.flatMap(day => {
      const scheduleId = dateToScheduleIdMap.get(day.date);
      if (!scheduleId) return []; // ข้ามไปถ้าไม่พบ scheduleId
      
      return day.slots.map(slot => ({
        schedule_id: scheduleId,
        user_id: slot.user_id,
        role: slot.role,
        assigned_by: slot.assigned_by,
        confidence_score: slot.confidence_score
      }));
    });
    
    // 5. บันทึกรายละเอียดเวรใหม่ทั้งหมดลงใน shift_slots (ไม่ต้องลบก่อนแล้วเพราะทำผ่าน cascade delete)
    if (slotData.length > 0) {
    const { error: slotsError } = await supabase
      .from('shift_slots')
        .insert(slotData);
      
    if (slotsError) throw slotsError;
    }
    
    console.log(`💾 บันทึกการจัดเวร ${schedule.length} วัน / ${slotData.length} รายการสำเร็จ`);
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการบันทึกตารางเวร:', error);
    throw error;
  }
}

// 📌 ฟังก์ชันตรวจสอบความสมดุลของการจัดเวร
export function analyzeShiftBalance(schedule: DaySchedule[], personnel: Personnel[]): any {
  const analysis: any = {
    fairness_score: 0,
    distribution: {},
    warnings: [],
    recommendations: []
  };
  
  // นับจำนวนเวรของแต่ละคน
  const counts: Record<string, number> = {};
  for (const person of personnel) {
    counts[person.id] = 0;
  }
  
  for (const day of schedule) {
    for (const slot of day.slots) {
      counts[slot.user_id]++;
    }
  }
  
  const shiftCounts = Object.values(counts);
  const avgShifts = shiftCounts.reduce((a, b) => a + b, 0) / shiftCounts.length;
  const maxShifts = Math.max(...shiftCounts);
  const minShifts = Math.min(...shiftCounts);
  
  // คำนวณคะแนนความยุติธรรม (100 = สมดุลสมบูรณ์)
  analysis.fairness_score = Math.max(0, 100 - ((maxShifts - minShifts) / avgShifts * 100));
  
  // รายละเอียดการกระจายเวร
  analysis.distribution = Object.entries(counts).map(([id, count]) => ({
    person: personnel.find(p => p.id === id)?.name || id,
    shifts: count,
    deviation: count - avgShifts
  }));
  
  // คำแนะนำ
  if (analysis.fairness_score < 80) {
    analysis.recommendations.push('ควรปรับสมดุลการจัดเวรให้เท่าเทียมกันมากขึ้น');
  }
  
  return analysis;
}

// 📌 Export ฟังก์ชันสำหรับใช้งาน
export {
  getShiftConfig,
  getPersonnel,
  getShiftRequests,
  getDayType
};

// ฟังก์ชันสำหรับแปลงค่าจากฟอร์มการตั้งค่าเป็น ShiftConfig
export function createConfigFromFormValues(formValues: {
  weekday_pt_count?: number;
  weekday_pt_asst_count?: number;
  weekday_shift?: 'เช้า' | 'บ่าย' | 'morning' | 'afternoon';
  weekend_pt_count?: number;
  weekend_pt_asst_count?: number;
  weekend_shift?: 'เช้า' | 'บ่าย' | 'morning' | 'afternoon';
  holiday_pt_count?: number;
  holiday_pt_asst_count?: number;
  holiday_shift?: 'เช้า' | 'บ่าย' | 'morning' | 'afternoon';
}): Partial<ShiftConfig> {
  // แปลงค่าภาษาไทยเป็นภาษาอังกฤษ
  const translateShift = (shift?: string): 'morning' | 'afternoon' => {
    if (!shift) return 'morning';
    if (shift === 'เช้า') return 'morning';
    if (shift === 'บ่าย') return 'afternoon';
    return shift as 'morning' | 'afternoon';
  };

  const config: Partial<ShiftConfig> = {
    formats: {
      weekday: [{
        PT: formValues.weekday_pt_count || 2,
        PT_ASST: formValues.weekday_pt_asst_count || 1
      }],
      weekend: [{
        PT: formValues.weekend_pt_count || 1,
        PT_ASST: formValues.weekend_pt_asst_count || 1
      }],
      holiday: [{
        PT: formValues.holiday_pt_count || 1,
        PT_ASST: formValues.holiday_pt_asst_count || 1
      }]
    },
    weekday_shift: translateShift(formValues.weekday_shift),
    weekend_shift: translateShift(formValues.weekend_shift),
    holiday_shift: translateShift(formValues.holiday_shift)
  };

  console.log('🔄 สร้างค่าตั้งค่าจากฟอร์ม:', config);
  return config;
}

export async function checkTableAccess() {
  // ถ้าอยู่ในโหมดจำลอง ให้ข้ามการตรวจสอบการเข้าถึงตาราง
  if (USE_SIMULATION_MODE) {
    return true;
  }

  const tables = ['shift_config', 'holidays', 'personnel', 'shift_requests'];
  const results: { table: string; accessible: boolean; error?: string }[] = [];

  for (const table of tables) {
    // ใช้ select('*') แทน select('id') เพื่อให้ทำงานได้กับทุกโครงสร้างตาราง
    const { error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      results.push({ table, accessible: false, error: error.message });
    } else {
      results.push({ table, accessible: true });
    }
  }

  const inaccessibleTables = results.filter(r => !r.accessible);

  if (inaccessibleTables.length > 0) {
    const errorDetails = inaccessibleTables.map(t => `${t.table} (เหตุผล: ${t.error})`).join(', ');
    throw new Error(`ไม่สามารถเข้าถึงตารางที่จำเป็น: ${errorDetails}. กรุณาตรวจสอบ RLS policies ใน Supabase.`);
  }

  return true;
} 