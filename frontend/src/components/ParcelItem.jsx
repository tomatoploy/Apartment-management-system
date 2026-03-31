import { useState, useRef, useEffect } from "react";
import { Mails, Package, Truck, CheckCircle2, Clock } from "lucide-react";
import { toThaiDate } from "./DateController";

const ParcelItem = ({ parcel, onClick, onChangeStatus }) => {
  const dropdownRef = useRef(null);
  const [openStatus, setOpenStatus] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenStatus(false);
      }
    };

    if (openStatus) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openStatus]);

  const typeConfig = {
    box: { icon: <Package size={32} />, label: "กล่อง" },
    pack: { icon: <Mails size={32} />, label: "ซอง" },
    other: { icon: <Truck size={32} />, label: "อื่นๆ" },
  };

  const statusConfig = {
    pending: {
      label: "ค้างนำจ่าย",
      color: "bg-[#FEE2E2] text-[#991B1B]",
      icon: <Clock size={16} />,
    },
    received: {
      label: "รับแล้ว",
      color: "bg-[#DCFCE7] text-[#166534]",
      icon: <CheckCircle2 size={16} />,
    },
  };

  const derivedStatus = parcel.pickupDate ? "received" : "pending";
  const currentStatus = statusConfig[derivedStatus];
  const currentType = typeConfig[parcel.type] || typeConfig.other;


  return (
    <div
      onClick={onClick}
      className="flex overflow-visible max-w-3xl mx-auto items-center gap-6 bg-gray-50 border border-gray-300 p-5 rounded-[25px] hover:shadow-md transition-all cursor-pointer group w-full"
    >
      <div
        className={`hidden md:block p-4 rounded-2xl ${currentStatus.color} shrink-0 transition-transform group-hover:scale-110`}
      >
        {currentType.icon}
      </div>

      <div className="flex-1 min-w-0">
        <span className="text-2xl font-bold text-gray-800">
          {parcel.roomNumber}
        </span>
        <p className="font-bold text-gray-700 break-words leading-tight mt-1">
          ผู้รับ: {parcel.recipient || "-"}
        </p>
        <p className="text-sm text-gray-500 truncate">
          เลขพัสดุ: {parcel.trackingNumber || "-"}
        </p>
      </div>

      <div className="flex flex-col justify-between items-end self-stretch min-w-35">
        <div className="relative" ref={dropdownRef}>
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
                  <span className={cfg.color + " p-1 rounded-md"}>
                    {cfg.icon}
                  </span>
                  {cfg.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <p className="text-[10px] sm:text-[11px] text-gray-400 font-semibold tracking-wide">
          ถึงเมื่อ : {toThaiDate(parcel.arrivalDate)}
        </p>
      </div>
    </div>
  );
};

export default ParcelItem;
