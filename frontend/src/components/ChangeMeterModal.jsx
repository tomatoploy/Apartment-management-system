import React, { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";

const ChangeMeterModal = ({ isOpen, onClose, onSave, room, meterType }) => {
 const [formData, setFormData] = useState({
   oldMeterEnd: "",
   newMeterStart: "",
 });

 const [isSubmitting, setIsSubmitting] = useState(false);

 // Reset form เมื่อเปิด Modal ใหม่
  useEffect(() => {
    if (!isOpen || !room) return;

    setIsSubmitting(false);

    // ดึงค่าจาก room มาใส่ในฟอร์ม (Reset Form)
    if (meterType === "electricity") {
      const oldVal = room.changeElectricityMeterEnd;
      const newVal = room.changeElectricityMeterStart;

      setFormData({
        oldMeterEnd: oldVal ?? "", // ถ้าเป็น null/undefined ให้เป็น ""
        newMeterStart: newVal ?? "",
      });
    } else {
      const oldVal = room.changeWaterMeterEnd;
      const newVal = room.changeWaterMeterStart;

      setFormData({
        oldMeterEnd: oldVal ?? "",
        newMeterStart: newVal ?? "",
      });
    }
  }, [isOpen, room, meterType]);

 // ฟังก์ชัน Helper: ตรวจสอบ Regex (ให้พิมพ์ได้แค่ตัวเลขและจุดทศนิยม)
 const validateNumber = (val) => /^\d*\.?\d*$/.test(val);

 const handleChange = (e) => {
   const { name, value } = e.target;
   if (validateNumber(value)) {
     setFormData({ ...formData, [name]: value });
   }
 };

  const handleSubmit = async () => {
    const oldVal = formData.oldMeterEnd === "" ? null : Number(formData.oldMeterEnd);
    const newVal = formData.newMeterStart === "" ? null : Number(formData.newMeterStart);

    if (oldVal != null && oldVal < 0) return;
    if (newVal != null && newVal < 0) return;

    // ✅ เปิด Loading
    setIsSubmitting(true);

    // ส่งข้อมูลกลับไปให้ Meter.jsx (ซึ่งตอนนี้เป็น async แล้ว)
    await onSave(room.roomId, meterType, {
      oldMeterEnd: oldVal,
      newMeterStart: newVal,
    });
    
    // ไม่ต้องสั่ง onClose() ที่นี่ เพราะ Meter.jsx จะสั่งปิดเมื่อเสร็จ
    setIsSubmitting(false);
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

const isInvalid = formData.oldMeterEnd === "" && formData.newMeterStart === "";

 return (
   <div
     className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4"
     onClick={handleBackdropClick}
   >
<div className={`${modalBgColor} p-8 rounded-[40px] shadow-2xl w-full max-w-lg relative animate-in zoom-in duration-200`}>       
       {/* Header */}
       <div className="relative flex items-center justify-center mb-8">
         <h2 className="text-xl font-bold text-gray-800">
           เปลี่ยน<span className="text-gray-800">{meterLabel}</span> ห้อง {room?.roomNumber}
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
             value={formData.oldMeterEnd ?? ""}
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
             value={formData.newMeterStart ?? ""}
             onChange={handleChange}
             className="w-1/2 p-2 bg-gray-50 border border-transparent focus:bg-white focus:border-[#46d39a] rounded-xl outline-none text-center font-bold text-lg shadow-sm transition-all text-gray-700"
           />
         </div>
       </div>

       {/* Footer Buttons */}
       {/* Footer Buttons */}
        <div className="flex gap-4 h-12"> {/* ✅ กำหนดความสูง h-12 ให้ Container เพื่อล็อคความสูง */}
          
          <button
            onClick={onClose}
            disabled={isSubmitting}
            // ❌ ลบ active:scale-95 ออก เพื่อไม่ให้ปุ่มหด
            className="flex-1 rounded-2xl font-bold shadow-md text-white bg-[#FF6B6B] hover:bg-[#e55a5a] disabled:opacity-50 transition-colors"
          >
            ยกเลิก
          </button>

          <button
            onClick={handleSubmit}
            disabled={isInvalid || isSubmitting}
            // ❌ ลบ active:scale-95 ออก
            // ✅ เพิ่ม relative เพื่อให้ icon หมุนๆ ลอยอยู่ตรงกลางได้โดยไม่ดัน text
            className="flex-1 relative rounded-2xl font-bold shadow-md text-white bg-[#46d39a] hover:bg-[#3fba89] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {/* เทคนิค: 
               1. ใส่ text "บันทึก" ไว้ตลอดเวลาเพื่อให้ปุ่มมีความกว้างเท่าเดิมเสมอ
               2. ถ้า load อยู่ ให้ซ่อน text ด้วย opacity-0 (แต่พื้นที่ยังอยู่)
            */}
            <span className={`transition-opacity ${isSubmitting ? "opacity-0" : "opacity-100"}`}>
              บันทึก
            </span>

            {/* เทคนิค:
               3. เอาตัวหมุน (Loader) มาวางซ้อนทับตรงกลาง (absolute inset-0)
            */}
            {isSubmitting && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="animate-spin" size={20} />
              </div>
            )}
          </button>

        </div>

     </div>
   </div>
 );
};

export default ChangeMeterModal;