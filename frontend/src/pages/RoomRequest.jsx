import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Inbox, Loader2 } from 'lucide-react';

// API Services
import { requestService } from '../api/RequestApi'; // ✅ อิมพอร์ต service เข้ามาใช้งาน

// Components
import RoomHeader from '../components/RoomHeader';
import RequestItem from '../components/RequestItem';
import EditRequestModal from "../components/EditRequestModal";

const RoomRequest = () => {
  const { roomNumber } = useParams();
  const navigate = useNavigate();
  
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // --- 1. Fetch Data จาก API ---
  const fetchRoomRequests = async () => {
    setIsLoading(true);
    try {
      // ดึงข้อมูลการแจ้งทั้งหมด
      const data = await requestService.getRequests();
      
      // กรองเอาเฉพาะข้อมูลของห้องปัจจุบัน (เทียบเป็น String เพื่อความชัวร์)
      const filtered = (data ?? []).filter(req => String(req.roomNumber) === String(roomNumber));
      
      // เรียงจากวันที่แจ้งล่าสุด (ถ้าต้องการให้เรียงตามเวลา)
      filtered.sort((a, b) => new Date(b.requestDate || 0) - new Date(a.requestDate || 0));

      setRequests(filtered);
    } catch (error) {
      console.error("Error fetching room requests:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRoomRequests();
  }, [roomNumber]);

  // --- 2. Handlers (เชื่อมต่อ API) ---
  
  // เปลี่ยนสถานะด่วนผ่าน RequestItem
  const handleChangeStatus = async (id, newStatus) => {
    const targetReq = requests.find(r => r.id === id);
    if (!targetReq) return;

    try {
      // อัปเดต UI ให้เปลี่ยนทันที (Optimistic Update) เพื่อความลื่นไหล
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
      
      const payload = { ...targetReq, status: newStatus };
      await requestService.updateRequest(id, payload);
    } catch (err) {
      console.error("เปลี่ยนสถานะไม่สำเร็จ", err);
      fetchRoomRequests(); // ถ้า Error ให้ดึงข้อมูลเก่ากลับมา
    }
  };

  const handleItemClick = (req) => {
    setSelectedRequest(req);
    setIsEditModalOpen(true);
  };

  // บันทึกการแก้ไข
  const handleEditSave = async (formData) => {
    try {
      const payload = {
        ...formData,
        cost: formData.cost ? Number(formData.cost) : null,
        appointmentDate: formData.appointmentDate || null,
      };

      await requestService.updateRequest(formData.id, payload);
      await fetchRoomRequests(); // โหลดข้อมูลใหม่หลังจากอัปเดตสำเร็จ
      setIsEditModalOpen(false);
    } catch (err) {
      console.error("แก้ไขข้อมูลไม่สำเร็จ", err);
      alert("แก้ไขข้อมูลไม่สำเร็จ");
    }
  };

  // ลบการแจ้ง
  const handleDelete = async (id) => {
    try {
      await requestService.deleteRequest(id);
      await fetchRoomRequests(); // โหลดข้อมูลใหม่หลังจากลบสำเร็จ
      setIsEditModalOpen(false);
    } catch (err) {
      console.error("ลบข้อมูลไม่สำเร็จ", err);
      alert("ลบข้อมูลไม่สำเร็จ");
    }
  };

  return (
    <>
      <RoomHeader roomNumber={roomNumber}>
        <div className="max-w-4xl mx-auto px-4 sm:px-0 space-y-6 mt-2">
          
          {/* ส่วนหัวหน้าจอ */}
          <div className="flex items-center gap-4">
            <h2 className="text-xl md:text-2xl font-black text-gray-700 flex items-center gap-3">
              รายการการแจ้ง
            </h2>
          </div>

          {/* Content Section */}
          <main className="pb-10">
            {isLoading ? (
              // แสดง Loading ระหว่างรอข้อมูลจาก API
              <div className="py-24 flex flex-col items-center justify-center text-center">
                <Loader2 size={40} className="text-orange-400 animate-spin mb-4" />
                <p className="text-gray-400 font-bold">กำลังโหลดข้อมูล...</p>
              </div>
            ) : requests.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {requests.map((req) => (
                  <RequestItem 
                    key={req.id} 
                    req={req} 
                    onClick={() => handleItemClick(req)} 
                    onChangeStatus={handleChangeStatus} 
                  />
                ))}
              </div>
            ) : (
              /* --- กรณีไม่มีรายการ (Empty State) --- */
              <div className="py-24 flex flex-col items-center justify-center text-center bg-gray-50 rounded-3xl border border-gray-200">
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-gray-400 mb-6 border border-dashed border-gray-300">
                  <Inbox size={48} />
                </div>
                <h3 className="text-xl font-black text-gray-500">ไม่มีประวัติการแจ้ง</h3>
              </div>
            )}
          </main>
        </div>
      </RoomHeader>

      {/* Modal แก้ไข/ดูรายละเอียด (ใช้ตัวเดียวกับหน้าหลัก) */}
      {selectedRequest && (
        <EditRequestModal
          isOpen={isEditModalOpen}
          initialData={selectedRequest}
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleEditSave}
          onDelete={handleDelete}
        />
      )}
    </>
  );
};

export default RoomRequest;