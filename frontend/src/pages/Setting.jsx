import React from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronRight,
  Building2,
  Zap,
  Wallet,
  FileText,
  User,
  ShieldCheck,
} from "lucide-react";

const Settings = () => {
  const navigate = useNavigate();

  const settingsMenu = [
    {
      id: 1,
      title: "ข้อมูลหอพัก",
      description: "แก้ไขข้อมูลชื่อ ที่อยู่ และรายละเอียดหอพัก",
      path: "/settings/building-edit",
      icon: <Building2 size={22} />,
    },
    {
      id: 2,
      title: "อัตราค่าไฟฟ้าและค่าน้ำประปา",
      description: "กำหนดราคาต่อหน่วยสำหรับคำนวณบิลรายเดือน",
      path: "/settings/utility",
      icon: <Zap size={22} />,
    },
    {
      id: 3,
      title: "ค่าเช่าห้องพักและค่าบริการ",
      description: "ตั้งค่าราคาเช่าและค่าบริการเพิ่มเติม",
      path: "/settings/roomrate",
      icon: <Wallet size={22} />,
    },
    {
      id: 4,
      title: "สัญญาและเอกสาร",
      description: "จัดการ template สัญญาและไฟล์เอกสาร",
      path: "/settings/contract",
      icon: <FileText size={22} />,
    },
    {
      id: 5,
      title: "ข้อมูลแอดมิน",
      description: "แก้ไขข้อมูลส่วนตัวผู้ดูแลระบบ",
      path: "/settings/admin",
      icon: <User size={22} />,
    },
    {
      id: 6,
      title: "ตั้งค่าการเข้าถึงของแอดมิน",
      description: "กำหนดสิทธิ์การใช้งานของผู้ดูแลระบบ",
      path: "/settings/admin-access",
      icon: <ShieldCheck size={22} />,
    },
  ];

  return (
    <>
      <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
        การตั้งค่า
      </h1>
      {/* Menu Grid */}
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        {settingsMenu.map((item) => {
          return (
            <div
              key={item.id}
              onClick={() => {
                if (item.id === 4 && window.innerWidth < 768) return;
                navigate(item.path);
              }}
              className={`
                bg-white rounded-2xl p-6
                flex items-center justify-between
                shadow-sm border border-gray-200
                transition-all duration-200
                ${
                  item.id === 4
                    ? "cursor-not-allowed md:cursor-pointer md:hover:shadow-md md:hover:scale-103"
                    : "hover:shadow-md hover:scale-103 cursor-pointer"
                }
              `}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`bg-orange-100 text-orange-500 p-3 rounded-xl ${item.id === 4 ? "opacity-30 md:opacity-100" : ""}`}
                >
                  {item.icon}
                </div>

                <div>
                  <h2
                    className={`text-lg font-semibold text-gray-800 ${item.id === 4 ? "opacity-40 md:opacity-100" : ""}`}
                  >
                    {item.title}
                  </h2>
                  <p
                    className={`text-sm text-gray-500 mt-1 ${item.id === 4 ? "opacity-30 md:opacity-100" : ""}`}
                  >
                    {item.description}
                  </p>

                  {item.id === 4 && (
                    <span className="block md:hidden text-red-500 font-medium mt-2 text-xs">
                      * ไม่รองรับการใช้งานบนมือถือ
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

export default Settings;
