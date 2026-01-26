import React from 'react';
import { X } from 'lucide-react';

const FilterModal = ({ 
  isOpen, 
  onClose, 
  title, 
  onClear, 
  onConfirm, 
  children,
  maxWidth = "max-w-xl" // สามารถปรับขนาดความกว้างได้ตามเนื้อหา
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className={`bg-white p-8 rounded-[40px] shadow-2xl w-full ${maxWidth} animate-in zoom-in duration-200`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header: หัวข้ออยู่ตรงกลาง ปุ่มปิดอยู่ขวาสุด */}
        <div className="relative flex items-center justify-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
          <button
            onClick={onClose}
            className="absolute p-2 right-0 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={24} strokeWidth={3} />
          </button>
        </div>

        {/* Content Section: รับเนื้อหาจากภายนอกผ่าน children */}
        <div className="mb-6">
          {children}
        </div>

        {/* Footer Actions: ปุ่มล้างทั้งหมด และปุ่มตกลง */}
        <div className="flex gap-4 pt-4 border-t">
          <button
            onClick={onClear}
            className="flex-1 py-4 text-gray-400 font-bold hover:bg-gray-50 rounded-2xl transition-all"
          >
            ล้างทั้งหมด
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-[#f3a638] text-white py-4 rounded-2xl font-bold shadow-lg shadow-orange-100 hover:brightness-95 transition-all"
          >
            ตกลง
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterModal;