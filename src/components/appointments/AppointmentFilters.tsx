
import React from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';

interface AppointmentFiltersProps {
  searchName: string;
  setSearchName: (value: string) => void;
  selectedDate: string;
  setSelectedDate: (value: string) => void;
  selectedDepartment: string;
  setSelectedDepartment: (value: string) => void;
  selectedAppointmentType: string;
  setSelectedAppointmentType: (value: string) => void;
  selectedStatus: string;
  setSelectedStatus: (value: string) => void;
}

const AppointmentFilters = ({
  searchName,
  setSearchName,
  selectedDate,
  setSelectedDate,
  selectedDepartment,
  setSelectedDepartment,
  selectedAppointmentType,
  setSelectedAppointmentType,
  selectedStatus,
  setSelectedStatus
}: AppointmentFiltersProps) => {
  return (
    <Card className="p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="ค้นหาผู้ป่วย..."
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Input
          type="date"
          placeholder="วันที่"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />
        
        <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
          <SelectTrigger>
            <SelectValue placeholder="กรองตามแผนก" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทุกแผนก</SelectItem>
            <SelectItem value="กายภาพ">กายภาพ</SelectItem>
            <SelectItem value="แผนจีน">แผนจีน</SelectItem>
            <SelectItem value="แผนไทย">แผนไทย</SelectItem>
            <SelectItem value="เคสรวม">เคสรวม</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={selectedAppointmentType} onValueChange={setSelectedAppointmentType}>
          <SelectTrigger>
            <SelectValue placeholder="กรองตามประเภท" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทุกประเภท</SelectItem>
            <SelectItem value="in">นัดใน รพ.</SelectItem>
            <SelectItem value="out">นัดเยี่ยมนอก รพ.</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger>
            <SelectValue placeholder="กรองตามสถานะ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทุกสถานะ</SelectItem>
            <SelectItem value="new">ใหม่</SelectItem>
            <SelectItem value="confirmed">ยืนยันแล้ว</SelectItem>
            <SelectItem value="cancelled">ยกเลิก</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </Card>
  );
};

export default AppointmentFilters;
