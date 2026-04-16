import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, CheckCircle2, XCircle, } from "lucide-react";

const RequestCalendar = ({ requests, subjectConfig, onItemClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

  const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const STATUS_CONFIG = {
    pending: {
      label: "รอดำเนินการ",
      dot: "bg-yellow-400",
    },
    finish: {
      label: "สำเร็จ",
      dot: "bg-green-500",
    },
    cancel: {
      label: "ยกเลิก",
      dot: "bg-red-500",
    },
  };
  
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleMonthChange = (e) => {
    const newMonth = Number(e.target.value);
    setCurrentDate(new Date(currentDate.getFullYear(), newMonth, 1));
  };

  const handleYearChange = (e) => {
    const newYear = Number(e.target.value);
    setCurrentDate(new Date(newYear, currentDate.getMonth(), 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const monthNames = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
  const daysOfWeek = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const days = [];

  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), i));

  const getAppointmentsForDay = (date) => {
    if (!date) return [];
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    
    return requests.filter(req => req.appointmentDate === dateString);
  };

  return (
<div className="w-full bg-transparent md:bg-white rounded-none md:rounded-[30px] p-0 md:p-6 shadow-none md:shadow-sm border-0 md:border md:border-gray-200">      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between mb-4 md:mb-6 gap-2">
        <div className="flex items-center gap-1 md:gap-2">
          <CalendarIcon className="text-[#f3a638] w-5 h-5 md:w-6 md:h-6 shrink-0" />

          <div className="flex gap-1 md:gap-2">
            <select
              value={currentDate.getMonth()}
              onChange={handleMonthChange}
              className="px-1 md:px-3 py-1.5 rounded-lg md:rounded-xl bg-gray-100 font-bold text-gray-700 text-xs md:text-base outline-none"
            >
              {monthNames.map((name, index) => (
                <option key={index} value={index}>{name}</option>
              ))}
            </select>

            <select
              value={currentDate.getFullYear()}
              onChange={handleYearChange}
              className="px-1 md:px-3 py-1.5 rounded-lg md:rounded-xl bg-gray-100 font-bold text-gray-700 text-xs md:text-base outline-none"
            >
              {years.map((year) => (
                <option key={year} value={year}>{year + 543}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-1 md:gap-2 ml-auto">
          <button onClick={handlePrevMonth} className="p-1.5 md:p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
          </button>
          <button onClick={handleNextMonth} className="p-1.5 md:p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg md:rounded-xl overflow-hidden border border-gray-200">
        
        {/* Days of week */}
        {daysOfWeek.map(day => (
          <div key={day} className="bg-gray-50 p-1 md:p-3 text-center text-[10px] md:text-sm font-bold text-gray-500">
            {day}
          </div>
        ))}

        {/* Calendar Days */}
        {days.map((date, index) => {
          const appointments = getAppointmentsForDay(date);
          const isToday = date && date.toDateString() === new Date().toDateString();

          return (
            <div
              key={index}
              className={`relative min-h-[80px] md:min-h-[120px] bg-white p-1 md:p-2 flex flex-col gap-1 transition-colors hover:bg-gray-50 ${
                !date ? "bg-gray-50/50" : ""
              }`}
            >
              {date && (
                <>
                  <span className={`text-[10px] md:text-sm font-bold mb-0.5 md:mb-1 w-5 h-5 md:w-7 md:h-7 flex items-center justify-center rounded-full shrink-0 ${isToday ? 'bg-[#f3a638] text-white' : 'text-gray-700'}`}>
                    {date.getDate()}
                  </span>

                  {/* รายการนัดหมาย */}
                  <div className="flex flex-col gap-1 md:gap-1.5 overflow-y-auto max-h-[50px] md:max-h-20 no-scrollbar">
                    {appointments.map(req => {
                      // ✨ 1. สร้างฟังก์ชันแปลงค่า (ดักไว้ทั้งไทยและอังกฤษ)
                      const getSubjectKey = (sub) => {
                        if (!sub) return "other";
                        const s = sub.toString().trim();
                        const map = {
                          "แจ้งซ่อม": "fix",
                          "ทำความสะอาด": "clean",
                          "แจ้งย้ายออก": "leave",
                          "ย้ายออก": "leave",
                          "อื่นๆ": "other",
                          "อื่น ๆ": "other"
                        };
                        return map[s] || s;
                      };

                      // ✨ 2. แปลงค่าก่อนนำไปดึง Config
                      const normalizedSubject = getSubjectKey(req.subject);
                      const subject = subjectConfig[normalizedSubject] || subjectConfig.other;
                      
                      const status = STATUS_CONFIG[req.status];

                      return (
                        <div
                          key={req.id}
                          onClick={() => onItemClick(req)}
                          title={`ห้อง ${req.roomNumber}\nเรื่อง: ${subject.label}\nสถานะ: ${status?.label ?? "-"}`}
                          // ✅ 5. ลดขนาด Padding และย่อข้อความในมือถือ
                          className={`
                            ${subject.color}
                            text-[9px] md:text-[11px] px-1 md:px-2 py-1 md:py-1.5 rounded-md md:rounded-lg cursor-pointer font-bold shadow-sm
                            transition-all hover:brightness-90 flex items-center gap-1 md:gap-2
                          `}
                        >
                          {/* จุดสถานะ */}
                          {status && (
                            <span className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full shrink-0 ${status.dot}`} />
                          )}

                          {/* ข้อความ */}
                          <span className="truncate w-full leading-tight">
                            <span className="hidden md:inline">{req.roomNumber} : {subject.label}</span>
                            {/* บนมือถืออาจจะโชว์แค่เลขห้องถ้ายาวเกิน หรือโชว์ย่อๆ */}
                            <span className="md:hidden">{req.roomNumber}</span>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RequestCalendar;