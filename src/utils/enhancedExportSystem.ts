// 📁 enhancedExportSystem.ts - ระบบส่งออกตารางเวรขั้นสูง
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import dayjs from 'dayjs';
import 'dayjs/locale/th';

dayjs.locale('th');

// 📌 Interface สำหรับข้อมูล
interface ShiftSlot {
  user_id: string;
  role: string;
  assigned_by?: 'auto' | 'manual' | 'request';
}

interface DaySchedule {
  date: string;
  shift: 'morning' | 'afternoon';
  day_type: 'weekday' | 'weekend' | 'holiday';
  slots: ShiftSlot[];
  is_complete: boolean;
  warnings?: string[];
}

interface Personnel {
  id: string;
  name: string;
  role: string;
  position?: string;
  department?: string;
  phone?: string;
  email?: string;
}

interface UserShiftData {
  name: string;
  position: string;
  department?: string;
  shifts: Record<string, string>;
  summary: {
    morning: number;
    afternoon: number;
    total: number;
    weekday: number;
    weekend: number;
    holiday: number;
  };
  payment?: number;
}

// 🔧 แปลงข้อมูลเวรเป็นรูปแบบตาราง
function transformToGridData(
  shifts: DaySchedule[], 
  personnelList: Personnel[],
  config?: any
): Record<string, UserShiftData> {
  const users: Record<string, UserShiftData> = {};
  
  // เริ่มต้นข้อมูลผู้ใช้
  personnelList.forEach(p => {
    users[p.id] = {
      name: p.name,
      position: p.position || p.role,
      department: p.department,
      shifts: {},
      summary: {
        morning: 0,
        afternoon: 0,
        total: 0,
        weekday: 0,
        weekend: 0,
        holiday: 0
      },
      payment: 0
    };
  });

  // นับเวรและคำนวณสถิติ
  shifts.forEach(shift => {
    shift.slots.forEach(slot => {
      const user = users[slot.user_id];
      if (!user) return;

      const mark = shift.shift === 'morning' ? 'ช' : 'บ';
      user.shifts[shift.date] = mark;
      
      // นับสถิติ
      if (shift.shift === 'morning') user.summary.morning++;
      else user.summary.afternoon++;
      
      if (shift.day_type === 'weekday') user.summary.weekday++;
      else if (shift.day_type === 'weekend') user.summary.weekend++;
      else user.summary.holiday++;
      
      user.summary.total++;

      // คำนวณค่าจ้าง (ถ้ามี config)
      if (config?.rates) {
        const rate = config.rates[shift.shift][slot.role] || 0;
        user.payment = (user.payment || 0) + rate;
      }
    });
  });

  return users;
}

// ✨ Export Excel แบบขั้นสูง
export function exportToEnhancedExcel(
  shifts: DaySchedule[], 
  personnelList: Personnel[], 
  options: {
    month: number;
    year: number;
    title?: string;
    includeSummary?: boolean;
    includePayment?: boolean;
    includeStatistics?: boolean;
    config?: any;
  }
): void {
  const { month, year, title, includeSummary = true, includePayment = false, includeStatistics = true, config } = options;
  const users = transformToGridData(shifts, personnelList, config);
  
  const wb = XLSX.utils.book_new();
  
  // 📊 Sheet 1: ตารางเวรหลัก
  const mainSheetData = createMainSheet(users, month, year, title);
  const mainWs = XLSX.utils.aoa_to_sheet(mainSheetData);
  
  // จัดรูปแบบคอลัมน์
  const range = XLSX.utils.decode_range(mainWs['!ref']!);
  mainWs['!cols'] = [
    { width: 20 }, // ชื่อ
    { width: 15 }, // ตำแหน่ง
    { width: 12 }, // แผนก
    ...Array(31).fill({ width: 4 }), // วันที่ 1-31
    { width: 6 }, // ช
    { width: 6 }, // บ
    { width: 8 }, // รวม
    { width: 10 }, // ค่าจ้าง
    { width: 15 }  // หมายเหตุ
  ];
  
  XLSX.utils.book_append_sheet(wb, mainWs, 'ตารางเวร');

  // 📈 Sheet 2: สถิติและสรุป
  if (includeStatistics) {
    const statsData = createStatisticsSheet(shifts, users);
    const statsWs = XLSX.utils.aoa_to_sheet(statsData);
    XLSX.utils.book_append_sheet(wb, statsWs, 'สถิติ');
  }

  // 💰 Sheet 3: ค่าจ้าง
  if (includePayment && config?.rates) {
    const paymentData = createPaymentSheet(users, config);
    const paymentWs = XLSX.utils.aoa_to_sheet(paymentData);
    XLSX.utils.book_append_sheet(wb, paymentWs, 'ค่าจ้าง');
  }

  // 🗓 Sheet 4: รายละเอียดวันต่อวัน
  const detailData = createDailyDetailSheet(shifts, personnelList);
  const detailWs = XLSX.utils.aoa_to_sheet(detailData);
  XLSX.utils.book_append_sheet(wb, detailWs, 'รายละเอียด');

  // บันทึกไฟล์
  const filename = `ตารางเวร_${month.toString().padStart(2, '0')}_${year}.xlsx`;
  XLSX.writeFile(wb, filename);
  
  console.log(`✅ ส่งออก Excel สำเร็จ: ${filename}`);
}

