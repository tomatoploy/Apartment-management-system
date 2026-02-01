import React from 'react';
import { Search as SearchIcon } from 'lucide-react';

const SearchBar = ({ value, onChange, placeholder = "search" }) => (
  <div className="relative w-full max-w-xl flex group">
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className="w-full py-2.5 px-6 bg-white rounded-l-xl outline-none text-gray-600 border-y border-l border-gray-300  transition-all"
    />
    <button className="bg-[#f3a638] text-white px-6 py-2.5 rounded-r-xl hover:bg-[#e29528] transition-all">
      <SearchIcon size={22} />
    </button>
  </div>
);

export default SearchBar;