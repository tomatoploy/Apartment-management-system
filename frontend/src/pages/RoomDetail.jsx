import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  User,
  Phone,
  MessageSquare,
  Calendar,
  CreditCard,
  FileText,
  Plus,
  Trash2,
  ExternalLink,
  ShieldCheck,
  UserPlus, FilePlus, ChevronDown,
  AlertCircle, Package
} from "lucide-react";


import { OrangeButton, ExitButton } from "../components/ActionButtons";
import RoomHeader from "../components/RoomHeader";
import TenantInfoModal from "../components/TenantInfoModal";
import { toThaiDate } from "../components/DateController";
import { initialContractTemplates } from "../data/contractData"
import { fillTemplateData } from "../components/DocumentProcessor";

const RoomDetail = () => {
  const { roomNumber } = useParams();
  const navigate = useNavigate();
  const [tenant, setTenant] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // --- Mock Data Logic ---
  useEffect(() => {
    // สมมติว่าห้อง 201 มีข้อมูลผู้เช่า
    if (roomNumber === "201") {
      setTenant({
        nin: "1-1002-00345-67-8",
        title: "นาย",
        firstName: "สมชาย",
        lastName: "ใจดีมาก",
        nickName: "ชาย",
        phone: "081-234-5678",
        address: "99/1 หมู่ 5 ถนนห้วยแก้ว ต.สุเทพ อ.เมือง จ.เชียงใหม่ 50200",
        birthDate: "1995-05-20",
        lineId: "somchai_charee",
        email: "somchai.j@gmail.com",
        altName: "นางใจดี ใจดีมาก",
        altPhone: "089-765-4321",
        altRelationship: "มารดา",
        vehicleNum1: "กข-1234",
        vehicleDetail1: "Honda Civic สีขาว",
        keyCard1: "KC-201-01",
        keyCard2: "KC-201-02",
        isLaundryService: true,
        internetDeviceCount: 2,
        note: "แพ้อาหารทะเล, จอดรถที่โซน A",
        outstandingBalance: 3550,
        checkInDate: "2025-01-02",
        contractEndDate: "2026-01-01",
        moveOutDate: "-",
        hasPendingNotification: true,
        pendingParcels: 1,
        documents: [
          { id: 1, name: "สัญญาเช่า_201.pdf", date: "2025-01-01" },
          { id: 2, name: "สำเนาทะเบียนบ้าน.png", date: "2025-01-01" },
        ],
      });
    } else {
      setTenant(null); // ห้องอื่นๆ ให้เป็นห้องว่าง
    }
  }, [roomNumber]);

  // 1. เพิ่ม State สำหรับควบคุม Modal เพิ่มผู้เช่า
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const handleSaveTenant = (data) => {
    console.log("ข้อมูลผู้เช่าใหม่:", data);
    // Logic สำหรับส่งข้อมูลไป API
    setIsAddModalOpen(false);
  };

  //-- สร้างเอกสาร / เทมเพลต --
  const [showDocOptions, setShowDocOptions] = useState(false);
  // ในใช้งานจริง ส่วนนี้อาจจะมาจาก Context หรือ API Call
  const activeTemplates = initialContractTemplates.filter(t => t.is_active);


 const handleSelectTemplate = (template) => {
    setShowDocOptions(false);
    const processed = fillTemplateData(template.content, tenant, roomNumber);  
    navigate(`/rooms/${roomNumber}/preview`, { 
      state: { 
        content: processed, 
        title: template.name 
      } 
    });
  };

  return (
    <div>
      <RoomHeader roomNumber={roomNumber}>
        <div className="max-w-4xl mx-auto py-2">
      <div className="flex justify-end items-end">
        <div className="relative">
          <button
            onClick={() => setShowDocOptions(!showDocOptions)}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#f3a638] text-white rounded-xl font-black text-sm shadow-sm hover:bg-[#e6952e] transition-all"
          >
            <FilePlus size={18} />
            สร้างเอกสาร
            <ChevronDown size={16} className={`transition-transform ${showDocOptions ? 'rotate-180' : ''}`} />
          </button>

          {showDocOptions && (
            <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="p-2">
                <p className="px-3 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">เลือกเทมเพลต</p>
                {activeTemplates.map((temp) => (
                  <button
                    key={temp.id}
                    onClick={() => handleSelectTemplate(temp)}
                    className="w-full text-left px-4 py-3 text-sm font-bold text-gray-700 hover:bg-orange-50 hover:text-[#f3a638] rounded-xl transition-colors flex items-center gap-3"
                  >
                    <div className="w-2 h-2 bg-[#f3a638] rounded-full"></div>
                    {temp.name}
                  </button>
                ))}
                {activeTemplates.length === 0 && (
                  <p className="px-4 py-3 text-xs text-gray-400 italic">ไม่มีเทมเพลตที่เปิดใช้งาน</p>
                )}
              </div>
            </div>
          )}
      </div>
      </div>
        
      </div>
        {tenant ? (
          /* --- กรณีมีผู้เช่า: แสดงข้อมูลทั้งหมด --- */
          <div className="space-y-6 mt-2">
            {/* 1 & 2: Banners ถ้ามีการแจ้งเตือนค้างก็จะแสดง */}
            <div className="flex flex-col gap-4 max-w-4xl mx-auto">
              {tenant.hasPendingNotification && (
                <div className="bg-red-50 border border-red-100 rounded-3xl p-5 shadow-sm overflow-hidden relative group">
                  <div className="flex flex-col md:flex-row md:items-center gap-4 ml-2">
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600">
                        <AlertCircle size={28} />
                      </div>
                      <div>
                        <h4 className="font-black text-red-600 text-lg  ">
                          การแจ้งเตือน
                        </h4>
                      </div>
                    </div>

                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4 rounded-2xl  md:bg-transparent p-3 md:p-0">
                      <div>
                        <p className="text-[12px] font-black text-red-400">
                          เรื่อง
                        </p>
                        <p className="text-sm font-bold text-gray-700">
                          แจ้งซ่อม: ห้องน้ำรั่ว
                        </p>
                      </div>
                      <div>
                        <p className="text-[12px] font-black text-red-400">
                          วันที่แจ้ง
                        </p>
                        <p className="text-sm font-bold text-gray-700">
                          {toThaiDate("2026-02-02")}
                        </p>
                      </div>
                      <div className="flex flex-col items-start justify-center">
                        <p className="text-[12px] font-black text-red-400">
                          สถานะ
                        </p>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black bg-white text-orange-600">
                          รอดำเนินการ
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate(`/rooms/request/${roomNumber}`)}
                      className="w-full md:w-auto text-[#ea3720] font-black text-sm underline underline-offset-4 hover:text-red-700 transition-all shrink-0"
                    >
                      แสดงเพิ่มเติม
                    </button>
                  </div>
                </div>
              )}

              {/* Banner พัสดุ (ถ้ามี) */}
              {tenant.pendingParcels > 0 && (
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 bg-blue-50 border border-blue-100 rounded-[25px] md:rounded-3xl text-blue-600 shadow-sm transition-all">
                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 shrink-0">
                      <Package size={28} />
                    </div>
                    <span className="font-bold text-sm md:text-base leading-tight">
                      มีพัสดุที่ยังไม่ได้รับ จำนวน {tenant.pendingParcels}{" "}
                      รายการ
                    </span>
                  </div>
                  <button
                        onClick={() => {
                          router.push(`/parcels?search=${roomNumber}`); 
                        }}                    className="w-full md:w-auto text-[#485cf7] font-black text-sm underline underline-offset-4 hover:text-blue-700 transition-all shrink-0"
                  >
                    แสดงเพิ่มเติม
                  </button>
                </div>
              )}
            </div>

            {/* คอนเทนเนอร์หลัก: 1 คอลัมน์ในมือถือ (grid-cols-1) และ 2 คอลัมน์ในจอใหญ่ (lg:grid-cols-2) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
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
          onSave={(updatedData) => {
            // ส่ง updatedData ไปที่ API หรืออัปเดต State หลัก
            setTenant(updatedData);
            console.log("บันทึกข้อมูลสำเร็จ:", updatedData);
          }}
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
