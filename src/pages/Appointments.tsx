
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Navbar from '@/components/Navbar';
import AppointmentForm from '@/components/AppointmentForm';
import AppointmentTabs from '@/components/AppointmentTabs';
import AppointmentCalendar from '@/components/AppointmentCalendar';

const Appointments = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="taa" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="taa" className="bg-blue-600 text-white data-[state=active]:bg-blue-700">
              ทต.ต้า
            </TabsTrigger>
            <TabsTrigger value="phranet">
              รพสต.พระเนตร
            </TabsTrigger>
            <TabsTrigger value="patal">
              ทต.ป่าตาล
            </TabsTrigger>
            <TabsTrigger value="summary">
              สรุป
            </TabsTrigger>
          </TabsList>

          <TabsContent value="taa" className="space-y-6">
            <AppointmentForm />
            <AppointmentTabs />
            <AppointmentCalendar />
          </TabsContent>

          <TabsContent value="phranet" className="space-y-6">
            <AppointmentForm />
            <AppointmentTabs />
            <AppointmentCalendar />
          </TabsContent>

          <TabsContent value="patal" className="space-y-6">
            <AppointmentForm />
            <AppointmentTabs />
            <AppointmentCalendar />
          </TabsContent>

          <TabsContent value="summary" className="space-y-6">
            <div className="text-center py-12">
              <h3 className="text-lg font-semibold mb-2">สรุปนัดหมายทั้งหมด</h3>
              <p className="text-gray-500">แสดงข้อมูลรวมจากทุกศูนย์บริการ</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Appointments;
