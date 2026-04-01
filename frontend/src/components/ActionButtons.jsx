import React, { useState } from 'react';
import { Download, Printer, FileText, Send, Plus, X, AlertCircle, RotateCw , } from "lucide-react";
import ReactDOM from 'react-dom'; 

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
      active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
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

export const ExitButton = ({ onClick, className = "" }) => (
  <button
    onClick={onClick}
    className={`p-2 hover:bg-gray-100 rounded-full transition-all duration-200 group active:scale-90 ${className}`}
  >
    <X 
      size={20} 
      strokeWidth={2} 
      className="text-gray-400 transition-colors" 
    />
  </button>);

export const WhiteButton = ({ label, icon: Icon, onClick, className = "" }) => (
  <button
    onClick={onClick} // ใช้ onClick จาก props
    className={`h-12 px-4 rounded-xl border transition-all flex items-center justify-center gap-2 font-bold shrink-0 
    bg-white border-gray-200 text-gray-500 hover:border-[#f3a638] hover:text-[#f3a638] ${className}`}
  >
    {label} {Icon && <Icon size={20} />} {/* ใช้ label และ Icon จาก props */}
  </button>
);

export const RefreshButton = () => {
  // (ข้อ 2) สร้าง State เพื่อตรวจสอบการกดรัว
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    if (isRefreshing) return; // ถ้ากำลังโหลดอยู่ ให้บล็อกการกดซ้ำ
    setIsRefreshing(true);
    window.location.reload();
  };

  return (
    <button
      onClick={handleRefresh}
      disabled={isRefreshing}
      title="รีเฟรชหน้า"
      className={`
        p-3 rounded-xl border transition-all flex items-center justify-center shrink-0 group
        
        ${isRefreshing 
          ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed' /* สไตล์ตอนถูกระงับการกด */
          : 'bg-white border-gray-200 text-gray-500 hover:border-[#f3a638] hover:text-[#f3a638] hover:bg-orange-50'
        }
      `}
    >
      <RotateCw
        size={20}
        className={`transition-transform duration-500 ${isRefreshing ? 'animate-spin' : 'group-hover:rotate-180'}`}
      />
    </button>
  );
};

export const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "ยืนยันการทำรายการ", 
  description = "คุณแน่ใจใช่หรือไม่ว่าต้องการดำเนินการนี้?",
  confirmText = "ยืนยัน",
  cancelText = "ยกเลิก",
  icon: Icon = AlertCircle,
  variant = "warning" 
}) => {
  if (!isOpen) return null;

  const confirmBtnColor = variant === "danger" ? "bg-red-500 hover:bg-red-600" : "bg-[#f3a638] hover:bg-[#e6952e]";
  const iconBgColor = variant === "danger" ? "bg-red-50 text-red-500" : "bg-orange-50 text-[#f3a638]";
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return ReactDOM.createPortal(
    <div 
    onClick={handleOverlayClick}
    className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-sm rounded-4xl p-8 shadow-2xl animate-in zoom-in duration-300">
        <div className="flex flex-col items-center text-center">
          <div className={`w-16 h-16 ${iconBgColor} rounded-full flex items-center justify-center mb-4`}>
            <Icon size={32} />
          </div>
          
          <h3 className="text-xl font-black text-gray-800 mb-2">
            {title}
          </h3>
          <p className="text-gray-500 mb-8 font-medium">
            {description}
          </p>
          
          <div className="flex w-full gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3.5 rounded-2xl font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 py-3.5 rounded-2xl font-bold text-white transition-all active:scale-95 ${confirmBtnColor}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body // ส่งไปที่ body
  );
};