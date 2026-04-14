import { useState, useEffect, useRef } from "react";
import {
  Wrench,
  Sparkles,
  LogOut,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";

const RequestItem = ({ req, onClick, onChangeStatus }) => {
  const [openStatus, setOpenStatus] = useState(false);
  const statusRef = useRef(null);

const subjectConfig = {
    fix: {
      label: "แจ้งซ่อม",
      icon: <Wrench className="w-6 h-6 md:w-8 md:h-8" />,
      color: "bg-[#D8B4FE] text-[#6B21A8]",
    },
    clean: {
      label: "ทำความสะอาด",
      icon: <Sparkles className="w-6 h-6 md:w-8 md:h-8" />,
      color: "bg-[#BAE6FD] text-[#0369A1]",
    },
    leave: {
      label: "ย้ายออก",
      icon: <LogOut className="w-6 h-6 md:w-8 md:h-8" />,
      color: "bg-[#E5E7EB] text-[#374151]",
    },
    other: {
      label: "อื่นๆ",
      icon: <FileText className="w-6 h-6 md:w-8 md:h-8" />,
      color: "bg-[#FED7AA] text-[#9A3412]",
    },
  };

  // ✨ 1. เพิ่มฟังก์ชันแปลงค่า (ดักไว้ทั้งภาษาไทยและอังกฤษ ป้องกันเว้นวรรคผิด)
  const getSubjectKey = (sub) => {
    if (!sub) return "other";
    const s = sub.toString().trim();
    
    // ถ้าเป็นอังกฤษอยู่แล้วให้ return ได้เลย
    if (["fix", "clean", "leave", "other"].includes(s)) return s;

    // ถ้าเป็นภาษาไทย ให้แปลงกลับเป็นอังกฤษ
    const reverseMap = {
      "แจ้งซ่อม": "fix",
      "ทำความสะอาด": "clean",
      "ย้ายออก": "leave",
      "แจ้งย้ายออก": "leave", // ดักเผื่อไว้
      "อื่นๆ": "other",
      "อื่น ๆ": "other"     // ดักเผื่อกรณีมีเว้นวรรค
    };
    
    return reverseMap[s] || "other";
  };
  // 3. เพิ่ม Logic สำหรับตรวจจับการคลิกข้างนอก เพื่อปิดcแถบ
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        openStatus &&
        statusRef.current &&
        !statusRef.current.contains(event.target)
      ) {
        setOpenStatus(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openStatus]);

  const statusConfig = {
    pending: {
      label: "รอดำเนินการ",
      color: "bg-[#FEF9C3] text-[#854D0E]",
      icon: <Clock size={16} />,
    },
    finish: {
      label: "สำเร็จ",
      color: "bg-[#DCFCE7] text-[#166534]",
      icon: <CheckCircle2 size={16} />,
    },
    cancel: {
      label: "ยกเลิก",
      color: "bg-[#FEE2E2] text-[#991B1B]",
      icon: <XCircle size={16} />,
    },
  };
  const subjectKey = getSubjectKey(req.subject);
  const subject = subjectConfig[subjectKey] || subjectConfig.other;
  
  const status = statusConfig[req.status] || statusConfig.pending;

  // ฟังก์ชันแปลงวันที่เป็นรูปแบบไทย
  const formatThaiDate = (dateString) => {
    if (!dateString) return "-";
    // ถ้าข้อมูลเดิมเป็นภาษาไทยอยู่แล้ว (จาก Mock Data เก่า) ให้คืนค่าเดิมกลับไปเลย
    if (dateString.includes("พ.ศ.") || dateString.includes("พฤศจิกายน"))
      return dateString;

    const [year, month, day] = dateString.split("-");
    const thaiMonths = [
      "มกราคม",
      "กุมภาพันธ์",
      "มีนาคม",
      "เมษายน",
      "พฤษภาคม",
      "มิถุนายน",
      "กรกฎาคม",
      "สิงหาคม",
      "กันยายน",
      "ตุลาคม",
      "พฤศจิกายน",
      "ธันวาคม",
    ];
    const thaiYear = parseInt(year) + 543;
    return `${parseInt(day)} ${thaiMonths[parseInt(month) - 1]} ${thaiYear}`;
  };

  return (
    <div
      onClick={onClick}
      className="flex overflow-visible max-w-3xl mx-auto items-center gap-3 md:gap-6 bg-gray-50 border border-gray-300 p-5 rounded-[25px] hover:shadow-md transition-all cursor-pointer group w-full"
    >
      {/* ไอคอนตามประเภทเรื่อง */}
      <div
        className={`p-3 md:p-4 rounded-xl md:rounded-2xl ${subject.color} shrink-0 transition-transform group-hover:scale-105`}
      >
        {subject.icon}
      </div>

      {/* ข้อมูลเนื้อหา */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 md:gap-3">
          <span className="text-lg md:text-2xl font-black text-gray-800">
            {req.roomNumber}
          </span>
        </div>
        <p className="font-bold text-sm md:text-base text-gray-700">
          {subject.label}
        </p>
        {/* แสดง Body เฉพาะจอคอม (hidden md:block) หรือถ้าอยากให้แสดงแบบตัดคำเหมือนเดิมก็ได้ */}
        <p className="text-xs md:text-sm text-gray-400 truncate hidden md:block">
          {req.body}
        </p>
      </div>

      {/* ส่วนสถานะและวันที่ (ฝั่งขวาสุด) */}
      <div className="flex flex-col justify-between items-end self-stretch min-w-[100px] md:min-w-[140px]">
        <div className="relative" ref={statusRef}>
          <button
            onClick={(e) => {
              e.stopPropagation(); 
              setOpenStatus((prev) => !prev);
            }}
            className={`flex items-center justify-center gap-2 font-bold transition-all
              w-9 h-9 md:w-auto md:px-4 md:py-2 rounded-xl
              ${status.color} `}
          >
            {status.icon}
            <span className="hidden md:inline text-sm">{status.label}</span>
          </button>

          {/* Dropdown เปลี่ยนสถานะ */}
          {openStatus && (
            <div
              className="absolute right-0 mt-2 w-32 md:w-36 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {Object.entries(statusConfig).map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenStatus(false);
                    onChangeStatus(req.id, key);
                  }}
                  className="w-full px-4 py-3 md:py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 font-bold text-gray-600"
                >
                  <span className={cfg.color + " p-1 rounded-md"}>
                    {cfg.icon}
                  </span>
                  {cfg.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="text-right mt-2">
          <p className="text-[10px] sm:text-[11px] text-gray-400 font-semibold tracking-wide uppercase">
            แจ้งเมื่อ : {formatThaiDate(req.requestDate)}
          </p>
          <p className="text-[10px] sm:text-[11px] text-gray-400 font-semibold tracking-wide uppercase">
            นัดหมาย : {formatThaiDate(req.appointmentDate)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default RequestItem;
