import React from "react";
import { Download, Printer, FileText, Send, Plus } from "lucide-react";

// --- Base Component สำหรับคุมความยืดหยุ่น (Responsive) ---
const BaseButton = ({ onClick, children, className = "", disabled = false }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`
      /* จอเล็ก: ขยายเต็มและตัวอักษรเล็กลง | จอใหญ่: ขนาดพอดีและตัวอักษรมาตรฐาน */
      flex-1 md:flex-none w-full md:w-auto 
      flex items-center justify-center gap-2 
      py-2.5 px-6 rounded-xl font-bold transition-all 
      active:scale-95 shadow-md disabled:opacity-50 disabled:cursor-not-allowed
      ${className}
    `}
  >
    {children}
  </button>
);

// 1. ปุ่มสีฟ้า (Action/Selection) สำหรับ พิมพ์บิล, เลือกทั้งหมด
export const BlueButton = ({ label, icon: Icon, onClick, className = "" }) => (
  <BaseButton 
    onClick={onClick} 
    className={`bg-[#AED6F1] text-[#2E86C1] hover:bg-[#85C1E9] text-sm sm:text-base ${className}`}
  >
    {Icon && <Icon size={20} />}
    <span className="truncate">{label}</span>
  </BaseButton>
);

// 2. ปุ่มสีเขียว (Success/Send) สำหรับ ส่งบิล
export const GreenButton = ({ label, icon: Icon, onClick, className = "" }) => (
  <BaseButton 
    onClick={onClick} 
    className={`bg-[#D5F5E3] text-[#1D8348] hover:bg-[#abebc6] text-sm sm:text-base ${className}`}
  >
    {Icon && <Icon size={20} />}
    <span className="truncate">{label}</span>
  </BaseButton>
);

// 3. ปุ่มสีส้ม (Primary) สำหรับ Add
export const OrangeButton = ({ label, icon: Icon, onClick, className = "" }) => (
  <BaseButton 
    onClick={onClick} 
    className={`bg-[#f3a638] text-white hover:bg-[#e6952e] text-sm sm:text-base ${className}`}
  >
    {Icon && <Icon size={20} />}
    <span className="truncate">{label}</span>
  </BaseButton>
);

export const AddButton = ({ label, icon: Icon, onClick, className = "" }) => (
  <BaseButton 
    onClick={onClick} 
        className={`bg-[#f3a638] text-white hover:bg-[#e6952e] text-sm sm:text-base ${className}`}

    // className={`bg-[#FF7D22] text-white hover:bg-[#d3681c] text-sm sm:text-base ${className}`}
  >
    {Icon && <Icon size={20} />}
    <span className="truncate">{label}</span>
  </BaseButton>
);

// 4. ปุ่มดาวน์โหลด (ปรับสไตล์ให้เป็นสีเขียวตามบรีฟหน้า Billing)
export const DownloadButton = ({ onClick, label = "ดาวน์โหลด", className = "" }) => (
  <BaseButton 
    onClick={onClick} 
    className={`bg-[#D5F5E3] text-[#1D8348] hover:bg-[#abebc6] text-sm sm:text-base ${className}`}
  >
    <Download size={20} />
    <span className="truncate">{label}</span>
  </BaseButton>
);

// 5. ปุ่มบันทึก (คงเดิมแต่ปรับความยืดหยุ่น)
export const SaveButton = ({ onClick, label = "บันทึก", disabled = false, className = "" }) => (
  <BaseButton 
    onClick={onClick} 
    disabled={disabled}
    className={`bg-[#5cb85c] hover:bg-[#4cae4c] text-white text-lg ${className}`}
  >
    {label}
  </BaseButton>
);

// 6. ปุ่มเลือกทั้งชั้น
export const SelectAllFloorButton = ({ 
  onClick, 
  label = "เลือกทั้งชั้น", 
  className = "" 
}) => (
  <button
    onClick={onClick}
    className={`bg-[#AED6F1] text-[#2E86C1] px-4 py-1.5 rounded-xl font-bold text-sm hover:brightness-95 transition-all active:scale-95 ${className}`}
  >
    {label}
  </button>
);