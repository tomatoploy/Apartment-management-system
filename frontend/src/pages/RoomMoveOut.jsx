import React, { useState } from "react";
import { useParams } from "react-router-dom";
import {
  ShieldCheck,
  FileWarning,
  Inbox,
  ChevronDown,
  Plus,
  Printer,
  FileText,
} from "lucide-react";
import RoomHeader from "../components/RoomHeader";
import BillDetail from "./BillDetail";
import BillTable from "../components/BillTable";
import { toThaiDate, toThaiMonth } from "../components/DateController";
import {
  OrangeButton,
  WhiteButton,
  SaveButton,
} from "../components/ActionButtons";

/* ================= Mock Data ================= */
const mockContract = {
  contractId: "CNT-2025-001",
  startDate: "2025-01-01",
  endDate: "2025-03-31",
  status: "expired",
};

const BILL_ITEMS = [
  {
    period: "2024-12",
    details: [
      { label: "ค่าเช่าห้อง", amount: 5000 },
      { label: "ค่าน้ำ", amount: 100 },
      { label: "ค่าไฟ", amount: 400 },
    ],
  },
  {
    period: "2024-11",
    details: [
      { label: "ค่าเช่าห้อง", amount: 5000 },
      { label: "ค่าน้ำ", amount: 200 },
      { label: "ค่าไฟ", amount: 400 },
    ],
  },
];

const CURRENT_MONTH_BILL = {
  period: "2025-03",
  details: [
    { id: "cur-1", label: "ค่าไฟฟ้า เดือนมีนาคม 2568", amount: 500 },
    { id: "cur-2", label: "ค่าน้ำ เดือนมีนาคม 2568", amount: 550 },
  ],
};

const STEPS = [
  { id: 1, label: "1. เคลียร์บิลค้างชำระ" },
  { id: 2, label: "2. ตรวจสอบทรัพย์สิน" },
  { id: 3, label: "3. ออกใบเสร็จย้ายออก" },
  { id: 4, label: "4. กรอกรายการคืนเงินประกัน" },
  { id: 5, label: "สรุป" },
];

/* ================= Sub-Components ================= */
const StepNotice = ({ mode, currentStep }) => {
  const notices = {
    1:
      mode === "absconded"
        ? "บิลค่าเช่าค้างชำระ"
        : "กรุณาเคลียร์บิลค่าเช่าค้างชำระ ด้วยการชำระเงินหรือหักจากเงินประกัน",
    2: "กรุณาตรวจสอบทรัพย์สินที่เสียหาย",
    4: "กรอกรายการเงินประกัน หากมีการคืนเงิน",
  };
  if (!notices[currentStep]) return null;
  return (
    <div
      className={`p-2 rounded-xl mb-4 font-bold text-sm px-4 ${mode === "absconded" ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"}`}
    >
      {notices[currentStep]}
    </div>
  );
};

const EmptyState = ({ message }) => (
  <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-gray-200 rounded-[30px] mt-2">
    <p className="text-gray-400 font-bold text-lg">{message}</p>
  </div>
);

