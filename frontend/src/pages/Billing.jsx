import React, { useState, useMemo, useEffect, useCallback, useRef, useDeferredValue } from "react";
import {
  HelpCircle, CheckSquare, Printer, FileText,
  Send, Plus, X, RotateCw, Filter as FilterIcon,
  Loader2, Download, AlertTriangle,
} from "lucide-react";

import RoomCard from "../components/RoomCard";
import FilterModal from "../components/FilterModal";
import SearchBar from "../components/SearchBar";
import {
  BlueButton, GreenButton, OrangeButton,
  DownloadButton, SelectAllFloorButton, WhiteButton,
} from "../components/ActionButtons";
import { useNavigate } from "react-router-dom";
import { CustomMonthPicker } from "../components/DateController";

import { roomService }     from "../api/RoomApi";
import { contractService } from "../api/ContractApi";
import { paymentService }  from "../api/PaymentApi";

// ── Helper ────────────────────────────────────────────────────────
const extractArray = (res) => {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (res.$values && Array.isArray(res.$values)) return res.$values;
  if (res.data && Array.isArray(res.data)) return res.data;
  if (res.data?.$values && Array.isArray(res.data.$values)) return res.data.$values;
  return [];
};

const calcResultToRow = (result, roomNumber, tenantFirstName) => ({
  contractId:      result.contractId,
  roomNumber,
  tenantFirstName,
  rent:            result.roomRate        ?? 0,
  electric:        result.electricalCost  ?? 0,
  water:           result.waterCost       ?? 0,
  internet:        result.internetCost    ?? 0,
  laundry:         result.laundryCost     ?? 0,
  otherService:    0,
  total:           result.totalAmount     ?? 0,
  calculationNote: result.calculationNote ?? "",
  alreadyExists:   result.alreadyExists   ?? false,
});

// ── Download xlsx/csv ─────────────────────────────────────────────
const downloadExcel = async (rows, selectedDate, format = "xlsx") => {
  const XLSX = await import("https://cdn.sheetjs.com/xlsx-0.20.1/package/xlsx.mjs");
  const [year, month] = selectedDate.split("-").map(Number);
  const monthNames = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];
  const monthLabel = `${monthNames[month - 1]}${year + 543}`;
  const data = [
    ["ห้อง","ชื่อผู้เช่า","สถานะสัญญา","ค่าเช่า","ค่าไฟ","ค่าน้ำ","บริการอื่นๆ","รวม","หมายเหตุ"],
    ...rows.map((r) => [r.roomNumber, r.tenantFirstName||"-", r.contractStatus||"-", r.rent, r.electric, r.water, r.otherService, r.total, r.calculationNote||""]),
  ];
  const ws = XLSX.utils.aoa_to_sheet(data);
  ws["!cols"] = [{wch:8},{wch:16},{wch:12},{wch:12},{wch:12},{wch:12},{wch:14},{wch:12},{wch:30}];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, `บิล ${monthLabel}`);
  const filename = `billing_${selectedDate}`;
  format === "csv" ? XLSX.writeFile(wb, `${filename}.csv`, { bookType:"csv" }) : XLSX.writeFile(wb, `${filename}.xlsx`);
};

