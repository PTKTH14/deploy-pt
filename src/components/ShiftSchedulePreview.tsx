import React from "react"
import { Button } from "@/components/ui/button"
import { FileDown } from "lucide-react"
import * as XLSX from "xlsx"
import { DaySchedule, Personnel } from "@/utils/enhancedShiftScheduler"
import { format, getDate, getDaysInMonth, isSunday } from "date-fns"
import { th } from "date-fns/locale"

interface ShiftSchedulePreviewProps {
  schedule: DaySchedule[];
  personnel: Personnel[];
  currentMonth: Date;
  shiftRequests: {
    id: string;
    userId: string;
    date: Date;
    type: "preferred" | "avoided" | "leave";
    shift?: "morning" | "afternoon";
  }[];
}

const ShiftSchedulePreview: React.FC<ShiftSchedulePreviewProps> = ({ schedule, personnel, currentMonth, shiftRequests }) => {
  if (!schedule || schedule.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FileDown className="w-16 h-16 text-gray-300 mb-4" />
        <h3 className="text-xl font-semibold text-gray-700">ไม่มีข้อมูลตารางเวร</h3>
        <p className="text-gray-500">กรุณากด "สร้างตารางเวร" เพื่อสร้างข้อมูลสำหรับเดือนนี้</p>
      </div>
    );
  }

  const daysInMonth = getDaysInMonth(currentMonth);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // แปลงคำขอเวรให้อยู่ในรูปแบบที่ใช้งานง่าย
  const requestsMap = new Map();
  shiftRequests.forEach(req => {
    if (!(req.date instanceof Date)) return;
    
    const day = getDate(req.date);
    const month = req.date.getMonth();
    const year = req.date.getFullYear();
    
    // ตรวจสอบว่าเป็นเดือนเดียวกับที่กำลังแสดง
    if (month === currentMonth.getMonth() && year === currentMonth.getFullYear()) {
      const key = `${req.userId}-${day}`;
      requestsMap.set(key, req.type);
    }
  });

  const scheduleMap = new Map<string, string>();
  
  schedule.forEach(day => {
    const date = new Date(day.date);
    if (isSunday(date)) return;
    
    const dayOfMonth = getDate(date);
    day.slots.forEach(slot => {
      const key = `${slot.user_id}-${dayOfMonth}`;
      scheduleMap.set(key, day.shift === 'morning' ? 'ช' : 'บ');
    });
  });

  const staffWithShifts = personnel.map(p => {
    const shifts = days.map(day => {
      const date = new Date(currentMonth);
      date.setDate(day);
      if (isSunday(date)) return "";
      
      return scheduleMap.get(`${p.id}-${day}`) || "";
    });
    
    // เพิ่มข้อมูลคำขอเวร
    const requestTypes = days.map(day => {
      return requestsMap.get(`${p.id}-${day}`) || null;
    });
    
    const totalShifts = shifts.filter(s => s !== "").length;
    const morningShifts = shifts.filter(s => s === "ช").length;
    const afternoonShifts = shifts.filter(s => s === "บ").length;
    
    return {
      ...p,
      shifts,
      requestTypes,
      totalShifts,
      morningShifts,
      afternoonShifts
    };
  });

  const exportToExcel = () => {
    // สร้างชื่อไฟล์ Excel
    const fileName = `ตารางการปฏิบัติงานนอกเวลา_กลุ่มงานเวชกรรมฟื้นฟู`;
    const sheetName = `Schedule_${format(currentMonth, 'yyyy-MM')}`;
    
    // สร้างข้อมูลสำหรับหัวตาราง
    const title = [
      [`ตารางการปฏิบัติงานนอกเวลา กลุ่มงานเวชกรรมฟื้นฟู`],
      [`ประจำเดือน ${format(currentMonth, 'MMMM', { locale: th })} พ.ศ. ${parseInt(format(currentMonth, 'yyyy')) + 543}`],
      []
    ];
    
    // สร้างหัวตาราง
    const headers = [
      ["ชื่อ-สกุล", "ตำแหน่ง", ...days.map(d => d.toString()), "รวม", "ช", "บ", "หมายเหตุ"]
    ];
    
    // สร้างข้อมูลตาราง
    const data = staffWithShifts.map(p => [
      p.name, 
      p.position, 
      ...p.shifts, 
      p.totalShifts.toString(), 
      p.morningShifts.toString(), 
      p.afternoonShifts.toString(), 
      ""
    ]);
    
    // รวมข้อมูลทั้งหมด
    const wsData = [...title, ...headers, ...data];
    
    // สร้าง workbook และ worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    
    // กำหนดความกว้างของคอลัมน์
    const columnWidths = [
      { wch: 30 }, // ชื่อ - สกุล
      { wch: 20 }, // ตำแหน่ง
      ...days.map(() => ({ wch: 3 })), // Days
      { wch: 5 }, // รวม
      { wch: 5 }, // ช
      { wch: 5 }, // บ
      { wch: 15 }, // หมายเหตุ
    ];
    ws['!cols'] = columnWidths;
    
    // รวมเซลล์สำหรับหัวข้อ
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: days.length + 5 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: days.length + 5 } }
    ];
    
    // เพิ่มสีพื้นหลังตามประเภทคำขอเวร
    staffWithShifts.forEach((staff, staffIdx) => {
      staff.requestTypes.forEach((type, dayIdx) => {
        if (type) {
          const rowIdx = title.length + headers.length + staffIdx;
          const colIdx = 2 + dayIdx;
          
          // สร้างชื่อเซลล์ (เช่น "C5")
          const cellRef = XLSX.utils.encode_cell({ r: rowIdx, c: colIdx });
          
          // ตรวจสอบว่าเซลล์มีอยู่
          if (!ws[cellRef]) {
            ws[cellRef] = { v: "" };
          }
          
          // กำหนดสีพื้นหลังตามประเภทคำขอเวร
          if (!ws[cellRef].s) ws[cellRef].s = {};
          
          if (type === 'preferred') {
            // สีเขียวสำหรับวันที่ขอเวร
            ws[cellRef].s = { 
              fill: { 
                patternType: "solid", 
                fgColor: { rgb: "90EE90" } 
              } 
            };
          } else if (type === 'avoided') {
            // สีแดงสำหรับวันที่ไม่เอาเวร
            ws[cellRef].s = { 
              fill: { 
                patternType: "solid", 
                fgColor: { rgb: "FFA07A" } 
              } 
            };
          } else if (type === 'leave') {
            // สีเทาสำหรับวันที่ลา
            ws[cellRef].s = { 
              fill: { 
                patternType: "solid", 
                fgColor: { rgb: "D3D3D3" } 
              } 
            };
          }
        }
      });
    });
    
    // เพิ่มคำอธิบายสี
    const legendRow = title.length + headers.length + staffWithShifts.length + 2;
    XLSX.utils.sheet_add_aoa(ws, [
      ["คำอธิบายสี:"],
      ["", "ขอเวร", "ไม่เอาเวร", "ลา"]
    ], { origin: legendRow });
    
    // กำหนดสีให้กับคำอธิบาย
    const legendCells = [
      { r: legendRow + 1, c: 1, color: "90EE90" }, // ขอเวร
      { r: legendRow + 1, c: 2, color: "FFA07A" }, // ไม่เอาเวร
      { r: legendRow + 1, c: 3, color: "D3D3D3" }  // ลา
    ];
    
    legendCells.forEach(cell => {
      const cellRef = XLSX.utils.encode_cell({ r: cell.r, c: cell.c });
      if (!ws[cellRef].s) ws[cellRef].s = {};
      ws[cellRef].s = {
        fill: {
          patternType: "solid",
          fgColor: { rgb: cell.color }
        }
      };
    });
    
    // เพิ่มข้อความด้านล่างตาราง
    const lastRow = data.length + title.length + headers.length;
    wsData.push([]); // เว้นบรรทัด
    wsData.push(["เรียน", "ผู้อำนวยการโรงพยาบาลสุขภาล"]);
    wsData.push(["", "เพื่อโปรดพิจารณาอนุมัติ"]);
    
    // เว้นบรรทัด
    wsData.push([]);
    wsData.push([]);
    wsData.push([]);
    
    // ลายเซ็น
    wsData.push(["", "", "", "", "", "", "(นายพิทักษ์ เนื่องชมภู)"]);
    wsData.push(["", "", "", "", "", "", "หัวหน้ากลุ่มงานเวช"]);
    wsData.push(["", "", "", "", "", "", "นายแพทย์ชำนาญการ รักษาการในตำแหน่ง"]);
    wsData.push(["", "", "", "", "", "", "ผู้อำนวยการโรงพยาบาลสุขภาล"]);
    
    // เพิ่มข้อความ "อนุมัติ" ด้านล่าง
    wsData.push([]);
    wsData.push([]);
    wsData.push(["", "", "", "", "", "", "อนุมัติ"]);
    
    // อัปเดต worksheet ด้วยข้อมูลใหม่
    XLSX.utils.sheet_add_aoa(ws, wsData.slice(title.length + headers.length + data.length), {origin: lastRow});
    
    // เพิ่ม sheet สรุปคำขอเวร/วันลา
    const requestSheetHeaders = ["ชื่อ-สกุล", "วันที่", "ประเภท", "ช่วงเวร"];
    const requestSheetData = shiftRequests.map(req => {
      const person = personnel.find(p => p.id === req.userId);
      return [
        person?.name || req.userId,
        req.date instanceof Date ? format(req.date, 'dd/MM/yyyy', { locale: th }) : String(req.date),
        req.type === 'preferred' ? 'ขอเวร' : req.type === 'avoided' ? 'ไม่เอาเวร' : 'ลา',
        req.shift === 'morning' ? 'เช้า' : req.shift === 'afternoon' ? 'บ่าย' : '-',
      ];
    });
    const wsRequests = XLSX.utils.aoa_to_sheet([requestSheetHeaders, ...requestSheetData]);
    XLSX.utils.book_append_sheet(wb, wsRequests, 'Requests');
    
    // เพิ่ม worksheet ลงใน workbook และสร้างไฟล์
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `${fileName}.xlsx`);
  }

  // ฟังก์ชันสำหรับกำหนดสีพื้นหลังตามประเภทคำขอเวร (priority: requestType > shift)
  const getCellBackgroundColor = (staffId: string, day: number, shift: string, requestType: string | null) => {
    if (requestType === 'preferred') {
      return 'bg-green-200'; // สีเขียวสำหรับวันที่ขอเวร
    } else if (requestType === 'avoided') {
      return 'bg-red-200';   // สีแดงสำหรับวันที่ไม่เอาเวร
    } else if (requestType === 'leave') {
      return 'bg-gray-300';  // สีเทาสำหรับวันที่ลา
    } else if (shift === "ช") {
      return "bg-blue-100";  // สีฟ้าสำหรับเวรเช้า
    } else if (shift === "บ") {
      return "bg-yellow-100"; // สีเหลืองสำหรับเวรบ่าย
    }
    return "";
  };

  return (
    <div className="p-4 border rounded-lg">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
        <h2 className="text-xl font-semibold">ตารางเวรประจำเดือน {format(currentMonth, 'MMMM yyyy', { locale: th })}</h2>
        <Button variant="outline" onClick={exportToExcel}>
          <FileDown className="w-4 h-4 mr-2" /> Export Excel
        </Button>
      </div>
      
      <div className="overflow-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="border p-2 whitespace-nowrap sticky left-0 bg-gray-50 z-10">ชื่อ - สกุล</th>
              <th className="border p-2 whitespace-nowrap sticky left-[200px] bg-gray-50 z-10">ตำแหน่ง</th>
              {days.map(day => {
                const date = new Date(currentMonth);
                date.setDate(day);
                const isSun = isSunday(date);
                
                return (
                  <th 
                    key={day} 
                    className={`border p-2 w-8 text-center ${isSun ? 'bg-gray-200' : ''}`}
                  >
                    {day}
                  </th>
                );
              })}
              <th className="border p-2">รวม</th>
              <th className="border p-2">ช</th>
              <th className="border p-2">บ</th>
              <th className="border p-2">หมายเหตุ</th>
            </tr>
          </thead>
          <tbody>
            {staffWithShifts.map((staff, index) => (
              <tr key={index}>
                <td className="border p-2 whitespace-nowrap sticky left-0 bg-white z-10">{staff.name}</td>
                <td className="border p-2 whitespace-nowrap sticky left-[200px] bg-white z-10">{staff.position}</td>
                {days.map((day, i) => {
                  const date = new Date(currentMonth);
                  date.setDate(day);
                  const isSun = isSunday(date);
                  const requestType = staff.requestTypes[i];
                  
                  return (
                    <td
                      key={i}
                      className={`border text-center p-1 ${
                        isSun 
                          ? 'bg-gray-200' 
                          : getCellBackgroundColor(staff.id, day, staff.shifts[i], requestType)
                      }`}
                    >
                      {staff.shifts[i]}
                    </td>
                  );
                })}
                <td className="border text-center p-1">{staff.totalShifts}</td>
                <td className="border text-center p-1">{staff.morningShifts}</td>
                <td className="border text-center p-1">{staff.afternoonShifts}</td>
                <td className="border p-2"></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* เพิ่มคำอธิบายสี */}
      <div className="mt-4 flex flex-wrap gap-4">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-blue-100 mr-2"></div>
          <span>เวรเช้า (ช)</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-yellow-100 mr-2"></div>
          <span>เวรบ่าย (บ)</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-green-200 mr-2"></div>
          <span>ขอเวร</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-red-200 mr-2"></div>
          <span>ไม่เอาเวร</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-gray-300 mr-2"></div>
          <span>ลา</span>
        </div>
      </div>
    </div>
  )
}

export default ShiftSchedulePreview; 