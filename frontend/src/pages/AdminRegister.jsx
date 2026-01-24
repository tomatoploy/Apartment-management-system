import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { adminService } from "../api/AdminApi";

const Register = () => {
  const navigate = useNavigate();
  // สร้าง State เพื่อเก็บข้อมูลจากฟอร์ม
  const [formData, setFormData] = useState({
    prefix: "นาย",
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    password: ""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        title: formData.prefix,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone.replace(/\D/g, ""),
        email: formData.email,
        password: formData.password
      };

      console.log("payload:", payload);
      await adminService.createAdmin(payload);

      alert("ลงทะเบียนสำเร็จ!");
      navigate("/login");
    } catch (err) {
      console.log("backend error:", err.response?.data);
      alert("ลงทะเบียนไม่สำเร็จ");
    }
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
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">ลงทะเบียน</h1>
      
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <RequiredLabel text="คำนำหน้า" />
              <select 
                name="prefix"
                value={formData.prefix}
                required
                onChange={handleChange}
                className="w-full p-2 bg-white border border-gray-400 rounded-xl outline-none text-m focus:ring-2 focus:ring-orange-400"
              >
                <option value="นาย">นาย</option>
                <option value="นาง">นาง</option>
                <option value="นางสาว">นางสาว</option>
              </select>
            </div>
            <div>
              <RequiredLabel text="ชื่อ" />
              <input 
                name="firstName"
                required
                type="text"
                value={formData.firstName} 
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
              value={formData.lastName}
              onChange={handleChange}
              className="w-full p-2 bg-white border border-gray-400 rounded-xl outline-none text-sm focus:ring-2 focus:ring-orange-400" 
            />
          </div>

          <div>
            <RequiredLabel text="หมายเลขโทรศัพท์" />
            <input 
              name="phone"
              required
              value={formData.phone}
              onChange={handleChange}
              className="w-full p-2 bg-white border border-gray-400 rounded-xl outline-none text-sm focus:ring-2 focus:ring-orange-400" 
            />
          </div>

          <div>
            <label className="block text-[14px] font-bold mb-1 text-gray-700">อีเมล</label>
            <input 
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full p-2 bg-white border border-gray-400 rounded-xl outline-none text-sm focus:ring-2 focus:ring-orange-400" 
            />
          </div>

          <div>
            <RequiredLabel text="รหัสผ่าน" />
            <input 
              name="password"
              type="password"
              required
              value={formData.password}
              onChange={handleChange}
              className="w-full p-2 bg-white border border-gray-400 rounded-xl outline-none text-sm focus:ring-2 focus:ring-orange-400" 
            />
          </div>
          

          <div className="pt-6 space-y-3">
            <button 
              type="submit"
              className="mx-auto block w-1/1 bg-[#f3a638] hover:bg-[#e29528] 
                        text-black font-bold py-3 rounded-xl shadow-md transition-all text-md"
            >
              ลงทะเบียน
            </button>
            <button 
              type="button"
              onClick={() => navigate("/login")}
              className="mx-auto block w-1/1 bg-[#eec58a] hover:bg-[#ddb479] text-[#7a4e1d] font-bold py-3 rounded-xl transition-all text-md"
            >
              กลับ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;