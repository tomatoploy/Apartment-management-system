import { useState } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

const Layout = ({ children, userProfileImage, onLogout }) => {
  // สร้าง State สำหรับควบคุมการย่อ/ขยาย Sidebar
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="min-h-screen  flex flex-col">
      <Navbar />

      <div className="flex flex-1 pt-16">
        {/* ส่ง State และฟังก์ชันไปให้ Sidebar */}
        <Sidebar
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          userProfileImage={userProfileImage}
          onLogout={onLogout}
        />

        {/* ปรับ ml (Margin Left) ตามสถานะ Sidebar */}
        <main
          className={` bg-white-50 flex-1 transition-all duration-300 p-6 overflow-y-auto 
  ${isCollapsed ? "ml-20" : "ml-64"}`}
        >
          {" "}
          {/* ตรวจสอบว่ามี ml-20 และ ml-64 ตรงนี้ */}
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
