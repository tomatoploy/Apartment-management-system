import React from "react";
import { Download, Save } from "lucide-react";


export const SaveButton = ({ onClick, label = "บันทึก", disabled = false, className = "" }) => (
 <button
   onClick={onClick}
   disabled={disabled}
   className={`flex items-center justify-center gap-2 bg-[#5cb85c] hover:bg-[#4cae4c] text-white px-8 py-3 rounded-2xl font-bold shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
 >
   {/* ใช้สีเขียวตามรูป Screenshot 2 */}
   <span className="text-lg">{label}</span>
 </button>
);


export const DownloadButton = ({ onClick, label = "ดาวน์โหลด", className = "" }) => (
 <button
   onClick={onClick}
   className={`flex items-center gap-2 bg-[#5cb85c] hover:bg-[#4cae4c] text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-sm ${className}`}
 >
   <Download size={20} />
   {label}
 </button>
);