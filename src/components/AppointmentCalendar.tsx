
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const AppointmentCalendar = () => {
  const calendarData = [
    [1, 2, 3, 4, 5, 6, 6, 3, 0],
    [8, 9, 10, 11, 12, 13, 14, 15, '-'],
    [15, 16, 17, 18, 19, 20, 21, 22, '-'],
    [22, 23, 24, 25, 26, 27, 28, 29, '-']
  ];

  const getDayClass = (day: any) => {
    if (day === '-' || day === 0) return 'text-gray-300';
    if (day === 6) return 'bg-blue-100 border border-blue-300 text-blue-600 rounded';
    if ([8, 9, 10, 11, 12, 18, 19, 25, 26].includes(day)) return 'text-green-600';
    return 'text-gray-900';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>ปฏิทินนัดหมาย</span>
          <span className="text-sm font-normal">มิถุนายน 2025</span>
        </CardTitle>
        
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>ว่าง (ต่ำกว่า 8)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-500 rounded"></div>
            <span>ใกล้เต็ม (8 ถึง 11)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span>เต็ม (12 หรือมากกว่า)</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-7 gap-1 text-center text-sm">
          {/* Header */}
          <div className="font-semibold py-2">อา</div>
          <div className="font-semibold py-2">จ</div>
          <div className="font-semibold py-2">อ</div>
          <div className="font-semibold py-2">พ</div>
          <div className="font-semibold py-2">พฤ</div>
          <div className="font-semibold py-2">ศ</div>
          <div className="font-semibold py-2">ส</div>
          
          {/* Calendar Days */}
          {calendarData.flat().map((day, index) => (
            <div
              key={index}
              className={`py-2 px-1 ${getDayClass(day)} cursor-pointer hover:bg-gray-100`}
            >
              {day}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default AppointmentCalendar;
