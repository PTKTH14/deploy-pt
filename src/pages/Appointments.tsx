import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus, MessageSquare, QrCode } from 'lucide-react';
import Navbar from '@/components/Navbar';
import AppointmentTabs from '@/components/AppointmentTabs';
import AppointmentCalendar from '@/components/AppointmentCalendar';
import CenterTabs from '@/components/CenterTabs';
import CommandModal from '@/components/CommandModal';
import { supabase } from '@/integrations/supabase/client';
import NewAppointmentForm from '@/components/AppointmentForm';

const Appointments = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showCommandModal, setShowCommandModal] = useState(false);
  const [scannedPatient, setScannedPatient] = useState<any>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showNewFormModal, setShowNewFormModal] = useState(false);

  const handleScan = async (data: string | null) => {
    if (data) {
      // สมมติ QR เป็น HN ตรง ๆ
      const hn = data.trim();
      const { data: patient } = await supabase.from('patients').select('*').eq('hn', hn).single();
      if (patient) {
        setScannedPatient(patient);
        setShowConfirm(true);
      } else {
        alert('ไม่พบผู้ป่วยในระบบ');
      }
    }
  };

  const handleQuickAppointment = (patient: any) => {
    // ตัวอย่าง: สร้างนัดวันนี้ เวลา 09:00 กายภาพบำบัด โต๊ะ 1
    alert('สร้างนัดใหม่ทันทีให้ ' + patient.full_name + ' (HN: ' + patient.hn + ')');
    setShowConfirm(false);
  };

  const handleOpenForm = (patient: any) => {
    // ไปหน้าเพิ่มนัดหมายใหม่ พร้อมส่ง patient (คุณอาจใช้ state management หรือ query param)
    alert('เปิดฟอร์มเพิ่มนัดหมายสำหรับ ' + patient.full_name);
    setShowConfirm(false);
    // ตัวอย่าง: navigate(`/appointments/new?hn=${patient.hn}`)
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">จัดการนัดหมาย</h1>
          <div className="flex gap-3">
            <Button 
              variant="outline"
              onClick={() => setShowCommandModal(true)}
              className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              พิมพ์คำสั่ง
            </Button>
            <Button 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => setShowNewFormModal(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              เพิ่มนัดหมายผู้ป่วยใหม่
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          <Tabs defaultValue="physio" className="w-full">
            <TabsList className="grid w-full grid-cols-6 mb-8">
              <TabsTrigger value="physio" className="bg-blue-600 text-white data-[state=active]:bg-blue-700">
                กายภาพบำบัด
              </TabsTrigger>
              <TabsTrigger value="chinese">
                แผนจีน
              </TabsTrigger>
              <TabsTrigger value="thai">
                แผนไทย
              </TabsTrigger>
              <TabsTrigger value="joint">
                เคสร่วม
              </TabsTrigger>
              <TabsTrigger value="overtime">
                นอกเวลาราชการ
              </TabsTrigger>
              <TabsTrigger value="centers">
                ศูนย์บริการ
              </TabsTrigger>
            </TabsList>

            <TabsContent value="physio" className="space-y-6">
              <AppointmentTabs department="กายภาพบำบัด" selectedDate={selectedDate} onDateChange={setSelectedDate} />
              <AppointmentCalendar department="กายภาพบำบัด" selectedDate={selectedDate} onDateChange={setSelectedDate} />
            </TabsContent>

            <TabsContent value="chinese" className="space-y-6">
              <AppointmentTabs department="แผนจีน" selectedDate={selectedDate} onDateChange={setSelectedDate} center="รพ.สต.ต้า" />
              <AppointmentCalendar department="แผนจีน" selectedDate={selectedDate} onDateChange={setSelectedDate} />
            </TabsContent>

            <TabsContent value="thai" className="space-y-6">
              <AppointmentTabs department="แผนไทย" selectedDate={selectedDate} onDateChange={setSelectedDate} center="รพ.สต.ต้า" />
              <AppointmentCalendar department="แผนไทย" selectedDate={selectedDate} onDateChange={setSelectedDate} />
            </TabsContent>

            <TabsContent value="joint" className="space-y-6">
              <AppointmentTabs department="เคสร่วม" selectedDate={selectedDate} onDateChange={setSelectedDate} />
              <AppointmentCalendar department="เคสร่วม" selectedDate={selectedDate} onDateChange={setSelectedDate} />
            </TabsContent>

            <TabsContent value="overtime" className="space-y-6">
              <AppointmentTabs 
                department="นอกเวลา"
                selectedDate={selectedDate} 
                onDateChange={setSelectedDate} 
              />
              <AppointmentCalendar 
                department="นอกเวลา"
                selectedDate={selectedDate} 
                onDateChange={setSelectedDate} 
              />
            </TabsContent>

            <TabsContent value="centers" className="space-y-6">
              <CenterTabs selectedDate={selectedDate} onDateChange={setSelectedDate} />
            </TabsContent>
          </Tabs>
        </div>

        <CommandModal 
          open={showCommandModal} 
          onOpenChange={setShowCommandModal} 
        />

        {showConfirm && scannedPatient && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-lg p-6 shadow-lg min-w-[320px]">
              <h2 className="text-lg font-bold mb-2">ยืนยันนัดหมาย</h2>
              <p>ชื่อ: {scannedPatient.full_name}</p>
              <p>HN: {scannedPatient.hn}</p>
              <p>เบอร์: {scannedPatient.phone_number}</p>
              <div className="flex gap-2 mt-4">
                <Button className="bg-green-600 hover:bg-green-700" onClick={() => handleQuickAppointment(scannedPatient)}>
                  ตกลงนัดเลย (วันนี้ 09:00)
                </Button>
                <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => handleOpenForm(scannedPatient)}>
                  แก้ไข/รายละเอียด
                </Button>
                <Button variant="outline" onClick={() => setShowConfirm(false)}>ยกเลิก</Button>
              </div>
            </div>
          </div>
        )}

        {showNewFormModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-lg p-6 shadow-lg max-w-2xl w-full">
              <NewAppointmentForm onClose={() => setShowNewFormModal(false)} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Appointments;
