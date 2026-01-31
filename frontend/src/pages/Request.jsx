import React, { useState, useMemo, useEffect } from "react";
import { requestService } from "../api/RequestApi";
import {
  Wrench, Sparkles, LogOut, FileText, CheckCircle2, XCircle, Clock, Plus, LayoutList, CalendarDays,
} from "lucide-react";
import SearchBar from "../components/SearchBar";
import FilterButton from "../components/FilterButton";
import FilterModal from "../components/FilterModal";
import RequestModal from "../components/AddRequestModal";
import RequestItem from "../components/RequestItem";
import EditRequestModal from "../components/EditRequestModal";
import RequestCalendar from "../components/RequestCalendar";

// 1. ย้าย Config ออกมาข้างนอก (Static Data ไม่จำเป็นต้องสร้างใหม่ทุกครั้งที่ Render)
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

const Request = () => {
  const [requests, setRequests] = useState([]);
  
  // State
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSubject, setActiveSubject] = useState("all");
  const [activeStatusFilters, setActiveStatusFilters] = useState([]);
  const [viewMode, setViewMode] = useState("list"); // เลือก'list' | 'calendar'
  
  // Modal States
  const [modals, setModals] = useState({ filter: false, add: false, edit: false });
  const [selectedRequest, setSelectedRequest] = useState(null);
  
  const fetchRequests = async () => {
    try {
      const data = await requestService.getRequests();
      setRequests(data ?? []);
    } catch (err) {
      console.error("โหลดข้อมูลไม่สำเร็จ", err);
    }
  };

  const keyword = searchTerm.toLowerCase();

  useEffect(() => {
    fetchRequests();
  }, []);

  // Handlers (รวม State Modal ไว้จัดการง่ายขึ้น)
  const toggleModal = (name, value) => setModals(prev => ({ ...prev, [name]: value }));
  
  const handleItemClick = (req) => {
    setSelectedRequest(req);
    toggleModal('edit', true);
  };

  const handleEditSave = async (formData) => {
    try {
      const payload = {
        roomNumber: formData.roomNumber,
        requestDate: formData.requestDate,
        subject: formData.subject,
        body: formData.body,
        status: formData.status,
        appointmentDate: formData.appointmentDate === "" ? null : formData.appointmentDate,
        isTenantCost: formData.isTenantCost,
        cost: formData.cost === "" ? null : Number(formData.cost),
        note: formData.note === "" ? null : formData.note,
      };

      await requestService.updateRequest(formData.id, payload);
      setRequests(prev =>
        prev.map(r => (r.id === formData.id ? { ...r, ...payload } : r))
      );
      toggleModal("edit", false);
    } catch (err) {
      console.error("แก้ไขไม่สำเร็จ", err);
    }
  };

  const handleChangeStatus = async (id, newStatus) => {
    // 1. update UI ทันที
    setRequests(prev =>
      prev.map(r =>
        r.id === id ? { ...r, status: newStatus } : r
      )
    );

    try {
      const current = requests.find(r => r.id === id);
      if (!current) return;

      await requestService.updateRequest(id, {
        ...current,
        status: newStatus,
      });
    } catch (err) {
      console.error("เปลี่ยนสถานะไม่สำเร็จ", err);
      fetchRequests(); // fallback กรณี error
    }
  };

  const handleDelete = async (id) => {
    try {
      await requestService.deleteRequest(id);
      setRequests(prev => prev.filter(item => item.id !== id));
      toggleModal("edit", false);
    } catch (err) {
      console.error("ลบไม่สำเร็จ", err);
    }
  };

  const handleSaveRequest = async (formData) => {
    try {
      const payload = {
        roomNumber: formData.roomNumber,
        requestDate: formData.requestDate,
        subject: formData.subject,
        body: formData.body,
        status: formData.status,

        appointmentDate:
          formData.appointmentDate === ""
            ? null
            : formData.appointmentDate,

        isTenantCost: formData.isTenantCost,

        cost:
          formData.cost === ""
            ? null
            : Number(formData.cost),

        note:
          formData.note === ""
            ? null
            : formData.note,
      };

      await requestService.createRequest(payload);
      setRequests(prev =>
        prev.map(r => (r.id === formData.id ? { ...r, ...payload } : r))
      );
      toggleModal("add", false);
    } catch (err) {
      console.error("เพิ่มการแจ้งไม่สำเร็จ", err);
    }
  };

  // 2. รวม Logic การกรอง (Unified Filtering Logic)
  // ใช้ useMemo เพื่อไม่ให้คำนวณใหม่ทุกครั้งที่ render ถ้า dependency ไม่เปลี่ยน
  const baseFilteredRequests = useMemo(() => {
    return requests.filter((req) => {
      const matchesSearch = req.roomNumber?.toLowerCase().includes(keyword) || req.body?.toLowerCase().includes(keyword);
      const matchesStatus = activeStatusFilters.length === 0 || activeStatusFilters.includes(req.status);
      return matchesSearch && matchesStatus;
    });
  }, [requests, searchTerm, activeStatusFilters]);

  // Calendar View: ใช้ข้อมูล Base (ค้นหา + สถานะ) แต่ไม่กรอง Subject
  const calendarRequests = baseFilteredRequests;

  // List View: กรองเพิ่มด้วย Subject
  const listRequests = activeSubject === "all" 
    ? baseFilteredRequests 
    : baseFilteredRequests.filter(req => req.subject === activeSubject);

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto bg-white rounded-3xl p-6 shadow-lg border border-gray-200 min-h-[85vh]">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">การแจ้ง</h1>

        {/* --- Toolbar --- */}
        <div className="flex flex-col items-center gap-6 mb-8">
          <div className="flex w-full max-w-2xl gap-4">
            <SearchBar value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            <FilterButton onClick={() => toggleModal('filter', true)} activeCount={activeStatusFilters.length} />
            
            {/* View Mode Toggle */}
            <div className="bg-gray-100 p-1 rounded-xl flex shrink-0">
              {[
                { mode: 'list', icon: <LayoutList size={24} /> },
                { mode: 'calendar', icon: <CalendarDays size={24} /> }
              ].map(({ mode, icon }) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`p-2 rounded-lg transition-all ${viewMode === mode ? "bg-white shadow text-[#f3a638]" : "text-gray-400 hover:text-gray-600"}`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Subject Tabs & Add Button */}
          <div className="max-w-3xl w-full flex flex-col gap-4 md-2">
            {viewMode === "list" && (
              <div className="flex bg-gray-100 p-1 rounded-2xl w-full overflow-x-auto no-scrollbar">
                {/* 3. รวมปุ่ม "ทั้งหมด" เข้ากับ Subject Config เพื่อลดการเขียนซ้ำใน JSX */}
                {[{ key: "all", label: "ทั้งหมด" }, ...Object.entries(SUBJECT_CONFIG).map(([k, v]) => ({ key: k, ...v }))].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveSubject(tab.key)}
                    className={`flex-1 px-6 py-2 rounded-xl font-bold whitespace-nowrap transition-all ${
                      activeSubject === tab.key ? "bg-[#f3a638] text-white shadow-md" : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={() => toggleModal('add', true)}
              className="ml-auto bg-[#f3a638] text-white px-8 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-[#e29528] transition-all shadow-md"
            >
              <Plus size={20} /> เพิ่มการแจ้ง
            </button>
          </div>
        </div>

        {/* --- Content Area --- */}
        {viewMode === "list" ? (
          <div className="space-y-4">
            {listRequests.map((req) => (
              <RequestItem key={req.id} req={req} onClick={() => handleItemClick(req)} onChangeStatus={handleChangeStatus} />
            ))}
            {listRequests.length === 0 && (
              <div className="text-center py-20 text-gray-400 font-bold">ไม่พบข้อมูลการแจ้ง</div>
            )}
          </div>
        ) : (
          <RequestCalendar requests={calendarRequests} subjectConfig={SUBJECT_CONFIG} onItemClick={handleItemClick} />
        )}

        {/* --- Modals --- */}
        <RequestModal isOpen={modals.add} onClose={() => toggleModal('add', false)} onSave={handleSaveRequest} />
        
        {selectedRequest && (
          <EditRequestModal
            isOpen={modals.edit}
            initialData={selectedRequest}
            onClose={() => toggleModal("edit", false)}
            onSave={handleEditSave}
            onDelete={handleDelete}
          />
        )}

        <FilterModal
          isOpen={modals.filter}
          onClose={() => toggleModal('filter', false)}
          title="สถานะการดำเนินการ"
          onClear={() => setActiveStatusFilters([])}
          onConfirm={() => toggleModal('filter', false)}
          maxWidth="max-w-md"
        >
          <div className="grid grid-cols-1 gap-3">
            {Object.entries(STATUS_CONFIG).map(([key, config]) => (
              <button
                key={key}
                onClick={() => setActiveStatusFilters(prev => prev.includes(key) ? prev.filter(s => s !== key) : [...prev, key])}
                className={`py-4 rounded-2xl text-md font-bold border-2 transition-all flex items-center justify-between px-6 ${
                  activeStatusFilters.includes(key) ? "border-[#F5A623] bg-[#FFF7ED] text-[#F5A623]" : "border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200"
                }`}
              >
                {config.label}
              </button>
            ))}
          </div>
        </FilterModal>
      </div>
    </div>
  );
};

export default React.memo(RequestItem);