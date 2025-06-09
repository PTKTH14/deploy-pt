import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Calendar, MapPin, Plus, TrendingUp, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import DashboardChart from '@/components/DashboardChart';
const Dashboard = () => {
  const stats = [{
    title: 'นัดหมายวันนี้',
    value: '24',
    change: '+3 จากเมื่อวาน',
    icon: Calendar,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100'
  }, {
    title: 'ผู้ป่วยทั้งหมด',
    value: '1,247',
    change: '+12 คนใหม่',
    icon: Users,
    color: 'text-green-600',
    bgColor: 'bg-green-100'
  }, {
    title: 'เยี่ยมบ้านวันนี้',
    value: '8',
    change: 'ตามแผน',
    icon: MapPin,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100'
  }, {
    title: 'เสร็จสิ้นแล้ว',
    value: '18',
    change: '75% ของนัด',
    icon: CheckCircle,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100'
  }];
  const todayAppointments = [{
    time: '09:00',
    patient: 'สมชาย ใจดี',
    type: 'กายภาพ',
    table: 'โต๊ะ 1',
    status: 'waiting'
  }, {
    time: '09:30',
    patient: 'มาลี สุขใส',
    type: 'แผนไทย',
    table: 'โต๊ะ 2',
    status: 'processing'
  }, {
    time: '10:00',
    patient: 'วิชัย รุ่งเรือง',
    type: 'แผนจีน',
    table: 'โต๊ะ 3',
    status: 'done'
  }, {
    time: '10:30',
    patient: 'สุดา แสงใส',
    type: 'กายภาพ',
    table: 'โต๊ะ 1',
    status: 'waiting'
  }];

  // PT Table data for PT users
  const ptTableStats = [{
    table: 'โต๊ะ 1',
    patients: 8,
    status: 'normal'
  }, {
    table: 'โต๊ะ 2',
    patients: 12,
    status: 'full'
  }, {
    table: 'โต๊ะ 3',
    patients: 6,
    status: 'normal'
  }];
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'done':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  const getStatusText = (status: string) => {
    switch (status) {
      case 'waiting':
        return 'รอ';
      case 'processing':
        return 'กำลังรักษา';
      case 'done':
        return 'เสร็จสิ้น';
      default:
        return 'ไม่ทราบ';
    }
  };

  // Simulate PT user check (in real app, this would come from auth context)
  const isPTUser = true; // For demo purposes

  return <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">แดชบอร์ด</h1>
          <p className="text-gray-600">ภาพรวมระบบจัดการนัดหมายผู้ป่วย CareSync+</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map(stat => {
          const Icon = stat.icon;
          return <Card key={stat.title} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">
                        {stat.title}
                      </p>
                      <p className="text-3xl font-bold text-gray-900 mb-1">
                        {stat.value}
                      </p>
                      <p className="text-sm text-gray-500">
                        {stat.change}
                      </p>
                    </div>
                    <div className={`${stat.bgColor} p-3 rounded-full`}>
                      <Icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>;
        })}
        </div>

        {/* Charts Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">สถิติและกราฟ</h2>
          <DashboardChart />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Plus className="w-5 h-5 mr-2" />
                การดำเนินการด่วน
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link to="/patients">
                <Button className="w-full justify-start bg-blue-600 hover:bg-blue-700">
                  <Users className="w-4 h-4 mr-2" />
                  จัดการผู้ป่วย
                </Button>
              </Link>
              <Link to="/appointments">
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="w-4 h-4 mr-2" />
                  สร้างนัดหมาย
                </Button>
              </Link>
              <Link to="/home-visits">
                <Button variant="outline" className="w-full justify-start">
                  <MapPin className="w-4 h-4 mr-2" />
                  เยี่ยมบ้าน
                </Button>
              </Link>
              <Button variant="outline" className="w-full justify-start">
                <TrendingUp className="w-4 h-4 mr-2" />
                ดูรายงาน
              </Button>
            </CardContent>
          </Card>

          {/* Today's Appointments */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  นัดหมายวันนี้
                </div>
                <Button variant="outline" size="sm">
                  ดูทั้งหมด
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {todayAppointments.map((appointment, index) => <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="text-sm font-medium text-gray-900 min-w-[60px]">
                        {appointment.time}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{appointment.patient}</p>
                        <p className="text-sm text-gray-500">{appointment.type} • {appointment.table}</p>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                      {getStatusText(appointment.status)}
                    </div>
                  </div>)}
                {todayAppointments.length === 0 && <div className="text-center py-8 text-gray-500">
                    <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>ไม่มีนัดหมายวันนี้</p>
                  </div>}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Info */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>สถิติแผนก</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">กายภาพบำบัด</span>
                  <span className="font-semibold">15 คน</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">แผนไทย</span>
                  <span className="font-semibold">6 คน</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">แผนจีน</span>
                  <span className="font-semibold">3 คน</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* PT Table Status - Only visible for PT users */}
          {isPTUser && <Card>
              <CardHeader>
                <CardTitle>สถานะโต๊ะ PT</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {ptTableStats.map((table, index) => <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${table.status === 'full' ? 'bg-red-500' : 'bg-green-500'}`}></div>
                        <span className="font-medium">{table.table}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold">{table.patients}/12</span>
                        <p className="text-xs text-gray-500">ผู้ป่วย</p>
                      </div>
                    </div>)}
                </div>
              </CardContent>
            </Card>}

          <Card>
            <CardHeader>
              <CardTitle>แจ้งเตือน</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                  <div>
                    <p className="font-medium text-yellow-800">โต๊ะ 2 เต็ม</p>
                    <p className="text-sm text-yellow-600">มีนัดหมาย 12 คน</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-800">เยี่ยมบ้านเสร็จ</p>
                    <p className="text-sm text-blue-600">6 จาก 8 รายการ</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>;
};
export default Dashboard;