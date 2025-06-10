
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, ArrowRight, Clock, Calendar, Edit, X, Search } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useAppointments } from '@/hooks/useAppointments';

interface AppointmentTabsProps {
  department?: string;
}

const AppointmentTabs = ({
  department = 'กายภาพ'
}: AppointmentTabsProps) => {
  const [activeTable, setActiveTable] = useState('table1');
  const [appointmentStatuses, setAppointmentStatuses] = useState({});
  const [rescheduleDate, setRescheduleDate] = useState(null);
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [showReschedule, setShowReschedule] = useState(null);
  
  // Filter states
  const [searchName, setSearchName] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedAppointmentType, setSelectedAppointmentType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Use real appointment data with filters
  const { data: appointmentData = [], isLoading, error } = useAppointments({
    department: department,
    date: selectedDate || undefined
  });

  console.log('AppointmentTabs - Raw data:', appointmentData);
  console.log('AppointmentTabs - Department:', department);

  // Check if department should show table tabs
  const shouldShowTables = department === 'กายภาพ' || department === 'แผนจีน';

  // Filter appointments based on search criteria and table
  const filterAppointments = (appointments: any[], tableFilter?: string) => {
    if (!appointments) return [];
    
    let filteredAppointments = [...appointments];

    // Filter by table for departments that have tables
    if (shouldShowTables && tableFilter) {
      if (tableFilter === 'summary') {
        // For summary tab, show appointments that belong to multiple departments (joint cases)
        filteredAppointments = filteredAppointments.filter(appointment => 
          appointment.departments && appointment.departments.length > 1
        );
      } else {
        // For specific table tabs, filter by table number
        const tableNumber = tableFilter.replace('table', '');
        filteredAppointments = filteredAppointments.filter(appointment => 
          appointment.table_number === parseInt(tableNumber)
        );
      }
    }

    // Apply other filters
    return filteredAppointments.filter(appointment => {
      const matchesName = !searchName || appointment.full_name?.toLowerCase().includes(searchName.toLowerCase());
      const matchesDate = !selectedDate || appointment.appointment_date === selectedDate;
      const matchesDepartment = selectedDepartment === 'all' || 
        (appointment.departments && appointment.departments.some((dept: string) => 
          dept.includes(selectedDepartment) || selectedDepartment.includes(dept)
        ));
      const matchesAppointmentType = selectedAppointmentType === 'all' || 
        appointment.appointment_type === selectedAppointmentType;
      const matchesStatus = selectedStatus === 'all' || appointment.status === selectedStatus;
      
      return matchesName && matchesDate && matchesDepartment && matchesAppointmentType && matchesStatus;
    });
  };

  const handleStatusChange = (appointmentId: string, status: string) => {
    setAppointmentStatuses(prev => ({
      ...prev,
      [appointmentId]: status
    }));
  };

  const handleReschedule = (appointmentId: string) => {
    if (rescheduleDate && rescheduleTime) {
      handleStatusChange(appointmentId, 'rescheduled');
      setShowReschedule(null);
      setRescheduleDate(null);
      setRescheduleTime('');
      console.log(`Rescheduled appointment ${appointmentId} to ${format(rescheduleDate, 'dd/MM/yyyy')} at ${rescheduleTime}`);
    }
  };

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

  const renderJointCaseCard = (appointment: any, index: number) => (
    <Card key={appointment.id || index} className={cn("mb-4 border transition-all duration-200", getCardStyle(appointment.id))}>
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
            onClick={() => handleStatusChange(appointment.id, 'attended')}
          >
            <Check className="w-4 h-4 mr-1" />
            มาตามนัด
          </Button>
          
          <Button 
            size="sm" 
            className="bg-orange-500 hover:bg-orange-600 text-white rounded-md"
            onClick={() => setShowReschedule(appointment.id)}
          >
            <Clock className="w-4 h-4 mr-1" />
            เลื่อนนัด
          </Button>
          
          <Button 
            size="sm" 
            className="bg-red-500 hover:bg-red-600 text-white rounded-md"
            onClick={() => handleStatusChange(appointment.id, 'missed')}
          >
            <X className="w-4 h-4 mr-1" />
            ผิดนัด
          </Button>
          
          <Button 
            size="sm" 
            variant="outline" 
            className="border-gray-400 text-gray-600 hover:bg-gray-50 rounded-md"
            onClick={() => handleStatusChange(appointment.id, 'cancelled')}
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
        {appointmentStatuses[appointment.id] && (
          <div className="mt-3 text-sm">
            {appointmentStatuses[appointment.id] === 'attended' && <span className="text-green-600 font-medium">✅ มาตามนัดแล้ว</span>}
            {appointmentStatuses[appointment.id] === 'rescheduled' && <span className="text-yellow-600 font-medium">📅 เลื่อนนัดแล้ว</span>}
            {appointmentStatuses[appointment.id] === 'cancelled' && <span className="text-red-600 font-medium">❌ ยกเลิกแล้ว</span>}
            {appointmentStatuses[appointment.id] === 'missed' && <span className="text-red-600 font-medium">❌ ผิดนัด</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderAppointmentCard = (appointment: any, index: number) => {
    // Use special card for joint cases
    if (department === 'เคสร่วม') {
      return renderJointCaseCard(appointment, index);
    }

    return (
      <Card key={appointment.id || index} className={cn("mb-4 border-l-4 transition-all duration-200", getCardStyle(appointment.id))}>
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
              onClick={() => handleStatusChange(appointment.id, 'attended')}
            >
              <Check className="w-4 h-4 mr-1" />
              มาตามนัด
            </Button>
            
            <Popover open={showReschedule === appointment.id} onOpenChange={open => setShowReschedule(open ? appointment.id : null)}>
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
                        <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !rescheduleDate && "text-muted-foreground")}>
                          <Calendar className="mr-2 h-4 w-4" />
                          {rescheduleDate ? format(rescheduleDate, "dd/MM/yyyy") : "เลือกวันที่"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <CalendarComponent mode="single" selected={rescheduleDate} onSelect={setRescheduleDate} initialFocus className="pointer-events-auto" />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">เวลาใหม่</label>
                    <Input type="time" value={rescheduleTime} onChange={e => setRescheduleTime(e.target.value)} />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleReschedule(appointment.id)} disabled={!rescheduleDate || !rescheduleTime} className="bg-yellow-600 hover:bg-yellow-700">
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
              className="bg-red-500 hover:bg-red-600 text-white rounded-md"
              onClick={() => handleStatusChange(appointment.id, 'cancelled')}
            >
              <Clock className="w-4 h-4 mr-1" />
              ยกเลิก
            </Button>
          </div>
          
          {/* Status indicator */}
          {appointmentStatuses[appointment.id] && (
            <div className="mt-3 text-sm">
              {appointmentStatuses[appointment.id] === 'attended' && <span className="text-green-600 font-medium">✅ มาตามนัดแล้ว</span>}
              {appointmentStatuses[appointment.id] === 'rescheduled' && <span className="text-yellow-600 font-medium">📅 เลื่อนนัดแล้ว</span>}
              {appointmentStatuses[appointment.id] === 'cancelled' && <span className="text-red-600 font-medium">❌ ยกเลิกแล้ว</span>}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // Get table labels based on department
  const getTableLabels = () => {
    if (department === 'กายภาพ') {
      return ['โต๊ะ 1', 'โต๊ะ 2', 'โต๊ะ 3', 'เคสรวม'];
    } else if (department === 'แผนจีน') {
      return ['โต๊ะ 1', 'โต๊ะ 2'];
    }
    return [];
  };

  const tableLabels = getTableLabels();

  // Get current appointments to display
  const getCurrentAppointments = () => {
    if (shouldShowTables) {
      return filterAppointments(appointmentData, activeTable);
    } else {
      return filterAppointments(appointmentData);
    }
  };

  const currentAppointments = getCurrentAppointments();

  if (isLoading) {
    return (
      <Card className="p-8 text-center">
        <p>กำลังโหลดข้อมูล...</p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-8 text-center text-red-500">
        <p>เกิดข้อผิดพลาดในการโหลดข้อมูล</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="ค้นหาผู้ป่วย..."
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Input
            type="date"
            placeholder="วันที่"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
          
          <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
            <SelectTrigger>
              <SelectValue placeholder="กรองตามแผนก" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทุกแผนก</SelectItem>
              <SelectItem value="กายภาพ">กายภาพ</SelectItem>
              <SelectItem value="แผนจีน">แผนจีน</SelectItem>
              <SelectItem value="แผนไทย">แผนไทย</SelectItem>
              <SelectItem value="เคสรวม">เคสรวม</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={selectedAppointmentType} onValueChange={setSelectedAppointmentType}>
            <SelectTrigger>
              <SelectValue placeholder="กรองตามประเภท" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทุกประเภท</SelectItem>
              <SelectItem value="in">นัดใน รพ.</SelectItem>
              <SelectItem value="out">นัดเยี่ยมนอก รพ.</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger>
              <SelectValue placeholder="กรองตามสถานะ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทุกสถานะ</SelectItem>
              <SelectItem value="new">ใหม่</SelectItem>
              <SelectItem value="confirmed">ยืนยันแล้ว</SelectItem>
              <SelectItem value="cancelled">ยกเลิก</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Table Tabs - Show for กายภาพ and แผนจีน */}
      {shouldShowTables && (
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          {tableLabels.map((label, index) => (
            <button
              key={index}
              onClick={() => setActiveTable(department === 'กายภาพ' && index === 3 ? 'summary' : `table${index + 1}`)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTable === (department === 'กายภาพ' && index === 3 ? 'summary' : `table${index + 1}`)
                  ? 'bg-white text-blue-600 shadow-sm border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Appointment Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          {currentAppointments.length > 0 ? (
            currentAppointments.map((appointment, index) => renderAppointmentCard(appointment, index))
          ) : (
            <Card className="p-8 text-center text-gray-500">
              <p>ไม่มีนัดหมายที่ตรงกับเงื่อนไขการค้นหา</p>
              {appointmentData.length === 0 && (
                <p className="text-sm mt-2">ยังไม่มีข้อมูลนัดหมายในระบบ</p>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppointmentTabs;
