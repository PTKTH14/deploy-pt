
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
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PTStatusModalProps {
  open: boolean;
  onStatusSaved: () => void;
  userId: string;
}

const PTStatusModal = ({ open, onStatusSaved, userId }: PTStatusModalProps) => {
  const [tableNumber, setTableNumber] = useState<string>('');
  const [ptType, setPtType] = useState<string>('');
  const [isLeave, setIsLeave] = useState(false);
  const [leaveDates, setLeaveDates] = useState<Date[]>([]);
  const [tempLeaveDate, setTempLeaveDate] = useState<Date>();
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleAddLeaveDate = () => {
    if (tempLeaveDate && !leaveDates.some(date => 
      format(date, 'yyyy-MM-dd') === format(tempLeaveDate, 'yyyy-MM-dd')
    )) {
      setLeaveDates([...leaveDates, tempLeaveDate]);
      setTempLeaveDate(undefined);
    }
  };

  const handleRemoveLeaveDate = (dateToRemove: Date) => {
    setLeaveDates(leaveDates.filter(date => 
      format(date, 'yyyy-MM-dd') !== format(dateToRemove, 'yyyy-MM-dd')
    ));
  };

  const handleSubmit = async () => {
    if (!tableNumber || !ptType) {
      toast({
        title: "กรุณากรอกข้อมูลให้ครบถ้วน",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { error } = await supabase
        .from('pt_status')
        .insert({
          user_id: userId,
          date: today,
          table_number: parseInt(tableNumber),
          pt_type: ptType,
          is_leave: isLeave,
          leave_dates: isLeave ? leaveDates.map(date => format(date, 'yyyy-MM-dd')) : null
        });

      if (error) {
        throw error;
      }

      toast({
        title: "บันทึกข้อมูลสำเร็จ",
      });
      
      onStatusSaved();
    } catch (error) {
      console.error('Error saving PT status:', error);
      toast({
        title: "เกิดข้อผิดพลาดในการบันทึก",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-md" hideCloseButton>
        <DialogHeader>
          <DialogTitle>กรอกข้อมูลก่อนเข้าระบบ</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="table">วันนี้อยู่โต๊ะไหน</Label>
            <Select value={tableNumber} onValueChange={setTableNumber}>
              <SelectTrigger>
                <SelectValue placeholder="เลือกโต๊ะ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">โต๊ะ 1</SelectItem>
                <SelectItem value="2">โต๊ะ 2</SelectItem>
                <SelectItem value="3">โต๊ะ 3</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ptType">ประเภท PT</Label>
            <Select value={ptType} onValueChange={setPtType}>
              <SelectTrigger>
                <SelectValue placeholder="เลือกประเภท PT" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ศูนย์บริการ">PT ประจำศูนย์บริการ</SelectItem>
                <SelectItem value="เยี่ยมบ้าน">PT เยี่ยมบ้าน</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="leave"
              checked={isLeave}
              onCheckedChange={setIsLeave}
            />
            <Label htmlFor="leave">วันนี้มีลาหรือไม่?</Label>
          </div>

          {isLeave && (
            <div className="space-y-2">
              <Label>เลือกวันลา</Label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "justify-start text-left font-normal flex-1",
                        !tempLeaveDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {tempLeaveDate ? format(tempLeaveDate, "dd/MM/yyyy") : "เลือกวันที่"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={tempLeaveDate}
                      onSelect={setTempLeaveDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <Button
                  type="button"
                  onClick={handleAddLeaveDate}
                  disabled={!tempLeaveDate}
                >
                  เพิ่ม
                </Button>
              </div>
              
              {leaveDates.length > 0 && (
                <div className="space-y-1">
                  <Label className="text-sm text-gray-600">วันลาที่เลือก:</Label>
                  {leaveDates.map((date) => (
                    <div key={format(date, 'yyyy-MM-dd')} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                      <span className="text-sm">{format(date, 'dd/MM/yyyy')}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveLeaveDate(date)}
                      >
                        ลบ
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <Button 
            onClick={handleSubmit} 
            className="w-full"
            disabled={loading || !tableNumber || !ptType}
          >
            {loading ? "กำลังบันทึก..." : "บันทึกและเข้าระบบ"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PTStatusModal;
