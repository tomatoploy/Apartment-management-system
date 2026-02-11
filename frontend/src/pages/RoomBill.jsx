import React, { useState, useMemo } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  Download,
  Plus,
  Pencil,
  Trash2,
  Send,
} from "lucide-react";

import {
  BlueButton,
  OrangeButton,
  SaveButton,
} from "../components/ActionButtons";
import { CustomMonthPicker, toThaiMonth } from "../components/DateController";
import RoomHeader from "../components/RoomHeader";

/* ================= Helpers ================= */
const getItemLabel = (item, selectedDate) => {
  if (item.labels?.[selectedDate]) return item.labels[selectedDate];
  const month = toThaiMonth(selectedDate);
  if (item.type === "discount") return "ส่วนลด";
  if (item.type === "rent") return `ค่าเช่าห้อง เดือน${month}`;
  if (item.type === "electric") return `ค่าไฟฟ้า เดือน${month} ${item.detail || ""}`;
  if (item.type === "water") return `ค่าน้ำประปา เดือน${month} ${item.detail || ""}`;
  return "รายการอื่น ๆ";
};

/* ================= Component ================= */
const RoomBill = () => {
  const navigate = useNavigate();
  const { roomNumber } = useParams();
  const location = useLocation();

  // ตรวจสอบว่าเข้าผ่าน URL /rooms/... หรือไม่
  const isFromRoom = location.pathname.includes(`/rooms/`);

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 7));
  const [items, setItems] = useState([
    { id: 1, type: "rent", amount: 3000, labels: {} },
    { id: 2, type: "electric", detail: "(451-351 = 100 หน่วย)", amount: 500, labels: {} },
    { id: 3, type: "water", detail: "(1025-1020 = 5 หน่วย)", amount: 50, labels: {} },
    { id: 4, type: "discount", amount: -100, labels: {} },
  ]);

  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ label: "", amount: 0 });

  const total = useMemo(() => items.reduce((sum, i) => sum + i.amount, 0), [items]);

  /* -------- Handlers -------- */
  const startEdit = (item) => {
    setEditingId(item.id);
    setForm({ label: getItemLabel(item, selectedDate), amount: item.amount });
  };

  const saveEdit = (id) => {
    setItems(prev => prev.map(item => item.id === id ? 
      { ...item, amount: form.amount, labels: { ...item.labels, [selectedDate]: form.label } } : item
    ));
    setEditingId(null);
  };

  const addItem = (type) => setItems(prev => [...prev, { id: Date.now(), type, amount: 0, labels: {} }]);
  const deleteItem = (id) => setItems(prev => prev.filter(i => i.id !== id));

  /* -------- Render Content (ส่วนเนื้อหาหลัก) -------- */
  const renderBillContent = () => (
    <div className="w-full">
      {/* ส่วนหัว: แสดงเฉพาะหน้าบิลเดี่ยวๆ */}
      {!isFromRoom && (
        <div className="text-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">การออกบิล ห้อง {roomNumber}</h1>
        </div>
      )}

      {/* รอบบิล */}
      <div className="flex justify-center mb-8">
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full max-w-sm">
          <span className="font-bold text-gray-600 shrink-0">รอบบิล</span>
          <CustomMonthPicker value={selectedDate} onChange={setSelectedDate} className="w-full" />
        </div>
      </div>

      {/* Grid Table: ปรับให้ Responsive และแก้ช่องว่าง Error */}
      <div className="bg-white rounded-2xl border border-gray-300 shadow-sm overflow-hidden w-full mb-8">
        {/* Table Header (Desktop) */}
        <div className="hidden md:grid grid-cols-[80px_1fr_180px_150px] bg-gray-100 text-gray-600 font-bold border-b text-sm">
          <div className="p-4 text-center">#</div>
          <div className="p-4">รายการ</div>
          <div className="p-4 text-right">จำนวนเงิน</div>
          <div className="p-4 text-center">จัดการ</div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-gray-200">
          {items.map((item, idx) => (
            <div key={item.id} className="grid grid-cols-1 md:grid-cols-[80px_1fr_180px_150px] p-4 md:p-0 hover:bg-gray-50 transition-colors">
              <div className="md:p-4 text-gray-500 text-sm md:text-center self-center">
                <span className="md:hidden font-bold text-gray-400 mr-2 uppercase text-[10px]">ลำดับ:</span>
                {idx + 1}
              </div>
              <div className="md:p-4 self-center py-1 md:py-4">
                <div className="md:hidden text-[10px] font-bold text-gray-400 mb-1 uppercase">รายการ</div>
                {editingId === item.id ? (
                  <input value={form.label} onChange={e => setForm({...form, label: e.target.value})} className="w-full border rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-400" />
                ) : (
                  <span className="text-gray-700 font-medium">{getItemLabel(item, selectedDate)}</span>
                )}
              </div>
              <div className="md:p-4 text-right self-center py-1 md:py-4">
                <div className="md:hidden text-left text-[10px] font-bold text-gray-400 mb-1 uppercase">จำนวนเงิน</div>
                {editingId === item.id ? (
                  <input type="number" value={Math.abs(form.amount)} onChange={e => setForm({...form, amount: item.type === "discount" ? -Number(e.target.value) : Number(e.target.value)})} className="w-full border rounded-xl px-3 py-2 text-right outline-none" />
                ) : (
                  <span className={`font-bold text-lg md:text-base ${item.amount < 0 ? "text-red-500" : "text-gray-700"}`}>{item.amount.toLocaleString()}</span>
                )}
              </div>
              <div className="md:p-4 self-center pt-4 md:pt-0">
                <div className="flex justify-center gap-2">
                  {editingId === item.id ? (
                    <button onClick={() => saveEdit(item.id)} className="w-full bg-green-500 text-white px-4 py-2 rounded-xl font-bold">บันทึก</button>
                  ) : (
                    <>
                      <button onClick={() => startEdit(item)} className="p-2.5 bg-[#ffe3c2] rounded-xl text-[#F5A623] hover:scale-105 transition-transform"><Pencil size={18} /></button>
                      <button onClick={() => deleteItem(item.id)} className="p-2.5 bg-red-100 rounded-xl text-red-500 hover:scale-105 transition-transform"><Trash2 size={18} /></button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t-2 border-gray-200 p-4 md:p-5 flex justify-between md:grid md:grid-cols-[1fr_180px_150px] items-center">
          <div className="hidden md:block text-right font-bold text-gray-600 pr-4">รวมทั้งหมด</div>
          <div className="font-bold text-gray-600 md:hidden">รวมทั้งหมด</div>
          <div className="text-[#2E86C1] text-2xl font-black text-right">{total.toLocaleString()}</div>
          <div className="hidden md:block"></div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex flex-col gap-6 items-center">
        <div className="flex flex-wrap justify-center gap-3 w-full">
          <BlueButton label="เพิ่มรายการ" icon={Plus} onClick={() => addItem("other")} />
          <BlueButton label="เพิ่มส่วนลด" icon={Plus} onClick={() => addItem("discount")} />
          <SaveButton label="บันทึกข้อมูล" onClick={() => alert("บันทึกข้อมูลเรียบร้อย")} />
        </div>
        <div className="flex flex-wrap justify-center gap-3 w-full border-t pt-6">
          <OrangeButton label="บันทึกเป็น PDF" icon={Download} />
          <OrangeButton label="ส่งบิล" icon={Send} />
        </div>
      </div>
    </div>
  );

  /* -------- Final Return: เลือก Wrapper ตามเงื่อนไข -------- */
  return (
    <div className="min-h-screen bg-gray-50">
      {isFromRoom ? (
        <RoomHeader roomNumber={roomNumber}>
          {renderBillContent()}
        </RoomHeader>
      ) : (
        <div className="max-w-5xl mx-auto p-4 md:p-8">
          {renderBillContent()}
        </div>
      )}
    </div>
  );
};

export default RoomBill;