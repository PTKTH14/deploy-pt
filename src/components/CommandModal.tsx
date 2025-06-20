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
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Loader2, Bot, FileText, Mic } from 'lucide-react';
import { VoiceInput } from './VoiceInput';
import { useToast } from '@/hooks/use-toast';
import { useAddAppointment } from '@/hooks/useAppointments';
import { supabase } from '@/integrations/supabase/client';

interface CommandModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface AnalyzedResult {
  action?: string;
  patient_name?: string;
  new_date?: string;
  new_time?: string;
  table?: string;
  note?: string;
  error?: string;
  old_date?: string;
}

const CommandModal: React.FC<CommandModalProps> = ({ open, onOpenChange }) => {
  const [inputCommand, setInputCommand] = useState('');
  const [outputJson, setOutputJson] = useState<AnalyzedResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const { toast } = useToast();
  const addAppointmentMutation = useAddAppointment();

  const analyzeCommand = async () => {
    if (!inputCommand.trim()) return;
    
    setIsAnalyzing(true);
    
    // Simulate AI analysis (mock implementation)
    try {
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call delay
      
      // Mock AI analysis based on common patterns
      const command = inputCommand.toLowerCase();
      let result: AnalyzedResult = {};
      
      if (command.includes('เลื่อน')) {
        result = {
          action: 'reschedule',
          patient_name: extractPatientName(inputCommand),
          new_date: extractDate(inputCommand),
          new_time: extractTime(inputCommand),
          table: extractTable(inputCommand),
          note: 'เลื่อนนัดหมายตามคำขอ',
          old_date: extractDate(inputCommand)
        };
      } else if (command.includes('นัด') || command.includes('จอง')) {
        result = {
          action: 'create',
          patient_name: extractPatientName(inputCommand),
          new_date: extractDate(inputCommand),
          new_time: extractTime(inputCommand),
          table: extractTable(inputCommand),
          note: 'สร้างนัดหมายใหม่'
        };
      } else if (command.includes('ยกเลิก')) {
        result = {
          action: 'cancel',
          patient_name: extractPatientName(inputCommand),
          note: 'ยกเลิกนัดหมาย'
        };
      } else {
        result = {
          error: 'ไม่เข้าใจคำสั่ง'
        };
      }
      
      setOutputJson(result);
    } catch (error) {
      setOutputJson({ error: 'เกิดข้อผิดพลาดในการวิเคราะห์' });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Helper functions to extract information from command
  const extractPatientName = (command: string): string => {
    const namePatterns = [
      /(?:เลื่อน|นัด|จอง)(.+?)(?:ไป|วันที่|เวลา|ที่โต๊ะ)/,
      /(?:คุณ|คุนครู|นาย|นาง|นางสาว)\s*(\S+)/
    ];
    
    for (const pattern of namePatterns) {
      const match = command.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    return 'ไม่ระบุชื่อ';
  };

  const extractDate = (command: string): string => {
    const datePatterns = [
      /(\d{1,2})\s*(?:มิ\.ย\.|มิถุนายน)/,
      /วันที่\s*(\d{1,2})/,
      /(\d{1,2})\/(\d{1,2})/,
      /วันพรุ่งนี้/,
      /วันนี้/,
      /อาทิตย์หน้า/
    ];
    
    const currentYear = new Date().getFullYear();
    
    for (const pattern of datePatterns) {
      const match = command.match(pattern);
      if (match) {
        if (match[0].includes('วันพรุ่งนี้')) {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          return tomorrow.toISOString().split('T')[0];
        } else if (match[0].includes('วันนี้')) {
          return new Date().toISOString().split('T')[0];
        } else if (match[0].includes('อาทิตย์หน้า')) {
          const nextWeek = new Date();
          nextWeek.setDate(nextWeek.getDate() + 7);
          return nextWeek.toISOString().split('T')[0];
        } else if (match[1]) {
          const day = match[1].padStart(2, '0');
          const month = command.includes('มิ.ย.') || command.includes('มิถุนายน') ? '06' : '01';
          return `${currentYear}-${month}-${day}`;
        }
      }
    }
    return '';
  };

  const extractTime = (command: string): string => {
    const timePatterns = [
      /(\d{1,2}):(\d{2})/,
      /(\d{1,2})\s*โมง/,
      /ตอนบ่าย/,
      /ตอนเช้า/,
      /บ่ายโมง/
    ];
    
    for (const pattern of timePatterns) {
      const match = command.match(pattern);
      if (match) {
        if (match[0].includes('บ่ายโมง')) {
          return '13:00';
        } else if (match[1] && match[2]) {
          return `${match[1].padStart(2, '0')}:${match[2]}`;
        } else if (match[1]) {
          return `${match[1].padStart(2, '0')}:00`;
        }
      }
    }
    
    if (command.includes('ตอนบ่าย')) return '14:00';
    if (command.includes('ตอนเช้า')) return '09:00';
    
    return '';
  };

  const extractTable = (command: string): string => {
    const tableMatch = command.match(/โต๊ะ\s*(\d+)/);
    return tableMatch ? `โต๊ะ ${tableMatch[1]}` : '';
  };

  const handleVoiceResult = (text: string) => {
    setInputCommand((prev) => prev + (prev ? ' ' : '') + text);
    toast({
      title: 'รับเสียงสำเร็จ',
      description: text,
      duration: 3000,
    });
  };

  const handleVoiceError = (error: string) => {
    toast({
      variant: 'destructive',
      title: 'ข้อผิดพลาด',
      description: error,
      duration: 3000,
    });
  };

  const handleConfirm = async () => {
    if (!outputJson || outputJson.error) return;
    if (outputJson.action === 'create') {
      // สร้างนัดใหม่
      let patient = await findPatient(outputJson.patient_name || '');
      if (!patient || !patient.id) {
        // ถ้าไม่พบผู้ป่วย ให้สร้างผู้ป่วยใหม่
        const { data: newPatient, error: createPatientError } = await supabase
          .from('patients')
          .insert({
            full_name: outputJson.patient_name,
            hn: '',
            phone_number: '',
            full_address: ''
          })
          .select()
          .single();
        if (createPatientError || !newPatient || !newPatient.id) {
          toast({ title: 'สร้างผู้ป่วยใหม่ไม่สำเร็จ', description: 'ไม่สามารถสร้างผู้ป่วยใหม่ได้', variant: 'destructive' });
          return;
        }
        patient = newPatient;
      }
      try {
        await addAppointmentMutation.mutateAsync({
          patient_id: patient.id,
          full_name: patient.full_name,
          hn: patient.hn,
          phone_number: patient.phone_number,
          address: patient.full_address,
          appointment_date: outputJson.new_date,
          appointment_time: outputJson.new_time || null,
          departments: ['กายภาพบำบัด'],
          appointment_type: 'in',
          center: null,
          time_period: 'ในเวลาราชการ',
          table_number: 1,
          status: 'new',
          note: outputJson.note || null
        });
        toast({ title: 'สร้างนัดหมายสำเร็จ', description: `สร้างนัดหมายสำหรับ ${patient.full_name} เรียบร้อยแล้ว` });
        setShowSuccessAlert(true);
      } catch (error) {
        toast({ title: 'เกิดข้อผิดพลาด', description: 'ไม่สามารถสร้างนัดหมายได้', variant: 'destructive' });
      }
    } else if (outputJson.action === 'reschedule') {
      // เลื่อนนัด
      const patient = await findPatient(outputJson.patient_name || '');
      if (!patient || !patient.id) {
        toast({ title: 'ไม่พบผู้ป่วย', description: 'ไม่พบผู้ป่วยในระบบ', variant: 'destructive' });
        return;
      }
      const appointment = await findAppointment(patient.id, outputJson.old_date || '');
      if (!appointment) {
        toast({ title: 'ไม่พบนัดหมายเดิม', description: 'ไม่พบนัดหมายเดิมในระบบ', variant: 'destructive' });
        return;
      }
      try {
        await updateAppointment(appointment.id, {
          appointment_date: outputJson.new_date,
          appointment_time: outputJson.new_time || null
        });
        toast({ title: 'เลื่อนนัดสำเร็จ', description: `เลื่อนนัดของ ${patient.full_name} เป็นวันที่ ${outputJson.new_date}` });
        setShowSuccessAlert(true);
      } catch (error) {
        toast({ title: 'เกิดข้อผิดพลาด', description: 'ไม่สามารถเลื่อนนัดได้', variant: 'destructive' });
      }
    }
  };

  const handleReset = () => {
    setInputCommand('');
    setOutputJson(null);
  };

  const handleClose = () => {
    handleReset();
    onOpenChange(false);
  };

  // ฟังก์ชันค้นหาผู้ป่วยจริง
  const findPatient = async (nameOrHnOrCid: string): Promise<{ id: string; full_name: string; hn: string; phone_number: string; full_address: string } | null> => {
    const { data, error } = await supabase
      .from('patients')
      .select('id,full_name,hn,phone_number,full_address')
      .or(`full_name.ilike.%${nameOrHnOrCid}%,hn.ilike.%${nameOrHnOrCid}%,cid.ilike.%${nameOrHnOrCid}%`)
      .limit(1)
      .single();
    if (error || !data || !data.id) return null;
    return data;
  };

  // ฟังก์ชันค้นหานัดหมายจริง
  const findAppointment = async (patientId: string, date: string) => {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('patient_id', patientId)
      .eq('appointment_date', date)
      .limit(1)
      .single();
    if (error || !data) return null;
    return data;
  };

  // ฟังก์ชันอัปเดตนัดหมายจริง
  const updateAppointment = async (appointmentId: string, updateData: any) => {
    const { error } = await supabase
      .from('appointments')
      .update(updateData)
      .eq('id', appointmentId);
    if (error) throw error;
    return true;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mic className="w-5 h-5" />
              สั่งงานด้วยเสียง
            </DialogTitle>
            <DialogDescription>
              พูดคำสั่งของคุณ เช่น "นัดหมายคุณสมชาย" หรือ "เลื่อนนัดคุณสมหญิง" ระบบจะประมวลผลให้โดยอัตโนมัติ
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Input Command */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label htmlFor="input_command" className="text-sm font-medium">
                  พิมพ์คำสั่งภาษาไทย
                </label>
                <VoiceInput
                  onResult={handleVoiceResult}
                  onError={handleVoiceError}
                  tooltip="พูดเพื่อป้อนคำสั่ง (Ctrl+M)"
                />
              </div>
              <Textarea
                id="input_command"
                placeholder='เช่น "เลื่อนสมชายไปวันที่ 12 มิ.ย. ตอนบ่าย" หรือ "นัดสมหมายวันที่ 15 มิ.ย. เวลา 09:00 ที่โต๊ะ 2"'
                value={inputCommand}
                onChange={(e) => setInputCommand(e.target.value)}
                className="min-h-[80px]"
              />
            </div>

            {/* Analyze Button */}
            <Button 
              onClick={analyzeCommand} 
              disabled={!inputCommand.trim() || isAnalyzing}
              className="w-full"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  กำลังวิเคราะห์...
                </>
              ) : (
                <>
                  <Bot className="w-4 h-4 mr-2" />
                  วิเคราะห์คำสั่ง
                </>
              )}
            </Button>

            {/* Output JSON */}
            {outputJson && (
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  ผลการวิเคราะห์ (JSON)
                </label>
                <div className="bg-gray-50 border rounded-lg p-4">
                  <pre className="text-sm whitespace-pre-wrap">
                    {JSON.stringify(outputJson, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button 
                onClick={handleConfirm}
                disabled={!outputJson || !!outputJson.error}
                className="flex-1"
              >
                ยืนยัน
              </Button>
              <Button 
                variant="outline" 
                onClick={handleClose}
                className="flex-1"
              >
                ยกเลิก
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Alert Dialog */}
      <AlertDialog open={showSuccessAlert} onOpenChange={setShowSuccessAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ดำเนินการสำเร็จ</AlertDialogTitle>
            <AlertDialogDescription>
              ระบบได้ดำเนินการตามคำสั่งของคุณเรียบร้อยแล้ว
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleClose}>ตกลง</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default CommandModal;
