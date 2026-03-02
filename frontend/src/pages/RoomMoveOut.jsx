import React, { useState, useMemo } from "react";
import { 
  Inbox, ChevronDown, Download, Send, 
  Plus, Pencil, Trash2, Printer, CheckCircle 
} from "lucide-react";
import { OrangeButton, WhiteButton, SaveButton } from "../components/ActionButtons";
import { FileText } from "lucide-react"; // อย่าลืม import FileText
import RoomHeader from "../components/RoomHeader";
import { toThaiDate } from "../components/DateController";

/* ================= Mock Data ================= */
const mockContract = {
  contractId: "CNT-2025-001",
  startDate: "2025-01-01",
  endDate: "2025-03-31",
  status: "หมดสัญญาแล้ว"
};


/* ================== Sub-Components (Steps) ================== */

// ส่วนหัวแจ้งเตือน (เหลือง/ชมพู) ตามรูป 1, 6, 7
const StepNotice = ({ mode, currentStep }) => {
  const isAbsconded = mode === "absconded";
  const notices = {
    1: isAbsconded ? "บิลค่าเช่าค้างชำระ" : "กรุณาเคลียร์บิลค่าเช่าค้างชำระ ด้วยการชำระเงินหรือหักจากเงินประกัน",
    2: "กรุณาตรวจสอบทรัพย์สินที่เสียหาย",
    4: "กรอกรายการเงินประกัน หากมีการคืนเงิน",
  };

  if (!notices[currentStep]) return null;

  return (
    <div className={`p-3 rounded-xl mb-4 font-bold text-sm md:text-base ${
      isAbsconded ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"
    }`}>
      {notices[currentStep]}
    </div>
  );
};

// ส่วนแสดงสถานะว่าง (Empty State) ตามรูป 1, 2
const EmptyState = ({ message }) => (
  <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-gray-200 rounded-[30px] mt-2">
    <p className="text-gray-400 font-bold text-lg">{message}</p>
  </div>
);

