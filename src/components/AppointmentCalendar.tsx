
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const AppointmentCalendar = () => {
  // Mock data for appointment counts per day
  const appointmentCounts = {
    1: 0, 2: 0, 3: 0, 4: 0, 5: 6, 6: 0, 7: 9,
    8: 12, 9: 3, 10: 11, 11: 6, 12: 0, 13: 0, 14: 0,
    15: 0, 16: 0, 17: 0, 18: 0, 19: 0, 20: 0, 21: 0,
    22: 0, 23: 0, 24: 0, 25: 0, 26: 0, 27: 0, 28: 0,
    29: 0, 30: 0
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

  const renderCalendarDay = (day: number, isCurrentMonth: boolean = true) => {
    if (!isCurrentMonth) {
      return (
        <div className="h-16 p-1 text-gray-300 text-sm">
          {day}
        </div>
      );
    }

    const count = appointmentCounts[day] || 0;
    const isSelected = day === 5; // Highlight day 5 as selected (like in the image)

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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>ปฏิทินนัดหมาย</span>
          <div className="flex items-center gap-4">
            <button className="p-1 hover:bg-gray-100 rounded">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-normal">มิถุนายน 2025</span>
            <button className="p-1 hover:bg-gray-100 rounded">
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
          
          {/* Calendar Days - First Week */}
          {renderCalendarDay(1)}
          {renderCalendarDay(2)}
          {renderCalendarDay(3)}
          {renderCalendarDay(4)}
          {renderCalendarDay(5)}
          {renderCalendarDay(6)}
          {renderCalendarDay(7)}
          
          {/* Second Week */}
          {renderCalendarDay(8)}
          {renderCalendarDay(9)}
          {renderCalendarDay(10)}
          {renderCalendarDay(11)}
          {renderCalendarDay(12)}
          {renderCalendarDay(13)}
          {renderCalendarDay(14)}
          
          {/* Third Week */}
          {renderCalendarDay(15)}
          {renderCalendarDay(16)}
          {renderCalendarDay(17)}
          {renderCalendarDay(18)}
          {renderCalendarDay(19)}
          {renderCalendarDay(20)}
          {renderCalendarDay(21)}
          
          {/* Fourth Week */}
          {renderCalendarDay(22)}
          {renderCalendarDay(23)}
          {renderCalendarDay(24)}
          {renderCalendarDay(25)}
          {renderCalendarDay(26)}
          {renderCalendarDay(27)}
          {renderCalendarDay(28)}
          
          {/* Fifth Week */}
          {renderCalendarDay(29)}
          {renderCalendarDay(30)}
          <div className="h-16 p-1 text-gray-300 text-sm">1</div>
          <div className="h-16 p-1 text-gray-300 text-sm">2</div>
          <div className="h-16 p-1 text-gray-300 text-sm">3</div>
          <div className="h-16 p-1 text-gray-300 text-sm">4</div>
          <div className="h-16 p-1 text-gray-300 text-sm">5</div>
          
          {/* Sixth Week */}
          <div className="h-16 p-1 text-gray-300 text-sm">6</div>
          <div className="h-16 p-1 text-gray-300 text-sm">7</div>
          <div className="h-16 p-1 text-gray-300 text-sm">8</div>
          <div className="h-16 p-1 text-gray-300 text-sm">9</div>
          <div className="h-16 p-1 text-gray-300 text-sm">10</div>
          <div className="h-16 p-1 text-gray-300 text-sm">11</div>
          <div className="h-16 p-1 text-gray-300 text-sm">12</div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AppointmentCalendar;
