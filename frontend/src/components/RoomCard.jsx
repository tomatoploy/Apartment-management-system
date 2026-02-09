import React from 'react';
import { LogIn, LogOut, Wrench, Sparkles, Package, Clock, FileText } from 'lucide-react';

const RoomCard = ({ roomNumber, building, tenantName, status, icons = [] }) => {

  const normalizedStatus = status ? status.toString().toLowerCase() : "available";

  // กำหนดสีตามสถานะ
  const statusColors = {
    occupied: 'bg-[#10b981]', 
    overdue: 'bg-[#fb7185]',  
    reserved: 'bg-[#facc15]', 
    available: 'bg-white border-2 border-gray-200',
    maintenance: 'bg-[#4b5563]', 
    pending: 'bg-[#94a3b8]',  
  };

  // Map ไอคอน
  const iconMap = {
    moveIn: <LogIn size={16} className="text-green-600" />,
    leave: <LogOut size={16} className="text-red-600" />,
    fix: <Wrench size={16} className="text-blue-600" />, 
    clean: <Sparkles size={16} className="text-cyan-500" />,
    package: <Package size={16} className="text-amber-700" />,
    urgent: <Clock size={16} className="text-orange-500" />,
    other: <FileText size={16} className="text-[#9A3412]" />,
  };

  // แยกกลุ่มไอคอน
  const moveIcons = icons.filter(i => ["moveIn", "leave"].includes(i));
  const activityIcons = icons.filter(i => ["fix", "clean", "package", "urgent", "other"].includes(i));

  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`w-20 h-20 sm:w-28 sm:h-28 rounded-xl shadow-sm relative flex items-center justify-center transition-transform hover:scale-105 cursor-pointer ${statusColors[normalizedStatus] || statusColors.available}`}>

        {/* --- ZONE 1: บนซ้าย (Top Left) --- */}
        {/* กลุ่มย้าย: เรียงแนวนอน (row) */}
        <div className="absolute top-1.5 left-1.5 flex flex-row gap-1 z-10">
          {moveIcons.map((iconKey, index) => (
            iconMap[iconKey] && (
              <div key={index} className="bg-white/90 rounded-full p-1.5 shadow-sm flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8">
                {iconMap[iconKey]}
              </div>
            )
          ))}
        </div>

        {/* --- ZONE 2: ล่างซ้าย (Bottom Left) --- */}
        {/* กลุ่มกิจกรรม: เรียงแนวนอน (row) */}
        <div className="absolute bottom-1.5 left-1.5 flex flex-row gap-1 z-10">
          {activityIcons.map((iconKey, index) => (
            iconMap[iconKey] && (
              <div key={index} className="bg-white/90 rounded-full p-1.5 shadow-sm flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8">
                {iconMap[iconKey]}
              </div>
            )
          ))}
        </div>

        {/* กรณีห้องว่างให้โชว์เลขห้องข้างใน */}
        {normalizedStatus === 'available' && (
          <span className="text-xl font-bold text-gray-400">
            {building}{roomNumber}
          </span>
        )}
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