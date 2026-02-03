import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Bell,
  Package,
  User,
  Phone,
  MessageSquare,
  Calendar,
  CreditCard,
  FileText,
  Plus,
  Trash2,
  ExternalLink,
  Edit3,
  AlertCircle,
  ShieldCheck,
  Car,
  Info,
  Mail,
  MapPin,
  HeartPulse,
  UserPlus,
} from "lucide-react";
import { OrangeButton, BlueButton } from "../components/ActionButtons";
import RoomHeader from "../components/RoomHeader";

const RoomDetail = () => {
  const { roomNumber } = useParams();
  const navigate = useNavigate();
  const [tenant, setTenant] = useState(null);

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
        isLaundryService: true,
        note: "แพ้อาหารทะเล, จอดรถที่โซน A",
        outstandingBalance: 3550,
        checkInDate: "01/01/2025",
        contractEndDate: "01/01/2026",
        moveOutDate: "-",
        hasPendingNotification: true,
        pendingParcels: 1,
        documents: [
          { id: 1, name: "สัญญาเช่า_201.pdf", date: "01/01/2025" },
          { id: 2, name: "สำเนาทะเบียนบ้าน.png", date: "01/01/2025" },
        ],
      });
    } else {
      setTenant(null); // ห้องอื่นๆ ให้เป็นห้องว่าง
    }
  }, [roomNumber]);

  return (
    <div>
      <RoomHeader roomNumber={roomNumber}>
        {tenant ? (
          /* --- กรณีมีผู้เช่า: แสดงข้อมูลทั้งหมด --- */
          <div className="animate-in fade-in duration-500 space-y-8">
            {/* 1 & 2: Banners ถ้ามีการแจ้งเตือนค้างก็จะแสดง */}
            {/* --- 1 & 2: Banners แจ้งเตือนและพัสดุ --- */}
            <div className="flex flex-col gap-4 max-w-4xl mx-auto">
              {tenant.hasPendingNotification && (
                <div className="bg-red-50 border border-red-100 rounded-3xl p-5 shadow-sm overflow-hidden relative group">
                  {/* ปรับ flex-col ในมือถือ และ md:flex-row ใน iPad/คอม */}
                  <div className="flex flex-col md:flex-row md:items-center gap-4 ml-2">
                    {/* Icon และ หัวข้อหลัก (ชิดซ้ายเสมอ) */}
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

                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4 rounded-2xl bg-white/30 md:bg-transparent p-3 md:p-0">
                      <div>
                        <p className="text-[12px] font-black text-red-400">
                          เรื่อง
                        </p>
                        <p className="text-md font-bold text-gray-700">
                          แจ้งซ่อม: ห้องน้ำรั่ว
                        </p>
                      </div>
                      <div>
                        <p className="text-[12px] font-black text-red-400">
                          วันที่แจ้ง
                        </p>
                        <p className="text-md font-bold text-gray-700">
                          02/02/2026
                        </p>
                      </div>
                      <div className="flex flex-col items-start justify-center">
                        <p className="text-[12px] font-black text-red-400">
                          สถานะ
                        </p>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black bg-orange-100 text-orange-600">
                          ● รอดำเนินการ
                        </span>
                      </div>
                    </div>

                    {/* ปุ่ม: เต็มความกว้างในมือถือ (w-full) และขนาดปกติในจอใหญ่ (md:w-auto) */}
                    <button
                      //onClick={() => navigate(`/request/${roomNumber}`)}
                      className="w-full md:w-auto bg-[#ea3720] text-white px-6 py-2.5 rounded-xl font-black text-sm hover:bg-red-700 transition-all shadow-md shadow-red-100 shrink-0"
                    >
                      ดูรายละเอียด
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

                  {/* ปุ่มดูรายละเอียด */}
                  <button
                    // onClick={() => navigate(`/parcels/${roomNumber}`)}
                    className="w-full md:w-auto ml-0 md:ml-auto bg-[#485cf7] text-white px-6 py-2.5 rounded-xl font-black text-sm hover:bg-blue-700 transition-all shadow-md shadow-blue-100 shrink-0 active:scale-95"
                  >
                    ดูรายละเอียด
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
                    <BlueButton
                      label="ข้อมูลทั้งหมด"
                      icon={ExternalLink}
                      className="flex-1  py-2! px-4! text-xs!"
                    />
                    <OrangeButton
                      label="แก้ไขข้อมูล"
                      icon={Edit3}
                      className="flex-1 py-2! px-4! text-xs!"
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
                    value={tenant.checkInDate}
                    icon={<Calendar size={18} />}
                  />
                  <InfoItem
                    label="วันย้ายออก"
                    value={tenant.moveOutDate}
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
                    <div className="w-10 h-10 bg-orange-50 rounded-2xl flex items-center justify-center text-[#f3a638] shrink-0 border border-orange-200">
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
                                {doc.date}
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
                <div className="p-5 bg-orange-50/50 border-t border-orange-100">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-1.5 h-1.5 bg-[#f3a638] rounded-full"></div>
                    <p className="text-[10px] font-black text-[#f3a638] uppercase tracking-widest">
                      หมายเหตุพิเศษ
                    </p>
                  </div>
                  <p className="text-sm font-bold text-gray-600 italic pl-3.5">
                    "{tenant.note || "ไม่มีข้อมูลเพิ่มเติม"}"
                  </p>
                </div>
              </section>
            </div>
          </div>
        ) : (
          /* --- กรณีไม่มีผู้เช่า (ห้องว่าง) --- */
          <div className="py-24 flex flex-col items-center justify-center text-center animate-in zoom-in duration-300">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center text-gray-300 mb-6 shadow-inner">
              <UserPlus size={48} />
            </div>
            <h3 className="text-2xl font-black text-gray-400 mb-2">
              ยังไม่มีข้อมูลผู้เช่า
            </h3>
            <p className="text-gray-400 mb-10 max-w-xs font-bold">
              ห้องนี้ว่างอยู่ คุณสามารถเพิ่มข้อมูลผู้เช่าใหม่เพื่อทำสัญญาได้
            </p>
            <OrangeButton
              label="เพิ่มผู้เช่าใหม่"
              icon={Plus}
              onClick={() => navigate(`/rooms/${roomNumber}/add-tenant`)}
              className="px-10 py-4 shadow-lg shadow-orange-100"
            />
          </div>
        )}
      </RoomHeader>
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
