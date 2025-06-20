import React, { useState, useCallback } from 'react';
import { format, addDays, subDays } from 'date-fns';
import { th } from 'date-fns/locale';
import { Calendar, Check, ArrowRight, X, Edit, Search, ChevronLeft, ChevronRight, Inbox, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useAppointments, useAddAppointment } from '@/hooks/useAppointments';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { useQueryClient } from '@tanstack/react-query';
import { VoiceInput } from '@/components/VoiceInput';
import { useAuth } from '@/contexts/AuthContext';

type CenterType = Database['public']['Enums']['center_enum'];

interface AppointmentTabsProps {
  department: string;
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  center?: CenterType | null;
}

interface Appointment {
  id?: string;
  hn: string;
  full_name: string;
  phone_number?: string;
  appointment_date: string;
  appointment_time?: string;
  departments: string[];
  table_number?: number;
  status: string;
  appointment_type: string;
  center?: CenterType;
}

const AppointmentTabs = ({
  department,
  selectedDate,
  onDateChange,
  center = null
}: AppointmentTabsProps): JSX.Element => {
  const [activeTable, setActiveTable] = useState('table1');
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Filter states
  const [searchName, setSearchName] = useState('');
  const [selectedAppointmentType, setSelectedAppointmentType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [appointmentStatuses, setAppointmentStatuses] = useState<Record<string, string>>({});
  const [showReschedule, setShowReschedule] = useState<string | null>(null);
  const [rescheduleData, setRescheduleData] = useState<{ [key: string]: { date?: Date, time?: string } }>({});
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [showRepeat, setShowRepeat] = useState<string | null>(null);
  const [repeatDate, setRepeatDate] = useState<Date | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  // เพิ่ม state สำหรับ dialog ยืนยันการลบ
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState<any>(null);

  // Utility functions
  const getAppointmentKey = (appointment: any): string => {
    if (appointment.id) return String(appointment.id);
    return `${appointment.hn}-${appointment.appointment_date}-${appointment.appointment_time || ''}`;
  };

  const getCardStyle = (appointmentId: string) => {
    const status = appointmentStatuses[appointmentId];
    switch (status) {
      case 'attended':
        return 'border-l-green-500 bg-green-50';
      case 'rescheduled':
        return 'border-l-yellow-500 bg-yellow-50';
      case 'cancelled':
      case 'missed':
        return 'border-l-red-500 bg-red-50';
      default:
        return 'border-l-blue-400';
    }
  };

  const handleStatusChange = (appointmentId: string, status: string) => {
    setAppointmentStatuses(prev => ({ ...prev, [appointmentId]: status }));
    toast({
      title: 'อัพเดทสถานะสำเร็จ',
      description: `อัพเดทสถานะเป็น "${status}" เรียบร้อยแล้ว`,
    });
  };

  // Format date for comparison
  const selectedDateStr = selectedDate instanceof Date && !isNaN(selectedDate.getTime())
    ? format(selectedDate, 'yyyy-MM-dd')
    : undefined;

  console.log('Current filters:', {
    department,
    selectedDate: selectedDateStr,
    center,
    activeTable,
  });

  // Use real appointment data with filters
  const { data: appointmentData = [], isLoading, error } = useAppointments({
    department: department,
    date: selectedDateStr,
    center: center,
    view: activeTable as 'table1' | 'table2' | 'table3' | 'summary'
  });

  console.log('Raw appointment data:', appointmentData);

  // Check if department should show table tabs
  const shouldShowTables = department === 'กายภาพบำบัด' || department === 'กายภาพ';
  const isChineseMedicine = department === 'แผนจีน';

  console.log('Department settings:', {
    department,
    shouldShowTables,
    isChineseMedicine,
    activeTable
  });

  // Get table labels based on department and user role
  const getTableLabels = () => {
    if (department === 'กายภาพบำบัด' || department === 'กายภาพ') {
      return ['โต๊ะ 1', 'โต๊ะ 2', 'โต๊ะ 3', 'เคสรวม'];
    } else if (department === 'แผนจีน') {
      // Show tables based on user role
      if (user?.role === 'TCM1') {
        return ['โต๊ะ 1'];
      } else if (user?.role === 'TCM2') {
        return ['โต๊ะ 2'];
      }
    }
    return [];
  };

  // Filter appointments based on table and other criteria
  const filterAppointments = (appointments: Appointment[]): Appointment[] => {
    if (!appointments?.length) {
      console.log('No appointments to filter');
      return [];
    }

    // กรองข้อมูลที่ซ้ำกันออกโดยใช้ id หรือข้อมูลอื่นๆ
    const uniqueAppointments = Array.from(
      new Map(
        appointments.map(appointment => [appointment.id || `${appointment.hn}-${appointment.appointment_date}-${appointment.appointment_time}`, appointment])
      ).values()
    );
    
    console.log(`Filtered out ${appointments.length - uniqueAppointments.length} duplicate appointments`);

    const filtered = uniqueAppointments.filter(appointment => {
      // Ensure appointment object is valid
      if (!appointment) {
        console.log('Invalid appointment object found');
        return false;
      }

      // ตรวจสอบว่าแผนกเป็นกายภาพบำบัดหรือกายภาพ (รองรับทั้งสองแบบ)
      const isPhysioTherapy = department === 'กายภาพบำบัด' || department === 'กายภาพ';

      // Filter by table number if not in summary view
      if (activeTable !== 'summary' && isPhysioTherapy) {
        const tableNumber = parseInt(activeTable.replace('table', ''));
        console.log('Filtering by table:', {
          appointmentTable: appointment.table_number,
          requiredTable: tableNumber,
          matches: appointment.table_number === tableNumber
        });
        if (appointment.table_number !== tableNumber) {
          return false;
        }
      }
      
      // เคสรวมควรแสดงเฉพาะรายการที่มี table_number เป็น null
      if (activeTable === 'summary' && isPhysioTherapy) {
        console.log('Filtering for summary view (เคสรวม):', {
          appointmentTable: appointment.table_number,
          isNull: appointment.table_number === null
        });
        if (appointment.table_number !== null) {
          return false;
        }
      }

      // Filter by search term
      if (searchName) {
        const searchTerm = searchName.toLowerCase().trim();
        const hn = appointment.hn?.toLowerCase().trim() || '';
        const fullName = appointment.full_name?.toLowerCase().trim() || '';
        const matches = hn.includes(searchTerm) || fullName.includes(searchTerm);
        console.log('Filtering by search:', {
          searchTerm,
          hn,
          fullName,
          matches
        });
        if (!matches) {
          return false;
        }
      }

      // Filter by appointment type
      if (selectedAppointmentType !== 'all') {
        console.log('Filtering by type:', {
          appointmentType: appointment.appointment_type,
          selectedType: selectedAppointmentType,
          matches: appointment.appointment_type === selectedAppointmentType
        });
        if (appointment.appointment_type !== selectedAppointmentType) {
          return false;
        }
      }
      
      // Filter by status
      if (selectedStatus !== 'all') {
        console.log('Filtering by status:', {
          appointmentStatus: appointment.status,
          selectedStatus,
          matches: appointment.status === selectedStatus
        });
        if (appointment.status !== selectedStatus) {
          return false;
        }
      }

      return true;
    });

    console.log('Filtered appointments:', filtered);
    return filtered;
  };

  // Get current appointments to display
  const getCurrentAppointments = (): Appointment[] => {
    const appointments = appointmentData as Appointment[] || [];
    console.log('Getting current appointments:', {
      total: appointments.length,
      department,
      activeTable
    });
    const filtered = filterAppointments(appointments);
    console.log('Final filtered appointments:', {
      count: filtered.length,
      appointments: filtered
    });
    return filtered;
  };

  // Handlers
  const handleReschedule = (appointmentId: string) => {
    const currentRescheduleData = rescheduleData[appointmentId];
    if (currentRescheduleData?.date && currentRescheduleData?.time) {
      handleStatusChange(appointmentId, 'rescheduled');
      setShowReschedule(null);
      setRescheduleData(prev => {
        const newState = {...prev};
        delete newState[appointmentId];
        return newState;
      });
      toast({
        title: "เลื่อนนัดสำเร็จ",
        description: `เลื่อนนัดเป็นวันที่ ${format(currentRescheduleData.date, 'dd/MM/yyyy')} เวลา ${currentRescheduleData.time}`,
      });
    }
  };

  // เพิ่มฟังก์ชันสำหรับการนัดตามเดิม
  const handleCreateAppointment = async (data: any) => {
    try {
      if (!data.appointment_date) {
        toast({
          title: "ข้อมูลไม่ครบถ้วน",
          description: "กรุณาระบุวันที่นัด",
          variant: "destructive",
        });
        return;
      }

      // สร้างนัดใหม่โดยใช้ข้อมูลเดิม แต่ไม่รวม id เดิม
      const appointmentData = {
        hn: data.hn,
        full_name: data.full_name,
        phone_number: data.phone_number,
        appointment_date: data.appointment_date,
        appointment_time: data.appointment_time,
        departments: data.departments,
        table_number: data.table_number,
        status: 'new' as const,
        appointment_type: data.appointment_type,
        center: data.center,
        time_period: data.time_period || 'ในเวลาราชการ',
        patient_id: data.patient_id
      };

      console.log('Creating new appointment:', appointmentData);
      
      // บันทึกข้อมูลลงฐานข้อมูล Supabase
      const { data: newAppointment, error } = await supabase
        .from('appointments')
        .insert(appointmentData)
        .select()
        .single();
      
      if (error) {
        console.error('Error inserting appointment:', error);
        throw new Error(error.message);
    }
      
      toast({
        title: "สร้างนัดหมายสำเร็จ",
        description: `สร้างนัดหมายสำหรับ ${data.full_name} เรียบร้อยแล้ว`,
      });

      // รีเฟรชข้อมูลนัดหมายทั้งหมด
      await queryClient.invalidateQueries({ 
        queryKey: ['appointments']
      });
      
      // รีเฟรชข้อมูลนัดหมายสำหรับวันที่นั้นๆ โดยเฉพาะ
      if (data.appointment_date === selectedDateStr) {
        // ถ้านัดหมายใหม่อยู่ในวันที่กำลังดูอยู่ ให้รีเฟรชข้อมูลเฉพาะวันนั้น
        await queryClient.invalidateQueries({ 
          queryKey: ['appointments', { date: data.appointment_date }]
        });
      }
      
      // ปิดป๊อปอัพและรีเซ็ตข้อมูล
      setShowRepeat(null);
      setRepeatDate(null);
      
      // ถ้านัดหมายใหม่อยู่ในวันที่ต่างจากที่กำลังดูอยู่ ให้เปลี่ยนไปดูวันนั้นแทน
      if (data.appointment_date !== selectedDateStr) {
        const newDate = new Date(data.appointment_date);
        if (newDate instanceof Date && !isNaN(newDate.getTime())) {
          onDateChange(newDate);
        }
      }
    } catch (error) {
      console.error('Error creating appointment:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถสร้างนัดหมายได้ กรุณาลองใหม่อีกครั้ง",
        variant: "destructive",
      });
    }
  };

  // เพิ่มฟังก์ชันสำหรับการแก้ไข
  const handleEdit = (appointment: any) => {
    setEditingId(getAppointmentKey(appointment));
    setEditForm({
      full_name: appointment.full_name || '',
      phone_number: appointment.phone_number || '',
      appointment_date: appointment.appointment_date || '',
      appointment_time: appointment.appointment_time || '',
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleSaveEdit = async (appointment: any) => {
    try {
      if (!editForm.appointment_date) {
        toast({
          title: "ข้อมูลไม่ครบถ้วน",
          description: "กรุณาระบุวันที่นัด",
          variant: "destructive",
        });
        return;
      }

      // อัปเดตข้อมูลนัดหมาย
      const { data, error } = await supabase
        .from('appointments')
        .update({
          full_name: editForm.full_name,
          phone_number: editForm.phone_number,
          appointment_date: editForm.appointment_date,
          appointment_time: editForm.appointment_time
        })
        .eq('id', appointment.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating appointment:', error);
        throw new Error(error.message);
      }

      toast({
        title: 'บันทึกสำเร็จ',
        description: `แก้ไขข้อมูลนัดหมายของ ${editForm.full_name} เรียบร้อยแล้ว`,
      });

      // รีเฟรชข้อมูลนัดหมาย
      await queryClient.invalidateQueries({ 
        queryKey: ['appointments']
      });

      setEditingId(null);
      setEditForm({});
    } catch (error) {
      console.error('Error in handleSaveEdit:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถแก้ไขนัดหมายได้ กรุณาลองใหม่อีกครั้ง",
        variant: "destructive",
      });
    }
  };

  // เพิ่มฟังก์ชันสำหรับการลบนัดหมาย
  const handleDeleteAppointment = useCallback(async (appointment: any) => {
    try {
      if (!appointment.id) {
        toast({
          title: "ข้อมูลไม่ถูกต้อง",
          description: "ไม่พบรหัสนัดหมาย",
          variant: "destructive",
        });
        return;
      }

      // ลบนัดหมาย
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', appointment.id);

      if (error) {
        console.error('Error deleting appointment:', error);
        throw new Error(error.message);
      }

      toast({
        title: 'ลบนัดหมายสำเร็จ',
        description: `ลบนัดหมายของ ${appointment.full_name} เรียบร้อยแล้ว`,
      });

      // รีเฟรชข้อมูลนัดหมาย
      await queryClient.invalidateQueries({ 
        queryKey: ['appointments']
      });
    } catch (error) {
      console.error('Error in handleDeleteAppointment:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถลบนัดหมายได้ กรุณาลองใหม่อีกครั้ง",
        variant: "destructive",
      });
    }
  }, [queryClient, toast]);

  // Navigation handlers
  const handlePrevDay = () => onDateChange(subDays(selectedDate, 1));
  const handleNextDay = () => onDateChange(addDays(selectedDate, 1));
  const handleDateSelect = (date: Date | undefined) => date && onDateChange(date);

  // Render appointment card
  const renderAppointmentCard = (appointment: any) => {
    const departmentCount = appointment.departments?.length || 0;
    const isJointCase = departmentCount >= 2;
    const appointmentKey = getAppointmentKey(appointment);

    // ฟังก์ชันสำหรับการลบนัดหมาย
    const onDeleteClick = () => {
      setAppointmentToDelete(appointment);
      setDeleteConfirmOpen(true);
    };

    return (
      <Card key={appointmentKey} className={cn(
        "border-l-4 transition-all duration-200",
        getCardStyle(appointmentKey)
      )}>
      <CardContent className="p-4">
        {/* Header with badges */}
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-semibold text-lg">{appointment.full_name}</h3>
          <div className="flex gap-2">
            {appointment.departments?.map((dept: string) => (
              <Badge key={dept} variant="secondary" className={
                dept === 'แผนไทย' ? "bg-pink-100 text-pink-800" :
                dept === 'แผนจีน' ? "bg-blue-100 text-blue-800" :
                dept === 'กายภาพบำบัด' ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
              }>
                {dept}
              </Badge>
            ))}
              {isJointCase && (
                <Badge variant="default" className="bg-purple-500">
                  {departmentCount} แผนก
                </Badge>
              )}
              {!isJointCase && appointment.table_number && (
              <Badge variant="outline">โต๊ะ: {appointment.table_number}</Badge>
            )}
              {appointment.time_period === 'นอกเวลาราชการ' && (
                <Badge variant="default" className="bg-orange-500">
                  นอกเวลา
                </Badge>
            )}
          </div>
        </div>

        {/* Patient details */}
        <div className="text-sm text-gray-600 mb-4">
          <p>วันที่: {appointment.appointment_date} | เวลา: {appointment.appointment_time || 'ไม่ระบุ'} | 
             สถานะ: {appointment.status === 'new' ? 'ใหม่' : appointment.status}</p>
          <p>HN: {appointment.hn} | ศูนย์: {appointment.center || 'ไม่ระบุ'}</p>
        </div>

          {/* Action buttons */}
          <div className="flex justify-between items-center">
        <div className="flex gap-2 flex-wrap">
          <Button 
            size="sm" 
                className="bg-green-500 hover:bg-green-600 text-white"
                onClick={() => handleStatusChange(appointmentKey, 'attended')}
          >
            <Check className="w-4 h-4 mr-1" />
            มาตามนัด
          </Button>
          
              <Popover 
                open={showReschedule === appointmentKey} 
                onOpenChange={open => setShowReschedule(open ? appointmentKey : null)}
              >
            <PopoverTrigger asChild>
                  <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white">
                <ArrowRight className="w-4 h-4 mr-1" />
                เลื่อน
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4">
              <div className="space-y-4">
                <h4 className="font-medium">เลื่อนนัดหมาย</h4>
                
                <div>
                  <label className="block text-sm font-medium mb-2">วันที่ใหม่</label>
                  <Popover>
                    <PopoverTrigger asChild>
                          <Button 
                            variant="outline" 
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !rescheduleData[appointmentKey]?.date && "text-muted-foreground"
                            )}
                          >
                        <Calendar className="mr-2 h-4 w-4" />
                            {rescheduleData[appointmentKey]?.date 
                              ? format(rescheduleData[appointmentKey]!.date!, "dd/MM/yyyy") 
                              : "เลือกวันที่"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent 
                        mode="single" 
                            selected={rescheduleData[appointmentKey]?.date} 
                            onSelect={(date) => setRescheduleData(prev => ({
                              ...prev,
                              [appointmentKey]: { ...prev[appointmentKey], date: date }
                            }))}
                        initialFocus 
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">เวลาใหม่</label>
                  <Input 
                    type="time" 
                        value={rescheduleData[appointmentKey]?.time || ''} 
                        onChange={e => setRescheduleData(prev => ({
                          ...prev,
                          [appointmentKey]: { ...prev[appointmentKey], time: e.target.value }
                        }))} 
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                        onClick={() => handleReschedule(appointmentKey)} 
                        disabled={!rescheduleData[appointmentKey]?.date || !rescheduleData[appointmentKey]?.time}
                    className="bg-yellow-600 hover:bg-yellow-700"
                  >
                    ยืนยันการเลื่อน
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setShowReschedule(null)}>
                    ยกเลิก
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          
          <Button 
            size="sm" 
                className="bg-red-500 hover:bg-red-600 text-white"
                onClick={() => handleStatusChange(appointmentKey, 'missed')}
          >
            <X className="w-4 h-4 mr-1" />
            ผิดนัด
          </Button>
          
          <Button 
            size="sm" 
            variant="outline" 
                className="border-gray-400 text-gray-600 hover:bg-gray-50"
                onClick={() => handleStatusChange(appointmentKey, 'cancelled')}
          >
            ยกเลิก
          </Button>
          
              {/* นัดตามเดิม */}
              <Popover open={showRepeat === appointmentKey} onOpenChange={open => setShowRepeat(open ? appointmentKey : null)}>
                <PopoverTrigger asChild>
                  <Button size="sm" className="bg-purple-500 hover:bg-purple-600 text-white">
                    <Calendar className="w-4 h-4 mr-1" />
                    นัดตามเดิม
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-4">
                  <div className="mb-2">
                    <label className="block text-sm font-medium mb-1">วันที่นัดใหม่</label>
                    <Input 
                      type="date" 
                      value={repeatDate ? format(repeatDate, 'yyyy-MM-dd') : ''} 
                      onChange={e => setRepeatDate(e.target.value ? new Date(e.target.value) : null)} 
                    />
                  </div>
                  <div className="text-sm text-gray-600 mt-2 mb-2">
                    {repeatDate ? (
                      <p>นัดหมายในวันที่: {format(repeatDate, 'dd/MM/yyyy')}</p>
                    ) : (
                      <p>กรุณาเลือกวันที่นัดหมาย</p>
                    )}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Button 
                      size="sm" 
                      className="bg-purple-600 hover:bg-purple-700 text-white" 
                      disabled={!repeatDate}
                      onClick={() => {
                        handleCreateAppointment({
                          ...appointment,
                          appointment_date: repeatDate ? format(repeatDate, 'yyyy-MM-dd') : '',
                          status: 'new',
                          id: undefined
                        });
                      }}
                    >
                      ยืนยัน
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setShowRepeat(null)}>
                      ยกเลิก
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>

              {/* แก้ไข */}
              {editingId === appointmentKey ? (
            <form className="space-y-2" onSubmit={e => { e.preventDefault(); handleSaveEdit(appointment); }}>
              <Input
                value={editForm.full_name}
                    onChange={e => setEditForm(prev => ({ ...prev, full_name: e.target.value }))}
                placeholder="ชื่อ-นามสกุล"
                className="mb-1"
                required
              />
              <Input
                value={editForm.phone_number}
                    onChange={e => setEditForm(prev => ({ ...prev, phone_number: e.target.value }))}
                placeholder="เบอร์โทร"
                className="mb-1"
              />
              <Input
                type="date"
                value={editForm.appointment_date}
                    onChange={e => setEditForm(prev => ({ ...prev, appointment_date: e.target.value }))}
                className="mb-1"
                required
              />
              <Input
                type="time"
                value={editForm.appointment_time}
                    onChange={e => setEditForm(prev => ({ ...prev, appointment_time: e.target.value }))}
                className="mb-2"
              />
              <div className="flex gap-2">
                    <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                      บันทึก
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={handleCancelEdit}>
                      ยกเลิก
                    </Button>
              </div>
            </form>
          ) : (
            <div className="flex gap-2">
            <Button 
              size="sm" 
                className="bg-blue-500 hover:bg-blue-600 text-white"
              onClick={() => handleEdit(appointment)}
            >
              <Edit className="w-4 h-4 mr-1" />
              แก้ไข
            </Button>
              <Button 
                size="sm" 
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={onDeleteClick}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                ลบ
                        </Button>
                  </div>
          )}
          </div>
          
          {/* Status indicator */}
            {appointmentStatuses[appointmentKey] && (
            <div className="mt-3 text-sm">
                {appointmentStatuses[appointmentKey] === 'attended' && 
                  <span className="text-green-600 font-medium">✅ มาตามนัดแล้ว</span>}
                {appointmentStatuses[appointmentKey] === 'rescheduled' && 
                  <span className="text-yellow-600 font-medium">📅 เลื่อนนัดแล้ว</span>}
                {appointmentStatuses[appointmentKey] === 'cancelled' && 
                  <span className="text-red-600 font-medium">❌ ยกเลิกแล้ว</span>}
                {appointmentStatuses[appointmentKey] === 'missed' && 
                  <span className="text-red-600 font-medium">❌ ผิดนัด</span>}
            </div>
          )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const tableLabels = getTableLabels();

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <Card className="p-8 text-center text-red-500">
        <p>เกิดข้อผิดพลาดในการโหลดข้อมูล</p>
        <p className="text-sm mt-2">{error.message || 'กรุณาลองใหม่อีกครั้ง'}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and date navigation */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <Input
            type="text"
            placeholder="ค้นหาด้วยชื่อ, HN..."
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
            className="pl-10"
                />
            </div>

        <div className="flex items-center gap-2 ml-4">
          <Button variant="outline" size="icon" onClick={handlePrevDay}>
            <ChevronLeft className="h-4 w-4" />
              </Button>
          
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
              <Button variant="outline" className="min-w-[240px] justify-start text-left font-normal">
                <Calendar className="mr-2 h-4 w-4" />
                {format(selectedDate, 'dd/MM/yyyy')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                    initialFocus
                locale={th}
                  />
                </PopoverContent>
              </Popover>
          
          <Button variant="outline" size="icon" onClick={handleNextDay}>
            <ChevronRight className="h-4 w-4" />
              </Button>
        </div>
      </div>

      {/* Table tabs */}
      {(shouldShowTables || isChineseMedicine) && (
        <Tabs value={activeTable} className="mb-6" onValueChange={setActiveTable}>
          <TabsList>
            {getTableLabels().map((label, index) => {
              const tabValue = index === getTableLabels().length - 1 ? 'summary' : `table${index + 1}`;
              
              // คำนวณจำนวนนัดหมายสำหรับแต่ละแท็บ
              let appointmentCount = 0;
              
              if (appointmentData && appointmentData.length > 0) {
                const isPhysioTherapy = department === 'กายภาพบำบัด' || department === 'กายภาพ';
                
                if (tabValue === 'summary' && isPhysioTherapy) {
                  // สำหรับเคสรวม นับเฉพาะรายการที่มี table_number เป็น null
                  appointmentCount = appointmentData.filter(apt => 
                    apt && apt.table_number === null && 
                    (!searchName || 
                      apt.full_name?.toLowerCase().includes(searchName.toLowerCase()) || 
                      apt.hn?.toLowerCase().includes(searchName.toLowerCase()))
                  ).length;
                } else if (isPhysioTherapy) {
                  // สำหรับโต๊ะอื่นๆ ในแผนกกายภาพบำบัด/กายภาพ
                  const tableNumber = parseInt(tabValue.replace('table', ''));
                  appointmentCount = appointmentData.filter(apt => 
                    apt && apt.table_number === tableNumber &&
                    (!searchName || 
                      apt.full_name?.toLowerCase().includes(searchName.toLowerCase()) || 
                      apt.hn?.toLowerCase().includes(searchName.toLowerCase()))
                  ).length;
                } else {
                  // สำหรับแผนกอื่นๆ
                  appointmentCount = appointmentData.filter(apt => 
                    apt && (!searchName || 
                      apt.full_name?.toLowerCase().includes(searchName.toLowerCase()) || 
                      apt.hn?.toLowerCase().includes(searchName.toLowerCase()))
                  ).length;
                }
              }
              
              return (
                <TabsTrigger 
                  key={index} 
                  value={tabValue}
                >
                  {label}
                  {appointmentCount > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {appointmentCount}
                    </Badge>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>
      )}

      {/* Appointments list */}
      <div className="space-y-4">
        {getCurrentAppointments().length === 0 ? (
        <div className="text-center py-10 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p>ไม่พบนัดหมายในวันที่เลือก</p>
            <p className="text-sm text-gray-400">
              {format(selectedDate, 'dd MMMM yyyy', { locale: th })}
            </p>
        </div>
      ) : (
          <>
            <div className="mb-4">
              <h2 className="text-lg font-semibold">
                นัดหมายวันที่ {format(selectedDate, 'dd MMMM yyyy', { locale: th })}
              </h2>
              <p className="text-sm text-gray-500">
                พบ {getCurrentAppointments().length} รายการ
              </p>
        </div>
            {getCurrentAppointments().map(appointment => renderAppointmentCard(appointment))}
          </>
      )}
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>ยืนยันการลบนัดหมาย</DialogTitle>
            <DialogDescription>
              ต้องการลบนัดหมายของ {appointmentToDelete?.full_name || 'ผู้ป่วย'} ใช่หรือไม่?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="submit" onClick={() => {
              handleDeleteAppointment(appointmentToDelete);
              setDeleteConfirmOpen(false);
            }}>ยืนยัน</Button>
            <Button type="button" variant="outline" onClick={() => setDeleteConfirmOpen(false)}>ยกเลิก</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AppointmentTabs;
