import React from "react";
import { Phone, Lock } from "lucide-react";
import logo from "../assets/AMS-logo.png";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate();  //ใช้ Router
  return (
    // 1. พื้นหลัง
    <div className="min-h-screen w-full flex items-center justify-center bg-[#FFEDD5] p-4">
      {/* 2. กล่อง Login แบบกระจก (Glassmorphism) */}
      <div className="bg-white/90 backdrop-blur-sm w-full max-w-100 rounded-[40px] p-10 shadow-2xl flex flex-col items-center">
        {/* 3. โลโก้ตึกและชื่อระบบ */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-20 mb-2">
            <img src={logo} />
          </div>{" "}
          {/* หรือใช้แท็ก <img src="logo.png" /> */}
          <h1 className="text-2xl font-bold text-gray-800">เข้าสู่ระบบ</h1>
          <p className="text-gray-700 text-m mt-1">
            Apartment Management System
          </p>
        </div>

        {/* 4. ฟอร์มกรอกข้อมูล */}
        <form
          className="w-full space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            navigate("/dashboard"); // ไปหน้า Dashboard
          }}
        >
          {/* ช่องหมายเลขโทรศัพท์ */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Phone size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-400 transition-all text-sm"
              placeholder="หมายเลขโทรศัพท์"
            />
          </div>

          {/* ช่องรหัสผ่าน */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Lock size={18} className="text-gray-400" />
            </div>
            <input
              type="password"
              className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-400 transition-all text-sm"
              placeholder="รหัสผ่าน"
            />
          </div>

          {/* จดจำรหัสผ่าน และ ลืมรหัสผ่าน */}
          <div className="flex items-center justify-between px-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 accent-orange-400" />
              <span className="text-xs text-gray-500">จดจำการเข้าสู่ระบบ</span>
            </label>
            <a
              href="#"
              className="text-xs text-gray-500 hover:text-orange-500 transition-colors"
            >
              ลืมรหัสผ่าน ?
            </a>
          </div>

          {/* 5. ปุ่มกด  */}
          <div className="pt-4 space-y-3">
            <button
              type="submit"
              className="w-full bg-[#F5A623] hover:bg-[#e9920f] text-black font-bold py-3 rounded-xl shadow-md shadow-orange-200 transition-all text-sm"
            >
              เข้าสู่ระบบ
            </button>
            <button
              type="button"
              onClick={() => navigate("/adminregister")}
              className="w-full bg-[#eec58a] hover:bg-[#ddb479] text-[#7a4e1d] font-bold py-3 rounded-xl transition-all text-sm"
            >
              ลงทะเบียน
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
