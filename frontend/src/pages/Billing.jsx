import React, { useState, useEffect, useMemo, useCallback, useRef, useDeferredValue } from "react";
import { createPortal } from "react-dom";
import {
  HelpCircle, CheckSquare, Printer, FileText,
  Send, Plus, X, RotateCw, Filter as FilterIcon,
  Loader2, Download, AlertTriangle, ChevronDown
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
import { adminService }    from "../api/AdminApi";
import { apartmentService } from "../api/ApartmentApi";

import BillMonthlyPrintTemplate from "../components/BillMonthlyPrintTemplate";
import BillSummaryPrintTemplate from "../components/BillSummaryPrintTemplate";

// ── CSS จัดการหน้าพิมพ์ ──────────────────────────────────────────
const printStyles = `
  @media screen {
    #printable-area { display: none !important; }
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

    #printable-area {
      display: block !important;
      width: 100% !important;
    }

    .print-sheet {
      width: 210mm !important;
      height: 297mm !important;
      margin: 0 auto !important;
      padding: 0 !important;
      background: white !important;
      page-break-after: always !important;
      break-after: page !important;
      display: block !important;
      box-sizing: border-box !important;
    }

    .print-sheet:last-child {
      page-break-after: auto !important;
      break-after: auto !important;
    }

    @page { 
      size: A4 portrait; 
      margin: 0 !important; 
    }
  }
`;

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
  rent:            result.roomRate      ?? 0,
  electric:        result.electricalCost  ?? 0,
  water:           result.waterCost       ?? 0,
  internet:        result.internetCost    ?? 0,
  laundry:         result.laundryCost     ?? 0,
  otherService:    0,
  total:           result.totalAmount     ?? 0,
  calculationNote: result.calculationNote ?? "",
  alreadyExists:   result.alreadyExists   ?? false,
});

