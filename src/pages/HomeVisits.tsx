
import React, { useState } from 'react';
import { MapPin, Plus, Navigation, Calendar, User, Home } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import Navbar from '@/components/Navbar';
import { useHomeVisits } from '@/hooks/useHomeVisits';

const HomeVisits = () => {
  const [selectedPatientType, setSelectedPatientType] = useState<string>('all');
  
  const { data: homeVisits = [], isLoading, error } = useHomeVisits({
    patient_type: selectedPatientType !== 'all' ? selectedPatientType : undefined
  });

  console.log('Home visits data:', homeVisits);

  const getStatusBadge = (visitCount: number) => {
    if (visitCount === 1) {
      return <Badge variant="outline" className="bg-green-50 text-green-700">เยี่ยมครั้งแรก</Badge>;
    } else if (visitCount <= 3) {
      return <Badge variant="outline" className="bg-blue-50 text-blue-700">ติดตาม</Badge>;
    } else {
      return <Badge variant="outline" className="bg-gray-50 text-gray-700">เยี่ยมสม่ำเสมอ</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="p-8 text-center">
            <p>กำลังโหลดข้อมูล...</p>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="p-8 text-center text-red-500">
            <p>เกิดข้อผิดพลาดในการโหลดข้อมูล</p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">จัดการเยี่ยมบ้าน</h1>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            สร้างรายการเยี่ยมบ้าน
          </Button>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6">
          <div className="flex gap-2">
            {[
              { id: 'all', label: 'ทั้งหมด' },
              { id: 'กายภาพบำบัด', label: 'กายภาพบำบัด' },
              { id: 'แผนไทย', label: 'แผนไทย' },
              { id: 'แผนจีน', label: 'แผนจีน' }
            ].map(type => (
              <Button
                key={type.id}
                variant={selectedPatientType === type.id ? "default" : "outline"}
                onClick={() => setSelectedPatientType(type.id)}
                className="text-sm"
              >
                {type.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Home Visits List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {homeVisits.length > 0 ? (
            homeVisits.map((visit) => (
              <Card key={visit.visit_id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <User className="w-5 h-5" />
                      {visit.full_name}
                    </CardTitle>
                    {getStatusBadge(visit.visit_count)}
                  </div>
                  <p className="text-sm text-gray-600">HN: {visit.hn}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-2">
                    <Home className="w-4 h-4 mt-1 text-gray-500" />
                    <p className="text-sm text-gray-600">{visit.address}</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <p className="text-sm text-gray-600">
                      เยี่ยมล่าสุด: {format(new Date(visit.updated_at || visit.created_at || ''), 'dd MMMM yyyy', { locale: th })}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <p className="text-sm text-gray-600">
                      ประเภท: {visit.patient_type}
                    </p>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm font-medium text-gray-700">ADL Score: {visit.adl}</p>
                    <p className="text-sm text-gray-600">จำนวนครั้งที่เยี่ยม: {visit.visit_count} ครั้ง</p>
                  </div>

                  {visit.cc && (
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-sm font-medium text-blue-800">อาการสำคัญ:</p>
                      <p className="text-sm text-blue-600">{visit.cc}</p>
                    </div>
                  )}

                  {visit.note && (
                    <div className="bg-yellow-50 p-3 rounded-lg">
                      <p className="text-sm font-medium text-yellow-800">หมายเหตุ:</p>
                      <p className="text-sm text-yellow-600">{visit.note}</p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      <MapPin className="w-4 h-4 mr-1" />
                      ดูแผนที่
                    </Button>
                    <Button size="sm" className="flex-1">
                      แก้ไข
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full">
              <Card className="p-12 text-center">
                <Navigation className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold mb-2">ยังไม่มีรายการเยี่ยมบ้าน</h3>
                <p className="text-gray-500 mb-4">
                  {selectedPatientType === 'all' 
                    ? 'ยังไม่มีข้อมูลการเยี่ยมบ้านในระบบ' 
                    : `ยังไม่มีข้อมูลการเยี่ยมบ้านสำหรับประเภท ${selectedPatientType}`
                  }
                </p>
                <Button variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  เพิ่มรายการเยี่ยมบ้านแรก
                </Button>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomeVisits;
