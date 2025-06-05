
import React from 'react';
import { Calendar, Clock, Users, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';

const Appointments = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">จัดการนัดหมาย</h1>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            สร้างนัดหมายใหม่
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              ปฏิทินนัดหมาย
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-gray-500">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold mb-2">ระบบนัดหมาย</h3>
              <p className="mb-4">เชื่อมต่อกับ Supabase เพื่อใช้งานระบบนัดหมายแบบเต็มรูปแบบ</p>
              <Button variant="outline">เรียนรู้เพิ่มเติม</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Appointments;
