import React, { useState } from "react";
import { Phone, Lock, Loader2 } from "lucide-react";
import logo from "../assets/AMS-logo.png";
import { useNavigate } from "react-router-dom";
import { adminService } from "../api/AdminApi";
import { permissionService } from "../api/PermissionApi"; // 🌟 Import Permission Service เพิ่ม

const Login = () => {
  const navigate = useNavigate();  //ใช้ Router

  const [formData, setFormData] = useState({
    phone: "",
    password: ""
  });
  
  // 🌟 เพิ่ม State สำหรับแสดงสถานะกำลังโหลด
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: value 
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true); // เริ่มหมุน Loading

    try {
      const payload = {
        phone: formData.phone.replace(/\D/g, ""),
        password: formData.password
      };

      // 1. ตรวจสอบรหัสผ่าน (Login)
      const res = await adminService.loginAdmin(payload); 
      
      if (res.adminId) {
        try {
          // 🌟 2. ตรวจสอบสิทธิ์การเข้าถึง (Permission)
          const permissions = await permissionService.getPermissionsByAdmin(res.adminId);
          
          // ถ้าไม่มีข้อมูลสิทธิ์ส่งกลับมา (เป็น null/undefined หรือ array ว่าง)
          if (!permissions || permissions.length === 0) {
            alert("บัญชีของคุณยังไม่ได้รับสิทธิ์เข้าใช้งานระบบหอพักนี้ กรุณาติดต่อผู้ดูแลระบบค่ะ");
            setIsLoading(false);
            return; // บล็อกไว้แค่นี้ ไม่ให้ไปหน้า dashboard
          }

          // 3. ผ่านทั้งคู่ -> เก็บ adminId ไว้ในเครื่อง
          localStorage.setItem("adminId", res.adminId);
          
          console.log("login success:", res);
          navigate("/dashboard");

        } catch (permErr) {
          // กรณี API คืนค่า 204 No Content (ไม่มีสิทธิ์) หรือ Error อื่นๆ
          console.log("permission error:", permErr);
          alert("บัญชีของคุณยังไม่ได้รับสิทธิ์เข้าใช้งานระบบหอพักนี้ กรุณาติดต่อผู้ดูแลระบบค่ะ");
          setIsLoading(false);
          return;
        }
      }
    } catch (err) {
      console.log("login error:", err.response?.data);
      // แสดงข้อความ Error จาก API (ถ้ามี)
      alert(err.response?.data?.message || "หมายเลขโทรศัพท์หรือรหัสผ่านไม่ถูกต้อง");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // 1. พื้นหลัง
    <div className="min-h-screen w-full flex items-center justify-center bg-[#FFEDD5] p-4">
      {/* 2. กล่อง Login แบบกระจก (Glassmorphism) */}
      <div className="bg-white/90 backdrop-blur-sm w-full max-w-sm rounded-[40px] p-10 shadow-2xl flex flex-col items-center">
        {/* 3. โลโก้ตึกและชื่อระบบ */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-20 mb-2">
            <img src={logo} alt="AMS Logo" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">เข้าสู่ระบบ</h1>
          <p className="text-gray-700 text-sm mt-1">
            Apartment Management System
          </p>
        </div>

        {/* 4. ฟอร์มกรอกข้อมูล */}
        <form className="w-full space-y-4" onSubmit={handleSubmit}>
          {/* ช่องหมายเลขโทรศัพท์ */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Phone size={18} className="text-gray-400" />
            </div>
            <input
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-400 transition-all text-sm font-bold text-gray-700"
              placeholder="หมายเลขโทรศัพท์"
              disabled={isLoading}
            />
          </div>

          {/* ช่องรหัสผ่าน */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Lock size={18} className="text-gray-400" />
            </div>
            <input
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-400 transition-all text-sm font-bold text-gray-700"
              placeholder="รหัสผ่าน"
              disabled={isLoading}
            />
          </div>

          {/* จดจำรหัสผ่าน และ ลืมรหัสผ่าน */}
          <div className="flex items-center justify-between px-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 accent-orange-400" disabled={isLoading} />
              <span className="text-xs font-bold text-gray-500">จดจำการเข้าสู่ระบบ</span>
            </label>
            <a
              href="#"
              className="text-xs font-bold text-gray-500 hover:text-orange-500 transition-colors"
            >
              ลืมรหัสผ่าน ?
            </a>
          </div>

          {/* 5. ปุ่มกด  */}
          <div className="pt-4 space-y-3">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#F5A623] hover:bg-[#e9920f] text-black font-black py-3.5 rounded-xl shadow-md shadow-orange-200 transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : "เข้าสู่ระบบ"}
            </button>
            <button
              type="button"
              disabled={isLoading}
              onClick={() => navigate("/adminregister")}
              className="w-full bg-[#eec58a] hover:bg-[#ddb479] text-[#7a4e1d] font-black py-3.5 rounded-xl transition-all text-sm disabled:opacity-70"
            >
              ลงทะเบียนผู้ดูแล
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;