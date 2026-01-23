import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";

const Register = () => {
  const navigate = useNavigate();
  // สร้าง State เพื่อเก็บข้อมูลจากฟอร์ม
  const [formData, setFormData] = useState({
    prefix: '',
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    password: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // ตรวจสอบข้อมูลเบื้องต้น (Validation)
    if (!formData.firstName || !formData.lastName || !formData.phone || !formData.password) {
      alert("กรุณากรอกข้อมูลในช่องที่มีเครื่องหมาย * ให้ครบถ้วน");
      return;
    }

    console.log("บันทึกข้อมูลสำเร็จ:", formData);
    alert("ลงทะเบียนสำเร็จ!");
    navigate("/login"); // กลับไปหน้า Login
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
              type="tel" 
              onChange={handleChange}
              className="w-full p-2 bg-white border border-gray-400 rounded-xl outline-none text-sm focus:ring-2 focus:ring-orange-400" 
            />
          </div>

          <div>
            <label className="block text-[14px] font-bold mb-1 text-gray-700">อีเมล</label>
            <input 
              name="email"
              type="email" 
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
              className="w-full bg-[#f3a638] hover:bg-[#e29528] text-black font-bold py-3 rounded-xl shadow-md transition-all text-md"
            >
              ลงทะเบียน
            </button>
            <button 
              type="button"
              onClick={() => navigate("/login")}
              className="w-full bg-[#eec58a] hover:bg-[#ddb479] text-[#7a4e1d] font-bold py-3 rounded-xl transition-all text-md"
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