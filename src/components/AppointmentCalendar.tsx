
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useAppointments } from '@/hooks/useAppointments';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface AppointmentCalendarProps {
  department?: string;
  center?: 'รพ.สต.ต้า' | 'รพ.สต.พระเนตร' | 'ทต.ป่าตาล';
}

const AppointmentCalendar = ({ department = "กายภาพ", center }: AppointmentCalendarProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showAppointmentList, setShowAppointmentList] = useState(false);
  
  // Fetch appointments for the current month
  const startDate = format(startOfMonth(currentDate), 'yyyy-MM-dd');
  const endDate = format(endOfMonth(currentDate), 'yyyy-MM-dd');
  
  const { data: appointments = [] } = useAppointments({
    department: department === "กายภาพ" ? "กายภาพบำบัด" : department,
    center
  });

  // Fetch appointments for selected date
  const { data: selectedDateAppointments = [] } = useAppointments({
    department: department === "กายภาพ" ? "กายภาพบำบัด" : department,
    date: selectedDate || undefined,
    center
  });

  // Count appointments per day
  const appointmentCounts = appointments.reduce((acc, appointment) => {
    if (appointment.appointment_date) {
      const day = new Date(appointment.appointment_date).getDate();
      acc[day] = (acc[day] || 0) + 1;
    }
    return acc;
  }, {} as Record<number, number>);

  const months = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getDayStyle = (day: number) => {
    const count = appointmentCounts[day] || 0;
    
    if (count === 0) {
      return 'bg-gray-50 text-gray-400';
    } else if (count < 8) {
      return 'bg-green-100 text-green-800';
    } else if (count >= 8 && count < 12) {
      return 'bg-yellow-100 text-yellow-800';
    } else {
      return 'bg-red-100 text-red-800';
    }
  };

  const handleDayClick = (day: number) => {
    const clickedDate = format(new Date(currentDate.getFullYear(), currentDate.getMonth(), day), 'yyyy-MM-dd');
    setSelectedDate(clickedDate);
    setShowAppointmentList(true);
  };

  const renderCalendarDay = (day: number, isCurrentMonth: boolean = true, index: number) => {
    if (!isCurrentMonth) {
      return (
        <div key={`prev-next-${index}`} className="h-16 p-1 text-gray-300 text-sm">
          {day}
        </div>
      );
    }

    const count = appointmentCounts[day] || 0;
    const isToday = day === new Date().getDate() && 
                   currentDate.getMonth() === new Date().getMonth() && 
                   currentDate.getFullYear() === new Date().getFullYear();

    return (
      <div 
        key={`current-${day}`}
        onClick={() => handleDayClick(day)}
        className={`h-16 p-1 text-sm cursor-pointer transition-all duration-200 relative
          ${getDayStyle(day)} 
          ${isToday ? 'ring-2 ring-blue-400 rounded-md' : ''}
          hover:ring-1 hover:ring-gray-300 hover:rounded-md`}
      >
        <div className="font-medium">{day}</div>
        {count > 0 && (
          <div className="text-xs mt-1">
            {count} คน
          </div>
        )}
      </div>
    );
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];
    let dayIndex = 0;
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      const prevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 0);
      const prevMonthDays = prevMonth.getDate();
      const dayNumber = prevMonthDays - firstDay + i + 1;
      days.push(renderCalendarDay(dayNumber, false, dayIndex++));
    }
    
    // Add days of the current month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(renderCalendarDay(day, true, dayIndex++));
    }
    
    // Fill remaining cells with next month's days
    const totalCells = 42; // 6 rows × 7 days
    const remainingCells = totalCells - days.length;
    for (let day = 1; day <= remainingCells; day++) {
      days.push(renderCalendarDay(day, false, dayIndex++));
    }
    
    return days;
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>ปฏิทินนัดหมาย {center && `- ${center}`}</span>
            <div className="flex items-center gap-4">
              <button 
                className="p-1 hover:bg-gray-100 rounded transition-colors"
                onClick={() => navigateMonth('prev')}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-normal min-w-[120px] text-center">
                {months[currentDate.getMonth()]} {currentDate.getFullYear()}
              </span>
              <button 
                className="p-1 hover:bg-gray-100 rounded transition-colors"
                onClick={() => navigateMonth('next')}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </CardTitle>
          
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-100 border border-green-200 rounded"></div>
              <span>ว่าง (&lt; 8)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-100 border border-yellow-200 rounded"></div>
              <span>เกือบเต็ม (8-11)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-100 border border-red-200 rounded"></div>
              <span>เต็ม (≥12)</span>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-7 gap-1 text-center">
            {/* Header */}
            <div className="font-semibold py-2 text-sm text-gray-600">อา</div>
            <div className="font-semibold py-2 text-sm text-gray-600">จ</div>
            <div className="font-semibold py-2 text-sm text-gray-600">อ</div>
            <div className="font-semibold py-2 text-sm text-gray-600">พ</div>
            <div className="font-semibold py-2 text-sm text-gray-600">พฤ</div>
            <div className="font-semibold py-2 text-sm text-gray-600">ศ</div>
            <div className="font-semibold py-2 text-sm text-gray-600">ส</div>
            
            {/* Calendar Days */}
            {renderCalendar()}
          </div>
        </CardContent>
      </Card>

      {/* Appointment List Dialog */}
      <Dialog open={showAppointmentList} onOpenChange={setShowAppointmentList}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>
                รายการนัดหมายวันที่ {selectedDate && format(new Date(selectedDate), 'dd/MM/yyyy')}
                {center && ` - ${center}`}
              </span>
              <button
                onClick={() => setShowAppointmentList(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </DialogTitle>
          </DialogHeader>
          
          <div className="max-h-96 overflow-y-auto">
            {selectedDateAppointments.length > 0 ? (
              <div className="space-y-3">
                {selectedDateAppointments.map((appointment, index) => (
                  <div key={index} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-lg">{appointment.full_name || 'ไม่ระบุชื่อ'}</h3>
                      <span className="text-sm text-gray-500">
                        {appointment.appointment_time || 'ไม่ระบุเวลา'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p><span className="font-medium">HN:</span> {appointment.hn || 'ไม่ระบุ'}</p>
                      <p><span className="font-medium">แผนก:</span> {appointment.departments?.join(', ') || 'ไม่ระบุ'}</p>
                      <p><span className="font-medium">โต๊ะ:</span> {appointment.table_number ? `โต๊ะ ${appointment.table_number}` : 'เคสรวม'}</p>
                      {appointment.phone_number && (
                        <p><span className="font-medium">เบอร์โทร:</span> {appointment.phone_number}</p>
                      )}
                      {appointment.note && (
                        <p><span className="font-medium">หมายเหตุ:</span> {appointment.note}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>ไม่มีนัดหมายในวันที่เลือก</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AppointmentCalendar;
