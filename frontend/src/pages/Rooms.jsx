import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  Filter,
  HelpCircle,
  X,
  LogIn,
  LogOut,
  Wrench,
  Sparkles,
  Package,
  Clock,
  FileText // เพิ่มไอคอนสำหรับ 'other'
} from "lucide-react";
import RoomCard from "../components/RoomCard";
import FilterModal from "../components/FilterModal";
import SearchBar from "../components/SearchBar";
// Import Services
import { roomService } from "../api/RoomApi";
import { requestService } from "../api/RequestApi";
import { parcelService } from "../api/ParcelApi";

const Rooms = () => {
  const [showLegend, setShowLegend] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // State สำหรับเก็บ Filter
  const [activeStatusFilters, setActiveStatusFilters] = useState([]); 
  const [activeIconFilters, setActiveIconFilters] = useState([]);

  const [roomsData, setRoomsData] = useState([]);
  const [activeBuilding, setActiveBuilding] = useState("ALL");

  useEffect(() => {
    const loadAllData = async () => {
      try {
        const [roomData, requestData, parcelData] = await Promise.all([
          roomService.getRoomOverview(),
          requestService.getRequests(),
          parcelService.getParcels(),
        ]);

        const rawRooms = Array.isArray(roomData) ? roomData : roomData?.$values ?? [];
        const rawRequests = Array.isArray(requestData) ? requestData : [];
        const rawParcels = Array.isArray(parcelData) ? parcelData : [];

        const today = new Date();

        // 1. Filter Requests: เอาเฉพาะที่ยังไม่เสร็จ และยังไม่ยกเลิก
        const activeRequests = rawRequests.filter(
            r => r.status !== 'finish' && r.status !== 'cancel'
        );

        // 2. Filter Parcels: เอาเฉพาะที่ยังไม่ได้รับ
        const activeParcels = rawParcels.filter(
            p => p.pickupDate === null || p.pickupDate === ""
        );

        // 3. Normalize Data
        const normalized = rawRooms.map((room) => {
          const icons = [];

          // --- Logic 1: Contract Status ---
          if (room.ContractStartDate) {
            if (new Date(room.ContractStartDate) <= today) {
              icons.push("moveIn"); // ย้ายเข้า (สัญญาเริ่มแล้ว)
            }
          }

          if (room.ContractEndDate) {
            const diffDays =
              (new Date(room.ContractEndDate) - today) /
              (1000 * 60 * 60 * 24);
            if (diffDays <= 30) icons.push("urgent"); // ใกล้หมดสัญญา
          }

          if (room.IsOverdue) icons.push("overdue"); // ค้างชำระ

          // --- Logic 2: Requests (ตาม Subject DB: fix, clean, leave, other) ---
          // หา Request ของห้องนี้
          const roomRequests = activeRequests.filter(req => req.roomNumber === room.roomNumber);
          
          roomRequests.forEach(req => {
            const subject = req.subject?.toLowerCase();
            if (subject === 'fix' && !icons.includes('fix')) icons.push('fix');
            else if (subject === 'clean' && !icons.includes('clean')) icons.push('clean');
            else if (subject === 'leave' && !icons.includes('leave')) icons.push('leave');
            else if (subject === 'other' && !icons.includes('other')) icons.push('other');
          });

          // --- Logic 3: Parcels ---
          const hasActiveParcel = activeParcels.some(parcel => parcel.roomNumber === room.roomNumber);
          if (hasActiveParcel) {
            icons.push("package");
          }

          return {
            ...room,
            floor: String(room.roomFloor),
            building: room.roomBuilding,
            status: room.roomStatus?.toLowerCase(),
            icons,
          };
        });

        setRoomsData(normalized);
      } catch (err) {
        console.error("โหลดข้อมูลไม่สำเร็จ", err);
      }
    };

    loadAllData();
  }, []);

  // --- Filtering Logic ---
  const filteredRoomsByFloor = useMemo(() => {
    const result = {};

    roomsData.forEach((room) => {
      const matchesIcon =
        activeIconFilters.length === 0 ||
        activeIconFilters.some(i => room.icons.includes(i));

      const matchesStatus =
        activeStatusFilters.length === 0 ||
        activeStatusFilters.includes(room.status);

      const matchesBuilding =
        activeBuilding === "ALL" || room.building === activeBuilding;

      const matchesSearch =
        searchTerm === "" ||
        room.roomNumber?.includes(searchTerm) ||
        room.tenantFirstName?.includes(searchTerm);

      if (matchesIcon && matchesStatus && matchesBuilding && matchesSearch) {
        const floor = room.floor;
        if (!result[floor]) result[floor] = [];
        result[floor].push(room);
      }
    });

    Object.values(result).forEach(arr =>
      arr.sort((a, b) =>
        a.roomNumber.localeCompare(b.roomNumber, "th", { numeric: true })
      )
    );

    return result;
  }, [roomsData, activeIconFilters, activeStatusFilters, activeBuilding, searchTerm]);

  const buildings = useMemo(() => ["ALL", ...new Set(roomsData.map(r => r.building).filter(Boolean))], [roomsData]);
  const floors = useMemo(() => [...new Set(roomsData.map(r => r.floor))].sort((a, b) => Number(a) - Number(b)), [roomsData]);

  // Handlers
  const toggleStatusFilter = (status) => {
    setActiveStatusFilters((prev) => prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]);
  };

  const toggleIconFilter = (icon) => {
    setActiveIconFilters((prev) => prev.includes(icon) ? prev.filter((i) => i !== icon) : [...prev, icon]);
  };

  const activeFilterCount = activeStatusFilters.length + activeIconFilters.length;

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto bg-white rounded-3xl p-6 shadow-lg border border-gray-200 min-h-[85vh]">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">ผังห้อง</h1>

        {/* Toolbar */}
        <div className="flex flex-col gap-5 mb-8">
            <div className="flex flex-wrap items-center justify-center gap-3 w-full">
                <div className="w-full sm:w-72">
                    <SearchBar value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>

                <button
                    onClick={() => setShowFilterModal(true)}
                    className={`relative p-3 rounded-xl border transition-all flex items-center justify-center h-[48px] w-[48px] shrink-0
                    ${activeFilterCount > 0 ? "bg-[#FFF7ED] border-[#F5A623] text-[#F5A623]" : "bg-white border-gray-200 text-gray-500 hover:border-[#f3a638] hover:text-[#f3a638]"}`}
                >
                    <Filter size={20} />
                    {activeFilterCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white font-bold border-2 border-white">
                            {activeFilterCount}
                        </span>
                    )}
                </button>

                <button
                    onClick={() => setShowLegend(true)}
                    className="h-[48px] px-4 rounded-xl border transition-all flex items-center gap-2 font-bold shrink-0 
                    bg-white border-gray-200 text-gray-500 hover:border-[#f3a638] hover:text-[#f3a638]"
                >
                    คำอธิบาย <HelpCircle size={20} />
                </button>
            </div>

            <div className="flex justify-center w-full flex-wrap gap-2">
                {buildings.map((b) => (
                    <button
                    key={b}
                    onClick={() => setActiveBuilding(b)}
                    className={`px-4 py-2 rounded-xl font-bold transition-all shadow-sm ${activeBuilding === b ? "bg-[#F5A623] text-white shadow-md" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                    >
                    {b === "ALL" ? "ทุกอาคาร" : `อาคาร ${b}`}
                    </button>
                ))}
            </div>
        </div>

        {/* Room Grid */}
        <div className="space-y-8">
          {floors.map((floor) => (
            <div key={floor} className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
              <h2 className="text-xl font-bold mb-6 text-gray-700 flex items-center gap-2">
                <span className="bg-gray-200 text-gray-600 w-8 h-8 rounded-full flex items-center justify-center text-sm">{floor}</span>
                ชั้น {floor}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {filteredRoomsByFloor[floor]?.map((room) => (
                  <RoomCard
                    key={room.roomId || room.id}
                    roomNumber={room.roomNumber}
                    building={room.building}
                    tenantName={room.tenantFirstName || ""}
                    status={room.status}
                    icons={room.icons}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter Modal */}
      <FilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        title="ตัวกรองผังห้อง"
        onClear={() => { setActiveStatusFilters([]); setActiveIconFilters([]); }}
        onConfirm={() => setShowFilterModal(false)}
        maxWidth="max-w-2xl"
      >
            <div className="mb-6">
              <p className="text-lg font-bold text-gray-600 mb-4">สถานะห้อง</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { id: "occupied", label: "มีผู้เช่า" },
                  { id: "overdue", label: "ค้างชำระ" },
                  { id: "reserved", label: "จอง" },
                  { id: "available", label: "ว่าง" },
                  { id: "maintenance", label: "ปิดปรับปรุง" },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => toggleStatusFilter(item.id)}
                    className={`py-3 rounded-xl text-base font-bold transition-all border-2 ${activeStatusFilters.includes(item.id) ? "border-[#F5A623] bg-[#FFF7ED] text-[#F5A623]" : "border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200"}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-2">
              <p className="text-lg font-bold text-gray-600 mb-4">กิจกรรม/การแจ้งเตือน</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { id: "fix", label: "แจ้งซ่อม" },
                  { id: "clean", label: "แจ้งทำความสะอาด" },
                  { id: "leave", label: "แจ้งย้ายออก" },
                  { id: "other", label: "อื่นๆ" },
                  { id: "package", label: "ค้างรับพัสดุ" },
                  { id: "moveIn", label: "วันย้ายเข้า" },
                  { id: "urgent", label: "ใกล้ครบสัญญา" },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => toggleIconFilter(item.id)}
                    className={`py-3 rounded-xl text-base font-bold transition-all border-2 ${activeIconFilters.includes(item.id) ? "border-[#F5A623] bg-[#FFF7ED] text-[#F5A623]" : "border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200"}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
      </FilterModal>

      {/* Legend Modal */}
      {showLegend && <LegendModal onClose={() => setShowLegend(false)} />}
    </div>
  );
};

// --- Legend Component ---
const LegendModal = ({ onClose }) => {
    const internalBackdropClick = (e) => {
        if (e.target === e.currentTarget) onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={internalBackdropClick}>
            <div className="bg-white rounded-[40px] w-full max-w-3xl p-8 relative shadow-2xl animate-in fade-in zoom-in duration-200">
                <button onClick={onClose} className="absolute right-6 top-6 text-gray-400 hover:text-black">
                    <X size={24} strokeWidth={3} />
                </button>
                <h3 className="text-2xl font-bold text-center mb-10">คำอธิบายสถานะห้อง</h3>
                
                {/* สถานะหลัก (Colors) */}
                <div className="grid grid-cols-5 gap-4 mb-10 text-center">
                    <LegendItem color="bg-[#10b981]" label="มีผู้เช่า" />
                    <LegendItem color="bg-[#fb7185]" label="ค้างชำระ" />
                    <LegendItem color="bg-[#facc15]" label="ติดจอง" />
                    <LegendItem color="bg-white border-2 border-gray-200" label="ว่าง" />
                    <LegendItem color="bg-[#4b5563]" label="ปิดปรับปรุง" />
                </div>

                {/* ไอคอนแจ้งเตือน (Icons) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-12 px-2">
                    {/* หมวด Requests */}
                    <IconDetail icon={<Wrench className="text-[#6B21A8]" />} text="แจ้งซ่อม" />
                    <IconDetail icon={<Sparkles className="text-[#0369A1]" />} text="แจ้งทำความสะอาด" />
                    <IconDetail icon={<LogOut className="text-[#374151]" />} text="แจ้งย้ายออก" />
                    <IconDetail icon={<FileText className="text-[#9A3412]" />} text="อื่น ๆ" />

                    {/* หมวด System/Status */}
                    <IconDetail icon={<Package className="text-amber-800" />} text="ค้างรับพัสดุ" />

                    <IconDetail icon={<LogIn className="text-green-600" />} text="วันย้ายเข้า" />
                    
                    <div className="flex items-start gap-3 col-span-1 sm:col-span-2 mt-2">
                        <div className="p-1 bg-orange-100 rounded-md"><Clock className="text-orange-500" size={26} /></div>
                        <div>
                            <p className="font-bold text-[18px] text-gray-700">ใกล้ครบสัญญา</p>
                            <p className="text-[14px] text-gray-500">เหลือเวลาสัญญาน้อยกว่า 30 วัน</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const LegendItem = ({ color, label }) => (
    <div className="flex flex-col items-center gap-2">
        <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl ${color}`}></div>
        <span className="text-sm sm:text-base text-gray-700 font-bold">{label}</span>
    </div>
);

const IconDetail = ({ icon, text }) => (
    <div className="flex items-center gap-3">
        <div className="p-1.5 bg-gray-100 rounded-lg">{React.cloneElement(icon, { size: 24 })}</div>
        <span className="font-bold text-gray-700 text-base">{text}</span>
    </div>
);

export default Rooms;