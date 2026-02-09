import { useState } from "react";
import { Mails, Package, Truck, CheckCircle2, Clock } from "lucide-react";

const ParcelItem = ({ parcel, onClick, onChangeStatus }) => {
  const [openStatus, setOpenStatus] = useState(false);

  const typeConfig = {
    box: { icon: <Package size={32} />, label: "กล่อง" },
    pack: { icon: <Mails size={32} />, label: "ซอง" },
    other: { icon: <Truck size={32} />, label: "อื่นๆ" },
  };

  const statusConfig = {
    pending: { label: "ค้างนำจ่าย", color: "bg-[#FEE2E2] text-[#991B1B]", icon: <Clock size={16} /> },
    received: { label: "รับแล้ว", color: "bg-[#DCFCE7] text-[#166534]", icon: <CheckCircle2 size={16} /> },
  };

  const derivedStatus = parcel.pickupDate ? "received" : "pending";
  const currentStatus = statusConfig[derivedStatus];
  const currentType = typeConfig[parcel.type] || typeConfig.other;

  const formatThaiDate = (dateString) => {
    if (!dateString) return "-";
    const [year, month, day] = dateString.split("T")[0].split("-");
    const thaiMonths = [
      "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
      "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
    ];
    return `${parseInt(day)} ${thaiMonths[parseInt(month) - 1]} ${parseInt(year) + 543}`;
  };

  return (
    <div
      onClick={onClick}
      className="flex overflow-visible max-w-3xl mx-auto items-center gap-6 bg-gray-50 border border-gray-300 p-5 rounded-[25px] hover:shadow-md transition-all cursor-pointer group w-full"
    >
      <div className={`p-4 rounded-2xl ${currentStatus.color} shrink-0 transition-transform group-hover:scale-110`}>
        {currentType.icon}
      </div>

      <div className="flex-1 min-w-0">
        <span className="text-2xl font-bold text-gray-800">{parcel.roomNumber}</span>
        <p className="font-bold text-gray-700">ชื่อผู้รับ : {parcel.recipient || "-"}</p>
        <p className="text-sm text-gray-500 truncate">เลข Tracking: {parcel.trackingNumber || "-"}</p>
      </div>

      <div className="flex flex-col justify-between items-end self-stretch min-w-35">
        <div className="relative">
          {/* ✅ แก้ไขปุ่มหลัก: ให้กดแล้วเปิด Dropdown */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setOpenStatus(!openStatus);
            }}
            className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 ${currentStatus.color}`}
          >
            {currentStatus.icon}
            {currentStatus.label}
          </button>

          {openStatus && (
            <div
              className="absolute right-0 mt-2 w-36 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {Object.entries(statusConfig).map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => {
                    setOpenStatus(false);
                    onChangeStatus(parcel.id, key); // ส่งค่ากลับไปหา Parent
                  }}
                  className="w-full px-4 py-3 text-left text-sm hover:bg-gray-100 flex items-center gap-2 font-bold text-gray-700  last:border-0"
                >
                  {cfg.icon}
                  {cfg.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <p className="text-[10px] sm:text-[11px] text-gray-400 font-semibold tracking-wide">
          ถึงเมื่อ : {formatThaiDate(parcel.arrivalDate)}
        </p>
      </div>
    </div>
  );
};

export default ParcelItem;