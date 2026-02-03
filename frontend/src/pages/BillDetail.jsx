import React, { useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
} from "../components/ActionButtons";

/* ================= Helpers ================= */
const MONTHS_TH = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
];

const formatThaiMonth = (yyyyMM) => {
  if (!yyyyMM) return "";
  const [y, m] = yyyyMM.split("-");
  return `${MONTHS_TH[Number(m) - 1]} ${y}`;
};

const getItemLabel = (item, selectedDate) => {
  if (item.labels?.[selectedDate]) {
    return item.labels[selectedDate];
  }

  const month = formatThaiMonth(selectedDate);

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
  );

  /* -------- Handlers -------- */
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
    setItems((prev) => prev.filter((i) => i.id !== id));

  /* -------- Render -------- */
  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto bg-white rounded-3xl p-6 shadow-lg border border-gray-200 min-h-[85vh]">
        <div className="relative text-center mb-6">
          <button
            onClick={() => navigate(-1)}
            className="absolute right-0 top-0 p-2 hover:bg-gray-100 rounded-full"
          >
            <X size={26} strokeWidth={3} />
          </button>
          <h1 className="text-3xl font-bold mb-8 text-gray-800">
            การออกบิล ห้อง {roomNumber}
          </h1>
        </div>

        {/* รอบบิล */}
        <div className="flex justify-center items-center gap-3 mb-10">
          <span className="font-bold text-gray-600">รอบบิล</span>
          <div className="relative w-64">
            <CalendarIcon
              size={20}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="month"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl font-bold"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-3xl border border-gray-300 mb-8">
          <table className="w-full">
            <thead className="bg-gray-200 text-gray-600">
              <tr>
                <th className="p-4 w-12 text-center"></th>
                <th className="p-4">รายการ</th>
                <th className="p-4 text-right w-40">จำนวนเงิน</th>
                <th className="p-4 w-40 text-center">จัดการ</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-300">
              {items.map((item, idx) => (
                <tr key={item.id}>
                  <td className="p-4 text-center">{idx + 1}</td>

                  <td className="p-4">
                    {editingId === item.id ? (
                      <input
                        value={form.label}
                        onChange={(e) =>
                          setForm({ ...form, label: e.target.value })
                        }
                        className="w-full border rounded-xl px-3 py-2"
                      />
                    ) : (
                      getItemLabel(item, selectedDate)
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
                        className="w-full border rounded-xl px-3 py-2 text-right"
                      />
                    ) : (
                      <span
                        className={`font-bold ${
                          item.amount < 0
                            ? "text-red-500"
                            : "text-gray-700"
                        }`}
                      >
                        {item.amount.toLocaleString()}
                      </span>
                    )}
                  </td>

                  <td className="p-4 flex justify-center gap-2">
                    {editingId === item.id ? (
                      <button
                        onClick={() => saveEdit(item.id)}
                        className="px-4 py-2 bg-green-500 text-white rounded-xl font-bold"
                      >
                        บันทึก
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => startEdit(item)}
                          className="p-2 bg-[#ffe3c2] rounded-xl text-[#F5A623]"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          onClick={() => deleteItem(item.id)}
                          className="p-2 bg-red-100 rounded-xl text-red-500"
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
              <tr className="bg-gray-100 font-bold">
                <td colSpan={2} className="p-5 text-right">
                  รวมทั้งหมด
                </td>
                <td className="p-5 text-right text-[#2E86C1] text-lg">
                  {total.toLocaleString()}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="flex justify-center gap-4 mb-6">
          <BlueButton label="เพิ่มรายการ" icon={Plus} onClick={() => addItem("other")} />
          <BlueButton label="เพิ่มส่วนลด" icon={Plus} onClick={() => addItem("discount")} />
          <SaveButton
            label="บันทึก"
            onClick={() => alert("บันทึกข้อมูลทั้งหมด")}
          />
        </div>

        <div className="flex justify-center gap-4">
          <OrangeButton label="บันทึกเป็น PDF" icon={Download} />
          <OrangeButton label="ส่งบิล" icon={Send} />
        </div>
      </div>
    </div>
  );
};

export default BillDetail;
