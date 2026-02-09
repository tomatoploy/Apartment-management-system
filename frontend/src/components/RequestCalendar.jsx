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
    // แปลงวันที่เป็น YYYY-MM-DD เพื่อเทียบกับข้อมูล (รองรับทั้ง Timezone ไทยและสากล)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    
    return requests.filter(req => req.appointmentDate === dateString);
  };

  return (
    <div className="bg-white rounded-[30px] p-6 shadow-sm border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <CalendarIcon className="text-[#f3a638]" />

          {/* Month + Year selector */}
          <div className="flex gap-2">
            <select
              value={currentDate.getMonth()}
              onChange={handleMonthChange}
              className="px-3 py-1.5 rounded-xl bg-gray-100 font-bold text-gray-700"
            >
              {monthNames.map((name, index) => (
                <option key={index} value={index}>{name}</option>
              ))}
            </select>

            <select
              value={currentDate.getFullYear()}
              onChange={handleYearChange}
              className="px-3 py-1.5 rounded-xl bg-gray-100 font-bold text-gray-700"
            >
              {years.map((year) => (
                <option key={year} value={year}>{year + 543}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={handlePrevMonth} className="p-2 hover:bg-gray-100 rounded-full">
            <ChevronLeft />
          </button>
          <button onClick={handleNextMonth} className="p-2 hover:bg-gray-100 rounded-full">
            <ChevronRight />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-xl overflow-hidden border border-gray-200">
        {daysOfWeek.map(day => (
          <div key={day} className="bg-gray-50 p-3 text-center text-sm font-bold text-gray-500">
            {day}
          </div>
        ))}
        {days.map((date, index) => {
          const appointments = getAppointmentsForDay(date);
          const isToday = date && date.toDateString() === new Date().toDateString();

          return (
            <div
              key={index}
              className={`relative min-h-30 bg-white p-2 flex flex-col gap-1 transition-colors hover:bg-gray-50 ${
                !date ? "bg-gray-50/50" : ""
              }`}
            >
              {date && (
                <>
                  <span className={`text-sm font-bold mb-1 w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-[#f3a638] text-white' : 'text-gray-700'}`}>
                    {date.getDate()}
                  </span>

                  {/* รายการนัดหมาย */}
                  <div className="flex flex-col gap-1.5 overflow-y-auto max-h-20 no-scrollbar">
                  {appointments.map(req => {
  const subject = subjectConfig[req.subject] || subjectConfig.other;
  const status = STATUS_CONFIG[req.status];

  return (
    <div
      key={req.id}
      onClick={() => onItemClick(req)}
      title={`ห้อง ${req.roomNumber}\nเรื่อง: ${subject.label}\nสถานะ: ${status?.label ?? "-"}`}
      className={`
        ${subject.color}
        text-[11px] px-2 py-1.5 rounded-lg cursor-pointer font-bold shadow-sm
        transition-all hover:brightness-90 flex items-center gap-2
      `}
    >
      {/* จุดสถานะ */}
      {status && (
        <span className={`w-2 h-2 rounded-full ${status.dot}`} />
      )}

      {/* ข้อความ */}
      <span className="truncate">
        {req.roomNumber} : {subject.label}
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