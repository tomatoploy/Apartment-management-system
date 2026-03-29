import React, { useState } from "react";
import { Phone, Lock, Loader2 } from "lucide-react";
import logo from "../assets/AMS-logo.png";
import { useNavigate } from "react-router-dom";
import { adminService } from "../api/AdminApi";
import { permissionService } from "../api/PermissionApi";

const Login = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    phone: "",
    password: ""
  });
  
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
    
    if (!formData.phone || !formData.password) {
      alert("กรุณากรอกหมายเลขโทรศัพท์และรหัสผ่าน");
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        phone: formData.phone.replace(/\D/g, ""),
        password: formData.password
      };

      // 1. ตรวจสอบเบอร์โทรและรหัสผ่าน (Login)
      const res = await adminService.loginAdmin(payload); 
      
      if (res && res.adminId) {
        try {
          // 2. ตรวจสอบสิทธิ์การเข้าถึง (Permission) ว่ามีสิทธิ์ในหอพักใดๆ หรือไม่
          const permissionsRes = await permissionService.getPermissionsByAdmin(res.adminId);
          
          // ดึง Array สิทธิ์ออกมา
          let permissions = [];
          if (Array.isArray(permissionsRes)) {
              permissions = permissionsRes;
          } else if (permissionsRes && permissionsRes.$values) {
              permissions = permissionsRes.$values;
          } else if (permissionsRes && permissionsRes.data) {
              permissions = Array.isArray(permissionsRes.data) ? permissionsRes.data : permissionsRes.data.$values || [];
          }

          // 3. ตรวจสอบความถูกต้อง: ถ้าสิทธิ์เป็น Array ว่าง แปลว่าไม่มีสิทธิ์!
          if (permissions.length === 0) {
            alert("บัญชีของคุณยังไม่ได้รับสิทธิ์เข้าใช้งานระบบหอพักนี้ กรุณาติดต่อผู้ดูแลระบบ");
            setIsLoading(false);
            return; 
          }

          // 🌟 4. มีสิทธิ์ครบถ้วน -> เก็บข้อมูลลงเครื่องและสร้าง Token 🌟
          localStorage.setItem("adminId", res.adminId);
          
          // 👉 เพิ่มบรรทัดนี้: สร้างบัตรผ่าน (Token) ให้ Sidebar ยอมรับ
          localStorage.setItem("token", res.token || "logged_in_success"); 

          console.log("Login success! Permissions found:", permissions);
          
          // 👉 เพิ่ม { replace: true } เพื่อไม่ให้พอกดเข้า Dashboard แล้วกด Back กลับมาหน้า Login ได้อีก
          navigate("/dashboard", { replace: true });

        } catch (permErr) {
          console.log("Permission check failed or empty:", permErr);
          alert("บัญชีของคุณยังไม่ได้รับสิทธิ์เข้าใช้งานระบบหอพักนี้ กรุณาติดต่อผู้ดูแลระบบ");
          setIsLoading(false);
          return; 
        }
      }
    } catch (err) {
      console.log("Login error:", err.response?.data);
      alert(err.response?.data?.message || "หมายเลขโทรศัพท์หรือรหัสผ่านไม่ถูกต้อง");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#FFEDD5] p-4">
      <div className="bg-white/90 backdrop-blur-sm w-full max-w-sm rounded-[40px] p-10 shadow-2xl flex flex-col items-center">
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-20 mb-2">
            <img src={logo} alt="AMS Logo" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">เข้าสู่ระบบ</h1>
          <p className="text-gray-700 text-sm mt-1">
            Apartment Management System
          </p>
        </div>

        <form className="w-full space-y-4" onSubmit={handleSubmit}>
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