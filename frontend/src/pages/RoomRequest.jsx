import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {  Inbox, } from 'lucide-react';

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

  // --- 1. Initial Mock Data ---
  useEffect(() => {
    const allMockData = [
      {
        id: 1,
        roomNumber: "201",
        subject: "fix",
        body: "ก๊อกน้ำอ่างล้างหน้าซึม มีน้ำหยดตลอดเวลา",
        status: "pending",
        requestDate: "2026-02-12",
        appointmentDate: "2026-02-14",
      },
      {
        id: 2,
        roomNumber: "201",
        subject: "clean",
        body: "ขอรับบริการทำความสะอาดเตียงและดูดฝุ่น",
        status: "finish",
        requestDate: "2026-02-10",
        appointmentDate: "2026-02-11",
      },
      {
        id: 3,
        roomNumber: "305",
        subject: "leave",
        body: "แจ้งย้ายออกสิ้นเดือนนี้ครับ",
        status: "pending",
        requestDate: "2026-02-14",
        appointmentDate: "2026-02-28",
      }
    ];

    setIsLoading(true);
    // จำลองการโหลด 500ms ให้พอเห็น Loader
    setTimeout(() => {
      const filtered = allMockData.filter(req => req.roomNumber === roomNumber);
      setRequests(filtered);
      setIsLoading(false);
    },0);
  }, [roomNumber]);

  // --- 2. Handlers (Local State Only) ---
  
  // เปลี่ยนสถานะด่วนผ่าน RequestItem
  const handleChangeStatus = (id, newStatus) => {
    setRequests(prev => 
      prev.map(req => req.id === id ? { ...req, status: newStatus } : req)
    );
    console.log(`Updated ID ${id} to status: ${newStatus}`);
  };

  const handleItemClick = (req) => {
    setSelectedRequest(req);
    setIsEditModalOpen(true);
  };

  const handleEditSave = (formData) => {
    setRequests(prev => 
      prev.map(req => req.id === formData.id ? { ...req, ...formData } : req)
    );
    setIsEditModalOpen(false);
  };

  const handleDelete = (id) => {
    setRequests(prev => prev.filter(req => req.id !== id));
    setIsEditModalOpen(false);
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
            { requests.length > 0 ? (
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
              /* --- กรณีไม่มีรายการ (Empty State) ตามสไตล์ที่คุณชอบ --- */
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