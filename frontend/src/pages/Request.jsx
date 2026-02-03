import React, { useState, useMemo, useEffect } from "react";
import { requestService } from "../api/RequestApi";
import {
  Wrench, Sparkles, LogOut, FileText, CheckCircle2, XCircle, Clock, Plus, LayoutList, CalendarDays,
  ArrowUpDown, Check, Filter
} from "lucide-react";
import SearchBar from "../components/SearchBar";
import FilterModal from "../components/FilterModal";
import RequestModal from "../components/AddRequestModal";
import RequestItem from "../components/RequestItem";
import EditRequestModal from "../components/EditRequestModal";
import RequestCalendar from "../components/RequestCalendar";

const SUBJECT_CONFIG = {
  fix: { label: "แจ้งซ่อม", icon: <Wrench size={40} />, color: "bg-[#E6D1F2] text-[#6B21A8]" },
  clean: { label: "ทำความสะอาด", icon: <Sparkles size={40} />, color: "bg-[#BAE6FD] text-[#0369A1]" },
  leave: { label: "ย้ายออก", icon: <LogOut size={40} />, color: "bg-[#E5E7EB] text-[#374151]" },
  other: { label: "อื่นๆ", icon: <FileText size={40} />, color: "bg-[#FED7AA] text-[#9A3412]" },
};

const STATUS_CONFIG = {
  pending: { label: "รอดำเนินการ", color: "bg-[#FEF9C3] text-[#854D0E]", icon: <Clock size={20} /> },
  finish: { label: "สำเร็จ", color: "bg-[#DCFCE7] text-[#166534]", icon: <CheckCircle2 size={20} /> },
  cancel: { label: "ยกเลิก", color: "bg-[#FEE2E2] text-[#991B1B]", icon: <XCircle size={20} /> },
};

// ✅ ปรับตัวเลือกการเรียงลำดับใหม่
const SORT_OPTIONS = {
  latest: { label: "เรียงตามวันที่ล่าสุด", value: "latest" },
  room_asc: { label: "เรียงตามเลขห้อง (มาก → น้อย)", value: "room_asc" },
  room_desc: { label: "เรียงตามเลขห้อง (มาก → น้อย)", value: "room_desc" },
};

