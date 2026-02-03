import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Save, ArrowLeft, Camera, Car, CreditCard } from "lucide-react";
import { SaveButton } from "../components/ActionButtons";

const AddTenant = () => {
  const { roomNumber } = useParams();
  const navigate = useNavigate();

  // จัดกลุ่มข้อมูลตาม Model ใน C#
  const [formData, setFormData] = useState({
    nin: "", title: "นาย", firstName: "", lastName: "", nickName: "",
    phone: "", address: "", birthDate: "", lineId: "", email: "",
    altName: "", altPhone: "", altRelationship: "",
    vehicleNum1: "", vehicleDetail1: "", keyCard1: "",
    isLaundryService: false, internetDeviceCount: 0, note: ""
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("บันทึกข้อมูลผู้เช่า:", formData);
    alert("บันทึกข้อมูลผู้เช่าห้อง " + roomNumber + " สำเร็จ");
    navigate(`/rooms/${roomNumber}`);
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <form onSubmit={handleSubmit} className="max-w-5xl mx-auto">
        <button type="button" onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-black mb-6 font-bold">
          <ArrowLeft size={20} /> ยกเลิกและย้อนกลับ
        </button>

        <div className="bg-white rounded-[40px] shadow-xl overflow-hidden">
          <div className="p-10 border-b bg-[#f3a638]/5 flex justify-between items-center">
            <h1 className="text-3xl font-black text-gray-800">เพิ่มผู้เช่าใหม่ : ห้อง {roomNumber}</h1>
            <SaveButton label="บันทึกข้อมูลผู้เช่า" type="submit" className="px-10" />
          </div>

          <div className="p-10 space-y-12">
            {/* Section 1: ข้อมูลส่วนตัว (Required) */}
            <section>
              <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <div className="w-2 h-6 bg-[#f3a638] rounded-full"></div> ข้อมูลส่วนตัวพื้นฐาน
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-gray-500">เลขบัตรประชาชน (NIN) *</label>
                  <input required className="p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:border-[#f3a638] focus:outline-none" 
                    value={formData.nin} onChange={(e) => setFormData({...formData, nin: e.target.value})} />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-gray-500">คำนำหน้า *</label>
                  <select required className="p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none"
                    value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})}>
                    <option>นาย</option><option>นางสาว</option><option>นาง</option>
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-gray-500">ชื่อจริง *</label>
                  <input required className="p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none" 
                    value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-gray-500">นามสกุล *</label>
                  <input required className="p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none" 
                    value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-gray-500">เบอร์โทรศัพท์ *</label>
                  <input required type="tel" className="p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none" 
                    value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
                </div>
                <div className="flex flex-col gap-2 md:col-span-3">
                  <label className="text-sm font-bold text-gray-500">ที่อยู่ตามบัตรประชาชน *</label>
                  <textarea required rows="2" className="p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none" 
                    value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} />
                </div>
              </div>
            </section>

            {/* Section 2: ข้อมูลติดต่อฉุกเฉิน & ยานพาหนะ (Optional) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-8 border-t border-gray-50">
              <section>
                <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <CreditCard className="text-[#f3a638]" /> ข้อมูลคีย์การ์ดและบริการ
                </h3>
                <div className="space-y-4">
                  <input placeholder="เลขคีย์การ์ด 1" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none" 
                    value={formData.keyCard1} onChange={(e) => setFormData({...formData, keyCard1: e.target.value})} />
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                    <input type="checkbox" className="w-5 h-5 accent-[#f3a638]" checked={formData.isLaundryService} 
                      onChange={(e) => setFormData({...formData, isLaundryService: e.target.checked})} />
                    <label className="font-bold text-gray-600">รับบริการซักรีด (Laundry)</label>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <Car className="text-[#f3a638]" /> ข้อมูลยานพาหนะ
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <input placeholder="เลขทะเบียนรถ" className="p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none" 
                    value={formData.vehicleNum1} onChange={(e) => setFormData({...formData, vehicleNum1: e.target.value})} />
                  <input placeholder="รายละเอียดรถ (รุ่น/สี)" className="p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none" 
                    value={formData.vehicleDetail1} onChange={(e) => setFormData({...formData, vehicleDetail1: e.target.value})} />
                </div>
              </section>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AddTenant;