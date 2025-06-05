
import React, { useState } from 'react';
import { Calendar, Clock, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const AppointmentForm = () => {
  const [selectedDate, setSelectedDate] = useState('06/05/2025');
  const [selectedDepartment, setSelectedDepartment] = useState('กุมยบริการ');
  const [selectedService, setSelectedService] = useState('ได้มบริการ');

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">วันครอลหมาย</h2>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          เพิ่มนัดหมายผู้มายใหม่
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div>
          <input
            type="text"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="วันที่"
          />
        </div>
        
        <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
          <SelectTrigger>
            <SelectValue placeholder="เลือกแผนก" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="กุมยบริการ">กุมยบริการ</SelectItem>
            <SelectItem value="แผนไทย">แผนไทย</SelectItem>
            <SelectItem value="แผนจีน">แผนจีน</SelectItem>
          </SelectContent>
        </Select>

        <div>
          <input
            type="text"
            placeholder="ค้งหมล"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <Select value={selectedService} onValueChange={setSelectedService}>
          <SelectTrigger>
            <SelectValue placeholder="ประเภทบริการ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ได้มบริการ">ได้มบริการ</SelectItem>
            <SelectItem value="ไม่ได้บริการ">ไม่ได้บริการ</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default AppointmentForm;
