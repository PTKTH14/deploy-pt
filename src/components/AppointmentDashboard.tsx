import React, { useState } from 'react';
import { useAppointments, useAddAppointment } from '@/hooks/useAppointments';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { Plus, Calendar as CalendarIcon, Edit, Trash2, X, ChevronLeft, ChevronRight, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { CenterType } from '@/types/appointment';

// All-in-one Appointment Dashboard (Calendar + List + CRUD + Modal)
const thaiMonths = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];
const thaiDays = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

function formatDateForComparison(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function AppointmentDashboard() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<any>(null);
  const [formData, setFormData] = useState<any>({
    full_name: '',
    appointment_date: '',
    appointment_time: '',
    center: '',
    status: 'new',
    appointment_type: 'in',
    hn: '',
    phone_number: '',
    note: ''
  });
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState<string>('all');
  const [center, setCenter] = useState<CenterType | null>(null);

  const firstDayOfMonth = startOfMonth(currentDate);
  const lastDayOfMonth = endOfMonth(currentDate);

  // Supabase hook
  const { data: appointments = [], isLoading } = useAppointments({
    dateRange: {
      start: format(firstDayOfMonth, 'yyyy-MM-dd'),
      end: format(lastDayOfMonth, 'yyyy-MM-dd')
    },
    department: department === 'all' ? undefined : department,
    center: center || undefined
  });
  const addAppointment = useAddAppointment();

  // Calendar logic
  function getAppointmentsForDate(date: Date) {
    const dateStr = formatDateForComparison(date);
    const filteredAppointments = appointments.filter((apt: any) => {
      if (!apt || !apt.appointment_date) return false;
      return apt.appointment_date === dateStr;
    });
    
    return filteredAppointments;
  }
  
  function getDaysInMonth(date: Date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();
    const days = [];
    
    // Create a map for faster appointment lookups
    const appointmentsByDate = new Map();
    appointments.forEach((apt: any) => {
      if (!apt || !apt.appointment_date) return;
      
      if (!appointmentsByDate.has(apt.appointment_date)) {
        appointmentsByDate.set(apt.appointment_date, []);
      }
      appointmentsByDate.get(apt.appointment_date).push(apt);
    });
    
    // Add empty cells for days before the first of the month
    for (let i = 0; i < startDayOfWeek; i++) days.push(null);
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDay = new Date(year, month, day);
      const dateStr = formatDateForComparison(currentDay);
      const dayAppointments = appointmentsByDate.get(dateStr) || [];
      
      days.push({
        day,
        date: currentDay,
        appointmentCount: dayAppointments.length,
        isToday: formatDateForComparison(currentDay) === formatDateForComparison(new Date()),
        isSelected: formatDateForComparison(currentDay) === formatDateForComparison(selectedDate)
      });
    }
    return days;
  }
  function handleDateClick(dateObj: any) {
    if (dateObj) setSelectedDate(dateObj.date);
  }
  function navigateMonth(direction: number) {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  }

  // Modal logic
  function openCreateModal() {
    setEditingAppointment(null);
    setFormData({
      full_name: '',
      appointment_date: formatDateForComparison(selectedDate),
      appointment_time: '',
      center: '',
      status: 'new',
      appointment_type: 'in',
      hn: '',
      phone_number: '',
      note: ''
    });
    setShowModal(true);
  }
  function openEditModal(appointment: any) {
    setEditingAppointment(appointment);
    setFormData({ ...appointment });
    setShowModal(true);
  }
  function closeModal() {
    setShowModal(false);
    setEditingAppointment(null);
    setFormData({
      full_name: '',
      appointment_date: '',
      appointment_time: '',
      center: '',
      status: 'new',
      appointment_type: 'in',
      hn: '',
      phone_number: '',
      note: ''
    });
  }
  function handleInputChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  }
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editingAppointment) {
      // TODO: update logic (ยังไม่รวมในตัวอย่างนี้)
    } else {
      await addAppointment.mutateAsync(formData);
    }
    closeModal();
  }

  // Filtered appointments for list
  const selectedDateAppointments = getAppointmentsForDate(selectedDate).filter((apt: any) =>
    !search || apt.full_name?.toLowerCase().includes(search.toLowerCase()) || apt.hn?.includes(search)
  );
  const days = getDaysInMonth(currentDate);

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">จัดการนัดหมาย (All-in-one)</h1>
          <Button onClick={openCreateModal} className="bg-green-600 hover:bg-green-700 flex items-center gap-2">
            <Plus className="w-4 h-4" /> เพิ่มนัดหมายใหม่
          </Button>
        </div>
        <div className="flex flex-col lg:flex-row">
          {/* Calendar Section */}
          <div className="lg:w-1/2 p-6 border-r border-gray-200">
            <div className="bg-white rounded-lg">
              {/* Calendar Header */}
              <div className="flex justify-between items-center mb-6">
                <Button variant="ghost" onClick={() => navigateMonth(-1)}><ChevronLeft className="w-5 h-5" /></Button>
                <h2 className="text-xl font-semibold text-gray-800">
                  {thaiMonths[currentDate.getMonth()]} {currentDate.getFullYear() + 543}
                </h2>
                <Button variant="ghost" onClick={() => navigateMonth(1)}><ChevronRight className="w-5 h-5" /></Button>
              </div>
              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {thaiDays.map(day => (
                  <div key={day} className="p-3 text-center font-semibold text-gray-600 bg-gray-50">{day}</div>
                ))}
                {days.map((dateObj, index) => (
                  <div key={index} className="aspect-square">
                    {dateObj ? (
                      <button
                        onClick={() => handleDateClick(dateObj)}
                        className={`w-full h-full p-1 text-sm rounded-lg transition-all duration-200 relative
                          ${dateObj.isSelected ? 'bg-blue-600 text-white shadow-lg' : dateObj.isToday ? 'bg-blue-100 text-blue-800 border-2 border-blue-300' : 'hover:bg-gray-100 text-gray-700'}`}
                      >
                        <div className="flex flex-col items-center justify-center h-full">
                          <span className="font-medium">{dateObj.day}</span>
                          {dateObj.appointmentCount > 0 && (
                            <div className={`w-5 h-5 rounded-full text-xs flex items-center justify-center mt-1
                              ${dateObj.isSelected ? 'bg-white text-blue-600' : 'bg-green-500 text-white'}`}
                            >
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
            </div>
          </div>
          {/* Appointments List Section */}
          <div className="lg:w-1/2 p-6">
            <Input
              placeholder="ค้นหาด้วยชื่อหรือ HN..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="mb-4"
            />
            <div className="mb-4">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                นัดหมายวันที่ {selectedDate.getDate()} {thaiMonths[selectedDate.getMonth()]} {selectedDate.getFullYear() + 543}
              </h3>
              <p className="text-gray-600">
                {selectedDateAppointments.length > 0
                  ? `มีนัดหมาย ${selectedDateAppointments.length} รายการ`
                  : 'ไม่มีนัดหมายในวันนี้'}
              </p>
            </div>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="text-center py-12 text-gray-500">Loading...</div>
              ) : selectedDateAppointments.length > 0 ? (
                selectedDateAppointments.map((appointment: any) => (
                  <div key={appointment.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="text-lg font-semibold text-gray-800">{appointment.full_name}</h4>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border bg-gray-100 text-gray-800`}>{appointment.status}</span>
                    </div>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div>เวลา: {appointment.appointment_time}</div>
                      <div>ศูนย์: {appointment.center}</div>
                      <div>HN: {appointment.hn}</div>
                      <div>เบอร์: {appointment.phone_number}</div>
                      <div>หมายเหตุ: {appointment.note}</div>
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                      <Button size="sm" variant="outline" onClick={() => openEditModal(appointment)}><Edit className="w-4 h-4" /></Button>
                      {/* <Button size="sm" variant="destructive"><Trash2 className="w-4 h-4" /></Button> */}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <CalendarIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg">ไม่มีนัดหมายในวันนี้</p>
                  <p className="text-sm mt-2">คลิกปุ่ม "เพิ่มนัดหมายใหม่" เพื่อสร้างนัดหมาย</p>
                  <Button onClick={openCreateModal} className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 mx-auto transition-colors">
                    <Plus className="w-4 h-4" /> เพิ่มนัดหมายใหม่
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Modal สำหรับเพิ่ม/แก้ไขนัดหมาย */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingAppointment ? 'แก้ไขนัดหมาย' : 'เพิ่มนัดหมายใหม่'}</DialogTitle>
            <DialogDescription>
              {editingAppointment ? 'แก้ไขข้อมูลนัดหมาย' : 'กรอกข้อมูลเพื่อสร้างนัดหมายใหม่'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            <Input name="full_name" value={formData.full_name} onChange={handleInputChange} placeholder="ชื่อ-นามสกุล" required />
            <Input name="appointment_date" type="date" value={formData.appointment_date} onChange={handleInputChange} required />
            <Input name="appointment_time" type="time" value={formData.appointment_time} onChange={handleInputChange} required />
            <Input name="center" value={formData.center} onChange={handleInputChange} placeholder="ศูนย์ (รพ.สต.ต้า, ... )" required />
            <Input name="hn" value={formData.hn} onChange={handleInputChange} placeholder="HN" />
            <Input name="phone_number" value={formData.phone_number} onChange={handleInputChange} placeholder="เบอร์โทร" />
            <Input name="note" value={formData.note} onChange={handleInputChange} placeholder="หมายเหตุ" />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={closeModal}><X className="w-4 h-4" /> ยกเลิก</Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white"><Save className="w-4 h-4" /> บันทึก</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 