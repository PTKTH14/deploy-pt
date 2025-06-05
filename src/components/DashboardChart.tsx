
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { BarChart3 } from 'lucide-react';

const DashboardChart = () => {
  // Mock data for PT table usage
  const ptTableData = [
    { table: 'โต๊ะ 1', patients: 8, capacity: 12 },
    { table: 'โต๊ะ 2', patients: 12, capacity: 12 },
    { table: 'โต๊ะ 3', patients: 6, capacity: 12 },
  ];

  // Mock data for department distribution
  const departmentData = [
    { name: 'กายภาพ', value: 15, color: '#3B82F6' },
    { name: 'แผนจีน', value: 6, color: '#10B981' },
    { name: 'แผนไทย', value: 3, color: '#F59E0B' },
  ];

  // Mock data for weekly appointments
  const weeklyData = [
    { day: 'จ', appointments: 18 },
    { day: 'อ', appointments: 22 },
    { day: 'พ', appointments: 24 },
    { day: 'พฤ', appointments: 19 },
    { day: 'ศ', appointments: 21 },
    { day: 'ส', appointments: 16 },
    { day: 'อา', appointments: 12 },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {/* PT Table Usage Chart */}
      <Card className="col-span-1 lg:col-span-2 xl:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            การใช้งานโต๊ะ PT
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={ptTableData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="table" />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => [
                  `${value} คน`,
                  name === 'patients' ? 'ผู้ป่วย' : 'ความจุ'
                ]}
              />
              <Bar dataKey="patients" fill="#3B82F6" name="patients" />
              <Bar dataKey="capacity" fill="#E5E7EB" name="capacity" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Department Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>สัดส่วนแผนก</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={departmentData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                dataKey="value"
              >
                {departmentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value} คน`, 'จำนวน']} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {departmentData.map((entry, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: entry.color }}
                  ></div>
                  <span>{entry.name}</span>
                </div>
                <span className="font-medium">{entry.value} คน</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Weekly Appointments Trend */}
      <Card>
        <CardHeader>
          <CardTitle>นัดหมายรายสัปดาห์</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip formatter={(value) => [`${value} นัด`, 'จำนวน']} />
              <Bar dataKey="appointments" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardChart;
