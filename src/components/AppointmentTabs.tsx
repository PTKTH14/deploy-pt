
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { format } from 'date-fns';
import { useAppointments } from '@/hooks/useAppointments';
import AppointmentFilters from './appointments/AppointmentFilters';
import AppointmentTableTabs from './appointments/AppointmentTableTabs';
import AppointmentCard from './appointments/AppointmentCard';
import { filterAppointments, shouldShowTableTabs } from '@/utils/appointmentUtils';

interface AppointmentTabsProps {
  department?: string;
}

const AppointmentTabs = ({
  department = 'กายภาพ'
}: AppointmentTabsProps) => {
  const [activeTable, setActiveTable] = useState('table1');
  const [appointmentStatuses, setAppointmentStatuses] = useState({});
  const [rescheduleData, setRescheduleData] = useState({});
  const [showReschedule, setShowReschedule] = useState<string | null>(null);
  
  // Filter states
  const [searchName, setSearchName] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => {
    // Set current date as default
    const today = new Date();
    return format(today, 'yyyy-MM-dd');
  });
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

  // Initialize reschedule data for each appointment
  useEffect(() => {
    const initialRescheduleData = {};
    appointmentData.forEach(appointment => {
      initialRescheduleData[appointment.appointment_id] = {
        date: null,
        time: ''
      };
    });
    setRescheduleData(initialRescheduleData);
  }, [appointmentData]);

  // Check if department should show table tabs
  const shouldShowTables = shouldShowTableTabs(department);

  const handleStatusChange = (appointmentId: string, status: string) => {
    setAppointmentStatuses(prev => ({
      ...prev,
      [appointmentId]: status
    }));
  };

  const updateRescheduleData = (appointmentId: string, field: string, value: any) => {
    setRescheduleData(prev => ({
      ...prev,
      [appointmentId]: {
        ...prev[appointmentId],
        [field]: value
      }
    }));
  };

  const handleReschedule = (appointmentId: string) => {
    const rescheduleInfo = rescheduleData[appointmentId];
    if (rescheduleInfo && rescheduleInfo.date && rescheduleInfo.time) {
      handleStatusChange(appointmentId, 'rescheduled');
      setShowReschedule(null);
      console.log(`Rescheduled appointment ${appointmentId} to ${format(rescheduleInfo.date, 'dd/MM/yyyy')} at ${rescheduleInfo.time}`);
      
      // Reset reschedule data for this appointment
      updateRescheduleData(appointmentId, 'date', null);
      updateRescheduleData(appointmentId, 'time', '');
    }
  };

  // Get current appointments to display
  const getCurrentAppointments = () => {
    return filterAppointments(
      appointmentData,
      shouldShowTables ? activeTable : undefined,
      shouldShowTables,
      searchName,
      selectedDate,
      selectedDepartment,
      selectedAppointmentType,
      selectedStatus
    );
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
      <AppointmentFilters
        searchName={searchName}
        setSearchName={setSearchName}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        selectedDepartment={selectedDepartment}
        setSelectedDepartment={setSelectedDepartment}
        selectedAppointmentType={selectedAppointmentType}
        setSelectedAppointmentType={setSelectedAppointmentType}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
      />

      {/* Table Tabs - Show for กายภาพ and แผนจีน */}
      {shouldShowTables && (
        <AppointmentTableTabs
          department={department}
          activeTable={activeTable}
          setActiveTable={setActiveTable}
        />
      )}

      {/* Appointment Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          {currentAppointments.length > 0 ? (
            currentAppointments.map((appointment, index) => (
              <AppointmentCard
                key={appointment.appointment_id || index}
                appointment={appointment}
                index={index}
                appointmentStatuses={appointmentStatuses}
                rescheduleData={rescheduleData}
                showReschedule={showReschedule}
                onStatusChange={handleStatusChange}
                onRescheduleDataUpdate={updateRescheduleData}
                onReschedule={handleReschedule}
                onShowReschedule={setShowReschedule}
                department={department}
              />
            ))
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
