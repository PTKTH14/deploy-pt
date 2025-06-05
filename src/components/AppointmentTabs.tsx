
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, ArrowRight, Clock } from 'lucide-react';

const AppointmentTabs = () => {
  const [activeTable, setActiveTable] = useState('table1');

  const appointmentData = {
    table1: [
      {
        name: 'นงนุข คงอาศรี',
        time: 'วันนี้ 10:00',
        hn: 'HN 100094',
        location: 'รพ.สต.ภความิด',
        status: 'confirmed'
      }
    ],
    table2: [],
    table3: [
      {
        name: 'วิทวส นาคร่',
        time: 'วันนี้ 10:00',
        hn: 'HN 100599',
        location: 'รพ.สาพบามิด',
        status: 'pending'
      }
    ]
  };

  const renderAppointmentCard = (appointment: any, index: number) => (
    <Card key={index} className="mb-4 border-l-4 border-l-green-400">
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg mb-1">{appointment.name}</h3>
        <p className="text-gray-600 mb-1">{appointment.time}</p>
        <p className="text-gray-500 text-sm mb-3">{appointment.hn} / {appointment.location}</p>
        
        <div className="flex gap-2">
          <Button size="sm" className="bg-green-600 hover:bg-green-700">
            <Check className="w-4 h-4 mr-1" />
            มาตามนัด
          </Button>
          <Button size="sm" variant="outline" className="border-orange-500 text-orange-600 hover:bg-orange-50">
            <ArrowRight className="w-4 h-4 mr-1" />
            เลื่อน
          </Button>
          <Button size="sm" variant="outline" className="border-red-500 text-red-600 hover:bg-red-50">
            <Clock className="w-4 h-4 mr-1" />
            ยกเลิก
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const tableLabels = ['โต๊ะ 1', 'โต๊ะ 2', 'โต๊ะ 3', 'เคสรวม'];

  return (
    <div className="space-y-4">
      {/* Table Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {tableLabels.map((label, index) => (
          <button
            key={index}
            onClick={() => setActiveTable(`table${index + 1}`)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTable === `table${index + 1}`
                ? 'bg-white text-blue-600 shadow-sm border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Appointment Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          {appointmentData[activeTable as keyof typeof appointmentData]?.length > 0 ? (
            appointmentData[activeTable as keyof typeof appointmentData].map((appointment, index) =>
              renderAppointmentCard(appointment, index)
            )
          ) : (
            <Card className="p-8 text-center text-gray-500">
              <p>ไม่มีนัดหมายในโต๊ะนี้</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppointmentTabs;
