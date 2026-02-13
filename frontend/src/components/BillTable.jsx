import React, { useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Download,
  Plus,
  Pencil,
  Trash2,
  Send,
  X,
  Minus,
  Calendar as CalendarIcon,
} from "lucide-react";

import {
  BlueButton,
  GreenButton,
  OrangeButton,
  SaveButton,
  ExitButton,
  WhiteButton,
} from "../components/ActionButtons";
import { CustomMonthPicker, toThaiMonth } from "../components/DateController";

/* ================= Helpers ================= */
const getItemLabel = (item, selectedDate) => {
  if (item.labels?.[selectedDate]) {
    return item.labels[selectedDate];
  }

  // แก้จาก formatThaiMonth เป็น toThaiMonth
  const month = toThaiMonth(selectedDate);

  if (item.type === "discount") return "ส่วนลด";
  if (item.type === "rent") return `ค่าเช่าห้อง เดือน${month}`;
  if (item.type === "electric")
    return `ค่าไฟฟ้า เดือน${month} ${item.detail || ""}`;
  if (item.type === "water")
    return `ค่าน้ำประปา เดือน${month} ${item.detail || ""}`;

  return "รายการอื่น ๆ";
};

/* ================= Component ================= */
const BillDetail = () => {
  const navigate = useNavigate();
  const { roomNumber } = useParams();

  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().slice(0, 7),
  );

  const [items, setItems] = useState([
    { id: 1, type: "rent", amount: 3000, labels: {} },
    {
      id: 2,
      type: "electric",
      detail: "(451-351 = 100 หน่วย)",
      amount: 500,
      labels: {},
    },
    {
      id: 3,
      type: "water",
      detail: "(1025-1020 = 5 หน่วย)",
      amount: 50,
      labels: {},
    },
    {
      id: 4,
      type: "discount",
      amount: -100,
      labels: {},
    },
  ]);

  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ label: "", amount: 0 });

  const total = useMemo(
    () => items.reduce((sum, i) => sum + i.amount, 0),
    [items],
  ); /* -------- Handlers -------- */

  const startEdit = (item) => {
    setEditingId(item.id);
    setForm({
      label: getItemLabel(item, selectedDate),
      amount: item.amount,
    });
  };

  const saveEdit = (id) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              amount: form.amount,
              labels: {
                ...item.labels,
                [selectedDate]: form.label, // ⭐ บันทึกตามเดือน
              },
            }
          : item,
      ),
    );

    console.log("บันทึกข้อมูล", {
      id,
      month: selectedDate,
      ...form,
    });

    setEditingId(null);
  };

  const addItem = (type) => {
    setItems((prev) => [
      ...prev,
      {
        id: Date.now(),
        type,
        amount: type === "discount" ? 0 : 0,
        labels: {},
      },
    ]);
  };

  const deleteItem = (id) =>
    setItems((prev) =>
      prev.filter((i) => i.id !== id),
    ); /* -------- Render -------- */

  return (
    <>
              {/* รอบบิล */}             
      <div className="flex justify-center items-center gap-3 mb-8">
         {" "}
        <div className="flex items-center gap-4 flex-col md:flex-row">
                <span className="font-bold text-gray-600 shrink-0">รอบบิล</span>
                   
             {" "}
          <CustomMonthPicker
            value={selectedDate}
            onChange={(value) => setSelectedDate(value)} 
            className="w-64"
          />
           {" "}
        </div>
      </div>
                     {/* Table */}
      <div className="overflow-x-auto rounded-3xl border border-gray-300 mb-8 max-w-4xl mx-auto ">
        <table className="w-full table-fixed">
          {" "}
          <thead className="bg-gray-200 text-gray-600">
            <tr>
              <th className="hidden md:table-cell p-4 w-12 text-center"></th>
              <th className="p-4 text-left">รายการ</th>
              <th className="p-4 text-right w-24 md:w-32">จำนวนเงิน</th>
              <th className="p-4 w-16 md:w-28 text-center">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-300">
            {items.map((item, idx) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="hidden md:table-cell p-4 text-center text-gray-400">
                  {idx + 1}
                </td>

                {/* รายการ: ใช้คลาส break-words เพื่อกันข้อความยาวเกินจนดันตารางทะลุ */}
                <td className="px-2 md:px-4 py-4">
                  {editingId === item.id ? (
                    <textarea
                      value={form.label}
                      onChange={(e) =>
                        setForm({ ...form, label: e.target.value })
                      }
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 outline-none text-sm md:text-base focus:outline-none focus:border-[#f3a638] transition-all "
                      rows={2}
                    />
                  ) : (
                    <div className="whitespace-pre-wrap wrap-break-words text-gray-700 text-sm md:text-base leading-snug">
                      {getItemLabel(item, selectedDate)}
                    </div>
                  )}
                </td>

                <td className="p-4 text-right">
                  {editingId === item.id ? (
                    <input
                      type="number"
                      value={Math.abs(form.amount)}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        setForm({
                          ...form,
                          amount: item.type === "discount" ? -v : v,
                        });
                      }}
                      className="w-full border border-gray-200 rounded-xl px-2 py-2 outline-none text-right text-sm focus:outline-none focus:border-[#f3a638] transition-all"
                    />
                  ) : (
                    <span
                      className={`font-bold text-sm md:text-base ${item.amount < 0 ? "text-red-600" : "text-gray-700"}`}
                    >
                      {item.amount.toLocaleString()}
                    </span>
                  )}
                </td>

                <td className="p-2 md:p-4">
                  <div className="flex flex-col md:flex-row items-center justify-center gap-2">
                    {editingId === item.id ? (
                      <button
                        onClick={() => saveEdit(item.id)}
                        className="md:w-auto px-2 py-1 md:px-4 md:py-2 bg-[#D5F5E3] text-[#1D8348] hover:bg-[#abebc6] rounded-xl"
                      >
                        บันทึก
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => startEdit(item)}
                          className="p-1.5 bg-[#ffe3c2] rounded-lg text-orange-500 hover:bg-[#ffdaaf]"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => deleteItem(item.id)}
                          className="p-1.5 bg-red-100 rounded-lg text-red-500 hover:bg-red-200"
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
             {" "}
      <div className="flex justify-center gap-4 mb-2">
                 {" "}
        <div className="flex flex-col md:flex-row justify-center gap-3 w-full">
          <WhiteButton
            label="เพิ่มรายการ"
            icon={Plus}
            onClick={() => addItem("other")}
            className="flex-1 md:flex-none w-full md:w-auto 
      flex items-center justify-center gap-2 
      py-2.5 px-6 rounded-xl font-bold transition-all 
      active:scale-95  !bg-blue-50 !text-blue-600 !border-blue-50 hover:!bg-blue-100"
          />
          <WhiteButton
            label="เพิ่มส่วนลด"
            icon={Minus}
            onClick={() => addItem("discount")}
            className="flex-1 md:flex-none w-full md:w-auto 
      flex items-center justify-center gap-2 
      py-2.5 px-6 rounded-xl font-bold transition-all 
      active:scale-95  !bg-red-50 !text-red-600 !border-red-50 hover:!bg-red-100"
          />
                   {" "}
          <SaveButton
            label="บันทึก"
            onClick={() => alert("บันทึกข้อมูลทั้งหมด")}
          />
                 {" "}
        </div>
      </div>
             {" "}
      <div className="flex flex-col md:flex-row justify-center items-center gap-3 md:gap-4 w-full mt-3">
  <OrangeButton 
    label="บันทึกเป็น PDF" 
    icon={Download} 
    className="py-3 w-full md:w-auto" 
  />
  <OrangeButton 
    label="ส่งบิล" 
    icon={Send} 
    className="py-3 w-full md:w-auto" 
  />
</div>
    </>
  );
};

export default BillDetail;
