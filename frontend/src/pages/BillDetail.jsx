import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { createPortal } from "react-dom";
import { CustomMonthPicker, toThaiMonth } from "../components/DateController";
import BillTable from "../components/BillTable";
import RoomHeader from "../components/RoomHeader";
import { OrangeButton, ExitButton, WhiteButton, SaveButton } from "../components/ActionButtons";
import BillMonthlyPrintTemplate from "../components/BillMonthlyPrintTemplate";
import { Inbox, Download, Plus, Send, Minus, Loader2, X, CheckCircle2, AlertCircle, Clock, Zap } from "lucide-react";
import axios from "axios"; 

import { roomService }      from "../api/RoomApi";
import { contractService }  from "../api/ContractApi";
import { paymentService }   from "../api/PaymentApi";
import { constantService }  from "../api/ConstantApi";
import { apartmentService } from "../api/ApartmentApi";
import { tenantService }    from "../api/TenantApi"; 
import { adminService }     from "../api/AdminApi";   

const printStyles = `
  @media screen {
    #printable-area-detail { display: none !important; }
  }
  @media print {
    #root { display: none !important; }
    
    html, body {
      display: block !important;
      height: auto !important;
      min-height: 100% !important;
      overflow: visible !important;
      margin: 0 !important;
      padding: 0 !important;
      background-color: white !important;
    }

    #printable-area-detail {
      display: block !important;
      width: 100% !important;
    }
  }
`;

const extractArray = (res) => {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (res.$values) return res.$values;
  if (res.data && Array.isArray(res.data)) return res.data;
  if (res.data?.$values) return res.data.$values;
  return [];
};

const CATEGORY_STYLE = {
  service: { bg: "bg-blue-50", text: "text-blue-600", badge: "bg-blue-100" },
  facility: { bg: "bg-purple-50", text: "text-purple-600", badge: "bg-purple-100" },
  maintenance: { bg: "bg-yellow-50", text: "text-yellow-700", badge: "bg-yellow-100" },
  property: { bg: "bg-emerald-50", text: "text-emerald-600", badge: "bg-emerald-100" },
  other: { bg: "bg-gray-50", text: "text-gray-600", badge: "bg-gray-100" },
};
const CATEGORY_LABEL = { service:"บริการ", facility:"สิ่งอำนวยความสะดวก", maintenance:"ซ่อมบำรุง", property:"ทรัพย์สิน/เฟอร์นิเจอร์", other:"อื่นๆ" };

const STATUS_CONFIG = {
  paid: { label:"ชำระเงินแล้ว", icon:CheckCircle2, bg:"bg-emerald-100", text:"text-emerald-700", border:"border-emerald-200" },
  unpaid: { label:"รอชำระเงิน", icon:Clock, bg:"bg-gray-100", text:"text-gray-600", border:"border-gray-200" },
  overdue: { label:"ค้างชำระ", icon:AlertCircle, bg:"bg-red-100", text:"text-red-600", border:"border-red-200" },
  longoverdue: { label:"ค้างชำระนาน", icon:AlertCircle, bg:"bg-red-200", text:"text-red-700", border:"border-red-300" },
};

const getItemLabel = (item, selectedDate, type, rates, prevMeters) => {
  const month = toThaiMonth(selectedDate);
  if (item.labels?.[selectedDate]) return item.labels[selectedDate];
  if (item.type === "discount") return "ส่วนลด";
  if (item.type === "rent")     return `ค่าเช่าห้องพัก เดือน${month}`;

  if (item.type === "electric" || item.type === "water") {
    const baseName = item.type === "electric" ? "ค่าไฟ" : "ค่าประปา";
    const recordDateStr = item.meterDate || new Date().toLocaleDateString('th-TH', { year: 'numeric', month: '2-digit', day: '2-digit' });

    // 1. ตรวจสอบข้อมูลจาก Detail ก่อน (สำหรับการเพิ่มรายการใหม่ที่ยังไม่ได้บันทึก)
    const detailStr = item.detail || "";
    const unitMatch = detailStr.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/);
    const rateMatch = detailStr.match(/\*\s*([\d.]+)/);

    if (unitMatch && rateMatch) {
      return `${baseName} (วันที่จดมิเตอร์: ${recordDateStr}) (${unitMatch[1]} - ${unitMatch[2]}) * ${rateMatch[1]} บาท/หน่วย`;
    }

    // 2. หากไม่มี Detail (กรณีโหลดจากฐานข้อมูล) ให้ทำการคำนวณย้อนกลับจากจำนวนเงิน
    if (rates && prevMeters) {
      const rate = item.type === "electric" ? rates.electric : rates.water;
      const oldUnit = item.type === "electric" ? prevMeters.electricityUnit : prevMeters.waterUnit;
      
      if (rate > 0) {
        const usedUnits = item.amount / rate;
        const newUnit = Number((oldUnit + usedUnits).toFixed(2)); // คำนวณหายอดปัจจุบัน และป้องกันจุดทศนิยมเกิน
        
        // คืนค่ารูปแบบที่สมบูรณ์ โดยไม่ต้องพึ่งพาข้อมูลจาก Note
        return `${baseName} (วันที่จดมิเตอร์: ${recordDateStr}) (${oldUnit} - ${newUnit}) * ${rate} บาท/หน่วย`;
      }
    }

    return `${baseName} (วันที่จดมิเตอร์: ${recordDateStr})`;
  }

  if (item.label) return item.label;
  if (type === "asset" || item.type === "asset" || item.type === "damage") return item.label || "ค่าชำรุดเสียหาย/ทรัพย์สิน";
  return "รายการอื่น ๆ";
};

const parseUtilityRate = (note, typeStr) => {
  if (!note) return null;
  const match = note.match(new RegExp(`\\{${typeStr}:\\s*([\\d.]+)[^}]*\\}`));
  return match ? Number(match[1]) : null;
};

