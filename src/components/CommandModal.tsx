
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Loader2, Bot, FileText } from 'lucide-react';

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
}

const CommandModal = ({ open, onOpenChange }: CommandModalProps) => {
  const [inputCommand, setInputCommand] = useState('');
  const [outputJson, setOutputJson] = useState<AnalyzedResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);

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
          note: 'เลื่อนนัดหมายตามคำขอ'
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
      /(\d{1,2})\/(\d{1,2})/
    ];
    
    const currentYear = new Date().getFullYear();
    
    for (const pattern of datePatterns) {
      const match = command.match(pattern);
      if (match && match[1]) {
        const day = match[1].padStart(2, '0');
        const month = command.includes('มิ.ย.') || command.includes('มิถุนายน') ? '06' : '01';
        return `${currentYear}-${month}-${day}`;
      }
    }
    return '';
  };

  const extractTime = (command: string): string => {
    const timePatterns = [
      /(\d{1,2}):(\d{2})/,
      /(\d{1,2})\s*โมง/,
      /ตอนบ่าย/,
      /ตอนเช้า/
    ];
    
    for (const pattern of timePatterns) {
      const match = command.match(pattern);
      if (match) {
        if (match[1] && match[2]) {
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

  const handleConfirm = () => {
    setShowSuccessAlert(true);
  };

  const handleReset = () => {
    setInputCommand('');
    setOutputJson(null);
  };

  const handleClose = () => {
    handleReset();
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5" />
              นัดหมายด้วยคำสั่ง
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Input Command */}
            <div className="space-y-2">
              <label htmlFor="input_command" className="text-sm font-medium">
                พิมพ์คำสั่งภาษาไทย
              </label>
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
            <AlertDialogTitle>ยังไม่เชื่อม Supabase</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p>ระบบยังอยู่ในโหมดทดสอบ ผลการวิเคราะห์:</p>
                <div className="bg-gray-50 border rounded p-3">
                  <pre className="text-sm whitespace-pre-wrap">
                    {JSON.stringify(outputJson, null, 2)}
                  </pre>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowSuccessAlert(false)}>
              เข้าใจแล้ว
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default CommandModal;
