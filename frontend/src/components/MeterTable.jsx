import { useState, useEffect } from "react";
import { Settings } from "lucide-react";

const MeterTable = ({
 rooms,
 meterType,
 onInputChange,
 onOpenChangeMeterModal,
 prevMonthLabel,
 currentMonthLabel
}) => {
 // กำหนดสีหัวตารางตามประเภท (ฟ้า=น้ำ, ส้ม=ไฟ)
 const headerBg = meterType === "electricity" ? "bg-[#f3a638]" : "bg-[#009CDE]";


 // ✅ ฟังก์ชันตรวจสอบตัวเลข (อนุญาตแค่ 0-9 และจุดทศนิยม 1 จุด)
 const validateNumberInput = (value) => {
   // Regex: ^ เริ่มต้น, \d* ตัวเลขกี่ตัวก็ได้, \.? จุด(มีหรือไม่มีก็ได้), \d* ตัวเลขหลังจุด, $ จบ
   const regex = /^\d*\.?\d*$/;
   return regex.test(value);
 };

const getMeterDigits = (...values) => {
  const nums = values
    .filter(v => v != null)
    .map(v => Math.floor(Number(v)).toString().length);

  return nums.length > 0 ? Math.max(...nums) : 4; // fallback 4 หลัก
};

const getMaxMeter = (...values) => {
  const digits = getMeterDigits(...values);
  return Math.pow(10, digits);
};

const diffMeter = (end, start) => {
  if (end == null || start == null) return null;

  const e = Number(end);
  const s = Number(start);
  if (Number.isNaN(e) || Number.isNaN(s)) return null;

  const MAX_METER = getMaxMeter(e, s);

  return e >= s
    ? e - s
    : e + (MAX_METER - s);
};

const calculateUsed = (room, meterType) => {
  const prev = meterType === "electricity" ? room.prevElec : room.prevWater;
  const curr = meterType === "electricity" ? room.currElec : room.currWater;

  const oldEnd = meterType === "electricity"
    ? room.changeElectricityMeterEnd
    : room.changeWaterMeterEnd;

  const newStart = meterType === "electricity"
    ? room.changeElectricityMeterStart
    : room.changeWaterMeterStart;

  // ✅ เพิ่ม: เช็คให้แน่ใจว่าเป็นตัวเลขจริงๆ ถ้าเป็นค่าว่าง String "" ให้ถือเป็น null
  const parseNum = (v) => (v === "" || v == null ? null : Number(v));

  const p = parseNum(prev);
  const c = parseNum(curr);
  const oe = parseNum(oldEnd);
  const ns = parseNum(newStart);

  // ❌ ไม่มีเลขเดือนก่อน → ไม่คิด
  if (p == null) return null;

  // ❌ ยังไม่กรอกอะไรเลย (ถ้า c เป็น null ต้อง return null ทันที ไม่ให้ไปคิดเป็น 0)
  if (oe == null && c == null) return null;

  // 🔵 เปลี่ยนมิเตอร์ แต่ยังไม่กรอกตัวใหม่
  if (oe != null && c == null) {
    return diffMeter(oe, p);
  }

  // 🔵 เปลี่ยนมิเตอร์ครบ
  if (oe != null && ns != null && c != null) {
    const usedOld = diffMeter(oe, p);
    const usedNew = diffMeter(c, ns);
    return usedOld + usedNew;
  }

  // 🟢 ไม่เปลี่ยนมิเตอร์
  if (c != null) {
    return diffMeter(c, p);
  }

  return null;
};

 return (
   <div className="overflow-hidden rounded-3xl border border-gray-300 shadow-sm bg-white">
     <div className="overflow-x-auto">
       <table className="w-full text-center border-collapse">
         <thead>
           <tr className="text-md font-bold text-white">
             {/* ห้อง & ตั้งค่า */}
             <th className={`p-4 w-24 border-r border-white/20 ${headerBg}`}>ห้อง</th>
            
             {/* เลขเดือนก่อนหน้า */}
             <th className={`p-4 border-r border-white/20 ${headerBg} min-w-35`}>
               <div className="flex flex-col">
                 <span className="  text-sm">เดือนก่อนหน้า</span>
                 <span>{prevMonthLabel}</span>
               </div>
             </th>


             {/* เลขเดือนนี้ (ช่องกรอก) */}
             <th className={`p-4 border-r border-white/20 ${headerBg} min-w-35`}>
               <div className="flex flex-col">
                 <span className="  text-sm">เดือนปัจจุบัน</span>
                 <span>{currentMonthLabel}</span>
               </div>
             </th>


             {/* หน่วยที่ใช้ */}
             <th className={`p-4 w-28 ${headerBg}`}>
               หน่วยที่ใช้
             </th>
           </tr>
         </thead>
         <tbody className="divide-y divide-gray-300">
           {rooms.map((room) => {
              const isChangedMeter = meterType === "electricity"
                ? room.changeElectricityMeterEnd != null || room.changeElectricityMeterStart != null
                : room.changeWaterMeterEnd != null || room.changeWaterMeterStart != null;
              
              const prevVal = meterType === "electricity"
                ? room.prevElec
                : room.prevWater;

              const currVal = meterType === "electricity"
                ? room.currElec
                : room.currWater;

              const fieldName = meterType === "electricity"
                ? "currElec"
                : "currWater";

              const usedVal = calculateUsed(room, meterType);

              return (
               <tr key={`${room.roomId}-${room.meterId ?? "new"}-${meterType}`}className="hover:bg-orange-50/30 transition-colors group">
                 {/* ห้อง + ปุ่มตั้งค่า */}
                 <td className="p-3 border-r border-gray-300 font-bold text-gray-700 relative">
                   {room.roomNumber}
                   <button
                    onClick={() => onOpenChangeMeterModal(room, meterType)}
                    className="absolute left-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1.5 text-gray-500 hover:text-[#f3a638] transition-all"
                    title="เปลี่ยนมิเตอร์"
                  >
                    <Settings size={14} />
                  </button>
                 </td>
                
                 {/* เลขเดิม */}
                 <td className="p-3 border-r border-gray-300 text-gray-700 bg-gray-50/50">
                   {prevVal}
                 </td>


                 {/* ช่องกรอกข้อมูล */}
                 <td className="p-2 border-r border-gray-300">
                   <input
                     type="text"            //คุม Regex เอง เขียนฟังก์ชันเช็ค
                     inputMode="decimal"
                     value={currVal ?? ""}
                     onChange={(e) => {
                       const val = e.target.value;
                       // ตรวจสอบว่าค่าที่พิมพ์มาตรงตามเงื่อนไขหรือไม่
                       if (val === "" || validateNumberInput(val)) {
                         onInputChange(
                            room.roomId,
                            fieldName,
                            val === "" ? null : Number(val)
                          );
                       }
                     }}                     
                     className="w-full p-2.5 text-center bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#f3a638] focus:bg-white focus:ring-2 focus:ring-[#f3a638]/20 transition-all font-bold text-gray-800 placeholder:text-gray-300"
                     placeholder="0"
                   />
                 </td>

                 {/* ผลลัพธ์ */}
                 <td className={`p-3 font-bold ${
                    meterType === "electricity" ? "text-orange-700" : "text-blue-700"
                  }`}>
                    {usedVal == null ? "" : usedVal}
                  </td>
               </tr>
             );
           })}
         </tbody>
       </table>
     </div>
     {rooms.length === 0 && (
       <div className="p-10 text-center text-gray-400 font-bold">ไม่พบข้อมูลห้องพัก</div>
     )}
   </div>
 );
};

export default MeterTable;