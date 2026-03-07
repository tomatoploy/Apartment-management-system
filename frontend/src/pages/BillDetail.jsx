import React, { useState,useEffect, useMemo } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { CustomMonthPicker, toThaiMonth } from "../components/DateController";
import BillTable from "../components/BillTable";
import RoomHeader from "../components/RoomHeader";
import {
  OrangeButton,
  ExitButton,
  WhiteButton,
  SaveButton,
} from "../components/ActionButtons";
import { Inbox, Download, Plus, Send, Minus } from "lucide-react";

/* ================= Helpers ================= */
const getItemLabel = (item, selectedDate, type) => {

  const month = toThaiMonth(selectedDate);
  
   // 1. สำหรับการแสดงผลตามเดือนที่เลือก (กรณีบิลรายเดือน)
  if (item.labels?.[selectedDate]) {
    return item.labels[selectedDate];
  }

  // 2. เช็คตามประเภทของรายการ (type)
  if (item.type === "discount") return "ส่วนลด";
  if (item.type === "rent") return `ค่าเช่าห้อง เดือน${month}`;
  if (item.type === "electric")
    return `ค่าไฟฟ้า เดือน${month} ${item.detail || ""}`;
  if (item.type === "water")
    return `ค่าน้ำประปา เดือน${month} ${item.detail || ""}`;

   // 3.label ระบุมาตรงๆ (ใช้สำหรับ test case)
  if (item.label) {
    return item.label;
  }

  // 4. สำหรับโหมดทรัพย์สินเสียหาย
  if (type === "asset") {
    return item.label || "ระบุรายการทรัพย์สิน";
  }

  // 5. กรณีสุดท้ายจริงๆ ถึงจะแสดงรายการอื่น ๆ
  return "รายการอื่น ๆ";
};

