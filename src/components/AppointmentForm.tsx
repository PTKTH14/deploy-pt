
import React, { useState } from 'react';
import { Calendar, Clock, Plus, Search, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

const NewAppointmentForm = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [appointmentDate, setAppointmentDate] = useState(null);
  const [formData, setFormData] = useState({
    patient_id: '',
    full_name: '',
    hn: '',
    phone_number: '',
    address: '',
    appointment_date: null,
    appointment_time: '',
    departments: [],
    type: '',
    center: '',
    time_period: '',
    status: 'new',
    table_number_display: '',
    note: ''
  });

  // Mock patient data - replace with actual API call
  const mockPatients = [
    {
      id: '1',
      full_name: 'นางสาว สมหญิง ใจดี',
      hn: 'HN 100001',
      id_card: '1234567890123',
      phone_number: '081-234-5678',
      address: '123 ถ.สุขุมวิท กรุงเทพฯ 10110'
    },
    {
      id: '2',
      full_name: 'นาย สมชาย รักดี',
      hn: 'HN 100002',
      id_card: '1234567890124',
      phone_number: '082-345-6789',
      address: '456 ถ.พหลโยธิน กรุงเทพฯ 10400'
    }
  ];

  const filteredPatients = mockPatients.filter(patient =>
    patient.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.hn.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.id_card.includes(searchTerm)
  );

  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient);
    setFormData(prev => ({
      ...prev,
      patient_id: patient.id,
      full_name: patient.full_name,
      hn: patient.hn,
      phone_number: patient.phone_number,
      address: patient.address
    }));
    setSearchTerm('');
  };

  const handleDepartmentChange = (department, checked) => {
    setFormData(prev => ({
      ...prev,
      departments: checked 
        ? [...prev.departments, department]
        : prev.departments.filter(d => d !== department)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Convert table_number_display to table_number
    const table_number = formData.table_number_display === 'เคสรวม' 
      ? null 
      : Number(formData.table_number_display);

    const appointmentData = {
      ...formData,
      table_number,
      appointment_date: appointmentDate
    };

    console.log('Submitting appointment:', appointmentData);
    
    // TODO: Save to appointments collection
    // After successful save, navigate back to appointments
    navigate('/appointments');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/appointments')}
            className="mr-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            กลับ
          </Button>
          <h1 className="text-2xl font-bold">เพิ่มนัดหมายผู้ป่วยใหม่</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Patient Search Section */}
          <Card>
            <CardHeader>
              <CardTitle>ค้นหาข้อมูลผู้ป่วย</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="ค้นหาด้วยชื่อ, HN, หรือเลขบัตรประชาชน"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Search Results */}
              {searchTerm && (
                <div className="border rounded-md max-h-48 overflow-y-auto">
                  {filteredPatients.map((patient) => (
                    <div
                      key={patient.id}
                      onClick={() => handlePatientSelect(patient)}
                      className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                    >
                      <div className="font-medium">{patient.full_name}</div>
                      <div className="text-sm text-gray-500">{patient.hn} | {patient.id_card}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Selected Patient Info */}
              {selectedPatient && (
                <div className="bg-blue-50 p-4 rounded-md">
                  <h4 className="font-medium text-blue-900 mb-2">ข้อมูลผู้ป่วยที่เลือก</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <div><span className="font-medium">ชื่อ:</span> {formData.full_name}</div>
                    <div><span className="font-medium">HN:</span> {formData.hn}</div>
                    <div><span className="font-medium">เบอร์โทร:</span> {formData.phone_number}</div>
                    <div className="md:col-span-2"><span className="font-medium">ที่อยู่:</span> {formData.address}</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Appointment Details */}
          <Card>
            <CardHeader>
              <CardTitle>รายละเอียดการนัดหมาย</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Date Picker */}
                <div>
                  <label className="block text-sm font-medium mb-2">วันที่นัด</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !appointmentDate && "text-muted-foreground"
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {appointmentDate ? format(appointmentDate, "dd/MM/yyyy") : "เลือกวันที่"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="single"
                        selected={appointmentDate}
                        onSelect={setAppointmentDate}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Time Picker */}
                <div>
                  <label className="block text-sm font-medium mb-2">เวลานัด</label>
                  <Input
                    type="time"
                    value={formData.appointment_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, appointment_time: e.target.value }))}
                  />
                </div>

                {/* Type */}
                <div>
                  <label className="block text-sm font-medium mb-2">ประเภทนัด</label>
                  <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกประเภทนัด" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="นัดใน รพ.">นัดใน รพ.</SelectItem>
                      <SelectItem value="นัดเยี่ยมนอก รพ.">นัดเยี่ยมนอก รพ.</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Center */}
                <div>
                  <label className="block text-sm font-medium mb-2">ศูนย์บริการ</label>
                  <Select value={formData.center} onValueChange={(value) => setFormData(prev => ({ ...prev, center: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกศูนย์บริการ" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="รพ.สต.ต้า">รพ.สต.ต้า</SelectItem>
                      <SelectItem value="รพ.สต.พระเนตร">รพ.สต.พระเนตร</SelectItem>
                      <SelectItem value="ทต.ป่าตาล">ทต.ป่าตาล</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Time Period */}
                <div>
                  <label className="block text-sm font-medium mb-2">ช่วงเวลา</label>
                  <Select value={formData.time_period} onValueChange={(value) => setFormData(prev => ({ ...prev, time_period: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกช่วงเวลา" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ในเวลาราชการ">ในเวลาราชการ</SelectItem>
                      <SelectItem value="นอกเวลาราชการ">นอกเวลาราชการ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Table Number */}
                <div>
                  <label className="block text-sm font-medium mb-2">โต๊ะ</label>
                  <Select value={formData.table_number_display} onValueChange={(value) => setFormData(prev => ({ ...prev, table_number_display: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกโต๊ะ" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="2">2</SelectItem>
                      <SelectItem value="3">3</SelectItem>
                      <SelectItem value="เคสรวม">เคสรวม</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Departments */}
              <div>
                <label className="block text-sm font-medium mb-2">แผนก (เลือกได้หลายแผนก)</label>
                <div className="flex flex-wrap gap-4">
                  {['กายภาพบำบัด', 'แผนไทย', 'แผนจีน'].map((dept) => (
                    <div key={dept} className="flex items-center space-x-2">
                      <Checkbox
                        id={dept}
                        checked={formData.departments.includes(dept)}
                        onCheckedChange={(checked) => handleDepartmentChange(dept, checked)}
                      />
                      <label htmlFor={dept} className="text-sm">{dept}</label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Note */}
              <div>
                <label className="block text-sm font-medium mb-2">หมายเหตุ</label>
                <Textarea
                  placeholder="หมายเหตุเพิ่มเติม"
                  value={formData.note}
                  onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-4">
            <Button 
              type="button" 
              variant="outline"
              onClick={() => navigate('/appointments')}
            >
              ยกเลิก
            </Button>
            <Button 
              type="submit" 
              className="bg-blue-600 hover:bg-blue-700"
              disabled={!selectedPatient || !appointmentDate}
            >
              <Plus className="w-4 h-4 mr-2" />
              บันทึกนัดหมาย
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewAppointmentForm;