/* ================== Main Manager Component ================== */
const CheckoutManager = () => {
  const [mode, setMode] = useState("normal"); // 'normal' หรือ 'absconded'
  const [currentStep, setCurrentStep] = useState(1);
  
  // Mock Data (สามารถเชื่อมต่อกับ Global State หรือ API ได้)
  const [billItems, setBillItems] = useState([]); // เริ่มต้นที่ไม่มีข้อมูลตามรูป 1
  const [assets, setAssets] = useState([]); // รูป 2

  const steps = [
    { id: 1, label: "1. เคลียร์บิลค้างชำระ" },
    { id: 2, label: "2. ตรวจสอบทรัพย์สิน" },
    { id: 3, label: "3. ออกใบเสร็จย้ายออก" },
    { id: 4, label: "4. กรอกรายการคืนเงินประกัน" },
    { id: 5, label: "สรุป" },
  ];

  return (
    <div className="min-h-screen pb-15">
      {/* 1. ส่วนหัวห้อง (RoomHeader) */}
      <RoomHeader roomNumber={roomNumber} />

      <div className="max-w-4xl mx-auto px-4 mt-6">
        
        {/* --- 2. ส่วนรายละเอียดสัญญา (เพิ่มตรงนี้) --- */}
        <div className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-sm mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex gap-4">
            <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-800 shrink-0">
              <FileText size={24} />
            </div>
            <div>
              <h3 className="font-black text-gray-800 flex items-center gap-2">
                รายละเอียดสัญญาเช่า
              </h3>
              <div className="text-sm text-gray-500 mt-1 space-y-0.5 font-bold">
                <p>วันที่ทำสัญญา &nbsp;&nbsp;&nbsp;&nbsp;: {toThaiDate(mockContract.startDate)}</p>
                <p>วันที่สิ้นสุดสัญญา : {toThaiDate(mockContract.endDate)}</p>
              </div>
            </div>
          </div>
          <span className="px-4 py-1.5 bg-red-100 text-red-500 text-xs font-black rounded-full uppercase">
            {mockContract.status}
          </span>
        </div>
      {/* 1. Toggle Mode (ผู้เช่าย้ายออก / ผู้เช่าหนี) */}
      <div className="flex bg-gray-100 rounded-full p-1.5 mb-6 max-w-2xl mx-auto shadow-sm">
        <button
          onClick={() => setMode("normal")}
          className={`flex-1 py-2.5 rounded-full font-black transition-all duration-300 ${
            mode === "normal" ? "bg-[#f3a638] text-white shadow-md" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          ผู้เช่าย้ายออก
        </button>
        <button
          onClick={() => setMode("absconded")}
          className={`flex-1 py-2.5 rounded-full font-black transition-all duration-300 ${
            mode === "absconded" ? "bg-[#d9534f] text-white shadow-md" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          ผู้เช่าหนี
        </button>
      </div>

      {/* 2. Step Navigation (รูป 1, 6) */}
      <p className="text-center text-gray-700 font-bold mb-4">
        หมายเหตุ: {mode === "normal" ? "ขั้นตอนการย้ายออกจะมี 4 ขั้นตอน ได้แก่" : "กรณีผู้เช่าหนีจะทำการบันทึกหนี้สูญและไม่ทำการออกบิลใด ๆ"}
      </p>
      <div className="flex justify-center flex-wrap gap-2 mb-8">
        {steps.map((step) => (
          <button
            key={step.id}
            onClick={() => setCurrentStep(step.id)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              currentStep === step.id
                ? (mode === "absconded" ? "bg-purple-100 text-purple-600" : "bg-blue-100 text-blue-600")
                : "bg-gray-100 text-gray-400 hover:bg-gray-200"
            }`}
          >
            {step.label}
          </button>
        ))}
      </div>

      {/* 3. Main Content Container (เส้นขอบสีฟ้าตามรูป) */}
      <div className="border-[1.5px] border-blue-400 rounded-[40px] p-6 md:p-10 relative shadow-sm">
        
        {/* Dropdown Icon (ขวาบน) */}
        <ChevronDown className="absolute right-8 top-8 text-gray-800" size={24} />

        {/* Step Title & Notice */}
        <div className="flex items-center gap-4 mb-6">
          <span className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg ${
            mode === "absconded" ? "bg-purple-100 text-purple-600" : "bg-blue-100 text-blue-600"
          }`}>
            {currentStep}
          </span>
          <h2 className="text-xl font-black text-gray-800">
            {steps.find(s => s.id === currentStep)?.label.split(". ")[1] || "สรุปการย้ายออก"}
          </h2>
        </div>

        <StepNotice mode={mode} currentStep={currentStep} />

        {/* 4. Render Dynamic Content Based on Step */}
        <div className="min-h-[300px]">
          {currentStep === 1 && (
            billItems.length === 0 ? <EmptyState message="ไม่มีข้อมูลบิลค้างชำระ" /> : <div>{/* Table Component */}</div>
          )}

          {currentStep === 2 && (
            assets.length === 0 ? <EmptyState message="ไม่มีข้อมูลรายการทรัพย์สิน" /> : <div>{/* Asset List */}</div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              {/* ตารางแสดงใบเสร็จย้ายออก (รูป 3) */}
              <div className="overflow-hidden rounded-2xl border border-gray-800">
                <table className="w-full text-sm md:text-base">
                  <thead className="bg-gray-200 border-b border-gray-800">
                    <tr>
                      <th className="p-3 border-r border-gray-800 w-16"></th>
                      <th className="p-3 border-r border-gray-800 text-left">รายการ</th>
                      <th className="p-3 border-r border-gray-800 w-20">แก้ไข</th>
                      <th className="p-3 border-r border-gray-800 w-20">ลบ</th>
                      <th className="p-3 text-right">จำนวนเงิน(บาท)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    <tr>
                      <td className="p-3 text-center border-r border-gray-800">1.</td>
                      <td className="p-3 border-r border-gray-800">ค่าไฟฟ้า เดือนธันวาคม 2024...</td>
                      <td className="p-3 border-r border-gray-800 text-center"><button className="p-1 bg-orange-400 rounded text-white"><Pencil size={14}/></button></td>
                      <td className="p-3 border-r border-gray-800 text-center"><button className="p-1 bg-red-400 rounded text-white"><Trash2 size={14}/></button></td>
                      <td className="p-3 text-right">500</td>
                    </tr>
                    <tr className="bg-gray-100 font-bold">
                      <td colSpan={4} className="p-3 text-center border-r border-gray-800 uppercase tracking-widest">รวมทั้งหมด</td>
                      <td className="p-3 text-right">1,050</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="flex flex-wrap justify-center gap-3">
                 <SaveButton label="บันทึก" className="!bg-[#a8d5ba] !border-none" />
                 <OrangeButton label="บันทึกเป็น PDF" icon={Download} />
                 <OrangeButton label="ส่งบิล" icon={Send} />
                 <WhiteButton label="เพิ่มรายการ+" className="!bg-blue-100 !text-blue-600 !border-none" />
                 <WhiteButton label="เพิ่มส่วนลด+" className="!bg-blue-100 !text-blue-600 !border-none" />
              </div>
            </div>
          )}

          {currentStep === 5 && (
            <div className="space-y-6">
              <div className={`rounded-xl overflow-hidden border ${mode === "absconded" ? "border-red-400" : "border-[#f3a638]"}`}>
                <div className={`p-3 text-center font-bold text-lg ${mode === "absconded" ? "bg-red-400 text-white" : "bg-[#f3a638] text-white"}`}>
                  สรุปการย้ายออก
                </div>
                <div className="p-6 space-y-4 bg-gray-50/50">
                  <div className="flex gap-4 items-center">
                    <span className="font-bold shrink-0">วันที่ย้ายออก</span>
                    <div className="flex-1 bg-orange-100 h-10 rounded-xl border border-orange-200"></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <p className="font-bold mb-2">รายการชำระเงิน</p>
                      <div className="border-2 border-dotted border-gray-300 rounded-2xl p-8 text-center text-gray-500">
                        ไม่มีรายการชำระบิล
                      </div>
                    </div>
                    <div>
                      <p className="font-bold mb-2">รายการหักจากเงินประกัน</p>
                      <div className="border-2 border-dotted border-gray-300 rounded-2xl p-4 space-y-2">
                         <div className="flex justify-between text-sm"><span>ค่าไฟฟ้า...</span><span>500 บาท</span></div>
                         <div className="flex justify-between text-sm"><span>ค่าน้ำ...</span><span>50 บาท</span></div>
                         <div className="flex justify-between text-sm text-red-500"><span>ส่วนลด</span><span>-100 บาท</span></div>
                         <div className="border-t border-gray-400 pt-2 flex justify-between font-black text-lg">
                           <span>สรุปยอดชำระ</span><span>1,050 บาท</span>
                         </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className={`p-4 text-center font-black text-xl ${mode === "absconded" ? "bg-red-100 text-red-700" : "bg-orange-100 text-gray-800"}`}>
                  {mode === "absconded" ? "หอพักได้รับเงินประกัน 0 บาท" : "ยอดเงินประกันคืนผู้เช่า 2,450 บาท"}
                </div>
              </div>
              <div className="flex justify-center gap-4">
                 <OrangeButton label="พิมพ์ใบย้ายออก" />
                 <WhiteButton label="เคลียร์บิลค้างชำระและย้ายออก" className="!bg-blue-200 !text-blue-700 !border-none" />
              </div>
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
};

export default CheckoutManager;