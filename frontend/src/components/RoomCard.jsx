import React from 'react';
import { LogIn, LogOut, Wrench, Sparkles, Package, Clock } from 'lucide-react';

const RoomCard = ({ roomNumber, building, tenantName, status, icons = [] }) => {

  const normalizedStatus = status? status.toString().toLowerCase(): "available";
  
  // กำหนดสีตามสถานะจากดีไซน์ของคุณ
  const statusColors = {
    occupied: 'bg-[#10b981]', // เขียว - มีผู้เช่า
    overdue: 'bg-[#fb7185]',  // แดง - ค้างชำระ
    reserved: 'bg-[#facc15]', // เหลือง - ติดจอง
    available: 'bg-white border-2 border-gray-200', // ขาว - ว่าง
    maintenance: 'bg-[#4b5563]', // เทาเข้ม - ปิดปรับปรุง
   pending: 'bg-[#94a3b8]',  // เทาอ่อน - รอดำเนินการชำระเงิน ยังไม่จ่ายและยังไม่ค้าง ยังอยู่ในเวลาที่กำหนด
  };

  // Map ไอคอนจากข้อมูล
  const iconMap = {
    moveIn: <LogIn size={18} className="text-green-600" />,
    moveOut: <LogOut size={18} className="text-red-600" />,
    repair: <Wrench size={18} className="text-blue-600" />,
    clean: <Sparkles size={18} className="text-cyan-500" />,
    package: <Package size={18} className="text-amber-700" />,
    urgent: <Clock size={18} className="text-orange-500" />,
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`w-20 h-20 sm:w-28 sm:h-28 rounded-xl shadow-sm relative flex items-center justify-center transition-transform hover:scale-105 cursor-pointer ${statusColors[normalizedStatus] || statusColors.available}`}>
        
        {/* แสดงไอคอนที่มุมซ้ายบน (ถ้ามีข้อมูล) */}
        {icons.length > 0 && (
          <div className="absolute top-1 left-1 bg-white/90 rounded-full p-1.5 shadow-sm flex gap-0.5">
            {icons.map((iconKey, index) => (
              <span key={index}>{iconMap[iconKey]}</span>
            ))}
          </div>
        )}

        {/* กรณีห้องว่างให้โชว์เลขห้องข้างใน แต่ถ้ามีสีให้ไปโชว์ข้างล่างตามดีไซน์ */}
        {status === 'available' && 
        <span className={`text-xl font-bold ${normalizedStatus === "available"? "text-gray-400": "text-white"}`}>
        {building}{roomNumber}
</span>}
      </div>
      
      {/* เลขห้องและชื่อเล่นใต้กล่อง */}
      <div className="flex flex-col items-center leading-tight">
        <span className="text-m font-bold text-gray-700">{building}{roomNumber}</span>
        {tenantName && <span className="py-0.5 text-[14px] text-gray-500 truncate w-16 text-center">{tenantName}</span>}
      </div>
    </div>
  );
};

export default RoomCard;