// 📋 สร้าง Sheet ตารางเวรหลัก
function createMainSheet(users: Record<string, UserShiftData>, month: number, year: number, title?: string): any[][] {
  const data: any[][] = [];
  
  // หัวข้อ
  if (title) {
    data.push([title]);
    data.push([]);
  }
  
  data.push([`ตารางเวร เดือน ${dayjs(`${year}-${month}-01`).format('MMMM YYYY')}`]);
  data.push([]);

  // Header แถวแรก
  const headerRow1 = ['ชื่อ - สกุล', 'ตำแหน่ง', 'แผนก'];
  for (let d = 1; d <= 31; d++) {
    headerRow1.push(d.toString());
  }
  headerRow1.push('สรุป', '', '', 'ค่าจ้าง', 'หมายเหตุ');
  data.push(headerRow1);

  // Header แถวสอง
  const headerRow2 = ['', '', ''];
  const daysInMonth = dayjs(`${year}-${month}`).daysInMonth();
  
  for (let d = 1; d <= 31; d++) {
    if (d <= daysInMonth) {
      const dayName = dayjs(`${year}-${month}-${d}`).format('ddd');
      headerRow2.push(dayName);
    } else {
      headerRow2.push('');
    }
  }
  headerRow2.push('ช', 'บ', 'รวม', 'บาท', '');
  data.push(headerRow2);

  // ข้อมูลแต่ละคน
  Object.values(users).forEach(user => {
    const row = [user.name, user.position, user.department || ''];
    
    for (let d = 1; d <= 31; d++) {
      const dateStr = `${year}-${month.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
      row.push(user.shifts[dateStr] || '');
    }
    
    row.push(
      user.summary.morning,
      user.summary.afternoon,
      user.summary.total,
      user.payment || 0,
      ''
    );
    
    data.push(row);
  });

  return data;
}

// 📊 สร้าง Sheet สถิติ
function createStatisticsSheet(shifts: DaySchedule[], users: Record<string, UserShiftData>): any[][] {
  const data: any[][] = [];
  
  data.push(['📊 สถิติการจัดเวรประจำเดือน']);
  data.push([]);
  
  // สถิติรวม
  const totalShifts = shifts.length;
  const completeDays = shifts.filter(s => s.is_complete).length;
  const totalWarnings = shifts.reduce((sum, s) => sum + (s.warnings?.length || 0), 0);
  
  data.push(['สถิติทั่วไป']);
  data.push(['วันทั้งหมด', totalShifts]);
  data.push(['วันที่จัดเวรครบ', completeDays]);
  data.push(['วันที่มีปัญหา', totalShifts - completeDays]);
  data.push(['คำเตือนทั้งหมด', totalWarnings]);
  data.push([]);

  // สถิติบุคลากร
  const userStats = Object.values(users).map(u => ({
    name: u.name,
    total: u.summary.total,
    morning: u.summary.morning,
    afternoon: u.summary.afternoon
  })).sort((a, b) => b.total - a.total);

  data.push(['การกระจายเวร (เรียงตามจำนวนเวร)']);
  data.push(['ชื่อ', 'เวรรวม', 'เวรเช้า', 'เวรบ่าย']);
  userStats.forEach(stat => {
    data.push([stat.name, stat.total, stat.morning, stat.afternoon]);
  });

  return data;
}

// 💰 สร้าง Sheet ค่าจ้าง
function createPaymentSheet(users: Record<string, UserShiftData>, config: any): any[][] {
  const data: any[][] = [];
  
  data.push(['💰 สรุปค่าจ้างเวรประจำเดือน']);
  data.push([]);
  
  data.push(['ชื่อ', 'เวรเช้า', 'เวรบ่าย', 'รวมเวร', 'ค่าจ้าง (บาท)']);
  
  let totalPayment = 0;
  Object.values(users).forEach(user => {
    data.push([
      user.name,
      user.summary.morning,
      user.summary.afternoon,
      user.summary.total,
      user.payment || 0
    ]);
    totalPayment += user.payment || 0;
  });
  
  data.push([]);
  data.push(['รวมค่าจ้างทั้งหมด', '', '', '', totalPayment]);
  
  return data;
}

// 🗓 สร้าง Sheet รายละเอียดรายวัน
function createDailyDetailSheet(shifts: DaySchedule[], personnelList: Personnel[]): any[][] {
  const data: any[][] = [];
  
  data.push(['🗓 รายละเอียดการจัดเวรรายวัน']);
  data.push([]);
  data.push(['วันที่', 'ประเภทวัน', 'เวร', 'ชื่อ', 'ตำแหน่ง', 'วิธีจัด', 'สถานะ']);
  
  shifts.forEach(shift => {
    const dayStr = dayjs(shift.date).format('DD/MM/YYYY (dddd)');
    
    if (shift.slots.length === 0) {
      data.push([
        dayStr,
        shift.day_type,
        shift.shift === 'morning' ? 'เช้า' : 'บ่าย',
        'ไม่มีคนเวร',
        '',
        '',
        '❌ ไม่สมบูรณ์'
      ]);
    } else {
      shift.slots.forEach((slot, index) => {
        const person = personnelList.find(p => p.id === slot.user_id);
        data.push([
          index === 0 ? dayStr : '',
          index === 0 ? shift.day_type : '',
          index === 0 ? (shift.shift === 'morning' ? 'เช้า' : 'บ่าย') : '',
          person?.name || slot.user_id,
          slot.role,
          slot.assigned_by === 'request' ? '🙋 ขอเวร' : '🤖 อัตโนมัติ',
          index === 0 ? (shift.is_complete ? '✅ สมบูรณ์' : '⚠️ ไม่ครบ') : ''
        ]);
      });
    }
  });
  
  return data;
}

// 🎨 Export PDF แบบขั้นสูง
export async function exportToEnhancedPDF(
  elementId: string = 'shift-table-container',
  options: {
    filename?: string;
    orientation?: 'portrait' | 'landscape';
    quality?: number;
    addHeader?: boolean;
    addFooter?: boolean;
    title?: string;
  } = {}
): Promise<void> {
  const {
    filename = `ตารางเวร_${dayjs().format('YYYY-MM-DD')}.pdf`,
    orientation = 'landscape',
    quality = 1.0,
    addHeader = true,
    addFooter = true,
    title = 'ตารางเวรประจำเดือน'
  } = options;

  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`ไม่พบ element ที่มี id="${elementId}"`);
    }

    // สร้าง canvas จาก HTML
    const canvas = await html2canvas(element, {
      scale: quality,
      useCORS: true,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.9);
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;

    // สร้าง PDF
    const pdf = new jsPDF({
      orientation: orientation,
      unit: 'px',
      format: [imgWidth + 40, imgHeight + 80] // เผื่อที่สำหรับ header/footer
    });

    // เพิ่ม header
    if (addHeader) {
      pdf.setFontSize(16);
      pdf.text(title, 20, 30);
      pdf.setFontSize(10);
      pdf.text(`สร้างเมื่อ: ${dayjs().format('DD/MM/YYYY HH:mm')}`, 20, 50);
    }

    // เพิ่มรูปภาพ
    const yPosition = addHeader ? 60 : 20;
    pdf.addImage(imgData, 'JPEG', 20, yPosition, imgWidth, imgHeight);

    // เพิ่ม footer
    if (addFooter) {
      const footerY = yPosition + imgHeight + 20;
      pdf.setFontSize(8);
      pdf.text('สร้างโดยระบบจัดเวรอัตโนมัติ', 20, footerY);
      pdf.text(`หน้า 1`, imgWidth - 40, footerY);
    }

    // บันทึกไฟล์
    pdf.save(filename);
    console.log(`✅ ส่งออก PDF สำเร็จ: ${filename}`);
    
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดในการส่งออก PDF:', error);
    throw error;
  }
}

// 📱 Export สำหรับมือถือ (รูปภาพ)
export async function exportToImage(
  elementId: string,
  format: 'png' | 'jpeg' = 'png',
  filename?: string
): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`ไม่พบ element ที่มี id="${elementId}"`);
  }

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff'
  });

  // สร้าง link สำหรับดาวน์โหลด
  const link = document.createElement('a');
  link.download = filename || `ตารางเวร_${dayjs().format('YYYY-MM-DD')}.${format}`;
  link.href = canvas.toDataURL(`image/${format}`, format === 'jpeg' ? 0.9 : 1.0);
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  console.log(`✅ ส่งออกรูปภาพสำเร็จ: ${link.download}`);
}

// 🚀 ฟังก์ชันส่งออกแบบครบชุด
export async function exportAllFormats(
  shifts: DaySchedule[],
  personnelList: Personnel[],
  options: {
    month: number;
    year: number;
    title?: string;
    elementId?: string;
    config?: any;
  }
): Promise<void> {
  const { month, year, title, elementId, config } = options;
  
  try {
    console.log('🚀 เริ่มส่งออกไฟล์ทุกประเภท...');
    
    // Excel
    exportToEnhancedExcel(shifts, personnelList, {
      month,
      year,
      title,
      includePayment: !!config,
      config
    });
    
    // PDF (ถ้ามี element)
    if (elementId && document.getElementById(elementId)) {
      await exportToEnhancedPDF(elementId, {
        filename: `ตารางเวร_${month.toString().padStart(2, '0')}_${year}.pdf`,
        title: title || `ตารางเวร ${month}/${year}`
      });
    }
    
    console.log('✅ ส่งออกไฟล์ทุกประเภทสำเร็จ!');
    
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดในการส่งออก:', error);
    throw error;
  }
}

// Export ฟังก์ชันหลัก
export {
  transformToGridData
}; 