const Request = () => {
  const [requests, setRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSubject, setActiveSubject] = useState("all");
  const [activeStatusFilters, setActiveStatusFilters] = useState([]);
  const [viewMode, setViewMode] = useState("list");
  const [sortOrder, setSortOrder] = useState("latest");
  const [modals, setModals] = useState({ filter: false, add: false, edit: false, sort: false });
  const [selectedRequest, setSelectedRequest] = useState(null);

  // --- 1. Load Data ---
  const fetchRequests = async () => {
    try {
      const data = await requestService.getRequests();
      setRequests(data ?? []);
    } catch (err) {
      console.error("Error loading requests", err);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // --- Handlers ---
  const toggleModal = (name, value) => setModals(prev => ({ ...prev, [name]: value }));

  const handleItemClick = (req) => {
    setSelectedRequest(req);
    toggleModal('edit', true);
  };

  // --- 2. Create (เพิ่มข้อมูลลง DB) ---
  const handleSaveRequest = async (formData) => {
    try {
      const payload = {
        ...formData,
        cost: formData.cost ? Number(formData.cost) : null,
        appointmentDate: formData.appointmentDate || null,
        isTenantCost: formData.isTenantCost || false
      };

      await requestService.createRequest(payload);
      await fetchRequests(); 
      toggleModal('add', false);
    } catch (err) {
      console.error("เพิ่มข้อมูลไม่สำเร็จ", err);
      alert("ไม่สามารถเพิ่มข้อมูลได้ กรุณาลองใหม่อีกครั้ง");
    }
  };

  // --- 3. Update (แก้ไขข้อมูลใน DB) ---
  const handleEditSave = async (formData) => {
    try {
      const payload = {
        ...formData,
        cost: formData.cost ? Number(formData.cost) : null,
        appointmentDate: formData.appointmentDate || null,
      };

      await requestService.updateRequest(formData.id, payload);
      await fetchRequests();
      toggleModal('edit', false);
    } catch (err) {
      console.error("แก้ไขข้อมูลไม่สำเร็จ", err);
      alert("แก้ไขข้อมูลไม่สำเร็จ");
    }
  };

  // --- 4. Delete (ลบข้อมูลออกจาก DB) ---
  const handleDelete = async (id) => {
    try {
      await requestService.deleteRequest(id);
      await fetchRequests();
      toggleModal('edit', false);
    } catch (err) {
      console.error("ลบข้อมูลไม่สำเร็จ", err);
      alert("ลบข้อมูลไม่สำเร็จ");
    }
  };

  // --- 5. Change Status (เปลี่ยนสถานะด่วน) ---
  const handleChangeStatus = async (id, newStatus) => {
    const targetReq = requests.find(r => r.id === id);
    if (!targetReq) return;

    try {
      const payload = { ...targetReq, status: newStatus };
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
      await requestService.updateRequest(id, payload);
    } catch (err) {
      console.error("เปลี่ยนสถานะไม่สำเร็จ", err);
      fetchRequests(); 
    }
  };

  // --- Logic Filter & Sort ---
  const keyword = searchTerm.toLowerCase();

  const filteredAndSortedRequests = useMemo(() => {
    // 1. Filter
    let result = requests.filter((req) => {
      const matchesSearch = 
        (req.roomNumber && req.roomNumber.toLowerCase().includes(keyword)) || 
        (req.body && req.body.toLowerCase().includes(keyword));
      
      const matchesStatus = activeStatusFilters.length === 0 || activeStatusFilters.includes(req.status);
      return matchesSearch && matchesStatus;
    });

    // 2. Sort (✅ แก้ไข Logic เรียงตามเลขห้อง)
    return result.sort((a, b) => {
      switch (sortOrder) {
        case "room_asc":
          // เรียงเลขห้อง น้อย -> มาก (รองรับเลขผสมตัวอักษร เช่น A101, B202)
          return (a.roomNumber || "").localeCompare(b.roomNumber || "", undefined, { numeric: true });
        case "room_desc":
          // เรียงเลขห้อง มาก -> น้อย
          return (b.roomNumber || "").localeCompare(a.roomNumber || "", undefined, { numeric: true });
        case "latest":
        default:
          const dateA = a.requestDate ? new Date(a.requestDate) : new Date(0);
          const dateB = b.requestDate ? new Date(b.requestDate) : new Date(0);
          return dateB - dateA;
      }
    });
  }, [requests, searchTerm, activeStatusFilters, sortOrder]);

  const listRequests = activeSubject === "all" 
    ? filteredAndSortedRequests 
    : filteredAndSortedRequests.filter(req => req.subject === activeSubject);

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto bg-white rounded-3xl p-6 shadow-lg border border-gray-200 min-h-[85vh]">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">การแจ้ง</h1>

        {/* Toolbar */}
        <div className="flex flex-col gap-5 mb-8">
            <div className="flex flex-wrap items-center justify-center gap-3 w-full">
                {/* Search */}
                <div className="w-full sm:w-72"> 
                    <SearchBar value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>

                {/* Filter */}
                <button
                    onClick={() => toggleModal('filter', true)}
                    className={`relative p-3 rounded-xl border transition-all flex items-center justify-center h-[48px] w-[48px] shrink-0
                    ${activeStatusFilters.length > 0 
                        ? "bg-[#FFF7ED] border-[#F5A623] text-[#F5A623]" 
                        : "bg-white border-gray-200 text-gray-500 hover:border-[#f3a638] hover:text-[#f3a638]"
                    }`}
                >
                    <Filter size={20} />
                    {activeStatusFilters.length > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white font-bold border-2 border-white">
                            {activeStatusFilters.length}
                        </span>
                    )}
                </button>

                {/* Sort */}
                <button
                    onClick={() => toggleModal('sort', true)}
                    className={`relative p-3 rounded-xl border transition-all flex items-center justify-center h-[48px] w-[48px] shrink-0
                    ${sortOrder !== 'latest' 
                        ? "bg-[#FFF7ED] border-[#F5A623] text-[#F5A623]" 
                        : "bg-white border-gray-200 text-gray-500 hover:border-[#f3a638] hover:text-[#f3a638]"
                    }`}
                >
                    <ArrowUpDown size={20} />
                    {sortOrder !== 'latest' && (
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
                        </span>
                    )}
                </button>

                {/* View Mode */}
                <div className="bg-gray-100 p-1 rounded-xl flex shrink-0 h-[48px] items-center">
                    {[
                        { mode: 'list', icon: <LayoutList size={20} /> },
                        { mode: 'calendar', icon: <CalendarDays size={20} /> }
                    ].map(({ mode, icon }) => (
                        <button
                            key={mode}
                            onClick={() => setViewMode(mode)}
                            className={`h-full aspect-square rounded-lg flex items-center justify-center transition-all ${
                                viewMode === mode ? "bg-white shadow text-[#f3a638]" : "text-gray-400 hover:text-gray-600"
                            }`}
                        >
                            {icon}
                        </button>
                    ))}
                </div>

                {/* Add Button */}
                <button
                    onClick={() => toggleModal('add', true)}
                    className="bg-[#f3a638] text-white px-6 h-[48px] rounded-xl font-bold flex items-center gap-2 hover:bg-[#e29528] transition-all shadow-md shrink-0"
                >
                    <Plus size={20} /> <span className="hidden sm:inline">เพิ่มการแจ้ง</span>
                </button>
            </div>

            {/* Subject Tabs */}
            {viewMode === "list" && (
                <div className="flex justify-center w-full">
                    <div className="flex bg-gray-100 p-1 rounded-2xl w-full max-w-3xl overflow-x-auto no-scrollbar">
                        {[{ key: "all", label: "ทั้งหมด" }, ...Object.entries(SUBJECT_CONFIG).map(([k, v]) => ({ key: k, ...v }))].map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveSubject(tab.key)}
                                className={`flex-1 px-4 py-2 rounded-xl font-bold whitespace-nowrap transition-all ${
                                activeSubject === tab.key ? "bg-[#f3a638] text-white shadow-md" : "text-gray-500 hover:text-gray-700"
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>

        {/* Content */}
        {viewMode === "list" ? (
          <div className="space-y-4 max-w-4xl mx-auto">
            {listRequests.map((req) => (
              <RequestItem key={req.id} req={req} onClick={() => handleItemClick(req)} onChangeStatus={handleChangeStatus} />
            ))}
            {listRequests.length === 0 && (
              <div className="text-center py-20 text-gray-400 font-bold">ไม่พบข้อมูลการแจ้ง</div>
            )}
          </div>
        ) : (
          <RequestCalendar requests={filteredAndSortedRequests} subjectConfig={SUBJECT_CONFIG} onItemClick={handleItemClick} />
        )}

        {/* Modals */}
        <RequestModal 
            isOpen={modals.add} 
            onClose={() => toggleModal('add', false)} 
            onSave={handleSaveRequest} 
        />
        
        {selectedRequest && (
          <EditRequestModal
            isOpen={modals.edit}
            initialData={selectedRequest}
            onClose={() => toggleModal("edit", false)}
            onSave={handleEditSave}
            onDelete={handleDelete}
          />
        )}

        {/* Filter Modal */}
        <FilterModal isOpen={modals.filter} onClose={() => toggleModal('filter', false)} title="กรองสถานะ" onClear={() => setActiveStatusFilters([])} onConfirm={() => toggleModal('filter', false)} maxWidth="max-w-md">
            <div className="grid grid-cols-1 gap-3">
            {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                <button key={key} onClick={() => setActiveStatusFilters(prev => prev.includes(key) ? prev.filter(s => s !== key) : [...prev, key])} className={`py-3 px-4 rounded-xl text-md font-bold border-2 transition-all flex items-center justify-between ${activeStatusFilters.includes(key) ? "border-[#F5A623] bg-[#FFF7ED] text-[#F5A623]" : "border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200"}`}>
                <div className="flex items-center gap-2">{config.icon} {config.label}</div>
                {activeStatusFilters.includes(key) && <Check size={18} />}
                </button>
            ))}
            </div>
        </FilterModal>

        {/* Sort Modal */}
        <FilterModal isOpen={modals.sort} onClose={() => toggleModal('sort', false)} title="เรียงลำดับข้อมูล" onClear={() => setSortOrder("latest")} onConfirm={() => toggleModal('sort', false)} maxWidth="max-w-md">
            <div className="grid grid-cols-1 gap-3">
                {Object.values(SORT_OPTIONS).map((option) => (
                    <button key={option.value} onClick={() => { setSortOrder(option.value); toggleModal('sort', false); }} className={`py-3 px-4 rounded-xl text-md font-bold border-2 transition-all flex items-center justify-between ${sortOrder === option.value ? "border-[#F5A623] bg-[#FFF7ED] text-[#F5A623]" : "border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200"}`}>
                        {option.label}
                        {sortOrder === option.value && <Check size={18} />}
                    </button>
                ))}
            </div>
        </FilterModal>

      </div>
    </div>
  );
};

export default Request;