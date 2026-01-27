import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";

const RequestCalendar = ({ requests, subjectConfig, onItemClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
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
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <CalendarIcon className="text-[#f3a638]" />
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear() + 543}
        </h2>
        <div className="flex gap-2">
          <button onClick={handlePrevMonth} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><ChevronLeft /></button>
          <button onClick={handleNextMonth} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><ChevronRight /></button>
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
            <div key={index} className={`min-h-[120px] bg-white p-2 flex flex-col gap-1 transition-colors hover:bg-gray-50 ${!date ? 'bg-gray-50/50' : ''}`}>
              {date && (
                <>
                  <span className={`text-sm font-bold mb-1 w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-[#f3a638] text-white' : 'text-gray-700'}`}>
                    {date.getDate()}
                  </span>
                  
                  {/* รายการนัดหมาย */}
                  <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[80px] no-scrollbar">
                    {appointments.map(req => {
                      const subject = subjectConfig[req.subject] || subjectConfig.other;
                      
                      return (
                        <div 
                          key={req.id}
                          onClick={() => onItemClick(req)}
                          // ✨ ใช้สีจาก Config โดยตรง (subject.color) ✨
                          className={`
                            ${subject.color} 
                            text-[11px] px-2 py-1.5 rounded-lg cursor-pointer truncate font-bold shadow-sm 
                            transition-all hover:scale-105 hover:brightness-95 flex items-center gap-1.5
                          `}
                        >
                          {/* จุดสีเล็กๆ ใช้สีเดียวกับตัวอักษร (currentColor) เพื่อให้เข้ากัน */}
                          {/* <div className="w-1.5 h-1.5 rounded-full bg-current opacity-60 shrink-0" /> */}
                        
                          <span className="truncate">{req.roomId} : {subject.label}</span>
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