const parseDetailString = (detail, totalAmount, defaultLabel, type, isNegative = false) => {
  if (!detail) return [{ id: Math.random(), type, label: defaultLabel, amount: totalAmount * (isNegative ? -1 : 1), labels: {} }];
  const items = [];
  const itemRegex = /([^(]+)\(\s*([\d,]+)\s*฿\s*\)/g;
  let match, sum = 0;
  while ((match = itemRegex.exec(detail)) !== null) {
    const amt = Number(match[2].replace(/,/g, ''));
    sum += amt;
    items.push({ id: Math.random(), type, label: match[1].replace(/^[,\s]+/, '').trim(), amount: amt * (isNegative ? -1 : 1), labels: {} });
  }
  if (items.length === 0 || sum !== totalAmount) {
    return [{ id: Math.random(), type, label: detail, amount: totalAmount * (isNegative ? -1 : 1), labels: {} }];
  }
  return items;
};

const parseNoteToItems = (rawNote, tagType, itemType, isNegative = false) => {
  if (!rawNote) return [];
  const parsed = [];
  let match;
  const regex = new RegExp(`\\{${tagType}:\\s*([^}]+)\\}`, 'g');
  while ((match = regex.exec(rawNote)) !== null) {
    const content = match[1]; 
    let itemMatch, found = false;
    const itemRegex = /([^(]+)\(\s*([\d,]+)\s*฿\s*\)/g;
    while ((itemMatch = itemRegex.exec(content)) !== null) {
      found = true;
      parsed.push({ id: Math.random(), type: itemType, label: itemMatch[1].replace(/^[,\s]+/, '').trim(), amount: Number(itemMatch[2].replace(/,/g, '')) * (isNegative ? -1 : 1), labels: {} });
    }
    if (!found && content.trim()) {
      const numMatch = content.match(/([\d,]+)/);
      if (numMatch) parsed.push({ id: Math.random(), type: itemType, label: `${tagType} (จาก Note)`, amount: Number(numMatch[1].replace(/,/g, '')) * (isNegative ? -1 : 1), labels: {} });
    }
  }
  return parsed;
};

const paymentToItems = (payment, selectedDate) => {
  const items = [];
  const month = toThaiMonth(selectedDate);
  
  // แปลงวันที่แบบไทย
  const rDate = payment.recordDate || payment.RecordDate
    ? new Date(payment.recordDate || payment.RecordDate).toLocaleDateString('th-TH', { year: 'numeric', month: '2-digit', day: '2-digit' }) 
    : new Date().toLocaleDateString('th-TH', { year: 'numeric', month: '2-digit', day: '2-digit' });

  // ✨ ดักจับ Note ทุกชื่อที่ Backend อาจจะส่งมา (กันพลาด)
  const pNote = payment.calculationNote || payment.CalculationNote || payment.note || payment.Note || "";

  // ดึงตัวเลขและเพิ่มเข้าตาราง
  const rentVal = payment.roomRate || payment.RoomRate || 0;
  if (rentVal) items.push({ id: 1, type: "rent", amount: Number(rentVal), labels: { [selectedDate]: `ค่าเช่าห้องพัก เดือน${month}` } });
  
  const elecVal = payment.electricalCost || payment.ElectricalCost || 0;
  if (elecVal) items.push({ id: 2, type: "electric", amount: Number(elecVal), detail: pNote.match(/ไฟ:[^|]*/)?.[0]?.trim() ?? "", meterDate: rDate, labels: {} });
  
  const waterVal = payment.waterCost || payment.WaterCost || 0;
  if (waterVal) items.push({ id: 3, type: "water", amount: Number(waterVal), detail: pNote.match(/น้ำ:[^|]*/)?.[0]?.trim() ?? "", meterDate: rDate, labels: {} });
  
  const internetVal = payment.internetCost || payment.InternetCost || 0;
  if (internetVal) items.push({ id: 4, type: "internet", label: "ค่าอินเทอร์เน็ต", amount: Number(internetVal), labels: {} });
  
  const laundryVal = payment.laundryCost || payment.LaundryCost || 0;
  if (laundryVal) items.push({ id: 5, type: "laundry", label: "ค่าซักรีด", amount: Number(laundryVal), labels: {} });
  
  const assetVal = payment.furnitureCost || payment.FurnitureCost || 0;
  if (assetVal) items.push({ id: 6, type: "asset", label: "ค่าทรัพย์สิน/เฟอร์นิเจอร์", amount: Number(assetVal), labels: {} });
  
  const addVal = payment.additionalCost || payment.AdditionalCost || 0;
  const addDetail = payment.additionalDetail || payment.AdditionalDetail || "";
  if (Number(addVal) > 0) items.push(...parseDetailString(addDetail, Number(addVal), "รายการเพิ่มเติม", "other"));
  
  const discVal = payment.discountCost || payment.DiscountCost || 0;
  const discDetail = payment.discountDetail || payment.DiscountDetail || "";
  if (Number(discVal) > 0) items.push(...parseDetailString(discDetail, Number(discVal), "ส่วนลด", "discount", true));
  
  return items;
};

const generateResultToItems = (result, selectedDate) => {
  const items = [];
  const month = toThaiMonth(selectedDate);
  const rDate = new Date().toLocaleDateString('th-TH', { year: 'numeric', month: '2-digit', day: '2-digit' });

  // ✨ ดักจับ Note ตอนพรีวิวบิลใหม่ด้วยเช่นกัน
  const rNote = result.calculationNote || result.CalculationNote || result.note || result.Note || "";

  if (result.roomRate) items.push({ id: 1, type: "rent", amount: Number(result.roomRate), labels: { [selectedDate]: `ค่าเช่าห้องพัก เดือน${month}` } });
  if (result.electricalCost) {
    const detail = rNote.match(/ไฟ:[^|]*/)?.[0]?.trim() ?? "";
    items.push({ id: 2, type: "electric", amount: Number(result.electricalCost), detail, meterDate: rDate, labels: {} });
  }
  if (result.waterCost) {
    const detail = rNote.match(/น้ำ:[^|]*/)?.[0]?.trim() ?? "";
    items.push({ id: 3, type: "water", amount: Number(result.waterCost), detail, meterDate: rDate, labels: {} });
  }
  if (result.internetCost) items.push({ id: 4, type: "internet", label: "ค่าอินเทอร์เน็ต", amount: Number(result.internetCost), labels: {} });
  if (result.laundryCost) items.push({ id: 5, type: "laundry", label: "ค่าซักรีด", amount: Number(result.laundryCost), labels: {} });
  return items;
};

const itemsToPayload = (items, effectiveRates, latestMeter) => {
  const payload = { roomRate: 0, electricalCost: 0, waterCost: 0, internetCost: 0, laundryCost: 0, furnitureCost: 0, discountCost: 0, discountDetail: null, additionalCost: 0, additionalDetail: null, calculationNote: "", note: "" };
  const additionalItems = [], discountItems = [];
  let additionalTotal = 0, furnitureTotal = 0; 
  let calcNotes = [];
  
  items.forEach((item) => {
    const amountNum = Math.abs(Number(item.amount) || 0); 
    switch (item.type) {
      case "rent": payload.roomRate += amountNum; break;
      case "electric": 
        payload.electricalCost += amountNum; 
        let eDetail = item.detail;
        // ✨ สร้างข้อความมิเตอร์ยัดลง DB หากมันว่างอยู่
        if (!eDetail && effectiveRates && latestMeter) {
            const oldU = latestMeter.electricityUnit || 0;
            const rate = effectiveRates.electric || 1;
            if (rate > 0) {
                const used = amountNum / rate;
                const newU = Number((oldU + used).toFixed(2));
                eDetail = `(มิเตอร์: ${newU} - ${oldU} = ${used} หน่วย) * ${rate} ฿`;
            }
        }
        if (eDetail) calcNotes.push(eDetail.startsWith("ไฟ") ? eDetail : `ไฟ: ${eDetail}`);
        break;
      case "water": 
        payload.waterCost += amountNum; 
        let wDetail = item.detail;
        // ✨ สร้างข้อความมิเตอร์ยัดลง DB หากมันว่างอยู่
        if (!wDetail && effectiveRates && latestMeter) {
            const oldU = latestMeter.waterUnit || 0;
            const rate = effectiveRates.water || 1;
            if (rate > 0) {
                const used = amountNum / rate;
                const newU = Number((oldU + used).toFixed(2));
                wDetail = `(มิเตอร์: ${newU} - ${oldU} = ${used} หน่วย) * ${rate} ฿`;
            }
        }
        if (wDetail) calcNotes.push(wDetail.startsWith("น้ำ") ? wDetail : `น้ำ: ${wDetail}`);
        break;
      case "internet": payload.internetCost += amountNum; break;
      case "laundry": payload.laundryCost += amountNum; break;
      case "asset": case "damage": furnitureTotal += amountNum; break;
      case "discount":
        payload.discountCost += amountNum; 
        if (item.label) discountItems.push(`${item.label} (${amountNum.toLocaleString()}฿)`);
        break;
      default:
        additionalTotal += amountNum;
        if (item.label) additionalItems.push(`${item.label} (${amountNum.toLocaleString()}฿)`);
    }
  });
  
  payload.furnitureCost = furnitureTotal;
  if (additionalTotal > 0) {
    payload.additionalCost = additionalTotal;
    let detailString = additionalItems.join(", ");
    payload.additionalDetail = detailString.length > 200 ? detailString.substring(0, 197) + "..." : detailString;
  }
  if (payload.discountCost > 0) {
    let detailString = discountItems.join(", ");
    payload.discountDetail = detailString.length > 200 ? detailString.substring(0, 197) + "..." : detailString;
  }

  const finalNote = calcNotes.join(" | ");
  payload.calculationNote = finalNote;
  payload.note = finalNote;
  return payload;
};

/* ── Component ────────────────────────────────────────────────── */
const BillDetail = ({
  mode, initialData, type = "bill", checkoutMode,
  showAddBtn = true, showDiscountBtn = true, showSaveBtn = true,
  showPdfBtn = true, showSendBtn = true, onDataChange, onSave,
  externalRoomId, externalSelectedDate,
}) => {
  const navigate = useNavigate();
  const { roomNumber } = useParams();
  const location = useLocation();
  const isFromRoomMap = mode === "room-map" || location.state?.from === "room-map";
  const backPath = location.state?.backTo ?? "/billings";

  const [selectedDate, setSelectedDate] = useState(
    externalSelectedDate || new Date().toLocaleDateString('en-CA').slice(0, 7)
  );
  const [items, setItems] = useState(initialData || []);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ label: "", amount: 0 });
  const [isLoading, setIsLoading] = useState(mode !== "checkout" && !initialData?.length);
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingLine, setIsSendingLine] = useState(false); 
  const [isConfirmPay, setIsConfirmPay] = useState(false);
  const [roomId, setRoomId] = useState(externalRoomId ?? null); 
  const [contractId, setContractId] = useState(null);
  const [paymentId, setPaymentId] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [loadError, setLoadError] = useState("");
  
  const [penaltyPerDay, setPenaltyPerDay] = useState(null);
  const [penaltyInfo, setPenaltyInfo] = useState(null);
  const [showPenaltyBanner, setShowPenaltyBanner] = useState(false);
  const [showConstantModal, setShowConstantModal] = useState(false);
  const [constants, setConstants] = useState([]);
  const [isLoadingConst, setIsLoadingConst] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paidAmountInput, setPaidAmountInput] = useState(0);

  const [latestMeter, setLatestMeter] = useState({ electricityUnit: 0, waterUnit: 0 });
  const [effectiveRates, setEffectiveRates] = useState({ electric: 0, water: 0 });
  const [newMeters, setNewMeters] = useState({ electric: "", water: "" });
  const [pendingAutoAdd, setPendingAutoAdd] = useState(location.state?.autoAddItem || null);
  const [showAutoAddModal, setShowAutoAddModal] = useState(false);
  const [cycleDates, setCycleDates] = useState({ start: "", end: "" });

  const [apartmentInfo, setApartmentInfo] = useState(null);
  const [tenantInfo, setTenantInfo] = useState(null);
  const [adminInfo, setAdminInfo] = useState(null);

  const currentAdminId = localStorage.getItem("adminId") ? Number(localStorage.getItem("adminId")) : 1;

  const total = useMemo(() => 
    items.reduce((sum, i) => {
      const amt = Math.abs(Number(i.amount) || 0);
      return i.type === "discount" ? sum - amt : sum + amt;
    }, 0), 
  [items]);

  useEffect(() => { if (externalRoomId != null) setRoomId(externalRoomId); }, [externalRoomId]);

  const loadConstants = useCallback(async () => {
    setIsLoadingConst(true);
    try {
      const all = await constantService.getConstants();
      setConstants(all.filter((c) => c.category?.toLowerCase() !== "utility"));
    } catch (err) { console.error(err); } finally { setIsLoadingConst(false); }
  }, []);

  const loadBillData = useCallback(async () => {
    if (mode !== "checkout") setIsLoading(true);
    setLoadError("");
    try {
      const [year, month] = selectedDate.split("-").map(Number); 
      
      let apartment = null;
      try {
        const allApt = extractArray(await apartmentService.getAllApartment());
        apartment = allApt[0] || null;
        if (!apartment) apartment = await apartmentService.getApartment(1);
      } catch (e) {}
      if (apartment) setApartmentInfo(apartment);

      try { 
        const adm = await adminService.getAdmin(currentAdminId); 
        setAdminInfo(adm); 
      } catch(e){}

      const [allRooms, allContracts, allConstants] = await Promise.all([
        roomService.getRoomOverview(),
        contractService.getAllContracts(),
        constantService.getConstants().catch(() => [])
      ]);
      
      const penaltyConst = allConstants.find((c) => c.category?.toLowerCase() === "penalty");
      const penaltyRate = penaltyConst?.cost ?? 100;
      setPenaltyPerDay(penaltyRate);

      const startDay = apartment?.paymentDueStart || 1;
      const getValidDay = (y, m, d) => Math.min(d, new Date(y, m, 0).getDate());
      const prevMonth = month === 1 ? 12 : month - 1;
      const prevYear = month === 1 ? year - 1 : year;
      const cycleStartStr = `${String(getValidDay(prevYear, prevMonth, startDay)).padStart(2, '0')}/${String(prevMonth).padStart(2, '0')}/${prevYear + 543}`;
      const cycleEndStr = `${String(getValidDay(year, month, startDay)).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year + 543}`;
      setCycleDates({ start: cycleStartStr, end: cycleEndStr });

      const endDay = apartment?.paymentDueEnd || 5;
      const dueDate = new Date(year, month, endDay); 
      const today = new Date(); 
      today.setHours(0, 0, 0, 0);

      const rawRooms = extractArray(allRooms);
      const targetRoom = rawRooms.find((r) => String(r.roomNumber) === String(roomNumber));
      if (!targetRoom) { setLoadError("ไม่พบข้อมูลห้อง"); return; }
      
      const rId = targetRoom.roomId || targetRoom.id;
      setRoomId(rId);

      const contractStatusList = mode === "checkout" 
        ? ["active", "reserved", "expired", "terminated"] 
        : ["active", "reserved"];

      const contract = extractArray(allContracts).find((c) => 
        Number(c.roomId) === Number(rId) && contractStatusList.includes((c.status || "").toLowerCase())
      );
      
      if (!contract) { setLoadError("ห้องนี้ไม่มีสัญญา Active"); return; }
      setContractId(contract.id || contract.Id);
      
      const tId = contract.tenantId || contract.TenantId;
      if (tId) {
        try { const ten = await tenantService.getTenant(tId); setTenantInfo(ten); } catch(e) {}
      }

      const roomNote = targetRoom.roomNote || targetRoom.note || targetRoom.Note || "";
      const contractNote = contract.note || contract.Note || "";
      const priorityMeter = allConstants.find(c => c.subject === "priorityMeter");
      const priorityMode = priorityMeter?.note === "contract" ? "contract" : "constant";
      const elecRateConst = allConstants.find(c => c.category?.toLowerCase() === "utility" && (c.subject?.includes("ไฟ") || c.subject?.includes("ElectricityBill")))?.cost || 0;
      const waterRateConst = allConstants.find(c => c.category?.toLowerCase() === "utility" && (c.subject?.includes("น้ำ") || c.subject?.includes("WaterBill")))?.cost || 0;
      const customElec = parseUtilityRate(contractNote, "ค่าไฟ") ?? parseUtilityRate(roomNote, "ค่าไฟ");
      const customWater = parseUtilityRate(contractNote, "ค่าน้ำ") ?? parseUtilityRate(roomNote, "ค่าน้ำ");
      const effectiveElec = (priorityMode === "contract" && customElec !== null) ? customElec : Number(elecRateConst);
      const effectiveWater = (priorityMode === "contract" && customWater !== null) ? customWater : Number(waterRateConst);
      setEffectiveRates({ electric: effectiveElec, water: effectiveWater });

      const result = await paymentService.generatePayment(contract.id || contract.Id, year, month).catch(()=>({}));
      
      if (result) {
        setLatestMeter({
          electricityUnit: result.previousElectricUnit ?? 0,
          waterUnit: result.previousWaterUnit ?? 0
        });
      }

      if (mode !== "checkout") {
        const payments = extractArray(await paymentService.getPaymentsByContract(contract.id || contract.Id));
        const existing = payments.find((p) => {
          const d = p.recordDate ? new Date(p.recordDate) : null;
          return d && d.getFullYear() === year && (d.getMonth() + 1) === month;
        });

        if (existing) {
          setPaymentId(existing.id || existing.Id);
          setPaymentStatus(existing.status?.toLowerCase() ?? "unpaid");
          setItems(paymentToItems(existing, selectedDate));
        } else {
          const selectedMonthObj = new Date(year, month - 1, 1);
          const currentMonthObj = new Date(today.getFullYear(), today.getMonth(), 1);

          if (selectedMonthObj < currentMonthObj) {
            setLoadError("ไม่มีการออกบิลในเดือนนี้ (ไม่อนุญาตให้สร้างบิลย้อนหลัง)");
            setIsLoading(false);
            return;
          }

          if (result.calculationNote) {
            const eMatch = result.calculationNote.match(/ไฟ:\s*\(([\d.]+)-([\d.]+)\)\*([\d.]+)/);
            if (eMatch) {
              const cur = Number(eMatch[1]), prv = Number(eMatch[2]);
              const diff = cur >= prv ? cur - prv : (Number("9".repeat(String(prv).length)) - prv) + cur + 1;
              result.electricalCost = diff * effectiveElec;
              result.calculationNote = result.calculationNote.replace(/ไฟ:\s*\([\d.]+-[\d.]+\)\*[\d.]+/, `ไฟ: (มิเตอร์: ${cur} - ${prv} = ${diff} หน่วย) * ${effectiveElec} ฿`);
            }
            const wMatch = result.calculationNote.match(/น้ำ:\s*\(([\d.]+)-([\d.]+)\)\*([\d.]+)/);
            if (wMatch) {
              const cur = Number(wMatch[1]), prv = Number(wMatch[2]);
              const diff = cur >= prv ? cur - prv : (Number("9".repeat(String(prv).length)) - prv) + cur + 1;
              result.waterCost = diff * effectiveWater;
              result.calculationNote = result.calculationNote.replace(/น้ำ:\s*\([\d.]+-[\d.]+\)\*[\d.]+/, `น้ำ: (มิเตอร์: ${cur} - ${prv} = ${diff} หน่วย) * ${effectiveWater} ฿`);
            }
          }

          let newItems = generateResultToItems(result, selectedDate);
          if (!newItems.some(i => i.type === "rent")) {
            let rentAmt = Number(contract.monthlyRent || contract.MonthlyRent || 0);
            if (rentAmt <= 0) {
              const m = roomNote.match(/\{ค่าเช่า:\s*([\d,]+)฿?\}/);
              if (m) rentAmt = Number(m[1].replace(/,/g, ""));
            }
            if (rentAmt > 0) newItems.push({ id: Date.now()+1, type: "rent", amount: rentAmt, labels: { [selectedDate]: `ค่าเช่าห้อง เดือน${toThaiMonth(selectedDate)}` } });
          }
          const additionalServices = [...parseNoteToItems(roomNote, "ค่าบริการ", "other"), ...parseNoteToItems(contractNote, "ค่าบริการ", "other")];
          const additionalDiscounts = [...parseNoteToItems(roomNote, "ส่วนลด", "discount", true), ...parseNoteToItems(contractNote, "ส่วนลด", "discount", true)];
          setItems([...newItems, ...additionalServices, ...additionalDiscounts]);
          setPaymentId(null); setPaymentStatus(null);
        }

        if (today > dueDate && existing?.status?.toLowerCase() !== "paid") {
          const diffTime = today.getTime() - dueDate.getTime();
          const overdueDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          if (overdueDays > 0) {
             setPenaltyInfo({ dueDate, overdueDays, penaltyTotal: overdueDays * penaltyRate });
             setShowPenaltyBanner(true);
          }
        } else setShowPenaltyBanner(false);
      }

    } catch (err) { setLoadError("โหลดข้อมูลไม่สำเร็จ"); } finally { if (mode !== "checkout") setIsLoading(false); }
  }, [roomNumber, selectedDate, mode, initialData, currentAdminId]);

  useEffect(() => { loadBillData(); }, [loadBillData]);
  useEffect(() => { if (!isLoading && pendingAutoAdd && items.length > 0) setShowAutoAddModal(true); }, [isLoading, pendingAutoAdd, items]);
  useEffect(() => { if (initialData) setItems(initialData); }, [initialData]);
  useEffect(() => { if (onDataChange) onDataChange(items); }, [items, onDataChange]);

  const calcUsedUnit = useCallback((previous, current) => {
    if (current >= previous) return current - previous;
    const digits = String(previous).length;
    const maxMeter = Number("9".repeat(digits));
    return (maxMeter - previous) + current + 1;
  }, []);

  const handleAddBothUtilities = async () => {
    const hasElec = newMeters.electric !== "";
    const hasWater = newMeters.water !== "";
    if (!hasElec && !hasWater) return alert("กรุณากรอกยอดมิเตอร์ไฟหรือน้ำอย่างน้อย 1 รายการ");

    const calcUnit = (oldUnit, newUnitStr) => {
      const newUnit = Number(newUnitStr);
      return { newUnit, diff: calcUsedUnit(oldUnit, newUnit) };
    };
    const elec = hasElec ? calcUnit(latestMeter.electricityUnit, newMeters.electric) : null;
    const water = hasWater ? calcUnit(latestMeter.waterUnit, newMeters.water) : null;

    // ✨ จัดการวันที่แบบไทย
    const todayTH = new Date().toLocaleDateString('th-TH', { year: 'numeric', month: '2-digit', day: '2-digit' });

    setItems(prev => {
      let next = [...prev];
      if (elec) {
        next = next.filter(i => i.type !== "electric");
        next.push({ id: Date.now(), type: "electric", amount: elec.diff * effectiveRates.electric, detail: `(มิเตอร์: ${elec.newUnit} - ${latestMeter.electricityUnit} = ${elec.diff} หน่วย) * ${effectiveRates.electric} ฿`, meterDate: todayTH, labels: {} });
      }
      if (water) {
        next = next.filter(i => i.type !== "water");
        next.push({ id: Date.now() + 1, type: "water", amount: water.diff * effectiveRates.water, detail: `(มิเตอร์: ${water.newUnit} - ${latestMeter.waterUnit} = ${water.diff} หน่วย) * ${effectiveRates.water} ฿`, meterDate: todayTH, labels: {} });
      }
      return next;
    });

    // ... (โค้ดดึง try-catch ส่ง API ปล่อยไว้เหมือนเดิมครับ)

    try {
      const today = new Date().toLocaleDateString('en-CA');
      let checkoutSuffix = (mode === "checkout" || checkoutMode) ? (checkoutMode === "absconded" ? " (ผู้เช่าหนี)" : " (ย้ายออก)") : "";
      const parts = []; if (elec) parts.push("ไฟ"); if (water) parts.push("น้ำ");
      const meterNote = `* อัปเดตมิเตอร์${parts.join("+")} จากหน้าออกบิล (เดือน ${toThaiMonth(selectedDate)})${checkoutSuffix}`;

      const meterPayload = [{ 
        RoomId: roomId, 
        RecordDate: today, 
        ElectricityUnit: elec ? elec.newUnit : null,
        WaterUnit: water ? water.newUnit : null,
        Note: meterNote 
      }];
      
      await axios.post("https://apartment-management-system-zllm.onrender.com/UtilityMeters/bulk-upsert", meterPayload);
      
      setLatestMeter(prev => ({ 
        electricityUnit: elec ? elec.newUnit : prev.electricityUnit, 
        waterUnit: water ? water.newUnit : prev.waterUnit 
      }));
      setNewMeters({ electric: "", water: "" });
      alert(`คำนวณและบันทึกมิเตอร์${parts.join(" และ ")} เรียบร้อยแล้ว`);
    } catch (err) { alert("เพิ่มลงบิลแล้ว แต่ไม่สามารถอัปเดตประวัติมิเตอร์ในฐานข้อมูลได้"); }
  };

  const handleAddPenalty = () => {
    if (!penaltyInfo) return;
    setItems((prev) => {
      if (prev.some((i) => i.type === "penalty")) return prev;
      return [...prev, { id: Date.now(), type: "penalty", label: `ค่าปรับชำระช้า ${penaltyInfo.overdueDays} วัน`, amount: penaltyInfo.penaltyTotal, labels: {} }];
    });
    setShowPenaltyBanner(false);
  };

