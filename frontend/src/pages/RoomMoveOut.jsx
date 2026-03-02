import React, { useState, useMemo } from "react";
import {
  Inbox,
  ChevronDown,
  Download,
  Send,
  Plus,
  Pencil,
  Trash2,
  Printer,
  CheckCircle,
} from "lucide-react";
import {
  OrangeButton,
  WhiteButton,
  SaveButton,
} from "../components/ActionButtons";
import { FileText } from "lucide-react";
import RoomHeader from "../components/RoomHeader";
import { toThaiDate } from "../components/DateController";
import { useParams, useNavigate } from "react-router-dom";
import { toThaiMonth } from "../components/DateController";

/* ================= Mock Data ================= */
const mockContract = {
  contractId: "CNT-2025-001",
  startDate: "2025-01-01",
  endDate: "2025-03-31",
  status: "expired",
};

/* ================== Sub-Components (Steps) ================== */

// ส่วนข้อความแจ้งเตือนตาม step ต่างๆ
const StepNotice = ({ mode, currentStep }) => {
  //absconded=ผู้เช่าหนี, normal=ผู้เช่าย้ายออก
  const isAbsconded = mode === "absconded";
  const notices = {
    1: isAbsconded
      ? "บิลค่าเช่าค้างชำระ"
      : "กรุณาเคลียร์บิลค่าเช่าค้างชำระ ด้วยการชำระเงินหรือหักจากเงินประกัน",
    2: "กรุณาตรวจสอบทรัพย์สินที่เสียหาย",
    4: "กรอกรายการเงินประกัน หากมีการคืนเงิน",
  };

  if (!notices[currentStep]) return null;

  return (
    <div
      className={`p-2 rounded-xl mb-4 font-bold text-sm  px-4 ${
        isAbsconded
          ? "bg-red-100 text-red-700"
          : "bg-orange-100 text-orange-700"
      }`}
    >
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
  const { roomNumber } = useParams();
  const [mode, setMode] = useState("normal"); // 'normal' หรือ 'absconded'
  const [currentStep, setCurrentStep] = useState(1);

  // Mock Data (สามารถเชื่อมต่อกับ Global State หรือ API ได้)
  //const [billItems, setBillItems] = useState([]);
  const [assets, setAssets] = useState([]);
  const billItems = [
    {
      period: "2024-12",
      totalAmount: 5500,
      details: [
        { label: "ค่าเช่าห้อง", amount: 5000 },
        { label: "ค่าน้ำ", amount: 100 },
        { label: "ค่าไฟ", amount: 400 },
      ],
    },
  ];

  //step 1: เคลียร์บิลค้างชำระ
  const [openBills, setOpenBills] = useState({}); // เก็บสถานะการเปิดของแต่ละเดือน เช่น { "2024-12": true }
  const toggleBill = (period) => {
    setOpenBills((prev) => ({ ...prev, [period]: !prev[period] }));
  };

  const steps = [
    { id: 1, label: "1. เคลียร์บิลค้างชำระ" },
    { id: 2, label: "2. ตรวจสอบทรัพย์สิน" },
    { id: 3, label: "3. ออกใบเสร็จย้ายออก" },
    { id: 4, label: "4. กรอกรายการคืนเงินประกัน" },
    { id: 5, label: "สรุป" },
  ];

  return (
    <div className="min-h-screen pb-10">
      <RoomHeader roomNumber={roomNumber} />

      <div className="max-w-full mx-auto px-4">
        <div className="bg-white w-full max-w-3xl mx-auto  rounded-3xl p-6 border border-gray-200 shadow-sm mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex gap-4">
            <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-800 shrink-0">
              <FileText size={24} />
            </div>
            <div>
              <h3 className="font-black text-gray-800 flex items-center gap-2">
                รายละเอียดสัญญาเช่า
              </h3>
              <div className="text-sm text-gray-500 mt-1 space-y-0.5 font-bold">
                <p>วันทำสัญญา : {toThaiDate(mockContract.startDate)}</p>
                <p>วันสิ้นสุดสัญญา : {toThaiDate(mockContract.endDate)}</p>
              </div>
            </div>
          </div>
          {mockContract.status === "expired" && (
            <span className="px-4 py-1.5 md:py-2 bg-red-100 text-red-500 text-xs font-black rounded-xl">
              หมดสัญญาแล้ว
            </span>
          )}
        </div>
        {/* 1. Toggle Mode (ผู้เช่าย้ายออก / ผู้เช่าหนี) */}
        <div className="flex bg-gray-100 rounded-xl p-1 mb-4 max-w-2xl mx-auto">
          <button
            onClick={() => setMode("normal")}
            className={`flex-1 py-2.5 rounded-xl font-black transition-all duration-300 cursor-pointer ${
              mode === "normal"
                ? "bg-[#f3a638] text-white shadow-md"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            ผู้เช่าย้ายออก
          </button>
          <button
            onClick={() => setMode("absconded")}
            className={`flex-1 py-2.5 rounded-xl font-black transition-all duration-300 cursor-pointer ${
              mode === "absconded"
                ? "bg-[#d9534f] text-white shadow-md"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            ผู้เช่าหนี
          </button>
        </div>

        <p className="text-center text-gray-700 font-bold mb-4">
          {" "}
          {mode === "normal"
            ? "ขั้นตอนการย้ายออกจะมี 4 ขั้นตอน ได้แก่"
            : "หมายเหตุ: กรณีผู้เช่าหนีจะทำการบันทึกหนี้สูญและไม่ทำการออกบิลใด ๆ"}
        </p>
        <div className="flex justify-center flex-wrap gap-2 mb-6 ">
          {steps.map((step) => (
            <button
              key={step.id}
              onClick={() => setCurrentStep(step.id)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                currentStep === step.id
                  ? mode === "absconded"
                    ? "bg-purple-100 text-purple-700 "
                    : "bg-blue-100 text-blue-700 "
                  : "bg-gray-100 text-gray-400 hover:bg-gray-200"
              }`}
            >
              {step.label}
            </button>
          ))}
        </div>

        {/* 3. Main Content Container */}
        <div className="md:border-[1.5px] md:border-blue-300 md:rounded-[40px] md:p-8 relative h-auto w-full max-w-5xl mx-auto">
          {" "}
          <hr className="md:hidden border-t border-gray-200 mb-6" />
          {/* Step Title & Notice */}
          <div className="flex items-center gap-4 mb-2">
            <span
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg ${
                mode === "absconded"
                  ? "bg-purple-100 text-purple-600"
                  : "bg-blue-100 text-blue-600"
              }`}
            >
              {currentStep}
            </span>
            <h2 className="text-xl font-black text-gray-800">
              {steps.find((s) => s.id === currentStep)?.label.split(". ")[1] ||
                "สรุปการย้ายออก"}
            </h2>
          </div>
          <StepNotice mode={mode} currentStep={currentStep} />
          {/* 4. Render Dynamic Content Based on Step */}
          <div className="h-auto">
            {currentStep === 1 && (
              <div className="space-y-4">
                {billItems.length === 0 ? (
                  <EmptyState message="ไม่มีข้อมูลบิลค้างชำระ" />
                ) : (
                  <>
                    {/* วนลูปตามกลุ่มเดือนที่ค้างชำระ */}
                    {billItems.map((billGroup) => (
                      <div
                        key={billGroup.period}
                        className="border border-gray-100 rounded-[24px] bg-white shadow-sm overflow-hidden"
                      >
                        {/* Header ของ Card: คลิกเพื่อกาง/พับ */}
                        <div
                          onClick={() => toggleBill(billGroup.period)}
                          className="p-5 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className="hidden md:flex w-10 h-10 bg-orange-100 rounded-full items-center justify-center text-orange-600 shrink-0">
                              <Inbox size={20} />
                            </div>
                            <div>
                              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                                บิลค้างชำระเดือน
                              </p>
                              <p className="font-black text-gray-800">
                                {toThaiMonth(billGroup.period)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-6">
                            <div className="text-right">
                              <p className="text-xs text-gray-500">
                                ยอดค้างชำระรวม
                              </p>
                              <p className="font-black text-orange-600 text-lg">
                                {billGroup.totalAmount.toLocaleString()} ฿
                              </p>
                            </div>
                            <ChevronDown
                              className={`text-gray-400 transition-transform duration-300 ${openBills[billGroup.period] ? "rotate-180" : ""}`}
                            />
                          </div>
                        </div>

                        {/* ส่วนรายละเอียด (จะแสดงเมื่อกดเปิด) */}
                        {openBills[billGroup.period] && (
                          <div className="px-5 pb-5 animate-fadeIn">
                            <div className="border-t border-dashed border-gray-200 pt-4 mt-2">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="text-gray-400 font-bold">
                                    <th className="text-left pb-2">รายการ</th>
                                    <th className="text-right pb-2">
                                      จำนวนเงิน
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                  {/* ดึงข้อมูลจากตารางบิลของเดือนนั้นๆ มา Map */}
                                  {billGroup.details.map((item, idx) => (
                                    <tr key={idx}>
                                      <td className="py-2 text-gray-600 font-bold">
                                        {item.label}
                                      </td>
                                      <td className="py-2 text-right font-black text-gray-800">
                                        {item.amount.toLocaleString()}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    
                  </>
                )}
              </div>
            )}

            {currentStep === 2 &&
              (assets.length === 0 ? (
                <EmptyState message="ไม่มีข้อมูลรายการทรัพย์สิน" />
              ) : (
                <div>{/* Asset List */}</div>
              ))}

            {currentStep === 3 && (
              <div className="space-y-6">
                {/* ตารางแสดงใบเสร็จย้ายออก (รูป 3) */}
                <div className="overflow-hidden rounded-2xl border border-gray-800">
                  <table className="w-full text-sm md:text-base">
                    <thead className="bg-gray-200 border-b border-gray-800">
                      <tr>
                        <th className="p-3 border-r border-gray-800 w-16"></th>
                        <th className="p-3 border-r border-gray-800 text-left">
                          รายการ
                        </th>
                        <th className="p-3 border-r border-gray-800 w-20">
                          แก้ไข
                        </th>
                        <th className="p-3 border-r border-gray-800 w-20">
                          ลบ
                        </th>
                        <th className="p-3 text-right">จำนวนเงิน(บาท)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      <tr>
                        <td className="p-3 text-center border-r border-gray-800">
                          1.
                        </td>
                        <td className="p-3 border-r border-gray-800">
                          ค่าไฟฟ้า เดือนธันวาคม 2024...
                        </td>
                        <td className="p-3 border-r border-gray-800 text-center">
                          <button className="p-1 bg-orange-400 rounded text-white">
                            <Pencil size={14} />
                          </button>
                        </td>
                        <td className="p-3 border-r border-gray-800 text-center">
                          <button className="p-1 bg-red-400 rounded text-white">
                            <Trash2 size={14} />
                          </button>
                        </td>
                        <td className="p-3 text-right">500</td>
                      </tr>
                      <tr className="bg-gray-100 font-bold">
                        <td
                          colSpan={4}
                          className="p-3 text-center border-r border-gray-800 uppercase tracking-widest"
                        >
                          รวมทั้งหมด
                        </td>
                        <td className="p-3 text-right">1,050</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="flex flex-wrap justify-center gap-3">
                  <SaveButton
                    label="บันทึก"
                    className="!bg-[#a8d5ba] !border-none"
                  />
                  <OrangeButton label="บันทึกเป็น PDF" icon={Download} />
                  <OrangeButton label="ส่งบิล" icon={Send} />
                  <WhiteButton
                    label="เพิ่มรายการ+"
                    className="!bg-blue-100 !text-blue-600 !border-none"
                  />
                  <WhiteButton
                    label="เพิ่มส่วนลด+"
                    className="!bg-blue-100 !text-blue-600 !border-none"
                  />
                </div>
              </div>
            )}

            {currentStep === 5 && (
              <div className="space-y-6">
                <div
                  className={`rounded-xl overflow-hidden border ${mode === "absconded" ? "border-red-400" : "border-[#f3a638]"}`}
                >
                  <div
                    className={`p-3 text-center font-bold text-lg ${mode === "absconded" ? "bg-red-400 text-white" : "bg-[#f3a638] text-white"}`}
                  >
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
                          <div className="flex justify-between text-sm">
                            <span>ค่าไฟฟ้า...</span>
                            <span>500 บาท</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>ค่าน้ำ...</span>
                            <span>50 บาท</span>
                          </div>
                          <div className="flex justify-between text-sm text-red-500">
                            <span>ส่วนลด</span>
                            <span>-100 บาท</span>
                          </div>
                          <div className="border-t border-gray-400 pt-2 flex justify-between font-black text-lg">
                            <span>สรุปยอดชำระ</span>
                            <span>1,050 บาท</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div
                    className={`p-4 text-center font-black text-xl ${mode === "absconded" ? "bg-red-100 text-red-700" : "bg-orange-100 text-gray-800"}`}
                  >
                    {mode === "absconded"
                      ? "หอพักได้รับเงินประกัน 0 บาท"
                      : "ยอดเงินประกันคืนผู้เช่า 2,450 บาท"}
                  </div>
                </div>
                <div className="flex justify-center gap-4">
                  <OrangeButton label="พิมพ์ใบย้ายออก" />
                  <WhiteButton
                    label="เคลียร์บิลค้างชำระและย้ายออก"
                    className="!bg-blue-200 !text-blue-700 !border-none"
                  />
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
