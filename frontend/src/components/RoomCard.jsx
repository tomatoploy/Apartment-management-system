import React from 'react';
import { Link } from "react-router-dom";
import { LogIn, LogOut, Wrench, Sparkles, Package, Clock, FileText } from 'lucide-react';

const RoomCard = ({ 
  roomId, 
  roomNumber, 
  building, 
  tenantName, 
  status, 
  icons = [], 
  overdueCount = 0,
  isContractExpired = false,
  isContractUrgent = false,
}) => {
  console.log(`ห้อง ${roomNumber} ได้รับไอคอน:`, icons);
  const normalizedStatus = status ? status.toString().toLowerCase() : "available";

  const statusColors = {
    occupied:    'bg-[#10b981]',
    overdue:     'bg-[#fb7185]',
    reserved:    'bg-[#facc15]',
    available:   'bg-white border-2 border-gray-200',
    maintenance: 'bg-[#4b5563]',
    pending:     'bg-[#94a3b8]',
  };

  // ── ✅ urgent icon สีต่างกันตาม expired หรือ urgent ──────────
  const urgentIcon = isContractExpired
    ? <Clock size={16} className="text-red-600" />      // หมดแล้ว → แดง
    : <Clock size={16} className="text-orange-500" />;  // ใกล้หมด → ส้ม

const iconMap = {
    moveIn:  <LogIn  size={16} className="text-green-600" />,
    leave:   <LogOut size={16} className="text-red-600" />,
    fix:     <Wrench size={16} className="text-blue-600" />,
    clean:   <Sparkles size={16} className="text-cyan-500" />,
    package: <Package size={16} className="text-amber-700" />,
    urgent:  urgentIcon,
    other:   <FileText size={16} className="text-[#9A3412]" />,
  };

  // ✨ 1. เพิ่มฟังก์ชันแปลงค่าไทยเป็นอังกฤษ
  const normalizeIconKey = (iconStr) => {
    if (!iconStr) return "";
    const s = iconStr.toString().trim();
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

  // ✨ 2. ทำการ map array เดิมผ่านฟังก์ชันแปลงค่าก่อน
  const normalizedIconsList = icons.map(normalizeIconKey);

  // ✨ 3. ใช้ list ที่แปลงค่าแล้วมา filter
  const moveIcons     = normalizedIconsList.filter((i) => ["moveIn", "leave"].includes(i));
  const activityIcons = normalizedIconsList.filter((i) => ["fix", "clean", "package", "other"].includes(i));

  return (
    <div className="flex flex-col items-center gap-1">
      <Link to={`/rooms/${roomNumber}`} className="block transition-transform hover:scale-105 group relative">

        {/* 🔴 badge ซ้ายบน: จำนวนเดือนค้างชำระ */}
        {overdueCount > 0 && (
          <div className="absolute -top-2 -left-2 bg-red-600 text-white rounded-full min-w-[24px] h-[24px] px-1.5 flex items-center justify-center text-[11px] font-black shadow-lg z-10 border-2 border-white">
            {overdueCount}
          </div>
        )}

        {/* 🟠/🔴 badge ขวาบน: ใกล้หมด/หมดสัญญา */}
        {(isContractExpired || isContractUrgent) && (
          <div
            className={`absolute -top-2 -right-2 rounded-full w-7 h-7 flex items-center justify-center shadow-lg z-10 border-2 border-white
              ${isContractExpired ? "bg-red-600" : "bg-orange-400"}`}
            title={isContractExpired ? "สัญญาหมดอายุแล้ว" : "สัญญาใกล้ครบกำหนด (≤ 30 วัน)"}
          >
            <Clock size={14} strokeWidth={3} className="text-white" />
          </div>
        )}

        <div className={`w-20 h-20 sm:w-28 sm:h-28 rounded-xl shadow-sm relative flex items-center justify-center transition-transform cursor-pointer ${statusColors[normalizedStatus] || statusColors.available}`}>

          {/* Zone 1: บนซ้าย */}
          <div className="absolute top-1.5 left-1.5 flex flex-row gap-1 z-10">
            {moveIcons.map((iconKey, index) => (
              iconMap[iconKey] && (
                <div key={index} className="bg-white/90 rounded-full p-1.5 shadow-sm flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8">
                  {iconMap[iconKey]}
                </div>
              )
            ))}
          </div>

          {/* Zone 2: ล่างซ้าย */}
          <div className="absolute bottom-1.5 left-1.5 flex flex-row gap-1 z-10">
            {activityIcons.map((iconKey, index) => (
              iconMap[iconKey] && (
                <div key={index} className="bg-white/90 rounded-full p-1.5 shadow-sm flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8">
                  {iconMap[iconKey]}
                </div>
              )
            ))}
          </div>

          {normalizedStatus === "available" && (
            <span className="text-xl font-bold text-gray-400">{building}{roomNumber}</span>
          )}
        </div>

        <div className="mt-1 flex flex-col items-center leading-tight">
          <span className="text-m font-bold text-gray-700">{building}{roomNumber}</span>
          {tenantName && (
            <span className="py-0.5 text-[14px] text-gray-500 truncate w-20 text-center">{tenantName}</span>
          )}
        </div>
      </Link>
    </div>
  );
};

export default RoomCard;