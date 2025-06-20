import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface AddPatientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPatientAdded: (patient: any) => void;
}

const AddPatientDialog = ({ open, onOpenChange, onPatientAdded }: AddPatientDialogProps) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [hn, setHn] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!firstName || !lastName || !hn || !phoneNumber) {
      toast({
        title: "ข้อมูลไม่ครบถ้วน",
        description: "กรุณากรอกข้อมูลให้ครบถ้วน",
        variant: "destructive",
      });
      return;
    }

    const newPatient = {
      id: Date.now().toString(),
      full_name: `${firstName} ${lastName}`,
      cid: '0000000000000', // Default placeholder
      hn: hn,
      right_type: 'UC', // Default
      phone_number: phoneNumber,
      address: 'ไม่ระบุ' // Default
    };

    onPatientAdded(newPatient);
    
    toast({
      title: "เพิ่มผู้ป่วยสำเร็จ",
      description: `เพิ่ม ${newPatient.full_name} เข้าระบบแล้ว`,
    });

    // Reset form
    setFirstName('');
    setLastName('');
    setHn('');
    setPhoneNumber('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>เพิ่มผู้ป่วยใหม่</DialogTitle>
          <DialogDescription>
            กรอกข้อมูลผู้ป่วยใหม่เพื่อบันทึกเข้าสู่ระบบ
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">ชื่อ</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="ชื่อ"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">นามสกุล</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="นามสกุล"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="hn">HN</Label>
            <Input
              id="hn"
              value={hn}
              onChange={(e) => setHn(e.target.value)}
              placeholder="HN001234"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phoneNumber">เบอร์โทรศัพท์</Label>
            <Input
              id="phoneNumber"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="081-234-5678"
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1">
              เพิ่มผู้ป่วย
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

export default AddPatientDialog;
