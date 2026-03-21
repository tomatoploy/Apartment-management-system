import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { CustomMonthPicker, toThaiMonth } from "../components/DateController";
import BillTable from "../components/BillTable";
import RoomHeader from "../components/RoomHeader";
import {
  OrangeButton, ExitButton, WhiteButton, SaveButton,
} from "../components/ActionButtons";
import { Inbox, Download, Plus, Send, Minus, Loader2, X, CheckCircle2, AlertCircle, Clock, Zap, Box } from "lucide-react";
import axios from "axios"; 

import { roomService }      from "../api/RoomApi";
import { contractService }  from "../api/ContractApi";
import { paymentService }   from "../api/PaymentApi";
import { constantService }  from "../api/ConstantApi";
import { apartmentService } from "../api/ApartmentApi";

/* ── Helpers ─────────────────────────────────────────────────── */
const CATEGORY_STYLE = {
  service:     { bg: "bg-blue-50",   text: "text-blue-600",   badge: "bg-blue-100"   },
  facility:    { bg: "bg-purple-50", text: "text-purple-600", badge: "bg-purple-100" },
  maintenance: { bg: "bg-yellow-50", text: "text-yellow-700", badge: "bg-yellow-100" },
  property:    { bg: "bg-emerald-50", text: "text-emerald-600", badge: "bg-emerald-100" },
  other:       { bg: "bg-gray-50",   text: "text-gray-600",   badge: "bg-gray-100"   },
};

const CATEGORY_LABEL = {
  service:"บริการ", facility:"สิ่งอำนวยความสะดวก", maintenance:"ซ่อมบำรุง", property:"ทรัพย์สิน/เฟอร์นิเจอร์", other:"อื่นๆ"
};

const STATUS_CONFIG = {
  paid:        { label:"ชำระเงินแล้ว", icon:CheckCircle2, bg:"bg-emerald-100", text:"text-emerald-700", border:"border-emerald-200" },
  unpaid:      { label:"รอชำระเงิน",   icon:Clock,        bg:"bg-gray-100",    text:"text-gray-600",   border:"border-gray-200"    },
  overdue:     { label:"ค้างชำระ",      icon:AlertCircle,  bg:"bg-red-100",     text:"text-red-600",    border:"border-red-200"     },
  longoverdue: { label:"ค้างชำระนาน",  icon:AlertCircle,  bg:"bg-red-200",     text:"text-red-700",    border:"border-red-300"     },
};

const getItemLabel = (item, selectedDate, type) => {
  const month = toThaiMonth(selectedDate);
  if (item.labels?.[selectedDate]) return item.labels[selectedDate];
  if (item.type === "discount") return "ส่วนลด";
  if (item.type === "rent")     return `ค่าเช่าห้อง เดือน${month}`;
  if (item.type === "electric") return `ค่าไฟฟ้า เดือน${month} ${item.detail || ""}`;
  if (item.type === "water")    return `ค่าน้ำประปา เดือน${month} ${item.detail || ""}`;
  if (item.label)               return item.label;
  if (type === "asset" || item.type === "asset" || item.type === "damage") return item.label || "ค่าเสียหาย/ทรัพย์สิน";
  return "รายการอื่น ๆ";
};

const paymentToItems = (payment, selectedDate) => {
  const items = [];
  const month = toThaiMonth(selectedDate);
  if (payment.roomRate)
    items.push({ id: 1, type: "rent", amount: Number(payment.roomRate), labels: { [selectedDate]: `ค่าเช่าห้อง เดือน${month}` } });
  if (payment.electricalCost)
    items.push({ id: 2, type: "electric", amount: Number(payment.electricalCost), detail: payment.note?.match(/ไฟ:[^|]*/)?.[0]?.trim() ?? "", labels: {} });
  if (payment.waterCost)
    items.push({ id: 3, type: "water", amount: Number(payment.waterCost), detail: payment.note?.match(/น้ำ:[^|]*/)?.[0]?.trim() ?? "", labels: {} });
  if (payment.internetCost)
    items.push({ id: 4, type: "other", label: "ค่าอินเทอร์เน็ต", amount: Number(payment.internetCost), labels: {} });
  if (payment.laundryCost)
    items.push({ id: 5, type: "other", label: "ค่าซักรีด", amount: Number(payment.laundryCost), labels: {} });
  if (payment.furnitureCost)
    items.push({ id: 6, type: "asset", label: "ค่าทรัพย์สิน/เฟอร์นิเจอร์", amount: Number(payment.furnitureCost), labels: {} });
  if (payment.additionalCost)
    items.push({ id: 7, type: "other", label: payment.additionalDetail || "รายการเพิ่มเติม", amount: Number(payment.additionalCost), labels: {} });
  if (payment.discountCost)
    items.push({ id: 8, type: "discount", label: payment.discountDetail || "ส่วนลด", amount: -Number(payment.discountCost), labels: {} });
  return items;
};

