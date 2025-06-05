
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, ArrowRight, Clock } from 'lucide-react';

const CenterTabs = () => {
  const [activeCenter, setActiveCenter] = useState('taa');

  const centerData = {
    taa: [
      {
        name: 'นางสาว สมหญิง ใจดี',
        time: 'วันนี้ 09:30',
        hn: 'HN 100001',
        location: 'รพสต.ต้า',
        status: 'confirmed'
      }
    ],
    phranet: [
      {
        name: 'นาย สมชาย รักดี',
        time: 'วันนี้ 10:15',
        hn: 'HN 100002',
        location: 'รพสต.พระเนตร',
        status: 'pending'
      }
    ],
    patal: [
      {
        name: 'นางสาว สมใจ ดีใจ',
        time: 'วันนี้ 11:00',
        hn: 'HN 100003',
        location: 'ทต.ป่าตาล',
        status: 'confirmed'
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

  const centerLabels = [
    { key: 'taa', label: 'รพสต.ต้า' },
    { key: 'phranet', label: 'รพสต.พระเนตร' },
    { key: 'patal', label: 'ทต.ป่าตาล' }
  ];

  return (
    <div className="space-y-4">
      {/* Center Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {centerLabels.map((center) => (
          <button
            key={center.key}
            onClick={() => setActiveCenter(center.key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeCenter === center.key
                ? 'bg-white text-blue-600 shadow-sm border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {center.label}
          </button>
        ))}
      </div>

      {/* Center Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          {centerData[activeCenter as keyof typeof centerData]?.length > 0 ? (
            centerData[activeCenter as keyof typeof centerData].map((appointment, index) =>
              renderAppointmentCard(appointment, index)
            )
          ) : (
            <Card className="p-8 text-center text-gray-500">
              <p>ไม่มีนัดหมายในศูนย์บริการนี้</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default CenterTabs;
