
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
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedAppointmentType, setSelectedAppointmentType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Check if department should show table tabs
  const shouldShowTables = department === 'กายภาพ' || department === 'แผนจีน';

  // Mock data based on department
  const getAppointmentData = () => {
    const baseData = {
      กายภาพ: {
        table1: [{
          id: '1',
          name: 'นงนุช คงอาศรี',
          time: 'วันนี้ 10:00',
          hn: 'HN 100094',
          location: 'รพ.สต.ภความิด',
          status: 'confirmed',
          appointmentType: 'นวดบำบัด',
          department: 'กายภาพ'
        }],
        table2: [],
        table3: [{
          id: '2',
          name: 'วิทวส นาคร่',
          time: 'วันนี้ 10:00',
          hn: 'HN 100599',
          location: 'รพ.สาพบามิด',
          status: 'pending',
          appointmentType: 'ฟื้นฟูสมรรถภาพ',
          department: 'กายภาพ'
        }],
        summary: [{
          id: '3',
          name: 'สมชาย ใจดี',
          time: 'วันนี้ 14:00',
          hn: 'HN 100123',
          location: 'เคสรวม',
          status: 'confirmed',
          appointmentType: 'เคสรวม',
          department: 'เคสรวม'
        }]
      },
      แผนจีน: {
        table1: [{
          id: '4',
          name: 'สมปอง ใจงาม',
          time: 'วันนี้ 09:00',
          hn: 'HN 100200',
          location: 'คลินิกแผนจีน โต๊ะ 1',
          status: 'confirmed',
          appointmentType: 'ฝังเข็ม',
          department: 'แผนจีน'
        }],
        table2: [{
          id: '5',
          name: 'วิไลวรรณ สุขสม',
          time: 'วันนี้ 11:00',
          hn: 'HN 100201',
          location: 'คลินิกแผนจีน โต๊ะ 2',
          status: 'pending',
          appointmentType: 'สมุนไพรจีน',
          department: 'แผนจีน'
        }],
        all: [{
          id: '4',
          name: 'สมปอง ใจงาม',
          time: 'วันนี้ 09:00',
          hn: 'HN 100200',
          location: 'คลินิกแผนจีน',
          status: 'confirmed',
          appointmentType: 'ฝังเข็ม',
          department: 'แผนจีน'
        }]
      },
      แผนไทย: {
        all: [{
          id: '6',
          name: 'ประสบ ดีใจ',
          time: 'วันนี้ 13:00',
          hn: 'HN 100300',
          location: 'คลินิกแผนไทย',
          status: 'confirmed',
          appointmentType: 'นวดไทย',
          department: 'แผนไทย'
        }]
      },
      เคสร่วม: {
        all: [{
          id: '7',
          name: 'นางมีดา อารีย์',
          date: '5/6/2568',
          time: '14:00 น.',
          type: 'นวดโรคขยาบขน',
          status: 'แผนไทย',
          location: 'ภาคารคิด',
          hn: 'HN 100400',
          table: 'โต๊ะ: 1',
          appointmentType: 'เคสรวม',
          department: 'เคสรวม'
        }]
      },
      นอกเวลา: {
        all: [{
          id: '8',
          name: 'สมศรี ดีใจ',
          time: 'วันนี้ 18:00',
          hn: 'HN 100500',
          location: 'นอกเวลา',
          status: 'confirmed',
          appointmentType: 'นอกเวลา',
          department: 'นอกเวลา'
        }]
      }
    };
    return baseData[department] || baseData.กายภาพ;
  };

  const appointmentData = getAppointmentData();

  // Filter appointments based on search criteria
  const filterAppointments = (appointments) => {
    if (!appointments) return [];
    
    return appointments.filter(appointment => {
      const matchesName = !searchName || appointment.name.toLowerCase().includes(searchName.toLowerCase());
      const matchesDate = !selectedDate || appointment.time.includes(selectedDate);
      const matchesDepartment = !selectedDepartment || appointment.department === selectedDepartment;
      const matchesAppointmentType = !selectedAppointmentType || appointment.appointmentType === selectedAppointmentType;
      const matchesStatus = !selectedStatus || appointment.status === selectedStatus;
      
      return matchesName && matchesDate && matchesDepartment && matchesAppointmentType && matchesStatus;
    });
  };

  const handleStatusChange = (appointmentId, status) => {
    setAppointmentStatuses(prev => ({
      ...prev,
      [appointmentId]: status
    }));
  };

  const handleReschedule = appointmentId => {
    if (rescheduleDate && rescheduleTime) {
      handleStatusChange(appointmentId, 'rescheduled');
      setShowReschedule(null);
      setRescheduleDate(null);
      setRescheduleTime('');
      console.log(`Rescheduled appointment ${appointmentId} to ${format(rescheduleDate, 'dd/MM/yyyy')} at ${rescheduleTime}`);
    }
  };

  const getCardStyle = appointmentId => {
    const status = appointmentStatuses[appointmentId];
    switch (status) {
      case 'attended':
        return 'border-l-green-500 bg-green-50';
      case 'rescheduled':
        return 'border-l-yellow-500 bg-yellow-50';
      case 'cancelled':
        return 'border-l-red-500 bg-red-50';
      default:
        return 'border-l-blue-400';
    }
  };

  const renderJointCaseCard = (appointment, index) => (
    <Card key={index} className={cn("mb-4 border transition-all duration-200", getCardStyle(appointment.id))}>
      <CardContent className="p-4">
        {/* Header with badges */}
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-semibold text-lg">{appointment.name}</h3>
          <div className="flex gap-2">
            <Badge variant="secondary" className="bg-pink-100 text-pink-800">แผนไทย</Badge>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">แผนจีน</Badge>
            <Badge variant="secondary" className="bg-green-100 text-green-800">กายภาพ</Badge>
            <Badge variant="outline">{appointment.table}</Badge>
          </div>
        </div>

        {/* Patient details */}
        <div className="text-sm text-gray-600 mb-4">
          <p>วันที่: {appointment.date} | เวลา: {appointment.time} | ประเภท: {appointment.type} | สถานะ: {appointment.status}</p>
        </div>

        {/* Action buttons with new styles */}
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

  const renderAppointmentCard = (appointment, index) => {
    // Use special card for joint cases
    if (department === 'เคสร่วม') {
      return renderJointCaseCard(appointment, index);
    }

    return (
      <Card key={index} className={cn("mb-4 border-l-4 transition-all duration-200", getCardStyle(appointment.id))}>
        <CardContent className="p-4">
          <h3 className="font-semibold text-lg mb-1">{appointment.name}</h3>
          <p className="text-gray-600 mb-1">{appointment.time}</p>
          <p className="text-gray-500 text-sm mb-3">{appointment.hn} / {appointment.location}</p>
          
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
      const appointments = appointmentData[activeTable as keyof typeof appointmentData] || [];
      return filterAppointments(appointments);
    } else {
      const appointments = appointmentData.all || [];
      return filterAppointments(appointments);
    }
  };

  const currentAppointments = getCurrentAppointments();

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
              <SelectItem value="">ทุกแผนก</SelectItem>
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
              <SelectItem value="">ทุกประเภท</SelectItem>
              <SelectItem value="นวดบำบัด">นวดบำบัด</SelectItem>
              <SelectItem value="ฟื้นฟูสมรรถภาพ">ฟื้นฟูสมรรถภาพ</SelectItem>
              <SelectItem value="ฝังเข็ม">ฝังเข็ม</SelectItem>
              <SelectItem value="สมุนไพรจีน">สมุนไพรจีน</SelectItem>
              <SelectItem value="นวดไทย">นวดไทย</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger>
              <SelectValue placeholder="กรองตามสถานะ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">ทุกสถานะ</SelectItem>
              <SelectItem value="confirmed">ยืนยันแล้ว</SelectItem>
              <SelectItem value="pending">รอดำเนินการ</SelectItem>
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
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppointmentTabs;