// ✨ ฟังก์ชัน Generate Excel 
const downloadExcel = async (rows, selectedDate, format = "xlsx") => {
  const XLSX = await import("https://cdn.sheetjs.com/xlsx-0.20.1/package/xlsx.mjs");
  const [year, month] = selectedDate.split("-").map(Number);
  const monthNames = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];
  const monthLabel = `${monthNames[month - 1]}${year + 543}`;
  
  const data = [
    ["ห้อง", "ชื่อผู้เช่า", "สถานะบิล", "ค่าเช่า", "ค่าไฟ", "ค่าน้ำ", "บริการอื่นๆ", "รวมสุทธิ", "หมายเหตุ"],
    ...rows.map((r) => [r.roomNumber, r.tenantFirstName || "-", r.contractStatus || "-", r.rent, r.electric, r.water, r.otherService, r.total, r.calculationNote || ""]),
  ];
  
  const ws = XLSX.utils.aoa_to_sheet(data);
  ws["!cols"] = [{wch:8},{wch:16},{wch:12},{wch:12},{wch:12},{wch:12},{wch:14},{wch:12},{wch:30}];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, `บิล ${monthLabel}`);
  const filename = `สรุปบิล_${monthLabel}`;
  
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
    <div ref={ref} className="bg-gray-50 p-4 sm:p-6 rounded-[25px] sm:rounded-[35px] border border-gray-200 shadow-sm">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-6 px-2">
        <h2 className="text-xl font-bold text-gray-700">ชั้น {floor}</h2>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-6 justify-items-center">
          {rooms.map((room) => (
            <div key={room.roomId} className="w-full max-w-[130px] h-28 rounded-2xl bg-gray-200 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-6 justify-items-center">
          {rooms.map((room) => {
            const isSelected = selectedRooms.includes(room.roomNumber);
            return (
              <div
                key={room.roomId}
                onClickCapture={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (isSelectMode) {
                    onToggleSelect(room.roomNumber);
                  } else {
                    onNavigate(room.roomNumber);
                  }
                }}
                className="relative cursor-pointer hover:scale-105 transition-all w-full max-w-[130px]"
              >
                <div className="pointer-events-none">
                  <RoomCard
                    roomId={room.roomId}
                    roomNumber={room.roomNumber}
                    building={room.building}
                    tenantName={room.tenantFirstName || ""}
                    status={room.billingStatus}
                    overdueCount={room.overdueCount}
                    icons={[]}
                  />
                </div>

                <div className="absolute inset-x-0 top-0 flex items-center justify-center pointer-events-none z-20" style={{ height: "80px" }}>
                  <span className="text-[13px] text-white font-bold drop-shadow text-center px-1 leading-tight">
                    {room.hasBill ? `${Number(room.total).toLocaleString()} ฿` : ""}
                  </span>
                </div>

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

  const [printType, setPrintType] = useState(null); 
  const [adminInfo, setAdminInfo] = useState(null);
  const [apartmentInfo, setApartmentInfo] = useState(null);
  const [cycleDates, setCycleDates] = useState({ start: "-", end: "-" });

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

  useEffect(() => {
    const handleAfterPrint = () => {
      setPrintType(null);
    };
    window.addEventListener("afterprint", handleAfterPrint);
    return () => window.removeEventListener("afterprint", handleAfterPrint);
  }, []);

  useEffect(() => {
    if (printType) {
      const originalTitle = document.title;
      const [year, month] = selectedDate.split("-").map(Number);
      const monthNames = ["มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน","กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"];
      const fileName = `บิลเดือน${monthNames[month - 1]} ${year + 543}`;
      
      document.title = printType === "summary" ? `สรุปยอด_${fileName}` : fileName;

      const timer = setTimeout(() => {
        window.print();
        document.title = originalTitle; 
      }, 800); 

      return () => clearTimeout(timer);
    }
  }, [printType, selectedDate]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const currentAdminId = localStorage.getItem("adminId") || 1;
      const [adm, aptRes] = await Promise.all([
        adminService.getAdmin(currentAdminId).catch(() => null),
        apartmentService.getAllApartment().catch(() => [])
      ]);
      
      if (adm) setAdminInfo(adm);
      else setAdminInfo({ firstName: "ผู้ดูแลระบบ", lastName: "" });

      const allApt = extractArray(aptRes);
      const aptData = allApt.length > 0 ? allApt[0] : null;
      if (aptData) setApartmentInfo(aptData);

      const [year, month] = selectedDate.split("-").map(Number);
      const startDay = aptData?.paymentDueStart || 1;
      const prevMonth = month === 1 ? 12 : month - 1;
      const prevYear = month === 1 ? year - 1 : year;
      setCycleDates({ 
        start: `${String(startDay).padStart(2, '0')}/${String(prevMonth).padStart(2, '0')}/${prevYear + 543}`,
        end: `${String(startDay).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year + 543}`
      });

      const contractsPromise = allContractsCache.length > 0
        ? Promise.resolve(allContractsCache)
        : contractService.getAllContracts().catch(() => []);

      const [allRoomsRes, allPaymentsRes, contractsRes] = await Promise.all([
        roomService.getRoomOverview().catch(() => []),
        paymentService.getPayments().catch(() => []),
        contractsPromise,
      ]);

      const rawRooms    = extractArray(allRoomsRes);
      const rawPayments = extractArray(allPaymentsRes);
      const rawContracts = extractArray(contractsRes);

      if (allContractsCache.length === 0 && rawContracts.length > 0) {
        setAllContractsCache(rawContracts);
      }

      const contractByRoom = {};
      rawContracts.forEach((c) => {
        const cStatus = (c.status || c.Status || "").toLowerCase();
        if (cStatus === "active" || cStatus === "reserved") {
          contractByRoom[Number(c.roomId || c.RoomId)] = Number(c.id || c.Id);
        }
      });

      const paymentByContract = {}; 
      const overdueCountByContract = {}; 

      rawPayments.forEach((p) => {
        const cid = Number(p.contractId || p.ContractId);
        const dateStr = (p.recordDate || p.RecordDate || "").substring(0, 10);
        if (!dateStr) return;
        const [pYear, pMonth] = dateStr.split("-").map(Number);

        if (pYear === year && pMonth === month) paymentByContract[cid] = p;
        if ((p.status || "").toLowerCase() === "unpaid") overdueCountByContract[cid] = (overdueCountByContract[cid] || 0) + 1;
      });

      const normalized = rawRooms.map((r) => {
        const rId = r.roomId || r.id || r.Id;
        const contractId = contractByRoom[Number(rId)];
        if (!contractId) return null;

        const payment = paymentByContract[contractId] ?? null;
        const overdueCount = overdueCountByContract[contractId] ?? 0;
        const currentStatus = (payment?.status || payment?.Status || "").toLowerCase();

        let billingStatus = "pending"; 
        if (currentStatus === "paid") {
          billingStatus = "occupied";
        } else if (overdueCount >= 1) {
          billingStatus = "overdue";
        }

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
          overdueCount,    
          tenantFirstName: r.tenantFirstName || "",
          contractId,
          paymentId:       payment?.id || payment?.Id || null,
          total:           manualTotal, 
          rent: rRate, electric: eCost, water: wCost,
          other: internet + laundry + addCost, discount: disc,
          hasBill:         payment !== null,
          calculationNote: payment?.note || payment?.Note || "" 
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

  // ✨ สร้างรายชื่ออาคารแบบไม่ซ้ำจากข้อมูลที่มีอยู่
  const uniqueBuildings = useMemo(() => {
    return [...new Set(roomsData.map(r => r.building).filter(Boolean))];
  }, [roomsData]);

  const handlePrintBills = () => {
    if (selectedRooms.length === 0) return alert("กรุณาเลือกห้องก่อนพิมพ์บิล");
    setPrintType("bills");
  };

  const handlePrintSummary = () => {
    if (selectedRooms.length === 0) return alert("กรุณาเลือกห้องก่อนพิมพ์ใบสรุป");
    setPrintType("summary");
  };

  const handleGenerateClick = async () => {
    setGenerateError(""); setPreviewRows([]); setIsGenerating(true); setShowGenerateModal(true);
    try {
      const [year, month] = selectedDate.split("-").map(Number);
      const roomsWithoutBill = roomsData.filter((r) => !r.hasBill && r.contractId);
      if (roomsWithoutBill.length === 0) { setGenerateError("ทุกห้องมีบิลในเดือนนี้แล้ว"); setIsGenerating(false); return; }
      const results = await Promise.allSettled(
        roomsWithoutBill.map((r) =>
          paymentService.generatePayment(r.contractId, year, month)
            .then((res) => calcResultToRow(res, r.roomNumber, r.tenantFirstName))
        )
      );
      const rows = results.filter((r) => r.status === "fulfilled").map((r) => r.value);
      rows.length === 0 ? setGenerateError("ไม่สามารถคำนวณบิลได้ กรุณาตรวจสอบข้อมูล") : setPreviewRows(rows);
    } catch (err) {
      setGenerateError("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
    } finally { setIsGenerating(false); }
  };

  const handleConfirmGenerate = async () => {
    setIsConfirming(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const loggedInAdminId = localStorage.getItem("adminId") || 1; 

      await Promise.all(
        previewRows.filter((r) => !r.alreadyExists).map((r) =>
          paymentService.createPayment({ 
            contractId: r.contractId, 
            recordDate: today, 
            adminId: loggedInAdminId, 
            roomRate: r.rent, electricalCost: r.electric, waterCost: r.water, internetCost: r.internet, laundryCost: r.laundry, calculationNote: r.calculationNote 
          })
        )
      );
      setShowGenerateModal(false); setPreviewRows([]); await loadData();
    } catch (err) { setGenerateError("บันทึกบิลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง"); }
    finally { setIsConfirming(false); }
  };

  const handleDownload = async (format) => {
    setIsDownloading(true);
    try {
      const [year, month] = selectedDate.split("-").map(Number);
      
      const allPaymentsRes = await paymentService.getPayments();
      const rawPayments = extractArray(allPaymentsRes);

      const targetPayments = rawPayments.filter((p) => {
        const dateStr = p.recordDate || p.RecordDate || "";
        if (!dateStr) return false;
        
        const [pYear, pMonth] = dateStr.substring(0, 10).split("-").map(Number);
        return pYear === year && pMonth === month;
      });

      if (targetPayments.length === 0) {
        alert(`ไม่มีข้อมูลการออกบิลในเดือน ${month}/${year} ให้ดาวน์โหลด`);
        setIsDownloading(false);
        return;
      }

      const rows = targetPayments.map((p) => {
        const cid = Number(p.contractId || p.ContractId);
        const roomInfo = roomsData.find(r => r.contractId === cid) || {};
        
        let statusText = "รอชำระเงิน";
        const pStatus = (p.status || p.Status || "").toLowerCase();
        if (pStatus === "paid") statusText = "ชำระเงินแล้ว";
        else if (pStatus === "overdue") statusText = "ค้างชำระ";

        const otherService = Number(p.internetCost || p.InternetCost || 0) 
                           + Number(p.laundryCost || p.LaundryCost || 0) 
                           + Number(p.additionalCost || p.AdditionalCost || 0);

        return {
          roomNumber: roomInfo.roomNumber || "-",
          tenantFirstName: roomInfo.tenantFirstName || "-",
          contractStatus: statusText,
          rent: Number(p.roomRate || p.RoomRate || 0),
          electric: Number(p.electricalCost || p.ElectricalCost || p.ElectricalPricePerUnit || 0),
          water: Number(p.waterCost || p.WaterCost || p.WaterPricePerUnit || 0),
          otherService: otherService,
          total: Number(p.totalAmount || p.TotalAmount || 0),
          calculationNote: p.note || p.Note || ""
        };
      });

      rows.sort((a,b) => a.roomNumber.localeCompare(b.roomNumber, "th", {numeric: true}));
      
      await downloadExcel(rows, selectedDate, format);
    } catch (err) {
      console.error(err); 
      alert("ดาวน์โหลดไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      setIsDownloading(false);
    }
  };

  const filteredRoomsByFloor = useMemo(() => {
    const grouped = {};
    roomsData.forEach((room) => {
      const matchesSearch = room.roomNumber.includes(deferredSearch) || room.tenantFirstName.includes(deferredSearch);
      const matchesStatus = deferredFilters.length === 0 || deferredFilters.includes(room.billingStatus);
      if (matchesSearch && matchesStatus && (activeBuilding === "ALL" || room.building === activeBuilding)) {
        if (!grouped[room.floor]) grouped[room.floor] = [];
        grouped[room.floor].push(room);
      }
    });
    return grouped;
  }, [roomsData, deferredSearch, deferredFilters, activeBuilding]);

  const finalFloors = Object.keys(filteredRoomsByFloor).sort((a,b) => Number(a)-Number(b));
  const summaryRows = roomsData.filter((r) => selectedRooms.includes(r.roomNumber));

  const toggleRoomSelection = (roomNum) =>
    setSelectedRooms((prev) => prev.includes(roomNum) ? prev.filter((id)=>id!==roomNum) : [...prev,roomNum]);

  const toggleStatusFilter = (status) =>
    setActiveStatusFilters((prev) => prev.includes(status) ? prev.filter((s)=>s!==status) : [...prev,status]);

  const printContent = printType && (
    <div id="printable-area">
      {printType === "bills" && summaryRows.map((room) => (
        <div key={room.roomNumber} className="print-sheet">
          <BillMonthlyPrintTemplate
            roomNumber={room.roomNumber}
            total={room.total}
            apartmentInfo={apartmentInfo}
            adminName={adminInfo && adminInfo.firstName ? `${adminInfo.firstName} ${adminInfo.lastName}` : "ผู้ดูแลระบบ"}
            customerInfo={{ firstName: room.tenantFirstName, lastName: "" }}
            contractInfo={cycleDates}
            items={[
              { type: 'rent', amount: room.rent },
              { type: 'electric', amount: room.electric },
              { type: 'water', amount: room.water },
              ...(room.other > 0 ? [{ type: 'other', label: 'บริการอื่นๆ', amount: room.other }] : []),
              ...(room.discount > 0 ? [{ type: 'discount', label: 'ส่วนลด', amount: room.discount }] : [])
            ].filter(item => item.amount !== 0)}
          />
        </div>
      ))}
      {printType === "summary" && (
        <BillSummaryPrintTemplate rooms={summaryRows} selectedDate={selectedDate} />
      )}
    </div>
  );

  return (
    <>
      <style>{printStyles}</style>

      {/* ── Main UI Area ── */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-center mb-6 sm:mb-8 text-gray-800">การสร้างบิล</h1>

        <div className="flex flex-col gap-4 sm:gap-5 mb-6 sm:mb-8">
          <div className="flex flex-wrap sm:flex-nowrap items-center justify-center gap-2 sm:gap-3 w-full px-2">
            <span className="font-bold text-gray-600 shrink-0">รอบบิล</span>
            <CustomMonthPicker value={selectedDate} onChange={setSelectedDate} className="w-full sm:w-64" />
            <OrangeButton label="สร้างบิลใหม่" icon={Plus} onClick={handleGenerateClick} className="w-full sm:w-auto shadow-md py-2.5 px-5 justify-center" />
            <button onClick={loadData} className="p-3 rounded-xl border transition-all flex items-center justify-center h-12 w-12 shrink-0 bg-white border-gray-200 text-gray-500 hover:border-[#f3a638] hover:text-[#f3a638] hover:bg-orange-50 group">
              <RotateCw size={20} className="transition-transform duration-500 group-hover:rotate-180" />
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 w-full px-4">
            <div className="w-full sm:w-72"><SearchBar value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
            
            <div className="flex w-full sm:w-auto gap-2 justify-center">
              {/* ✨ ปุ่ม Filter และนับจำนวนตัวกรองที่ใช้งานอยู่ */}
              <div className="relative flex-1 sm:flex-none">
                <button onClick={() => setShowFilterModal(true)} className="w-full justify-center p-3 rounded-xl border bg-white border-gray-200 text-gray-500 relative flex items-center">
                  <FilterIcon size={20} />
                  {activeFilterCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                      {activeFilterCount}
                    </span>
                  )}
                </button>
              </div>

              {/* ✨ ปุ่มเปิด Modal คำอธิบาย */}
              <button onClick={() => setShowHelpModal(true)} className="flex-1 sm:flex-none h-[48px] px-4 rounded-xl border bg-white border-gray-200 text-gray-500 font-bold flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors">
                คำอธิบาย <HelpCircle size={20} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 w-full max-w-3xl mx-auto px-4">
            <WhiteButton label="พิมพ์บิลค่าเช่า" icon={Printer} className="w-full justify-center" onClick={handlePrintBills} />
            <WhiteButton label="พิมพ์ใบสรุปบิล" icon={FileText} className="w-full justify-center" onClick={handlePrintSummary} />
            
            <div className="relative group w-full">
              {/* รองรับ active และ focus-within สำหรับมือถือ */}
              <button disabled={isDownloading} className="w-full h-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl font-bold text-sm bg-green-100 text-green-700 hover:bg-green-200 border border-green-200 disabled:opacity-50 transition-all">
                {isDownloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} ดาวน์โหลด
              </button>
              <div className="absolute left-0 top-full pt-1 z-40 w-full min-w-[140px] hidden group-hover:block focus-within:block active:block">
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                  <button onClick={() => handleDownload("xlsx")} className="w-full text-left px-4 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-50 flex items-center gap-2"><FileText size={14} className="text-green-600" /> Excel (.xlsx)</button>
                  <button onClick={() => handleDownload("csv")} className="w-full text-left px-4 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-50 flex items-center gap-2"><FileText size={14} className="text-blue-600" /> CSV (.csv)</button>
                </div>
              </div>
            </div>
            
            <GreenButton label={`ส่งบิล (${selectedRooms.length})`} icon={Send} disabled={selectedRooms.length === 0} onClick={() => setShowSummary(true)} className="w-full justify-center" />
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 max-w-5xl mx-auto w-full px-4 mt-2">
            {/* ✨ Dropdown เลือกอาคารแบบทำงานได้จริง */}
            <div className="relative w-full sm:w-auto" ref={buildingDropdownRef}>
              <button
                onClick={() => setShowBuildingDropdown((prev) => !prev)}
                className="flex justify-between sm:justify-start w-full sm:w-auto items-center gap-2 font-bold text-gray-600 bg-gray-100 px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-200 transition-colors"
              >
                {activeBuilding === "ALL" ? "ทุกอาคาร" : `อาคาร ${activeBuilding}`}
                <ChevronDown size={16} className={`transition-transform ${showBuildingDropdown ? 'rotate-180' : ''}`} />
              </button>
              {showBuildingDropdown && (
                <div className="absolute left-0 top-full mt-1 z-40 bg-white border border-gray-100 rounded-xl shadow-lg w-full sm:w-48 overflow-hidden py-1">
                  <button
                    onClick={() => { setActiveBuilding("ALL"); setShowBuildingDropdown(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm font-bold hover:bg-gray-50 ${activeBuilding === "ALL" ? "text-orange-500 bg-orange-50/50" : "text-gray-600"}`}
                  >
                    ทุกอาคาร
                  </button>
                  {uniqueBuildings.map(b => (
                    <button
                      key={b}
                      onClick={() => { setActiveBuilding(b); setShowBuildingDropdown(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm font-bold hover:bg-gray-50 ${activeBuilding === b ? "text-orange-500 bg-orange-50/50" : "text-gray-600"}`}
                    >
                      อาคาร {b}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              {!isSelectMode ? (
                <BlueButton label="เลือกห้อง" onClick={() => setIsSelectMode(true)} className="w-full sm:w-auto justify-center" />
              ) : (
                <>
                  <BlueButton label="เลือกทั้งหมด" onClick={() => setSelectedRooms(roomsData.map(r => r.roomNumber))} className="flex-1 sm:flex-none justify-center" />
                  <BlueButton label="ยกเลิก" onClick={() => { setIsSelectMode(false); setSelectedRooms([]); }} className="flex-1 sm:flex-none justify-center" />
                </>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6 sm:space-y-8 px-2 sm:px-0">
          {finalFloors.length === 0 ? (
            <div className="py-20 text-center text-gray-400 font-bold">ไม่พบข้อมูลห้องที่ตรงกับเงื่อนไขการค้นหา</div>
          ) : (
            finalFloors.map((floor) => (
              <LazyFloor key={floor} floor={floor} rooms={filteredRoomsByFloor[floor]}
                isSelectMode={isSelectMode} selectedRooms={selectedRooms}
                onToggleSelect={toggleRoomSelection}
                onNavigate={(roomNumber)=>navigate(`/billings/${roomNumber}`)}
                onSelectAll={(f) => setSelectedRooms(prev => [...new Set([...prev, ...filteredRoomsByFloor[f].map(r => r.roomNumber)])])}
                onDeselectFloor={(f) => setSelectedRooms(prev => prev.filter(n => !filteredRoomsByFloor[f].map(r => r.roomNumber).includes(n)))} />
            ))
          )}
        </div>
      </div>

      {printType && createPortal(printContent, document.body)}

      {/* ── Modal ต่างๆ ── */}

      {/* ✨ 1. Filter Modal */}
      {showFilterModal && (
        <FilterModal
          isOpen={showFilterModal}
          onClose={() => setShowFilterModal(false)}
          title="ตัวกรองสถานะบิล"
          onClear={() => setActiveStatusFilters([])}
          onConfirm={() => setShowFilterModal(false)}
          maxWidth="max-w-xl"
        >
          <div className="mb-2">
            <p className="text-lg font-bold text-gray-600 mb-4">สถานะบิลในเดือนนี้</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: "pending",   label: "รอดำเนินการ" },
                { id: "occupied",  label: "ชำระแล้ว" },
                { id: "overdue",   label: "ค้างชำระ" },
              ].map((item) => (
                <button 
                  key={item.id} 
                  onClick={() => toggleStatusFilter(item.id)}
                  className={`py-3 rounded-xl text-base font-bold transition-all border-2
                    ${activeStatusFilters.includes(item.id)
                      ? "border-[#F5A623] bg-[#FFF7ED] text-[#F5A623]"
                      : "border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200"}`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </FilterModal>
      )}

      {/* ✨ 2. Help Modal (คำอธิบายสถานะ) */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowHelpModal(false)}>
          <div className="bg-white rounded-[32px] w-full max-w-md p-6 sm:p-8 shadow-2xl flex flex-col animate-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl sm:text-2xl font-black text-gray-800 flex items-center gap-2"><HelpCircle className="text-orange-400" /> คำอธิบายสถานะบิล</h3>
              <button onClick={() => setShowHelpModal(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400"><X size={24} strokeWidth={3}/></button>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-4 p-4 bg-gray-50 border border-gray-100 rounded-2xl">
                 <div className="w-4 h-4 rounded-full bg-gray-300 shadow-inner shrink-0"></div>
                 <div><p className="font-bold text-gray-700 leading-none mb-1">รอดำเนินการ</p><p className="text-xs text-gray-500 font-medium">ยังไม่ได้สร้างบิล หรือยังไม่มีข้อมูลในรอบบิลนี้</p></div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
                 <div className="w-4 h-4 rounded-full bg-[#10b981] shadow-inner shrink-0"></div>
                 <div><p className="font-bold text-[#10b981] leading-none mb-1">ชำระแล้ว</p><p className="text-xs text-[#10b981]/70 font-medium">ชำระเงินเรียบร้อยแล้ว</p></div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-red-50 border border-red-100 rounded-2xl">
                 <div className="w-4 h-4 rounded-full bg-red-500 shadow-inner shrink-0"></div>
                 <div><p className="font-bold text-red-700 leading-none mb-1">ค้างชำระ</p><p className="text-xs text-red-600/70 font-medium">มีบิลค้างชำระจากรอบก่อนหน้า</p></div>
              </div>
            </div>
            <button onClick={() => setShowHelpModal(false)} className="mt-6 w-full py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold transition-all">เข้าใจแล้ว</button>
          </div>
        </div>
      )}

      {showSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={()=>setShowSummary(false)}>
          <div className="bg-white rounded-[40px] w-full max-w-6xl p-5 sm:p-10 shadow-2xl flex flex-col max-h-[90vh]" onClick={(e)=>e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4 sm:mb-8">
              <h3 className="text-xl sm:text-3xl font-black text-gray-800">ตรวจสอบยอดรวมก่อนส่งบิล</h3>
              <button onClick={()=>setShowSummary(false)} className="p-2 hover:bg-gray-100 rounded-full"><X size={32} strokeWidth={3}/></button>
            </div>
            <div className="overflow-x-auto rounded-3xl border-2 border-gray-100 mb-4 sm:mb-8">
              <table className="w-full text-left border-collapse min-w-[400px]">
                <thead className="bg-gray-50 text-gray-600 text-xs sm:text-sm uppercase sticky top-0">
                  <tr>
                    <th className="p-3 sm:p-5 font-black border-r border-gray-200 text-center w-16 sm:w-24">ห้อง</th>
                    <th className="p-3 sm:p-5 font-black border-r border-gray-200">ชื่อผู้เช่า</th>
                    <th className="p-3 sm:p-5 font-black border-r border-gray-200 text-right">ยอดรวมสุทธิ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs sm:text-sm">
                  {summaryRows.map((r)=>(
                    <tr key={r.roomNumber} className="hover:bg-blue-50/20 transition-colors">
                      <td className="p-3 sm:p-5 font-black text-gray-700 border-r border-gray-100 text-center bg-gray-50/30">{r.roomNumber}</td>
                      <td className="p-3 sm:p-5 text-gray-600 font-bold border-r border-gray-100">{r.tenantFirstName||"-"}</td>
                      <td className="p-3 sm:p-5 text-right font-black text-[#2E86C1] bg-blue-50/30">{Number(r.total).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end">
              <GreenButton label="ยืนยันการส่งบิล" icon={Send} onClick={()=>{alert("ฟีเจอร์ส่งบิลผ่าน Line OA กำลังพัฒนา");setShowSummary(false);}} className="w-full sm:w-auto justify-center" />
            </div>
          </div>
        </div>
      )}

      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={()=>!isConfirming&&setShowGenerateModal(false)}>
          <div className="bg-white rounded-[40px] w-full max-w-5xl p-5 sm:p-10 shadow-2xl flex flex-col max-h-[90vh]" onClick={(e)=>e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <h3 className="text-xl sm:text-2xl font-black text-gray-800">ตรวจสอบบิลก่อนสร้าง</h3>
              {!isConfirming && <button onClick={()=>setShowGenerateModal(false)} className="p-2 hover:bg-gray-100 rounded-full"><X size={28} strokeWidth={3}/></button>}
            </div>
            {isGenerating ? (
              <div className="py-20 flex flex-col items-center gap-4"><Loader2 className="w-12 h-12 text-orange-400 animate-spin"/><p className="text-gray-500 font-bold animate-pulse">กำลังคำนวณบิล...</p></div>
            ) : generateError ? (
              <div className="py-20 text-center text-red-500 font-bold">{generateError}</div>
            ) : (
              <>
                <div className="overflow-x-auto overflow-y-auto rounded-3xl border-2 border-gray-100 mb-4 sm:mb-6 max-h-[50vh]">
                  <table className="w-full text-left border-collapse text-xs sm:text-sm min-w-[600px]">
                    <thead className="bg-gray-50 text-gray-600 uppercase sticky top-0 z-10">
                      <tr>
                        <th className="p-2 sm:p-4 font-black border-r border-gray-200 text-center bg-gray-50">ห้อง</th>
                        <th className="p-2 sm:p-4 font-black border-r border-gray-200 bg-gray-50">ชื่อผู้เช่า</th>
                        <th className="p-2 sm:p-4 font-black border-r border-gray-200 text-right bg-gray-50">ค่าเช่า</th>
                        <th className="p-2 sm:p-4 font-black border-r border-gray-200 text-right bg-gray-50">ค่าไฟ</th>
                        <th className="p-2 sm:p-4 font-black border-r border-gray-200 text-right bg-gray-50">ค่าน้ำ</th>
                        <th className="p-2 sm:p-4 font-black border-r border-gray-200 text-right bg-gray-50">บริการอื่นๆ</th>
                        <th className="p-2 sm:p-4 font-black text-right text-[#2E86C1] bg-blue-50/90">รวม</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {previewRows.map((r)=>(
                        <tr key={r.contractId} className={`hover:bg-blue-50/20 ${r.alreadyExists?"opacity-40":""}`}>
                          <td className="p-2 sm:p-4 font-black text-gray-700 border-r border-gray-100 text-center bg-gray-50/30">{r.roomNumber}{r.alreadyExists&&<span className="block sm:inline sm:ml-1 text-[10px] text-orange-500 font-bold">มีแล้ว</span>}</td>
                          <td className="p-2 sm:p-4 text-gray-600 font-bold border-r border-gray-100">{r.tenantFirstName||"-"}</td>
                          <td className="p-2 sm:p-4 text-right border-r border-gray-100">{Number(r.rent).toLocaleString()}</td>
                          <td className="p-2 sm:p-4 text-right border-r border-gray-100">{Number(r.electric).toLocaleString()}</td>
                          <td className="p-2 sm:p-4 text-right border-r border-gray-100">{Number(r.water).toLocaleString()}</td>
                          <td className="p-2 sm:p-4 text-right border-r border-gray-100">{(r.internet+r.laundry+r.otherService).toLocaleString()}</td>
                          <td className="p-2 sm:p-4 text-right font-black text-[#2E86C1] bg-blue-50/30">{Number(r.total).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-4">
                  <button onClick={()=>setShowGenerateModal(false)} className="px-6 py-3 rounded-xl bg-gray-100 text-gray-500 font-bold hover:bg-gray-200 transition-all w-full sm:w-auto">ยกเลิก</button>
                  <OrangeButton label={isConfirming?"กำลังบันทึก...":"ยืนยันสร้างบิล"} icon={isConfirming?Loader2:Plus} onClick={handleConfirmGenerate} disabled={isConfirming||previewRows.filter((r)=>!r.alreadyExists).length===0} className="px-8 w-full sm:w-auto justify-center" />
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Billing;