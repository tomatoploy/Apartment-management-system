import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";

const AdminRegister = () => {
  const navigate = useNavigate();
  // สร้าง State เพื่อเก็บข้อมูลจากฟอร์ม
  const [formData, setFormData] = useState({
    prefix: "",
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    // --- Logic จัดการช่องเบอร์โทรศัพท์ ---
    if (name === "phone") {
      // 1. อนุญาตเฉพาะตัวเลข (Regex) และยอมให้เป็นค่าว่างได้ (ตอนลบ)
      if (value !== "" && !/^\d+$/.test(value)) return;

      // 2. จำกัดความยาวไม่เกิน 10 หลัก
      if (value.length > 10) return;
    }

    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // 1. ตรวจสอบค่าว่าง (ฟิลด์บังคับ)
    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.phone ||
      !formData.password
    ) {
      alert("กรุณากรอกข้อมูลในช่องที่มีเครื่องหมาย * ให้ครบถ้วน");
      return;
    }

    // 2. ตรวจสอบชื่อและนามสกุล (ต้องเป็นตัวอักษรไทยหรืออังกฤษเท่านั้น)
    // [a-zA-Zก-ฮะ-์] หมายถึง ตัวอักษร A-Z และ ก-ฮ รวมถึงสระและวรรณยุกต์
    const nameRegex = /^[a-zA-Zก-ฮะ-์\s]+$/;
    if (!nameRegex.test(formData.firstName)) {
      alert("ชื่อต้องเป็นตัวอักษรเท่านั้น");
      return;
    }
    if (!nameRegex.test(formData.lastName)) {
      alert("นามสกุลต้องเป็นตัวอักษรเท่านั้น");
      return;
    }

    // 3. ตรวจสอบเบอร์โทรศัพท์ (ต้องเป็นตัวเลข 10 หลัก)
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(formData.phone)) {
      alert("กรุณากรอกเบอร์โทรให้ถูกต้อง");
      return;
    }

    // 4. ตรวจสอบอีเมล (ถ้ามีการกรอก - เนื่องจากในฟอร์มไม่ได้บังคับ)
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      alert("รูปแบบอีเมลไม่ถูกต้อง");
      return;
    }

    // หากผ่านทุกเงื่อนไข
    console.log("บันทึกข้อมูลสำเร็จ:", formData);
    alert("ลงทะเบียนสำเร็จ!");
    navigate("/buildingregister");
  };

  // คอมโพเนนต์จิ๋วสำหรับ Label ที่มี * สีแดง
  const RequiredLabel = ({ text }) => (
    <label className="block text-[14px]  mb-1">
      {text} <span className="text-red-500">*</span>
    </label>
  );

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-linear-to-br from-[#57a3de] via-[#e5b54f] to-[#d65d2c] p-4 font-kanit">
      <div className="bg-white/90 backdrop-blur-sm w-full max-w-125 rounded-[40px] p-10 shadow-2xl">
        <button
          onClick={() => navigate("/login")}
          className="absolute right-6 top-6 text-gray-400 hover:text-black transition-colors"
        >
          <X size={24} strokeWidth={3} />
        </button>
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
          ลงทะเบียน
        </h1>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <RequiredLabel text="คำนำหน้า" />
              <select
                name="prefix"
                value={formData.prefix}
                onChange={handleChange}
                className="w-full p-2 bg-white border border-gray-400 rounded-xl outline-none text-m focus:ring-2 focus:ring-orange-400"
              >
                <option>นาย</option>
                <option>นาง</option>
                <option>นางสาว</option>
              </select>
            </div>
            <div>
              <RequiredLabel text="ชื่อ" />
              <input
                name="firstName"
                required
                type="text"
                onChange={handleChange}
                className="w-full p-2 bg-white border border-gray-400 rounded-xl outline-none text-sm focus:ring-2 focus:ring-orange-400"
              />
            </div>
          </div>

          <div>
            <RequiredLabel text="นามสกุล" />
            <input
              name="lastName"
              required
              type="text"
              onChange={handleChange}
              className="w-full p-2 bg-white border border-gray-400 rounded-xl outline-none text-sm focus:ring-2 focus:ring-orange-400"
            />
          </div>

          <div>
            <RequiredLabel text="หมายเลขโทรศัพท์" />
            <input
              name="phone"
              required
              type="text" 
              inputMode="numeric"/* ให้มือถือเด้งแป้นตัวเลข */ 
              placeholder="08XXXXXXXX"
              value={formData.phone}
              onChange={handleChange}
              className="w-full p-2 bg-white border border-gray-400 rounded-xl outline-none text-sm focus:ring-2 focus:ring-orange-400"
            />
          </div>

          <div>
            <label className="block text-[14px] font-bold mb-1 text-gray-700">
              อีเมล
            </label>
            <input
              name="email"
              type="email"
              placeholder="example@mail.com"              
              onChange={handleChange}
              className="w-full p-2 bg-white border border-gray-400 rounded-xl outline-none text-sm focus:ring-2 focus:ring-orange-400"
            />
          </div>

          <div>
            <RequiredLabel text="รหัสผ่าน" />
            <input
              name="password"
              required
              type="password"
              onChange={handleChange}
              className="w-full p-2 bg-white border border-gray-400 rounded-xl outline-none text-sm focus:ring-2 focus:ring-orange-400"
            />
          </div>

          <div className="pt-6 space-y-3">
            <button
              type="submit"
              // onClick={() => navigate("/buildingregister")}  //ข้ามไปหน้าถัดไปแบบไม่ต้องใส่ข้อมูล
              className="w-full bg-[#f3a638] hover:bg-[#e29528] text-white font-bold py-3 rounded-xl shadow-md transition-all text-md"
            >
              ลงทะเบียน
            </button>
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-600 font-bold py-3 rounded-xl transition-all text-md"
            >
              กลับ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminRegister;
