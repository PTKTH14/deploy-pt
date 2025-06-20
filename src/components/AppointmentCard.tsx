import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, ArrowRight, X, Edit, Calendar as CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';

interface AppointmentCardProps {
  appointment: any;
  onStatusChange: (id: string, status: string, rescheduleData?: {date?: Date, time?: string}) => void;
  onEdit: (appointment: any) => void;
}

const AppointmentCard: React.FC<AppointmentCardProps> = ({ appointment, onStatusChange, onEdit }) => {
  const [showReschedule, setShowReschedule] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState<Date | null>(null);
  const [rescheduleTime, setRescheduleTime] = useState('');

  const getAppointmentKey = (appointment: any): string => {
    if (appointment.id) return String(appointment.id);
    return `${appointment.hn}-${appointment.appointment_date}-${appointment.appointment_time || ''}`;
  };

  // Determine card border color by status
  const getCardStyle = (status: string) => {
    switch (status) {
      case 'attended':
        return 'border-l-green-500 bg-green-50';
      case 'rescheduled':
        return 'border-l-yellow-500 bg-yellow-50';
      case 'missed':
      case 'cancelled':
        return 'border-l-red-500 bg-red-50';
      default:
        return 'border-l-blue-400';
    }
  };

  return (
    <Card className={`mb-4 border-l-4 transition-all duration-200 ${getCardStyle(appointment.status)}`}>
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg mb-1">{appointment.full_name}</h3>
        <p className="text-gray-600 mb-1">{appointment.appointment_date} {appointment.appointment_time && `เวลา ${appointment.appointment_time}`}</p>
        <p className="text-gray-500 text-sm mb-3">
          {appointment.hn} / {appointment.center || 'ไม่ระบุศูนย์'}
          {appointment.table_number && ` / โต๊ะ ${appointment.table_number}`}
        </p>
        <div className="flex gap-2 flex-wrap mb-2">
          <Button size="sm" className="bg-green-500 hover:bg-green-600 text-white rounded-md" onClick={() => onStatusChange(getAppointmentKey(appointment), 'attended')}>
            <Check className="w-4 h-4 mr-1" /> มาตามนัด
          </Button>
          <Popover open={showReschedule} onOpenChange={setShowReschedule}>
            <PopoverTrigger asChild>
              <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white rounded-md">
                <ArrowRight className="w-4 h-4 mr-1" /> เลื่อน
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-4">
              <div className="mb-2">
                <label className="block text-sm font-medium mb-1">วันที่ใหม่</label>
                <Input type="date" value={rescheduleDate ? format(rescheduleDate, 'yyyy-MM-dd') : ''} onChange={e => setRescheduleDate(e.target.value ? new Date(e.target.value) : null)} />
              </div>
              <div className="mb-2">
                <label className="block text-sm font-medium mb-1">เวลาใหม่</label>
                <Input type="time" value={rescheduleTime} onChange={e => setRescheduleTime(e.target.value)} />
              </div>
              <div className="flex gap-2 mt-2">
                <Button size="sm" className="bg-yellow-600 hover:bg-yellow-700 text-white" disabled={!rescheduleDate || !rescheduleTime} onClick={() => { onStatusChange(getAppointmentKey(appointment), 'rescheduled', {date: rescheduleDate!, time: rescheduleTime}); setShowReschedule(false); }}>
                  ยืนยัน
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowReschedule(false)}>ยกเลิก</Button>
              </div>
            </PopoverContent>
          </Popover>
          <Button size="sm" className="bg-red-500 hover:bg-red-600 text-white rounded-md" onClick={() => onStatusChange(getAppointmentKey(appointment), 'missed')}>
            <X className="w-4 h-4 mr-1" /> ผิดนัด
          </Button>
          <Button size="sm" variant="outline" className="border-gray-400 text-gray-600 hover:bg-gray-50 rounded-md" onClick={() => onStatusChange(getAppointmentKey(appointment), 'cancelled')}>
            ยกเลิก
          </Button>
          <Button size="sm" className="bg-blue-500 hover:bg-blue-600 text-white rounded-md" onClick={() => onEdit(appointment)}>
            <Edit className="w-4 h-4 mr-1" /> แก้ไข
          </Button>
        </div>
        {/* Status indicator */}
        {appointment.status === 'attended' && <span className="text-green-600 font-medium">✅ มาตามนัดแล้ว</span>}
        {appointment.status === 'rescheduled' && <span className="text-yellow-600 font-medium">📅 เลื่อนนัดแล้ว</span>}
        {appointment.status === 'missed' && <span className="text-red-600 font-medium">❌ ผิดนัด</span>}
        {appointment.status === 'cancelled' && <span className="text-red-600 font-medium">❌ ยกเลิกแล้ว</span>}
      </CardContent>
    </Card>
  );
};

export default AppointmentCard; 