import React from 'react';
import { Filter as FilterIcon } from 'lucide-react';

const FilterButton = ({ onClick, activeCount }) => {
  return (
    <button 
      onClick={onClick}
      className="
        bg-[#F5A623] text-white font-bold rounded-xl shadow-md transition-all 
        hover:bg-[#e29528] flex items-center justify-center gap-2 relative
        /* ปรับระดับความกว้างและ Padding ตามขนาดจอ */
        w-full sm:w-auto px-4 sm:px-10 md:px-20 py-2
      "
    >
      <FilterIcon size={18} /> 
      {/* ซ่อนข้อความ Filter ในจอเล็กมากถ้าจำเป็น หรือคงไว้แต่ลด Padding */}
      <span>Filter</span>
      
      {activeCount > 0 && (
        <span className="bg-white text-[#F5A623] w-5 h-5 rounded-full text-xs flex items-center justify-center shrink-0">
          {activeCount}
        </span>
      )}
    </button>
  );
};

export default FilterButton;