const generateResultToItems = (result, selectedDate) => {
  const items = [];
  const month = toThaiMonth(selectedDate);
  if (result.roomRate)
    items.push({ id: 1, type: "rent", amount: Number(result.roomRate), labels: { [selectedDate]: `ค่าเช่าห้อง เดือน${month}` } });
  if (result.electricalCost) {
    const detail = result.calculationNote?.match(/ไฟ:[^|]*/)?.[0]?.trim() ?? "";
    items.push({ id: 2, type: "electric", amount: Number(result.electricalCost), detail, labels: {} });
  }
  if (result.waterCost) {
    const detail = result.calculationNote?.match(/น้ำ:[^|]*/)?.[0]?.trim() ?? "";
    items.push({ id: 3, type: "water", amount: Number(result.waterCost), detail, labels: {} });
  }
  if (result.internetCost)
    items.push({ id: 4, type: "other", label: "ค่าอินเทอร์เน็ต", amount: Number(result.internetCost), labels: {} });
  if (result.laundryCost)
    items.push({ id: 5, type: "other", label: "ค่าซักรีด", amount: Number(result.laundryCost), labels: {} });
  return items;
};

const itemsToPayload = (items) => {
  const payload = {
    roomRate: 0, electricalCost: 0, waterCost: 0,
    internetCost: 0, laundryCost: 0, furnitureCost: 0,
    discountCost: 0, discountDetail: null,
    additionalCost: 0, additionalDetail: null,
  };
  const additionalItems = [];
  let additionalTotal = 0;
  let furnitureTotal = 0; 
  
  items.forEach((item) => {
    const amountNum = Number(item.amount) || 0;
    switch (item.type) {
      case "rent":     payload.roomRate       = amountNum; break;
      case "electric": payload.electricalCost = amountNum; break;
      case "water":    payload.waterCost      = amountNum; break;
      case "asset":    
      case "damage":   furnitureTotal += amountNum; break;
      case "discount":
        payload.discountCost   = Math.abs(amountNum);
        payload.discountDetail = (item.label || "ส่วนลด").substring(0, 100);
        break;
      default:
        additionalTotal += amountNum;
        if (item.label) additionalItems.push(`${item.label} (${amountNum.toLocaleString()} บาท)`);
    }
  });

  payload.furnitureCost = furnitureTotal;
  if (additionalTotal !== 0) {
    payload.additionalCost   = additionalTotal;
    let detailString = additionalItems.join(", ");
    if (detailString.length > 200) detailString = detailString.substring(0, 197) + "...";
    payload.additionalDetail = detailString || null;
  }
  return payload;
};

