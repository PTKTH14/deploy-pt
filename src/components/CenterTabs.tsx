
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppointmentCalendar from '@/components/AppointmentCalendar';
import AppointmentTabs from '@/components/AppointmentTabs';

const CenterTabs = () => {
  const [activeCenter, setActiveCenter] = useState<'รพ.สต.ต้า' | 'รพ.สต.พระเนตร' | 'ทต.ป่าตาล'>('รพ.สต.ต้า');

  return (
    <div className="space-y-6">
      <Tabs value={activeCenter} onValueChange={(value) => setActiveCenter(value as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="รพ.สต.ต้า">รพ.สต.ต้า</TabsTrigger>
          <TabsTrigger value="รพ.สต.พระเนตร">รพ.สต.พระเนตร</TabsTrigger>
          <TabsTrigger value="ทต.ป่าตาล">ทต.ป่าตาล</TabsTrigger>
        </TabsList>

        <TabsContent value="รพ.สต.ต้า" className="space-y-6">
          <AppointmentTabs department="ศูนย์บริการ" />
          <AppointmentCalendar department="ศูนย์บริการ" center="รพ.สต.ต้า" />
        </TabsContent>

        <TabsContent value="รพ.สต.พระเนตร" className="space-y-6">
          <AppointmentTabs department="ศูนย์บริการ" />
          <AppointmentCalendar department="ศูนย์บริการ" center="รพ.สต.พระเนตร" />
        </TabsContent>

        <TabsContent value="ทต.ป่าตาล" className="space-y-6">
          <AppointmentTabs department="ศูนย์บริการ" />
          <AppointmentCalendar department="ศูนย์บริการ" center="ทต.ป่าตาล" />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CenterTabs;
