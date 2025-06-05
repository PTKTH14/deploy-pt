import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import AppointmentTabs from '@/components/AppointmentTabs';
import AppointmentCalendar from '@/components/AppointmentCalendar';
import CenterTabs from '@/components/CenterTabs';
import CommandModal from '@/components/CommandModal';

const Appointments = () => {
  const navigate = useNavigate();
  const [showCommandModal, setShowCommandModal] = useState(false);

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
              onClick={() => navigate('/appointments/new')}
            >
              <Plus className="w-4 h-4 mr-2" />
              เพิ่มนัดหมายผู้ป่วยใหม่
            </Button>
          </div>
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
            <AppointmentTabs department="กายภาพ" />
            <AppointmentCalendar department="กายภาพ" />
          </TabsContent>

          <TabsContent value="chinese" className="space-y-6">
            <AppointmentTabs department="แผนจีน" />
            <AppointmentCalendar department="แผนจีน" />
          </TabsContent>

          <TabsContent value="thai" className="space-y-6">
            <AppointmentTabs department="แผนไทย" />
            <AppointmentCalendar department="แผนไทย" />
          </TabsContent>

          <TabsContent value="joint" className="space-y-6">
            <AppointmentTabs department="เคสร่วม" />
            <AppointmentCalendar department="เคสร่วม" />
          </TabsContent>

          <TabsContent value="overtime" className="space-y-6">
            <AppointmentTabs department="นอกเวลา" />
            <AppointmentCalendar department="นอกเวลา" />
          </TabsContent>

          <TabsContent value="centers" className="space-y-6">
            <CenterTabs />
          </TabsContent>
        </Tabs>
      </div>

      {/* Command Modal */}
      <CommandModal 
        open={showCommandModal} 
        onOpenChange={setShowCommandModal} 
      />
    </div>
  );
};

export default Appointments;
