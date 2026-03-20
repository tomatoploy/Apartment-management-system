import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ShieldCheck, FileWarning, Inbox, ChevronDown,
  Printer, FileText, Loader2, X, CheckCircle2, 
  AlertTriangle, Edit3, Download, Send
} from "lucide-react";
import RoomHeader from "../components/RoomHeader";
import BillDetail from "./BillDetail";
import { toThaiDate, toThaiMonth } from "../components/DateController";
import { OrangeButton, WhiteButton } from "../components/ActionButtons";

import { contractService } from "../api/ContractApi";
import { paymentService }  from "../api/PaymentApi";
import { roomService }     from "../api/RoomApi";
import { constantService } from "../api/ConstantApi";

/* ── helpers ──────────────────────────────────────────────────── */
const extractArray = (res) => {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (res.$values) return res.$values;
  if (res.data && Array.isArray(res.data)) return res.data;
  if (res.data?.$values) return res.data.$values;
  return [];
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
    2: "กรุณาตรวจสอบทรัพย์สินที่เสียหาย (ติ๊กหน้าชื่อเพื่อระบุว่าเสียหาย)",
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
  const [editableItems, setEditableItems] = useState(() => 
    finalItems.map(item => ({ ...item, editable: true }))
  );

  const total     = editableItems.reduce((s, i) => s + (Number(i.amount) || 0), 0);
  const depTotal  = deposits.reduce((s, d) => s + (Number(d.amount) || 0), 0);
  const net       = mode === "absconded" ? 0 : depTotal - total;
  const isRefund  = net >= 0;

  const updateAmount = (id, val) =>
    setEditableItems((prev) =>
      prev.map((i) => i.id === id ? { ...i, amount: Number(val) || 0 } : i)
    );

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

        <div className="overflow-y-auto flex-1 px-7 py-5 space-y-4">
          <div>
            <p className="text-sm font-black text-gray-500 mb-2 uppercase tracking-wider">รายการที่ต้องชำระ</p>
            <div className="space-y-2">
              {editableItems.map((item) => (
                <div key={item.id} className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-2.5">
                  <span className="flex-1 text-sm font-bold text-gray-700 truncate">{item.label}</span>
                  <div className="relative shrink-0">
                    <input type="number" min={0} value={item.amount} disabled={isConfirming}
                      onChange={(e) => updateAmount(item.id, e.target.value)}
                      className="w-28 text-right border border-gray-200 rounded-xl px-3 py-1.5 text-sm font-black text-gray-800 focus:border-orange-400 outline-none disabled:opacity-60 pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium pointer-events-none">฿</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {mode !== "absconded" && deposits.length > 0 && (
            <div className="bg-blue-50 rounded-xl px-4 py-3">
              <p className="text-xs font-black text-blue-500 mb-1.5 uppercase tracking-wider">เงินประกัน</p>
              {deposits.map((d) => (
                <div key={d.id} className="flex justify-between text-sm font-bold text-gray-600">
                  <span>{d.label}</span>
                  <span className="text-blue-600">{Number(d.amount).toLocaleString()} ฿</span>
                </div>
              ))}
            </div>
          )}

          <div className={`rounded-xl px-5 py-4 ${isRefund ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
            <div className="flex justify-between text-sm font-bold text-gray-500 mb-1">
              <span>รวมค่าใช้จ่ายทั้งหมด</span>
              <span className="text-red-500">{total.toLocaleString()} ฿</span>
            </div>
            {mode !== "absconded" && (
              <div className="flex justify-between text-sm font-bold text-gray-500 mb-2">
                <span>เงินประกัน</span>
                <span className="text-blue-500">{depTotal.toLocaleString()} ฿</span>
              </div>
            )}
            <div className={`flex justify-between font-black text-base border-t pt-2 ${isRefund ? "border-green-200 text-green-600" : "border-red-200 text-red-600"}`}>
              <span>{mode === "absconded" ? "หนี้สูญ" : isRefund ? "คืนเงินผู้เช่า" : "ผู้เช่าต้องชำระเพิ่ม"}</span>
              <span>{Math.abs(mode === "absconded" ? total : net).toLocaleString()} ฿</span>
            </div>
          </div>

          <div className="flex items-start gap-2 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3">
            <AlertTriangle size={16} className="text-yellow-500 shrink-0 mt-0.5" />
            <p className="text-xs font-bold text-yellow-700">
              เมื่อยืนยันแล้ว ระบบจะเปลี่ยนสถานะห้องเป็น "ว่าง" และสัญญาเป็น "สิ้นสุด" ไม่สามารถย้อนกลับได้ค่ะ
            </p>
          </div>
        </div>

        <div className="flex gap-3 px-7 py-5 border-t border-gray-100">
          <button onClick={onClose} disabled={isConfirming} className="flex-1 py-3 rounded-2xl border-2 border-gray-200 font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-all">
            ยกเลิก
          </button>
          <button onClick={() => onConfirm(editableItems)} disabled={isConfirming}
            className={`flex-1 py-3 rounded-2xl font-black text-white disabled:opacity-50 transition-all flex items-center justify-center gap-2 ${mode === "absconded" ? "bg-red-500 hover:bg-red-600" : "bg-[#f3a638] hover:bg-orange-500"}`}>
            {isConfirming ? <><Loader2 size={16} className="animate-spin" /> กำลังบันทึก...</> : <><CheckCircle2 size={16} /> ยืนยัน</>}
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

  // ── API state ──
  const [isLoading,      setIsLoading]      = useState(true);
  const [loadError,      setLoadError]      = useState("");
  const [contract,       setContract]       = useState(null);
  const [unpaidBills,    setUnpaidBills]    = useState([]);   
  const [currentMonthBill, setCurrentMonthBill] = useState(null); 
  const [roomId,         setRoomId]         = useState(null);
  const [contractId,     setContractId]     = useState(null);
  const [propertyConstants, setPropertyConstants] = useState([]);
  const [roomInfo,       setRoomInfo]       = useState(null); // ข้อมูลห้องเต็มเพื่อใช้ตอนอัปเดต

  // ── UI state ──
  const [mode,           setMode]           = useState("normal");
  const [currentStep,    setCurrentStep]    = useState(1);
  const [assets,         setAssets]         = useState([]);
  const [deposits,       setDeposits]       = useState([]);
  const [openBills,      setOpenBills]      = useState({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isConfirming,   setIsConfirming]   = useState(false);

  // ✨ คุม State รายการใบเสร็จที่ถูกแก้ไข
  const [editedBillItems, setEditedBillItems] = useState([]);
  const [isEditStep3, setIsEditStep3] = useState(false);
  const [isEditStep4, setIsEditStep4] = useState(false);

  /* ── Load data ─────────────────────────────────────────────── */
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
      if (!targetRoom) throw new Error("ไม่พบข้อมูลห้องค่ะ");
      setRoomId(targetRoom.roomId || targetRoom.id);
      setRoomInfo(targetRoom);

      const allContracts = extractArray(allContractsRes);
      const activeContract = allContracts.find((c) => {
        const cStatus = (c.status || c.Status || "").toLowerCase();
        return Number(c.roomId || c.RoomId) === Number(targetRoom.roomId || targetRoom.id) &&
               (cStatus === "active" || cStatus === "reserved" || cStatus === "expired");
      });
      
      // ถ้าไม่มีสัญญา ให้โชว์ Empty State
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
        unpaid.map((p) => ({
          period:    p.recordDate?.slice(0, 7) ?? "",
          paymentId: p.id || p.Id,
          details: [
            ...(p.roomRate       ? [{ label: "ค่าเช่าห้อง",      amount: Number(p.roomRate)       }] : []),
            ...(p.electricalCost ? [{ label: "ค่าไฟฟ้า",          amount: Number(p.electricalCost) }] : []),
            ...(p.waterCost      ? [{ label: "ค่าน้ำประปา",        amount: Number(p.waterCost)      }] : []),
            ...(p.internetCost   ? [{ label: "ค่าอินเทอร์เน็ต",   amount: Number(p.internetCost)   }] : []),
            ...(p.laundryCost    ? [{ label: "ค่าซักรีด",          amount: Number(p.laundryCost)    }] : []),
            ...(p.additionalCost ? [{ label: p.additionalDetail || "รายการเพิ่มเติม", amount: Number(p.additionalCost) }] : []),
          ],
        }))
      );

      const now  = new Date();
      const curY = now.getFullYear();
      const curM = now.getMonth() + 1;
      const curBill = allPayments.find((p) => {
        const d = p.recordDate ? new Date(p.recordDate) : null;
        return d && d.getFullYear() === curY && d.getMonth() + 1 === curM;
      });
      
      if (curBill) {
        setCurrentMonthBill({
          paymentId: curBill.id || curBill.Id,
          items: [
            ...(curBill.roomRate       ? [{ id: "cm-rent",     label: "ค่าเช่าห้อง",     amount: Number(curBill.roomRate)       }] : []),
            ...(curBill.electricalCost ? [{ id: "cm-elec",     label: "ค่าไฟฟ้า",         amount: Number(curBill.electricalCost) }] : []),
            ...(curBill.waterCost      ? [{ id: "cm-water",    label: "ค่าน้ำประปา",       amount: Number(curBill.waterCost)      }] : []),
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
      setLoadError(err.message || "โหลดข้อมูลไม่สำเร็จค่ะ");
    } finally {
      setIsLoading(false);
    }
  }, [roomNumber]);

  useEffect(() => { loadData(); }, [loadData]);

  // สร้างรายการ Default
  const defaultCombinedItems = useMemo(() => {
    return [
      ...unpaidBills.map((bill) => ({
        id: `unpaid-${bill.period}`,
        label: `ยอดค้างชำระเดือน ${toThaiMonth(bill.period)}`,
        amount: bill.details.reduce((s, i) => s + i.amount, 0),
      })),
      ...assets.map((a) => ({ ...a, id: `asset-${a.id}` })),
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
  const handleConfirmCheckout = async (finalConfirmedItems) => {
    setIsConfirming(true);
    try {
      // 1. เปลี่ยน contract status → Terminated (จัด Format ให้ตรงกับ DB C# เป๊ะๆ)
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
        AttachedFile: contract.attachedFile || contract.AttachedFile || null
      };
      await contractService.putContract(contractId, cleanContract);
      
      // 2. เปลี่ยน room status → available 
      // ✨ ทำความสะอาดข้อมูลห้อง คัดเฉพาะฟิลด์ที่มีใน Database Room ป้องกัน 400 Bad Request
      const cleanRoom = { 
        id: Number(roomId),
        Id: Number(roomId),
        number: String(roomInfo.roomNumber || roomInfo.Number || roomInfo.number),
        Number: String(roomInfo.roomNumber || roomInfo.Number || roomInfo.number),
        building: String(roomInfo.roomBuilding || roomInfo.Building || roomInfo.building || ""),
        Building: String(roomInfo.roomBuilding || roomInfo.Building || roomInfo.building || ""),
        floor: String(roomInfo.roomFloor || roomInfo.Floor || roomInfo.floor || "1"),
        Floor: String(roomInfo.roomFloor || roomInfo.Floor || roomInfo.floor || "1"),
        status: "available", 
        Status: "available",
        note: roomInfo.note || roomInfo.Note || "",
        Note: roomInfo.note || roomInfo.Note || ""
      };

      if (roomService.updateRoom) {
        await roomService.updateRoom(roomId, cleanRoom);
      } else if (roomService.putRoom) {
        await roomService.putRoom(roomId, cleanRoom);
      }

      // 3. mark unpaid bills → paid (ถ้าผู้เช่าหนี ส่ง paidAmount = 0 เพื่อบันทึกหนี้สูญ)
      for (const bill of unpaidBills) {
        const paidAmount = mode === "absconded" ? 0 : bill.details.reduce((s, i) => s + i.amount, 0);
        await paymentService.updatePaymentStatus(bill.paymentId, "paid", paidAmount);
      }

      setShowConfirmModal(false);
      alert(mode === "absconded" ? "บันทึกหนี้สูญเรียบร้อยค่ะ" : "ยืนยันการย้ายออกเรียบร้อยค่ะ");
      navigate("/rooms"); 
    } catch (err) {
      console.error("Checkout Error:", err);
      // พิมพ์ Detail เชิงลึกถ้า API ของ .NET ตอบกลับ Error
      if (err.response && err.response.data) {
        console.error("API Validation Errors:", err.response.data);
      }
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูลห้องหรือสัญญา กรุณาลองใหม่ค่ะ");
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

  if (loadError) {
    return (
      <div className="min-h-screen pb-10">
        <RoomHeader roomNumber={roomNumber} />
        <div className="max-w-xl mx-auto mt-20 text-center">
          <p className="text-red-500 font-bold mb-4">{loadError}</p>
          <button onClick={loadData} className="px-6 py-3 bg-orange-400 text-white rounded-2xl font-bold hover:bg-orange-500">
            ลองใหม่
          </button>
        </div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="min-h-screen pb-10">
        <RoomHeader roomNumber={roomNumber} />
        <div className="max-w-full mx-auto px-4 mt-6">
          <div className="py-24 flex flex-col items-center justify-center text-center bg-gray-50 rounded-[32px] border border-gray-200 max-w-4xl mx-auto animate-in fade-in zoom-in duration-300">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-gray-300 mb-6 border border-dashed border-gray-300 shadow-inner">
              <FileText size={48} strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-black text-gray-500 mb-2">ไม่มีข้อมูลสัญญา</h3>
            <p className="text-sm text-gray-400 font-bold max-w-xs">
              ไม่พบข้อมูลสัญญาเช่าสำหรับห้องพักนี้ในขณะนี้ค่ะ
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-10">
      <RoomHeader roomNumber={roomNumber} />
      <div className="max-w-full mx-auto px-4">

        <div className="bg-white w-full max-w-3xl mx-auto rounded-3xl p-4 md:p-6 border border-gray-200 shadow-sm mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex gap-4">
            <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-800 shrink-0">
              <FileText size={24} />
            </div>
            <div>
              <h3 className="font-black text-gray-800 text-sm md:text-base">รายละเอียดสัญญาเช่า</h3>
              <div className="text-xs md:text-sm text-gray-500 mt-1 space-y-0.5 font-bold">
                <p>วันทำสัญญา : {contract?.startDate ? toThaiDate(contract.startDate) : "-"}</p>
                <p>วันสิ้นสุดสัญญา : {contract?.endDate ? toThaiDate(contract.endDate) : "-"}</p>
              </div>
            </div>
          </div>
          <span className={`px-4 py-1.5 text-xs font-black rounded-xl ${getContractDisplayStatus.includes("Expired") ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}`}>
            {getContractDisplayStatus}
          </span>
        </div>

        <div className="flex bg-gray-100 rounded-xl p-1 mb-4 max-w-2xl mx-auto">
          {[
            { key: "normal",    label: "ผู้เช่าย้ายออก", active: "bg-[#f3a638]" },
            { key: "absconded", label: "ผู้เช่าหนี",      active: "bg-[#d9534f]" },
          ].map(({ key, label, active }) => (
            <button key={key} onClick={() => setMode(key)}
              className={`flex-1 py-3 min-h-[48px] rounded-xl font-black text-sm md:text-base transition-all duration-300 cursor-pointer
                ${mode === key ? `${active} text-white shadow-md` : "text-gray-500 hover:text-gray-700"}`}>
              {label}
            </button>
          ))}
        </div>

        <p className="text-center text-gray-700 font-bold mb-4">
          {mode === "normal"
            ? "ขั้นตอนการย้ายออกจะมี 4 ขั้นตอน ได้แก่"
            : "หมายเหตุ: กรณีผู้เช่าหนีจะทำการบันทึกหนี้สูญและไม่ทำการออกบิลใด ๆ"}
        </p>

        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {STEPS.map((step) => (
            <button key={step.id} onClick={() => setCurrentStep(step.id)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer shrink-0
                ${currentStep === step.id ? stepActiveClass : "bg-gray-100 text-gray-400 hover:bg-gray-200"}`}>
              {step.label}
            </button>
          ))}
        </div>

        <div className="md:border-[1.5px] md:border-blue-300 md:rounded-[40px] md:p-8 relative h-auto w-full max-w-5xl mx-auto">
          <hr className="md:hidden border-t border-gray-200 mb-6" />

          {currentStep !== 2 && (
            <div className="flex items-center gap-4 mb-2">
              <span className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg ${stepBadgeClass}`}>
                {currentStep}
              </span>
              <h2 className="text-xl font-black text-gray-800">
                {STEPS.find((s) => s.id === currentStep)?.label.split(". ")[1] || "สรุปการย้ายออก"}
              </h2>
            </div>
          )}
          {currentStep !== 2 && <StepNotice mode={mode} currentStep={currentStep} />}

          {currentStep === 1 && (
            <div className="space-y-4">
              {unpaidBills.length === 0 ? (
                <EmptyState message="ไม่มีบิลค้างชำระค่ะ" />
              ) : (
                unpaidBills.map((billGroup) => (
                  <div key={billGroup.period}
                    className="md:border md:border-gray-100 md:rounded-[24px] md:shadow-sm bg-white overflow-hidden border-b border-gray-300">
                    <div onClick={() => toggleBill(billGroup.period)}
                      className="p-5 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="hidden md:flex w-10 h-10 bg-orange-100 rounded-full items-center justify-center text-orange-600 shrink-0">
                          <Inbox size={20} />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">บิลค้างชำระเดือน</p>
                          <p className="font-black text-gray-800">{toThaiMonth(billGroup.period)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 md:gap-6">
                        <div className="text-right">
                          <p className="text-xs text-gray-500">ยอดค้างชำระรวม</p>
                          <p className="font-black text-orange-600 text-base md:text-lg">
                            {billGroup.details.reduce((s, i) => s + i.amount, 0).toLocaleString()} ฿
                          </p>
                        </div>
                        <ChevronDown className={`text-gray-400 transition-transform duration-300 ${openBills[billGroup.period] ? "rotate-180" : ""}`} />
                      </div>
                    </div>
                    {openBills[billGroup.period] && (
                      <div className="p-0 md:px-5 md:pb-5 border-t border-dashed border-gray-200">
                        <div className="md:mt-4 mt-2">
                          <BillDetail
                            mode="checkout"
                            showAddBtn={false} showDiscountBtn={false}
                            showPdfBtn={false} showSendBtn={false} showSaveBtn={false}
                            initialData={billGroup.details.map((item, idx) => ({
                              ...item, id: item.id || `${billGroup.period}-${idx}`,
                            }))}
                            total={billGroup.details.reduce((s, i) => s + i.amount, 0)}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 mb-2">
                <span className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg ${stepBadgeClass}`}>2</span>
                <h2 className="text-xl font-black text-gray-800">ตรวจสอบทรัพย์สิน</h2>
              </div>
              <StepNotice mode={mode} currentStep={2} />

              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                    <tr>
                      <th className="p-4 w-16 text-center">เสียหาย</th>
                      <th className="p-4">รายการทรัพย์สิน</th>
                      <th className="p-4 text-right">ค่าปรับพื้นฐาน</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {propertyConstants.map(prop => (
                      <tr key={prop.id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-4 text-center">
                          <input type="checkbox" 
                            checked={!!assets.find(a => a.constantId === prop.id)}
                            onChange={() => togglePropertyDamage(prop)}
                            className="w-5 h-5 accent-blue-500 cursor-pointer" />
                        </td>
                        <td className="p-4 font-bold text-gray-700">{prop.subject}</td>
                        <td className="p-4 text-right font-black text-gray-600">{Number(prop.cost).toLocaleString()} ฿</td>
                      </tr>
                    ))}
                    {propertyConstants.length === 0 && (
                      <tr>
                        <td colSpan="3" className="p-6 text-center text-gray-400 font-bold">ไม่มีรายการทรัพย์สินในระบบ</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="mt-4 space-y-4">
              <BillDetail
                mode="checkout"
                initialData={editedBillItems}
                showAddBtn={isEditStep3} showDiscountBtn={isEditStep3} showSaveBtn={isEditStep3} 
                showPdfBtn={false} showSendBtn={false}
                onDataChange={(newData) => setEditedBillItems(newData)}
                onSave={() => setIsEditStep3(false)}
              />

              <div className="flex flex-col items-center gap-4 mt-2">
                {!isEditStep3 ? (
                  <>
                    <WhiteButton label="แก้ไขรายการใบเสร็จ" icon={Edit3} onClick={() => setIsEditStep3(true)} className="px-10" />
                    <div className="flex gap-3">
                      <OrangeButton label="บันทึกเป็น PDF" icon={Download} onClick={() => alert('ดาวน์โหลด PDF')} />
                      <OrangeButton label="ส่งบิล" icon={Send} onClick={() => alert('ส่งบิล')} />
                    </div>
                  </>
                ) : (
                  <button onClick={() => setIsEditStep3(false)} className="px-8 py-2.5 rounded-2xl border-2 border-gray-200 text-gray-500 font-bold hover:bg-gray-50 transition-all">
                    ยกเลิกการแก้ไข
                  </button>
                )}
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-4 mt-4">
              <BillDetail
                mode="checkout" type="deposit"
                initialData={deposits}
                showAddBtn={isEditStep4} 
                showSaveBtn={isEditStep4} 
                showDiscountBtn={false} 
                showPdfBtn={false} showSendBtn={false}
                onDataChange={(newData) => setDeposits(newData)}
                onSave={() => setIsEditStep4(false)}
              />
              
              <div className="flex justify-center mt-2 mb-4">
                {!isEditStep4 ? (
                  <WhiteButton label="แก้ไขรายการเงินประกัน" icon={Edit3} onClick={() => setIsEditStep4(true)} className="px-10" />
                ) : (
                  <button onClick={() => setIsEditStep4(false)} className="px-8 py-2.5 rounded-2xl border-2 border-gray-200 text-gray-500 font-bold hover:bg-gray-50 transition-all">
                    ยกเลิกการแก้ไข
                  </button>
                )}
              </div>

              <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                <p className="text-sm text-blue-500 font-bold">
                  * ยอดเงินประกันนี้จะถูกนำไปหักลบกับยอดหนี้ทั้งหมดในขั้นตอนสุดท้าย
                </p>
              </div>
            </div>
          )}

          {currentStep === 5 && (
            <div className="space-y-6">
              <div className={`md:rounded-2xl md:overflow-hidden md:border md:shadow-sm ${mode === "absconded" ? "md:border-red-300" : "md:border-gray-200"}`}>
                <div className={`py-3 rounded-t-xl text-center font-black text-lg text-white -mx-4 px-4 md:mx-0 ${mode === "absconded" ? "bg-red-500" : "bg-[#f3a638]"}`}>
                  สรุปการ{mode === "absconded" ? "บันทึกผู้เช่าหนี" : "ย้ายออก"}
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
                          <p className="text-sm text-gray-400 text-center py-4">ไม่มีรายการเงินประกัน</p>
                        ) : (
                          deposits.map((dep) => (
                            <div key={dep.id} className={rowClass}>
                              <span className="text-gray-600 font-bold">{dep.label}</span>
                              <span className="font-black text-gray-800">{Number(dep.amount).toLocaleString()} ฿</span>
                            </div>
                          ))
                        )}
                        <div className="flex justify-between font-black text-blue-600 text-lg pt-1 border-t border-dashed border-gray-200 mt-2">
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
                        {editedBillItems.map((item) => (
                          <div key={item.id} className={rowClass}>
                            <span className="text-gray-600 font-bold">{item.label}</span>
                            <span className="font-black text-gray-800">{Number(item.amount).toLocaleString()} ฿</span>
                          </div>
                        ))}
                        {editedBillItems.length === 0 && (
                          <p className="text-sm text-gray-400 text-center py-4">ไม่มีรายการค้างชำระ</p>
                        )}
                        <div className="flex justify-between font-black text-red-500 text-lg pt-1 border-t border-dashed border-gray-200 mt-2">
                          <span>รวมยอดค้างชำระ</span>
                          <span>{totalExpenses.toLocaleString()} ฿</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* สรุปสุทธิ */}
                  {mode === "absconded" ? (
                    <div className="p-6 text-center bg-red-50 -mx-4 md:mx-0 md:rounded-[24px] md:border md:border-red-200 border-t-4 border-t-red-400">
                      <p className="text-red-400 font-bold uppercase tracking-widest mb-1 text-sm">บันทึกหนี้สูญ</p>
                      <h2 className="text-xl font-bold text-red-600 mt-2">ยอดที่ไม่สามารถเรียกเก็บได้</h2>
                      <p className="text-2xl font-black text-red-600 mt-2">{totalExpenses.toLocaleString()} <span className="text-xl">บาท</span></p>
                      <p className="text-sm text-red-400 font-bold mt-3">* ระบบจะบันทึกหนี้สูญ และหักเงินประกันเพื่อชดเชยความเสียหายบางส่วน</p>
                      <div className="mt-4 bg-white rounded-xl p-3 border border-red-100 text-sm max-w-2xl mx-auto">
                        <div className="flex justify-between text-gray-600 font-bold">
                          <span>เงินประกันที่หักชดเชย</span>
                          <span className="text-blue-600">+{totalDeposit.toLocaleString()} ฿</span>
                        </div>
                        <div className="flex justify-between text-gray-600 font-bold mt-1">
                          <span>ยอดหนี้สูญที่เหลือ</span>
                          <span className="text-red-500">{Math.max(0, totalExpenses - totalDeposit).toLocaleString()} ฿</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className={`p-6 md:p-8 text-center md:rounded-[24px] md:border border-t-4 -mx-4 md:mx-0
                      ${isRefund ? "bg-green-50 md:border-green-200 border-t-green-400" : "bg-red-50 md:border-red-200 border-t-red-400"}`}>
                      <p className="text-gray-400 font-bold uppercase tracking-widest mb-1 text-sm">สรุปการย้ายออก</p>
                      <h2 className={`text-xl font-bold mt-2 ${isRefund ? "text-green-600" : "text-red-600"}`}>
                        {isRefund ? "หอพักคืนเงินผู้เช่า" : "ผู้เช่าต้องชำระเพิ่ม"}
                      </h2>
                      <p className={`text-2xl font-black mt-2 ${isRefund ? "text-green-600" : "text-red-600"}`}>
                        {Math.abs(netAmount).toLocaleString()} <span className="text-2xl">บาท</span>
                      </p>
                      <div className="mt-5 bg-white/80 rounded-xl px-4 py-3 text-sm font-bold text-gray-500 border border-gray-100 flex flex-col md:inline-flex md:flex-row items-center gap-2 md:gap-6 w-full md:w-auto mx-auto">
                        <div className="flex items-center justify-between w-full md:w-auto md:contents gap-4">
                          <span>เงินประกัน <span className="text-blue-600">{totalDeposit.toLocaleString()} ฿</span></span>
                          <span className="text-gray-400">−</span>
                          <span>ยอดค้างชำระ <span className="text-red-500">{totalExpenses.toLocaleString()} ฿</span></span>
                        </div>
                        <div className="w-full border-t border-dashed border-gray-200 md:hidden" />
                        <div className="flex items-center justify-between w-full md:w-auto md:contents">
                          <span className="text-gray-400 hidden md:inline">=</span>
                          <span className="text-gray-500 md:hidden">ยอดสุทธิ</span>
                          <span className={`font-black text-base md:text-sm ${isRefund ? "text-green-600" : "text-red-500"}`}>
                            {netAmount >= 0 ? "+" : ""}{netAmount.toLocaleString()} ฿
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className={`p-4 text-center font-black ${mode === "absconded" ? "md:bg-red-100 text-red-700" : isRefund ? "md:bg-green-100 text-green-700" : "md:bg-orange-100 text-orange-700"}`}>
                  {mode === "absconded"
                    ? `บันทึกหนี้สูญ ${totalExpenses.toLocaleString()} บาท`
                    : isRefund
                      ? `หอพักต้องคืนเงินผู้เช่า ${Math.abs(netAmount).toLocaleString()} บาท`
                      : `ผู้เช่าต้องชำระเงินเพิ่ม ${Math.abs(netAmount).toLocaleString()} บาท`}
                </div>
              </div>

              <div className="flex justify-center md:justify-end gap-3">
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