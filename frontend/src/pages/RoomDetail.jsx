import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Bell, Package, User, Phone, MessageSquare, Calendar, CreditCard, FileText, Plus, Trash2, ExternalLink, UserX, Edit3, AlertCircle, ShieldCheck, Car, Info, Mail, MapPin, HeartPulse, UserPlus,} from "lucide-react";

import { OrangeButton, ExitButton } from "../components/ActionButtons";
import RoomHeader from "../components/RoomHeader";
import TenantInfoModal from "../components/TenantInfoModal";
import { toThaiDate } from "../components/DateController";
import ContractAlertBanner from "../components/ContractAlertBanner";

// API Services (อย่าลืม import เข้ามานะคะ)
import { roomService } from "../api/RoomApi";
import { contractService } from "../api/ContractApi";
import { tenantService } from "../api/TenantApi";
import { requestService } from "../api/RequestApi"; 
import { parcelService } from "../api/ParcelApi";

const RoomDetail = () => {
  const { roomNumber } = useParams();
  const navigate = useNavigate();
  const [tenant, setTenant] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // --- ฟังก์ชันดึงข้อมูล (แยกออกมาเพื่อให้เรียกใช้ซ้ำได้ตอน Save) ---
const fetchRoomDetail = async () => {
    setIsLoading(true);
    try {
      // 1. หา ID ของห้องปัจจุบัน
      const allRooms = await roomService.getRoomOverview();
      const targetRoom = allRooms.find(r => String(r.roomNumber) === String(roomNumber));
      
      if (!targetRoom) {
        setTenant(null);
        setIsLoading(false);
        return;
      }
      
      const actualRoomId = targetRoom.roomId || targetRoom.id;

      // 2. หาสัญญาของห้องนี้ ที่สถานะเป็น "Active" หรือ "Expired"
      const allContracts = await contractService.getAllContracts();
      const relevantContracts = allContracts.filter(
        c => c.roomId === actualRoomId && (c.status === "Active" || c.status === "Expired")
      );

      if (relevantContracts.length > 0) {
        // ✨ คัดกรองหาสัญญาล่าสุด
        let latestContract = relevantContracts.find(c => c.status === "Active");
        
        if (!latestContract) {
          const expiredContracts = relevantContracts.filter(c => c.status === "Expired");
          expiredContracts.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
          latestContract = expiredContracts[0];
        }

        // --- ✨ Logic คำนวณวันคงเหลือ/หมดอายุสัญญา ---
        const today = new Date();
        today.setHours(0, 0, 0, 0); 
        const endDate = latestContract.endDate ? new Date(latestContract.endDate) : null;
        
        let daysLeft = null;
        let isContractUrgent = false; 
        let isContractExpired = false; 

        if (endDate) {
            endDate.setHours(0, 0, 0, 0);
            const diffTime = endDate - today;
            daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (daysLeft <= 0) {
                isContractExpired = true;
            } else if (daysLeft <= 30) {
                isContractUrgent = true;
            }
        }

        // 3. ดึงข้อมูลผู้เช่าจากสัญญาที่ใหม่ที่สุด
        const t = await tenantService.getTenant(latestContract.tenantId);
        
        // 4. ดึงเอกสารจาก *ทุกสัญญา* ของผู้เช่าคนนี้ในห้องนี้
        const tenantRoomContracts = allContracts.filter(
          c => c.roomId === actualRoomId && c.tenantId === latestContract.tenantId
        );

        const mappedDocuments = tenantRoomContracts
          .filter(c => c.attachedFile)
          .map((c, index) => ({
            id: c.id,
            name: `สัญญาเช่า_${roomNumber}_ฉบับที่${index + 1}`,
            date: c.startDate ? c.startDate.split('T')[0] : "-",
            fileData: c.attachedFile
          }));

        // Request
        let hasPendingReq = false;
        let pendingReqData = null;
        try {
          const allRequests = await requestService.getRequests();
          const pendingRequests = allRequests.filter(req => 
            String(req.roomNumber) === String(roomNumber) && req.status === "pending"
          );
          if (pendingRequests.length > 0) {
            hasPendingReq = true;
            pendingReqData = pendingRequests[0];
          }
        } catch (err) { console.error(err); }

        // Parcel
        let pendingParcelsCount = 0;
        try {
          const allParcels = await parcelService.getParcels(); 
          const uncollected = allParcels.filter(p => 
            String(p.roomNumber) === String(roomNumber) && !p.pickupDate
          );
          pendingParcelsCount = uncollected.length;
        } catch (err) { console.error(err); }

        // จัดรูปข้อมูลส่งให้ State
        setTenant({
          id: t.id,
          nin: t.nin,
          title: t.title,
          firstName: t.firstName,
          lastName: t.lastName,
          nickName: t.nickName || "-",
          phone: t.phone,
          address: t.address || "-",
          birthDate: t.birthDate ? t.birthDate.split('T')[0] : "-",
          lineId: t.lineId || "-",
          email: t.email || "-",
          note: t.note || "",
          altName: t.altName,
          altPhone: t.altPhone,
          altRelationship: t.altRelationship,
          vehicleNum1: t.vehicleNum1,
          vehicleDetail1: t.vehicleDetail1,
          vehicleNum2: t.vehicleNum2,
          vehicleDetail2: t.vehicleDetail2,
          keyCard1: t.keyCard1,
          keyCard2: t.keyCard2,
          keyCard3: t.keyCard3,
          isLaundryService: t.isLaundryService,
          internetDeviceCount: t.internetDeviceCount,
          contractStatus: latestContract.status,
          checkInDate: latestContract.startDate ? latestContract.startDate.split('T')[0] : "-",
          contractEndDate: latestContract.endDate ? latestContract.endDate.split('T')[0] : "-",
          outstandingBalance: 0, 
          documents: mappedDocuments,
          hasPendingNotification: hasPendingReq, 
          pendingRequestData: pendingReqData,
          pendingParcels: pendingParcelsCount, 
          // ✨ เพิ่มสถานะแจ้งเตือนสัญญา
          isContractUrgent,
          isContractExpired,
          daysLeftUntilExpiry: daysLeft,
        });
      } else {
        setTenant(null); 
      }
    } catch (error) {
      console.error("Error fetching room detail:", error);
      setTenant(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRoomDetail();
  }, [roomNumber]);

  // --- ฟังก์ชันบันทึกข้อมูลการแก้ไข (จาก Modal) ---
  const handleUpdateTenant = async (updatedData) => {
    try {
      // ดึงข้อมูลผู้เช่าต้นฉบับจาก API เพื่อป้องกันฟิลด์อื่นๆ หาย
      const originalTenant = await tenantService.getTenant(tenant.id);
      
      // เอาข้อมูลที่แก้จาก Modal มาผสมกับข้อมูลเก่า
      const payload = {
        ...originalTenant,
        title: updatedData.title,
        firstName: updatedData.firstName,
        lastName: updatedData.lastName,
        nickName: updatedData.nickName,
        phone: updatedData.phone,
        lineId: updatedData.lineId,
        email: updatedData.email,
        nin: updatedData.nin,
        address: updatedData.address,
        note: updatedData.note,
        
        // ข้อมูลส่วนตัวอื่นๆ
        altName: updatedData.altName,
        altPhone: updatedData.altPhone,
        altRelationship: updatedData.altRelationship,
        vehicleNum1: updatedData.vehicleNum1,
        vehicleDetail1: updatedData.vehicleDetail1,
        vehicleNum2: updatedData.vehicleNum2,
        vehicleDetail2: updatedData.vehicleDetail2,
        keyCard1: updatedData.keyCard1,
        keyCard2: updatedData.keyCard2,
        keyCard3: updatedData.keyCard3,
        isLaundryService: updatedData.isLaundryService,
        internetDeviceCount: updatedData.internetDeviceCount,
      };

      // ยิง API PUT เพื่ออัปเดตข้อมูลผู้เช่า
      await tenantService.putTenant(tenant.id, payload);
      
      alert("อัปเดตข้อมูลผู้เช่าสำเร็จ");
      setIsModalOpen(false); // ปิด Modal
      
      // ดึงข้อมูลใหม่มาแสดงผล
      await fetchRoomDetail(); 
      
    } catch (error) {
      console.error("Update error:", error);
      alert("เกิดข้อผิดพลาดในการอัปเดตข้อมูล");
    }
  };

  return (
    <div>
      <RoomHeader roomNumber={roomNumber}>
        {tenant ? (
          /* --- กรณีมีผู้เช่า: แสดงข้อมูลทั้งหมด --- */
          <div className="space-y-6 mt-2">
            {/* 1 & 2: Banners ถ้ามีการแจ้งเตือนค้างก็จะแสดง */}
            <div className="flex flex-col gap-4 max-w-4xl mx-auto">
              {/* ✨ แสดงแบนเนอร์แจ้งเตือนสัญญา (ลำดับความสำคัญสูงสุด) */}
              {(tenant.isContractUrgent || tenant.isContractExpired) && (
                <ContractAlertBanner 
                  isExpired={tenant.isContractExpired}
                  daysLeft={tenant.daysLeftUntilExpiry}
                  onAction={() => navigate(`/rooms/contract/${roomNumber}`)}
                />
              )}
              {tenant.hasPendingNotification && tenant.pendingRequestData && (
                <div className="bg-red-50 border border-red-100 rounded-3xl p-5 shadow-sm overflow-hidden relative group">
                  <div className="flex flex-col md:flex-row md:items-center gap-4 ml-2">
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600">
                        <AlertCircle size={28} />
                      </div>
                      <div>
                        <h4 className="font-black text-red-600 text-lg">
                          การแจ้งเตือน
                        </h4>
                      </div>
                    </div>

                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4 rounded-2xl md:bg-transparent p-3 md:p-0">
                      <div>
                        <p className="text-[12px] font-black text-red-400">เรื่อง</p>
                        {/* ดึงจาก API จริง */}
                        <p className="text-sm font-bold text-gray-700 truncate">
                          {tenant.pendingRequestData.subject || "แจ้งซ่อม/บริการ"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[12px] font-black text-red-400">วันที่แจ้ง</p>
                         {/* ดึงจาก API จริง */}
                        <p className="text-sm font-bold text-gray-700">
                          {toThaiDate(tenant.pendingRequestData.requestDate?.split('T')[0])}
                        </p>
                      </div>
                      <div className="flex flex-col items-start justify-center">
                        <p className="text-[12px] font-black text-red-400">สถานะ</p>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black bg-white text-orange-600">
                          รอดำเนินการ
                        </span>
                      </div>
                    </div>

                    <button
                      type="button" // ระบุ Type ป้องกันการ Submit Form โดยไม่ได้ตั้งใจ
                      onClick={(e) => {
                        e.stopPropagation(); // ป้องกัน Event Bubble
                        navigate(`/rooms/request/${roomNumber}`);
                      }}
                      className="w-full md:w-auto text-[#ea3720] font-black text-sm underline underline-offset-4 hover:text-red-700 transition-all shrink-0 cursor-pointer z-10"
                    >
                      แสดงเพิ่มเติม
                    </button>
                  </div>
                </div>
              )}

              {/* Banner พัสดุ (ถ้ามี) */}
              {tenant.pendingParcels > 0 && (
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 bg-blue-50 border border-blue-100 rounded-[25px] md:rounded-3xl text-blue-600 shadow-sm transition-all">
                  {/* ส่วนข้อมูล (Icon + ข้อความ) */}
                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 shrink-0">
                      <Package size={28} />
                    </div>
                    <span className="font-bold text-sm md:text-base leading-tight">
                      มีพัสดุที่ยังไม่ได้รับ จำนวน {tenant.pendingParcels}{" "}
                      รายการ
                    </span>
                  </div>

                  {/* ปุ่มดูรายละเอียด พัสดุ */}
                  <button
                    type="button" 
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/parcels?search=${roomNumber}`); 
                    }}                    
                    className="w-full md:w-auto text-[#485cf7] font-black text-sm underline underline-offset-4 hover:text-blue-700 transition-all shrink-0 cursor-pointer z-10"
                  >
                    แสดงเพิ่มเติม
                  </button>
                </div>
              )}
            </div>

            {/* คอนเทนเนอร์หลัก: 1 คอลัมน์ในมือถือ (grid-cols-1) และ 2 คอลัมน์ในจอใหญ่ (lg:grid-cols-2) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              {/* --- คอลัมน์ที่ 1: ข้อมูลผู้เช่า --- */}
              <section className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden h-full">
                {/* Header */}
                <div className="p-3 md:p-5 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50/20">
                  <h3 className="text-xl font-black text-gray-700 flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#f3a638] rounded-xl flex items-center justify-center text-white shrink-0">
                      <User size={20} />
                    </div>
                    ข้อมูลผู้เช่า
                  </h3>
                  <div className="flex gap-2 sm:w-auto">
                    <OrangeButton
                      label="ดูข้อมูล"
                      icon={ExternalLink}
                      className="flex-1  py-2! px-4! text-xs!"
                      onClick={() => setIsModalOpen(true)}
                    />
                  </div>
                </div>

                {/* รายการข้อมูลแบบเรียงลงมา */}
                <div className="px-8 md:px-24 py-5 flex flex-col gap-y-4 md:gap-y-6">
                  <InfoItem
                    label="ชื่อ - นามสกุล"
                    value={`${tenant.title}${tenant.firstName} ${tenant.lastName}`}
                    icon={<User size={18} />}
                  />
                  <InfoItem
                    label="ยอดค้างชำระ"
                    value={`${tenant.outstandingBalance.toLocaleString()} ฿`}
                    icon={<CreditCard size={18} />}
                    valueClassName="text-red-500 "
                  />
                  <InfoItem
                    label="เบอร์โทรศัพท์"
                    value={tenant.phone}
                    icon={<Phone size={18} />}
                  />
                  <InfoItem
                    label="Line ID"
                    value={tenant.lineId}
                    icon={<MessageSquare size={18} />}
                  />
                  <InfoItem
                    label="วันเข้าอยู่"
                    value={toThaiDate(tenant.checkInDate)}
                    icon={<Calendar size={18} />}
                  />
                  <InfoItem
                    label="วันย้ายออก"
                    value={toThaiDate(tenant.moveOutDate)}
                    icon={<FileText size={18} />}
                  />
                  <InfoItem
                    label="วันหมดสัญญา"
                    value={tenant.contractEndDate}
                    icon={<ShieldCheck size={18} />}
                  />
                </div>
              </section>

              {/* --- คอลัมน์ที่ 2: เอกสาร & หมายเหตุ --- */}
              {/* รายการเอกสาร */}
              <section className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden h-full flex flex-col">
                {/* Header: ดีไซน์ใหม่เน้นความโปร่ง */}
                <div className="p-3 md:p-5 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50/20">
                  {/* Icon ทรงมนที่ดูซอฟต์ลง */}
                  <h3 className="text-xl font-black text-gray-700 flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-50 rounded-2xl flex items-center justify-center text-[#f3a638] shrink-0 ">
                      <FileText size={24} />
                    </div>
                    ไฟล์เอกสาร
                  </h3>

                  <OrangeButton
                    label="เพิ่มไฟล์"
                    icon={Plus}
                    className="flex-1 py-2! px-4! text-xs!"
                  />
                </div>

                {/* Body: พื้นที่สำหรับรายการเอกสาร */}
                <div className="p-5 flex-1 bg-gray-50/30">
                  <div className="space-y-3">
                    {/* ตรงนี้คือส่วนที่คุณจะนำ Map Document มาใส่ */}
                    {tenant.documents.length > 0 ? (
                      tenant.documents.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-2xl hover:border-orange-200 hover:shadow-sm transition-all group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-gray-50 rounded-lg text-gray-400 group-hover:text-[#f3a638] group-hover:bg-orange-50 transition-colors">
                              <FileText size={18} />
                            </div>
                            <div>
                              <p className="text-sm font-black text-gray-700 leading-tight">
                                {doc.name}
                              </p>
                              <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">
                                {toThaiDate(doc.date)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center w-8 h-8 bg-red-50 rounded-full justify-center group-hover:bg-red-100">
                            <button className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-12 flex flex-col items-center justify-center text-center opacity-40">
                        <FileText size={48} className="text-gray-200 mb-2" />
                        <p className="font-bold text-gray-400">
                          ไม่มีเอกสารที่จัดเก็บไว้
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer: หมายเหตุ (ถ้ามี) */}
                {/* แสดงส่วนหมายเหตุเฉพาะในกรณีที่มีข้อมูลเท่านั้น */}
                {tenant.note && (
                  <div className="p-5 bg-orange-50/50 border-t border-orange-100">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-1.5 h-1.5 bg-[#f3a638] rounded-full"></div>
                      <p className="text-[10px] font-black text-[#f3a638] uppercase tracking-widest">
                        หมายเหตุพิเศษ
                      </p>
                    </div>
                    <p className="text-sm font-bold text-gray-600 italic pl-3.5">
                      "{tenant.note}"
                    </p>
                  </div>
                )}
              </section>
            </div>
          </div>
        ) : (

          /* --- กรณีไม่มีผู้เช่า (ห้องว่าง) --- */
          <div className="py-24 flex flex-col items-center justify-center text-center  bg-gray-50 rounded-3xl border border-gray-200 mt-4 max-w-4xl mx-auto">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-gray-400 mb-3 border border-dashed border-gray-300">
              <UserPlus size={48} />
            </div>
            <h3 className="text-xl font-black text-gray-500 mb-3">ไม่มีข้อมูลผู้เช่า</h3>
            <OrangeButton
              label="เพิ่มผู้เช่าใหม่"
              icon={Plus}
              // ส่ง roomNumber ไปกับ URL
              onClick={() => navigate(`/rooms/${roomNumber}/add-tenant`)}
            />
          </div>
        )}
      </RoomHeader>

      {/* แสดงข้อมูลผู้เช่า */}

      {isModalOpen && (
        <TenantInfoModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          tenant={tenant}
          onSave={handleUpdateTenant}
        />
      )}
    </div>
  );
};

// Component ย่อย
const InfoItem = ({ label, value, icon, valueClassName = "text-gray-800" }) => (
  <div className="flex items-start gap-3">
    {icon && (
      <div className="flex justify-center items-center mt-1 text-orange-400 w-8 h-8 rounded-xl  bg-gray-50">
        {icon}
      </div>
    )}
    <div>
      <p className="text-[13px] text-gray-700 mb-1">{label}</p>
      <p className={` text-base leading-tight ${valueClassName}`}>
        {value || "-"}
      </p>
    </div>
  </div>
);
export default RoomDetail;
