
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, ArrowRight, Clock, Calendar, Edit, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface AppointmentCardProps {
  appointment: any;
  index: number;
  appointmentStatuses: { [key: string]: string };
  rescheduleData: { [key: string]: { date: Date | null; time: string } };
  showReschedule: string | null;
  onStatusChange: (appointmentId: string, status: string) => void;
  onRescheduleDataUpdate: (appointmentId: string, field: string, value: any) => void;
  onReschedule: (appointmentId: string) => void;
  onShowReschedule: (appointmentId: string | null) => void;
  department: string;
}

const AppointmentCard = ({
  appointment,
  index,
  appointmentStatuses,
  rescheduleData,
  showReschedule,
  onStatusChange,
  onRescheduleDataUpdate,
  onReschedule,
  onShowReschedule,
  department
}: AppointmentCardProps) => {
  const getCardStyle = (appointmentId: string) => {
    const status = appointmentStatuses[appointmentId];
    switch (status) {
      case 'attended':
        return 'border-l-green-500 bg-green-50';
      case 'rescheduled':
        return 'border-l-yellow-500 bg-yellow-50';
      case 'cancelled':
        return 'border-l-red-500 bg-red-50';
      case 'missed':
        return 'border-l-red-500 bg-red-50';
      default:
        return 'border-l-blue-400';
    }
  };

  const renderJointCaseCard = () => (
    <Card key={appointment.appointment_id || index} className={cn("mb-4 border transition-all duration-200", getCardStyle(appointment.appointment_id))}>
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
            {appointment.table_number && (
              <Badge variant="outline">โต๊ะ: {appointment.table_number}</Badge>
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
        <div className="flex gap-2 flex-wrap">
          <Button 
            size="sm" 
            className="bg-green-500 hover:bg-green-600 text-white rounded-md"
            onClick={() => onStatusChange(appointment.appointment_id, 'attended')}
          >
            <Check className="w-4 h-4 mr-1" />
            มาตามนัด
          </Button>
          
          <Button 
            size="sm" 
            className="bg-orange-500 hover:bg-orange-600 text-white rounded-md"
            onClick={() => onShowReschedule(appointment.appointment_id)}
          >
            <Clock className="w-4 h-4 mr-1" />
            เลื่อนนัด
          </Button>
          
          <Button 
            size="sm" 
            className="bg-red-500 hover:bg-red-600 text-white rounded-md"
            onClick={() => onStatusChange(appointment.appointment_id, 'missed')}
          >
            <X className="w-4 h-4 mr-1" />
            ผิดนัด
          </Button>
          
          <Button 
            size="sm" 
            variant="outline" 
            className="border-gray-400 text-gray-600 hover:bg-gray-50 rounded-md"
            onClick={() => onStatusChange(appointment.appointment_id, 'cancelled')}
          >
            ยกเลิก
          </Button>
          
          <Button 
            size="sm" 
            className="bg-blue-500 hover:bg-blue-600 text-white rounded-md"
          >
            <Edit className="w-4 h-4 mr-1" />
            แก้ไข
          </Button>
        </div>
        
        {/* Status indicator */}
        {appointmentStatuses[appointment.appointment_id] && (
          <div className="mt-3 text-sm">
            {appointmentStatuses[appointment.appointment_id] === 'attended' && <span className="text-green-600 font-medium">✅ มาตามนัดแล้ว</span>}
            {appointmentStatuses[appointment.appointment_id] === 'rescheduled' && <span className="text-yellow-600 font-medium">📅 เลื่อนนัดแล้ว</span>}
            {appointmentStatuses[appointment.appointment_id] === 'cancelled' && <span className="text-red-600 font-medium">❌ ยกเลิกแล้ว</span>}
            {appointmentStatuses[appointment.appointment_id] === 'missed' && <span className="text-red-600 font-medium">❌ ผิดนัด</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );

  // Use special card for joint cases
  if (department === 'เคสร่วม') {
    return renderJointCaseCard();
  }

  const currentRescheduleData = rescheduleData[appointment.appointment_id] || { date: null, time: '' };

  return (
    <Card key={appointment.appointment_id || index} className={cn("mb-4 border-l-4 transition-all duration-200", getCardStyle(appointment.appointment_id))}>
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg mb-1">{appointment.full_name}</h3>
        <p className="text-gray-600 mb-1">{appointment.appointment_date} {appointment.appointment_time && `เวลา ${appointment.appointment_time}`}</p>
        <p className="text-gray-500 text-sm mb-3">
          {appointment.hn} / {appointment.center || 'ไม่ระบุศูนย์'} 
          {appointment.table_number && ` / โต๊ะ ${appointment.table_number}`}
        </p>
        
        <div className="flex gap-2 flex-wrap">
          <Button 
            size="sm" 
            className="bg-green-500 hover:bg-green-600 text-white rounded-md"
            onClick={() => onStatusChange(appointment.appointment_id, 'attended')}
          >
            <Check className="w-4 h-4 mr-1" />
            มาตามนัด
          </Button>
          
          <Popover open={showReschedule === appointment.appointment_id} onOpenChange={open => onShowReschedule(open ? appointment.appointment_id : null)}>
            <PopoverTrigger asChild>
              <Button 
                size="sm" 
                className="bg-orange-500 hover:bg-orange-600 text-white rounded-md"
              >
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
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !currentRescheduleData.date && "text-muted-foreground")}>
                        <Calendar className="mr-2 h-4 w-4" />
                        {currentRescheduleData.date ? format(currentRescheduleData.date, "dd/MM/yyyy") : "เลือกวันที่"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent 
                        mode="single" 
                        selected={currentRescheduleData.date} 
                        onSelect={(date) => onRescheduleDataUpdate(appointment.appointment_id, 'date', date)} 
                        initialFocus 
                        className="pointer-events-auto" 
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">เวลาใหม่</label>
                  <Input 
                    type="time" 
                    value={currentRescheduleData.time} 
                    onChange={e => onRescheduleDataUpdate(appointment.appointment_id, 'time', e.target.value)} 
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    onClick={() => onReschedule(appointment.appointment_id)} 
                    disabled={!currentRescheduleData.date || !currentRescheduleData.time} 
                    className="bg-yellow-600 hover:bg-yellow-700"
                  >
                    ยืนยันการเลื่อน
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => onShowReschedule(null)}
                  >
                    ยกเลิก
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          
          <Button 
            size="sm" 
            className="bg-red-500 hover:bg-red-600 text-white rounded-md"
            onClick={() => onStatusChange(appointment.appointment_id, 'cancelled')}
          >
            <Clock className="w-4 h-4 mr-1" />
            ยกเลิก
          </Button>
        </div>
        
        {/* Status indicator */}
        {appointmentStatuses[appointment.appointment_id] && (
          <div className="mt-3 text-sm">
            {appointmentStatuses[appointment.appointment_id] === 'attended' && <span className="text-green-600 font-medium">✅ มาตามนัดแล้ว</span>}
            {appointmentStatuses[appointment.appointment_id] === 'rescheduled' && <span className="text-yellow-600 font-medium">📅 เลื่อนนัดแล้ว</span>}
            {appointmentStatuses[appointment.appointment_id] === 'cancelled' && <span className="text-red-600 font-medium">❌ ยกเลิกแล้ว</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AppointmentCard;
