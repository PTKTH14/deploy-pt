
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, MapPin, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type User = Database['public']['Tables']['users']['Row'];

interface DailyStatusDialogProps {
  user: User;
  onComplete: () => void;
}

const DailyStatusDialog: React.FC<DailyStatusDialogProps> = ({ user, onComplete }) => {
  const [step, setStep] = useState(1);
  const [tableNumber, setTableNumber] = useState<string>(user.table_number?.toString() || '');
  const [workType, setWorkType] = useState<string>(user.visit_type || '');
  const [isOnLeave, setIsOnLeave] = useState(false);
  const [leaveDates, setLeaveDates] = useState<Date[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const isPT = user.role === 'pt';
  const totalSteps = 3; // PT questions + Leave question + Confirmation

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    setLeaveDates(prev => {
      const isSelected = prev.some(d => d.getTime() === date.getTime());
      if (isSelected) {
        return prev.filter(d => d.getTime() !== date.getTime());
      } else {
        return [...prev, date];
      }
    });
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    
    try {
      const statusData = {
        user_id: user.id,
        date: new Date().toISOString().split('T')[0],
        table_number: isPT && tableNumber ? parseInt(tableNumber) : null,
        pt_type: isPT ? workType : null,
        is_leave: isOnLeave,
        leave_dates: leaveDates.map(date => date.toISOString().split('T')[0])
      };

      const { error } = await supabase
        .from('pt_status')
        .upsert(statusData, { 
          onConflict: 'user_id,date',
          ignoreDuplicates: false 
        });

      if (error) throw error;

      toast({
        title: "บันทึกข้อมูลสำเร็จ",
        description: "ข้อมูลสถานะรายวันของคุณได้ถูกบันทึกแล้ว"
      });

      onComplete();
    } catch (error) {
      console.error('Error saving daily status:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    if (step === 1 && isPT) {
      return (
        <div className="space-y-6">
          <div>
            <Label className="text-base font-medium">วันนี้คุณอยู่โต๊ะไหน?</Label>
            <RadioGroup value={tableNumber} onValueChange={setTableNumber} className="mt-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="1" id="table1" />
                <Label htmlFor="table1">โต๊ะ 1</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="2" id="table2" />
                <Label htmlFor="table2">โต๊ะ 2</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="3" id="table3" />
                <Label htmlFor="table3">โต๊ะ 3</Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label className="text-base font-medium">ประเภทการทำงาน:</Label>
            <RadioGroup value={workType} onValueChange={setWorkType} className="mt-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="ประจำศูนย์" id="center" />
                <Label htmlFor="center" className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  ประจำศูนย์
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="เยี่ยมบ้าน" id="homevisit" />
                <Label htmlFor="homevisit" className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  เยี่ยมบ้าน
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>
      );
    }

    if ((step === 2 && isPT) || (step === 1 && !isPT)) {
      return (
        <div className="space-y-6">
          <div>
            <Label className="text-base font-medium">วันนี้มีการลาหรือหยุดงานหรือไม่?</Label>
            <div className="flex items-center space-x-2 mt-2">
              <Checkbox 
                id="onLeave" 
                checked={isOnLeave} 
                onCheckedChange={(checked) => setIsOnLeave(checked === true)}
              />
              <Label htmlFor="onLeave">มีการลาหรือหยุดงาน</Label>
            </div>
          </div>

          {isOnLeave && (
            <div>
              <Label className="text-base font-medium">เลือกวันที่ลา:</Label>
              <div className="mt-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {leaveDates.length > 0 
                        ? `เลือกแล้ว ${leaveDates.length} วัน`
                        : 'เลือกวันที่ลา'
                      }
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="multiple"
                      selected={leaveDates}
                      onSelect={(dates) => setLeaveDates(dates || [])}
                      locale={th}
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                
                {leaveDates.length > 0 && (
                  <div className="mt-2 p-2 bg-blue-50 rounded">
                    <p className="text-sm font-medium text-blue-800">วันที่เลือก:</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {leaveDates.map((date, index) => (
                        <span key={index} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {format(date, 'dd/MM/yyyy', { locale: th })}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      );
    }

    // Confirmation step
    return (
      <div className="space-y-4">
        <h3 className="font-medium">ยืนยันข้อมูล:</h3>
        <div className="bg-gray-50 p-4 rounded space-y-2">
          <p><strong>ชื่อ:</strong> {user.full_name}</p>
          <p><strong>บทบาท:</strong> {user.role}</p>
          {isPT && (
            <>
              <p><strong>โต๊ะ:</strong> {tableNumber}</p>
              <p><strong>ประเภทงาน:</strong> {workType}</p>
            </>
          )}
          <p><strong>สถานะลา:</strong> {isOnLeave ? 'มีการลา' : 'ไม่มีการลา'}</p>
          {isOnLeave && leaveDates.length > 0 && (
            <p><strong>วันที่ลา:</strong> {leaveDates.map(d => format(d, 'dd/MM/yyyy', { locale: th })).join(', ')}</p>
          )}
        </div>
      </div>
    );
  };

  const canProceed = () => {
    if (step === 1 && isPT) {
      return tableNumber && workType;
    }
    if ((step === 2 && isPT) || (step === 1 && !isPT)) {
      return !isOnLeave || leaveDates.length > 0;
    }
    return true;
  };

  const nextStep = () => {
    if (isPT) {
      if (step < totalSteps) {
        setStep(step + 1);
      } else {
        handleSubmit();
      }
    } else {
      if (step < 2) {
        setStep(step + 1);
      } else {
        handleSubmit();
      }
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  return (
    <Dialog open={true}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>ข้อมูลสถานะรายวัน</DialogTitle>
          <DialogDescription>
            กรุณากรอกข้อมูลสำหรับวันนี้ ({format(new Date(), 'dd/MM/yyyy', { locale: th })})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {renderStepContent()}

          <div className="flex justify-between">
            {step > 1 && (
              <Button variant="outline" onClick={prevStep}>
                ย้อนกลับ
              </Button>
            )}
            <div className="flex-1" />
            <Button 
              onClick={nextStep}
              disabled={!canProceed() || isLoading}
            >
              {isLoading ? 'กำลังบันทึก...' : 
               (step === totalSteps || (!isPT && step === 2)) ? 'บันทึก' : 'ถัดไป'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DailyStatusDialog;
