import React, { useState } from 'react';
import { Search, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PatientCard from '@/components/PatientCard';
import AddPatientDialog from '@/components/AddPatientDialog';
import AppointmentFormDialog from '@/components/AppointmentFormDialog';
import Navbar from '@/components/Navbar';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { usePatients, useSearchPatients } from '@/hooks/usePatients';

const Patients = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddPatientDialog, setShowAddPatientDialog] = useState(false);
  const [showAppointmentDialog, setShowAppointmentDialog] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  // ใช้ข้อมูลจากฐานข้อมูลแทน mock data
  const { data: patients = [], isLoading } = usePatients();
  const { data: searchResults = [] } = useSearchPatients(searchQuery);
  
  // แสดงผลลัพธ์การค้นหาหรือผู้ป่วยทั้งหมดถ้าไม่มีการค้นหา
  const displayedPatients = searchQuery.trim() ? searchResults : patients;

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleSendToPT = (patient: any, tableNumber: number) => {
    toast({
      title: "ส่งให้ PT",
      description: `ส่ง ${patient.full_name} ไปยังโต๊ะ PT ${tableNumber} แล้ว`,
    });
  };

  const handleSchedule = (patient: any) => {
    toast({
      title: "เปิดฟอร์มนัดหมาย",
      description: `กำลังเปิดฟอร์มสร้างนัดหมายสำหรับ ${patient.full_name}`,
    });
    navigate('/appointments/new', { state: { patient } });
  };

  const handleHomeVisit = (patient: any) => {
    toast({
      title: "เยี่ยมบ้าน",
      description: `กำลังสร้างรายการเยี่ยมบ้านสำหรับ ${patient.full_name}`,
    });
  };

  const handleDispenseEquipment = (patient: any, equipment: any[]) => {
    const equipmentList = equipment.map(item => `${item.type} (${item.size})`).join(', ');
    toast({
      title: "จ่ายอุปกรณ์",
      description: `จ่ายอุปกรณ์ให้ ${patient.full_name}: ${equipmentList}`,
    });
  };

  const handleSelectForAppointment = (patient: any) => {
    setSelectedPatient(patient);
    setShowAppointmentDialog(true);
  };

  const handlePatientAdded = () => {
    // ไม่ต้องทำอะไรเพิ่ม เพราะ react-query จะ invalidate และ refresh ข้อมูลอัตโนมัติ
    toast({
      title: "เพิ่มผู้ป่วยสำเร็จ",
      description: "เพิ่มข้อมูลผู้ป่วยใหม่เรียบร้อยแล้ว",
    });
  };

  const statusMap = {
    'รอการยืนยัน': 'new',
    'กำลังดำเนินการ': 'processing',
    'เสร็จเรียบร้อย': 'done'
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="text-gray-500">กำลังโหลดข้อมูล...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">ผู้มาใช้บริการ</h1>
            <Button 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => setShowAddPatientDialog(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              เพิ่มผู้ป่วยใหม่
            </Button>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Search className="w-5 h-5 mr-2" />
                ค้นหาผู้ป่วย
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="ค้นหาจากชื่อ, เลขบัตรประชาชน หรือ HN..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10 h-12 text-lg"
                />
              </div>
              {searchQuery && (
                <p className="mt-2 text-sm text-gray-600">
                  พบ {displayedPatients.length} รายการจากการค้นหา "{searchQuery}"
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {displayedPatients.length > 0 ? (
            displayedPatients.map((patient) => (
              <PatientCard
                key={patient.id}
                patient={{
                  ...patient,
                  // แปลง field names ให้ตรงกับที่ PatientCard คาดหวัง
                  right_type: patient.pttype_name || 'ไม่ระบุ',
                  address: patient.full_address || 'ไม่ระบุ'
                }}
                onSendToPT={handleSendToPT}
                onSchedule={handleSchedule}
                onHomeVisit={handleHomeVisit}
                onDispenseEquipment={handleDispenseEquipment}
                onSelectForAppointment={handleSelectForAppointment}
              />
            ))
          ) : (
            <div className="text-center py-10 text-gray-500">
              <p>ไม่พบข้อมูลผู้ป่วยที่ตรงกับเงื่อนไขการค้นหา</p>
            </div>
          )}
        </div>

        {displayedPatients.length === 0 && searchQuery && (
          <Card className="text-center py-12">
            <CardContent>
              <div className="text-gray-500">
                <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold mb-2">ไม่พบข้อมูลผู้ป่วย</h3>
                <p>ลองค้นหาด้วยชื่อ, เลขบัตรประชาชน หรือ HN อื่น</p>
              </div>
            </CardContent>
          </Card>
        )}

        {displayedPatients.length === 0 && !searchQuery && (
          <Card className="text-center py-12">
            <CardContent>
              <div className="text-gray-500">
                <h3 className="text-lg font-semibold mb-2">ยังไม่มีข้อมูลผู้ป่วย</h3>
                <p>กดปุ่ม "เพิ่มผู้ป่วยใหม่" เพื่อเริ่มต้น</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <AddPatientDialog
        open={showAddPatientDialog}
        onOpenChange={setShowAddPatientDialog}
        onPatientAdded={handlePatientAdded}
      />

      <AppointmentFormDialog
        open={showAppointmentDialog}
        onOpenChange={setShowAppointmentDialog}
        selectedPatient={selectedPatient}
      />
    </div>
  );
};

export default Patients;
