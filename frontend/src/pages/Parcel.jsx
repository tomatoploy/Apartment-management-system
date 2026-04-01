import React, { useEffect, useState, useMemo } from "react";
import { parcelService } from "../api/ParcelApi"; 
import { Plus, Filter, ArrowUpDown, Check } from "lucide-react";
import SearchBar from "../components/SearchBar";
import FilterModal from "../components/FilterModal";
import AddParcelModal from "../components/AddParcelModal";
import ParcelItem from "../components/ParcelItem";
import EditParcelModal from "../components/EditParcelModal";
import { useSearchParams } from "react-router-dom";
import { RefreshButton } from "../components/ActionButtons";

const SORT_OPTIONS = {
  latest: { label: "เรียงตามวันที่ล่าสุด", value: "latest" },
  oldest: { label: "เรียงตามวันที่เก่าที่สุด", value: "oldest" },
  room_asc: { label: "เรียงตามเลขห้อง (น้อย → มาก)", value: "room_asc" },
  room_desc: { label: "เรียงตามเลขห้อง (มาก → น้อย)", value: "room_desc" },
};

const Parcel = () => {
  const [searchParams] = useSearchParams();
  const [parcels, setParcels] = useState([]);
  
  // ให้ค่าเริ่มต้นปลอดภัยที่สุด
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [activeStatus, setActiveStatus] = useState("all");
  const [sortOrder, setSortOrder] = useState("latest");
  const [activeTypeFilters, setActiveTypeFilters] = useState([]);
  const [activeCompanyFilters, setActiveCompanyFilters] = useState([]);

  const [modals, setModals] = useState({ 
    add: false, 
    filter: false, 
    sort: false, 
    edit: false 
  });
  
  const [selectedParcel, setSelectedParcel] = useState(null);

  const typeOptions = [
    { id: "box", label: "กล่อง" },
    { id: "pack", label: "ซอง" },
    { id: "other", label: "อื่นๆ" },
  ];
  const companyOptions = [
    { id: "thaipost", label: "ไปรษณีย์ไทย" },
    { id: "kerry", label: "Kerry" },
    { id: "j&t", label: "J&T" },
    { id: "shopee", label: "Shopee" },
    { id: "lazada", label: "Lazada" },
    { id: "dhl", label: "DHL" },
    { id: "other", label: "อื่นๆ" },
  ];

  // ✨ อัปเดตคำค้นหาเสมอเมื่อ URL เปลี่ยน
  useEffect(() => {
    const searchFromUrl = searchParams.get("search");
    setSearchTerm(searchFromUrl || ""); 
  }, [searchParams]);

  useEffect(() => {
    loadParcels();
  }, []);

  const loadParcels = async () => {
    try {
      const data = await parcelService.getParcels();
      // ✨ เกราะป้องกันที่ 1: ดักจับว่า API ส่ง Array มาจริงๆ ไม่ใช่ Object
      const safeData = Array.isArray(data) ? data : (data?.data || []);
      setParcels(safeData);
    } catch (err) {
      console.error("โหลดพัสดุไม่สำเร็จ", err);
      setParcels([]); // ถ้า Error ให้รีเซ็ตเป็น Array ว่าง ป้องกันหน้าจอพัง
    }
  };

  const toggleModal = (name, value) => setModals(prev => ({ ...prev, [name]: value }));

  const handleAddParcel = async (data) => {
    try {
      await parcelService.createParcel(data);
      await loadParcels();
      toggleModal("add", false);
    } catch (err) {
      console.error("เพิ่มพัสดุไม่สำเร็จ", err);
      alert("เพิ่มพัสดุไม่สำเร็จ กรุณาตรวจสอบข้อมูล");
    }
  };

  const handleParcelClick = (parcel) => {
    setSelectedParcel(parcel);
    toggleModal("edit", true);
  };

  const handleSaveEdit = async (updatedParcel) => {
    try {
      await parcelService.updateParcel(updatedParcel.id, updatedParcel);
      await loadParcels();
      toggleModal("edit", false);
    } catch (err) {
      console.error("แก้ไขพัสดุไม่สำเร็จ", err);
      alert("แก้ไขไม่สำเร็จ");
    }
  };

  const handleDeleteParcel = async (id) => {
    if(!window.confirm("ยืนยันการลบพัสดุนี้?")) return;
    try {
      await parcelService.deleteParcel(id);
      await loadParcels();
      toggleModal("edit", false);
    } catch (err) {
      console.error("ลบพัสดุไม่สำเร็จ", err);
      alert("ลบไม่สำเร็จ");
    }
  };

  const handleChangeStatus = async (id, newStatusKey) => {
    const targetParcel = parcels.find(p => p.id === id);
    if (!targetParcel) return;

    const newPickupDate = newStatusKey === 'received' 
        ? new Date().toISOString().split('T')[0] 
        : null;

    const payload = {
        ...targetParcel,
        pickupDate: newPickupDate
    };

    try {
        setParcels(prev => prev.map(p => p.id === id ? { ...p, pickupDate: newPickupDate } : p));
        await parcelService.updateParcel(id, payload);
    } catch (err) {
        console.error("อัปเดตสถานะไม่สำเร็จ", err);
        loadParcels(); 
    }
  };

  const toggleFilter = (list, setList, value) => {
    setList((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
    );
  };

  // --- Logic Filter & Sort ที่ปรับให้ปลอดภัย 100% ---
  const filteredAndSortedParcels = useMemo(() => {
    // ป้องกัน parcels ไม่ใช่ Array
    if (!Array.isArray(parcels)) return [];

    // ✨ เกราะป้องกันที่ 2: ทำให้ searchTerm ปลอดภัยต่อการถูกเรียก .toLowerCase()
    const safeSearchTerm = String(searchTerm || "").toLowerCase();

    let result = parcels.filter((p) => {
      if (!p) return false; // กัน Error กรณีข้อมูลใน Array มีค่าว่าง
      
      const isReceived = !!p.pickupDate;
      
      // แปลงทุกอย่างให้เป็น String และพิมพ์เล็กก่อนเทียบ
      const roomStr = String(p.roomNumber || "").toLowerCase();
      const recipientStr = String(p.recipient || "").toLowerCase();
      const trackingStr = String(p.trackingNumber || "").toLowerCase();

      const matchesSearch =
        roomStr.includes(safeSearchTerm) ||
        recipientStr.includes(safeSearchTerm) ||
        trackingStr.includes(safeSearchTerm);
      
      const matchesStatus =
        activeStatus === "all" || (activeStatus === "received" ? isReceived : !isReceived);
      
      const matchesType = activeTypeFilters.length === 0 || activeTypeFilters.includes(p.type);
      const matchesCompany = activeCompanyFilters.length === 0 || activeCompanyFilters.includes(p.shippingCompany);

      return matchesSearch && matchesStatus && matchesType && matchesCompany;
    });

    return result.sort((a, b) => {
      // ✨ เกราะป้องกันที่ 3: ทำให้การจัดเรียงวันที่ไม่พังแม้วันที่เป็น null
      const dateA = new Date(a.arrivalDate || a.createdAt || 0).getTime();
      const dateB = new Date(b.arrivalDate || b.createdAt || 0).getTime();

      switch (sortOrder) {
        case "oldest":
            return dateA - dateB;
        case "room_asc":
            return String(a.roomNumber || "").localeCompare(String(b.roomNumber || ""), undefined, { numeric: true });
        case "room_desc":
            return String(b.roomNumber || "").localeCompare(String(a.roomNumber || ""), undefined, { numeric: true });
        case "latest":
        default:
            return dateB - dateA;
      }
    });
  }, [parcels, searchTerm, activeStatus, activeTypeFilters, activeCompanyFilters, sortOrder]);

  const activeFilterCount = activeTypeFilters.length + activeCompanyFilters.length;

  return (
    <>
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">พัสดุ</h1>

        {/* Toolbar */}
        <div className="flex flex-col gap-5 mb-8">
            <div className="flex flex-wrap items-center justify-center gap-3 w-full">
                <div className="w-full sm:w-72">
                    <SearchBar value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                
                {/* ปุ่ม Filter */}
                <button
                    onClick={() => toggleModal("filter", true)}
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

                {/* ปุ่ม Sort */}
                <button
                    onClick={() => toggleModal("sort", true)}
                    className={`relative p-3 rounded-xl border transition-all flex items-center justify-center h-[48px] w-[48px] shrink-0
                    ${sortOrder !== 'latest' ? "bg-[#FFF7ED] border-[#F5A623] text-[#F5A623]" : "bg-white border-gray-200 text-gray-500 hover:border-[#f3a638] hover:text-[#f3a638]"}`}
                >
                    <ArrowUpDown size={20} />
                    {sortOrder !== 'latest' && (
                         <span className="absolute -top-1 -right-1 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
                        </span>
                    )}
                </button>

                {/* ปุ่ม Add */}
                <button
                    onClick={() => toggleModal("add", true)}
                    className="bg-[#f3a638] text-white px-6 h-[48px] rounded-xl font-bold flex items-center gap-2 hover:bg-[#e29528] transition-all shadow-md shrink-0"
                >
                    <Plus size={20} /> <span className="hidden sm:inline">เพิ่มพัสดุ</span>
                </button>
                <RefreshButton />
            </div>

            {/* Status Tabs */}
            <div className="flex justify-center w-full">
                <div className="flex bg-gray-100 p-1 rounded-2xl w-full max-w-2xl overflow-x-auto no-scrollbar">
                {["all", "pending", "received"].map((status) => (
                    <button
                    key={status}
                    onClick={() => setActiveStatus(status)}
                    className={`flex-1 px-6 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${
                        activeStatus === status ? "bg-[#f3a638] text-white shadow-md" : "text-gray-500 hover:text-gray-700"
                    }`}
                    >
                    {status === "all" ? "ทั้งหมด" : status === "pending" ? "ค้างนำจ่าย" : "สำเร็จ"}
                    </button>
                ))}
                </div>
            </div>
        </div>

        {/* Content List */}
        <div className="space-y-4 max-w-4xl mx-auto">
          {filteredAndSortedParcels.map((parcel) => (
            <ParcelItem 
                key={parcel.id} 
                parcel={parcel} 
                onClick={() => handleParcelClick(parcel)} 
                onChangeStatus={handleChangeStatus}
            />
          ))}
          {filteredAndSortedParcels.length === 0 && (
            <div className="text-center py-20 text-gray-400 font-bold">ไม่พบข้อมูลพัสดุ</div>
          )}
        </div>

      {/* --- Modals --- */}
      <AddParcelModal 
        isOpen={modals.add} 
        onClose={() => toggleModal("add", false)} 
        onSave={handleAddParcel} 
      />

      {selectedParcel && (
        <EditParcelModal
          isOpen={modals.edit}
          initialData={selectedParcel}
          onClose={() => toggleModal("edit", false)}
          onSave={handleSaveEdit}
          onDelete={handleDeleteParcel}
        />
      )}

      {/* Filter Modal */}
      <FilterModal
        isOpen={modals.filter}
        onClose={() => toggleModal("filter", false)}
        title="ตัวกรองพัสดุ"
        onClear={() => { setActiveTypeFilters([]); setActiveCompanyFilters([]); }}
        onConfirm={() => toggleModal("filter", false)}
        maxWidth="max-w-2xl"
      >
        <div className="mb-6">
          <p className="text-lg font-bold text-gray-600 mb-4">ประเภทพัสดุ</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {typeOptions.map((item) => (
              <button
                key={item.id}
                onClick={() => toggleFilter(activeTypeFilters, setActiveTypeFilters, item.id)}
                className={`py-3 rounded-xl text-base font-bold transition-all border-2 flex items-center justify-center gap-2 ${
                  activeTypeFilters.includes(item.id) ? "border-[#F5A623] bg-[#FFF7ED] text-[#F5A623]" : "border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200"
                }`}
              >
                {item.label}
                {activeTypeFilters.includes(item.id) && <Check size={16} />}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-2">
            <p className="text-lg font-bold text-gray-600 mb-4">บริษัทขนส่ง</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {companyOptions.map((item) => (
                <button
                key={item.id}
                onClick={() => toggleFilter(activeCompanyFilters, setActiveCompanyFilters, item.id)}
                className={`py-3 rounded-xl text-base font-bold transition-all border-2 flex items-center justify-center gap-2 ${
                    activeCompanyFilters.includes(item.id) ? "border-[#F5A623] bg-[#FFF7ED] text-[#F5A623]" : "border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200"
                }`}
                >
                {item.label}
                {activeCompanyFilters.includes(item.id) && <Check size={16} />}
                </button>
            ))}
            </div>
        </div>
      </FilterModal>

      {/* Sort Modal */}
      <FilterModal
          isOpen={modals.sort}
          onClose={() => toggleModal('sort', false)}
          title="เรียงลำดับข้อมูล"
          onClear={() => setSortOrder("latest")}
          onConfirm={() => toggleModal('sort', false)}
          maxWidth="max-w-md"
        >
            <div className="grid grid-cols-1 gap-3">
                {Object.values(SORT_OPTIONS).map((option) => (
                    <button
                        key={option.value}
                        onClick={() => { setSortOrder(option.value); toggleModal('sort', false); }}
                        className={`py-3 px-4 rounded-xl text-md font-bold border-2 transition-all flex items-center justify-between ${
                            sortOrder === option.value ? "border-[#F5A623] bg-[#FFF7ED] text-[#F5A623]" : "border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200"
                        }`}
                    >
                        {option.label}
                        {sortOrder === option.value && <Check size={18} />}
                    </button>
                ))}
            </div>
        </FilterModal>

    </>
  );
};

export default Parcel;