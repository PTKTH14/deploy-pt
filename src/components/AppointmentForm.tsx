
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar, CalendarCheck, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAddAppointment } from '@/hooks/useAppointments';
import { useToast } from '@/hooks/use-toast';
import Navbar from './Navbar';

const AppointmentForm = () => {
  const navigate = useNavigate();
  const addAppointment = useAddAppointment();
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    full_name: '',
    hn: '',
    phone: '',
    age: '',
    gender: '',
    appointment_date: '',
    appointment_time: '',
    appointment_type: 'in' as 'in' | 'out',
    departments: [] as string[],
    center: '' as 'รพ.สต.ต้า' | 'รพ.สต.พระเนตร' | 'ทต.ป่าตาล' | '',
    table_number: null as number | null,
    notes: '',
    status: 'new'
  });

  const [isNewPatient, setIsNewPatient] = useState(false);

  const handleInputChange = (field: string, value: any) => {
    console.log(`Updating ${field} with value:`, value);
    setFormData(prev => ({
      ...prev,
      [field]: value
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
    
    try {
      console.log('Submitting form data:', formData);
      
      // Basic validation
      if (!formData.full_name || !formData.hn || !formData.appointment_date) {
        toast({
          title: "ข้อมูลไม่ครบถ้วน",
          description: "กรุณากรอกข้อมูลที่จำเป็น (ชื่อ-นามสกุล, HN, วันที่นัด)",
          variant: "destructive",
        });
        return;
      }

      if (formData.departments.length === 0) {
        toast({
          title: "ข้อมูลไม่ครบถ้วน", 
          description: "กรุณาเลือกแผนกอย่างน้อย 1 แผนก",
          variant: "destructive",
        });
        return;
      }

      // Prepare data for submission with proper types
      const appointmentData = {
        full_name: formData.full_name.trim(),
        hn: formData.hn.trim(),
        phone_number: formData.phone?.trim() || undefined,
        age: formData.age ? parseInt(formData.age) : undefined,
        appointment_date: formData.appointment_date,
        appointment_time: formData.appointment_time || undefined,
        appointment_type: formData.appointment_type,
        departments: formData.departments,
        center: formData.center || undefined,
        table_number: formData.table_number || undefined,
        note: formData.notes?.trim() || undefined,
        status: formData.status as 'new' | 'confirmed' | 'cancelled' | 'completed'
      };

      console.log('Final appointment data:', appointmentData);

      await addAppointment.mutateAsync(appointmentData);
      
      toast({
        title: "บันทึกสำเร็จ",
        description: "นัดหมายได้ถูกบันทึกเรียบร้อยแล้ว",
      });
      
      navigate('/appointments');
    } catch (error) {
      console.error('Error submitting appointment:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถบันทึกนัดหมายได้ กรุณาลองใหม่อีกครั้ง",
        variant: "destructive",
      });
    }
  };

  const handleNewPatientChange = (checked: boolean | "indeterminate") => {
    setIsNewPatient(checked === true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="outline" 
            onClick={() => navigate('/appointments')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            กลับ
          </Button>
          <h1 className="text-2xl font-bold">เพิ่มนัดหมายผู้ป่วยใหม่</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Patient Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                ข้อมูลผู้ป่วย
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="new-patient" 
                  checked={isNewPatient}
                  onCheckedChange={handleNewPatientChange}
                />
                <Label htmlFor="new-patient">ผู้ป่วยใหม่</Label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full-name">ชื่อ-นามสกุล *</Label>
                  <Input
                    id="full-name"
                    value={formData.full_name}
                    onChange={(e) => handleInputChange('full_name', e.target.value)}
                    placeholder="กรอกชื่อ-นามสกุล"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hn">HN *</Label>
                  <Input
                    id="hn"
                    value={formData.hn}
                    onChange={(e) => handleInputChange('hn', e.target.value)}
                    placeholder="เลขประจำตัวผู้ป่วย"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">เบอร์โทรศัพท์</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="หมายเลขโทรศัพท์"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="age">อายุ</Label>
                  <Input
                    id="age"
                    type="number"
                    value={formData.age}
                    onChange={(e) => handleInputChange('age', e.target.value)}
                    placeholder="อายุ (ปี)"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>เพศ</Label>
                <RadioGroup 
                  value={formData.gender} 
                  onValueChange={(value) => handleInputChange('gender', value)}
                  className="flex gap-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="male" id="male" />
                    <Label htmlFor="male">ชาย</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="female" id="female" />
                    <Label htmlFor="female">หญิง</Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>

          {/* Appointment Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarCheck className="w-5 h-5" />
                รายละเอียดการนัด
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="appointment-date">วันที่นัด *</Label>
                  <Input
                    id="appointment-date"
                    type="date"
                    value={formData.appointment_date}
                    onChange={(e) => handleInputChange('appointment_date', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="appointment-time">เวลานัด</Label>
                  <Input
                    id="appointment-time"
                    type="time"
                    value={formData.appointment_time}
                    onChange={(e) => handleInputChange('appointment_time', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="appointment-type">ประเภทการนัด *</Label>
                  <Select 
                    value={formData.appointment_type} 
                    onValueChange={(value: 'in' | 'out') => handleInputChange('appointment_type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกประเภทการนัด" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in">นัดใน รพ.</SelectItem>
                      <SelectItem value="out">นัดเยี่ยมนอก รพ.</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="center">ศูนย์บริการ</Label>
                  <Select 
                    value={formData.center} 
                    onValueChange={(value: 'รพ.สต.ต้า' | 'รพ.สต.พระเนตร' | 'ทต.ป่าตาล') => handleInputChange('center', value)}
                  >
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
              </div>

              {/* Department Selection */}
              <div className="space-y-3">
                <Label>แผนก *</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { id: 'กายภาพบำบัด', label: 'กายภาพบำบัด' },
                    { id: 'แผนไทย', label: 'แผนไทย' },
                    { id: 'แผนจีน', label: 'แผนจีน' }
                  ].map((dept) => (
                    <div key={dept.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={dept.id}
                        checked={formData.departments.includes(dept.id)}
                        onCheckedChange={(checked) => handleDepartmentChange(dept.id, checked === true)}
                      />
                      <Label htmlFor={dept.id}>{dept.label}</Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Table Number - Show only for กายภาพบำบัด */}
              {formData.departments.includes('กายภาพบำบัด') && (
                <div className="space-y-2">
                  <Label htmlFor="table-number">หมายเลขโต๊ะ</Label>
                  <Select 
                    value={formData.table_number?.toString() || ''} 
                    onValueChange={(value) => handleInputChange('table_number', value ? parseInt(value) : null)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกหมายเลขโต๊ะ" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">โต๊ะ 1</SelectItem>
                      <SelectItem value="2">โต๊ะ 2</SelectItem>
                      <SelectItem value="3">โต๊ะ 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="notes">หมายเหตุ</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="หมายเหตุเพิ่มเติม"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex gap-4">
            <Button 
              type="submit" 
              className="bg-blue-600 hover:bg-blue-700"
              disabled={addAppointment.isPending}
            >
              {addAppointment.isPending ? 'กำลังบันทึก...' : 'บันทึกนัดหมาย'}
            </Button>
            <Button 
              type="button" 
              variant="outline"
              onClick={() => navigate('/appointments')}
            >
              ยกเลิก
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AppointmentForm;