const handleSave = async (currentItems, totalAmt) => {
    if (mode === "checkout") { if (onSave) onSave(currentItems, totalAmt); return; }
    if (!contractId) return alert("ไม่พบสัญญา");
    
    setIsSaving(true);
    try {
      const now = new Date();
      const recordDate = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
      
      const payload = { 
        ...itemsToPayload(currentItems, effectiveRates, latestMeter), 
        contractId, 
        recordDate, 
        adminId: currentAdminId
      };

      if (paymentId) await paymentService.updatePayment(paymentId, payload);
      else await paymentService.createPayment(payload);
      
      alert("บันทึกสำเร็จ"); 
      loadBillData();
    } catch (err) { 
      // ... โค้ดเดิม
      console.error("Save Error:", err.response?.data || err);
      const errorMsg = err.response?.data?.message || err.response?.data || "ไม่ทราบสาเหตุ (ดูใน Console)";
      alert(`บันทึกไม่สำเร็จ: ${errorMsg}`); 
    } finally { 
      setIsSaving(false); 
    }
  };

  const handleSendLineNotify = async () => {
    if (!paymentId) {
      alert("กรุณากดบันทึกบิลก่อนส่งแจ้งเตือนให้ลูกบ้านค่ะ");
      return;
    }
    
    const confirmMsg = paymentStatus === "paid" 
      ? "ต้องการส่ง 'ใบเสร็จรับเงิน' ผ่าน LINE ให้ลูกบ้านใช่หรือไม่?" 
      : "ต้องการส่ง 'ใบแจ้งหนี้' ผ่าน LINE ให้ลูกบ้านใช่หรือไม่?";
      
    if (!window.confirm(confirmMsg)) return;

    setIsSendingLine(true);
    try {
      await paymentService.sendLineNotify(paymentId);
      alert("ส่งการ์ดข้อมูลทาง LINE สำเร็จ!");
    } catch (err) {
      alert(err.response?.data?.message || "เกิดข้อผิดพลาดในการส่ง LINE (ลูกบ้านอาจยังไม่ได้ผูก LINE)");
    } finally {
      setIsSendingLine(false);
    }
  };

  const openPaymentModal = () => { setPaidAmountInput(total); setShowPaymentModal(true); };

  const handleConfirmPayment = async () => {
    if (!paymentId) return;
    setIsConfirmPay(true);
    try {
      await paymentService.updatePaymentStatus(paymentId, "paid", Number(paidAmountInput));
      setPaymentStatus("paid"); setShowPaymentModal(false); loadBillData();
    } catch (err) { alert("เกิดข้อผิดพลาด"); } finally { setIsConfirmPay(false); }
  };

  const addConstantItem = (constant) => {
    const isProperty = constant.category?.toLowerCase() === 'property';
    setItems((prev) => [...prev, { id: Date.now(), type: isProperty ? "asset" : "other", label: constant.subject || "รายการอื่น", amount: Number(constant.cost ?? 0), labels: {}, constantId: constant.id }]);
    setShowConstantModal(false);
  };

  const confirmAutoAdd = async () => {
    const newItem = { id: Date.now(), type: pendingAutoAdd.type || "other", label: pendingAutoAdd.label, amount: Number(pendingAutoAdd.amount), labels: {} };
    const newItems = [...items, newItem];
    setItems(newItems); setShowAutoAddModal(false); setPendingAutoAdd(null);
    window.history.replaceState({}, document.title);
    await handleSave(newItems, newItems.reduce((sum, i) => sum + i.amount, 0));
  };

  const cancelAutoAdd = () => { setShowAutoAddModal(false); setPendingAutoAdd(null); window.history.replaceState({}, document.title); };
  
  const startEdit = (item) => { setEditingId(item.id); setForm({ label: getItemLabel(item, selectedDate) || "", amount: Math.abs(item.amount) || 0 }); };
  const saveEdit = (id) => { 
    setItems((prev) => prev.map((i) => {
      if (i.id === id) return { ...i, label: form.label, amount: form.amount * (i.type === "discount" ? -1 : 1) };
      return i;
    })); 
    setEditingId(null); 
  };
  const addItem = (t) => setItems((prev) => [...prev, { id: Date.now(), type: t, amount: 0, label: "" }]);
  const deleteItem = (id) => setItems((prev) => prev.filter((i) => i.id !== id));

  const statusCfg = paymentStatus ? (STATUS_CONFIG[paymentStatus] || STATUS_CONFIG.unpaid) : null;
  const groupedConstants = useMemo(() => constants.reduce((groups, c) => {
    const cat = c.category?.toLowerCase() || "other";
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(c); return groups;
  }, {}), [constants]);
  const showMeterSection = !!roomId && type !== "deposit";

  return (
    <>
      <style>{printStyles}</style>
      
      <div className="print:hidden w-full">
        {mode !== "checkout" && (
          <>
            {isFromRoomMap ? <RoomHeader roomNumber={roomNumber} /> : (
              <div className="relative text-center mb-6">
                <ExitButton onClick={() => navigate(backPath)} className="absolute right-0 top-0" />
                <h1 className="text-2xl md:text-3xl font-bold mb-8 text-gray-800">การออกบิล ห้อง {roomNumber}</h1>
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
            <p className="text-gray-400 font-bold mb-4">{loadError}</p>
            {loadError !== "ไม่มีการออกบิลในเดือนนี้ (ไม่อนุญาตให้สร้างบิลย้อนหลัง)" && (
               <WhiteButton label="ลองใหม่" onClick={loadBillData} />
            )}
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

            {showPenaltyBanner && penaltyInfo && mode !== "checkout" && paymentStatus !== "paid" && !items.some((i) => i.type === "penalty") && (
              <div className="max-w-4xl mx-auto mb-4 px-2 animate-in fade-in zoom-in duration-300">
                <div className="flex items-start justify-between gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl shadow-sm">
                  <div className="flex items-start gap-3">
                    <AlertCircle size={20} className="text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-red-700 text-sm">เกินกำหนดชำระ {penaltyInfo.overdueDays} วัน</p>
                      <p className="text-red-500 text-xs mt-0.5">
                        คิดค่าปรับ {Number(penaltyPerDay).toLocaleString()} บาท/วัน =
                        <span className="font-black text-red-600 text-sm ml-1">{(penaltyInfo.penaltyTotal).toLocaleString()} บาท</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={handleAddPenalty} className="text-xs font-bold px-3 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all shadow-sm">บวกค่าปรับ</button>
                    <button onClick={() => setShowPenaltyBanner(false)} className="text-red-400 hover:text-red-600 p-1"><X size={16} /></button>
                  </div>
                </div>
              </div>
            )}

            <BillTable
              roomNumber={roomNumber} items={items} editingId={editingId}
              form={form} setForm={setForm} selectedDate={selectedDate}
              setSelectedDate={setSelectedDate} 
              // 👇 แก้ไขบรรทัดนี้ ให้ส่งค่า effectiveRates และ latestMeter เข้าไปด้วย
              getItemLabel={(itm, d) => getItemLabel(itm, d, itm.type, effectiveRates, latestMeter)}
              startEdit={startEdit} saveEdit={saveEdit} deleteItem={deleteItem}
              total={total} addItem={addItem}
            />

            <div className="flex flex-col items-center w-full mt-6 gap-4">
              {(showAddBtn || showDiscountBtn || showSaveBtn) && (
                <div className="flex flex-col md:flex-row justify-center items-center gap-3 w-full">
                  {showAddBtn && (
                    <WhiteButton label="เพิ่มรายการ" icon={Plus} onClick={() => { loadConstants(); setShowConstantModal(true); }} className="w-full md:w-auto px-6 font-bold !bg-blue-50 !text-blue-600 hover:border-blue-400 hover:brightness-96" />
                  )}
                  {showDiscountBtn && (
                    <WhiteButton label="เพิ่มส่วนลด" icon={Minus} onClick={() => addItem("discount")} className="w-full md:w-auto px-6 font-bold !bg-red-50 !text-red-600 hover:border-red-400 hover:brightness-96"/>
                  )}
                  {showSaveBtn && paymentStatus !== "paid" && (
                    <SaveButton label={isSaving ? "กำลังบันทึก..." : "บันทึก"} className="w-full md:w-auto px-10" onClick={() => handleSave(items, total)} disabled={isSaving} />
                  )}
                </div>
              )}

              {(showPdfBtn || showSendBtn) && (
                <div className="flex flex-col md:flex-row justify-center items-center gap-3 w-full">
                  {showPdfBtn && <OrangeButton label="บันทึกเป็น PDF" icon={Download} onClick={() => window.print()} className="w-full md:w-auto px-8" />}
                  {showSendBtn && (
                    <OrangeButton 
                      label={isSendingLine ? "กำลังส่ง..." : "ส่งบิล"} 
                      icon={isSendingLine ? Loader2 : Send} 
                      onClick={handleSendLineNotify} 
                      disabled={isSendingLine || !paymentId}
                      className="w-full md:w-auto px-8" 
                    />
                  )}
                </div>
              )}

              {paymentId && mode !== "checkout" && (
                <div className="flex justify-center w-full mt-2">
                  {paymentStatus === "paid" ? (
                    <div className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-emerald-700 bg-emerald-50 border-2 border-emerald-200"><CheckCircle2 size={18} /> ชำระเงินครบแล้ว</div>
                  ) : (
                    <button onClick={openPaymentModal} className="flex items-center gap-2 px-8 py-3 rounded-2xl font-bold text-white bg-emerald-500 hover:bg-emerald-600"><CheckCircle2 size={16} /> ยืนยันรับชำระเงิน</button>
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="py-24 flex flex-col items-center justify-center text-center bg-gray-50 rounded-[40px] border border-gray-200 mt-4 max-w-4xl mx-auto px-6">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-gray-300 mb-6 border border-dashed border-gray-300"><Inbox size={48} /></div>
            <h3 className="text-xl font-black text-gray-500 mb-2">ไม่มีบิลค้างชำระ</h3>
            <OrangeButton label="สร้างบิลใหม่" icon={Plus} onClick={() => addItem("rent")} />
          </div>
        )}

        {showConstantModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setShowConstantModal(false)}>
            <div className="bg-white rounded-[40px] w-full max-w-2xl p-8 shadow-2xl max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-gray-800">เลือกรายการเพิ่มในบิล</h3>
                <ExitButton onClick={() => setShowConstantModal(false)} />
              </div>
              <div className="overflow-y-auto flex-1 space-y-5 pr-1">
                {showMeterSection && (
                  <div className="space-y-3 mb-2">
                    <div className="flex items-center gap-2 mb-2 px-1"><span className="text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-blue-100 text-blue-600 flex items-center gap-1"><Zap size={14}/> คำนวณค่าน้ำ-ไฟจากมิเตอร์</span></div>
                    <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
                      <div className="bg-orange-50 px-5 pt-5 pb-4 border-b border-orange-100">
                        <p className="text-sm font-black text-orange-700 mb-3">⚡ ค่าไฟฟ้า เดือน {toThaiMonth(selectedDate)}</p>
                        <div className="flex items-center gap-2 flex-wrap font-bold text-sm text-gray-600">
                          <span className="shrink-0">ยอดเก่า: <span className="text-gray-800">{latestMeter.electricityUnit || 0}</span></span>
                          <span className="text-gray-300 shrink-0">→</span>
                          <input type="number" value={newMeters.electric} onChange={e => setNewMeters(prev => ({ ...prev, electric: e.target.value }))} className="w-28 px-3 py-1.5 rounded-xl border border-gray-200 font-black focus:outline-none focus:border-orange-400 bg-white" placeholder="เลขใหม่"/>
                          <span className="text-orange-500 shrink-0">× {effectiveRates.electric} ฿</span>
                        </div>
                      </div>
                      <div className="bg-blue-50 px-5 pt-4 pb-4">
                        <p className="text-sm font-black text-blue-700 mb-3">💧 ค่าน้ำประปา เดือน {toThaiMonth(selectedDate)}</p>
                        <div className="flex items-center gap-2 flex-wrap font-bold text-sm text-gray-600">
                          <span className="shrink-0">ยอดเก่า: <span className="text-gray-800">{latestMeter.waterUnit || 0}</span></span>
                          <span className="text-gray-300 shrink-0">→</span>
                          <input type="number" value={newMeters.water} onChange={e => setNewMeters(prev => ({ ...prev, water: e.target.value }))} className="w-28 px-3 py-1.5 rounded-xl border border-gray-200 font-black focus:outline-none focus:border-blue-400 bg-white" placeholder="เลขใหม่"/>
                          <span className="text-blue-500 shrink-0">× {effectiveRates.water} ฿</span>
                        </div>
                      </div>
                      <div className="px-5 py-4 bg-white border-t border-gray-100 flex items-center justify-between gap-4">
                        <button onClick={handleAddBothUtilities} disabled={!newMeters.electric && !newMeters.water} className="shrink-0 px-6 py-2.5 bg-[#f3a638] text-white rounded-xl font-black shadow-md hover:bg-orange-500 transition-all text-sm disabled:opacity-40 flex items-center gap-2 ml-auto"><Plus size={16} /> เพิ่มลงบิล</button>
                      </div>
                    </div>
                  </div>
                )}
                {isLoadingConst ? (
                  <div className="py-12 flex items-center justify-center"><Loader2 className="w-8 h-8 text-orange-400 animate-spin" /></div>
                ) : (
                  Object.entries(groupedConstants).map(([category, catItems]) => {
                    const style = CATEGORY_STYLE[category] ?? CATEGORY_STYLE.other;
                    return (
                      <div key={category}>
                        <div className="flex items-center gap-2 mb-2 px-1"><span className={`text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${style.badge} ${style.text}`}>{CATEGORY_LABEL[category] ?? category}</span></div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {catItems.map((constant) => (
                            <button key={constant.id} onClick={() => addConstantItem(constant)} className={`flex items-center justify-between p-4 rounded-2xl border-2 border-transparent ${style.bg} hover:border-[#f3a638] hover:shadow-sm text-left group`}>
                              <div className="flex-1 min-w-0"><p className={`font-bold text-sm ${style.text} truncate`}>{constant.subject || "ไม่ระบุชื่อ"}</p></div>
                              <div className="ml-3 shrink-0 flex items-center gap-1"><span className="text-sm font-black text-gray-700">{Number(constant.cost ?? 0).toLocaleString()}</span><span className="text-xs text-gray-400 font-medium">฿</span><Plus size={16} className="text-gray-300 group-hover:text-[#f3a638] transition-colors ml-1" /></div>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              <div className="mt-6 pt-4 border-t border-gray-100">
                <button onClick={() => { addItem("other"); setShowConstantModal(false); }} className="w-full py-3 rounded-2xl border-2 border-dashed border-gray-200 text-gray-500 font-bold text-sm hover:border-[#f3a638] hover:text-[#f3a638] flex items-center justify-center gap-2"><Plus size={16} /> เพิ่มรายการกำหนดเอง</button>
              </div>
            </div>
          </div>
        )}

        {showPaymentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => !isConfirmPay && setShowPaymentModal(false)}>
            <div className="bg-white rounded-[32px] w-full max-w-sm p-8 shadow-2xl flex flex-col gap-5" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-black text-gray-800">ยืนยันรับชำระเงิน</h3>
                <ExitButton onClick={() => setShowPaymentModal(false)} />
              </div>
              
              <div className="bg-gray-50 rounded-2xl px-5 py-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-500">ยอดรวมในบิล</span>
                  <span className="text-lg font-black text-gray-800">{total.toLocaleString()} <span className="text-sm font-medium text-gray-400">บาท</span></span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-700">ยอดรับชำระจริง</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={paidAmountInput}
                      onChange={(e) => setPaidAmountInput(e.target.value)}
                      className="w-28 text-right text-lg font-black text-emerald-600 bg-white border-1 border-gray-200 rounded-xl px-2 py-1 focus:outline-none focus:border-emerald-400 transition-all"
                    />
                    <span className="text-sm font-medium text-gray-400">บาท</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-1">
                <button onClick={() => setShowPaymentModal(false)} className="flex-1 py-3 rounded-2xl border-2 border-gray-200 font-bold text-gray-600 hover:bg-gray-50">ยกเลิก</button>
                <button onClick={handleConfirmPayment} disabled={isConfirmPay} className="flex-1 py-3 rounded-2xl font-bold text-white bg-emerald-500 hover:bg-emerald-600 flex items-center justify-center gap-2">{isConfirmPay ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />} ยืนยัน</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {createPortal(
        <div id="printable-area-detail">
          <BillMonthlyPrintTemplate
            items={items.map(item => ({
              ...item,
              // 👇 แก้ไขบรรทัดนี้ ให้ส่งค่า effectiveRates และ latestMeter เข้าไปด้วยเช่นกัน
              label: getItemLabel(item, selectedDate, item.type, effectiveRates, latestMeter),
              detail: "" 
            }))}
            roomNumber={roomNumber}
            apartmentInfo={apartmentInfo}
            // ... (โค้ดส่วนอื่นคงไว้ตามเดิม)
            customerInfo={tenantInfo}
            contractInfo={{
              billId: paymentId ? `INV${paymentId.toString().padStart(6, '0')}` : `PRE${Date.now().toString().slice(-6)}`,
              cycleStart: cycleDates?.start,
              cycleEnd: cycleDates?.end,
            }}
            adminName={adminInfo ? `${adminInfo.firstName} ${adminInfo.lastName}` : "พนักงาน (Admin)"}
            total={total}
            billTitle={paymentStatus === "paid" ? "ใบเสร็จรับเงิน" : "ใบแจ้งหนี้"}
          />
        </div>,
        document.body
      )}
    </>
  );
};

export default BillDetail;