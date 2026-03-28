import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  FilePlus, ChevronDown, Bell, Package, User, Phone, MessageSquare, 
  Calendar, CreditCard, FileText, Plus, Trash2, ExternalLink, UserX, 
  Edit3, AlertCircle, ShieldCheck, Car, Info, Mail, MapPin, HeartPulse, 
  UserPlus 
} from "lucide-react";

import { OrangeButton, ExitButton } from "../components/ActionButtons";
import RoomHeader from "../components/RoomHeader";
import TenantInfoModal from "../components/TenantInfoModal";
import { toThaiDate } from "../components/DateController";
import ContractAlertBanner from "../components/ContractAlertBanner";

// API Services
import { roomService } from "../api/RoomApi";
import { contractService } from "../api/ContractApi";
import { tenantService } from "../api/TenantApi";
import { requestService } from "../api/RequestApi"; 
import { parcelService } from "../api/ParcelApi";

// Helper function ช่วยสกัด Array จาก API 
const extractArray = (res) => {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (res.$values) return res.$values;
  if (res.data && Array.isArray(res.data)) return res.data;
  if (res.data?.$values) return res.data.$values;
  return [];
};

const RoomDetail = () => {
  const { roomNumber } = useParams();
  const navigate = useNavigate();
  const [tenant, setTenant] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchRoomDetail = async () => {
    setIsLoading(true);
    try {
      const allRooms = extractArray(await roomService.getRoomOverview());
      const targetRoom = allRooms.find(r => String(r.roomNumber) === String(roomNumber));
      
      if (!targetRoom) {
        setTenant(null);
        setIsLoading(false);
        return;
      }
      
      const actualRoomId = targetRoom.roomId || targetRoom.id;

      const allContracts = extractArray(await contractService.getAllContracts());
      const relevantContracts = allContracts.filter(
        c => c.roomId === actualRoomId && (c.status === "Active" || c.status === "Expired")
      );

      if (relevantContracts.length > 0) {
        let latestContract = relevantContracts.find(c => c.status === "Active");
        
        if (!latestContract) {
          const expiredContracts = relevantContracts.filter(c => c.status === "Expired");
          expiredContracts.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
          latestContract = expiredContracts[0];
        }

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

        const t = await tenantService.getTenant(latestContract.tenantId);
        
        const tenantRoomContracts = relevantContracts
          .filter(c => c.tenantId === latestContract.tenantId)
          .sort((a, b) => new Date(b.startDate || 0) - new Date(a.startDate || 0));

        const mappedDocuments = tenantRoomContracts.map((c, index) => {
            const startDateStr = c.startDate ? c.startDate.split('T')[0] : "-";
            return {
              id: `contract_${c.id || c.Id}`,
              name: index === 0 ? `สัญญาเช่า (ฉบับปัจจุบัน)` : `สัญญาเช่า (ฉบับเก่า ${toThaiDate(startDateStr)})`,
              date: startDateStr,
              type: "contract",
              refId: c.id || c.Id,
              isCurrent: index === 0 
            };
        });

        let hasPendingReq = false;
        let pendingReqData = null;
        try {
          const allRequests = extractArray(await requestService.getRequests());
          const pendingRequests = allRequests.filter(req => 
            String(req.roomNumber) === String(roomNumber) && req.status === "pending"
          );
          if (pendingRequests.length > 0) {
            hasPendingReq = true;
            pendingReqData = pendingRequests[0];
          }
        } catch (err) { console.error(err); }

        let pendingParcelsCount = 0;
        try {
          const allParcels = extractArray(await parcelService.getParcels()); 
          const uncollected = allParcels.filter(p => 
            String(p.roomNumber) === String(roomNumber) && !p.pickupDate
          );
          pendingParcelsCount = uncollected.length;
        } catch (err) { console.error(err); }

        // ✨ อุดรอยรั่ว Uncontrolled Input โดยบังคับให้ค่าที่ null กลายเป็น "" เสมอ
        setTenant({
          id: t.id || t.Id,
          nin: t.nin ?? t.Nin ?? "",
          title: t.title ?? t.Title ?? "",
          firstName: t.firstName ?? t.FirstName ?? "",
          lastName: t.lastName ?? t.LastName ?? "",
          nickName: t.nickName ?? t.NickName ?? "",
          phone: t.phone ?? t.Phone ?? "",
          address: t.address ?? t.Address ?? "",
          birthDate: t.birthDate || t.BirthDate ? (t.birthDate || t.BirthDate).split('T')[0] : "",
          lineId: t.lineId ?? t.LineId ?? "",
          email: t.email ?? t.Email ?? "",
          note: t.note ?? t.Note ?? "",
          altName: t.altName ?? t.AltName ?? "",
          altPhone: t.altPhone ?? t.AltPhone ?? "",
          altRelationship: t.altRelationship ?? t.AltRelationship ?? "",
          vehicleNum1: t.vehicleNum1 ?? t.VehicleNum1 ?? "",
          vehicleDetail1: t.vehicleDetail1 ?? t.VehicleDetail1 ?? "",
          vehicleNum2: t.vehicleNum2 ?? t.VehicleNum2 ?? "",
          vehicleDetail2: t.vehicleDetail2 ?? t.VehicleDetail2 ?? "",
          keyCard1: t.keyCard1 ?? t.KeyCard1 ?? "",
          keyCard2: t.keyCard2 ?? t.KeyCard2 ?? "",
          keyCard3: t.keyCard3 ?? t.KeyCard3 ?? "",
          isLaundryService: Boolean(t.isLaundryService ?? t.IsLaundryService ?? false),
          internetDeviceCount: Number(t.internetDeviceCount ?? t.InternetDeviceCount ?? 0),
          
          contractStatus: latestContract.status,
          checkInDate: latestContract.startDate ? latestContract.startDate.split('T')[0] : "-",
          contractEndDate: latestContract.endDate ? latestContract.endDate.split('T')[0] : "-",
          outstandingBalance: 0, 
          documents: mappedDocuments,
          hasPendingNotification: hasPendingReq, 
          pendingRequestData: pendingReqData,
          pendingParcels: pendingParcelsCount, 
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

  const handleUpdateTenant = async (updatedData) => {
    try {
      const originalTenantRes = await tenantService.getTenant(tenant.id);
      const base = originalTenantRes?.data ?? originalTenantRes;

      // แปลงค่าให้ชัวร์ว่าเป็นตัวเลข
      let deviceCount = parseInt(updatedData.internetDeviceCount ?? updatedData.InternetDeviceCount, 10);
      if (isNaN(deviceCount)) deviceCount = 0;

      // ✨ สร้าง Payload ตรงๆ ไม่ใช้ ...base เพื่อป้องกันปัญหาคีย์ซ้ำตัวเล็ก-ใหญ่ (Case Sensitivity Conflict ใน C#)
      const payload = {
        nin:                updatedData.nin || null,
        title:              updatedData.title || null,
        firstName:          updatedData.firstName || "",
        lastName:           updatedData.lastName || null,
        nickName:           updatedData.nickName || null,
        phone:              updatedData.phone || "",
        address:            updatedData.address || null,
        birthDate:          updatedData.birthDate || null,
        lineId:             updatedData.lineId || null,
        email:              updatedData.email || null,
        photo:              base.photo ?? base.Photo ?? null, // ดึง Photo เดิมมาใส่
        altName:            updatedData.altName || null,
        altPhone:           updatedData.altPhone || null,
        altRelationship:    updatedData.altRelationship || null,
        vehicleNum1:        updatedData.vehicleNum1 || null,
        vehicleDetail1:     updatedData.vehicleDetail1 || null,
        vehicleNum2:        updatedData.vehicleNum2 || null,
        vehicleDetail2:     updatedData.vehicleDetail2 || null,
        keyCard1:           updatedData.keyCard1 || null,
        keyCard2:           updatedData.keyCard2 || null,
        keyCard3:           updatedData.keyCard3 || null,
        isLaundryService:   Boolean(updatedData.isLaundryService),
        internetDeviceCount: deviceCount,
        note:               updatedData.note || null,
      };

      await tenantService.putTenant(tenant.id, payload);

      alert("อัปเดตข้อมูลผู้เช่าสำเร็จ");
      setIsModalOpen(false);
      await fetchRoomDetail();
    } catch (error) {
      console.error("Update error:", error);
      alert("เกิดข้อผิดพลาดในการอัปเดตข้อมูล");
    }
  };

  const handleDocumentClick = (doc) => {
    if (doc.isCurrent) {
      navigate(`/rooms/contract/${roomNumber}`);
    } else {
      navigate(`/rooms/contract-history/${roomNumber}?contractId=${doc.refId}`);
    }
  };

  return (
    <div>
      <RoomHeader roomNumber={roomNumber}>
        {tenant ? (
          <div className="space-y-6 mt-2">
            <div className="flex flex-col gap-4 max-w-4xl mx-auto">
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
                        <p className="text-sm font-bold text-gray-700 truncate">
                          {tenant.pendingRequestData.subject || "แจ้งซ่อม/บริการ"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[12px] font-black text-red-400">วันที่แจ้ง</p>
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
                      type="button" 
                      onClick={(e) => {
                        e.stopPropagation(); 
                        navigate(`/rooms/request/${roomNumber}`);
                      }}
                      className="w-full md:w-auto text-[#ea3720] font-black text-sm underline underline-offset-4 hover:text-red-700 transition-all shrink-0 cursor-pointer z-10"
                    >
                      แสดงเพิ่มเติม
                    </button>
                  </div>
                </div>
              )}

              {tenant.pendingParcels > 0 && (
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 bg-blue-50 border border-blue-100 rounded-[25px] md:rounded-3xl text-blue-600 shadow-sm transition-all">
                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 shrink-0">
                      <Package size={28} />
                    </div>
                    <span className="font-bold text-sm md:text-base leading-tight">
                      มีพัสดุที่ยังไม่ได้รับ จำนวน {tenant.pendingParcels} รายการ
                    </span>
                  </div>

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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              <section className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden h-full">
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

              <section className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden h-full flex flex-col">
                <div className="p-3 md:p-5 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50/20">
                  <h3 className="text-xl font-black text-gray-700 flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-50 rounded-2xl flex items-center justify-center text-[#f3a638] shrink-0 ">
                      <FileText size={24} />
                    </div>
                    ไฟล์เอกสาร
                  </h3>
                </div>

                <div className="p-5 flex-1 bg-gray-50/30">
                  <div className="space-y-3">
                    {tenant.documents.length > 0 ? (
                      tenant.documents.map((doc) => (
                        <button
                          key={doc.id}
                          onClick={() => handleDocumentClick(doc)}
                          className="w-full text-left flex items-center justify-between p-4 bg-white border border-gray-200 rounded-2xl hover:border-orange-300 hover:shadow-md transition-all group focus:outline-none focus:ring-2 focus:ring-orange-200"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg transition-colors text-gray-400 bg-gray-50 group-hover:text-[#f3a638] group-hover:bg-orange-50">
                              <FileText size={18} />
                            </div>
                            <div>
                              <p className="text-sm font-black text-gray-700 leading-tight group-hover:text-gray-900 transition-colors">
                                {doc.name}
                              </p>
                              <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">
                                บันทึกเมื่อ: {toThaiDate(doc.date)}
                              </p>
                            </div>
                          </div>
                          
                          <div className="text-gray-300 group-hover:text-[#f3a638] transition-colors pr-2">
                            <ExternalLink size={18} />
                          </div>
                        </button>
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
          <div className="py-24 flex flex-col items-center justify-center text-center  bg-gray-50 rounded-3xl border border-gray-200 mt-4 max-w-4xl mx-auto">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-gray-400 mb-3 border border-dashed border-gray-300">
              <UserPlus size={48} />
            </div>
            <h3 className="text-xl font-black text-gray-500 mb-3">ไม่มีข้อมูลผู้เช่า</h3>
            <OrangeButton
              label="เพิ่มผู้เช่าใหม่"
              icon={Plus}
              onClick={() => navigate(`/rooms/${roomNumber}/add-tenant`)}
            />
          </div>
        )}
      </RoomHeader>

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