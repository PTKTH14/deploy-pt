
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Clock, User } from 'lucide-react';

interface Patient {
  id: string;
  full_name: string;
  hn: string;
  phone_number: string;
}

interface AppointmentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedPatient?: Patient | null;
}

const AppointmentFormDialog = ({ open, onOpenChange, selectedPatient }: AppointmentFormDialogProps) => {
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [department, setDepartment] = useState('');
  const [table, setTable] = useState('');
  const [note, setNote] = useState('');
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!appointmentDate || !appointmentTime || !department) {
      toast({
        title: "ข้อมูลไม่ครบถ้วน",
        description: "กรุณากรอกข้อมูลที่จำเป็น",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "สร้างนัดหมายสำเร็จ",
      description: `สร้างนัดหมายสำหรับ ${selectedPatient?.full_name} วันที่ ${appointmentDate} เวลา ${appointmentTime}`,
    });

    // Reset form
    setAppointmentDate('');
    setAppointmentTime('');
    setDepartment('');
    setTable('');
    setNote('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            สร้างนัดหมาย
          </DialogTitle>
        </DialogHeader>

        {selectedPatient && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2 text-blue-700">
              <User className="w-4 h-4" />
              <span className="font-medium">{selectedPatient.full_name}</span>
            </div>
            <div className="text-sm text-blue-600 mt-1">
              HN: {selectedPatient.hn} | โทร: {selectedPatient.phone_number}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="appointmentDate">วันที่นัด</Label>
              <Input
                id="appointmentDate"
                type="date"
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="appointmentTime">เวลานัด</Label>
              <Input
                id="appointmentTime"
                type="time"
                value={appointmentTime}
                onChange={(e) => setAppointmentTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="department">แผนก</Label>
            <Select value={department} onValueChange={setDepartment} required>
              <SelectTrigger>
                <SelectValue placeholder="เลือกแผนก" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="กายภาพ">กายภาพ</SelectItem>
                <SelectItem value="แผนจีน">แผนจีน</SelectItem>
                <SelectItem value="แผนไทย">แผนไทย</SelectItem>
                <SelectItem value="เคสร่วม">เคสร่วม</SelectItem>
                <SelectItem value="นอกเวลา">นอกเวลา</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="table">โต๊ะ (ถ้ามี)</Label>
            <Select value={table} onValueChange={setTable}>
              <SelectTrigger>
                <SelectValue placeholder="เลือกโต๊ะ (ไม่บังคับ)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">โต๊ะ 1</SelectItem>
                <SelectItem value="2">โต๊ะ 2</SelectItem>
                <SelectItem value="3">โต๊ะ 3</SelectItem>
                <SelectItem value="4">โต๊ะ 4</SelectItem>
                <SelectItem value="5">โต๊ะ 5</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">หมายเหตุ</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="หมายเหตุเพิ่มเติม..."
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1">
              สร้างนัดหมาย
            </Button>
            <Button 
              type="button"
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              ยกเลิก
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AppointmentFormDialog;
