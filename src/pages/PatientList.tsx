
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { supabase } from '@/integrations/supabase/client';

interface Patient {
  id: string;
  full_name: string;
  hn: string;
  phone_number: string;
  full_address: string;
}

const PatientList = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredPatients(patients);
    } else {
      const filtered = patients.filter(patient =>
        patient.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredPatients(filtered);
    }
  }, [searchTerm, patients]);

  const fetchPatients = async () => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('id, full_name, hn, phone_number, full_address')
        .order('full_name', { ascending: true });

      if (error) {
        console.error('Error fetching patients:', error);
      } else {
        setPatients(data || []);
        setFilteredPatients(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">ผู้รับบริการ</h1>
          
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Search className="w-5 h-5 mr-2" />
                ค้นหาผู้ป่วย
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="ค้นหาจากชื่อผู้ป่วย..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-12 text-lg"
                />
              </div>
              {searchTerm && (
                <p className="mt-2 text-sm text-gray-600">
                  พบ {filteredPatients.length} รายการจากการค้นหา "{searchTerm}"
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {loading ? (
          <div className="text-center py-8">กำลังโหลด...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPatients.map((patient) => (
              <Card key={patient.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg text-gray-900">
                      {patient.full_name || 'ไม่ระบุชื่อ'}
                    </h3>
                    <div className="text-sm text-gray-600">
                      <p><span className="font-medium">HN:</span> {patient.hn || '-'}</p>
                      <p><span className="font-medium">เบอร์โทร:</span> {patient.phone_number || '-'}</p>
                      <p><span className="font-medium">ที่อยู่:</span> {patient.full_address || '-'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!loading && filteredPatients.length === 0 && searchTerm && (
          <Card className="text-center py-12">
            <CardContent>
              <div className="text-gray-500">
                <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold mb-2">ไม่พบข้อมูลผู้ป่วย</h3>
                <p>ลองค้นหาด้วยชื่ออื่น</p>
              </div>
            </CardContent>
          </Card>
        )}

        {!loading && patients.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <div className="text-gray-500">
                <h3 className="text-lg font-semibold mb-2">ไม่มีข้อมูลผู้ป่วย</h3>
                <p>ยังไม่มีข้อมูลผู้ป่วยในระบบ</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PatientList;
