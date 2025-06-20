import React, { useState, useEffect, useMemo } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { th } from 'date-fns/locale';
import { 
  generateEnhancedShifts, 
  saveShiftSchedule, 
  analyzeShiftBalance, 
  getPersonnel,
  checkTableAccess,
  DaySchedule,
  Personnel,
  ShiftRequest,
  createConfigFromFormValues
} from '../utils/enhancedShiftScheduler';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { 
  AlertCircle, 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  Save, 
  Settings, 
  UserCheck,
  Users,
  CalendarPlus,
  Edit,
  Trash2,
  Plus,
  RefreshCw,
  Database as DatabaseIcon
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import ShiftSchedulePreview from '@/components/ShiftSchedulePreview';
import { supabase } from '@/integrations/supabase/client';
import { ShiftSchedule, ShiftSlot } from '@/integrations/supabase/types';

// Define the interface for ShiftRequest from our dialog
interface UIShiftRequest {
  id: string;
  userId: string;
  date: Date;
  type: "preferred" | "avoided" | "leave";
  shift?: "morning" | "afternoon";
}

const ShiftScheduler: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [schedule, setSchedule] = useState<DaySchedule[]>([]);
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<Date[] | Date | undefined>([new Date()]);
  const [balanceAnalysis, setBalanceAnalysis] = useState<any>(null);
  const [openSettings, setOpenSettings] = useState<boolean>(false);
  const [openStaffDialog, setOpenStaffDialog] = useState<boolean>(false);
  const [openRequestsDialog, setOpenRequestsDialog] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('preview');
  const [shiftRequests, setShiftRequests] = useState<UIShiftRequest[]>([]);
  const [options, setOptions] = useState({
    forceBalance: true,
    prioritizeRequests: true,
    allowOverride: false,
    randomnessFactor: 0, // เพิ่มปัจจัยความสุ่ม (0-20)
  });
  
  // เพิ่ม state สำหรับการตั้งค่ารูปแบบการจัดเวร
  const [shiftConfig, setShiftConfig] = useState({
    weekday_pt_count: 2,
    weekday_pt_asst_count: 1, // เปลี่ยนจาก 2 เป็น 1
    weekday_shift: 'บ่าย' as 'เช้า' | 'บ่าย',
    weekend_pt_count: 1,
    weekend_pt_asst_count: 1,
    weekend_shift: 'เช้า' as 'เช้า' | 'บ่าย',
    holiday_pt_count: 1,
    holiday_pt_asst_count: 1,
    holiday_shift: 'เช้า' as 'เช้า' | 'บ่าย',
  });
  
  // เพิ่ม state สำหรับเก็บข้อมูลการกรอกฟอร์มคำขอเวร
  const [selectedStaff, setSelectedStaff] = useState<string>("");
  const [requestType, setRequestType] = useState<"preferred" | "avoided" | "leave">("preferred");
  
  // State for the staff management form (add/edit)
  const [staffForm, setStaffForm] = useState({
    id: '',
    name: '',
    position: ''
  });

  // เพิ่ม state สำหรับการกรองและแบ่งหน้า
  const [filterPerson, setFilterPerson] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState<number>(0);
  const itemsPerPage = 10; // จำนวนรายการต่อหน้า
  
  // กรองคำขอเวรตามตัวกรอง
  const filteredRequests = useMemo(() => {
    return shiftRequests.filter(request => {
      const matchPerson = filterPerson === "all" || request.userId === filterPerson;
      const matchType = filterType === "all" || request.type === filterType;
      return matchPerson && matchType;
    });
  }, [shiftRequests, filterPerson, filterType]);
  
  // แบ่งหน้า
  const paginatedRequests = useMemo(() => {
    const start = currentPage * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredRequests.slice(start, end);
  }, [filteredRequests, currentPage, itemsPerPage]);
  
  const { toast } = useToast();

  // โหลดข้อมูลบุคลากร
  useEffect(() => {
    const loadPersonnel = async () => {
      try {
        const data = await getPersonnel();
        setPersonnel(data);
      } catch (error) {
        console.error('Error loading personnel:', error);
        toast({
          title: 'เกิดข้อผิดพลาด',
          description: 'ไม่สามารถโหลดข้อมูลบุคลากรได้',
          variant: 'destructive',
        });
      }
    };
    
    loadPersonnel();
  }, []);

  // โหลดตารางเวรจาก Supabase
  // @ts-nocheck
  const loadSavedSchedule = async () => {
    setIsLoading(true);
    try {
      const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
      const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd');
      const { data: schedules, error: scheduleError } = await supabase
        .from('shift_schedules')
        .select('*')
        .gte('date', start)
        .lte('date', end);
      if (scheduleError) throw scheduleError;
      if (!schedules || schedules.length === 0) {
        setSchedule([]);
        setIsLoading(false);
        return;
      }
      const scheduleIds = (schedules as ShiftSchedule[]).map((s) => s.id);
      const { data: slots, error: slotError } = await supabase
        .from('shift_slots')
        .select('*')
        .in('schedule_id', scheduleIds);
      if (slotError) throw slotError;
      // สร้าง DaySchedule[]
      const scheduleMap: Record<string, any> = {};
      (schedules as ShiftSchedule[]).forEach((s) => {
        scheduleMap[s.date] = {
          date: s.date,
          shift: s.shift,
          day_type: s.day_type,
          is_complete: s.is_complete,
          total_required: s.total_required,
          slots: [],
          warnings: []
        };
      });
      (slots as ShiftSlot[]).forEach((slot) => {
        const schedule = (schedules as ShiftSchedule[]).find((s) => s.id === slot.schedule_id);
        if (schedule && scheduleMap[schedule.date]) {
          scheduleMap[schedule.date].slots.push({
            user_id: slot.user_id,
            role: slot.role,
            assigned_by: slot.assigned_by,
            confidence_score: slot.confidence_score
          });
        }
      });
      setSchedule(Object.values(scheduleMap));
    } catch (error) {
      setSchedule([]);
    } finally {
      setIsLoading(false);
    }
  };

  // โหลดตารางเวรเมื่อเปิดหน้า/เปลี่ยนเดือน
  useEffect(() => {
    loadSavedSchedule();
  }, [currentMonth]);

  // สร้างตารางเวรเมื่อเปลี่ยนเดือน
  const generateSchedule = async () => {
    setIsLoading(true);
    try {
      const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
      const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd');
      
      // แปลงคำขอเวรจาก UI เป็นรูปแบบที่ใช้ใน enhancedShiftScheduler
      const convertedRequests: ShiftRequest[] = shiftRequests.map(req => ({
        id: req.id,
        user_id: req.userId,
        date: format(req.date, 'yyyy-MM-dd'),
        request_type: req.type === 'preferred' 
          ? 'want' 
          : req.type === 'avoided' 
            ? 'decline' 
            : 'leave',
        reason: '', // เพิ่ม reason ว่างๆ
        created_at: new Date().toISOString()
      }));
      
      // สร้าง config จาก shiftConfig
      const userConfig = createConfigFromFormValues(shiftConfig);
      
      const result = await generateEnhancedShifts(start, end, {
        ...options,
        shiftRequests: convertedRequests,
        userConfig, // ส่ง userConfig ไปด้วย
        personnel: personnel, // ส่งรายชื่อบุคลากรล่าสุดไปด้วย
        forceBalance: true // บังคับให้สมดุล
      });
      setSchedule(result);
      
      // วิเคราะห์ความสมดุล
      if (personnel.length > 0) {
        const analysis = analyzeShiftBalance(result, personnel);
        setBalanceAnalysis(analysis);
      }
      
      toast({
        title: 'สร้างตารางเวรสำเร็จ',
        description: `สร้างตารางเวรสำหรับเดือน ${format(currentMonth, 'MMMM yyyy', { locale: th })} เรียบร้อยแล้ว`,
      });
    } catch (error) {
      console.error('Error generating schedule:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: error.message || 'ไม่สามารถสร้างตารางเวรได้',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // บันทึกตารางเวร
  const handleSaveSchedule = async () => {
    if (!schedule.length) {
      toast({
        title: 'ไม่สามารถบันทึกได้',
        description: 'ไม่พบข้อมูลตารางเวร กรุณาสร้างตารางเวรก่อน',
        variant: 'destructive',
      });
      return;
    }
    setIsLoading(true);
    try {
      await saveShiftSchedule(schedule);
      await loadSavedSchedule(); // โหลดข้อมูลใหม่หลังบันทึก
      toast({
        title: 'บันทึกสำเร็จ',
        description: 'บันทึกตารางเวรเรียบร้อยแล้ว',
      });
    } catch (error) {
      console.error('Error saving schedule:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถบันทึกตารางเวรได้',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // เปลี่ยนเดือน
  const handleMonthChange = (direction: number) => {
    if (direction > 0) {
      setCurrentMonth(addMonths(currentMonth, 1));
    } else {
      setCurrentMonth(subMonths(currentMonth, 1));
    }
  };

  // ส่งออกตารางเวรเป็น CSV
  const exportToCSV = () => {
    if (!schedule.length) {
      toast({
        title: 'ไม่สามารถส่งออกได้',
        description: 'ไม่พบข้อมูลตารางเวร กรุณาสร้างตารางเวรก่อน',
        variant: 'destructive',
      });
      return;
    }
    
    // สร้างข้อมูล CSV
    const headers = ['วันที่', 'ประเภทวัน', 'เวร', 'ผู้ปฏิบัติงาน', 'ตำแหน่ง'];
    
    const csvData = schedule.flatMap(day => {
      if (!day.slots.length) return [[day.date, day.day_type, day.shift, 'ไม่มีผู้ปฏิบัติงาน', '']];
      
      return day.slots.map(slot => {
        const staffName = personnel.find(p => p.id === slot.user_id)?.name || slot.user_id;
        return [
          day.date,
          day.day_type === 'weekday' ? 'วันทำงาน' : day.day_type === 'weekend' ? 'วันหยุดสุดสัปดาห์' : 'วันหยุดนักขัตฤกษ์',
          day.shift === 'morning' ? 'เช้า' : 'บ่าย',
          staffName,
          slot.role
        ];
      });
    });
    
    // รวมข้อมูลและสร้างไฟล์ CSV - แก้ไขเพื่อรองรับภาษาไทย
    // เพิ่ม BOM (Byte Order Mark) เพื่อให้ Excel รู้ว่าเป็น UTF-8
    const BOM = '\uFEFF';
    // ใช้ double quotes ครอบข้อความที่มีเครื่องหมายคอมม่าและข้อความภาษาไทย
    const escapeCsvValue = (val: any) => {
      if (val === null || val === undefined) return '';
      const strVal = String(val);
      if (strVal.includes(',') || /[ก-๙]/.test(strVal)) {
        return `"${strVal.replace(/"/g, '""')}"`;
      }
      return strVal;
    };
    
    const csvContent = BOM + [headers, ...csvData]
      .map(row => row.map(escapeCsvValue).join(','))
      .join('\n');
      
          const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `ตารางเวร_${format(currentMonth, 'yyyy-MM')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };
  
  // ส่งออกตารางเวรเป็น Excel
  const exportToExcel = () => {
    if (!schedule.length) {
      toast({
        title: 'ไม่สามารถส่งออกได้',
        description: 'ไม่พบข้อมูลตารางเวร กรุณาสร้างตารางเวรก่อน',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      // ต้องติดตั้ง library เพิ่มเติม เช่น exceljs หรือ xlsx
      // เราจะใช้วิธีชั่วคราวโดยส่งออกเป็น HTML Table ที่สามารถ copy ไปวางใน Excel ได้
      
      // สร้าง table แบบ hidden
      const table = document.createElement('table');
      table.style.display = 'none';
      
      // สร้าง header row
      const headerRow = document.createElement('tr');
      ['วันที่', 'ประเภทวัน', 'เวร', 'ผู้ปฏิบัติงาน', 'ตำแหน่ง'].forEach(text => {
        const th = document.createElement('th');
        th.textContent = text;
        headerRow.appendChild(th);
      });
      table.appendChild(headerRow);
      
      // สร้าง data rows
      schedule.forEach(day => {
        if (!day.slots.length) {
          const tr = document.createElement('tr');
          const dateCell = document.createElement('td');
          dateCell.textContent = day.date;
          
          const typeCell = document.createElement('td');
          typeCell.textContent = day.day_type === 'weekday' ? 'วันทำงาน' : 
                               day.day_type === 'weekend' ? 'วันหยุดสุดสัปดาห์' : 'วันหยุดนักขัตฤกษ์';
          
          const shiftCell = document.createElement('td');
          shiftCell.textContent = day.shift === 'morning' ? 'เช้า' : 'บ่าย';
          
          const staffCell = document.createElement('td');
          staffCell.textContent = 'ไม่มีผู้ปฏิบัติงาน';
          
          const roleCell = document.createElement('td');
          roleCell.textContent = '';
          
          tr.append(dateCell, typeCell, shiftCell, staffCell, roleCell);
          table.appendChild(tr);
        } else {
          day.slots.forEach(slot => {
            const tr = document.createElement('tr');
            const staffName = personnel.find(p => p.id === slot.user_id)?.name || slot.user_id;
            
            const dateCell = document.createElement('td');
            dateCell.textContent = day.date;
            
            const typeCell = document.createElement('td');
            typeCell.textContent = day.day_type === 'weekday' ? 'วันทำงาน' : 
                                 day.day_type === 'weekend' ? 'วันหยุดสุดสัปดาห์' : 'วันหยุดนักขัตฤกษ์';
            
            const shiftCell = document.createElement('td');
            shiftCell.textContent = day.shift === 'morning' ? 'เช้า' : 'บ่าย';
            
            const staffCell = document.createElement('td');
            staffCell.textContent = staffName;
            
            const roleCell = document.createElement('td');
            roleCell.textContent = slot.role;
            
            tr.append(dateCell, typeCell, shiftCell, staffCell, roleCell);
            table.appendChild(tr);
          });
        }
      });
      
      document.body.appendChild(table);
      
      // เลือก table เพื่อ copy
      const range = document.createRange();
      range.selectNode(table);
      window.getSelection()?.removeAllRanges();
      window.getSelection()?.addRange(range);
      
      // copy table ไปยัง clipboard
      document.execCommand('copy');
      
      // ลบ table จาก DOM
      document.body.removeChild(table);
      
      toast({
        title: 'คัดลอกข้อมูลเรียบร้อย',
        description: 'ข้อมูลตารางเวรถูกคัดลอกไปยัง clipboard แล้ว กรุณาวางในเอกสาร Excel',
      });
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถส่งออกไฟล์ Excel ได้',
        variant: 'destructive',
      });
    }
  };

  // ดึงข้อมูลเวรของวันที่เลือก
  const getSelectedDateSchedule = () => {
    if (!selectedDate || !schedule.length) return null;
    
    // ถ้าเป็นอาร์เรย์ ใช้วันแรก ถ้าไม่ใช่ใช้วันที่เลือก
    const dateToUse = Array.isArray(selectedDate) ? 
      (selectedDate.length > 0 ? selectedDate[0] : null) : 
      selectedDate;
    
    if (!dateToUse) return null;
    
    const dateStr = format(dateToUse, 'yyyy-MM-dd');
    return schedule.find(day => day.date === dateStr);
  };

  const selectedDaySchedule = getSelectedDateSchedule();

  // บันทึกรายชื่อบุคลากร
  const handleSavePersonnel = (updatedPersonnel: Personnel[]) => {
    setPersonnel(updatedPersonnel);
    toast({
      title: 'บันทึกสำเร็จ',
      description: 'อัปเดตรายชื่อบุคลากรเรียบร้อยแล้ว',
    });
  };
  
  const handleAddPersonnel = () => {
    if (!staffForm.name || !staffForm.position) {
      toast({
        title: "ข้อมูลไม่ครบถ้วน",
        description: "กรุณาระบุชื่อและตำแหน่งให้ครบถ้วน",
        variant: "destructive",
      });
      return;
    }

    // กำหนดบทบาทให้ยืดหยุ่นมากขึ้น
    let role = 'PT';
    const position = staffForm.position.toLowerCase();
    
    // ตรวจสอบตำแหน่งว่ามีคำว่า "ผู้ช่วย" หรือไม่
    if (position.includes('ผู้ช่วย') || 
        position.includes('assistant') || 
        position.includes('asst')) {
      role = 'PT_ASST';
    }
    
    console.log(`เพิ่มบุคลากร: ${staffForm.name}, ตำแหน่ง: ${staffForm.position}, บทบาท: ${role}`);

    const newPersonnel: Personnel = {
      id: staffForm.id || `new-${Date.now()}`,
      name: staffForm.name,
      position: staffForm.position,
      role: role,
      active: true,
      shift_preference: 'any'
    };
    
    setPersonnel(prev => {
      const existingIndex = prev.findIndex(p => p.id === newPersonnel.id);
      if (existingIndex > -1) {
        // Update existing
        const updated = [...prev];
        updated[existingIndex] = newPersonnel;
        return updated;
      } else {
        // Add new
        return [...prev, newPersonnel];
      }
    });

    // Reset form
    setStaffForm({ id: '', name: '', position: '' });
  };

  const handleEditPersonnel = (person: Personnel) => {
    setStaffForm({
      id: person.id,
      name: person.name,
      position: person.position
    });
  };

  const handleDeletePersonnel = (personId: string) => {
    setPersonnel(prev => prev.filter(p => p.id !== personId));
    toast({
      title: 'ลบข้อมูลสำเร็จ',
      description: 'ข้อมูลบุคลากรถูกลบแล้ว',
    });
  };

  // บันทึกคำขอเวร
  const handleSaveShiftRequests = (updatedRequests: UIShiftRequest[]) => {
    setShiftRequests(updatedRequests);
    toast({
      title: 'บันทึกสำเร็จ',
      description: 'อัปเดตคำขอเวรเรียบร้อยแล้ว',
    });
  };

  // ตั้งค่า state สำหรับเก็บข้อมูลการตั้งค่าตารางเวร
  const [settings, setSettings] = useState({
    weekdayFormat: "default",
    weekdayPT: 2,
    weekdayAssistant: 2,
    weekdayShift: "afternoon",
    weekendFormat: "default",
    weekendPT: 1,
    weekendAssistant: 1,
    weekendShift: "morning",
    holidayFormat: "default",
    holidayPT: 1,
    holidayAssistant: 1,
    holidayShift: "morning",
  });

  // ฟังก์ชันสำหรับอัปเดตการตั้งค่า
  const handleUpdateSettings = (key: string, value: any) => {
    setShiftConfig({
      ...shiftConfig,
      [key]: value
    });
  };

  // เพิ่มฟังก์ชันทดสอบการเชื่อมต่อกับฐานข้อมูล
  const testDatabaseConnection = async () => {
    setIsLoading(true);
    try {
      // ใช้ฟังก์ชัน checkTableAccess จาก enhancedShiftScheduler.ts
      await checkTableAccess();
      toast({
        title: 'เชื่อมต่อฐานข้อมูลสำเร็จ',
        description: 'สามารถเข้าถึงตารางข้อมูลทั้งหมดได้',
      });
    } catch (error) {
      console.error('Error testing database connection:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: error.message || 'ไม่สามารถเชื่อมต่อกับฐานข้อมูลได้',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">ระบบจัดตารางเวร</h1>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setOpenStaffDialog(true)}
            >
              <Users className="h-4 w-4 mr-2" />
              จัดการบุคลากร
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => setOpenRequestsDialog(true)}
            >
              <CalendarPlus className="h-4 w-4 mr-2" />
              คำขอเวร
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => setOpenSettings(true)}
            >
              <Settings className="h-4 w-4 mr-2" />
              ตั้งค่า
            </Button>
            
            <Button 
              variant="outline" 
              onClick={testDatabaseConnection}
              disabled={isLoading}
            >
              <DatabaseIcon className="h-4 w-4 mr-2" />
              ทดสอบการเชื่อมต่อ
            </Button>
            
            <div className="flex gap-2">
              <Button 
                variant="default" 
                onClick={generateSchedule} 
                disabled={isLoading}
              >
                {isLoading ? 'กำลังประมวลผล...' : 'สร้างตารางเวร'}
              </Button>
              
              {schedule.length > 0 && (
                <Button
                  variant="outline"
                  onClick={() => {
                    // สุ่มตารางเวรใหม่โดยใช้ค่าความสุ่มมากขึ้น
                    setOptions({...options, randomnessFactor: 15});
                    setTimeout(() => {
                      generateSchedule();
                      // รีเซ็ตค่าความสุ่มกลับเป็น 0 หลังจากสร้างตารางเวรเสร็จ
                      setOptions({...options, randomnessFactor: 0});
                    }, 100);
                  }}
                  disabled={isLoading}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  สุ่มตารางเวรใหม่
                </Button>
              )}
            </div>
          </div>
        </div>
        
        {/* เลือกเดือน */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle>ตารางเวรประจำเดือน</CardTitle>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => handleMonthChange(-1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-lg font-medium min-w-[150px] text-center">
                  {format(currentMonth, 'MMMM yyyy', { locale: th })}
                </span>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => handleMonthChange(1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <CardDescription>
              จัดการตารางเวรและดูรายละเอียดการจัดเวร
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="preview">ตารางเวร</TabsTrigger>
                <TabsTrigger value="calendar">ปฏิทิน</TabsTrigger>
                <TabsTrigger value="list">รายการเวร</TabsTrigger>
                <TabsTrigger value="analysis">วิเคราะห์</TabsTrigger>
              </TabsList>
              
              <TabsContent value="preview" className="pt-4">
                <ShiftSchedulePreview 
                  schedule={schedule} 
                  personnel={personnel} 
                  currentMonth={currentMonth} 
                  shiftRequests={shiftRequests} 
                />
              </TabsContent>
              
              <TabsContent value="calendar" className="pt-4">
                {/* ตัวเลือกปฏิทินที่มีอยู่เดิม */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* ปฏิทินเลือกวันที่ */}
                  <div>
                    <Calendar
                      mode="multiple"
                      selected={Array.isArray(selectedDate) ? selectedDate : selectedDate ? [selectedDate] : []}
                      onSelect={(dates) => setSelectedDate(dates)}
                      month={currentMonth}
                      className="rounded-md border"
                      locale={th}
                      modifiers={{
                        booked: schedule
                          .filter(day => day.slots.length > 0)
                          .map(day => new Date(day.date)),
                        incomplete: schedule
                          .filter(day => !day.is_complete)
                          .map(day => new Date(day.date)),
                      }}
                      modifiersStyles={{
                        booked: { backgroundColor: '#dcfce7' },
                        incomplete: { backgroundColor: '#fee2e2' },
                      }}
                    />
                    
                    <div className="flex items-center justify-center gap-4 mt-4">
                      <div className="flex items-center">
                        <div className="w-4 h-4 bg-[#dcfce7] rounded-full mr-2" />
                        <span className="text-sm">มีเวร</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-4 h-4 bg-[#fee2e2] rounded-full mr-2" />
                        <span className="text-sm">ไม่ครบ</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* รายละเอียดวันที่เลือก */}
                  <div>
                    <Card>
                      <CardHeader>
                        <CardTitle>
                          {selectedDate ? 
                            (Array.isArray(selectedDate) && selectedDate.length > 0 ? 
                              format(selectedDate[0], 'dd MMMM yyyy', { locale: th }) : 
                              selectedDate instanceof Date ? 
                                format(selectedDate, 'dd MMMM yyyy', { locale: th }) : 
                                'เลือกวันที่') : 
                            'เลือกวันที่'}
                        </CardTitle>
                        <CardDescription>
                          {selectedDaySchedule ? 
                            `${selectedDaySchedule.day_type === 'weekday' ? 'วันทำงาน' : 
                              selectedDaySchedule.day_type === 'weekend' ? 'วันหยุดสุดสัปดาห์' : 
                              'วันหยุดนักขัตฤกษ์'} - เวร${selectedDaySchedule.shift === 'morning' ? 'เช้า' : 'บ่าย'}` : 
                            'ไม่มีข้อมูลเวร'}
                        </CardDescription>
                      </CardHeader>
                      
                      <CardContent>
                        {selectedDaySchedule ? (
                          <>
                            {selectedDaySchedule.warnings && selectedDaySchedule.warnings.length > 0 && (
                              <Alert variant="destructive" className="mb-4">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>คำเตือน</AlertTitle>
                                <AlertDescription>
                                  <ul className="list-disc pl-4">
                                    {selectedDaySchedule.warnings.map((warning, idx) => (
                                      <li key={idx}>{warning}</li>
                                    ))}
                                  </ul>
                                </AlertDescription>
                              </Alert>
                            )}
                            
                            {selectedDaySchedule.slots.length > 0 ? (
                              <div className="space-y-4">
                                <h3 className="font-medium">ผู้ปฏิบัติงาน ({selectedDaySchedule.slots.length}/{selectedDaySchedule.total_required})</h3>
                                <div className="space-y-2">
                                  {selectedDaySchedule.slots.map((slot, idx) => {
                                    const person = personnel.find(p => p.id === slot.user_id);
                                    return (
                                      <div key={idx} className="flex items-center justify-between p-2 border rounded-md">
                                        <div>
                                          <p className="font-medium">{person?.name || slot.user_id}</p>
                                          <p className="text-sm text-gray-500">{slot.role}</p>
                                        </div>
                                        <Badge variant={slot.assigned_by === 'request' ? 'default' : 'outline'}>
                                          {slot.assigned_by === 'auto' ? 'อัตโนมัติ' : 
                                           slot.assigned_by === 'request' ? 'ตามคำขอ' : 'กำหนดเอง'}
                                        </Badge>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center py-8">
                                <CalendarIcon className="h-12 w-12 text-gray-400 mb-2" />
                                <p className="text-gray-500">ไม่มีผู้ปฏิบัติงานในวันนี้</p>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-8">
                            <CalendarIcon className="h-12 w-12 text-gray-400 mb-2" />
                            <p className="text-gray-500">เลือกวันที่เพื่อดูรายละเอียด</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="list" className="pt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>รายการเวรทั้งหมด</CardTitle>
                    <CardDescription>
                      แสดงรายการเวรทั้งหมดในเดือน {format(currentMonth, 'MMMM yyyy', { locale: th })}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    {schedule.length > 0 ? (
                      <Table>
                        <TableCaption>ตารางเวรประจำเดือน {format(currentMonth, 'MMMM yyyy', { locale: th })}</TableCaption>
                        <TableHeader>
                          <TableRow>
                            <TableHead>วันที่</TableHead>
                            <TableHead>ประเภทวัน</TableHead>
                            <TableHead>เวร</TableHead>
                            <TableHead>จำนวนผู้ปฏิบัติงาน</TableHead>
                            <TableHead>สถานะ</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {schedule.map((day, idx) => (
                            <TableRow key={idx} onClick={() => setSelectedDate(new Date(day.date))} className="cursor-pointer hover:bg-gray-50">
                              <TableCell>{format(new Date(day.date), 'dd/MM/yyyy')}</TableCell>
                              <TableCell>
                                {day.day_type === 'weekday' ? 'วันทำงาน' : 
                                 day.day_type === 'weekend' ? 'วันหยุดสุดสัปดาห์' : 'วันหยุดนักขัตฤกษ์'}
                              </TableCell>
                              <TableCell>{day.shift === 'morning' ? 'เช้า' : 'บ่าย'}</TableCell>
                              <TableCell>{day.slots.length}/{day.total_required}</TableCell>
                              <TableCell>
                                {day.is_complete ? (
                                  <Badge className="bg-green-100 text-green-800">ครบถ้วน</Badge>
                                ) : (
                                  <Badge variant="destructive">ไม่ครบ</Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12">
                        <CalendarIcon className="h-16 w-16 text-gray-400 mb-4" />
                        <p className="text-gray-500 text-lg">ยังไม่มีข้อมูลตารางเวร</p>
                        <p className="text-gray-400">กดปุ่ม "สร้างตารางเวร" เพื่อเริ่มต้น</p>
                      </div>
                    )}
                  </CardContent>
                  
                  <CardFooter className="flex justify-between">
                    <div>
                      {schedule.length > 0 && (
                        <p className="text-sm text-gray-500">
                          ครบถ้วน {schedule.filter(d => d.is_complete).length}/{schedule.length} วัน
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={exportToCSV} disabled={!schedule.length}>
                        <Download className="h-4 w-4 mr-2" />
                        ส่งออก CSV
                      </Button>
                      <Button onClick={handleSaveSchedule} disabled={!schedule.length}>
                        <Save className="h-4 w-4 mr-2" />
                        บันทึกตารางเวร
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              </TabsContent>
              
              <TabsContent value="analysis" className="pt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>วิเคราะห์ตารางเวร</CardTitle>
                    <CardDescription>
                      แสดงสถิติและการวิเคราะห์ความสมดุลของตารางเวร
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    {balanceAnalysis ? (
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-lg font-medium mb-2">คะแนนความสมดุล</h3>
                          <div className="flex items-center gap-4">
                            <Progress value={balanceAnalysis.fairness_score} className="w-2/3" />
                            <span className="font-medium">{Math.round(balanceAnalysis.fairness_score)}%</span>
                          </div>
                        </div>
                        
                        {balanceAnalysis.recommendations.length > 0 && (
                          <div>
                            <h3 className="text-lg font-medium mb-2">คำแนะนำ</h3>
                            <ul className="list-disc pl-6 space-y-1">
                              {balanceAnalysis.recommendations.map((rec: string, idx: number) => (
                                <li key={idx}>{rec}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        <div>
                          <h3 className="text-lg font-medium mb-2">การกระจายเวร</h3>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>ชื่อ</TableHead>
                                <TableHead className="text-right">จำนวนเวร</TableHead>
                                <TableHead className="text-right">ความต่าง</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {balanceAnalysis.distribution.map((item: any, idx: number) => (
                                <TableRow key={idx}>
                                  <TableCell>{item.person}</TableCell>
                                  <TableCell className="text-right">{item.shifts}</TableCell>
                                  <TableCell className="text-right">
                                    <span className={
                                      item.deviation > 1 ? 'text-red-500' : 
                                      item.deviation < -1 ? 'text-blue-500' : ''
                                    }>
                                      {item.deviation > 0 && '+'}{item.deviation.toFixed(1)}
                                    </span>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12">
                        <UserCheck className="h-16 w-16 text-gray-400 mb-4" />
                        <p className="text-gray-500 text-lg">ยังไม่มีข้อมูลการวิเคราะห์</p>
                        <p className="text-gray-400">สร้างตารางเวรเพื่อดูการวิเคราะห์</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <div>
              {schedule.length > 0 && (
                <p className="text-sm text-gray-500">
                  ครบถ้วน {schedule.filter(d => d.is_complete).length}/{schedule.length} วัน
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={exportToCSV} disabled={!schedule.length}>
                <Download className="h-4 w-4 mr-2" />
                ส่งออก CSV
              </Button>
              <Button variant="outline" onClick={exportToExcel} disabled={!schedule.length}>
                <Download className="h-4 w-4 mr-2" />
                ส่งออก Excel
              </Button>
              <Button onClick={handleSaveSchedule} disabled={!schedule.length}>
                <Save className="h-4 w-4 mr-2" />
                บันทึกตารางเวร
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
      
      {/* Dialog ตั้งค่า */}
      <Dialog open={openSettings} onOpenChange={setOpenSettings}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>ตั้งค่าการจัดเวร</DialogTitle>
            <DialogDescription>
              ปรับแต่งการทำงานของระบบจัดตารางเวรอัตโนมัติ
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="general">ตั้งค่าทั่วไป</TabsTrigger>
              <TabsTrigger value="formats">รูปแบบเวร</TabsTrigger>
            </TabsList>
            
            <TabsContent value="general" className="space-y-4 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="force-balance">บังคับสมดุลเวร</Label>
                  <p className="text-sm text-gray-500">พยายามจัดเวรให้ทุกคนได้จำนวนเวรใกล้เคียงกัน</p>
                </div>
                <Switch 
                  id="force-balance" 
                  checked={options.forceBalance}
                  onCheckedChange={(checked) => setOptions({...options, forceBalance: checked})}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="prioritize-requests">ให้ความสำคัญกับคำขอเวร</Label>
                  <p className="text-sm text-gray-500">จัดเวรตามคำขอเวรก่อนเป็นอันดับแรก</p>
                </div>
                <Switch 
                  id="prioritize-requests" 
                  checked={options.prioritizeRequests}
                  onCheckedChange={(checked) => setOptions({...options, prioritizeRequests: checked})}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="allow-override">อนุญาตให้แทนที่คำขอไม่เอาเวร</Label>
                  <p className="text-sm text-gray-500">อนุญาตให้จัดเวรให้คนที่ขอไม่เอาเวรได้ในกรณีจำเป็น</p>
                </div>
                <Switch 
                  id="allow-override" 
                  checked={options.allowOverride}
                  onCheckedChange={(checked) => setOptions({...options, allowOverride: checked})}
                />
              </div>
              
              <div className="pt-4">
                <h3 className="text-sm font-medium mb-2">การสุ่มตารางเวร</h3>
                <p className="text-sm text-gray-500 mb-2">
                  ระดับความสุ่มที่ใช้เมื่อกดปุ่ม "สุ่มตารางเวรใหม่" - ค่ายิ่งสูงยิ่งมีโอกาสได้ผลลัพธ์ที่แตกต่างจากเดิม 
                  แต่ยังคงรักษากฎการจัดเวรและคำขอเวร/ไม่เอาเวรเดิม
                </p>
                
                <div className="flex flex-col space-y-2">
                  <Label htmlFor="randomness">ระดับความสุ่ม: {options.randomnessFactor}</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">น้อย</span>
                    <Slider 
                      id="randomness"
                      min={5} 
                      max={20} 
                      step={1}
                      value={[options.randomnessFactor]} 
                      onValueChange={(value) => setOptions({...options, randomnessFactor: value[0]})}
                      className="flex-1"
                    />
                    <span className="text-sm">มาก</span>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="formats" className="space-y-6 py-4">
              <div>
                <h3 className="text-lg font-medium mb-4">รูปแบบการจัดเวร</h3>
                
                <div className="space-y-6">
                  {/* รูปแบบเวรวันทำงานปกติ */}
                  <div className="border p-4 rounded-lg">
                    <h4 className="font-medium mb-2">วันทำงานปกติ (จันทร์-ศุกร์)</h4>
                    
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div>
                        <Label htmlFor="weekday-format">รูปแบบเวร</Label>
                        <Select 
                          defaultValue="custom"
                          onValueChange={(value) => {
                            if (value === "default") {
                              handleUpdateSettings("weekday_pt_count", 2);
                              handleUpdateSettings("weekday_pt_asst_count", 1);
                            } else if (value === "alt1") {
                              handleUpdateSettings("weekday_pt_count", 2);
                              handleUpdateSettings("weekday_pt_asst_count", 2);
                            } else if (value === "alt2") {
                              handleUpdateSettings("weekday_pt_count", 1);
                              handleUpdateSettings("weekday_pt_asst_count", 2);
                            }
                          }}
                        >
                          <SelectTrigger id="weekday-format">
                            <SelectValue placeholder="เลือกรูปแบบเวร" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="default">PT 2 คน, ผช. 1 คน (ค่าเริ่มต้น)</SelectItem>
                            <SelectItem value="alt1">PT 2 คน, ผช. 2 คน</SelectItem>
                            <SelectItem value="alt2">PT 1 คน, ผช. 2 คน</SelectItem>
                            <SelectItem value="custom">กำหนดเอง</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="weekday-pt">จำนวน PT</Label>
                        <Input 
                          type="number" 
                          id="weekday-pt" 
                          value={shiftConfig.weekday_pt_count}
                          onChange={(e) => handleUpdateSettings("weekday_pt_count", parseInt(e.target.value))}
                          min="0" 
                          max="5" 
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="weekday-asst">จำนวนผู้ช่วย</Label>
                        <Input 
                          type="number" 
                          id="weekday-asst" 
                          value={shiftConfig.weekday_pt_asst_count}
                          onChange={(e) => handleUpdateSettings("weekday_pt_asst_count", parseInt(e.target.value))}
                          min="0" 
                          max="5" 
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="weekday-shift">ช่วงเวร</Label>
                      <Select 
                        defaultValue={shiftConfig.weekday_shift}
                        onValueChange={(value) => handleUpdateSettings("weekday_shift", value)}
                      >
                        <SelectTrigger id="weekday-shift">
                          <SelectValue placeholder="เลือกช่วงเวร" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="morning">เช้า (ช)</SelectItem>
                          <SelectItem value="afternoon">บ่าย (บ)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {/* รูปแบบเวรวันหยุดสุดสัปดาห์ */}
                  <div className="border p-4 rounded-lg">
                    <h4 className="font-medium mb-2">วันหยุดสุดสัปดาห์ (เสาร์)</h4>
                    
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div>
                        <Label htmlFor="weekend-format">รูปแบบเวร</Label>
                        <Select 
                          defaultValue={settings.weekendFormat}
                          onValueChange={(value) => {
                            handleUpdateSettings("weekendFormat", value);
                            if (value === "default") {
                              handleUpdateSettings("weekendPT", 1);
                              handleUpdateSettings("weekendAssistant", 1);
                            } else if (value === "alt1") {
                              handleUpdateSettings("weekendPT", 1);
                              handleUpdateSettings("weekendAssistant", 0);
                            }
                          }}
                        >
                          <SelectTrigger id="weekend-format">
                            <SelectValue placeholder="เลือกรูปแบบเวร" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="default">PT 1 คน, ผช. 1 คน (ค่าเริ่มต้น)</SelectItem>
                            <SelectItem value="alt1">PT 1 คน, ไม่มีผู้ช่วย</SelectItem>
                            <SelectItem value="custom">กำหนดเอง</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="weekend-pt">จำนวน PT</Label>
                        <Input 
                          type="number" 
                          id="weekend-pt" 
                          value={settings.weekendPT}
                          onChange={(e) => handleUpdateSettings("weekendPT", parseInt(e.target.value))}
                          min="0" 
                          max="3" 
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="weekend-asst">จำนวนผู้ช่วย</Label>
                        <Input 
                          type="number" 
                          id="weekend-asst" 
                          value={settings.weekendAssistant}
                          onChange={(e) => handleUpdateSettings("weekendAssistant", parseInt(e.target.value))}
                          min="0" 
                          max="3" 
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="weekend-shift">ช่วงเวร</Label>
                      <Select 
                        defaultValue={settings.weekendShift}
                        onValueChange={(value) => handleUpdateSettings("weekendShift", value)}
                      >
                        <SelectTrigger id="weekend-shift">
                          <SelectValue placeholder="เลือกช่วงเวร" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="morning">เช้า (ช)</SelectItem>
                          <SelectItem value="afternoon">บ่าย (บ)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {/* รูปแบบเวรวันหยุดนักขัตฤกษ์ */}
                  <div className="border p-4 rounded-lg">
                    <h4 className="font-medium mb-2">วันหยุดนักขัตฤกษ์</h4>
                    
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div>
                        <Label htmlFor="holiday-format">รูปแบบเวร</Label>
                        <Select 
                          defaultValue={settings.holidayFormat}
                          onValueChange={(value) => {
                            handleUpdateSettings("holidayFormat", value);
                            if (value === "default") {
                              handleUpdateSettings("holidayPT", 1);
                              handleUpdateSettings("holidayAssistant", 1);
                            } else if (value === "alt1") {
                              handleUpdateSettings("holidayPT", 1);
                              handleUpdateSettings("holidayAssistant", 0);
                            }
                          }}
                        >
                          <SelectTrigger id="holiday-format">
                            <SelectValue placeholder="เลือกรูปแบบเวร" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="default">PT 1 คน, ผช. 1 คน (ค่าเริ่มต้น)</SelectItem>
                            <SelectItem value="alt1">PT 1 คน, ไม่มีผู้ช่วย</SelectItem>
                            <SelectItem value="custom">กำหนดเอง</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="holiday-pt">จำนวน PT</Label>
                        <Input 
                          type="number" 
                          id="holiday-pt" 
                          value={settings.holidayPT}
                          onChange={(e) => handleUpdateSettings("holidayPT", parseInt(e.target.value))}
                          min="0" 
                          max="3" 
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="holiday-asst">จำนวนผู้ช่วย</Label>
                        <Input 
                          type="number" 
                          id="holiday-asst" 
                          value={settings.holidayAssistant}
                          onChange={(e) => handleUpdateSettings("holidayAssistant", parseInt(e.target.value))}
                          min="0" 
                          max="3" 
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="holiday-shift">ช่วงเวร</Label>
                      <Select 
                        defaultValue={settings.holidayShift}
                        onValueChange={(value) => handleUpdateSettings("holidayShift", value)}
                      >
                        <SelectTrigger id="holiday-shift">
                          <SelectValue placeholder="เลือกช่วงเวร" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="morning">เช้า (ช)</SelectItem>
                          <SelectItem value="afternoon">บ่าย (บ)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          <DialogFooter>
            <Button variant="default" onClick={() => {
              // บันทึกการตั้งค่ารูปแบบเวร
              toast({
                title: 'บันทึกการตั้งค่าเรียบร้อย',
                description: 'การเปลี่ยนแปลงจะมีผลเมื่อคุณสร้างตารางเวรครั้งถัดไป',
              });
              setOpenSettings(false);
            }}>
              บันทึกการตั้งค่า
            </Button>
            <Button variant="outline" onClick={() => setOpenSettings(false)}>
              ยกเลิก
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
              {/* Dialog จัดการบุคลากร */}
        <Dialog open={openStaffDialog} onOpenChange={setOpenStaffDialog}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>จัดการรายชื่อบุคลากร</DialogTitle>
              <DialogDescription>
                เพิ่ม แก้ไข หรือลบบุคลากรในระบบ
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="newPersonnelName" className="text-right">ชื่อ-สกุล</Label>
                  <Input
                    id="newPersonnelName"
                    value={staffForm.name}
                    onChange={(e) => setStaffForm(prev => ({ ...prev, name: e.target.value }))}
                    className="col-span-3"
                    placeholder="เช่น น.ส. ใจดี จริงใจ"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="newPersonnelPosition" className="text-right">ตำแหน่ง</Label>
                  <Input
                    id="newPersonnelPosition"
                    value={staffForm.position}
                    onChange={(e) => setStaffForm(prev => ({ ...prev, position: e.target.value }))}
                    className="col-span-3"
                    placeholder="เช่น นักกายภาพบำบัด, ผู้ช่วยนักกายภาพบำบัด"
                  />
                </div>
                <Button onClick={handleAddPersonnel}>
                  {staffForm.id ? 'บันทึกการแก้ไข' : 'เพิ่มบุคลากร'}
                </Button>
            </div>

            <h4 className="font-semibold mt-4">รายชื่อบุคลากรปัจจุบัน</h4>
            <div className="mt-2 border rounded-lg max-h-60 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ชื่อ-สกุล</TableHead>
                    <TableHead>ตำแหน่ง</TableHead>
                    <TableHead className="text-right">จัดการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {personnel.map(p => (
                    <TableRow key={p.id}>
                      <TableCell>{p.name}</TableCell>
                      <TableCell>{p.position}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="icon" onClick={() => handleEditPersonnel(p)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="destructive" size="icon" onClick={() => handleDeletePersonnel(p.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <DialogFooter>
              <Button onClick={() => setOpenStaffDialog(false)}>ปิด</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Dialog จัดการคำขอเวร */}
        <Dialog open={openRequestsDialog} onOpenChange={setOpenRequestsDialog}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>จัดการคำขอเวร</DialogTitle>
              <DialogDescription>
                บันทึกการขอเวรหรือไม่เอาเวรของบุคลากร
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="add" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="add">เพิ่มคำขอเวร</TabsTrigger>
                <TabsTrigger value="view">ดูคำขอทั้งหมด</TabsTrigger>
              </TabsList>

              <TabsContent value="add" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium mb-2">เลือกบุคลากร</h3>
                    <Select onValueChange={(value) => {
                      // รีเซ็ตวันที่เลือกเมื่อเปลี่ยนบุคลากร
                      setSelectedDate([]);
                      setSelectedStaff(value);
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="เลือกบุคลากร" />
                      </SelectTrigger>
                      <SelectContent>
                        {personnel.map((staff) => (
                          <SelectItem key={staff.id} value={staff.id}>
                            {staff.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <h3 className="text-sm font-medium mt-4 mb-2">ประเภทคำขอ</h3>
                    <div className="flex gap-4">
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id="preferred"
                          name="requestType"
                          value="preferred"
                          defaultChecked
                          className="mr-2"
                          onChange={() => setRequestType("preferred")}
                        />
                        <label htmlFor="preferred">ขอเวร</label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id="avoided"
                          name="requestType"
                          value="avoided"
                          className="mr-2"
                          onChange={() => setRequestType("avoided")}
                        />
                        <label htmlFor="avoided">ไม่เอาเวร</label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id="leave"
                          name="requestType"
                          value="leave"
                          className="mr-2"
                          onChange={() => setRequestType("leave")}
                        />
                        <label htmlFor="leave">ลา</label>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium mb-2">เลือกวันที่ (เลือกได้หลายวัน)</h3>
                    <Calendar
                      mode="multiple"
                      selected={Array.isArray(selectedDate) ? selectedDate : selectedDate ? [selectedDate] : []}
                      onSelect={(dates) => setSelectedDate(dates)}
                      className="border rounded-md p-3"
                      locale={th}
                    />
                    <div className="mt-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => {
                          const dates = Array.isArray(selectedDate) ? selectedDate : selectedDate ? [selectedDate] : [];
                          
                          if (!selectedStaff || dates.length === 0) {
                            toast({
                              title: 'ไม่สามารถบันทึกได้',
                              description: 'กรุณาเลือกบุคลากร ประเภทคำขอ และวันที่',
                              variant: 'destructive',
                            });
                            return;
                          }
                          
                          // สร้างคำขอเวรใหม่สำหรับแต่ละวันที่เลือก
                          const newRequests: UIShiftRequest[] = dates.map(date => ({
                            id: `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                            userId: selectedStaff,
                            date: date,
                            type: requestType,
                            shift: undefined // สามารถเพิ่มการเลือกช่วงเวรได้ในอนาคต
                          }));
                          
                          // เพิ่มคำขอใหม่เข้าไปในรายการที่มีอยู่
                          const updatedRequests: UIShiftRequest[] = [...shiftRequests, ...newRequests];
                          handleSaveShiftRequests(updatedRequests);
                          
                          // แสดงข้อความสำเร็จ
                          toast({
                            title: requestType === 'preferred' ? 'บันทึกคำขอเวรสำเร็จ' : 'บันทึกคำขอไม่เอาเวรสำเร็จ',
                            description: requestType === 'preferred' 
                              ? `บันทึกคำขอเวรสำหรับ ${dates.length} วันเรียบร้อยแล้ว` 
                              : requestType === 'avoided'
                              ? `บันทึกคำขอไม่เอาเวรสำหรับ ${dates.length} วันเรียบร้อยแล้ว`
                              : `บันทึกวันลาสำหรับ ${dates.length} วันเรียบร้อยแล้ว`,
                          });
                          
                          // รีเซ็ตฟอร์ม
                          setSelectedDate([]);
                        }}
                      >
                        บันทึกคำขอ
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="view" className="mt-4">
                <div className="mb-4 flex flex-col sm:flex-row gap-4 items-end">
                  <div className="w-full sm:w-1/3">
                    <Label htmlFor="filter-person">กรองตามบุคลากร</Label>
                    <Select onValueChange={(value) => setFilterPerson(value)}>
                      <SelectTrigger id="filter-person">
                        <SelectValue placeholder="ทั้งหมด" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">ทั้งหมด</SelectItem>
                        {personnel.map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="w-full sm:w-1/3">
                    <Label htmlFor="filter-type">กรองตามประเภท</Label>
                    <Select onValueChange={(value) => setFilterType(value)}>
                      <SelectTrigger id="filter-type">
                        <SelectValue placeholder="ทั้งหมด" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">ทั้งหมด</SelectItem>
                        <SelectItem value="preferred">ขอเวร</SelectItem>
                        <SelectItem value="avoided">ไม่เอาเวร</SelectItem>
                        <SelectItem value="leave">ลา</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    className="w-full sm:w-auto"
                    onClick={() => {
                      setFilterPerson("all");
                      setFilterType("all");
                    }}
                  >
                    รีเซ็ตตัวกรอง
                  </Button>
                </div>
                
                <div className="border rounded-md">
                  <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="py-2 px-4 text-left">บุคลากร</th>
                        <th className="py-2 px-4 text-left">วันที่</th>
                        <th className="py-2 px-4 text-left">ประเภท</th>
                        <th className="py-2 px-4 text-left">ช่วงเวร</th>
                        <th className="py-2 px-4 text-right">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRequests.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-4 text-center text-gray-500">
                            ไม่มีคำขอเวรตามเงื่อนไขที่เลือก
                          </td>
                        </tr>
                      ) : (
                        paginatedRequests.map((request, index) => {
                          const person = personnel.find(p => p.id === request.userId);
                          return (
                            <tr key={index} className="border-t">
                              <td className="py-2 px-4">{person?.name || 'ไม่ระบุ'}</td>
                              <td className="py-2 px-4">
                                {request.date instanceof Date 
                                  ? format(request.date, 'dd/MM/yyyy', { locale: th })
                                  : 'ไม่ระบุ'
                                }
                              </td>
                              <td className="py-2 px-4">
                                {request.type === 'preferred' ? 'ขอเวร' : 
                                 request.type === 'avoided' ? 'ไม่เอาเวร' : 'ลา'}
                              </td>
                              <td className="py-2 px-4">
                                {request.shift === 'morning' ? 'เช้า' : 
                                 request.shift === 'afternoon' ? 'บ่าย' : 'ไม่ระบุ'}
                              </td>
                              <td className="py-2 px-4 text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      // แก้ไขคำขอเวร
                                    }}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      // ลบคำขอเวร
                                      const updatedRequests = shiftRequests.filter(r => r.id !== request.id);
                                      handleSaveShiftRequests(updatedRequests);
                                    }}
                                  >
                                    <Trash2 className="w-4 h-4 text-red-500" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
                
                {filteredRequests.length > 0 && (
                  <div className="flex justify-between items-center mt-4">
                    <div className="text-sm text-gray-500">
                      แสดง {currentPage * itemsPerPage + 1} - {Math.min((currentPage + 1) * itemsPerPage, filteredRequests.length)} จาก {filteredRequests.length} รายการ
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        disabled={currentPage === 0}
                        onClick={() => setCurrentPage(currentPage - 1)}
                      >
                        หน้าก่อนหน้า
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        disabled={(currentPage + 1) * itemsPerPage >= filteredRequests.length}
                        onClick={() => setCurrentPage(currentPage + 1)}
                      >
                        หน้าถัดไป
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenRequestsDialog(false)}>
                ปิด
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
    </div>
  );
};

export default ShiftScheduler; 