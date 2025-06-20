import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Personnel } from "@/utils/enhancedShiftScheduler";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, isSameDay } from "date-fns";
import { th } from "date-fns/locale";
import { X, Calendar as CalendarIcon, Check } from "lucide-react";

interface ShiftRequest {
  id: string;
  userId: string;
  date: Date;
  type: "preferred" | "avoided" | "leave";
  shift?: "morning" | "afternoon";
}

interface ShiftRequestsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  personnel: Personnel[];
  currentMonth: Date;
  shiftRequests: ShiftRequest[];
  onSaveRequests: (requests: ShiftRequest[]) => void;
}

const ShiftRequestsDialog: React.FC<ShiftRequestsDialogProps> = ({
  open,
  onOpenChange,
  personnel,
  currentMonth,
  shiftRequests,
  onSaveRequests,
}) => {
  const [requests, setRequests] = useState<ShiftRequest[]>(shiftRequests);
  const [selectedStaff, setSelectedStaff] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedType, setSelectedType] = useState<"preferred" | "avoided" | "leave">("preferred");
  const [selectedShift, setSelectedShift] = useState<"morning" | "afternoon">("morning");

  useEffect(() => {
    if (personnel.length > 0 && !selectedStaff) {
      setSelectedStaff(personnel[0].id);
    }
  }, [personnel, selectedStaff]);

  const handleAddRequest = () => {
    if (!selectedStaff || !selectedDate) return;

    const newRequest: ShiftRequest = {
      id: `request-${Date.now()}`,
      userId: selectedStaff,
      date: selectedDate,
      type: selectedType,
      shift: selectedType === "preferred" ? selectedShift : undefined,
    };

    // Remove any existing requests for the same user and date
    const filteredRequests = requests.filter(
      (req) => !(req.userId === selectedStaff && isSameDay(req.date, selectedDate))
    );

    setRequests([...filteredRequests, newRequest]);
    setSelectedDate(undefined);
  };

  const handleDeleteRequest = (id: string) => {
    setRequests(requests.filter((req) => req.id !== id));
  };

  const handleSave = () => {
    onSaveRequests(requests);
    onOpenChange(false);
  };

  const getStaffNameById = (id: string) => {
    const staff = personnel.find((p) => p.id === id);
    return staff ? staff.name : "ไม่ระบุ";
  };

  const getRequestsByStaff = (staffId: string) => {
    return requests.filter((req) => req.userId === staffId);
  };
  
  // ฟังก์ชันสำหรับกำหนดสีพื้นหลังตามประเภทคำขอเวร
  const getRequestTypeColor = (type: string) => {
    switch (type) {
      case "preferred":
        return "bg-green-100 text-green-800"; // สีเขียวสำหรับขอเวร
      case "avoided":
        return "bg-red-100 text-red-800";     // สีแดงสำหรับไม่เอาเวร
      case "leave":
        return "bg-gray-200 text-gray-800";   // สีเทาสำหรับลา
      default:
        return "";
    }
  };
  
  // ฟังก์ชันสำหรับแปลงประเภทคำขอเวรเป็นข้อความภาษาไทย
  const getRequestTypeText = (type: string) => {
    switch (type) {
      case "preferred":
        return "ขอเวร";
      case "avoided":
        return "ไม่เอาเวร";
      case "leave":
        return "ลา";
      default:
        return type;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>จัดการคำขอเวร</DialogTitle>
          <DialogDescription>
            บันทึกการขอเวร ไม่เอาเวร หรือลาของบุคลากร
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="add" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="add">เพิ่มคำขอเวร</TabsTrigger>
            <TabsTrigger value="view">ดูคำขอทั้งหมด</TabsTrigger>
          </TabsList>

          <TabsContent value="add" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium mb-2">เลือกบุคลากร</h3>
                <Select value={selectedStaff} onValueChange={setSelectedStaff}>
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกบุคลากร" />
                  </SelectTrigger>
                  <SelectContent>
                    {personnel.map((staff) => (
                      <SelectItem key={staff.id} value={staff.id}>
                        {staff.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <h3 className="text-sm font-medium mt-4 mb-2">ประเภทคำขอ</h3>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="preferred"
                      name="requestType"
                      value="preferred"
                      checked={selectedType === "preferred"}
                      onChange={() => setSelectedType("preferred")}
                      className="mr-2"
                    />
                    <label htmlFor="preferred" className="flex items-center">
                      <span className="w-3 h-3 bg-green-200 inline-block mr-1 rounded-sm"></span>
                      ขอเวร
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="avoided"
                      name="requestType"
                      value="avoided"
                      checked={selectedType === "avoided"}
                      onChange={() => setSelectedType("avoided")}
                      className="mr-2"
                    />
                    <label htmlFor="avoided" className="flex items-center">
                      <span className="w-3 h-3 bg-red-200 inline-block mr-1 rounded-sm"></span>
                      ไม่เอาเวร
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="leave"
                      name="requestType"
                      value="leave"
                      checked={selectedType === "leave"}
                      onChange={() => setSelectedType("leave")}
                      className="mr-2"
                    />
                    <label htmlFor="leave" className="flex items-center">
                      <span className="w-3 h-3 bg-gray-300 inline-block mr-1 rounded-sm"></span>
                      ลา
                    </label>
                  </div>
                </div>

                {selectedType === "preferred" && (
                  <div className="mt-4">
                    <h3 className="text-sm font-medium mb-2">ช่วงเวร</h3>
                    <div className="flex gap-4">
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id="morning"
                          name="shiftTime"
                          value="morning"
                          checked={selectedShift === "morning"}
                          onChange={() => setSelectedShift("morning")}
                          className="mr-2"
                        />
                        <label htmlFor="morning">เช้า (ช)</label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id="afternoon"
                          name="shiftTime"
                          value="afternoon"
                          checked={selectedShift === "afternoon"}
                          onChange={() => setSelectedShift("afternoon")}
                          className="mr-2"
                        />
                        <label htmlFor="afternoon">บ่าย (บ)</label>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-4">
                  <Button onClick={handleAddRequest} disabled={!selectedDate}>
                    บันทึกคำขอ
                  </Button>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">เลือกวันที่</h3>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="border rounded-md p-3"
                  locale={th}
                />
              </div>
            </div>

            {selectedStaff && (
              <div className="mt-4">
                <h3 className="text-sm font-medium mb-2">คำขอของ {getStaffNameById(selectedStaff)}</h3>
                <div className="border rounded-md">
                  <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="py-2 px-4 text-left">วันที่</th>
                        <th className="py-2 px-4 text-left">ประเภท</th>
                        <th className="py-2 px-4 text-left">ช่วงเวร</th>
                        <th className="py-2 px-4 text-right">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getRequestsByStaff(selectedStaff).map((req) => (
                        <tr key={req.id} className="border-t">
                          <td className="py-2 px-4">
                            {format(req.date, "d MMMM yyyy", { locale: th })}
                          </td>
                          <td className="py-2 px-4">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getRequestTypeColor(req.type)}`}>
                              {getRequestTypeText(req.type)}
                            </span>
                          </td>
                          <td className="py-2 px-4">
                            {req.shift === "morning"
                              ? "เช้า (ช)"
                              : req.shift === "afternoon"
                              ? "บ่าย (บ)"
                              : "-"}
                          </td>
                          <td className="py-2 px-4 text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteRequest(req.id)}
                            >
                              <X className="w-4 h-4 text-red-500" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                      {getRequestsByStaff(selectedStaff).length === 0 && (
                        <tr>
                          <td colSpan={4} className="py-4 text-center text-gray-500">
                            ไม่มีคำขอเวร
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="view" className="mt-4">
            <div className="border rounded-md">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-2 px-4 text-left">บุคลากร</th>
                    <th className="py-2 px-4 text-left">วันที่</th>
                    <th className="py-2 px-4 text-left">ประเภท</th>
                    <th className="py-2 px-4 text-left">ช่วงเวร</th>
                    <th className="py-2 px-4 text-right">จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((req) => (
                    <tr key={req.id} className="border-t">
                      <td className="py-2 px-4">{getStaffNameById(req.userId)}</td>
                      <td className="py-2 px-4">
                        {format(req.date, "d MMMM yyyy", { locale: th })}
                      </td>
                      <td className="py-2 px-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getRequestTypeColor(req.type)}`}>
                          {getRequestTypeText(req.type)}
                        </span>
                      </td>
                      <td className="py-2 px-4">
                        {req.shift === "morning"
                          ? "เช้า (ช)"
                          : req.shift === "afternoon"
                          ? "บ่าย (บ)"
                          : "-"}
                      </td>
                      <td className="py-2 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteRequest(req.id)}
                        >
                          <X className="w-4 h-4 text-red-500" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {requests.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-gray-500">
                        ไม่มีคำขอเวร
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            ยกเลิก
          </Button>
          <Button onClick={handleSave}>บันทึก</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ShiftRequestsDialog; 