
import React, { useState } from 'react';
import { Search, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PatientCard from '@/components/PatientCard';
import Navbar from '@/components/Navbar';
import { useToast } from '@/hooks/use-toast';

// Mock data for demonstration
const mockPatients = [
  {
    id: '1',
    full_name: 'สมชาย ใจดี',
    cid: '1234567890123',
    hn: 'HN001234',
    right_type: 'UC',
    phone_number: '081-234-5678',
    address: '123 หมู่ 1 ต.ต้า อ.เมือง จ.นาน 55000'
  },
  {
    id: '2',
    full_name: 'มาลี สุขใส',
    cid: '9876543210987',
    hn: 'HN005678',
    right_type: 'SSS',
    phone_number: '082-345-6789',
    address: '456 หมู่ 2 ต.พระเนตร อ.เมือง จ.นาน 55000'
  },
  {
    id: '3',
    full_name: 'วิชัย รุ่งเรือง',
    cid: '5555666677778',
    hn: 'HN009876',
    right_type: 'CSMBS',
    phone_number: '083-456-7890',
    address: '789 หมู่ 3 ต.ป่าตาล อ.เมือง จ.นาน 55000'
  }
];

const Patients = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredPatients, setFilteredPatients] = useState(mockPatients);
  const { toast } = useToast();

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setFilteredPatients(mockPatients);
    } else {
      const filtered = mockPatients.filter(patient =>
        patient.full_name.toLowerCase().includes(query.toLowerCase()) ||
        patient.cid.includes(query) ||
        patient.hn.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredPatients(filtered);
    }
  };

  const handleSendToPT = (patient: any) => {
    toast({
      title: "ส่งให้ PT",
      description: `กำลังส่ง ${patient.full_name} ไปยังโต๊ะ PT`,
    });
  };

  const handleSchedule = (patient: any) => {
    toast({
      title: "สร้างนัดหมาย",
      description: `กำลังสร้างนัดหมายสำหรับ ${patient.full_name}`,
    });
  };

  const handleHomeVisit = (patient: any) => {
    toast({
      title: "เยี่ยมบ้าน",
      description: `กำลังสร้างรายการเยี่ยมบ้านสำหรับ ${patient.full_name}`,
    });
  };

  const handleDispenseEquipment = (patient: any) => {
    toast({
      title: "จ่ายอุปกรณ์",
      description: `กำลังบันทึกการจ่ายอุปกรณ์สำหรับ ${patient.full_name}`,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">ผู้มาใช้บริการ</h1>
            <Button className="bg-blue-600 hover:bg-blue-700">
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
                  พบ {filteredPatients.length} รายการจากการค้นหา "{searchQuery}"
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredPatients.map((patient) => (
            <PatientCard
              key={patient.id}
              patient={patient}
              onSendToPT={handleSendToPT}
              onSchedule={handleSchedule}
              onHomeVisit={handleHomeVisit}
              onDispenseEquipment={handleDispenseEquipment}
            />
          ))}
        </div>

        {filteredPatients.length === 0 && searchQuery && (
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
      </div>
    </div>
  );
};

export default Patients;
