import { useEffect, useState, useMemo } from "react";
import { parcelService } from "../api/ParcelApi";
import { Plus } from "lucide-react";
import SearchBar from "../components/SearchBar";
import FilterButton from "../components/FilterButton";
import FilterModal from "../components/FilterModal";
import AddParcelModal from "../components/AddParcelModal";
import ParcelItem from "../components/ParcelItem";
import EditParcelModal from "../components/EditParcelModal";

const Parcel = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeStatus, setActiveStatus] = useState("all"); // 'all', 'pending', 'received'

  // State สำหรับตัวกรอง (Array เก็บค่าที่เลือกได้มากกว่า 1)
  const [activeTypeFilters, setActiveTypeFilters] = useState([]);
  const [activeCompanyFilters, setActiveCompanyFilters] = useState([]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  //สำหรับ edit modal
  const [selectedParcel, setSelectedParcel] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Config สำหรับแสดงผลปุ่มตัวกรอง
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

  const [parcels, setParcels] = useState([]);

  useEffect(() => {
    loadParcels();
  }, []);

  const loadParcels = async () => {
    try {
      const data = await parcelService.getParcels();
      setParcels(data);
    } catch (err) {
      console.error("โหลดพัสดุไม่สำเร็จ", err);
    }
  };

  const handleAddParcel = async (data) => {
    try {
      await parcelService.createParcel(data);
      await loadParcels();
      setShowAddModal(false);
    } catch (err) {
      console.error("เพิ่มพัสดุไม่สำเร็จ", err);
    }
  };

  //สำหรับ edit modal
  // เมื่อกดที่ Card รายการพัสดุ
  const handleParcelClick = (parcel) => {
    setSelectedParcel(parcel);
    setShowEditModal(true);
  };

  // เมื่อบันทึกการแก้ไข
  const handleSaveEdit = async (updatedParcel) => {
    try {
      await parcelService.updateParcel(updatedParcel.id, updatedParcel);
      await loadParcels();
      setShowEditModal(false);
    } catch (err) {
      console.error("แก้ไขพัสดุไม่สำเร็จ", err);
    }
  };

  // เมื่อลบรายการ
  const handleDeleteParcel = async (id) => {
    try {
      await parcelService.deleteParcel(id);
      await loadParcels();
      setShowEditModal(false);
    } catch (err) {
      console.error("ลบพัสดุไม่สำเร็จ", err);
    }
  };

  // Logic การกรองข้อมูลที่ซับซ้อนขึ้น
  const filteredParcels = useMemo(() => {
    return parcels.filter((p) => {
      const isReceived = p.pickupDate !== null;

      // 1. Search
      const matchesSearch =
        p.roomNumber?.includes(searchTerm) ||
        p.recipient?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.trackingNumber?.toLowerCase().includes(searchTerm.toLowerCase());

      // 2. Status
      const matchesStatus =
        activeStatus === "all" ||
        (activeStatus === "received" ? isReceived : !isReceived);

      // 3. Type
      const matchesType =
        activeTypeFilters.length === 0 ||
        activeTypeFilters.includes(p.type);

      // 4. Company
      const matchesCompany =
        activeCompanyFilters.length === 0 ||
        activeCompanyFilters.includes(p.shippingCompany);

      return matchesSearch && matchesStatus && matchesType && matchesCompany;
    });
  }, [
    parcels,
    searchTerm,
    activeStatus,
    activeTypeFilters,
    activeCompanyFilters,
  ]);

  // ฟังก์ชันสลับการเลือก Filter (Toggle)
  const toggleFilter = (list, setList, value) => {
    setList((prev) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value],
    );
  };

  // นับจำนวน Filter ที่ใช้งานอยู่เพื่อแสดงบนปุ่ม
  const activeFilterCount =
    activeTypeFilters.length + activeCompanyFilters.length;

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto bg-white rounded-3xl p-6 shadow-lg border border-gray-200 min-h-[85vh]">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          พัสดุ
        </h1>

        {/* Toolbar */}
        <div className="flex flex-col items-center gap-6 mb-8">
          <div className="flex w-full max-w-2xl gap-4">
            <SearchBar
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <FilterButton
              onClick={() => setShowFilterModal(true)}
              activeCount={activeFilterCount}
            />
          </div>

          <div className="max-w-3xl w-full flex flex-col gap-4">
            {/* Status Tabs */}
            <div className="flex bg-gray-100 p-1 rounded-2xl w-full overflow-x-auto no-scrollbar">
              {["all", "pending", "received"].map((status) => (
                <button
                  key={status}
                  onClick={() => setActiveStatus(status)}
                  className={`flex-1 px-6 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${
                    activeStatus === status
                      ? "bg-[#f3a638] text-white shadow-md"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {status === "all"
                    ? "ทั้งหมด"
                    : status === "pending"
                      ? "ค้างนำจ่าย"
                      : "สำเร็จ"}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="ml-auto bg-[#f3a638] text-white px-8 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-[#e29528] transition-all shadow-md"
            >
              <Plus size={20} /> เพิ่มพัสดุ
            </button>
          </div>
        </div>

        {/* Parcel List */}
        <div className="space-y-4">
          {filteredParcels.map((parcel) => (
            <ParcelItem
              key={parcel.id}
              parcel={parcel}
              onClick={() => handleParcelClick(parcel)}
            />
          ))}
          <EditParcelModal
            isOpen={showEditModal}
            onClose={() => setShowEditModal(false)}
            initialData={selectedParcel}
            onSave={handleSaveEdit}
            onDelete={handleDeleteParcel}
          />
          {filteredParcels.length === 0 && (
            <div className="text-center py-20 text-gray-400 font-bold">
              ไม่พบข้อมูลพัสดุ
            </div>
          )}
        </div>
      </div>

      <AddParcelModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleAddParcel}
      />

      {/* Filter Modal ที่ปรับปรุงใหม่ */}
      <FilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        title="ตัวกรองพัสดุ"
        onClear={() => {
          setActiveTypeFilters([]);
          setActiveCompanyFilters([]);
        }}
        onConfirm={() => setShowFilterModal(false)}
        maxWidth="max-w-2xl"
      >
        {/* หมวดหมู่ 1: ประเภทพัสดุ */}
        <div className="mb-6">
          <p className="text-lg font-bold text-gray-600 mb-4">ประเภทพัสดุ</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {typeOptions.map((item) => (
              <button
                key={item.id}
                onClick={() =>
                  toggleFilter(activeTypeFilters, setActiveTypeFilters, item.id)
                }
                className={`py-3 rounded-xl text-base font-bold transition-all border-2 ${
                  activeTypeFilters.includes(item.id)
                    ? "border-[#F5A623] bg-[#FFF7ED] text-[#F5A623]"
                    : "border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* หมวดหมู่ 2: บริษัทขนส่ง */}
        <div className="mb-2">
          <p className="text-lg font-bold text-gray-600 mb-4">บริษัทขนส่ง</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {companyOptions.map((item) => (
              <button
                key={item.id}
                onClick={() =>
                  toggleFilter(
                    activeCompanyFilters,
                    setActiveCompanyFilters,
                    item.id,
                  )
                }
                className={`py-3 rounded-xl text-base font-bold transition-all border-2 ${
                  activeCompanyFilters.includes(item.id)
                    ? "border-[#F5A623] bg-[#FFF7ED] text-[#F5A623]"
                    : "border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </FilterModal>
    </div>
  );
};

export default Parcel;