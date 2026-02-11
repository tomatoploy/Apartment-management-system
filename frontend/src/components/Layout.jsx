import { useState } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

const Layout = ({ children, userProfileImage, onLogout }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false); // ควบคุมการเปิดปิดบนมือถือ

  return (
    <div className="h-screen flex flex-col md:bg-gray-50">
      {/* ส่งฟังก์ชันเปิดปิดไปให้ Navbar */}
      <Navbar onMenuClick={() => setIsMobileOpen(!isMobileOpen)} />
<div className="flex flex-1 pt-16 overflow-hidden relative">        {/* Sidebar สำหรับ Mobile (Overlay) และ Desktop */}
        <div
          className={`
            /* บนมือถือ: ให้ลอยทับ (fixed), อยู่ชั้นบนสุด (z-50), และดีดออกไปทางซ้าย (-translate-x-full) */
            fixed inset-y-0 left-0 z-50 transition-transform duration-300 pt-16
            ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
            
            /* บนคอมพิวเตอร์ (lg): ให้วางต่อกับเนื้อหาปกติ (relative), ไม่ต้องดีดไปไหน (translate-x-0) */
            lg:relative lg:translate-x-0 lg:pt-0 lg:z-0
            ${isCollapsed ? "lg:w-20" : "lg:w-64"}
          `}
        >
          <Sidebar
            isCollapsed={isCollapsed}
            setIsCollapsed={setIsCollapsed}
            userProfileImage={userProfileImage}
            onLogout={onLogout}
            onItemClick={() => setIsMobileOpen(false)} // 4. ปิด Sidebar เมื่อเลือกเมนูบนมือถือ
          />
        </div>
        
        {/* 5. Backdrop สีดำจางๆ (แสดงเฉพาะตอนเปิดเมนูบนมือถือ) */}
        {isMobileOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-40 lg:hidden"
            onClick={() => setIsMobileOpen(false)}
          ></div>
        )}

        {/* Main Content */}
        <main className="flex-1 transition-all duration-300 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto bg-white min-h-full p-4 rounded-none border-0 shadow-none md:min-h-[85vh] md:p-10 md:rounded-3xl md:shadow-lg md:border md:border-gray-200">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;