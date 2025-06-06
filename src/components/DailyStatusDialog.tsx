
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, MapPin, Home } from 'lucide-react';
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
  const [selectedChoice, setSelectedChoice] = useState<string>('');
  const [isOnLeave, setIsOnLeave] = useState(false);
  const [leaveDates, setLeaveDates] = useState<Date[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const isPT = user.role === 'pt';
  const totalSteps = isPT ? 3 : 2; // PT questions + Leave question + Confirmation

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
      let tableNumber = null;
      let ptType = null;

      if (isPT && selectedChoice) {
        if (selectedChoice.startsWith('table-')) {
          tableNumber = parseInt(selectedChoice.replace('table-', ''));
          ptType = 'ประจำศูนย์';
        } else if (selectedChoice === 'center') {
          ptType = 'ประจำศูนย์';
        } else if (selectedChoice === 'homevisit') {
          ptType = 'เยี่ยมบ้าน';
        }
      }

      const statusData = {
        user_id: user.id,
        date: new Date().toISOString().split('T')[0],
        table_number: tableNumber,
        pt_type: ptType,
        is_leave: isOnLeave,
        leave_dates: leaveDates.map(date => date.toISOString().split('T')[0])
      };

      console.log('Saving status data:', statusData);

      const { error } = await supabase
        .from('pt_status')
        .upsert(statusData, { 
          onConflict: 'user_id,date',
          ignoreDuplicates: false 
        });

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

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
            <Label className="text-base font-medium mb-4 block">1. วันนี้คุณทำงานอย่างไร? (เลือกได้ 1 อย่าง)</Label>
            <RadioGroup value={selectedChoice} onValueChange={setSelectedChoice} className="space-y-3">
              <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                <RadioGroupItem value="table-1" id="table1" />
                <div className="flex items-center space-x-2">
                  <span className="text-red-600">🪑</span>
                  <Label htmlFor="table1" className="cursor-pointer">โต๊ะ 1 (ในเขต)</Label>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                <RadioGroupItem value="table-2" id="table2" />
                <div className="flex items-center space-x-2">
                  <span className="text-red-600">🪑</span>
                  <Label htmlFor="table2" className="cursor-pointer">โต๊ะ 2 (ในเขต)</Label>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                <RadioGroupItem value="table-3" id="table3" />
                <div className="flex items-center space-x-2">
                  <span className="text-red-600">🪑</span>
                  <Label htmlFor="table3" className="cursor-pointer">โต๊ะ 3 (ในเขต)</Label>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                <RadioGroupItem value="center" id="center" />
                <div className="flex items-center space-x-2">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  <Label htmlFor="center" className="cursor-pointer">ตั้งประจำศูนย์</Label>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                <RadioGroupItem value="homevisit" id="homevisit" />
                <div className="flex items-center space-x-2">
                  <Home className="w-5 h-5 text-green-600" />
                  <Label htmlFor="homevisit" className="cursor-pointer">เยี่ยมบ้าน</Label>
                </div>
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
            <Label className="text-base font-medium mb-4 block">2. มีการลาหรือหยุดงานหรือไม่?</Label>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 border rounded-lg">
                <input 
                  type="radio" 
                  id="noLeave" 
                  name="leaveStatus"
                  checked={!isOnLeave}
                  onChange={() => setIsOnLeave(false)}
                  className="w-4 h-4"
                />
                <div className="flex items-center space-x-2">
                  <span className="text-red-500">❌</span>
                  <Label htmlFor="noLeave" className="cursor-pointer">ไม่มี</Label>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 border rounded-lg">
                <input 
                  type="radio" 
                  id="hasLeave" 
                  name="leaveStatus"
                  checked={isOnLeave}
                  onChange={() => setIsOnLeave(true)}
                  className="w-4 h-4"
                />
                <div className="flex items-center space-x-2">
                  <span className="text-green-500">✅</span>
                  <Label htmlFor="hasLeave" className="cursor-pointer">มี (เลือกวันที่)</Label>
                </div>
              </div>
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
          {isPT && selectedChoice && (
            <p><strong>การทำงาน:</strong> {
              selectedChoice.startsWith('table-') 
                ? `โต๊ะ ${selectedChoice.replace('table-', '')} (ในเขต)` 
                : selectedChoice === 'center' 
                ? 'ตั้งประจำศูนย์' 
                : 'เยี่ยมบ้าน'
            }</p>
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
      return selectedChoice !== '';
    }
    if ((step === 2 && isPT) || (step === 1 && !isPT)) {
      return !isOnLeave || leaveDates.length > 0;
    }
    return true;
  };

  const nextStep = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  return (
    <Dialog open={true}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
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
              className="bg-gradient-to-r from-blue-400 to-green-400 hover:from-blue-500 hover:to-green-500 text-white"
            >
              {isLoading ? 'กำลังบันทึก...' : 
               step === totalSteps ? 'ดำเนินการ' : 'ถัดไป'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DailyStatusDialog;
