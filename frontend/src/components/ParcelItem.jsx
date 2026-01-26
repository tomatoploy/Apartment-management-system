import React from "react";
import { Mails , Package, Truck, CheckCircle2, Clock } from "lucide-react";

const ParcelItem = ({ parcel, onClick }) => {
  const isReceived = parcel.pickupDate !== null;
  
  const typeConfig = {
    box: { icon: <Package size={32} />, label: "กล่อง"},
    pack: { icon: <Mails size={32} />, label: "ซอง" },
    other: { icon: <Truck size={32} />, label: "อื่นๆ" },
  };

  const getStatusColor = () => {
    if (!isReceived) {
      return "bg-[#FEE2E2] text-[#991B1B]"; 
    }
    return "bg-[#DCFCE7] text-[#166534]";    
  };

  const statusConfig = isReceived 
    ? { label: "สำเร็จ", color: "bg-[#DCFCE7] text-[#166534]", icon: <CheckCircle2 size={16} /> }
    : { label: "ค้างนำจ่าย", color: "bg-[#FEE2E2] text-[#991B1B]", icon: <Clock size={16} /> };

  const currentType = typeConfig[parcel.type] || typeConfig.other;
  const iconColor = getStatusColor(); // เรียกใช้สีตามสถานะหลัง icon

  //สร้างฟังก์ชันแปลงวันที่เป็นไทย
  const formatThaiDate = (dateString) => {
    if (!dateString) return "-";
    const [year, month, day] = dateString.split("-");
    const thaiMonths = [
      "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
      "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
    ];
    // แปลง ค.ศ. เป็น พ.ศ. (+543)
    const thaiYear = parseInt(year) + 543;
    return `${parseInt(day)} ${thaiMonths[parseInt(month) - 1]} ${thaiYear}`;
  };

  return (
    <div onClick={onClick} className="flex overflow-hidden max-w-3xl mx-auto items-center gap-6 bg-gray-50 border border-gray-300 p-5 rounded-[25px] hover:shadow-md transition-all cursor-pointer group w-full">
      {/* ส่วนไอคอน: ใช้สี iconColor ที่กำหนดตามสถานะ */}
      <div className={`p-4 rounded-2xl ${iconColor} shrink-0 transition-transform group-hover:scale-110`}>
        {currentType.icon}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-2xl font-bold text-gray-800">{parcel.roomId}</span>
        </div>
        <p className="font-bold text-gray-700">ชื่อผู้รับ : {parcel.recipient || "-"}</p>
        <p className="text-sm text-gray-500 truncate">เลข Tracking: {parcel.trackingNumber || "-"}</p>
      </div>

      <div className="flex flex-col justify-between items-end self-stretch min-w-35">
        <span className={`w-28 py-1.5 rounded-full text-[11px] font-bold flex items-center justify-center gap-1.5 shadow-sm ${statusConfig.color}`}>
          {statusConfig.icon} {statusConfig.label}
        </span>
        <div className="text-right">
          <p className="text-[10px] sm:text-[11px] text-gray-400 font-semibold tracking-wide">ถึงเมื่อ : {formatThaiDate(parcel.arrivalDate)}</p>
        </div>
      </div>
    </div>
  );
};

export default ParcelItem;