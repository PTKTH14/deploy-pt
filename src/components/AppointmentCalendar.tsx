
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const AppointmentCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date(2025, 5)); // June 2025
  
  // Mock data for appointment counts per day - this could be passed as props later
  const appointmentCounts = {
    1: 0, 2: 0, 3: 0, 4: 0, 5: 6, 6: 0, 7: 9,
    8: 12, 9: 3, 10: 11, 11: 6, 12: 0, 13: 0, 14: 0,
    15: 0, 16: 0, 17: 0, 18: 0, 19: 0, 20: 0, 21: 0,
    22: 0, 23: 0, 24: 0, 25: 0, 26: 0, 27: 0, 28: 0,
    29: 0, 30: 0
  };

  const months = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];

  const navigateMonth = (direction) => {
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

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getDayStyle = (day) => {
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

  const renderCalendarDay = (day, isCurrentMonth = true) => {
    if (!isCurrentMonth) {
      return (
        <div className="h-16 p-1 text-gray-300 text-sm">
          {day}
        </div>
      );
    }

    const count = appointmentCounts[day] || 0;
    const isSelected = day === 5; // Highlight day 5 as selected

    return (
      <div 
        className={`h-16 p-1 text-sm cursor-pointer transition-all duration-200 relative
          ${getDayStyle(day)} 
          ${isSelected ? 'ring-2 ring-blue-400 rounded-md' : ''}
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
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      const prevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 0);
      const prevMonthDays = prevMonth.getDate();
      const dayNumber = prevMonthDays - firstDay + i + 1;
      days.push(renderCalendarDay(dayNumber, false));
    }
    
    // Add days of the current month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(renderCalendarDay(day, true));
    }
    
    // Fill remaining cells with next month's days
    const totalCells = 42; // 6 rows × 7 days
    const remainingCells = totalCells - days.length;
    for (let day = 1; day <= remainingCells; day++) {
      days.push(renderCalendarDay(day, false));
    }
    
    return days;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>ปฏิทินนัดหมาย</span>
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
            <span>เก็อบเต็ม (8-11)</span>
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
  );
};

export default AppointmentCalendar;
