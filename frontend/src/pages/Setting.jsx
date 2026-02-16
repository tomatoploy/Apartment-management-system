import React from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";


const Settings = () => {
  const navigate = useNavigate();

  // ข้อมูลเมนูตั้งค่า พร้อมระบุ path และรูปภาพพื้นหลัง
  const settingsMenu = [
    {
      id: 1,
      title: "ข้อมูลหอพัก",
      path: "/settings/building-edit",
      bgColor: "bg-orange-200",
    },
    {
      id: 2,
      title: "อัตราค่าไฟฟ้าและค่าน้ำประปา",
      path: "/settings/utility",
      bgColor: "bg-orange-200",
    },
    {
      id: 3,
      title: "ค่าเช่าห้องพักและค่าบริการ",
      path: "/settings/roomrate",
      bgColor: "bg-orange-200",
    },
    {
      id: 4,
      title: "สัญญาและเอกสาร",
      path: "/",
      bgColor: "bg-orange-200",
    },
    {
      id: 5,
      title: "ข้อมูลแอดมิน",
      path: "/settings/admin",
      bgColor: "bg-orange-200",
    },
    {
      id: 6,
      title: "ตั้งค่าการเข้าถึงของแอดมิน",
      path: "",
      bgColor: "bg-orange-200",
    },

  ];

  return (
    /* คอนเทนเนอร์หลักที่ใช้ความสูงเต็มหน้าจอเพื่อไม่ให้เกิดสเปซขาวด้านล่าง */
    <>
      <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
        การตั้งค่า
      </h1>

      {/* รายการเมนูเรียงต่อกัน 3 อันแนวตั้ง */}
      <div className="flex-1 flex flex-col justify-center max-w-xl mx-auto py-4 px-2 w-full space-y-6 overflow-y-auto pr-2">
        {settingsMenu.map((item) => (
          <div
            key={item.id}
            onClick={() => navigate(item.path)}
            className={`${item.bgColor} rounded-[35px] h-20 flex items-center justify-between px-10 cursor-pointer shadow-md hover:scale-[1.02] transition-all relative overflow-hidden group`}
          >

            {/* ชื่อเมนู */}
            <h2 className="text-xl  text-gray-600 z-10">
              {item.title}
            </h2>

            {/* ปุ่มลูกศร */}
            <div className="z-10 bg-white/60 p-2 rounded-full text-[#0c4a6e] group-hover:bg-[#f3a638] group-hover:text-white transition-colors">
              <ChevronRight size={32} />
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default Settings;
