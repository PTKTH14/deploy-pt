import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Edit, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useAppointments } from '@/hooks/useAppointments';
import { format, startOfMonth, endOfMonth, isValid } from 'date-fns';
import type { Appointment, CenterType, AppointmentStatus } from '@/types/appointment';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useQueryClient } from '@tanstack/react-query';

interface AppointmentCalendarProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  department?: string;
  center?: CenterType;
}

const AppointmentCalendar: React.FC<AppointmentCalendarProps> = ({ selectedDate, onDateChange, department, center }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [unavailableDays, setUnavailableDays] = useState<string[]>([]);
  const [publicHolidays, setPublicHolidays] = useState<string[]>([]);
  const [editForm, setEditForm] = useState<any>({});
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState<Appointment | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Validate dates
  const validSelectedDate = isValid(selectedDate) ? selectedDate : new Date();
  const validCurrentDate = isValid(currentDate) ? currentDate : new Date();

  // Get first and last day of current month
  const firstDayOfMonth = startOfMonth(validCurrentDate);
  const lastDayOfMonth = endOfMonth(validCurrentDate);

  // Format dates for API
  const startDate = format(firstDayOfMonth, 'yyyy-MM-dd');
  const endDate = format(lastDayOfMonth, 'yyyy-MM-dd');

  console.log('Date range for appointments:', { startDate, endDate });

  // Use the useAppointments hook with date range
  const { data: appointments = [], isLoading } = useAppointments({
    dateRange: {
      start: startDate,
      end: endDate
    },
    department,
    center
  });

  // Debug appointments data changes
  useEffect(() => {
    console.log(`Appointments data updated: ${appointments.length} appointments received`);
    // Log appointments by date
    const dateMap = new Map();
    appointments.forEach(apt => {
      if (!apt.appointment_date) return;
      
      if (!dateMap.has(apt.appointment_date)) {
        dateMap.set(apt.appointment_date, 0);
      }
      dateMap.set(apt.appointment_date, dateMap.get(apt.appointment_date) + 1);
    });
    
    console.log('Appointments by date:');
    dateMap.forEach((count, date) => {
      console.log(`${date}: ${count} appointments`);
    });
  }, [appointments]);

  // Transform appointments into a map for faster lookup
  const appointmentMap = useMemo(() => {
    console.log('Building appointment map from:', appointments.length, 'appointments');
    const map = new Map<string, Appointment[]>();
    
    // กรองข้อมูลที่ซ้ำกันออกก่อนสร้าง map
    const uniqueAppointments = Array.from(
      new Map(
        appointments.map(apt => [apt.id || `${apt.hn}-${apt.appointment_date}-${apt.appointment_time}`, apt])
      ).values()
    );
    
    uniqueAppointments.forEach(apt => {
      if (!apt.appointment_date) {
        console.warn('Appointment missing date:', apt.id);
        return;
      }
      
      const dateStr = apt.appointment_date;
      if (!map.has(dateStr)) {
        map.set(dateStr, []);
      }
      map.get(dateStr)?.push(apt);
    });
    
    // Log appointment counts by date
    map.forEach((appts, date) => {
      console.log(`Date ${date}: ${appts.length} appointments`);
    });
    
    return map;
  }, [appointments]);

  // เมื่อเลือกแก้ไขนัดหมาย
  useEffect(() => {
    if (editingAppointment) {
      setEditForm({
        full_name: editingAppointment.full_name || '',
        phone_number: editingAppointment.phone_number || '',
        appointment_date: editingAppointment.appointment_date || '',
        appointment_time: editingAppointment.appointment_time || '',
      });
    }
  }, [editingAppointment]);

  // ฟังก์ชันสำหรับการแก้ไขนัดหมาย
  const handleSaveEdit = async () => {
    try {
      if (!editingAppointment?.id || !editForm.appointment_date) {
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
        .eq('id', editingAppointment.id)
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

      setEditingAppointment(null);
      setEditForm({});
    } catch (error: any) {
      console.error('Error in handleSaveEdit:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถแก้ไขนัดหมายได้ กรุณาลองใหม่อีกครั้ง",
        variant: "destructive",
      });
    }
  };

  // ฟังก์ชันสำหรับการลบนัดหมาย
  const handleDeleteAppointment = async () => {
    try {
      if (!appointmentToDelete?.id) {
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
        .eq('id', appointmentToDelete.id);

      if (error) {
        console.error('Error deleting appointment:', error);
        throw new Error(error.message);
      }

      toast({
        title: 'ลบนัดหมายสำเร็จ',
        description: `ลบนัดหมายของ ${appointmentToDelete.full_name} เรียบร้อยแล้ว`,
      });

      // รีเฟรชข้อมูลนัดหมาย
      await queryClient.invalidateQueries({ 
        queryKey: ['appointments']
      });

      setDeleteConfirmOpen(false);
      setAppointmentToDelete(null);
    } catch (error: any) {
      console.error('Error in handleDeleteAppointment:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถลบนัดหมายได้ กรุณาลองใหม่อีกครั้ง",
        variant: "destructive",
      });
    }
  };

  // Get appointments for a specific date
  const getAppointmentsForDate = (date: Date): Appointment[] => {
    if (!isValid(date)) {
      console.warn('Invalid date provided to getAppointmentsForDate:', date);
      return [];
    }
    const dateStr = format(date, 'yyyy-MM-dd');
    const appointments = appointmentMap.get(dateStr) || [];
    console.log(`Getting appointments for date ${dateStr}: found ${appointments.length} appointments`);
    return appointments;
  };

  // Format date for comparison (YYYY-MM-DD)
  const formatDateForComparison = (date: Date): string => {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      return '';
    }
    return format(date, 'yyyy-MM-dd');
  };

  // Get days in month with appointment counts
  function getDaysInMonth(date: Date) {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      console.warn('Invalid date provided to getDaysInMonth:', date);
      return [];
    }

    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();
    const days = [];

    // Add empty cells for days before the first of the month
    for (let i = 0; i < startDayOfWeek; i++) days.push(null);

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDay = new Date(year, month, day);
      const dateStr = format(currentDay, 'yyyy-MM-dd');
      
      // Get appointments from the map for better performance
      const appointments = appointmentMap.get(dateStr) || [];
      
      // Debug appointment count for specific dates with appointments
      if (appointments.length > 0) {
        console.log(`Date ${dateStr} has ${appointments.length} appointments in calendar view`);
      }
      
      days.push({
        day,
        date: currentDay,
        appointmentCount: appointments.length,
        isToday: format(currentDay, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd'),
        isSelected: format(currentDay, 'yyyy-MM-dd') === format(validSelectedDate, 'yyyy-MM-dd'),
        isUnavailable: unavailableDays.includes(dateStr),
        isHoliday: publicHolidays.includes(dateStr)
      });
    }

    return days;
  }

  // Handle date selection
  const handleDateClick = (dateObj: { date: Date }) => {
    if (dateObj && onDateChange) {
      onDateChange(dateObj.date);
    }
  };

  // Handle month navigation
  const navigateMonth = (direction: number) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  // Get status color for appointment cards
  const getStatusColor = (status: AppointmentStatus): string => {
    switch (status) {
      case 'เสร็จสิ้น':
      case 'completed':
        return 'border-green-500 bg-green-50 text-green-700';
      case 'cancelled':
        return 'border-red-500 bg-red-50 text-red-700';
      case 'rescheduled':
        return 'border-yellow-500 bg-yellow-50 text-yellow-700';
      default:
        return 'border-blue-500 bg-blue-50 text-blue-700';
    }
  };

  // Fetch special days data
  useEffect(() => {
    const fetchSpecialDays = async () => {
      const startStr = formatDateForComparison(firstDayOfMonth);
      const endStr = formatDateForComparison(lastDayOfMonth);
      
      const [unavailableRes, holidaysRes] = await Promise.all([
        supabase
        .from('unavailable_days')
        .select('date')
        .gte('date', startStr)
          .lte('date', endStr),
        supabase
        .from('public_holidays')
        .select('date')
        .gte('date', startStr)
          .lte('date', endStr)
      ]);

      if (!unavailableRes.error && unavailableRes.data) {
        setUnavailableDays(unavailableRes.data.map(d => d.date));
      }
      
      if (!holidaysRes.error && holidaysRes.data) {
        setPublicHolidays(holidaysRes.data.map(d => d.date));
      }
    };

    fetchSpecialDays();
  }, [currentDate, firstDayOfMonth, lastDayOfMonth]);

  const selectedDateAppointments = getAppointmentsForDate(selectedDate);
  const days = getDaysInMonth(currentDate);

  const thaiMonths = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];

  const thaiDays = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full">
      {/* Calendar Section */}
      <div className="lg:w-1/2">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">
            {thaiMonths[currentDate.getMonth()]} {currentDate.getFullYear() + 543}
          </h2>
            <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateMonth(-1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateMonth(1)}
              >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
        )}

              {/* Calendar Grid */}
        {!isLoading && (
              <div className="grid grid-cols-7 gap-1">
                {thaiDays.map(day => (
                  <div key={day} className="p-3 text-center font-semibold text-gray-600 bg-gray-50">
                    {day}
                  </div>
                ))}
                {days.map((dateObj, index) => (
                  <div key={index} className="aspect-square">
                    {dateObj ? (
                      <button
                        onClick={() => handleDateClick(dateObj)}
                        className={`
                          w-full h-full p-1 text-sm rounded-lg transition-all duration-200 relative
                          ${dateObj.isSelected
                            ? 'bg-blue-600 text-white shadow-lg'
                            : (() => {
                            if (dateObj.isUnavailable) return 'bg-gray-200 text-gray-400 cursor-not-allowed';
                            if (dateObj.isHoliday) return 'bg-red-100 text-red-800';
                            if (dateObj.date.getDay() === 0) return 'bg-gray-50 text-gray-900';
                            if (dateObj.appointmentCount >= 12) return 'bg-red-500 text-white';
                            if (dateObj.appointmentCount >= 8) return 'bg-yellow-400 text-gray-900';
                            return dateObj.appointmentCount > 0 ? 'bg-green-500 text-white' : 'bg-white text-gray-900';
                              })()
                          }
                        `}
                    disabled={dateObj.isUnavailable}
                      >
                        <div className="flex flex-col items-center justify-center h-full">
                          <span className="font-medium">{dateObj.day}</span>
                          {dateObj.appointmentCount > 0 && (
                            <div className={`
                              w-5 h-5 rounded-full text-xs flex items-center justify-center mt-1
                              ${dateObj.isSelected
                                ? 'bg-white text-blue-600'
                                  : 'bg-white text-gray-900 border border-gray-300'}
                            `}>
                              {dateObj.appointmentCount}
                            </div>
                          )}
                        </div>
                      </button>
                    ) : (
                      <div className="w-full h-full"></div>
                    )}
                  </div>
                ))}
              </div>
        )}
          </div>

          {/* Appointments List Section */}
          <div className="lg:w-1/2 p-6">
            <div className="mb-4">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                นัดหมายวันที่ {selectedDate.getDate()} {thaiMonths[selectedDate.getMonth()]} {selectedDate.getFullYear() + 543}
              </h3>
              <p className="text-gray-600">
                {selectedDateAppointments.length > 0 
                  ? `มีนัดหมาย ${selectedDateAppointments.length} รายการ`
                  : 'ไม่มีนัดหมายในวันนี้'
                }
              </p>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto">
          {selectedDateAppointments.map((appointment) => (
            <div
              key={appointment.id}
              className={`p-4 rounded-lg border-l-4 ${getStatusColor(appointment.status)}`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold">{appointment.full_name}</h4>
                  <p className="text-sm text-gray-600">HN: {appointment.hn}</p>
                  <p className="text-sm text-gray-600">
                    เวลา: {appointment.appointment_time || 'ไม่ระบุ'}
                  </p>
                    </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline"
                          size="sm" 
                          className="bg-blue-500 hover:bg-blue-600 text-white"
                          onClick={() => setEditingAppointment(appointment)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline"
                          size="sm" 
                          className="bg-red-600 hover:bg-red-700 text-white"
                          onClick={() => {
                            setAppointmentToDelete(appointment);
                            setDeleteConfirmOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
        </div>
      </div>

      {/* Edit Dialog */}
      {editingAppointment && (
        <Dialog open={!!editingAppointment} onOpenChange={(open) => !open && setEditingAppointment(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>แก้ไขนัดหมาย</DialogTitle>
              <DialogDescription>
                แก้ไขข้อมูลนัดหมายของ {editingAppointment?.full_name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label htmlFor="full_name" className="text-sm font-medium">ชื่อ-นามสกุล</label>
                <Input
                  id="full_name"
                  value={editForm.full_name || ''}
                  onChange={(e) => setEditForm({...editForm, full_name: e.target.value})}
                  placeholder="ชื่อ-นามสกุล"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="phone_number" className="text-sm font-medium">เบอร์โทรศัพท์</label>
                <Input
                  id="phone_number"
                  value={editForm.phone_number || ''}
                  onChange={(e) => setEditForm({...editForm, phone_number: e.target.value})}
                  placeholder="เบอร์โทรศัพท์"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="appointment_date" className="text-sm font-medium">วันที่นัด</label>
                <Input
                  id="appointment_date"
                  type="date"
                  value={editForm.appointment_date || ''}
                  onChange={(e) => setEditForm({...editForm, appointment_date: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="appointment_time" className="text-sm font-medium">เวลานัด</label>
                <Input
                  id="appointment_time"
                  type="time"
                  value={editForm.appointment_time || ''}
                  onChange={(e) => setEditForm({...editForm, appointment_time: e.target.value})}
                />
              </div>
              </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingAppointment(null)}>ยกเลิก</Button>
              <Button onClick={handleSaveEdit}>บันทึก</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      {appointmentToDelete && (
        <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>ยืนยันการลบนัดหมาย</DialogTitle>
              <DialogDescription>
                ต้องการลบนัดหมายของ {appointmentToDelete?.full_name} ใช่หรือไม่?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>ยกเลิก</Button>
              <Button variant="destructive" onClick={handleDeleteAppointment}>ยืนยัน</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default AppointmentCalendar;