/* ================= Main Component ================= */
const CheckoutManager = () => {
  const { roomNumber } = useParams();
  const [mode, setMode] = useState("normal");
  const [currentStep, setCurrentStep] = useState(1);
  const [assets, setAssets] = useState([]);
  const [deposits, setDeposits] = useState([
    { id: "dep-001", label: "เงินประกันความเสียหาย", amount: 3000 },
  ]);
  const [openBills, setOpenBills] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ label: "", amount: 0 });
  const [assetForm, setAssetForm] = useState({ label: "", amount: "" });
  const [isAddingAsset, setIsAddingAsset] = useState(false);

  const toggleBill = (period) =>
    setOpenBills((prev) => ({ ...prev, [period]: !prev[period] }));

  const handleAddAsset = () => {
    if (assetForm.label && assetForm.amount) {
      setAssets([
        ...assets,
        {
          id: Date.now(),
          label: assetForm.label,
          amount: parseFloat(assetForm.amount),
        },
      ]);
      setAssetForm({ label: "", amount: "" });
      setIsAddingAsset(false);
    }
  };

  const stepBadgeClass =
    mode === "absconded"
      ? "bg-purple-100 text-purple-600"
      : "bg-blue-100 text-blue-600";
  const stepActiveClass =
    mode === "absconded"
      ? "bg-purple-100 text-purple-700"
      : "bg-blue-100 text-blue-700";

  return (
    <div className="min-h-screen pb-10">
      <RoomHeader roomNumber={roomNumber} />
      <div className="max-w-full mx-auto px-4">
        {/* Contract Card */}
        <div className="bg-white w-full max-w-3xl mx-auto rounded-3xl p-4 md:p-6 border border-gray-200 shadow-sm mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex gap-4">
            <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-800 shrink-0">
              <FileText size={24} />
            </div>
            <div>
              <h3 className="font-black text-gray-800 text-sm md:text-base">
                รายละเอียดสัญญาเช่า
              </h3>
              <div className="text-xs md:text-sm text-gray-500 mt-1 space-y-0.5 font-bold">
                <p>วันทำสัญญา : {toThaiDate(mockContract.startDate)}</p>
                <p>วันสิ้นสุดสัญญา : {toThaiDate(mockContract.endDate)}</p>
              </div>
            </div>
          </div>
          {mockContract.status === "expired" && (
            <span className="px-4 py-1.5 bg-red-100 text-red-500 text-xs font-black rounded-xl">
              หมดสัญญาแล้ว
            </span>
          )}
        </div>

        {/* Mode Toggle */}
        <div className="flex bg-gray-100 rounded-xl p-1 mb-4 max-w-2xl mx-auto">
          {[
            { key: "normal", label: "ผู้เช่าย้ายออก", active: "bg-[#f3a638]" },
            { key: "absconded", label: "ผู้เช่าหนี", active: "bg-[#d9534f]" },
          ].map(({ key, label, active }) => (
            <button
              key={key}
              onClick={() => setMode(key)}
              className={`flex-1 py-3 min-h-[48px] rounded-xl font-black text-sm md:text-base transition-all duration-300 cursor-pointer ${mode === key ? `${active} text-white shadow-md` : "text-gray-500 hover:text-gray-700"}`}
            >
              {label}
            </button>
          ))}
        </div>

        <p className="text-center text-gray-700 font-bold mb-4">
          {mode === "normal"
            ? "ขั้นตอนการย้ายออกจะมี 4 ขั้นตอน ได้แก่"
            : "หมายเหตุ: กรณีผู้เช่าหนีจะทำการบันทึกหนี้สูญและไม่ทำการออกบิลใด ๆ"}
        </p>

        {/* Step Navigation */}
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {STEPS.map((step) => (
            <button
              key={step.id}
              onClick={() => setCurrentStep(step.id)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer shrink-0 snap-start ${currentStep === step.id ? stepActiveClass : "bg-gray-100 text-gray-400 hover:bg-gray-200"}`}
            >
              {step.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="md:border-[1.5px] md:border-blue-300 md:rounded-[40px] md:p-8 relative h-auto w-full max-w-5xl mx-auto">
          {/* Step Header */}
          <hr className="md:hidden border-t border-gray-200 mb-6" />
          {currentStep !== 2 && (
            <div className="flex items-center gap-4 mb-2">
              <span
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg ${stepBadgeClass}`}
              >
                {currentStep}
              </span>
              <h2 className="text-xl font-black text-gray-800">
                {STEPS.find((s) => s.id === currentStep)?.label.split(
                  ". ",
                )[1] || "สรุปการย้ายออก"}
              </h2>
            </div>
          )}
          {currentStep !== 2 && (
            <StepNotice mode={mode} currentStep={currentStep} />
          )}

          {/* ── Step 1: บิลค้างชำระ ── */}
          {currentStep === 1 && (
            <div className="space-y-4">
              {BILL_ITEMS.length === 0 ? (
                <EmptyState message="ไม่มีข้อมูลบิลค้างชำระ" />
              ) : (
                BILL_ITEMS.map((billGroup) => (
                  <div
                    key={billGroup.period}
                    className="md:border md:border-gray-100 md:rounded-[24px] md:shadow-sm bg-white overflow-hidden border-b border-gray-300"
                  >
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
                      <div className="flex items-center gap-2 md:gap-6">
                        <div className="text-right">
                          <p className="text-xs text-gray-500">
                            ยอดค้างชำระรวม
                          </p>
                          <p className="font-black text-orange-600 text-base md:text-lg">
                            {billGroup.details
                              .reduce((sum, i) => sum + i.amount, 0)
                              .toLocaleString()}{" "}
                            ฿
                          </p>
                        </div>
                        <ChevronDown
                          className={`text-gray-400 transition-transform duration-300 ${openBills[billGroup.period] ? "rotate-180" : ""}`}
                        />
                      </div>
                    </div>
                    {openBills[billGroup.period] && (
                      <div className="p-0 md:px-5 md:pb-5 border-t border-dashed border-gray-200">
                        <div className="md:mt-4 mt-2">
                          <BillDetail
                            mode="checkout"
                            showAddBtn={false}
                            showDiscountBtn={false}
                            showPdfBtn={false}
                            showSendBtn={false}
                            showSaveBtn={false}
                            initialData={billGroup.details.map((item, idx) => ({
                              ...item,
                              id: item.id || `${billGroup.period}-${idx}`,
                            }))}
                            total={billGroup.details.reduce(
                              (sum, i) => sum + i.amount,
                              0,
                            )}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* ── Step 2: ตรวจสอบทรัพย์สิน ── */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                <div className="flex items-center gap-4">
                  <span
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg ${stepBadgeClass}`}
                  >
                    2
                  </span>
                  <h2 className="text-xl font-black text-gray-800">
                    ตรวจสอบทรัพย์สิน
                  </h2>
                </div>
                {!isAddingAsset && (
                  <button
                    onClick={() => setIsAddingAsset(true)}
                    className="px-5 py-2.5 bg-blue-500 text-white rounded-xl font-semibold text-sm hover:bg-blue-600 transition-all flex items-center gap-2 shadow-md"
                  >
                    <Plus size={18} /> เพิ่มรายการทรัพย์สิน
                  </button>
                )}
              </div>
              <StepNotice mode={mode} currentStep={2} />

              {isAddingAsset && (
                <div className="bg-blue-50/50 border-2 border-dashed border-blue-100 rounded-[30px] p-4 mb-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-gray-500 ml-2">
                        ชื่อรายการทรัพย์สิน
                      </label>
                      <input
                        type="text"
                        autoFocus
                        value={assetForm.label}
                        onChange={(e) =>
                          setAssetForm({ ...assetForm, label: e.target.value })
                        }
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-base outline-none focus:border-blue-400 transition-all font-bold"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-gray-500 ml-2">
                        มูลค่าความเสียหาย (บาท)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={assetForm.amount}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (v === "" || parseFloat(v) >= 0)
                            setAssetForm({ ...assetForm, amount: v });
                        }}
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-base outline-none focus:border-blue-400 transition-all font-bold"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col-reverse md:flex-row md:justify-end gap-2 md:gap-3 mt-4">
                    <button
                      onClick={() => setIsAddingAsset(false)}
                      className="w-full md:w-auto px-4 py-3 text-gray-400 font-bold hover:bg-gray-100 rounded-xl transition-all"
                    >
                      ยกเลิก
                    </button>
                    <button
                      onClick={handleAddAsset}
                      className="w-full md:w-auto px-10 py-3 bg-blue-500 text-white rounded-xl font-black shadow-lg shadow-blue-200 hover:bg-blue-600 transition-all"
                    >
                      บันทึก
                    </button>
                  </div>
                </div>
              )}

              {assets.length === 0 && !isAddingAsset ? (
                <EmptyState message="ไม่มีข้อมูลรายการทรัพย์สิน" />
              ) : (
                <div className="mt-6">
                  <BillTable
                    items={assets}
                    editingId={editingId}
                    form={form}
                    setForm={setForm}
                    getItemLabel={(item) => item.label}
                    startEdit={(item) => {
                      setEditingId(item.id);
                      setForm({ label: item.label, amount: item.amount });
                    }}
                    saveEdit={() => setEditingId(null)}
                    deleteItem={(id) =>
                      setAssets(assets.filter((a) => a.id !== id))
                    }
                    total={assets.reduce((sum, a) => sum + a.amount, 0)}
                  />
                  <div className="flex justify-end">
                    <SaveButton
                      onClick={() => alert("บันทึกรายการทรัพย์สินเรียบร้อย")}
                      className="px-12 !py-2"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Step 3: ออกใบเสร็จ ── */}
          {currentStep === 3 && (
            <div className="mt-4">
              <BillDetail
                mode="checkout"
                initialData={[
                  ...BILL_ITEMS.map((bill) => ({
                    id: `unpaid-${bill.period}`,
                    label: `ยอดค้างชำระเดือน ${toThaiMonth(bill.period)}`,
                    amount: bill.details.reduce((sum, i) => sum + i.amount, 0),
                  })),
                  ...assets.map((asset) => ({
                    ...asset,
                    id: `asset-${asset.id}`,
                  })),
                  ...CURRENT_MONTH_BILL.details,
                ]}
                showAddBtn={true}
                showDiscountBtn={true}
                showSaveBtn={true}
                showPdfBtn={true}
                showSendBtn={true}
                onDataChange={(newData) =>
                  console.log("Final Bill Updated:", newData)
                }
              />
            </div>
          )}

          {/* ── Step 4: เงินประกัน ── */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="mt-4">
                <BillDetail
                  mode="checkout"
                  type="deposit"
                  initialData={deposits}
                  showAddBtn={true}
                  showSaveBtn={true}
                  onDataChange={(newData) => setDeposits(newData)}
                />
              </div>
              <div className="p-4">
                <p className="text-sm text-blue-500">
                  *
                  ยอดเงินประกันนี้จะถูกนำไปหักลบกับยอดหนี้ทั้งหมดในขั้นตอนสุดท้าย
                </p>
              </div>
            </div>
          )}

          {/* ── Step 5: สรุป ── */}
          {currentStep === 5 &&
            (() => {
              const unpaidTotal = BILL_ITEMS.reduce(
                (sum, bill) =>
                  sum + bill.details.reduce((s, i) => s + i.amount, 0),
                0,
              );
              const assetTotal = assets.reduce((sum, a) => sum + a.amount, 0);
              const currentMonthTotal = CURRENT_MONTH_BILL.details.reduce(
                (sum, i) => sum + i.amount,
                0,
              );
              const totalExpenses =
                unpaidTotal + assetTotal + currentMonthTotal;
              const totalDeposit = deposits.reduce(
                (sum, d) => sum + d.amount,
                0,
              );
              const netAmount =
                mode === "absconded" ? 0 : totalDeposit - totalExpenses;
              const isRefund = netAmount >= 0;

              const rowClass =
                "flex justify-between text-sm border-b border-dashed border-gray-200 pb-2 py-2";

              return (
                <div className="space-y-6">
                  <div
                    className={`md:rounded-2xl md:overflow-hidden md:border md:shadow-sm ${mode === "absconded" ? "md:border-red-300" : "md:border-gray-200"}`}
                  >
                    {/* Header */}
                    <div
                      className={`py-3 rounded-t-xl  text-center font-black text-lg text-white -mx-4 px-4 md:mx-0 ${mode === "absconded" ? "bg-red-500" : "bg-[#f3a638]"}`}
                    >
                      สรุปการ
                      {mode === "absconded" ? "บันทึกผู้เช่าหนี" : "ย้ายออก"}
                    </div>

                    <div className="md:p-6 space-y-5 bg-gray-50/50">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* เงินประกัน */}
                        <div className="bg-white md:rounded-[24px] md:border md:border-gray-200 md:p-5 md:shadow-sm">
                          <h3 className="text-base font-black text-blue-600 mb-3 flex items-center gap-2 -mx-6 px-6 py-3 md:mx-0 md:px-0 md:py-0 md:bg-transparent">
                            <ShieldCheck size={18} /> เงินประกัน
                          </h3>
                          <div className="space-y-2">
                            {deposits.length === 0 ? (
                              <p className="text-sm text-gray-400 text-center py-4">
                                ไม่มีรายการเงินประกัน
                              </p>
                            ) : (
                              deposits.map((dep) => (
                                <div key={dep.id} className={rowClass}>
                                  <span className="text-gray-600 font-bold">
                                    {dep.label}
                                  </span>
                                  <span className="font-black text-gray-800">
                                    {dep.amount.toLocaleString()} ฿
                                  </span>
                                </div>
                              ))
                            )}
                            <div className="flex justify-between font-black text-blue-600 text-lg pt-1">
                              <span>รวมเงินประกัน</span>
                              <span>{totalDeposit.toLocaleString()} ฿</span>
                            </div>
                          </div>
                        </div>

                        {/* ยอดค้างชำระ */}
                        <div className="bg-white md:rounded-[24px] md:border md:border-gray-200 md:p-5 md:shadow-sm">
                          <h3 className="text-base font-black text-red-500 mb-3 flex items-center gap-2 -mx-6 px-6 py-3 mt-3 border-t-2 border-gray-200 md:border-t-0 md:mx-0 md:px-0 md:py-0 md:mt-0 md:bg-transparent">
                            <FileWarning size={18} /> ยอดค้างชำระทั้งหมด
                          </h3>
                          <div className="space-y-2">
                            {BILL_ITEMS.map((bill) => (
                              <div key={bill.period} className={rowClass}>
                                <span className="text-gray-600 font-bold">
                                  ค้างชำระเดือน {toThaiMonth(bill.period)}
                                </span>
                                <span className="font-black text-gray-800">
                                  {bill.details
                                    .reduce((s, i) => s + i.amount, 0)
                                    .toLocaleString()}{" "}
                                  ฿
                                </span>
                              </div>
                            ))}
                            {CURRENT_MONTH_BILL.details.map((item) => (
                              <div key={item.id} className={rowClass}>
                                <span className="text-gray-600 font-bold">
                                  {item.label}
                                </span>
                                <span className="font-black text-gray-800">
                                  {item.amount.toLocaleString()} ฿
                                </span>
                              </div>
                            ))}
                            {assets.map((asset) => (
                              <div key={asset.id} className={rowClass}>
                                <span className="text-gray-600 font-bold">
                                  {asset.label}
                                </span>
                                <span className="font-black text-gray-800">
                                  {asset.amount.toLocaleString()} ฿
                                </span>
                              </div>
                            ))}
                            {totalExpenses === 0 && (
                              <p className="text-sm text-gray-400 text-center py-4">
                                ไม่มีรายการค้างชำระ
                              </p>
                            )}
                            <div className="flex justify-between font-black text-red-500 text-lg pt-1">
                              <span>รวมยอดค้างชำระ</span>
                              <span>{totalExpenses.toLocaleString()} ฿</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* สรุปสุทธิ */}
                      {mode === "absconded" ? (
                        <div className="p-6 text-center bg-red-50 -mx-4 md:mx-0 md:rounded-[24px] md:border md:border-red-200 border-t-4 border-t-red-400">
                          <p className="text-red-400 font-bold uppercase tracking-widest mb-1 text-sm">
                            บันทึกหนี้สูญ
                          </p>
                          <h2 className="text-xl font-bold text-red-600 mt-2">
                            ยอดที่ไม่สามารถเรียกเก็บได้
                          </h2>
                          <p className="text-2xl font-black text-red-600 mt-2">
                            {totalExpenses.toLocaleString()}{" "}
                            <span className="text-xl">บาท</span>
                          </p>
                          <p className="text-sm text-red-400 font-bold mt-3">
                            * ระบบจะบันทึกหนี้สูญ
                            และหักเงินประกันเพื่อชดเชยความเสียหายบางส่วน
                          </p>
                          <div className="mt-4 bg-white rounded-xl p-3 border border-red-100 text-sm max-w-2xl mx-auto">
                            <div className="flex justify-between text-gray-600 font-bold">
                              <span>เงินประกันที่หักชดเชย</span>
                              <span className="text-blue-600">
                                +{totalDeposit.toLocaleString()} ฿
                              </span>
                            </div>
                            <div className="flex justify-between text-gray-600 font-bold mt-1">
                              <span>ยอดหนี้สูญที่เหลือ</span>
                              <span className="text-red-500">
                                {Math.max(
                                  0,
                                  totalExpenses - totalDeposit,
                                ).toLocaleString()}{" "}
                                ฿
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div
                          className={`p-6 md:p-8 text-center md:rounded-[24px] md:border border-t-4 -mx-4 md:mx-0 ${isRefund ? "bg-green-50 md:border-green-200 border-t-green-400" : "bg-red-50 md:border-red-200 border-t-red-400"}`}
                        >
                          <p className="text-gray-400 font-bold uppercase tracking-widest mb-1 text-sm">
                            สรุปการย้ายออก
                          </p>
                          <h2
                            className={`text-xl font-bold mt-2 ${isRefund ? "text-green-600" : "text-red-600"}`}
                          >
                            {isRefund
                              ? "หอพักคืนเงินผู้เช่า"
                              : "ผู้เช่าต้องชำระเพิ่ม"}
                          </h2>
                          <p
                            className={`text-2xl font-black mt-2 ${isRefund ? "text-green-600" : "text-red-600"}`}
                          >
                            {Math.abs(netAmount).toLocaleString()}{" "}
                            <span className="text-2xl">บาท</span>
                          </p>
                          <div className="mt-5 bg-white/80 rounded-xl px-4 py-3 text-sm font-bold text-gray-500 border border-gray-100 flex flex-col md:inline-flex md:flex-row items-center gap-2 md:gap-6 w-full md:w-auto">
                            <div className="flex items-center justify-between w-full md:w-auto md:contents gap-4">
                              <span>
                                เงินประกัน{" "}
                                <span className="text-blue-600">
                                  {totalDeposit.toLocaleString()} ฿
                                </span>
                              </span>
                              <span className="text-gray-400">−</span>
                              <span>
                                ยอดค้างชำระ{" "}
                                <span className="text-red-500">
                                  {totalExpenses.toLocaleString()} ฿
                                </span>
                              </span>
                            </div>
                            <div className="w-full border-t border-dashed border-gray-200 md:hidden" />
                            <div className="flex items-center justify-between w-full md:w-auto md:contents">
                              <span className="text-gray-400 hidden md:inline">
                                =
                              </span>
                              <span className="text-gray-500 md:hidden">
                                ยอดสุทธิ
                              </span>
                              <span
                                className={`font-black text-base md:text-sm ${isRefund ? "text-green-600" : "text-red-500"}`}
                              >
                                {netAmount >= 0 ? "+" : ""}
                                {netAmount.toLocaleString()} ฿
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div
                      className={`p-4 text-center font-black ${mode === "absconded" ? "md:bg-red-100 text-red-700" : isRefund ? "md:bg-green-100 text-green-700" : "md:bg-orange-100 text-orange-700"}`}
                    >
                      {mode === "absconded"
                        ? `บันทึกหนี้สูญ ${totalExpenses.toLocaleString()} บาท`
                        : isRefund
                          ? `หอพักต้องคืนเงินผู้เช่า ${Math.abs(netAmount).toLocaleString()} บาท`
                          : `ผู้เช่าต้องชำระเงินเพิ่ม ${Math.abs(netAmount).toLocaleString()} บาท`}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-center md:justify-end gap-3">
                    <WhiteButton
                      label={
                        <span className="flex items-center gap-2">
                          <Printer size={16} />
                          พิมพ์ใบย้ายออก
                        </span>
                      }
                      onClick={() => alert("พิมพ์ใบย้ายออก")}
                    />
                    <OrangeButton
                      label={
                        mode === "absconded"
                          ? "ยืนยันบันทึกหนี้สูญ"
                          : "ยืนยันการย้ายออก"
                      }
                      onClick={() =>
                        alert(
                          mode === "absconded"
                            ? "บันทึกหนี้สูญเรียบร้อย"
                            : "บันทึกการย้ายออกเรียบร้อย",
                        )
                      }
                    />
                  </div>
                </div>
              );
            })()}
        </div>
      </div>
    </div>
  );
};

export default CheckoutManager;
