import React, { useState, useEffect } from "react";
import { X } from "lucide-react";


const ChangeMeterModal = ({ isOpen, onClose, onSave, room, meterType }) => {
 const [formData, setFormData] = useState({
   oldMeterEnd: "",
   newMeterStart: "",
 });


 // Reset form เมื่อเปิด Modal ใหม่
 useEffect(() => {
   if (isOpen) {
     setFormData({
       oldMeterEnd: room?.oldMeterEnd || "",
       newMeterStart: room?.newMeterStart || "",
     });
   }
 }, [isOpen, room]);

 // ฟังก์ชัน Helper: ตรวจสอบ Regex (ให้พิมพ์ได้แค่ตัวเลขและจุดทศนิยม)
 const validateNumber = (val) => /^\d*\.?\d*$/.test(val);

 const handleChange = (e) => {
   const { name, value } = e.target;
   if (validateNumber(value)) {
     setFormData({ ...formData, [name]: value });
   }
 };

 const handleSubmit = () => {
   onSave(room.id, meterType, formData);
   onClose();
 };

 // เช็คคลิกพื้นหลังเพื่อปิด
 const handleBackdropClick = (e) => {
   if (e.target === e.currentTarget) onClose();
 };

 if (!isOpen) return null;


 // Background Modal
 const modalBgColor = meterType === "water" ? "bg-[#E0F2FE]" : "bg-[#FFF7ED]";


 const meterLabel = meterType === "water" ? "มิเตอร์น้ำ" : "มิเตอร์ไฟ";
 // กำหนดสีหัวข้อตามประเภทมิเตอร์ (Optional: เพื่อความสวยงามแยกประเภท)


 return (
   <div
     className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4"
     onClick={handleBackdropClick}
   >
<div className={`${modalBgColor} p-8 rounded-[40px] shadow-2xl w-full max-w-lg relative animate-in zoom-in duration-200`}>       
       {/* Header */}
       <div className="relative flex items-center justify-center mb-8">
         <h2 className="text-xl font-bold text-gray-800">
           เปลี่ยน<span className="text-gray-800">{meterLabel}</span> ห้อง {room?.roomId}
         </h2>
         <button
           onClick={onClose}
           className="absolute right-0 p-1 hover:bg-black/5 rounded-full text-gray-800 hover:text-gray-600 transition-colors"
         >
           <X size={24} />
         </button>
       </div>


       {/* Content Body */}
       <div className="space-y-6 mb-8 px-2">
        
         {/* Input 1: เลขเก่า */}
         <div className="flex items-center justify-between gap-4">
           <label className=" font-bold text-gray-700 w-1/2 text-right">
             ตัวเลขมิเตอร์ ล่าสุด(ตัวเก่า)
           </label>
           <input
             type="text"
             inputMode="decimal"
             name="oldMeterEnd"
             value={formData.oldMeterEnd}
             onChange={handleChange}
             className="w-1/2 p-2 bg-gray-50 border border-transparent focus:bg-white focus:border-[#f3a638] rounded-xl outline-none text-center font-bold text-lg shadow-sm transition-all text-gray-700"
           />
         </div>


         {/* Input 2: เลขใหม่ */}
         <div className="flex items-center justify-between gap-4">
           <label className="font-bold text-gray-700 w-1/2 text-right">
             ตัวเลขมิเตอร์ เริ่มต้น(ตัวใหม่)
           </label>
           <input
             type="text"
             inputMode="decimal"
             name="newMeterStart"
             value={formData.newMeterStart}
             onChange={handleChange}
             className="w-1/2 p-2 bg-gray-50 border border-transparent focus:bg-white focus:border-[#46d39a] rounded-xl outline-none text-center font-bold text-lg shadow-sm transition-all text-gray-700"
           />
         </div>
       </div>

       {/* Footer Buttons */}
       <div className="flex gap-4">
         <button
           onClick={onClose}
           className="flex-1 py-2.5 bg-[#FF6B6B] hover:bg-[#e55a5a] text-white rounded-2xl font-bold shadow-md transition-all active:scale-95"
         >
           ยกเลิก
         </button>
         <button
           onClick={handleSubmit}
           className="flex-1 py-2.5 bg-[#46d39a] hover:bg-[#3fba89] text-white rounded-2xl font-bold shadow-md transition-all active:scale-95"
         >
           บันทึก
         </button>
       </div>

     </div>
   </div>
 );
};

export default ChangeMeterModal;