/* ── Component ────────────────────────────────────────────────── */
const BillDetail = ({
  mode, initialData, type = "bill", checkoutMode,
  showAddBtn = true, showDiscountBtn = true, showSaveBtn = true,
  showPdfBtn = true, showSendBtn = true, onDataChange, onSave,
  // ✨ Props ใหม่: รับ roomId และ selectedDate จากภายนอกสำหรับ checkout mode
  externalRoomId, externalSelectedDate,
}) => {
  const navigate       = useNavigate();
  const { roomNumber } = useParams();
  const location       = useLocation();
  const isFromRoomMap  = mode === "room-map" || location.state?.from === "room-map";
  const backPath       = location.state?.backTo ?? "/billings";

  const [selectedDate,  setSelectedDate]  = useState(
    externalSelectedDate || new Date().toISOString().slice(0, 7)
  );
  const [items,         setItems]         = useState(initialData || []);
  const [editingId,     setEditingId]     = useState(null);
  const [form,          setForm]          = useState({ label: "", amount: 0 });
  const [isLoading,     setIsLoading]     = useState(mode !== "checkout" && !initialData?.length);
  const [isSaving,      setIsSaving]      = useState(false);
  const [isConfirmPay,  setIsConfirmPay]  = useState(false);
  const [roomId,        setRoomId]        = useState(externalRoomId ?? null); 
  const [contractId,    setContractId]    = useState(null);
  const [paymentId,     setPaymentId]     = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [loadError,     setLoadError]     = useState("");
  const [paymentDueEnd, setPaymentDueEnd] = useState(null);
  const [penaltyPerDay, setPenaltyPerDay] = useState(null);
  const [penaltyInfo,   setPenaltyInfo]   = useState(null);
  const [showPenaltyBanner, setShowPenaltyBanner] = useState(false);
  const [showConstantModal, setShowConstantModal] = useState(false);
  const [constants,         setConstants]         = useState([]);
  const [isLoadingConst,    setIsLoadingConst]    = useState(false);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paidAmountInput,  setPaidAmountInput]  = useState(0);

  const [latestMeter, setLatestMeter] = useState({ electricityUnit: 0, waterUnit: 0 });
  const [utilityRates, setUtilityRates] = useState({ electric: 0, water: 0 });
  const [newMeters, setNewMeters] = useState({ electric: "", water: "" });

  // ✨ sync externalRoomId เมื่อ prop เปลี่ยน (กรณี checkout mode ส่ง roomId มาทีหลัง)
  useEffect(() => {
    if (externalRoomId != null) setRoomId(externalRoomId);
  }, [externalRoomId]);

  // ✨ โหลด latestMeter ทันทีเมื่อ roomId พร้อม (ครอบคลุม checkout mode ด้วย)
  useEffect(() => {
    if (!roomId) return;
    const fetchMeters = async () => {
      try {
        const { data: meters } = await axios.get("http://localhost:5252/UtilityMeters");
        const roomMeters = meters
          .filter(m => m.roomId === roomId)
          .sort((a, b) => new Date(b.recordDate) - new Date(a.recordDate));
        if (roomMeters.length > 0) {
          setLatestMeter({
            electricityUnit: roomMeters[0].electricityUnit,
            waterUnit: roomMeters[0].waterUnit,
          });
        }
      } catch (e) { console.error("Meter fetch error", e); }
    };
    fetchMeters();
  }, [roomId]);

  const loadConstants = useCallback(async () => {
    // ✨ โหลด constants + utilityRates เสมอเมื่อ modal เปิด
    setIsLoadingConst(true);
    try {
      const all = await constantService.getConstants();
      const elecRate  = all.find(c =>
        c.category?.toLowerCase() === "utility" &&
        (c.subject?.includes("ไฟ") || c.subject?.includes("ElectricityBill"))
      )?.cost;
      const waterRate = all.find(c =>
        c.category?.toLowerCase() === "utility" &&
        (c.subject?.includes("น้ำ") || c.subject?.includes("WaterBill"))
      )?.cost;
      setUtilityRates({ electric: Number(elecRate) || 0, water: Number(waterRate) || 0 });
      setConstants(all.filter((c) => c.category?.toLowerCase() !== "utility"));
    } catch (err) { console.error("โหลด Constants ไม่สำเร็จ", err); }
    finally { setIsLoadingConst(false); }
  }, []); // ✨ ไม่มี dependency เพื่อให้โหลดใหม่ได้ทุกครั้ง

  const loadBillData = useCallback(async () => {
    if (mode === "checkout" || initialData?.length) return;
    setIsLoading(true);
    setLoadError("");
    try {
      const [year, month] = selectedDate.split("-").map(Number);
      const [allRooms, allContracts, apartment, allConstants] = await Promise.all([
        roomService.getRoomOverview(),
        contractService.getAllContracts(),
        apartmentService.getApartment(1).catch(() => null),
        constantService.getConstants().catch(() => []),
      ]);
      setPaymentDueEnd(apartment?.paymentDueEnd ?? null);
      const penaltyConst = allConstants.find((c) => c.category?.toLowerCase() === "penalty");
      setPenaltyPerDay(penaltyConst?.cost ?? null);

      const rawRooms   = Array.isArray(allRooms) ? allRooms : (allRooms?.$values ?? []);
      const targetRoom = rawRooms.find((r) => String(r.roomNumber) === String(roomNumber));
      if (!targetRoom) { setLoadError("ไม่พบข้อมูลห้องค่ะ"); return; }
      
      const rId = targetRoom.roomId || targetRoom.id;
      setRoomId(rId);

      const contract = allContracts.find((c) => Number(c.roomId) === Number(rId) && (c.status === "Active" || c.status === "Reserved"));
      if (!contract) { setLoadError("ห้องนี้ไม่มีสัญญา Active หรือ Reserved ค่ะ"); return; }
      setContractId(contract.id);

      const payments = await paymentService.getPaymentsByContract(contract.id);
      const existing = payments.find((p) => {
        const d = new Date(p.recordDate);
        return d.getFullYear() === year && (d.getMonth() + 1) === month;
      });

      if (existing) {
        setPaymentId(existing.id);
        setPaymentStatus(existing.status?.toLowerCase() ?? "unpaid");
        setItems(paymentToItems(existing, selectedDate));
      } else {
        const result = await paymentService.generatePayment(contract.id, year, month);
        setItems(generateResultToItems(result, selectedDate));
        setPaymentId(null);
        setPaymentStatus(null);
      }
    } catch (err) { setLoadError("โหลดข้อมูลไม่สำเร็จค่ะ"); }
    finally { setIsLoading(false); }
  }, [roomNumber, selectedDate, mode, initialData]);

  useEffect(() => { loadBillData(); }, [loadBillData]);
  useEffect(() => { if (initialData) setItems(initialData); }, [initialData]);
  useEffect(() => { if (onDataChange) onDataChange(items); },  [items, onDataChange]);

  // ── helper: คำนวณหน่วยที่ใช้ (ตรงกับ Backend CalculateUsedUnit) ──────────
  // ถ้า current >= previous → diff ปกติ
  // ถ้า current < previous  → มิเตอร์วนรอบ: maxMeter คือ "9...9" ตามจำนวนหลักของ previous
  const calcUsedUnit = useCallback((previous, current) => {
    if (current >= previous) return current - previous;
    const digits   = String(previous).length;
    const maxMeter = Number("9".repeat(digits));
    return (maxMeter - previous) + current + 1;
  }, []);

  // ✨ คำนวณ preview ยอดไฟ/น้ำ แบบ real-time (ใช้แสดงใต้ช่อง input)
  const calcPreview = useMemo(() => {
    const calc = (oldUnit, newUnitStr, rate) => {
      if (newUnitStr === "" || isNaN(Number(newUnitStr))) return null;
      const newUnit = Number(newUnitStr);
      const diff    = calcUsedUnit(oldUnit, newUnit);
      return { diff, amount: diff * rate };
    };
    return {
      electric: calc(latestMeter.electricityUnit, newMeters.electric, utilityRates.electric),
      water:    calc(latestMeter.waterUnit,        newMeters.water,    utilityRates.water),
    };
  }, [newMeters, latestMeter, utilityRates, calcUsedUnit]);

  // ✨ เพิ่มทั้งไฟและน้ำใน transaction เดียว (กรอกอะไรจะถูก save อย่างนั้น)
  const handleAddBothUtilities = async () => {
    const hasElec  = newMeters.electric !== "";
    const hasWater = newMeters.water    !== "";

    if (!hasElec && !hasWater) {
      return alert("กรุณากรอกยอดมิเตอร์ไฟหรือน้ำอย่างน้อย 1 รายการ");
    }

    // ── คำนวณค่าแต่ละประเภท (ใช้ calcUsedUnit เดียวกับ Backend) ──────────
    const calcUnit = (oldUnit, newUnitStr) => {
      const newUnit = Number(newUnitStr);
      const diff    = calcUsedUnit(oldUnit, newUnit);
      return { newUnit, diff };
    };

    const elec  = hasElec  ? calcUnit(latestMeter.electricityUnit, newMeters.electric) : null;
    const water = hasWater ? calcUnit(latestMeter.waterUnit,        newMeters.water)    : null;

    // ── อัปเดต items ในบิล (แทนที่รายการเก่าถ้ามี) ───────────
    setItems(prev => {
      let next = [...prev];
      if (elec) {
        next = next.filter(i => i.type !== "electric");
        next.push({
          id: Date.now(),
          type: "electric",
          label: `ค่าไฟ เดือน ${toThaiMonth(selectedDate)}`,
          amount: elec.diff * utilityRates.electric,
          detail: `(มิเตอร์: ${latestMeter.electricityUnit} ➔ ${elec.newUnit} = ${elec.diff} หน่วย)`,
          labels: {},
        });
      }
      if (water) {
        next = next.filter(i => i.type !== "water");
        next.push({
          id: Date.now() + 1,
          type: "water",
          label: `ค่าน้ำ เดือน ${toThaiMonth(selectedDate)}`,
          amount: water.diff * utilityRates.water,
          detail: `(มิเตอร์: ${latestMeter.waterUnit} ➔ ${water.newUnit} = ${water.diff} หน่วย)`,
          labels: {},
        });
      }
      return next;
    });

    // ── บันทึก UtilityMeter 1 record รวม ──────────────────────
    try {
      const today = new Date().toISOString().split('T')[0];

      let checkoutSuffix = "";
      if (mode === "checkout" || checkoutMode) {
        checkoutSuffix = checkoutMode === "absconded" ? " (ผู้เช่าหนี)" : " (ย้ายออก)";
      }

      // Note ขึ้นต้นด้วย * เพื่อให้ bulk-upsert สร้าง record ใหม่แทนการ update ทับ
      const parts = [];
      if (elec)  parts.push("ไฟ");
      if (water) parts.push("น้ำ");
      const meterNote = `* อัปเดตมิเตอร์${parts.join("+")} จากหน้าออกบิล (เดือน ${toThaiMonth(selectedDate)})${checkoutSuffix}`;

      const meterPayload = [{
        RoomId:          roomId,
        RecordDate:      today,
        ElectricityUnit: elec  ? elec.newUnit  : latestMeter.electricityUnit,
        WaterUnit:       water ? water.newUnit : latestMeter.waterUnit,
        Note:            meterNote,
      }];
      await axios.post("http://localhost:5252/UtilityMeters/bulk-upsert", meterPayload);

      // อัปเดต latestMeter ใน state
      setLatestMeter(prev => ({
        electricityUnit: elec  ? elec.newUnit  : prev.electricityUnit,
        waterUnit:       water ? water.newUnit : prev.waterUnit,
      }));
      setNewMeters({ electric: "", water: "" });

      const added = parts.join(" และ ");
      alert(`คำนวณและบันทึกมิเตอร์${added} เรียบร้อยแล้ว`);
    } catch (err) {
      console.error(err);
      alert("เพิ่มลงบิลแล้ว แต่ไม่สามารถอัปเดตประวัติมิเตอร์ในฐานข้อมูลได้");
    }
  };

  const handleAddPenalty = () => {
    if (!penaltyInfo) return;
    setItems((prev) => {
      if (prev.some((i) => i.type === "penalty")) return prev;
      return [...prev, {
        id: Date.now(), type: "penalty",
        label:  `ค่าปรับชำระช้า ${penaltyInfo.overdueDays} วัน (${penaltyInfo.overdueDays} × ${Number(penaltyPerDay).toLocaleString()} บาท)`,
        amount: penaltyInfo.penaltyTotal, labels: {},
      }];
    });
    setShowPenaltyBanner(false);
  };

  const handleSave = async (currentItems, total) => {
    if (mode === "checkout") {
      if (onSave) onSave(currentItems, total);
      return;
    }
    if (!contractId) return alert("ไม่พบสัญญา");
    setIsSaving(true);
    try {
      const recordDate = new Date().toISOString().split("T")[0];
      const payload = { ...itemsToPayload(currentItems), contractId, recordDate, adminId: 2 };
      if (paymentId) await paymentService.updatePayment(paymentId, payload);
      else await paymentService.createPayment(payload);
      alert("บันทึกสำเร็จ");
      loadBillData();
    } catch (err) { alert("บันทึกไม่สำเร็จ"); }
    finally { setIsSaving(false); }
  };

  const openPaymentModal = () => {
    setPaidAmountInput(total);
    setShowPaymentModal(true);
  };

  const handleConfirmPayment = async () => {
    if (!paymentId) return;
    setIsConfirmPay(true);
    try {
      await paymentService.updatePaymentStatus(paymentId, "paid", Number(paidAmountInput));
      setPaymentStatus("paid");
      setShowPaymentModal(false);
      loadBillData();
    } catch (err) { alert("เกิดข้อผิดพลาด"); }
    finally { setIsConfirmPay(false); }
  };

  const addConstantItem = (constant) => {
    const isProperty = constant.category?.toLowerCase() === 'property';
    setItems((prev) => [...prev, {
      id: Date.now(), 
      type: isProperty ? "asset" : "other",
      label: constant.subject || "รายการอื่น",
      amount: Number(constant.cost ?? 0), labels: {}, constantId: constant.id,
    }]);
    setShowConstantModal(false);
  };

  const total = useMemo(() => items.reduce((sum, i) => sum + i.amount, 0), [items]);
  const startEdit = (item) => { setEditingId(item.id); setForm({ label: getItemLabel(item, selectedDate) || "", amount: item.amount || 0 }); };
  const saveEdit = (id) => { setItems((prev) => prev.map((i) => i.id === id ? { ...i, label: form.label, amount: form.amount } : i)); setEditingId(null); };
  const addItem = (t) => setItems((prev) => [...prev, { id: Date.now(), type: t, amount: 0, label: "" }]);
  const deleteItem = (id) => setItems((prev) => prev.filter((i) => i.id !== id));

  const statusCfg = paymentStatus ? (STATUS_CONFIG[paymentStatus] || STATUS_CONFIG.unpaid) : null;

  const groupedConstants = useMemo(() =>
    constants.reduce((groups, c) => {
      const cat = c.category?.toLowerCase() || "other";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(c);
      return groups;
    }, {}),
  [constants]);

  // ✨ ตรวจสอบว่าควรแสดงส่วนมิเตอร์หรือไม่
  // แสดงเมื่อ: มี roomId (ทั้ง normal และ checkout mode) และ mode ไม่ใช่ deposit
  const showMeterSection = !!roomId && type !== "deposit";

  /* ── Render ───────────────────────────────────────────────── */
  return (
    <>
      {mode !== "checkout" && (
        <>
          {isFromRoomMap ? (
            <RoomHeader roomNumber={roomNumber} />
          ) : (
            <div className="relative text-center mb-6">
              <ExitButton onClick={() => navigate(backPath)} className="absolute right-0 top-0" />
              <h1 className="text-2xl md:text-3xl font-bold mb-8 text-gray-800">
                การออกบิล ห้อง {roomNumber}
              </h1>
            </div>
          )}
          <div className="flex justify-center items-center gap-3 mb-6">
            <div className="flex items-center gap-4 flex-col md:flex-row">
              <span className="font-bold text-gray-600 shrink-0">รอบบิล</span>
              <CustomMonthPicker value={selectedDate} onChange={setSelectedDate} className="w-64" />
            </div>
          </div>
        </>
      )}

      {isLoading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-10 h-10 text-orange-400 animate-spin" />
          <p className="text-gray-500 font-bold animate-pulse">กำลังโหลดข้อมูลบิล...</p>
        </div>
      ) : loadError ? (
        <div className="py-24 flex flex-col items-center justify-center text-center bg-gray-50 rounded-[40px] border border-gray-200 mt-4 max-w-4xl mx-auto px-6">
          <p className="text-red-500 font-bold mb-4">{loadError}</p>
          <WhiteButton label="ลองใหม่" onClick={loadBillData} />
        </div>
      ) : items && items.length > 0 ? (
        <>
          {mode !== "checkout" && (
            <div className="flex justify-center mb-4 gap-2 flex-wrap">
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${paymentId ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-600"}`}>
                {paymentId ? "✓ บิลที่บันทึกแล้ว" : "Preview — ยังไม่ได้บันทึก"}
              </span>
              {paymentId && statusCfg && (() => {
                const Icon = statusCfg.icon;
                return (
                  <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}>
                    <Icon size={12} /> {statusCfg.label}
                  </span>
                );
              })()}
            </div>
          )}

          {showPenaltyBanner && penaltyInfo && mode !== "checkout" && paymentStatus !== "paid" && (
            <div className="max-w-4xl mx-auto mb-4 px-2">
              <div className="flex items-start justify-between gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl">
                <div className="flex items-start gap-3">
                  <AlertCircle size={20} className="text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-red-700 text-sm">เกินกำหนดชำระ {penaltyInfo.overdueDays} วัน</p>
                    <p className="text-red-500 text-xs mt-0.5">
                      ครบกำหนดวันที่ {penaltyInfo.dueDate.getDate()} —
                      ค่าปรับ {Number(penaltyPerDay).toLocaleString()} บาท/วัน =
                      <span className="font-black"> {penaltyInfo.penaltyTotal.toLocaleString()} บาท</span>
                      <span className="ml-1 text-gray-400">(admin แก้ไขได้หลังเพิ่มในบิล)</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={handleAddPenalty}
                    className="text-xs font-bold px-3 py-1.5 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all">
                    เพิ่มในบิล
                  </button>
                  <button onClick={() => setShowPenaltyBanner(false)} className="text-red-400 hover:text-red-600 p-1">
                    <X size={16} />
                  </button>
                </div>
              </div>
            </div>
          )}

          <BillTable
            roomNumber={roomNumber} items={items} editingId={editingId}
            form={form} setForm={setForm} selectedDate={selectedDate}
            setSelectedDate={setSelectedDate} getItemLabel={getItemLabel}
            startEdit={startEdit} saveEdit={saveEdit} deleteItem={deleteItem}
            total={total} addItem={addItem}
          />

          <div className="flex flex-col items-center w-full mt-6 gap-4">
            {(showAddBtn || showDiscountBtn || showSaveBtn) && (
              <div className="flex flex-col md:flex-row justify-center items-center gap-3 w-full">
                {showAddBtn && (
                  <WhiteButton label="เพิ่มรายการ" icon={Plus}
                    onClick={() => { loadConstants(); setShowConstantModal(true); }}
                    className="w-full md:w-auto flex items-center justify-center gap-2 py-2.5 px-6 rounded-xl font-bold !bg-blue-50 !text-blue-600 !border-blue-50 hover:!bg-blue-100" />
                )}
                {showDiscountBtn && (
                  <WhiteButton label="เพิ่มส่วนลด" icon={Minus}
                    onClick={() => addItem("discount")}
                    className="w-full md:w-auto flex items-center justify-center gap-2 py-2.5 px-6 rounded-xl font-bold !bg-red-50 !text-red-600 !border-red-50 hover:!bg-red-100" />
                )}
                {showSaveBtn && paymentStatus !== "paid" && (
                  <SaveButton label={isSaving ? "กำลังบันทึก..." : "บันทึก"}
                    className="w-full md:w-auto py-2.5 px-10"
                    onClick={() => handleSave(items, total)} disabled={isSaving} />
                )}
              </div>
            )}

            {(showPdfBtn || showSendBtn) && (
              <div className="flex flex-col md:flex-row justify-center items-center gap-3 w-full">
                {showPdfBtn && <OrangeButton label="บันทึกเป็น PDF" icon={Download} className="w-full md:w-auto px-8" />}
                {showSendBtn && <OrangeButton label="ส่งบิล" icon={Send} className="w-full md:w-auto px-8" />}
              </div>
            )}

            {paymentId && mode !== "checkout" && (
              <div className="flex justify-center w-full mt-2">
                {paymentStatus === "paid" ? (
                  <div className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-emerald-700 bg-emerald-50 border-2 border-emerald-200">
                    <CheckCircle2 size={18} /> ชำระเงินครบแล้วค่ะ
                  </div>
                ) : (
                  <button
                    onClick={openPaymentModal}
                    className="flex items-center gap-2 px-8 py-3 rounded-2xl font-bold text-white bg-emerald-500 hover:bg-emerald-600 transition-all shadow-md">
                    <CheckCircle2 size={16} /> ยืนยันรับชำระเงิน
                  </button>
                )}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="py-24 flex flex-col items-center justify-center text-center bg-gray-50 rounded-[40px] border border-gray-200 mt-4 max-w-4xl mx-auto px-6">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-gray-300 mb-6 border border-dashed border-gray-300">
            <Inbox size={48} />
          </div>
          <h3 className="text-xl font-black text-gray-500 mb-2">ไม่มีบิลค้างชำระ</h3>
          <p className="text-gray-400 text-sm mb-6 font-bold uppercase tracking-wider">
            ไม่พบรายการบิลสำหรับเดือน {toThaiMonth(selectedDate)}
          </p>
          <OrangeButton label="สร้างบิลใหม่" icon={Plus} onClick={() => addItem("rent")} />
        </div>
      )}

      {/* ── ✅ Constant Modal ───────────────────────────────────────────── */}
      {showConstantModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={() => setShowConstantModal(false)}>
          <div className="bg-white rounded-[40px] w-full max-w-2xl p-8 shadow-2xl max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-gray-800">เลือกรายการเพิ่มในบิล</h3>
              <button onClick={() => setShowConstantModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X size={24} strokeWidth={3} />
              </button>
            </div>
            
            <div className="overflow-y-auto flex-1 space-y-5 pr-1">

              {/* ✨ ส่วนมิเตอร์น้ำ-ไฟ: แสดงทั้ง normal และ checkout mode (เมื่อมี roomId) */}
              {showMeterSection && (
                <div className="space-y-3 mb-2">
                  <div className="flex items-center gap-2 mb-2 px-1">
                    <span className="text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-blue-100 text-blue-600 flex items-center gap-1">
                      <Zap size={14}/> คำนวณค่าน้ำ-ไฟจากมิเตอร์
                    </span>
                    {/* ✨ แสดง badge ประเภทการย้ายออก เพื่อให้ admin รู้ว่ากำลังบันทึกประเภทใด */}
                    {(mode === "checkout" || checkoutMode) && (
                      <span className={`text-xs font-black px-2.5 py-1 rounded-full flex items-center gap-1 ${
                        checkoutMode === "absconded"
                          ? "bg-red-100 text-red-600"
                          : "bg-orange-100 text-orange-600"
                      }`}>
                        {checkoutMode === "absconded" ? "* ผู้เช่าหนี" : "* ย้ายออก"}
                      </span>
                    )}
                  </div>

                  {/* ✨ แสดง note เตือนว่ามิเตอร์จะถูกบันทึกเป็นบรรทัดใหม่ใน checkout mode */}
                  {(mode === "checkout" || checkoutMode) && (
                    <div className="flex items-start gap-2 bg-yellow-50 border border-yellow-200 rounded-2xl px-4 py-3 mb-1">
                      <AlertCircle size={14} className="text-yellow-500 shrink-0 mt-0.5" />
                      <p className="text-[11px] font-bold text-yellow-700 leading-relaxed">
                        การบันทึกมิเตอร์ในขั้นตอนนี้จะสร้างรายการใหม่แยกออกจากบิลปกติ
                        เพื่อให้ระบุได้ว่าเป็นการย้ายออก
                      </p>
                    </div>
                  )}
                  
                  {/* ✨ Card รวม ไฟ + น้ำ กรอกพร้อมกัน กดปุ่มเดียว */}
                  <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
                    {/* ── ค่าไฟ ── */}
                    <div className="bg-orange-50 px-5 pt-5 pb-4 border-b border-orange-100">
                      <p className="text-sm font-black text-orange-700 mb-3">
                        ⚡ ค่าไฟฟ้า เดือน {toThaiMonth(selectedDate)}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap font-bold text-sm text-gray-600">
                        <span className="shrink-0">
                          ยอดเก่า: <span className="text-gray-800">{latestMeter.electricityUnit || 0}</span>
                        </span>
                        <span className="text-gray-300 shrink-0">→</span>
                        <input
                          type="number"
                          value={newMeters.electric}
                          onChange={e => setNewMeters(prev => ({ ...prev, electric: e.target.value }))}
                          className="w-28 px-3 py-1.5 rounded-xl border border-gray-200 font-black focus:outline-none focus:border-orange-400 bg-white"
                          placeholder="เลขใหม่"
                        />
                        <span className="text-orange-500 shrink-0">× {utilityRates.electric} ฿</span>
                      </div>
                      {/* preview ยอด */}
                      {calcPreview.electric && (
                        <p className="mt-2 text-xs font-black text-orange-600">
                          = {calcPreview.electric.diff} หน่วย →{" "}
                          <span className="text-orange-700">
                            {(calcPreview.electric.amount).toLocaleString()} บาท
                          </span>
                        </p>
                      )}
                    </div>

                    {/* ── ค่าน้ำ ── */}
                    <div className="bg-blue-50 px-5 pt-4 pb-4">
                      <p className="text-sm font-black text-blue-700 mb-3">
                        💧 ค่าน้ำประปา เดือน {toThaiMonth(selectedDate)}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap font-bold text-sm text-gray-600">
                        <span className="shrink-0">
                          ยอดเก่า: <span className="text-gray-800">{latestMeter.waterUnit || 0}</span>
                        </span>
                        <span className="text-gray-300 shrink-0">→</span>
                        <input
                          type="number"
                          value={newMeters.water}
                          onChange={e => setNewMeters(prev => ({ ...prev, water: e.target.value }))}
                          className="w-28 px-3 py-1.5 rounded-xl border border-gray-200 font-black focus:outline-none focus:border-blue-400 bg-white"
                          placeholder="เลขใหม่"
                        />
                        <span className="text-blue-500 shrink-0">× {utilityRates.water} ฿</span>
                      </div>
                      {/* preview ยอด */}
                      {calcPreview.water && (
                        <p className="mt-2 text-xs font-black text-blue-600">
                          = {calcPreview.water.diff} หน่วย →{" "}
                          <span className="text-blue-700">
                            {(calcPreview.water.amount).toLocaleString()} บาท
                          </span>
                        </p>
                      )}
                    </div>

                    {/* ── ปุ่มเพิ่มลงบิลครั้งเดียว ── */}
                    <div className="px-5 py-4 bg-white border-t border-gray-100 flex items-center justify-between gap-4">
                      {/* ยอดรวม preview */}
                      <div className="text-sm font-bold text-gray-500">
                        {(calcPreview.electric || calcPreview.water) ? (
                          <span>
                            รวม:{" "}
                            <span className="text-gray-800 font-black text-base">
                              {(
                                (calcPreview.electric?.amount ?? 0) +
                                (calcPreview.water?.amount    ?? 0)
                              ).toLocaleString()}
                            </span>{" "}
                            บาท
                          </span>
                        ) : (
                          <span className="text-gray-300">กรอกเลขมิเตอร์เพื่อคำนวณ</span>
                        )}
                      </div>
                      <button
                        onClick={handleAddBothUtilities}
                        disabled={!newMeters.electric && !newMeters.water}
                        className="shrink-0 px-6 py-2.5 bg-[#f3a638] text-white rounded-xl font-black shadow-md hover:bg-orange-500 transition-all text-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        <Plus size={16} /> เพิ่มลงบิล
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {isLoadingConst ? (
                <div className="py-12 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
                </div>
              ) : (
                Object.entries(groupedConstants).map(([category, catItems]) => {
                  const style = CATEGORY_STYLE[category] ?? CATEGORY_STYLE.other;
                  return (
                    <div key={category}>
                      <div className="flex items-center gap-2 mb-2 px-1">
                        <span className={`text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${style.badge} ${style.text}`}>
                          {CATEGORY_LABEL[category] ?? category}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {catItems.map((constant) => (
                          <button key={constant.id} onClick={() => addConstantItem(constant)}
                            className={`flex items-center justify-between p-4 rounded-2xl border-2 border-transparent ${style.bg} hover:border-[#f3a638] hover:shadow-sm transition-all text-left group`}>
                            <div className="flex-1 min-w-0">
                              <p className={`font-bold text-sm ${style.text} truncate`}>{constant.subject || "ไม่ระบุชื่อ"}</p>
                              {constant.note && <p className="text-[10px] text-gray-400 truncate mt-0.5">{constant.note}</p>}
                            </div>
                            <div className="ml-3 shrink-0 flex items-center gap-1">
                              <span className="text-sm font-black text-gray-700">{Number(constant.cost ?? 0).toLocaleString()}</span>
                              <span className="text-xs text-gray-400 font-medium">฿</span>
                              <Plus size={16} className="text-gray-300 group-hover:text-[#f3a638] transition-colors ml-1" />
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-100">
              <button onClick={() => { addItem(type === "asset" ? "damage" : "other"); setShowConstantModal(false); }}
                className="w-full py-3 rounded-2xl border-2 border-dashed border-gray-200 text-gray-500 font-bold text-sm hover:border-[#f3a638] hover:text-[#f3a638] transition-all flex items-center justify-center gap-2">
                <Plus size={16} /> เพิ่มรายการกำหนดเอง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ✅ Payment Confirmation Modal ───────────────────────── */}
      {showPaymentModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={() => !isConfirmPay && setShowPaymentModal(false)}
        >
          <div
            className="bg-white rounded-[32px] w-full max-w-sm p-8 shadow-2xl flex flex-col gap-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-black text-gray-800">ยืนยันรับชำระเงิน</h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                disabled={isConfirmPay}
                className="p-2 hover:bg-gray-100 rounded-full disabled:opacity-40"
              >
                <X size={20} strokeWidth={3} />
              </button>
            </div>

            <div className="bg-gray-50 rounded-2xl px-5 py-4 flex items-center justify-between">
              <span className="text-sm font-bold text-gray-500">ยอดรวมในบิล</span>
              <span className="text-lg font-black text-gray-800">
                {total.toLocaleString()} <span className="text-sm font-medium text-gray-400">บาท</span>
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-gray-600">
                ยอดที่รับจริง <span className="text-gray-400 font-medium">(admin แก้ไขได้)</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  value={paidAmountInput}
                  onChange={(e) => setPaidAmountInput(e.target.value)}
                  disabled={isConfirmPay}
                  className="w-full border-2 border-gray-200 focus:border-emerald-400 outline-none rounded-2xl px-5 py-3 text-right text-xl font-black text-gray-800 pr-16 disabled:opacity-60 transition-colors"
                />
                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">บาท</span>
              </div>

              {Number(paidAmountInput) !== total && (
                <p className={`text-xs font-bold px-1 ${Number(paidAmountInput) < total ? "text-red-500" : "text-blue-500"}`}>
                  {Number(paidAmountInput) < total
                    ? `⚠ ชำระน้อยกว่าบิล ${(total - Number(paidAmountInput)).toLocaleString()} บาท`
                    : `✦ ชำระเกินบิล ${(Number(paidAmountInput) - total).toLocaleString()} บาท`}
                </p>
              )}
            </div>

            <div className="flex gap-3 mt-1">
              <button
                onClick={() => setShowPaymentModal(false)}
                disabled={isConfirmPay}
                className="flex-1 py-3 rounded-2xl border-2 border-gray-200 font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-all"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleConfirmPayment}
                disabled={isConfirmPay || !paidAmountInput}
                className="flex-1 py-3 rounded-2xl font-bold text-white bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {isConfirmPay
                  ? <><Loader2 size={16} className="animate-spin" /> กำลังบันทึก...</>
                  : <><CheckCircle2 size={16} /> ยืนยัน</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BillDetail;