import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ShieldCheck, FileWarning, Inbox, ChevronDown,
  Printer, FileText, Loader2, X, CheckCircle2, 
  AlertTriangle, Edit3, Download, Send, Banknote, Zap, Box
} from "lucide-react";
import RoomHeader from "../components/RoomHeader";
import BillDetail from "./BillDetail";
import { toThaiDate, toThaiMonth } from "../components/DateController";
import { OrangeButton, WhiteButton } from "../components/ActionButtons";

import { contractService } from "../api/ContractApi";
import { paymentService }  from "../api/PaymentApi";
import { roomService }     from "../api/RoomApi";
import { constantService } from "../api/ConstantApi";

/* ── constants & helpers ──────────────────────────────────────── */
const extractArray = (res) => {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (res.$values) return res.$values;
  if (res.data && Array.isArray(res.data)) return res.data;
  if (res.data?.$values) return res.data.$values;
  return [];
};

const CATEGORY_STYLE = {
  service:     { bg: "bg-blue-50",   text: "text-blue-600",   badge: "bg-blue-100"   },
  facility:    { bg: "bg-purple-50", text: "text-purple-600", badge: "bg-purple-100" },
  maintenance: { bg: "bg-yellow-50", text: "text-yellow-700", badge: "bg-yellow-100" },
  property:    { bg: "bg-emerald-50", text: "text-emerald-600", badge: "bg-emerald-100" },
  other:       { bg: "bg-gray-50",   text: "text-gray-600",   badge: "bg-gray-100"   },
};

const STEPS = [
  { id: 1, label: "1. เคลียร์บิลค้างชำระ" },
  { id: 2, label: "2. ตรวจสอบทรัพย์สิน" },
  { id: 3, label: "3. ออกใบเสร็จย้ายออก" },
  { id: 4, label: "4. กรอกรายการคืนเงินประกัน" },
  { id: 5, label: "สรุป" },
];

/* ── sub-components ───────────────────────────────────────────── */
const StepNotice = ({ mode, currentStep }) => {
  const notices = {
    1: mode === "absconded" ? "บิลค่าเช่าค้างชำระ (จะถูกบันทึกเป็นหนี้สูญ)" : "กรุณาเคลียร์บิลค่าเช่าค้างชำระ ด้วยการชำระเงินหรือหักจากเงินประกัน",
    2: "กรุณาระบุรายการทรัพย์สินที่เสียหาย ยอดจะถูกคำนวณเข้า FurnitureCost ",
    4: "กรอกรายการเงินประกัน หากมีการคืนเงิน (ดึงข้อมูลอัตโนมัติจากสัญญา)",
  };
  if (!notices[currentStep]) return null;
  return (
    <div className={`p-2 rounded-xl mb-4 font-bold text-sm px-4 ${mode === "absconded" ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"}`}>
      {notices[currentStep]}
    </div>
  );
};

const EmptyState = ({ message }) => (
  <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-gray-200 rounded-[30px] mt-2">
    <p className="text-gray-400 font-bold text-lg">{message}</p>
  </div>
);