// ── LazyFloor ─────────────────────────────────────────────────────
const LazyFloor = React.memo(({ floor, rooms, isSelectMode, selectedRooms, onToggleSelect, onNavigate, onSelectAll, onDeselectFloor }) => {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const floorRoomNums    = rooms.map((r) => r.roomNumber);
  const selectedInFloor  = floorRoomNums.filter((n) => selectedRooms.includes(n));
  const hasSelectionHere = selectedInFloor.length > 0;

  return (
    <div ref={ref} className="bg-gray-50 p-6 rounded-[35px] border border-gray-200 shadow-sm">
      <div className="flex justify-between items-center mb-6 px-4">
        <h2 className="text-xl font-bold text-gray-700">ชั้น {floor}</h2>
        <div className="flex items-center gap-2">
          {hasSelectionHere && (
            <button onClick={() => onDeselectFloor(floor)}
              className="text-sm font-bold text-red-400 hover:text-red-600 px-3 py-1.5 rounded-xl hover:bg-red-50 transition-all">
              ยกเลิกชั้นนี้ ({selectedInFloor.length})
            </button>
          )}
          <SelectAllFloorButton onClick={() => onSelectAll(floor)} />
        </div>
      </div>

      {!isVisible ? (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 justify-items-center">
          {rooms.map((room) => (
            <div key={room.roomId} className="w-full max-w-[130px] h-28 rounded-2xl bg-gray-200 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 justify-items-center">
          {rooms.map((room) => {
            const isSelected = selectedRooms.includes(room.roomNumber);
            return (
              <div
                key={room.roomId}
                onClick={() => isSelectMode ? onToggleSelect(room.roomNumber) : onNavigate(room.roomNumber)}
                className="relative cursor-pointer hover:scale-105 transition-all"
              >
                <RoomCard
                  roomId={room.roomId}
                  roomNumber={room.roomNumber}
                  building={room.building}
                  tenantName={room.tenantFirstName || ""}
                  status={room.billingStatus}
                  overdueCount={room.overdueCount}
                  icons={[]}
                />

                {/* ยอดเงิน */}
                <div className="absolute inset-x-0 top-0 flex items-center justify-center pointer-events-none z-20"
                     style={{ height: "80px" }}>
                  <span className="text-[13px] text-white font-bold drop-shadow text-center px-1 leading-tight">
                    {room.hasBill ? `${Number(room.total).toLocaleString()} ฿` : ""}
                  </span>
                </div>

                {/* badge ค้างชำระ 2+ เดือน */}
                {room.overdueCount >= 2 && (
                  <div className="absolute -top-3 -left-3 bg-red-600 text-white rounded-full px-2 py-0.5 text-[11px] font-black shadow-lg z-30 flex items-center gap-1 border-2 border-white">
                    <AlertTriangle size={10} />
                    {room.overdueCount}
                  </div>
                )}

                {isSelected && (
                  <div className="absolute -top-3 -right-3 bg-[#3498DB] text-white rounded-full p-1.5 shadow-lg z-30">
                    <CheckSquare size={20} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});

// ── Main Component ─────────────────────────────────────────────────
const Billing = () => {
  const navigate = useNavigate();

  const [selectedDate,         setSelectedDate]        = useState(new Date().toISOString().slice(0, 7));
  const [searchTerm,           setSearchTerm]          = useState("");
  const [showFilterModal,      setShowFilterModal]     = useState(false);
  const [showHelpModal,        setShowHelpModal]       = useState(false);
  const [showSummary,          setShowSummary]         = useState(false);
  const [showGenerateModal,    setShowGenerateModal]   = useState(false);
  const [activeStatusFilters,  setActiveStatusFilters] = useState([]);
  const [selectedRooms,        setSelectedRooms]       = useState([]);
  const [isSelectMode,         setIsSelectMode]        = useState(false);
  const [activeBuilding,       setActiveBuilding]      = useState("ALL");
  const [showBuildingDropdown, setShowBuildingDropdown]= useState(false);
  const [isDownloading,        setIsDownloading]       = useState(false);
  const [roomsData,            setRoomsData]           = useState([]);
  const [allContractsCache,    setAllContractsCache]   = useState([]);
  const [isLoading,            setIsLoading]           = useState(true);
  const [isGenerating,         setIsGenerating]        = useState(false);
  const [isConfirming,         setIsConfirming]        = useState(false);
  const [previewRows,          setPreviewRows]         = useState([]);
  const [generateError,        setGenerateError]       = useState("");

  const buildingDropdownRef = useRef(null);
  const deferredSearch      = useDeferredValue(searchTerm);
  const deferredFilters     = useDeferredValue(activeStatusFilters);
  const activeFilterCount   = activeStatusFilters.length;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (buildingDropdownRef.current && !buildingDropdownRef.current.contains(e.target))
        setShowBuildingDropdown(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

// ค้นหาฟังก์ชัน loadData ใน Billing.js แล้ววางทับด้วยโค้ดนี้ค่ะ

const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [year, month] = selectedDate.split("-").map(Number);

      const contractsPromise = allContractsCache.length > 0
        ? Promise.resolve(allContractsCache)
        : contractService.getAllContracts().catch(() => []);

      const [allRoomsRes, allPaymentsRes, contractsRes] = await Promise.all([
        roomService.getRoomOverview().catch(() => []),
        paymentService.getPayments().catch(() => []), // ✨ ดึงบิลทั้งหมดในระบบ
        contractsPromise,
      ]);

      const rawRooms    = extractArray(allRoomsRes);
      const rawPayments = extractArray(allPaymentsRes);
      const rawContracts = extractArray(contractsRes);

      if (allContractsCache.length === 0 && rawContracts.length > 0) {
        setAllContractsCache(rawContracts);
      }

      // 1. 🟢 roomId -> contractId
      const contractByRoom = {};
      rawContracts.forEach((c) => {
        const cStatus = (c.status || c.Status || "").toLowerCase();
        if (cStatus === "active" || cStatus === "reserved") {
          contractByRoom[Number(c.roomId || c.RoomId)] = Number(c.id || c.Id);
        }
      });

      // 2. 🔵 ค้นหาบิลเดือนปัจจุบัน และ นับหนี้ค้างทั้งหมด (unpaid)
      const paymentByContract = {}; 
      const overdueCountByContract = {}; 

      rawPayments.forEach((p) => {
        const cid = Number(p.contractId || p.ContractId);
        const pStatus = (p.status || p.Status || "").toLowerCase();
        const dateStr = (p.recordDate || p.RecordDate || "").substring(0, 10); // ✨ ตัดเอาแค่ YYYY-MM-DD
        
        if (!dateStr) return;
        const [pYear, pMonth] = dateStr.split("-").map(Number);

        // เก็บข้อมูลบิลเฉพาะเดือนที่เลือก (จะเอาไปเช็คสีเขียว/เทา)
        if (pYear === year && pMonth === month) {
          paymentByContract[cid] = p;
        }

        // ✨ นับทุกรายการที่เป็น unpaid ในระบบ (วงกลมแดง)
        if (pStatus === "unpaid") {
          overdueCountByContract[cid] = (overdueCountByContract[cid] || 0) + 1;
        }
      });

      // 3. 🟡 Normalize ข้อมูล
      const normalized = rawRooms.map((r) => {
        const rId = r.roomId || r.id || r.Id;
        const contractId = contractByRoom[Number(rId)];
        if (!contractId) return null;

        const payment = paymentByContract[contractId] ?? null;
        const overdueCount = overdueCountByContract[contractId] ?? 0;
        const currentStatus = (payment?.status || payment?.Status || "").toLowerCase();

        // ── ✨ ตรรกะสี (Priority) ──
        let billingStatus = "pending"; 
        if (currentStatus === "paid") {
          billingStatus = "occupied"; // 🟢 จ่ายแล้ว (A101 จะเป็นเขียวที่นี่)
        } else if (overdueCount >= 1) {
          billingStatus = "overdue";  // 🔴 ค้างชำระ (A103 จะเป็นแดงที่นี่)
        }

        // ── ✨ คำนวณยอดรวมใหม่ (Manual Sum) ──
        const rRate = Number(payment?.roomRate || payment?.RoomRate || 0);
        const eCost = Number(payment?.electricalCost || payment?.ElectricalCost || 0);
        const wCost = Number(payment?.waterCost || payment?.WaterCost || 0);
        const internet = Number(payment?.internetCost || payment?.InternetCost || 0);
        const laundry = Number(payment?.laundryCost || payment?.LaundryCost || 0);
        const addCost = Number(payment?.additionalCost || payment?.AdditionalCost || 0);
        const disc = Number(payment?.discountCost || payment?.DiscountCost || 0);
        
        const manualTotal = rRate + eCost + wCost + internet + laundry + addCost - disc;

        return {
          roomId:          Number(rId),
          roomNumber:      r.roomNumber || r.Number,
          floor:           String(r.roomFloor || r.Floor),
          building:        r.roomBuilding || r.Building,
          billingStatus,   
          overdueCount,    // ✨ ส่งไปให้ RoomCard แสดงเลขวงกลม
          tenantFirstName: r.tenantFirstName || r.TenantFirstName || "",
          contractId,
          paymentId:       payment?.id || payment?.Id || null,
          total:           manualTotal, 
          hasBill:         payment !== null,
        };
      }).filter(Boolean);

      setRoomsData(normalized);
    } catch (err) {
      console.error("โหลดข้อมูลไม่สำเร็จ", err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate, allContractsCache]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleGenerateClick = async () => {
    setGenerateError(""); setPreviewRows([]); setIsGenerating(true); setShowGenerateModal(true);
    try {
      const [year, month] = selectedDate.split("-").map(Number);
      const roomsWithoutBill = roomsData.filter((r) => !r.hasBill && r.contractId);
      if (roomsWithoutBill.length === 0) { setGenerateError("ทุกห้องมีบิลในเดือนนี้แล้วค่ะ"); setIsGenerating(false); return; }
      const results = await Promise.allSettled(
        roomsWithoutBill.map((r) =>
          paymentService.generatePayment(r.contractId, year, month)
            .then((res) => calcResultToRow(res, r.roomNumber, r.tenantFirstName))
        )
      );
      const rows = results.filter((r) => r.status === "fulfilled").map((r) => r.value);
      rows.length === 0 ? setGenerateError("ไม่สามารถคำนวณบิลได้ กรุณาตรวจสอบข้อมูลค่ะ") : setPreviewRows(rows);
    } catch (err) {
      setGenerateError("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้งค่ะ");
    } finally { setIsGenerating(false); }
  };

  const handleConfirmGenerate = async () => {
    setIsConfirming(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      await Promise.all(
        previewRows.filter((r) => !r.alreadyExists).map((r) =>
          paymentService.createPayment({ contractId:r.contractId, recordDate:today, adminId:1, roomRate:r.rent, electricalCost:r.electric, waterCost:r.water, internetCost:r.internet, laundryCost:r.laundry, calculationNote:r.calculationNote })
        )
      );
      setShowGenerateModal(false); setPreviewRows([]); await loadData();
    } catch (err) { setGenerateError("บันทึกบิลไม่สำเร็จ กรุณาลองใหม่อีกครั้งค่ะ"); }
    finally { setIsConfirming(false); }
  };

  const handleDownload = async (format) => {
    setIsDownloading(true);
    try {
      const [year, month] = selectedDate.split("-").map(Number);
      const firstDay = `${year}-${String(month).padStart(2,"0")}-01`;
      const lastDay  = new Date(year, month, 0).toISOString().split("T")[0];
      const [paymentsRes, contractsRes] = await Promise.all([paymentService.getPaymentsByMonth(year,month), contractService.getAllContracts()]);
      const payments = extractArray(paymentsRes);
      const contracts = extractArray(contractsRes);
      const relevantContracts = contracts.filter((c) => {
        const start=c.startDate?new Date(c.startDate):null, end=c.endDate?new Date(c.endDate):null;
        const first=new Date(firstDay), last=new Date(lastDay);
        return (start?start<=last:false) && (end?end>=first:true);
      });
      const allRoomsRes2 = await roomService.getRoomOverview();
      const rawRooms2 = extractArray(allRoomsRes2);
      const roomById={}, paymentByContract={};
      rawRooms2.forEach((r)=>{ roomById[Number(r.roomId)]=r; });
      payments.forEach((p)=>{ paymentByContract[Number(p.contractId)]=p; });
      const statusMap={Active:"ใช้งาน",Reserved:"จอง",Cancle:"ยกเลิก",Terminated:"ยกเลิกสัญญา",Expired:"หมดสัญญา"};
      const rows = relevantContracts.map((c)=>{
        const room=roomById[Number(c.roomId)]??{}, payment=paymentByContract[Number(c.id)]??null;
        return { roomNumber:room.roomNumber??String(c.roomId), tenantFirstName:room.tenantFirstName??"-", contractStatus:statusMap[c.status]??c.status, rent:payment?.roomRate??(c.monthlyRent??0), electric:payment?.electricalCost??0, water:payment?.waterCost??0, otherService:(payment?.internetCost??0)+(payment?.laundryCost??0)+(payment?.additionalCost??0), total:payment?.totalAmount??0, calculationNote:payment?.note??""};
      });
      rows.sort((a,b)=>a.roomNumber.localeCompare(b.roomNumber,"th",{numeric:true}));
      await downloadExcel(rows, selectedDate, format);
    } catch (err) { console.error(err); alert("ดาวน์โหลดไม่สำเร็จ กรุณาลองใหม่ค่ะ"); }
    finally { setIsDownloading(false); }
  };

  // ── Filter ─────────────────────────────────────────────────────
  const filteredRoomsByFloor = useMemo(() => {
    const grouped = {};
    roomsData.forEach((room) => {
      const matchesSearch = room.roomNumber.includes(deferredSearch) || room.tenantFirstName.includes(deferredSearch);
      const matchesStatus = deferredFilters.length === 0 || deferredFilters.includes(room.billingStatus);
      if (matchesSearch && matchesStatus) {
        if (!grouped[room.floor]) grouped[room.floor] = [];
        grouped[room.floor].push(room);
      }
    });
    Object.values(grouped).forEach((arr) => arr.sort((a,b) => a.roomNumber.localeCompare(b.roomNumber,"th",{numeric:true})));
    return grouped;
  }, [roomsData, deferredSearch, deferredFilters]);

  const filteredByBuilding = useMemo(() => {
    if (activeBuilding === "ALL") return filteredRoomsByFloor;
    const result = {};
    Object.entries(filteredRoomsByFloor).forEach(([floor, rooms]) => {
      const filtered = rooms.filter((r) => r.building === activeBuilding);
      if (filtered.length > 0) result[floor] = filtered;
    });
    return result;
  }, [filteredRoomsByFloor, activeBuilding]);

  const finalFloors = useMemo(
    () => Object.keys(filteredByBuilding).sort((a,b) => Number(a)-Number(b)),
    [filteredByBuilding]
  );

  const buildings = useMemo(
    () => ["ALL", ...new Set(roomsData.map((r) => r.building).filter(Boolean))],
    [roomsData]
  );

  const summaryRows = useMemo(
    () => roomsData.filter((r) => selectedRooms.includes(r.roomNumber)),
    [roomsData, selectedRooms]
  );

  const toggleRoomSelection = (roomNum) =>
    setSelectedRooms((prev) => prev.includes(roomNum) ? prev.filter((id)=>id!==roomNum) : [...prev,roomNum]);

  const selectAllInFloor = (floor) => {
    const floorRooms = (filteredByBuilding[floor] ?? []).map((r) => r.roomNumber);
    setSelectedRooms((prev) => [...new Set([...prev, ...floorRooms])]);
  };

  const deselectFloor = (floor) => {
    const floorRooms = (filteredByBuilding[floor] ?? []).map((r) => r.roomNumber);
    setSelectedRooms((prev) => prev.filter((n) => !floorRooms.includes(n)));
  };

  const toggleStatusFilter = (status) =>
    setActiveStatusFilters((prev) => prev.includes(status) ? prev.filter((s)=>s!==status) : [...prev,status]);

  return (
    <>
      <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">การสร้างบิล</h1>

      <div className="flex flex-col gap-5 mb-8">
        <div className="flex flex-wrap items-center justify-center gap-3 w-full">
          <span className="font-bold text-gray-600 shrink-0">รอบบิล</span>
          <CustomMonthPicker value={selectedDate} onChange={setSelectedDate} className="w-64" />
          <OrangeButton label="สร้างบิลใหม่" icon={Plus} onClick={handleGenerateClick} className="shadow-md py-2.5 px-5" />
          <button onClick={loadData} className="p-3 rounded-xl border transition-all flex items-center justify-center h-12 w-12 shrink-0 bg-white border-gray-200 text-gray-500 hover:border-[#f3a638] hover:text-[#f3a638] hover:bg-orange-50 group" title="รีเฟรช">
            <RotateCw size={20} className="transition-transform duration-500 group-hover:rotate-180" />
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 w-full">
          <div className="w-full sm:w-72">
            <SearchBar value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <button onClick={() => setShowFilterModal(true)}
            className={`relative p-3 rounded-xl border transition-all flex items-center justify-center h-[48px] w-[48px] shrink-0
              ${activeFilterCount>0?"bg-[#FFF7ED] border-[#F5A623] text-[#F5A623]":"bg-white border-gray-200 text-gray-500 hover:border-[#f3a638] hover:text-[#f3a638]"}`}>
            <FilterIcon size={20} />
            {activeFilterCount>0 && <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white font-bold border-2 border-white">{activeFilterCount}</span>}
          </button>
          <button onClick={() => setShowHelpModal(true)} className="h-[48px] px-4 rounded-xl border transition-all flex items-center gap-2 font-bold shrink-0 bg-white border-gray-200 text-gray-500 hover:border-[#f3a638] hover:text-[#f3a638]">
            คำอธิบาย <HelpCircle size={20} />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full max-w-3xl mx-auto px-2">
          <WhiteButton label="พิมพ์บิลค่าเช่า" icon={Printer} className="w-full justify-center" />
          <WhiteButton label="พิมพ์ใบสรุปบิล" icon={FileText} className="w-full justify-center" />
          <div className="relative group w-full">
            <button disabled={isDownloading}
              className="w-full h-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl font-bold text-sm bg-green-100 text-green-700 hover:bg-green-200 border border-green-200 disabled:opacity-50 transition-all">
              {isDownloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              ดาวน์โหลด
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            <div className="absolute left-0 top-full mt-1 z-40 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden min-w-[140px] hidden group-hover:block">
              <button onClick={() => handleDownload("xlsx")} className="w-full text-left px-4 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-50 flex items-center gap-2">
                <FileText size={14} className="text-green-600" /> Excel (.xlsx)
              </button>
              <button onClick={() => handleDownload("csv")} className="w-full text-left px-4 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-50 flex items-center gap-2">
                <FileText size={14} className="text-blue-600" /> CSV (.csv)
              </button>
            </div>
          </div>
          <GreenButton label={`ส่งบิล (${selectedRooms.length})`} icon={Send} onClick={() => setShowSummary(true)} disabled={selectedRooms.length === 0} className="w-full justify-center" />
        </div>

        <div className="flex items-center justify-between gap-3 w-full max-w-5xl mx-auto px-2">
          <div className="relative" ref={buildingDropdownRef}>
            <button onClick={()=>setShowBuildingDropdown((prev)=>!prev)} className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200 min-w-[120px]">
              <span className="flex-1 text-left">{activeBuilding==="ALL"?"ทุกอาคาร":`อาคาร ${activeBuilding}`}</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-200 ${showBuildingDropdown?"rotate-180":""}`}><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            {showBuildingDropdown && (
              <div className="absolute left-0 top-full mt-2 z-40 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden min-w-[150px]">
                {buildings.map((b) => {
                  const isActive = activeBuilding === b;
                  return (
                    <button key={b} onClick={()=>{setActiveBuilding(b);setShowBuildingDropdown(false);}} className={`w-full text-left px-4 py-2.5 text-sm font-bold transition-colors flex items-center gap-2 ${isActive?"bg-gray-600 text-white":"text-gray-600 hover:bg-gray-50"}`}>
                      <span className={`w-4 h-4 flex items-center justify-center ${isActive?"opacity-100":"opacity-0"}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      </span>
                      {b==="ALL"?"ทุกอาคาร":`อาคาร ${b}`}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <div className="flex gap-2 shrink-0">
            {!isSelectMode ? (
              <BlueButton label="เลือกห้อง" className="px-6" onClick={()=>setIsSelectMode(true)} />
            ) : (
              <>
                <BlueButton label="เลือกทั้งหมด" onClick={()=>setSelectedRooms(roomsData.map((r)=>r.roomNumber))} />
                <BlueButton label="ยกเลิก" onClick={()=>{setSelectedRooms([]);setIsSelectMode(false);}} />
              </>
            )}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="py-32 flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-12 h-12 text-orange-400 animate-spin" />
          <p className="text-gray-500 font-bold animate-pulse">กำลังโหลดข้อมูลบิล...</p>
        </div>
      ) : (
        <div className="space-y-8">
          {finalFloors.map((floor) => (
            <LazyFloor key={floor} floor={floor} rooms={filteredByBuilding[floor]}
              isSelectMode={isSelectMode} selectedRooms={selectedRooms}
              onToggleSelect={toggleRoomSelection}
              onNavigate={(roomNumber)=>navigate(`/billings/${roomNumber}`)}
              onSelectAll={selectAllInFloor}
              onDeselectFloor={deselectFloor} />
          ))}
          {finalFloors.length===0 && <div className="text-center py-20 text-gray-400 font-bold">ไม่พบห้องพักค่ะ</div>}
        </div>
      )}

      {/* Generate Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={()=>!isConfirming&&setShowGenerateModal(false)}>
          <div className="bg-white rounded-[40px] w-full max-w-5xl p-10 shadow-2xl flex flex-col max-h-[90vh]" onClick={(e)=>e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black text-gray-800">ตรวจสอบบิลก่อนสร้าง</h3>
              {!isConfirming && <button onClick={()=>setShowGenerateModal(false)} className="p-2 hover:bg-gray-100 rounded-full"><X size={28} strokeWidth={3}/></button>}
            </div>
            {isGenerating ? (
              <div className="py-20 flex flex-col items-center gap-4"><Loader2 className="w-12 h-12 text-orange-400 animate-spin"/><p className="text-gray-500 font-bold animate-pulse">กำลังคำนวณบิล...</p></div>
            ) : generateError ? (
              <div className="py-20 text-center text-red-500 font-bold">{generateError}</div>
            ) : (
              <>
                <div className="overflow-x-auto overflow-y-auto rounded-3xl border-2 border-gray-100 mb-6 max-h-[50vh]">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead className="bg-gray-50 text-gray-600 uppercase sticky top-0">
                      <tr>
                        <th className="p-4 font-black border-r border-gray-200 text-center">ห้อง</th>
                        <th className="p-4 font-black border-r border-gray-200">ชื่อผู้เช่า</th>
                        <th className="p-4 font-black border-r border-gray-200 text-right">ค่าเช่า</th>
                        <th className="p-4 font-black border-r border-gray-200 text-right">ค่าไฟ</th>
                        <th className="p-4 font-black border-r border-gray-200 text-right">ค่าน้ำ</th>
                        <th className="p-4 font-black border-r border-gray-200 text-right">บริการอื่นๆ</th>
                        <th className="p-4 font-black text-right text-[#2E86C1] bg-blue-50/50">รวม</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {previewRows.map((r)=>(
                        <tr key={r.contractId} className={`hover:bg-blue-50/20 ${r.alreadyExists?"opacity-40":""}`}>
                          <td className="p-4 font-black text-gray-700 border-r border-gray-100 text-center bg-gray-50/30">{r.roomNumber}{r.alreadyExists&&<span className="ml-1 text-[10px] text-orange-500 font-bold">มีแล้ว</span>}</td>
                          <td className="p-4 text-gray-600 font-bold border-r border-gray-100">{r.tenantFirstName||"-"}</td>
                          <td className="p-4 text-right border-r border-gray-100">{Number(r.rent).toLocaleString()}</td>
                          <td className="p-4 text-right border-r border-gray-100">{Number(r.electric).toLocaleString()}</td>
                          <td className="p-4 text-right border-r border-gray-100">{Number(r.water).toLocaleString()}</td>
                          <td className="p-4 text-right border-r border-gray-100">{(r.internet+r.laundry+r.otherService).toLocaleString()}</td>
                          <td className="p-4 text-right font-black text-[#2E86C1] bg-blue-50/30">{Number(r.total).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {previewRows.some((r)=>r.calculationNote) && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <p className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">รายละเอียดการคำนวณ</p>
                    {previewRows.filter((r)=>r.calculationNote).map((r)=>(
                      <p key={r.contractId} className="text-sm text-gray-600 font-medium"><span className="font-black">ห้อง {r.roomNumber}:</span> {r.calculationNote}</p>
                    ))}
                  </div>
                )}
                <div className="flex justify-end gap-4">
                  <button onClick={()=>setShowGenerateModal(false)} className="px-6 py-3 rounded-xl bg-gray-100 text-gray-500 font-bold hover:bg-gray-200 transition-all">ยกเลิก</button>
                  <OrangeButton label={isConfirming?"กำลังบันทึก...":"ยืนยันสร้างบิล"} icon={isConfirming?Loader2:Plus} onClick={handleConfirmGenerate} disabled={isConfirming||previewRows.filter((r)=>!r.alreadyExists).length===0} className="px-8" />
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Summary Modal */}
      {showSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={()=>setShowSummary(false)}>
          <div className="bg-white rounded-[40px] w-full max-w-6xl p-10 shadow-2xl flex flex-col max-h-[90vh]" onClick={(e)=>e.stopPropagation()}>
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-3xl font-black text-gray-800">ตรวจสอบยอดรวมก่อนส่งบิล</h3>
              <button onClick={()=>setShowSummary(false)} className="p-2 hover:bg-gray-100 rounded-full"><X size={32} strokeWidth={3}/></button>
            </div>
            <div className="overflow-x-auto rounded-3xl border-2 border-gray-100 mb-8">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 text-gray-600 text-sm uppercase sticky top-0">
                  <tr>
                    <th className="p-5 font-black border-r border-gray-200 text-center w-24">ห้อง</th>
                    <th className="p-5 font-black border-r border-gray-200">ชื่อผู้เช่า</th>
                    <th className="p-5 font-black border-r border-gray-200 text-right">ค่าเช่า</th>
                    <th className="p-4 font-bold border-r border-gray-200 text-right">ค่าน้ำ</th>
                    <th className="p-4 font-bold border-r border-gray-200 text-right">ค่าไฟ</th>
                    <th className="p-4 font-bold border-r border-gray-200 text-right">บริการอื่นๆ</th>
                    <th className="p-5 font-black text-right text-[#2E86C1] bg-blue-50/50">ยอดรวมสุทธิ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {summaryRows.map((r)=>(
                    <tr key={r.roomNumber} className="hover:bg-blue-50/20 transition-colors">
                      <td className="p-5 font-black text-gray-700 border-r border-gray-100 text-center bg-gray-50/30">{r.roomNumber}</td>
                      <td className="p-5 text-gray-600 font-bold border-r border-gray-100">{r.tenantFirstName||"-"}</td>
                      <td className="p-5 text-right font-medium border-r border-gray-100">{Number(r.rent).toLocaleString()}</td>
                      <td className="p-4 text-right border-r border-gray-100">{Number(r.water).toLocaleString()}</td>
                      <td className="p-4 text-right border-r border-gray-100">{Number(r.electric).toLocaleString()}</td>
                      <td className="p-4 text-right border-r border-gray-100">{Number(r.otherService).toLocaleString()}</td>
                      <td className="p-5 text-right font-black text-[#2E86C1] bg-blue-50/30">{Number(r.total).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end">
              <GreenButton label="ยืนยันการส่งบิล" icon={Send} onClick={()=>{alert("ฟีเจอร์ส่งบิลผ่าน Line OA กำลังพัฒนาค่ะ");setShowSummary(false);}} />
            </div>
          </div>
        </div>
      )}

      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={()=>setShowHelpModal(false)}>
          <div className="bg-white rounded-[40px] w-full max-w-xl p-10 relative shadow-2xl" onClick={(e)=>e.stopPropagation()}>
            <button onClick={()=>setShowHelpModal(false)} className="absolute right-8 top-8 text-gray-400 hover:text-black"><X size={28} strokeWidth={3}/></button>
            <h3 className="text-2xl font-bold text-center mb-10">คำอธิบายสถานะบิล</h3>
            <div className="grid grid-cols-3 gap-6 text-center">
              {[
                { color:"bg-[#10b981]", label:"ชำระเงินแล้ว",    badge:false },
                { color:"bg-[#94a3b8]", label:"รอชำระเงิน",      badge:false },
                { color:"bg-[#fb7185]", label:"ค้างชำระ",         badge:true  },
              ].map((item, idx) => (
                <div key={idx} className="flex flex-col items-center gap-3">
                  <div className={`relative w-14 h-14 ${item.color} rounded-2xl shadow-inner`}>
                    {item.badge && (
                      <div className="absolute -top-2 -left-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center border-2 border-white text-[10px] font-black">
                        1+
                      </div>
                    )}
                  </div>
                  <span className="text-sm font-bold text-gray-700">{item.label}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 text-center mt-8 font-medium">
              ตัวเลขบน badge = จำนวนเดือนที่ค้างชำระย้อนหลัง
            </p>
          </div>
        </div>
      )}

      {/* Filter Modal */}
      <FilterModal isOpen={showFilterModal} onClose={()=>setShowFilterModal(false)} title="สถานะการชำระเงิน" onClear={()=>setActiveStatusFilters([])} onConfirm={()=>setShowFilterModal(false)} maxWidth="max-w-xl">
        <div className="grid grid-cols-3 gap-4">
          {[
            { id:"occupied", label:"จ่ายแล้ว"   },
            { id:"pending",  label:"รอชำระเงิน"  },
            { id:"overdue",  label:"ค้างชำระ"     },
          ].map((item)=>(
            <button key={item.id} onClick={()=>toggleStatusFilter(item.id)}
              className={`py-4 rounded-2xl text-base font-bold border-2 transition-all
                ${activeStatusFilters.includes(item.id)
                  ?"border-[#F5A623] bg-[#FFF7ED] text-[#F5A623]"
                  :"border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200"}`}>
              {item.label}
            </button>
          ))}
        </div>
      </FilterModal>
    </>
  );
};

export default Billing;