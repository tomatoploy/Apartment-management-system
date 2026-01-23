
import React from 'react';
import { Filter as FilterIcon } from 'lucide-react';

const FilterButton = ({ onClick, activeCount }) => {
  return (
    <button 
      onClick={onClick}
      className="bg-[#F5A623] text-white px-20 py-2 rounded-xl font-bold hover:bg-[#e29528] flex items-center gap-2 shadow-md transition-all relative"
    >
      <FilterIcon size={18} /> 
      Filter
      
      {/* แสดงตัวเลขเฉพาะเมื่อมีจำนวนมากกว่า 0 */}
      {activeCount > 0 && (
        <span className="bg-white text-[#F5A623] w-5 h-5 rounded-full text-xs flex items-center justify-center">
          {activeCount}
        </span>
      )}
    </button>
  );
};

export default FilterButton;
