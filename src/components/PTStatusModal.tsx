
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
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
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleDateSelect = (date: Date | undefined) => {
    if (date && !leaveDates.find(d => d.toDateString() === date.toDateString())) {
      setLeaveDates([...leaveDates, date]);
    }
    setSelectedDate(undefined);
  };

  const removeLeavDate = (dateToRemove: Date) => {
    setLeaveDates(leaveDates.filter(date => date.toDateString() !== dateToRemove.toDateString()));
  };

  const handleSave = async () => {
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
          leave_dates: isLeave ? leaveDates.map(date => date.toISOString().split('T')[0]) : null
        });

      if (error) {
        console.error('Error saving PT status:', error);
        toast({
          title: "เกิดข้อผิดพลาดในการบันทึกข้อมูล",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "บันทึกข้อมูลสำเร็จ",
      });
      
      onStatusSaved();
    } catch (error) {
      console.error('Error saving PT status:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>ข้อมูลการทำงานวันนี้</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="table">โต๊ะที่ทำงาน</Label>
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
                <SelectValue placeholder="เลือกประเภท" />
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
              <Label>วันที่ลา</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    เลือกวันที่ลา
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    locale={th}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              
              {leaveDates.length > 0 && (
                <div className="space-y-1">
                  <Label className="text-sm">วันที่ลาที่เลือก:</Label>
                  {leaveDates.map((date, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-100 p-2 rounded">
                      <span className="text-sm">
                        {format(date, 'dd/MM/yyyy', { locale: th })}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeLeavDate(date)}
                        className="h-6 w-6 p-0"
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <Button onClick={handleSave} disabled={loading} className="w-full">
            {loading ? "กำลังบันทึก..." : "บันทึก"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PTStatusModal;
