
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Phone, MapPin, CreditCard, Hospital } from 'lucide-react';
import PTTableDialog from './PTTableDialog';
import EquipmentDialog from './EquipmentDialog';

interface Patient {
  id: string;
  full_name: string;
  cid: string;
  hn: string;
  right_type: string;
  phone_number: string;
  address: string;
}

interface PatientCardProps {
  patient: Patient;
  onSendToPT: (patient: Patient, tableNumber: number) => void;
  onSchedule: (patient: Patient) => void;
  onHomeVisit: (patient: Patient) => void;
  onDispenseEquipment: (patient: Patient, equipment: any[]) => void;
}

const PatientCard = ({ 
  patient, 
  onSendToPT, 
  onSchedule, 
  onHomeVisit, 
  onDispenseEquipment 
}: PatientCardProps) => {
  const [showPTDialog, setShowPTDialog] = useState(false);
  const [showEquipmentDialog, setShowEquipmentDialog] = useState(false);

  const getRightTypeColor = (rightType: string) => {
    switch (rightType) {
      case 'UC': return 'bg-green-100 text-green-800';
      case 'SSS': return 'bg-blue-100 text-blue-800';
      case 'CSMBS': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handlePTTableSelect = (tableNumber: number) => {
    onSendToPT(patient, tableNumber);
  };

  const handleEquipmentDispense = (equipment: any[]) => {
    onDispenseEquipment(patient, equipment);
  };

  return (
    <>
      <Card className="w-full hover:shadow-lg transition-shadow duration-200">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <CardTitle className="flex items-center text-lg">
              <User className="w-5 h-5 mr-2 text-blue-600" />
              {patient.full_name}
            </CardTitle>
            <Badge className={getRightTypeColor(patient.right_type)}>
              {patient.right_type}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center">
              <CreditCard className="w-4 h-4 mr-2 text-gray-500" />
              <span className="text-gray-600">เลขบัตร:</span>
              <span className="ml-1 font-medium">{patient.cid}</span>
            </div>
            <div className="flex items-center">
              <Hospital className="w-4 h-4 mr-2 text-gray-500" />
              <span className="text-gray-600">HN:</span>
              <span className="ml-1 font-medium">{patient.hn}</span>
            </div>
            <div className="flex items-center">
              <Phone className="w-4 h-4 mr-2 text-gray-500" />
              <span className="text-gray-600">โทร:</span>
              <span className="ml-1 font-medium">{patient.phone_number}</span>
            </div>
            <div className="flex items-center col-span-1 md:col-span-2">
              <MapPin className="w-4 h-4 mr-2 text-gray-500" />
              <span className="text-gray-600">ที่อยู่:</span>
              <span className="ml-1 text-sm">{patient.address}</span>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 pt-3 border-t">
            <Button 
              size="sm" 
              className="bg-green-600 hover:bg-green-700"
              onClick={() => setShowPTDialog(true)}
            >
              ส่งให้ PT
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="border-blue-500 text-blue-600 hover:bg-blue-50"
              onClick={() => onSchedule(patient)}
            >
              นัดหมาย
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="border-yellow-500 text-yellow-600 hover:bg-yellow-50"
              onClick={() => onHomeVisit(patient)}
            >
              เยี่ยมบ้าน
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="border-purple-500 text-purple-600 hover:bg-purple-50"
              onClick={() => setShowEquipmentDialog(true)}
            >
              จ่ายอุปกรณ์
            </Button>
          </div>
        </CardContent>
      </Card>

      <PTTableDialog
        isOpen={showPTDialog}
        onClose={() => setShowPTDialog(false)}
        patientName={patient.full_name}
        onSelectTable={handlePTTableSelect}
      />

      <EquipmentDialog
        isOpen={showEquipmentDialog}
        onClose={() => setShowEquipmentDialog(false)}
        patientName={patient.full_name}
        onDispenseEquipment={handleEquipmentDispense}
      />
    </>
  );
};

export default PatientCard;
