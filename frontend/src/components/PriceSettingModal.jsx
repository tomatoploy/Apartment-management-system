import React, { useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';

const PriceSettingModal = ({ title, type = "simple", color, onClose, onSave }) => {
  // สำหรับโหมด simple (Water, Electric, Room)
  const [price, setPrice] = useState("");
  
  // สำหรับโหมด list (Services)
  const [services, setServices] = useState([{ id: 1, name: "", value: "" }]);

  const addService = () => {
    setServices([...services, { id: Date.now(), name: "", value: "" }]);
  };

  const removeService = (id) => {
    if (services.length > 1) {
      setServices(services.filter(s => s.id !== id));
    }
  };

  const updateService = (id, field, val) => {
    setServices(services.map(s => s.id === id ? { ...s, [field]: val } : s));
  };

  // ฟังก์ชันสำหรับเช็คการคลิกพื้นหลัง
  const handleBackdropClick = (e) => {
    // ถ้าจุดที่คลิกคือตัวฉากหลัง (e.target) ไม่ใช่ตัวกล่องข้างใน ให้สั่งปิด
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4"
    onClick={handleBackdropClick}>
      <div className={`${color} p-8 rounded-[40px] shadow-2xl w-full max-w-lg relative animate-in zoom-in duration-200`}>
        
        <div className="relative flex items-center justify-center mb-8"
        onClick={(e) => e.stopPropagation()}>
          <h2 className="text-xl font-bold text-gray-800">{title}</h2>
          <button onClick={onClose} className="absolute right-0 p-1 hover:bg-black/5 rounded-full">
            <X size={24} />
          </button>
        </div>

        {/* ส่วนเนื้อหาแบ่งตาม Type */}
        <div className="mb-10 max-h-[40vh] overflow-y-auto px-2">
          {type === "simple" ? (
    <div className="flex items-center justify-center gap-3">
      {/* เช็คหัวข้อ: ถ้ามีคำว่า "เช่าห้อง" ให้แสดง ราคา/เดือน ถ้าไม่ใช่ให้แสดง ราคา/หน่วย */}
      <span className="font-bold text-gray-700">
        {title.includes("เช่าห้อง") ? "ราคา/เดือน:" : "ราคา/หน่วย:"} 
      </span>
              <input 
                type="number"
                step="any"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-28 p-2 bg-white rounded-xl border-none outline-none text-center font-bold shadow-sm"
              />
              <span className="font-bold text-gray-700">บาท</span>
            </div>
          ) : (
            /* โหมดรายการ: ค่าบริการอื่นๆ (เพิ่ม/ลดได้) */
            <div className="space-y-4">
              {services.map((service) => (
                <div key={service.id} className="flex items-center gap-2">
                  <input 
                    type="text"
                    placeholder="ชื่อบริการ (เช่น อินเทอร์เน็ต)"
                    value={service.name}
                    onChange={(e) => updateService(service.id, 'name', e.target.value)}
                    className="flex-1 p-2 bg-white text-gray-500 rounded-lg border-none outline-none font-medium shadow-sm"
                  />
                  <input 
                    type="number"
                    // placeholder="100"
                    value={service.value}
                    onChange={(e) => updateService(service.id, 'value', e.target.value)}
                    className="w-20 p-2 bg-white rounded-lg border-none outline-none text-center font-bold shadow-sm"
                  />
                  <span className="font-bold text-gray-700 text-sm">บาท</span>
                  
                  {/* ปุ่มจัดการรายการ */}
                  <div className="flex gap-1">
                    <button onClick={addService} className="p-1.5 bg-orange-400 text-white rounded-md hover:bg-orange-500">
                      <Plus size={16} strokeWidth={3} />
                    </button>
                    <button onClick={() => removeService(service.id)} className="p-1.5 bg-red-500 text-white rounded-md hover:bg-red-600">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ปุ่มกดยืนยันด้านล่าง */}
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

