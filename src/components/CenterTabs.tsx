import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppointmentTabs from '@/components/AppointmentTabs';
import AppointmentCalendar from '@/components/AppointmentCalendar';

interface CenterTabsProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

const CenterTabs: React.FC<CenterTabsProps> = ({ selectedDate, onDateChange }) => {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="center1" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="center1">รพ.สต.ต้า</TabsTrigger>
          <TabsTrigger value="center2">รพ.สต.พระเนตร</TabsTrigger>
          <TabsTrigger value="center3">ทต.ป่าตาล</TabsTrigger>
        </TabsList>

        <TabsContent value="center1" className="space-y-6">
          <AppointmentTabs 
            department="ศูนย์บริการ" 
            selectedDate={selectedDate} 
            onDateChange={onDateChange} 
            center="รพ.สต.ต้า"
          />
          <AppointmentCalendar 
            department="ศูนย์บริการ" 
            selectedDate={selectedDate} 
            onDateChange={onDateChange} 
            center="รพ.สต.ต้า"
          />
        </TabsContent>

        <TabsContent value="center2" className="space-y-6">
          <AppointmentTabs 
            department="ศูนย์บริการ" 
            selectedDate={selectedDate} 
            onDateChange={onDateChange} 
            center="รพ.สต.พระเนตร"
          />
          <AppointmentCalendar 
            department="ศูนย์บริการ" 
            selectedDate={selectedDate} 
            onDateChange={onDateChange} 
            center="รพ.สต.พระเนตร"
          />
        </TabsContent>

        <TabsContent value="center3" className="space-y-6">
          <AppointmentTabs 
            department="ศูนย์บริการ" 
            selectedDate={selectedDate} 
            onDateChange={onDateChange} 
            center="ทต.ป่าตาล"
          />
          <AppointmentCalendar 
            department="ศูนย์บริการ" 
            selectedDate={selectedDate} 
            onDateChange={onDateChange} 
            center="ทต.ป่าตาล"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CenterTabs;
