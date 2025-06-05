
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface EquipmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  patientName: string;
  onDispenseEquipment: (equipment: any[]) => void;
}

const equipmentOptions = {
  'L-S Support': ['S', 'M', 'L', 'XL', 'XXL', 'XXXL'],
  'Knee Support': ['S', 'M', 'L', 'XL'],
  'Elbow Support': ['S', 'M', 'L', 'XL'],
  'Ankle Support': ['S', 'M', 'L', 'XL'],
  'Wrist Support': ['S', 'M', 'L', 'XL'],
  'ไม้เท้า 1 ปุ่ม': ['มาตรฐาน'],
  'ไม้เท้า 3 ปุ่ม': ['มาตรฐาน'],
  'สี่ขา Walker': ['มาตรฐาน'],
  'ไม้ค้ำยันรักแร้แบบอลูมิเนียม': ['42', '43', '44', '45', '46', '47', '48', '49', '50', '51', '52', '53', '54'],
  'ไม้ค้ำยันรักแร้แบบไม้': ['42', '43', '44', '45', '46', '47', '48', '49', '50', '51', '52', '53', '54']
};

const EquipmentDialog = ({ isOpen, onClose, patientName, onDispenseEquipment }: EquipmentDialogProps) => {
  const [selectedEquipment, setSelectedEquipment] = useState<{[key: string]: string}>({});

  const handleEquipmentSelect = (equipmentType: string, size: string) => {
    setSelectedEquipment(prev => ({
      ...prev,
      [equipmentType]: size
    }));
  };

  const handleSubmit = () => {
    const equipment = Object.entries(selectedEquipment).map(([type, size]) => ({
      type,
      size
    }));
    onDispenseEquipment(equipment);
    setSelectedEquipment({});
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>จ่ายอุปกรณ์สำหรับ {patientName}</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
          {Object.entries(equipmentOptions).map(([equipmentType, sizes]) => (
            <Card key={equipmentType} className="p-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">{equipmentType}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <Select
                  value={selectedEquipment[equipmentType] || ''}
                  onValueChange={(value) => handleEquipmentSelect(equipmentType, value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกขนาด" />
                  </SelectTrigger>
                  <SelectContent>
                    {sizes.map((size) => (
                      <SelectItem key={size} value={size}>
                        {equipmentType.includes('เบอร์') ? `เบอร์ ${size}` : `ขนาด ${size}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            ยกเลิก
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={Object.keys(selectedEquipment).length === 0}
            className="bg-purple-600 hover:bg-purple-700"
          >
            จ่ายอุปกรณ์ ({Object.keys(selectedEquipment).length} รายการ)
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EquipmentDialog;
