import React, { useState, useMemo } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Download, Plus, Send, Minus } from "lucide-react";

import {
  OrangeButton,
  SaveButton,
  ExitButton,
  WhiteButton,
} from "../components/ActionButtons";
import { CustomMonthPicker, toThaiMonth } from "../components/DateController";
import BillTable from "../components/BillTable";
import RoomHeader from "../components/RoomHeader"; // สมมติว่าสร้าง component นี้ไว้แล้ว

/* ================= Helpers ================= */
const getItemLabel = (item, selectedDate) => {
  if (item.labels?.[selectedDate]) {
    return item.labels[selectedDate];
  }
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
const BillDetail = ({ mode }) => {
  const navigate = useNavigate();
  const { roomNumber } = useParams();
  const location = useLocation();

  // เช็คโหมด: ถ้าไม่ได้ส่ง props มา ให้เช็คจาก state ของ navigation (ถ้ามีการส่งมา)
  // หรือจะใช้การเช็ค Path ก็ได้ครับ
  const isFromRoomMap =
    mode === "room-map" || location.state?.from === "room-map";

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
    { id: 4, type: "discount", amount: -100, labels: {} },
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
    setForm({ label: getItemLabel(item, selectedDate), amount: item.amount });
  };

  const saveEdit = (id) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              amount: form.amount,
              labels: { ...item.labels, [selectedDate]: form.label },
            }
          : item,
      ),
    );
    setEditingId(null);
  };

  const addItem = (type) => {
    setItems((prev) => [
      ...prev,
      { id: Date.now(), type, amount: 0, labels: {} },
    ]);
  };

  const deleteItem = (id) =>
    setItems((prev) => prev.filter((i) => i.id !== id));

  return (
    <>
      {/* ส่วนเงื่อนไขการแสดง Header */}
      {isFromRoomMap ? (
        <RoomHeader roomNumber={roomNumber} />
      ) : (
        <div className="relative text-center mb-6">
          <ExitButton
            onClick={() => navigate(-1)}
            className="absolute right-0 top-0"
          />
          <h1 className="text-2xl md:text-3xl font-bold mb-8 text-gray-800">
            การออกบิล ห้อง {roomNumber}
          </h1>
        </div>
      )}

      {/* Table Component (ที่มีตัวเลือกเดือนและปุ่มภายใน) */}
      <BillTable
        items={items}
        editingId={editingId}
        form={form}
        setForm={setForm}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        getItemLabel={getItemLabel}
        startEdit={startEdit}
        saveEdit={saveEdit}
        deleteItem={deleteItem}
        total={total}
        addItem={addItem}
      />
    </>
  );
};

export default BillDetail;
