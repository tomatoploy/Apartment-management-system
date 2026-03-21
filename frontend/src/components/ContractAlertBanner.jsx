import React from "react";
import { Clock, ArrowRight } from "lucide-react";

const ContractAlertBanner = ({ daysLeft, isExpired, onAction }) => {
  // กำหนดสีและข้อความตามสถานะ
  const bgColor = isExpired ? "bg-amber-50" : "bg-orange-50";
  const borderColor = isExpired ? "border-amber-200" : "border-orange-200";
  const textColor = isExpired ? "text-amber-700" : "text-orange-700";
  const iconColor = isExpired ? "text-amber-500" : "text-orange-500";

  return (
    <div className={`${bgColor} border ${borderColor} rounded-3xl p-5 shadow-sm transition-all`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 ${isExpired ? 'bg-amber-100' : 'bg-orange-100'} rounded-full flex items-center justify-center ${iconColor}`}>
            <Clock size={28} />
          </div>
          <div>
            <h4 className={`font-black ${textColor} text-lg leading-tight`}>
              {isExpired ? "สัญญาเช่าหมดอายุแล้ว" : "สัญญาเช่าใกล้ครบกำหนด"}
            </h4>
            <p className="text-sm font-bold text-gray-500 mt-0.5">
              {isExpired 
                ? "กรุณาดำเนินการต่อสัญญาใหม่เพื่อให้สถานะกลับมาเป็นปัจจุบัน" 
                : `สัญญาจะสิ้นสุดในอีก ${daysLeft} วัน ดำเนินการต่อสัญญาได้ทันที`}
            </p>
          </div>
        </div>

        <button
          onClick={onAction}
          className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-2xl font-black text-sm text-white shadow-md transition-all hover:scale-105 ${isExpired ? 'bg-amber-500 hover:bg-amber-600' : 'bg-orange-500 hover:bg-orange-600'}`}
        >
          จัดการสัญญาเช่า <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default ContractAlertBanner;