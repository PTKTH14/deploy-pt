
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface PTTableDialogProps {
  isOpen: boolean;
  onClose: () => void;
  patientName: string;
  onSelectTable: (tableNumber: number) => void;
}

const PTTableDialog = ({ isOpen, onClose, patientName, onSelectTable }: PTTableDialogProps) => {
  const handleTableSelect = (tableNumber: number) => {
    onSelectTable(tableNumber);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>เลือกโต๊ะ PT สำหรับ {patientName}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-4 py-4">
          {[1, 2, 3].map((tableNumber) => (
            <Button
              key={tableNumber}
              onClick={() => handleTableSelect(tableNumber)}
              className="h-16 text-lg font-semibold bg-blue-600 hover:bg-blue-700"
            >
              โต๊ะ {tableNumber}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PTTableDialog;
