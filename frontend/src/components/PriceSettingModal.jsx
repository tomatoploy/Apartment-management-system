import React, { useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';

const PriceSettingModal = ({ title, type = "simple", color, onClose, onSave }) => {
  const [price, setPrice] = useState("");
  const [services, setServices] = useState([{ id: 1, name: "", value: "" }]);

  // ฟังก์ชัน ตรวจสอบ Regex (ให้พิมพ์ได้แค่ตัวเลขและจุดทศนิยม)
  const validateNumber = (val, callback) => {
    if (/^\d*\.?\d*$/.test(val)) callback(val);
  };

  const updateService = (id, field, val) => {
    setServices(prev => prev.map(s => s.id === id ? { ...s, [field]: val } : s));
  };

  return (
    <div 
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()} 
    >
      <div className={`${color} p-8 rounded-[40px] shadow-2xl w-full max-w-lg relative animate-in zoom-in duration-200`}>
        
        {/* Header */}
        <div className="relative flex items-center justify-center mb-8">
          <h2 className="text-xl font-bold text-gray-800">{title}</h2>
          <button onClick={onClose} className="absolute right-0 p-1 hover:bg-black/5 rounded-full">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="mb-10 max-h-[40vh] overflow-y-auto px-2">
          {type === "simple" ? (
            // --- Simple Mode ---
            <div className="flex items-center justify-center gap-3">
              <span className="font-bold text-gray-700">
                {title.includes("เช่าห้อง") ? "ราคา/เดือน:" : "ราคา/หน่วย:"} 
              </span>
              <input 
                type="text"             
                inputMode="decimal"     
                value={price}
                onChange={(e) => validateNumber(e.target.value, setPrice)}
                className="w-28 p-2 bg-white rounded-xl border-none outline-none text-center font-bold shadow-sm"
              />
              <span className="font-bold text-gray-700">บาท</span>
            </div>
          ) : (
            // --- List Mode ---
            <div className="space-y-4">
              {services.map((s) => (
                <div key={s.id} className="flex items-center gap-2">
                  <input 
                    type="text"
                    placeholder="ชื่อบริการ (เช่น อินเทอร์เน็ต)"
                    value={s.name}
                    onChange={(e) => updateService(s.id, 'name', e.target.value)}
                    className="flex-1 p-2 bg-white text-gray-500 rounded-lg border-none outline-none font-medium shadow-sm"
                  />
                  <input 
                    type="text"         
                    inputMode="decimal" 
                    value={s.value}
                    onChange={(e) => validateNumber(e.target.value, (val) => updateService(s.id, 'value', val))}
                    className="w-20 p-2 bg-white rounded-lg border-none outline-none text-center font-bold shadow-sm"
                  />
                  <span className="font-bold text-gray-700 text-sm">บาท</span>
                  
                  <div className="flex gap-1">
                    <button 
                      onClick={() => setServices([...services, { id: Date.now(), name: "", value: "" }])} 
                      className="p-1.5 bg-orange-400 text-white rounded-md hover:bg-orange-500"
                    >
                      <Plus size={16} strokeWidth={3} />
                    </button>
                    <button 
                      onClick={() => services.length > 1 && setServices(services.filter(item => item.id !== s.id))} 
                      className="p-1.5 bg-red-500 text-white rounded-md hover:bg-red-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="flex gap-4">
          <button onClick={onClose} className="flex-1 py-2.5 bg-[#FF6B6B] hover:bg-[#e55a5a] text-white rounded-2xl font-bold shadow-md">ยกเลิก</button>
          <button 
            onClick={() => onSave(type === "simple" ? price : services)} 
            className="flex-1 py-2.5 bg-[#46d39a] hover:bg-[#3fba89] text-white rounded-2xl font-bold shadow-md"
          >
            บันทึก
          </button>
        </div>
      </div>
    </div>
  );
};

export default PriceSettingModal;