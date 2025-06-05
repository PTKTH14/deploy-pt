
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import AppointmentTabs from '@/components/AppointmentTabs';
import AppointmentCalendar from '@/components/AppointmentCalendar';
import CenterTabs from '@/components/CenterTabs';

const Appointments = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">จัดการนัดหมาย</h1>
          <Button 
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => navigate('/appointments/new')}
          >
            <Plus className="w-4 h-4 mr-2" />
            เพิ่มนัดหมายผู้ป่วยใหม่
          </Button>
        </div>

        <Tabs defaultValue="physio" className="w-full">
          <TabsList className="grid w-full grid-cols-6 mb-8">
            <TabsTrigger value="physio" className="bg-blue-600 text-white data-[state=active]:bg-blue-700">
              กายภาพ
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
              นอกเวลา
            </TabsTrigger>
            <TabsTrigger value="centers">
              ศูนย์บริการ
            </TabsTrigger>
          </TabsList>

          <TabsContent value="physio" className="space-y-6">
            <AppointmentTabs />
            <AppointmentCalendar />
          </TabsContent>

          <TabsContent value="chinese" className="space-y-6">
            <div className="text-center py-12">
              <h3 className="text-lg font-semibold mb-2">นัดหมายแผนจีน</h3>
              <p className="text-gray-500">แสดงข้อมูลนัดหมายแผนจีน</p>
            </div>
            <AppointmentCalendar />
          </TabsContent>

          <TabsContent value="thai" className="space-y-6">
            <div className="text-center py-12">
              <h3 className="text-lg font-semibold mb-2">นัดหมายแผนไทย</h3>
              <p className="text-gray-500">แสดงข้อมูลนัดหมายแผนไทย</p>
            </div>
            <AppointmentCalendar />
          </TabsContent>

          <TabsContent value="joint" className="space-y-6">
            <div className="text-center py-12">
              <h3 className="text-lg font-semibold mb-2">เคสร่วม</h3>
              <p className="text-gray-500">แสดงข้อมูลเคสร่วมระหว่างแผนก</p>
            </div>
            <AppointmentCalendar />
          </TabsContent>

          <TabsContent value="overtime" className="space-y-6">
            <div className="text-center py-12">
              <h3 className="text-lg font-semibold mb-2">นัดหมายนอกเวลา</h3>
              <p className="text-gray-500">แสดงข้อมูลนัดหมายนอกเวลาราชการ</p>
            </div>
            <AppointmentCalendar />
          </TabsContent>

          <TabsContent value="centers" className="space-y-6">
            <CenterTabs />
            <AppointmentCalendar />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Appointments;
