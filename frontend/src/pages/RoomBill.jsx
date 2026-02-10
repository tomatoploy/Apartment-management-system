import React, { useState, useMemo } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  Download,
  Plus,
  Pencil,
  Trash2,
  Send,
  X,
  Calendar as CalendarIcon,
} from "lucide-react";

import {
  BlueButton,
  GreenButton,
  OrangeButton,
  SaveButton,
  ExitButton
} from "../components/ActionButtons";
import { CustomMonthPicker, toThaiMonth } from "../components/DateController";
// --- นำเข้า RoomHeader ---
import RoomHeader from "../components/RoomHeader"; 


/* ================= Helpers ================= */
const getItemLabel = (item, selectedDate) => {
  if (item.labels?.[selectedDate]) {
    return item.labels[selectedDate];
  }
  const month = toThaiMonth(selectedDate); 
  if (item.type === "discount") return "ส่วนลด";
  if (item.type === "rent") return `ค่าเช่าห้อง เดือน${month}`;
  if (item.type === "electric") return `ค่าไฟฟ้า เดือน${month} ${item.detail || ""}`;
  if (item.type === "water") return `ค่าน้ำประปา เดือน${month} ${item.detail || ""}`;
  return "รายการอื่น ๆ";
};

/* ================= Component ================= */
const BillDetail = () => {
  const navigate = useNavigate();
  const { roomNumber } = useParams();

  
  const location = useLocation(); // 2. เรียกใช้งาน useLocation

  // 3. เช็คว่า Path ปัจจุบันคือการเข้าผ่านระบบ Room หรือไม่
  // เช่น ถ้า Path มีคำว่า 'billings' (ตามที่ตั้งไว้ใน RoomHeader) ให้ถือว่าเข้าผ่าน Room
  const isFromRoom = location.pathname.includes(`/billings/${roomNumber}`);

  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().slice(0, 7),
  );


  const [items, setItems] = useState([
    { id: 1, type: "rent", amount: 3000, labels: {} },
    { id: 2, type: "electric", detail: "(451-351 = 100 หน่วย)", amount: 500, labels: {} },
    { id: 3, type: "water", detail: "(1025-1020 = 5 หน่วย)", amount: 50, labels: {} },
    { id: 4, type: "discount", amount: -100, labels: {} },
  ]);

  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ label: "", amount: 0 });

  const total = useMemo(() => items.reduce((sum, i) => sum + i.amount, 0), [items]);

  /* -------- Handlers (คงเดิม) -------- */
  const startEdit = (item) => {
    setEditingId(item.id);
    setForm({ label: getItemLabel(item, selectedDate), amount: item.amount });
  };

  const saveEdit = (id) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, amount: form.amount, labels: { ...item.labels, [selectedDate]: form.label } }
          : item
      )
    );
    setEditingId(null);
  };

  const addItem = (type) => {
    setItems((prev) => [...prev, { id: Date.now(), type, amount: 0, labels: {} }]);
  };

  const deleteItem = (id) => setItems((prev) => prev.filter((i) => i.id !== id));

  /* -------- Render -------- */
  return (
    // ⭐ ใช้ RoomHeader ครอบส่วนเนื้อหาทั้งหมด
    <RoomHeader roomNumber={roomNumber}>
      {/* ⭐ เงื่อนไข: ถ้าไม่ได้มาจากหน้า Room (isFromRoom เป็น false) ให้แสดงหัวข้อ */}
      {isFromRoom && (
        <div className="relative text-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold mb-4 text-gray-800">
            การออกบิล
          </h1>
        </div>
      )}
      
      {/* <div className="relative text-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-4 text-gray-800">
          การออกบิล
        </h1>
      </div> */}

      {/* รอบบิล - ปรับ Responsive ให้ดูดีในมือถือ */}
      <div className="flex justify-center items-center gap-3 mb-8">
        <div className="flex items-center gap-4 flex-col sm:flex-row w-full max-w-xs sm:max-w-none">
          <span className="font-bold text-gray-600 shrink-0">รอบบิล</span>
          <CustomMonthPicker 
            value={selectedDate}
            onChange={(value) => setSelectedDate(value)}
            className="w-full sm:w-64" 
          />
        </div>
      </div>

      {/* Table Section - เพิ่ม overflow-x-auto เพื่อรองรับหน้าจอเล็ก */}
      <div className="overflow-x-auto rounded-2xl border border-gray-300 mb-8 shadow-sm">
        <table className="w-full min-w-[600px]"> {/* กำหนด min-w เพื่อให้ตารางไม่เบียดกันเกินไปในมือถือ */}
          <thead className="bg-gray-100 text-gray-600">
            <tr>
              <th className="p-4 w-12 text-center">#</th>
              <th className="p-4 text-left">รายการ</th>
              <th className="p-4 text-right w-32 md:w-40">จำนวนเงิน</th>
              <th className="p-4 w-32 md:w-40 text-center">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {items.map((item, idx) => (
              <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                <td className="p-4 text-center text-gray-500">{idx + 1}</td>
                <td className="p-4">
                  {editingId === item.id ? (
                    <input
                      value={form.label}
                      onChange={(e) => setForm({ ...form, label: e.target.value })}
                      className="w-full border rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
                    />
                  ) : (
                    <span className="text-gray-700 font-medium">{getItemLabel(item, selectedDate)}</span>
                  )}
                </td>
                <td className="p-4 text-right">
                  {editingId === item.id ? (
                    <input
                      type="number"
                      value={Math.abs(form.amount)}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        setForm({ ...form, amount: item.type === "discount" ? -v : v });
                      }}
                      className="w-full border rounded-xl px-3 py-2 text-right focus:ring-2 focus:ring-blue-400 outline-none"
                    />
                  ) : (
                    <span className={`font-bold ${item.amount < 0 ? "text-red-500" : "text-gray-700"}`}>
                      {item.amount.toLocaleString()}
                    </span>
                  )}
                </td>
                <td className="p-4 flex justify-center gap-2">
                  {editingId === item.id ? (
                    <button
                      onClick={() => saveEdit(item.id)}
                      className="px-4 py-2 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition-colors"
                    >
                      บันทึก
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => startEdit(item)}
                        className="p-2 bg-[#ffe3c2] rounded-xl text-[#F5A623] hover:scale-105 transition-transform"
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="p-2 bg-red-100 rounded-xl text-red-500 hover:scale-105 transition-transform"
                      >
                        <Trash2 size={18} />
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-50 font-bold border-t-2 border-gray-200">
              <td colSpan={2} className="p-5 text-right text-gray-600">รวมทั้งหมด</td>
              <td className="p-5 text-right text-[#2E86C1] text-xl">
                {total.toLocaleString()}
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Buttons Section - ปรับให้ Wrap เมื่อจอมือถือเล็ก */}
      <div className="flex flex-wrap justify-center gap-3 md:gap-4 mb-6">
        <BlueButton label="เพิ่มรายการ" icon={Plus} onClick={() => addItem("other")} />
        <BlueButton label="เพิ่มส่วนลด" icon={Plus} onClick={() => addItem("discount")} />
        <SaveButton label="บันทึกข้อมูล" onClick={() => alert("บันทึกข้อมูลทั้งหมด")} />
      </div>

      <div className="flex flex-wrap justify-center gap-3 md:gap-4">
        <OrangeButton label="บันทึกเป็น PDF" icon={Download} />
        <OrangeButton label="ส่งบิล" icon={Send} />
      </div>
    </RoomHeader>
  );
};

export default BillDetail;