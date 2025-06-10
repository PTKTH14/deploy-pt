
import React, { useState } from 'react';
import { BarChart3, PieChart, TrendingUp, Users, Calendar, MapPin, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import Navbar from '@/components/Navbar';
import { useAppointmentStats, useHomeVisitStats } from '@/hooks/useReports';

const Reports = () => {
  const [dateRange, setDateRange] = useState({
    start_date: format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'),
    end_date: format(new Date(), 'yyyy-MM-dd')
  });

  const { data: appointmentStats, isLoading: appointmentLoading } = useAppointmentStats(dateRange);
  const { data: homeVisitStats, isLoading: homeVisitLoading } = useHomeVisitStats();

  const handleDateChange = (field: string, value: string) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const isLoading = appointmentLoading || homeVisitLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="p-8 text-center">
            <p>กำลังโหลดข้อมูลรายงาน...</p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">รายงานและสถิติ</h1>

        {/* Date Range Filter */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>ตัวกรองข้อมูล</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="space-y-2">
                <Label htmlFor="start-date">วันที่เริ่มต้น</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={dateRange.start_date}
                  onChange={(e) => handleDateChange('start_date', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-date">วันที่สิ้นสุด</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={dateRange.end_date}
                  onChange={(e) => handleDateChange('end_date', e.target.value)}
                />
              </div>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <BarChart3 className="w-4 h-4 mr-2" />
                ดูรายงาน
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">นัดหมายทั้งหมด</p>
                  <p className="text-2xl font-bold text-blue-600">{appointmentStats?.total || 0}</p>
                </div>
                <Calendar className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">เยี่ยมบ้านทั้งหมด</p>
                  <p className="text-2xl font-bold text-green-600">{homeVisitStats?.total || 0}</p>
                </div>
                <MapPin className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">ADL เฉลี่ย</p>
                  <p className="text-2xl font-bold text-purple-600">{homeVisitStats?.average_adl || 0}</p>
                </div>
                <Activity className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">การเยี่ยมรวม</p>
                  <p className="text-2xl font-bold text-orange-600">{homeVisitStats?.total_visits || 0}</p>
                </div>
                <Users className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Appointment Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                สถิติการนัดหมาย
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">ตามแผนก</h4>
                <div className="space-y-2">
                  {Object.entries(appointmentStats?.by_department || {}).map(([dept, count]) => (
                    <div key={dept} className="flex justify-between items-center">
                      <span className="text-sm">{dept}</span>
                      <Badge variant="outline">{count} นัด</Badge>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">ตามสถานะ</h4>
                <div className="space-y-2">
                  {Object.entries(appointmentStats?.by_status || {}).map(([status, count]) => (
                    <div key={status} className="flex justify-between items-center">
                      <span className="text-sm">
                        {status === 'new' ? 'ใหม่' : 
                         status === 'processing' ? 'กำลังดำเนินการ' : 'เสร็จสิ้น'}
                      </span>
                      <Badge variant="outline">{count} นัด</Badge>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">ตามประเภท</h4>
                <div className="space-y-2">
                  {Object.entries(appointmentStats?.by_type || {}).map(([type, count]) => (
                    <div key={type} className="flex justify-between items-center">
                      <span className="text-sm">
                        {type === 'in' ? 'นัดใน รพ.' : 'นัดเยี่ยมนอก รพ.'}
                      </span>
                      <Badge variant="outline">{count} นัด</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Home Visit Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                สถิติการเยี่ยมบ้าน
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">ตามประเภทผู้ป่วย</h4>
                <div className="space-y-2">
                  {Object.entries(homeVisitStats?.by_patient_type || {}).map(([type, count]) => (
                    <div key={type} className="flex justify-between items-center">
                      <span className="text-sm">{type}</span>
                      <Badge variant="outline">{count} ราย</Badge>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">ข้อมูลสรุป</h4>
                <div className="space-y-1 text-sm text-blue-600">
                  <p>ผู้ป่วยทั้งหมด: {homeVisitStats?.total || 0} ราย</p>
                  <p>ADL เฉลี่ย: {homeVisitStats?.average_adl || 0} คะแนน</p>
                  <p>การเยี่ยมรวม: {homeVisitStats?.total_visits || 0} ครั้ง</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Appointments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                นัดหมายล่าสุด
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {appointmentStats?.recent_appointments?.length > 0 ? (
                  appointmentStats.recent_appointments.map((appointment, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{appointment.full_name}</p>
                        <p className="text-sm text-gray-600">HN: {appointment.hn}</p>
                        <p className="text-sm text-gray-600">
                          {appointment.appointment_date && format(new Date(appointment.appointment_date), 'dd MMM yyyy', { locale: th })}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="text-xs">
                          {appointment.departments?.join(', ')}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-4">ไม่มีข้อมูลนัดหมาย</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Home Visits */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                การเยี่ยมบ้านล่าสุด
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {homeVisitStats?.recent_visits?.length > 0 ? (
                  homeVisitStats.recent_visits.map((visit, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{visit.full_name}</p>
                        <p className="text-sm text-gray-600">HN: {visit.hn}</p>
                        <p className="text-sm text-gray-600">
                          {visit.created_at && format(new Date(visit.created_at), 'dd MMM yyyy', { locale: th })}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="text-xs">
                          {visit.patient_type}
                        </Badge>
                        <p className="text-sm text-gray-600">ADL: {visit.adl}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-4">ไม่มีข้อมูลการเยี่ยมบ้าน</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Reports;
