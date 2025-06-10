
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
import { useSearchPatients } from '@/hooks/usePatients';
import { useAddAppointment } from '@/hooks/useAppointments';
import { useToast } from '@/hooks/use-toast';

const NewAppointmentForm = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [appointmentDate, setAppointmentDate] = useState<Date | undefined>(undefined);
  const [manualEntry, setManualEntry] = useState(false);
  const [formData, setFormData] = useState({
    patient_id: '',
    full_name: '',
    hn: '',
    phone_number: '',
    address: '',
    appointment_date: null,
    appointment_time: '',
    departments: [] as string[],
    appointment_type: '',
    center: '', // Empty by default
    time_period: '',
    status: 'new',
    table_number_display: '',
    note: ''
  });

  const { data: searchResults = [] } = useSearchPatients(searchTerm);
  const addAppointmentMutation = useAddAppointment();

  const handlePatientSelect = (patient: any) => {
    console.log('Selected patient:', patient);
    setSelectedPatient(patient);
    setFormData(prev => ({
      ...prev,
      patient_id: patient.id,
      full_name: patient.full_name || '',
      hn: patient.hn || '',
      phone_number: patient.phone_number || '',
      address: patient.full_address || ''
    }));
    setSearchTerm('');
    setManualEntry(false);
  };

  const handleManualEntry = () => {
    setManualEntry(true);
    setSelectedPatient(null);
    setSearchTerm('');
    setFormData(prev => ({
      ...prev,
      patient_id: '',
      full_name: '',
      hn: '',
      phone_number: '',
      address: ''
    }));
  };

  const handleDepartmentChange = (department: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      departments: checked 
        ? [...prev.departments, department]
        : prev.departments.filter(d => d !== department)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if ((!selectedPatient && !manualEntry) || !appointmentDate) {
      toast({
        title: "ข้อมูลไม่ครบถ้วน",
        description: "กรุณาเลือกผู้ป่วยหรือกรอกข้อมูลและวันที่นัด",
        variant: "destructive",
      });
      return;
    }

    if (manualEntry && (!formData.full_name || !formData.hn)) {
      toast({
        title: "ข้อมูลไม่ครบถ้วน",
        description: "กรุณากรอกชื่อและ HN",
        variant: "destructive",
      });
      return;
    }

    try {
      const appointmentData = {
        patient_id: formData.patient_id || `temp_${Date.now()}`,
        full_name: formData.full_name,
        hn: formData.hn,
        phone_number: formData.phone_number || '',
        address: formData.address || '',
        appointment_date: format(appointmentDate, 'yyyy-MM-dd'),
        appointment_time: formData.appointment_time || null,
        departments: formData.departments.length > 0 ? formData.departments : ['กายภาพบำบัด'],
        appointment_type: formData.appointment_type === 'นัดใน รพ.' ? 'in' as const : 
                         formData.appointment_type === 'นัดเยี่ยมนอก รพ.' ? 'out' as const : 'in' as const,
        center: formData.center ? formData.center as 'รพ.สต.ต้า' | 'รพ.สต.พระเนตร' | 'ทต.ป่าตาล' : null,
        time_period: formData.time_period ? formData.time_period as 'ในเวลาราชการ' | 'นอกเวลาราชการ' : 'ในเวลาราชการ',
        table_number: formData.table_number_display === 'เคสรวม' ? null : 
                     formData.table_number_display ? Number(formData.table_number_display) : 1,
        status: 'new' as const,
        note: formData.note || null
      };

      console.log('Submitting appointment:', appointmentData);
      
      await addAppointmentMutation.mutateAsync(appointmentData);
      
      toast({
        title: "บันทึกนัดหมายสำเร็จ",
        description: `สร้างนัดหมายสำหรับ ${formData.full_name} เรียบร้อยแล้ว`,
      });
      
      navigate('/appointments');
    } catch (error) {
      console.error('Error saving appointment:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถบันทึกนัดหมายได้ กรุณาลองใหม่อีกครั้ง",
        variant: "destructive",
      });
    }
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
          <Card>
            <CardHeader>
              <CardTitle>ข้อมูลผู้ป่วย</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4 mb-4">
                <Button
                  type="button"
                  variant={!manualEntry ? "default" : "outline"}
                  onClick={() => setManualEntry(false)}
                >
                  ค้นหาจากฐานข้อมูล
                </Button>
                <Button
                  type="button"
                  variant={manualEntry ? "default" : "outline"}
                  onClick={handleManualEntry}
                >
                  กรอกข้อมูลเอง
                </Button>
              </div>

              {!manualEntry ? (
                <>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="ค้นหาด้วยชื่อ, HN, หรือเลขบัตรประชาชน"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {searchTerm && searchResults.length > 0 && (
                    <div className="border rounded-md max-h-48 overflow-y-auto">
                      {searchResults.map((patient) => (
                        <div
                          key={patient.id}
                          onClick={() => handlePatientSelect(patient)}
                          className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                        >
                          <div className="font-medium">{patient.full_name}</div>
                          <div className="text-sm text-gray-500">{patient.hn} | {patient.cid}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {searchTerm && searchResults.length === 0 && (
                    <div className="text-center py-4 text-gray-500">
                      ไม่พบผู้ป่วยที่ค้นหา
                    </div>
                  )}
                </>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">ชื่อ-นามสกุล *</label>
                    <Input
                      placeholder="กรอกชื่อ-นามสกุล"
                      value={formData.full_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">เลข HN *</label>
                    <Input
                      placeholder="กรอกเลข HN"
                      value={formData.hn}
                      onChange={(e) => setFormData(prev => ({ ...prev, hn: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">เบอร์โทร</label>
                    <Input
                      placeholder="กรอกเบอร์โทร"
                      value={formData.phone_number}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">ที่อยู่</label>
                    <Input
                      placeholder="กรอกที่อยู่"
                      value={formData.address}
                      onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    />
                  </div>
                </div>
              )}

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

          <Card>
            <CardHeader>
              <CardTitle>รายละเอียดการนัดหมาย</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">วันที่นัด *</label>
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

                <div>
                  <label className="block text-sm font-medium mb-2">เวลานัด</label>
                  <Input
                    type="time"
                    value={formData.appointment_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, appointment_time: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">ประเภทนัด</label>
                  <Select value={formData.appointment_type} onValueChange={(value) => setFormData(prev => ({ ...prev, appointment_type: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกประเภทนัด" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="นัดใน รพ.">นัดใน รพ.</SelectItem>
                      <SelectItem value="นัดเยี่ยมนอก รพ.">นัดเยี่ยมนอก รพ.</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

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

              <div>
                <label className="block text-sm font-medium mb-2">แผนก (เลือกได้หลายแผนก)</label>
                <div className="flex flex-wrap gap-4">
                  {['กายภาพบำบัด', 'แผนไทย', 'แผนจีน'].map((dept) => (
                    <div key={dept} className="flex items-center space-x-2">
                      <Checkbox
                        id={dept}
                        checked={formData.departments.includes(dept)}
                        onCheckedChange={(checked) => handleDepartmentChange(dept, checked as boolean)}
                      />
                      <label htmlFor={dept} className="text-sm">{dept}</label>
                    </div>
                  ))}
                </div>
              </div>

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
              disabled={(!selectedPatient && !manualEntry) || !appointmentDate || addAppointmentMutation.isPending}
            >
              <Plus className="w-4 h-4 mr-2" />
              {addAppointmentMutation.isPending ? 'กำลังบันทึก...' : 'บันทึกนัดหมาย'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewAppointmentForm;