/* ================= Component ================= */
const BillDetail = ({ 
  mode, 
  initialData, 
  type = "bill",
  // เพิ่ม Props สำหรับควบคุมปุ่มรายตัว (Default เป็น false ทั้งหมดเพื่อความปลอดภัย)
  showAddBtn = true,
  showDiscountBtn = true,
  showSaveBtn = true,
  showPdfBtn = true,
  showSendBtn = true,
  onDataChange,
  onSave }) => {  const navigate = useNavigate();
  const { roomNumber } = useParams();
  const location = useLocation();

  // เช็คโหมด: ถ้าไม่ได้ส่ง props มา ให้เช็คจาก state ของ navigation (ถ้ามีการส่งมา)
  const isFromRoomMap =
    mode === "room-map" || location.state?.from === "room-map";

  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().slice(0, 7),
  );

  /////////////////Mockdata

  //const [items, setItems] = useState([]);
  // const [items, setItems] = useState([
  //   { id: 1, type: "rent", amount: 3000, labels: {} },
  //   {
  //     id: 2,
  //     type: "electric",
  //     detail: "(451-351 = 100 หน่วย)",
  //     amount: 500,
  //     labels: {},
  //   },
  //   {
  //     id: 3,
  //     type: "water",
  //     detail: "(1025-1020 = 5 หน่วย)",
  //     amount: 50,
  //     labels: {},
  //   },
  //   { id: 4, type: "discount", amount: -100, labels: {} },
  // ]);

  // 1. สร้าง State สำหรับเก็บรายการในตาราง
  const [items, setItems] = useState(initialData || []);

  // 2. **จุดสำคัญ** เพิ่ม useEffect เพื่อดักจับการเปลี่ยนแปลงจากหน้าแม่
  useEffect(() => {
    // เมื่อ initialData ที่ส่งมาจาก CheckoutManager เปลี่ยนแปลง
    // ให้สั่ง setItems เพื่ออัปเดตข้อมูลในตารางใหม่ทันที
    setItems(initialData || []);
  }, [initialData]); 

  // 3. เมื่อมีการเพิ่ม/ลบรายการในตาราง (ลูกเปลี่ยน) ให้ส่งค่ากลับไปบอกแม่ด้วย
  useEffect(() => {
    if (onDataChange) {
      onDataChange(items);
    }
  }, [items, onDataChange]);

  ///////จบส่วน data

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
              label: form.label,
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
      { id: Date.now(), type, amount: 0, label: "", labels: {} },
    ]);
  };

  const deleteItem = (id) =>
    setItems((prev) => prev.filter((i) => i.id !== id));

  return (
    <>
    {/* ถ้าเป็นโหมด checkout (ย้ายออก) ไม่ต้องแสดง Header และตัวเลือกเดือน */}
      {mode !== "checkout" && (
        <>
          {isFromRoomMap ? (
            <RoomHeader roomNumber={roomNumber} />
          ) : (
            <div className="relative text-center mb-6">
              <ExitButton onClick={() => navigate(-1)} className="absolute right-0 top-0" />
              <h1 className="text-2xl md:text-3xl font-bold mb-8 text-gray-800">
                การออกบิล ห้อง {roomNumber}
              </h1>
            </div>
          )}

          <div className="flex justify-center items-center gap-3 mb-8">
            <div className="flex items-center gap-4 flex-col md:flex-row">
              <span className="font-bold text-gray-600 shrink-0">รอบบิล</span>
              <CustomMonthPicker
                value={selectedDate}
                onChange={(value) => setSelectedDate(value)}
                className="w-64"
              />
            </div>
          </div>
        </>
      )}
      {/* {isFromRoomMap ? (
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
      </div> */}

      {/* Table Component */}
      {items && items.length > 0 ? (
        // 1. กรณีมีข้อมูล: แสดงตารางปกติ
        <>
          <BillTable
            roomNumber={roomNumber}
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

          {/* ส่วนควบคุมปุ่ม Action */}
<div className="flex flex-col items-center w-full mt-6">
  
  {/* บรรทัดที่ 1: เพิ่มรายการ, เพิ่มส่วนลด, บันทึก */}
  {(showAddBtn || showDiscountBtn || showSaveBtn) && (
    <div className="flex flex-col md:flex-row justify-center items-center gap-3 w-full ">
      {showAddBtn && (
        <WhiteButton
          label="เพิ่มรายการ"
          icon={Plus}
          onClick={() => addItem(type === "asset" ? "damage" : "other")}
          className="w-full md:w-auto flex items-center justify-center gap-2 py-2.5 px-6 rounded-xl font-bold !bg-blue-50 !text-blue-600 !border-blue-50 hover:!bg-blue-100"
        />
      )}
      {showDiscountBtn && (
        <WhiteButton
          label="เพิ่มส่วนลด"
          icon={Minus}
          onClick={() => addItem("discount")}
          className="w-full md:w-auto flex items-center justify-center gap-2 py-2.5 px-6 rounded-xl font-bold !bg-red-50 !text-red-600 !border-red-50 hover:!bg-red-100"
        />
      )}
      {showSaveBtn && (
        <SaveButton
          label="บันทึก"
          className="w-full md:w-auto py-2.5 px-10" // เพิ่ม px-10 ให้ปุ่มดูเด่นขึ้น
          onClick={() => onSave ? onSave(items, total) : alert("บันทึกข้อมูลเรียบร้อย")}                
        />
      )}
    </div>
  )}

  {/* บรรทัดที่ 2: PDF และ ส่งบิล (แสดงเฉพาะเมื่อสั่งเปิดปุ่มเหล่านี้) */}
  {(showPdfBtn || showSendBtn) && (
    <div className="flex flex-col md:flex-row justify-center items-center gap-3 md:gap-4 w-full mt-4">
      {showPdfBtn && (
        <OrangeButton 
          label="บันทึกเป็น PDF" 
          icon={Download} 
          className="w-full md:w-auto  px-8"
        />
      )}
      {showSendBtn && (
        <OrangeButton 
          label="ส่งบิล" 
          icon={Send} 
          className="w-full md:w-auto px-8"
        />
      )}
    </div>
  )} 
</div>
    </>   

      ) : (

        // 2. กรณีไม่มีบิลค้างชำระ: แสดงสไตล์ Empty State ตามที่คุณต้องการ
        <div className="py-24 flex flex-col items-center justify-center text-center bg-gray-50 rounded-[40px] border border-gray-200 mt-4 max-w-4xl mx-auto px-6">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-gray-300 mb-6 border border-dashed border-gray-300">
            <Inbox size={48} />
          </div>
          <h3 className="text-xl font-black text-gray-500 mb-2">
            ไม่มีบิลค้างชำระ
          </h3>
          <p className="text-gray-400 text-sm mb-6 font-bold uppercase tracking-wider">
            ไม่พบรายการบิลสำหรับเดือน {toThaiMonth(selectedDate)}
          </p>

          <OrangeButton
            label="สร้างบิลใหม่"
            icon={Plus}
            onClick={() => addItem("rent")}
          />
        </div>
      )}
    </>
  );
};

export default BillDetail;