/* ── Checkout Confirm Modal ───────────────────────────────────── */
const CheckoutConfirmModal = ({
  mode, finalItems, deposits, onClose, onConfirm, isConfirming,
}) => {
  const total     = finalItems.reduce((s, i) => s + (Number(i.amount) || 0), 0);
  const depTotal  = deposits.reduce((s, d) => s + (Number(d.amount) || 0), 0);
  const net       = mode === "absconded" ? 0 : depTotal - total;
  const isRefund  = net >= 0;

  const [actualPaid, setActualPaid] = useState(Math.abs(net));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget && !isConfirming) onClose(); }}>
      <div className="bg-white rounded-[32px] w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
        <div className={`flex items-center justify-between px-7 py-5 rounded-t-[32px] ${mode === "absconded" ? "bg-red-500" : "bg-[#f3a638]"}`}>
          <h3 className="text-xl font-black text-white">
            {mode === "absconded" ? "ยืนยันบันทึกหนี้สูญ" : "ยืนยันการย้ายออก"}
          </h3>
          {!isConfirming && (
            <button onClick={onClose} className="text-white/80 hover:text-white">
              <X size={24} strokeWidth={3} />
            </button>
          )}
        </div>

        <div className="overflow-y-auto flex-1 px-7 py-5 space-y-5">
          <div>
            <p className="text-sm font-black text-gray-500 mb-3 uppercase tracking-wider">รายการที่ต้องชำระ</p>
            <div className="space-y-2">
              {finalItems.map((item) => (
                <div key={item.id} className="flex justify-between items-center bg-gray-50/80 rounded-2xl px-5 py-3 border border-gray-100">
                  <span className="text-sm font-bold text-gray-600 truncate mr-4">{item.label}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-black text-gray-800">{Number(item.amount).toLocaleString()}</span>
                    <span className="text-xs text-gray-400 font-bold">฿</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {mode !== "absconded" && deposits.length > 0 && (
            <div className="bg-blue-50/50 rounded-2xl px-5 py-4 border border-blue-100">
              <p className="text-[11px] font-black text-blue-500 mb-2 uppercase tracking-wider">เงินประกัน</p>
              {deposits.map((d) => (
                <div key={d.id} className="flex justify-between text-sm font-bold text-gray-600">
                  <span>{d.label}</span>
                  <span className="text-blue-600">{Number(d.amount).toLocaleString()} ฿</span>
                </div>
              ))}
            </div>
          )}

          <div className={`rounded-2xl px-5 py-4 ${isRefund ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
            <div className={`flex justify-between font-black text-lg ${isRefund ? "text-green-600" : "text-red-600"}`}>
              <span>{mode === "absconded" ? "รวมยอดหนี้สูญ" : isRefund ? "ยอดสุทธิที่ต้องคืนผู้เช่า" : "ยอดสุทธิที่ผู้เช่าต้องจ่ายเพิ่ม"}</span>
              <span>{Math.abs(net).toLocaleString()} ฿</span>
            </div>
          </div>

          {mode !== "absconded" && (
            <div className="bg-gray-100 p-6 rounded-[28px] border-2 border-dashed border-gray-200">
                <label className="text-sm font-black text-gray-600 flex items-center gap-2 mb-3 px-1">
                    <Banknote size={18} className="text-orange-500"/> ยอดเงินที่{isRefund ? 'จ่ายคืน' : 'รับชำระ'}จริง
                </label>
                <div className="relative">
                    <input 
                        type="number" 
                        value={actualPaid} 
                        onChange={(e) => setActualPaid(Number(e.target.value))}
                        disabled={isConfirming}
                        className="w-full py-4 px-6 rounded-2xl border-2 border-white focus:border-orange-400 outline-none text-2xl font-black text-gray-800 shadow-sm bg-white transition-all 
                                   [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        placeholder="0.00"
                    />
                    <span className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-gray-400">฿</span>
                </div>
                <p className="text-[10px] text-gray-400 font-bold mt-3 text-center uppercase tracking-wide">
                    {isRefund ? "* ยอดคืนเงินจะถูกบันทึกเป็นค่าติดลบในระบบบัญชี" : "* ตรวจสอบยอดเงินให้ถูกต้องก่อนกดยืนยัน"}
                </p>
            </div>
          )}

          <div className="flex items-start gap-2 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3">
            <AlertTriangle size={16} className="text-yellow-500 shrink-0 mt-0.5" />
            <p className="text-[11px] font-bold text-yellow-700 leading-relaxed">
              เมื่อกดยืนยัน ระบบจะปิดสัญญาและเปลี่ยนสถานะห้องเป็นว่างทันที ไม่สามารถย้อนกลับได้
            </p>
          </div>
        </div>

        <div className="flex gap-3 px-7 py-6 border-t border-gray-100">
          <button onClick={onClose} disabled={isConfirming} className="flex-1 py-3.5 rounded-2xl border-2 border-gray-200 font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-all">
            ยกเลิก
          </button>
          <button onClick={() => onConfirm(finalItems, actualPaid, isRefund)} disabled={isConfirming}
            className={`flex-1 py-3.5 rounded-2xl font-black text-white disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg ${mode === "absconded" ? "bg-red-500 hover:bg-red-600 shadow-red-100" : "bg-[#f3a638] hover:bg-orange-500 shadow-orange-100"}`}>
            {isConfirming ? <><Loader2 size={18} className="animate-spin" /> กำลังบันทึก...</> : <><CheckCircle2 size={18} /> ยืนยันย้ายออก</>}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Main Component ───────────────────────────────────────────── */
const CheckoutManager = () => {
  const { roomNumber } = useParams();
  const navigate = useNavigate();

  const [isLoading,      setIsLoading]      = useState(true);
  const [loadError,      setLoadError]      = useState("");
  const [contract,       setContract]       = useState(null);
  const [unpaidBills,    setUnpaidBills]    = useState([]);   
  const [currentMonthBill, setCurrentMonthBill] = useState(null); 
  const [roomId,         setRoomId]         = useState(null);
  const [contractId,     setContractId]     = useState(null);
  const [propertyConstants, setPropertyConstants] = useState([]);
  const [roomInfo,       setRoomInfo]       = useState(null); 

  const [mode,           setMode]           = useState("normal");
  const [currentStep,    setCurrentStep]    = useState(1);
  const [assets,         setAssets]         = useState([]);
  const [deposits,       setDeposits]       = useState([]);
  const [openBills,      setOpenBills]      = useState({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isConfirming,   setIsConfirming]   = useState(false);

  const [editedBillItems, setEditedBillItems] = useState([]);
  const [isEditStep3, setIsEditStep3] = useState(false);
  const [isEditStep4, setIsEditStep4] = useState(false);

  // ✨ selectedDate ของ CheckoutManager — ส่งต่อให้ BillDetail ใน checkout mode
  const checkoutSelectedDate = useMemo(
    () => new Date().toISOString().slice(0, 7),
    []
  );

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setLoadError("");
    try {
      const [allRoomsRes, allContractsRes, allConstantsRes] = await Promise.all([
        roomService.getRoomOverview(),
        contractService.getAllContracts(),
        constantService.getConstants().catch(() => [])
      ]);

      const allRooms = extractArray(allRoomsRes);
      const targetRoom = allRooms.find((r) => String(r.roomNumber) === String(roomNumber));
      if (!targetRoom) throw new Error("ไม่พบข้อมูลห้อง");
      setRoomId(targetRoom.roomId || targetRoom.id);
      setRoomInfo(targetRoom);

      const allContracts = extractArray(allContractsRes);
      const activeContract = allContracts.find((c) => {
        const cStatus = (c.status || c.Status || "").toLowerCase();
        return Number(c.roomId || c.RoomId) === Number(targetRoom.roomId || targetRoom.id) &&
               (cStatus === "active" || cStatus === "reserved" || cStatus === "expired");
      });
      
      if (!activeContract) {
        setContract(null);
        setIsLoading(false);
        return;
      }

      setContract(activeContract);
      setContractId(activeContract.id || activeContract.Id);

      const constants = extractArray(allConstantsRes);
      setPropertyConstants(constants.filter(c => c.category?.toLowerCase() === 'property'));

      const allPayments = extractArray(await paymentService.getPaymentsByContract(activeContract.id || activeContract.Id));

      const unpaid = allPayments.filter((p) => p.status?.toLowerCase() === "unpaid");
      setUnpaidBills(
        unpaid.map((p) => {
          // ✨ ดึง detail มิเตอร์มาจัดรูปแบบให้สวยงาม
          const getDetail = (noteStr, prefix) => {
            let d = noteStr?.match(new RegExp(`${prefix}:[^|]*`))?.[0]?.trim() || "";
            return d.replace(new RegExp(`${prefix}:\\s*`), "").replace(/\(มิเตอร์:\s*/, "(");
          };
          const elecDetail = getDetail(p.note, "ไฟ");
          const waterDetail = getDetail(p.note, "น้ำ");

          return {
            paymentId: p.id || p.Id,
            period:    p.recordDate?.slice(0, 7) ?? "",
            note:      p.note || "",
            details: [
              ...(p.roomRate       ? [{ label: "ค่าเช่าห้อง",      amount: Number(p.roomRate)       }] : []),
              ...(p.electricalCost ? [{ label: elecDetail ? `ค่าไฟฟ้า ${elecDetail}` : "ค่าไฟฟ้า",          amount: Number(p.electricalCost) }] : []),
              ...(p.waterCost      ? [{ label: waterDetail ? `ค่าน้ำประปา ${waterDetail}` : "ค่าน้ำประปา",        amount: Number(p.waterCost)      }] : []),
              ...(p.internetCost   ? [{ label: "ค่าอินเทอร์เน็ต",   amount: Number(p.internetCost)   }] : []),
              ...(p.laundryCost    ? [{ label: "ค่าซักรีด",          amount: Number(p.laundryCost)    }] : []),
              ...(p.additionalCost ? [{ label: p.additionalDetail || "รายการเพิ่มเติม", amount: Number(p.additionalCost) }] : []),
            ],
          };
        })
      );

      const now  = new Date();
      const curY = now.getFullYear();
      const curM = now.getMonth() + 1;
      const curBill = allPayments.find((p) => {
        const d = p.recordDate ? new Date(p.recordDate) : null;
        return d && d.getFullYear() === curY && d.getMonth() + 1 === curM;
      });
      
      if (curBill) {
        // ✨ ดึง detail มิเตอร์เหมือนกัน
        const getDetail = (noteStr, prefix) => {
          let d = noteStr?.match(new RegExp(`${prefix}:[^|]*`))?.[0]?.trim() || "";
          return d.replace(new RegExp(`${prefix}:\\s*`), "").replace(/\(มิเตอร์:\s*/, "(");
        };
        const elecDetail = getDetail(curBill.note, "ไฟ");
        const waterDetail = getDetail(curBill.note, "น้ำ");

        setCurrentMonthBill({
          paymentId: curBill.id || curBill.Id,
          note: curBill.note || "",
          items: [
            ...(curBill.roomRate       ? [{ id: "cm-rent",     label: "ค่าเช่าห้อง",     amount: Number(curBill.roomRate)       }] : []),
            ...(curBill.electricalCost ? [{ id: "cm-elec",     label: elecDetail ? `ค่าไฟฟ้า ${elecDetail}` : "ค่าไฟฟ้า",         amount: Number(curBill.electricalCost) }] : []),
            ...(curBill.waterCost      ? [{ id: "cm-water",    label: waterDetail ? `ค่าน้ำประปา ${waterDetail}` : "ค่าน้ำประปา",       amount: Number(curBill.waterCost)      }] : []),
            ...(curBill.internetCost   ? [{ id: "cm-inet",     label: "ค่าอินเทอร์เน็ต",  amount: Number(curBill.internetCost)   }] : []),
            ...(curBill.laundryCost    ? [{ id: "cm-laundry",  label: "ค่าซักรีด",         amount: Number(curBill.laundryCost)   }] : []),
            ...(curBill.additionalCost ? [{ id: "cm-add",      label: curBill.additionalDetail || "รายการเพิ่มเติม", amount: Number(curBill.additionalCost) }] : []),
          ],
        });
      }

      if (activeContract.deposit && Number(activeContract.deposit) > 0) {
        setDeposits([{
          id: "dep-main",
          label: "เงินประกัน",
          amount: Number(activeContract.deposit),
        }]);
      }

    } catch (err) {
      console.error(err);
      setLoadError(err.message || "โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setIsLoading(false);
    }
  }, [roomNumber]);

  useEffect(() => { loadData(); }, [loadData]);

  const defaultCombinedItems = useMemo(() => {
    return [
      ...unpaidBills.map((bill) => ({
        id: `unpaid-${bill.period}`,
        label: `ยอดค้างชำระเดือน ${toThaiMonth(bill.period)}`,
        amount: bill.details.reduce((s, i) => s + i.amount, 0),
      })),
      ...assets.map((a) => ({ ...a, id: `asset-${a.id}`, type: "asset" })), 
      ...(currentMonthBill?.items ?? []),
    ];
  }, [unpaidBills, assets, currentMonthBill]);

  useEffect(() => {
    setEditedBillItems(defaultCombinedItems);
  }, [defaultCombinedItems]);

  /* ── Logic ─────────────────────────────────────────────────── */
  const getContractDisplayStatus = useMemo(() => {
    if (!contract) return "-";
    if (contract.status === "Terminated") return "สิ้นสุดสัญญา";
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    if (contract.endDate) {
      const end = new Date(contract.endDate);
      end.setHours(0, 0, 0, 0);
      if (end < now || contract.status === "Expired") return "หมดสัญญาแล้ว (Expired)";
    }
    if (contract.status === "Active") return "Active";
    if (contract.status === "Reserved") return "จอง";
    return contract.status;
  }, [contract]);

  const togglePropertyDamage = (prop) => {
    setAssets(prev => {
      const exists = prev.find(a => a.constantId === prop.id);
      if (exists) return prev.filter(a => a.constantId !== prop.id);
      return [...prev, { 
        id: Date.now(), 
        constantId: prop.id, 
        label: `ค่าเสียหาย: ${prop.subject}`, 
        amount: Number(prop.cost || 0) 
      }];
    });
  };

  /* ── Confirm checkout ──────────────────────────────────────── */
const handleConfirmCheckout = async (finalConfirmedItems, actualPaidAmount, isRefund) => {
    setIsConfirming(true);
    try {
      // ✨ 1. แอบถาม Backend ก่อนว่าเลขมิเตอร์ล่าสุดของห้องนี้คืออะไร (ใช้ API ที่เราทำไว้)
      const now = new Date();
      const calcResult = await paymentService.generatePayment(contractId, now.getFullYear(), now.getMonth() + 1).catch(() => ({}));
      const finalElec = calcResult?.currentElectricUnit ?? null;
      const finalWater = calcResult?.currentWaterUnit ?? null;

      // ✨ 2. สิ้นสุดสัญญา พร้อมแนบเลขมิเตอร์สุดท้ายไปด้วย
      const cleanContract = {
        Id: Number(contractId),
        RoomId: Number(contract.roomId || contract.RoomId),
        TenantId: Number(contract.tenantId || contract.TenantId),
        Status: "Terminated",
        StartDate: contract.startDate || contract.StartDate,
        EndDate: contract.endDate || contract.EndDate,
        MonthlyRent: Number(contract.monthlyRent || contract.MonthlyRent || 0),
        Deposit: Number(contract.deposit || contract.Deposit || 0),
        InitialElectricUnit: contract.initialElectricUnit || contract.InitialElectricUnit || 0,
        InitialWaterUnit: contract.initialWaterUnit || contract.InitialWaterUnit || 0,
        
        FinalElectricUnit: finalElec,
        FinalWaterUnit: finalWater,
        
        Note: contract.Note || contract.note || null
      };
      await contractService.putContract(contractId, cleanContract);
      
      // 2. เคลียร์ห้องว่าง
      const cleanRoom = { 
        id: Number(roomId),
        number: String(roomInfo.roomNumber || roomInfo.Number || roomInfo.number),
        building: String(roomInfo.roomBuilding || roomInfo.Building || roomInfo.building || ""),
        floor: String(roomInfo.roomFloor || roomInfo.Floor || roomInfo.floor || "1"),
        status: "available", 
        note: roomInfo.note || roomInfo.Note || ""
      };
      await roomService.updateRoom(roomId, cleanRoom);

      // 3. บันทึกข้อมูลการเงิน
      // ✨ Note ขึ้นต้นด้วย * เพื่อให้ Payment รู้ว่าเป็นการย้ายออก/หนี
      const checkoutNote = mode === "absconded" ? "* (ผู้เช่าหนี)" : "* (ย้ายออก)";
      
      const propertyDamageTotal = finalConfirmedItems
        .filter(item => String(item.id).startsWith("asset-"))
        .reduce((sum, item) => sum + Number(item.amount), 0);

      // บันทึกบิลย้อนหลัง (unpaid bills)
      // ต้อง PUT (note) ก่อน แล้วค่อย PATCH (status) เพราะ Backend ปฏิเสธ PUT ถ้า status = paid แล้ว
      for (const bill of unpaidBills) {
        let paidAmount = 0;
        if (mode !== "absconded") {
          const billTotal = bill.details.reduce((s, i) => s + i.amount, 0);
          paidAmount = isRefund ? -Math.abs(billTotal) : billTotal;
        }
        const updatedNote = bill.note
          ? `${bill.note} ${checkoutNote}`
          : checkoutNote;

        // Step A: PUT — อัปเดต note (status ยังเป็น unpaid → ไม่ถูก reject)
        await paymentService.updatePayment(bill.paymentId, { note: updatedNote });

        // Step B: PATCH — เปลี่ยน status → paid + paidAmount
        await paymentService.updatePaymentStatus(bill.paymentId, "paid", paidAmount);
      }

      // ── บันทึกบิลเดือนปัจจุบัน ──────────────────────────────────────────
      // คำนวณยอดจาก editedBillItems (items ที่ผ่านการแก้ไขใน Step 3 แล้ว)
      // รวม: ค่าเช่า + ค่าไฟ/น้ำที่เพิ่งกรอก + ค่าเสียหายทรัพย์สิน
      {
        let paidAmount = 0;
        if (mode !== "absconded") {
          paidAmount = isRefund ? -Math.abs(actualPaidAmount) : actualPaidAmount;
        }
        const checkoutNoteStr = checkoutNote;

        // สร้าง payload จาก editedBillItems (items ใน Step 3)
        // แยกประเภทตาม type เพื่อใส่ใน field ที่ถูกต้องของ DB
        let roomRate = 0, electricalCost = 0, waterCost = 0;
        let internetCost = 0, laundryCost = 0, furnitureCostFromItems = 0;
        let additionalCost = 0; const additionalDetails = [];

        for (const item of finalConfirmedItems) {
          const amt = Number(item.amount) || 0;
          const lbl = item.label || "";
          const t   = item.type  || "";
          if (t === "rent"    || lbl.includes("ค่าเช่าห้อง"))    { roomRate        += amt; }
          else if (t === "electric" || lbl.includes("ค่าไฟ"))    { electricalCost  += amt; }
          else if (t === "water"    || lbl.includes("ค่าน้ำ"))    { waterCost       += amt; }
          else if (lbl.includes("อินเทอร์เน็ต"))                  { internetCost    += amt; }
          else if (lbl.includes("ซักรีด"))                        { laundryCost     += amt; }
          else if (t === "asset" || t === "damage" || lbl.includes("ทรัพย์สิน") || lbl.includes("เสียหาย")) {
            furnitureCostFromItems += amt;
          }
          else if (t === "discount") { /* ส่วนลด: ข้ามไม่นับใน additionalCost */ }
          else { additionalCost += amt; if (item.label) additionalDetails.push(item.label); }
        }

        // รวม furnitureCost จาก assets (Step 2) + items อื่นใน editedBillItems ที่เป็น asset
        const totalFurnitureCost = propertyDamageTotal > 0
          ? propertyDamageTotal
          : furnitureCostFromItems;

        const billNote = checkoutNoteStr;
        const today    = new Date().toISOString().split("T")[0];

        if (currentMonthBill) {
          // บิลมีอยู่แล้ว → PUT อัปเดต field + PATCH status
          // ส่งเฉพาะ field ที่มีค่า (>0) เพื่อไม่ให้ทับค่าเดิมด้วย 0
          const putPayload = { note: currentMonthBill.note ? `${currentMonthBill.note} ${billNote}` : billNote };
          if (roomRate        > 0) putPayload.roomRate        = roomRate;
          if (electricalCost  > 0) putPayload.electricalCost  = electricalCost;
          if (waterCost       > 0) putPayload.waterCost       = waterCost;
          if (internetCost    > 0) putPayload.internetCost    = internetCost;
          if (laundryCost     > 0) putPayload.laundryCost     = laundryCost;
          if (totalFurnitureCost > 0) putPayload.furnitureCost = totalFurnitureCost;
          if (additionalCost  > 0) {
            putPayload.additionalCost   = additionalCost;
            putPayload.additionalDetail = additionalDetails.join(", ") || null;
          }
          await paymentService.updatePayment(currentMonthBill.paymentId, putPayload);
          await paymentService.updatePaymentStatus(
            currentMonthBill.paymentId, "paid", paidAmount,
          );
        } else {
          // ยังไม่มีบิลเดือนนี้ → POST สร้างใหม่ พร้อม status paid ทันที
          await paymentService.createPayment({
            contractId,
            adminId:         2,
            recordDate:      today,
            status:          "paid",
            paidAmount,
            roomRate:        roomRate        || 0,
            electricalCost:  electricalCost  || 0,
            waterCost:       waterCost       || 0,
            internetCost:    internetCost    || 0,
            laundryCost:     laundryCost     || 0,
            furnitureCost:   totalFurnitureCost || 0,
            additionalCost:  additionalCost  || 0,
            additionalDetail: additionalDetails.join(", ") || null,
            note:            billNote,
          });
        }
      }

      setShowConfirmModal(false);
      alert(mode === "absconded" ? "บันทึกหนี้สูญเรียบร้อย" : "ยืนยันการย้ายออกและบันทึกการเงินเรียบร้อย");
      navigate("/rooms"); 
    } catch (err) {
      const detail = err?.response?.data;
      console.error("Checkout Error:", err.message, detail);
      const msg = typeof detail === "object"
        ? (detail?.message ?? JSON.stringify(detail))
        : (detail ?? err.message);
      alert(`เกิดข้อผิดพลาด: ${msg}`);
    } finally {
      setIsConfirming(false);
    }
  };

  const toggleBill = (period) => setOpenBills((prev) => ({ ...prev, [period]: !prev[period] }));
  const stepBadgeClass  = mode === "absconded" ? "bg-purple-100 text-purple-600" : "bg-blue-100 text-blue-600";
  const stepActiveClass = mode === "absconded" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700";

  /* ── Summary calculations ─────────────────────────────────── */
  const totalExpenses     = editedBillItems.reduce((s, i) => s + Number(i.amount), 0);
  const totalDeposit      = deposits.reduce((s, d) => s + Number(d.amount), 0);
  const netAmount         = mode === "absconded" ? 0 : totalDeposit - totalExpenses;
  const isRefund          = netAmount >= 0;
  const rowClass          = "flex justify-between text-sm border-b border-dashed border-gray-200 pb-2 py-2";

  /* ── Render ───────────────────────────────────────────────── */
  if (isLoading) {
    return (
      <div className="min-h-screen pb-10">
        <RoomHeader roomNumber={roomNumber} />
        <div className="py-32 flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-orange-400 animate-spin" />
          <p className="text-gray-500 font-bold animate-pulse">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-10">
      <RoomHeader roomNumber={roomNumber} />
      <div className="max-w-full mx-auto px-4">

        {/* Contract Summary */}
        <div className="bg-white w-full max-w-3xl mx-auto rounded-3xl p-4 md:p-6 border border-gray-200 shadow-sm mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex gap-4">
            <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-800 shrink-0">
              <FileText size={24} />
            </div>
            <div>
              <h3 className="font-black text-gray-800 text-sm md:text-base">รายละเอียดสัญญาเช่า</h3>
              <div className="text-xs md:text-sm text-gray-500 mt-1 font-bold">
                <p>วันสิ้นสุดสัญญา : {contract?.endDate ? toThaiDate(contract.endDate) : "-"}</p>
              </div>
            </div>
          </div>
          <span className={`px-4 py-1.5 text-xs font-black rounded-xl ${getContractDisplayStatus.includes("Expired") ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}`}>
            {getContractDisplayStatus}
          </span>
        </div>

        {/* Mode Switcher */}
        <div className="flex bg-gray-100 rounded-xl p-1 mb-4 max-w-2xl mx-auto">
          {[
            { key: "normal",    label: "ผู้เช่าย้ายออก", active: "bg-[#f3a638]" },
            { key: "absconded", label: "ผู้เช่าหนี",      active: "bg-[#d9534f]" },
          ].map(({ key, label, active }) => (
            <button key={key} onClick={() => setMode(key)}
              className={`flex-1 py-3 min-h-[48px] rounded-xl font-black text-sm md:text-base transition-all duration-300
                ${mode === key ? `${active} text-white shadow-md` : "text-gray-500 hover:text-gray-700"}`}>
              {label}
            </button>
          ))}
        </div>

        {/* Steps navigation */}
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {STEPS.map((step) => (
            <button key={step.id} onClick={() => setCurrentStep(step.id)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all
                ${currentStep === step.id ? stepActiveClass : "bg-gray-100 text-gray-400 hover:bg-gray-200"}`}>
              {step.label}
            </button>
          ))}
        </div>

        {/* Step Container */}
        <div className="md:border-[1.5px] md:border-blue-300 md:rounded-[40px] md:p-8 relative h-auto w-full max-w-5xl mx-auto">
          <hr className="md:hidden border-t border-gray-200 mb-6" />

          {currentStep !== 2 && (
            <div className="flex items-center gap-4 mb-2">
              <span className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg ${stepBadgeClass}`}>
                {currentStep}
              </span>
              <h2 className="text-xl font-black text-gray-800">
                {STEPS.find((s) => s.id === currentStep)?.label.split(". ")[1] || "สรุป"}
              </h2>
            </div>
          )}
          
          <StepNotice mode={mode} currentStep={currentStep} />

          {/* STEP 1: Bills */}
          {currentStep === 1 && (
            <div className="space-y-4">
              {unpaidBills.length === 0 ? <EmptyState message="ไม่มีบิลค้างชำระ" /> : 
                unpaidBills.map((billGroup) => (
                  <div key={billGroup.period} className="md:border md:border-gray-100 md:rounded-[24px] md:shadow-sm bg-white overflow-hidden border-b border-gray-300">
                    <div onClick={() => toggleBill(billGroup.period)} className="p-5 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="hidden md:flex w-10 h-10 bg-orange-100 rounded-full items-center justify-center text-orange-600 shrink-0"><Inbox size={20} /></div>
                        <div><p className="text-xs text-gray-400 font-bold uppercase tracking-wider">บิลค้างชำระเดือน</p><p className="font-black text-gray-800">{toThaiMonth(billGroup.period)}</p></div>
                      </div>
                      <div className="flex items-center gap-2 md:gap-6">
                        <div className="text-right"><p className="text-xs text-gray-500">ยอดค้างชำระรวม</p><p className="font-black text-orange-600 text-base md:text-lg">{billGroup.details.reduce((s, i) => s + i.amount, 0).toLocaleString()} ฿</p></div>
                        <ChevronDown className={`text-gray-400 transition-transform ${openBills[billGroup.period] ? "rotate-180" : ""}`} />
                      </div>
                    </div>
                    {openBills[billGroup.period] && (
                      <div className="p-0 md:px-5 md:pb-5 border-t border-dashed border-gray-200">
                        <div className="md:mt-4 mt-2">
                          <BillDetail
                            mode="checkout"
                            checkoutMode={mode}
                            showAddBtn={false}
                            showDiscountBtn={false}
                            showPdfBtn={false}
                            showSendBtn={false}
                            showSaveBtn={false}
                            initialData={billGroup.details.map((item, idx) => ({ ...item, id: `${billGroup.period}-${idx}` }))}
                            total={billGroup.details.reduce((s, i) => s + i.amount, 0)}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))
              }
            </div>
          )}

          {/* STEP 2: Property Check */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <span className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg ${stepBadgeClass}`}>2</span>
                  <h2 className="text-xl font-black text-gray-800">ตรวจสอบทรัพย์สินเสียหาย</h2>
                </div>
                <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-2xl font-bold text-sm">
                   <Box size={16}/> เลือกรายการที่พบความเสียหาย
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {propertyConstants.map((prop) => {
                  const isSelected = !!assets.find(a => a.constantId === prop.id);
                  const style = CATEGORY_STYLE.property;
                  
                  return (
                    <button
                      key={prop.id}
                      onClick={() => togglePropertyDamage(prop)}
                      className={`flex flex-col items-start p-5 rounded-3xl border-2 transition-all text-left relative group
                        ${isSelected 
                          ? "border-[#f3a638] bg-orange-50 shadow-md scale-[1.02]" 
                          : "border-gray-100 bg-white hover:border-gray-200"}`}
                    >
                      <div className="flex justify-between items-start w-full mb-3">
                        <div className={`p-2 rounded-xl ${isSelected ? "bg-orange-200 text-orange-700" : "bg-gray-100 text-gray-400"}`}>
                           <Box size={20} />
                        </div>
                        {isSelected && (
                          <div className="bg-[#f3a638] text-white rounded-full p-1 shadow-sm">
                            <CheckCircle2 size={16} strokeWidth={3} />
                          </div>
                        )}
                      </div>
                      
                      <p className={`font-black text-sm mb-1 ${isSelected ? "text-orange-900" : "text-gray-700"}`}>
                        {prop.subject}
                      </p>
                      <p className={`text-xs font-bold ${isSelected ? "text-orange-600" : "text-gray-400"}`}>
                         ค่าปรับ: {Number(prop.cost).toLocaleString()} ฿
                      </p>

                      {isSelected && (
                        <div className="absolute bottom-4 right-4 text-orange-400 opacity-50 group-hover:opacity-100 transition-opacity">
                          <Zap size={14} fill="currentColor" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {propertyConstants.length === 0 && (
                <EmptyState message="ไม่มีข้อมูลรายการทรัพย์สินพื้นฐานในระบบ" />
              )}
              
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-center">
                <p className="text-xs font-bold text-gray-400">
                  * หากมีรายการเสียหายอื่นที่ไม่อยู่ในรายการ สามารถเพิ่มได้ในขั้นตอนถัดไป (Step 3)
                </p>
              </div>
            </div>
          )}

          {/* STEP 3: Receipt */}
          {currentStep === 3 && (
            <div className="mt-4 space-y-4">
              {/* ✨ ส่ง externalRoomId และ checkoutMode ให้ BillDetail เพื่อให้ modal มิเตอร์ทำงานได้ */}
              <BillDetail
                mode="checkout"
                checkoutMode={mode}
                externalRoomId={roomId}
                externalSelectedDate={checkoutSelectedDate}
                initialData={editedBillItems}
                showAddBtn={isEditStep3}
                showDiscountBtn={isEditStep3}
                showSaveBtn={isEditStep3} 
                showPdfBtn={false}
                showSendBtn={false}
                onDataChange={(newData) => setEditedBillItems(newData)}
                onSave={() => setIsEditStep3(false)}
              />
              <div className="flex flex-col items-center gap-4 mt-2">
                {!isEditStep3
                  ? <WhiteButton label="แก้ไขรายการใบเสร็จ" icon={Edit3} onClick={() => setIsEditStep3(true)} className="px-10" />
                  : <button onClick={() => setIsEditStep3(false)} className="px-8 py-2.5 rounded-2xl border-2 border-gray-200 text-gray-500 font-bold hover:bg-gray-50 transition-all">ยกเลิกการแก้ไข</button>
                }
              </div>
            </div>
          )}

          {/* STEP 4: Deposit */}
          {currentStep === 4 && (
            <div className="space-y-4 mt-4">
              {/* ✨ ส่ง type="deposit" เพื่อซ่อนส่วนมิเตอร์ (ไม่ต้องแสดงใน deposit step) */}
              <BillDetail
                mode="checkout"
                type="deposit"
                initialData={deposits}
                showAddBtn={isEditStep4}
                showSaveBtn={isEditStep4}
                showDiscountBtn={false}
                showPdfBtn={false}
                showSendBtn={false}
                onDataChange={(newData) => setDeposits(newData)}
                onSave={() => setIsEditStep4(false)}
              />
              <div className="flex justify-center mt-2 mb-4">
                {!isEditStep4
                  ? <WhiteButton label="แก้ไขรายการเงินประกัน" icon={Edit3} onClick={() => setIsEditStep4(true)} className="px-10" />
                  : <button onClick={() => setIsEditStep4(false)} className="px-8 py-2.5 rounded-2xl border-2 border-gray-200 text-gray-500 font-bold hover:bg-gray-50 transition-all">ยกเลิกการแก้ไข</button>
                }
              </div>
              <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                <p className="text-sm text-blue-500 font-bold">* ยอดเงินประกันจะถูกนำไปหักลบกับยอดหนี้ในขั้นตอนสุดท้าย</p>
              </div>
            </div>
          )}

          {/* STEP 5: Summary */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div className={`md:rounded-2xl md:overflow-hidden md:border md:shadow-sm ${mode === "absconded" ? "md:border-red-300" : "md:border-gray-200"}`}>
                <div className={`py-3 rounded-t-xl text-center font-black text-lg text-white -mx-4 px-4 md:mx-0 ${mode === "absconded" ? "bg-red-500" : "bg-[#f3a638]"}`}>สรุปการ{mode === "absconded" ? "บันทึกผู้เช่าหนี" : "ย้ายออก"}</div>
                <div className="md:p-6 space-y-5 bg-gray-50/50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white md:rounded-[24px] md:border md:border-gray-200 md:p-5 shadow-sm">
                      <h3 className="text-base font-black text-blue-600 mb-3 flex items-center gap-2"><ShieldCheck size={18} /> เงินประกัน</h3>
                      {deposits.length === 0 ? <p className="text-sm text-gray-400 text-center py-4">ไม่มีรายการเงินประกัน</p> : 
                        deposits.map((dep) => (<div key={dep.id} className={rowClass}><span className="text-gray-600 font-bold">{dep.label}</span><span className="font-black text-gray-800">{Number(dep.amount).toLocaleString()} ฿</span></div>))
                      }
                      <div className="flex justify-between font-black text-blue-600 text-lg pt-1 border-t border-dashed border-gray-200 mt-2"><span>รวมเงินประกัน</span><span>{totalDeposit.toLocaleString()} ฿</span></div>
                    </div>
                    <div className="bg-white md:rounded-[24px] md:border md:border-gray-200 md:p-5 shadow-sm">
                      <h3 className="text-base font-black text-red-500 mb-3 flex items-center gap-2"><FileWarning size={18} /> ยอดค้างชำระทั้งหมด</h3>
                      {editedBillItems.map((item) => (<div key={item.id} className={rowClass}><span className="text-gray-600 font-bold">{item.label}</span><span className="font-black text-gray-800">{Number(item.amount).toLocaleString()} ฿</span></div>))}
                      <div className="flex justify-between font-black text-red-500 text-lg pt-1 border-t border-dashed border-gray-200 mt-2"><span>รวมยอดค้างชำระ</span><span>{totalExpenses.toLocaleString()} ฿</span></div>
                    </div>
                  </div>
                  {mode !== "absconded" && (
                    <div className={`p-6 md:p-8 text-center md:rounded-[24px] md:border border-t-4 ${isRefund ? "bg-green-50 border-t-green-400 border-green-200" : "bg-red-50 border-t-red-400 border-red-200"}`}>
                      <p className="text-gray-400 font-bold uppercase tracking-widest mb-1 text-sm">สรุปยอดสุทธิ</p>
                      <h2 className={`text-xl font-bold mt-2 ${isRefund ? "text-green-600" : "text-red-600"}`}>{isRefund ? "หอพักคืนเงินผู้เช่า" : "ผู้เช่าต้องชำระเพิ่ม"}</h2>
                      <p className={`text-2xl font-black mt-2 ${isRefund ? "text-green-600" : "text-red-600"}`}>{Math.abs(netAmount).toLocaleString()} บาท</p>
                    </div>
                  )}
                </div>
                <div className={`p-4 text-center font-black ${mode === "absconded" ? "md:bg-red-100 text-red-700" : isRefund ? "md:bg-green-100 text-green-700" : "md:bg-orange-100 text-orange-700"}`}>
                  {mode === "absconded"
                    ? `บันทึกหนี้สูญ ${totalExpenses.toLocaleString()} บาท`
                    : isRefund
                      ? `หอพักต้องคืนเงินผู้เช่า ${Math.abs(netAmount).toLocaleString()} บาท`
                      : `ผู้เช่าต้องชำระเงินเพิ่ม ${Math.abs(netAmount).toLocaleString()} บาท`
                  }
                </div>
              </div>
              <div className="flex justify-end">
                <OrangeButton
                  label={mode === "absconded" ? "ยืนยันบันทึกหนี้สูญ" : "ยืนยันการย้ายออก"}
                  onClick={() => setShowConfirmModal(true)}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {showConfirmModal && (
        <CheckoutConfirmModal
          mode={mode}
          finalItems={editedBillItems}
          deposits={deposits}
          onClose={() => setShowConfirmModal(false)}
          onConfirm={handleConfirmCheckout}
          isConfirming={isConfirming}
        />
      )}
    </div>
  );
};

export default CheckoutManager;