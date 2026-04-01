import React, { useState, useRef, useEffect } from "react";
import { Calendar, ChevronLeft, ChevronRight, ChevronDown,X } from "lucide-react";

// --- 1. Helpers สำหรับจัดการวันที่และเดือนไทย (Export ให้ไฟล์อื่นใช้ได้) ---
// แปลงวันที่เต็ม: 2026-02-09 -> 9 กุมภาพันธ์ 2569
export const toThaiDate = (dateString) => {
  if (!dateString || dateString === "-") return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString("th-TH", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

// แปลงเฉพาะเดือน: 2026-02 -> กุมภาพันธ์ 2569 (สำหรับ BillDetail และหน้า Billing)
export const toThaiMonth = (monthString) => {
  if (!monthString || monthString === "-") return "-";
  const [year, month] = monthString.split("-").map(Number);
  const date = new Date(year, month - 1);
  if (isNaN(date.getTime())) return monthString;
  return date.toLocaleDateString("th-TH", {
    month: "long",
    year: "numeric",
  });
};

// แก้ไขส่วน FieldLabel ให้เป็นสไตล์เดียวกับหน้า AddTenant
const FieldLabel = ({ children, required }) => (
  <label className="text-[13px] font-bold text-gray-500 mb-2 ml-1 block">
    {children} {required && <span className="text-red-500">*</span>}
  </label>
);

// แก้ไขบรรทัดเริ่มต้นของ DateInput ให้ปลอดภัยขึ้น
export const DateInput = ({
  label,
  name,
  value,
  onChange,
  required,
  className = "",
}) => {
  const [show, setShow] = useState(false);
  const containerRef = useRef(null);
  const months = [
    "ม.ค.",
    "ก.พ.",
    "มี.ค.",
    "เม.ย.",
    "พ.ค.",
    "มิ.ย.",
    "ก.ค.",
    "ส.ค.",
    "ก.ย.",
    "ต.ค.",
    "พ.ย.",
    "ธ.ค.",
  ];
  const monthsFull = [
    "มกราคม",
    "กุมภาพันธ์",
    "มีนาคม",
    "เมษายน",
    "พฤษภาคม",
    "มิถุนายน",
    "กรกฎาคม",
    "สิงหาคม",
    "กันยายน",
    "ตุลาคม",
    "พฤศจิกายน",
    "ธันวาคม",
  ];

  const today = new Date();
  const [viewDate, setViewDate] = useState(today);
  const [yearInput, setYearInput] = useState("");

  // --- 1. useEffect สำหรับปิดเมื่อคลิกข้างนอก (แก้ไขจุดนี้) ---
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setShow(false);
      }
    };

    if (show) {
      // ลงทะเบียนเหตุการณ์เมื่อปฏิทินเปิด
      document.addEventListener("mousedown", handleOutsideClick);
    }

    return () => {
      // ลบเหตุการณ์ออกเมื่อปิดปฏิทิน หรือคอมโพเนนต์ถูกทำลาย (สำคัญมาก)
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [show]); // ให้ทำงานใหม่ทุกครั้งที่ค่า show เปลี่ยน

  // --- 2. useEffect สำหรับ Sync ข้อมูลวันที่ ---
  useEffect(() => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        setViewDate(d);
        setYearInput((d.getFullYear() + 543).toString());
      }
    } else {
      setYearInput((today.getFullYear() + 543).toString());
    }
  }, [value, show]);

  const handleClear = (e) => {
    e.stopPropagation(); 
    onChange({ target: { name, value: "" } }); 
  };

  const handleYearChange = (e) => {
    const val = e.target.value;
    setYearInput(val);
    if (val.length === 4) {
      const adYear = parseInt(val) - 543;
      if (adYear > 1900 && adYear < 2100) {
        setViewDate(new Date(adYear, viewDate.getMonth(), 1));
      }
    }
  };

  const handleMonthChange = (e) => {
    const newMonth = parseInt(e.target.value);
    setViewDate(new Date(viewDate.getFullYear(), newMonth, 1));
  };

  const handleDateClick = (day) => {
    const selected = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    const offset = selected.getTimezoneOffset() * 60000;
    const localISO = new Date(selected - offset).toISOString().split("T")[0];
    onChange({ target: { name, value: localISO } });
    setShow(false);
  };

  const daysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const firstDay = (y, m) => new Date(y, m, 1).getDay();

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && <FieldLabel required={required}>{label}</FieldLabel>}
      <div
        onClick={() => setShow(!show)}
        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-2xl flex items-center justify-between font-bold text-gray-700 cursor-pointer hover:border-[#f3a638] transition-all min-h-11"
      >
        <span className={value ? "" : "text-gray-400 font-normal"}>
          {value ? toThaiDate(value) : "\u00A0"}
        </span>
        <div className="flex items-center gap-2">
          {value && (
            <div 
              onClick={handleClear}
              className="p-1 hover:bg-gray-200 rounded-full transition-colors text-gray-400"
            >
              <X size={14} />
            </div>
          )}
          <Calendar size={18} className="text-[#f3a638]" />
        </div>
      </div>

      {show && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-100 shadow-2xl rounded-[30px] p-5 z-100 ">
          <div className="flex items-center justify-between mb-4 bg-gray-50 p-2 rounded-2xl border border-gray-100/50 gap-1">
            <button
              type="button"
              onClick={() =>
                setViewDate(
                  new Date(viewDate.getFullYear(), viewDate.getMonth() - 1),
                )
              }
              className="p-1.5 hover:bg-white rounded-xl text-[#f3a638] active:scale-90 transition-all"
            >
              <ChevronLeft size={18} />
            </button>

            <div className="flex flex-1 gap-1 items-center justify-center">
              {/* Dropdown เลือกเดือน */}
<div className="relative flex items-center bg-white px-2 py-1 rounded-lg shadow-sm border border-orange-50 w-1/2">                <select
                  value={viewDate.getMonth()}
                  onChange={handleMonthChange}
                  className="w-full bg-transparent border-none focus:outline-none cursor-pointer text-[#f3a638] font-black text-xs appearance-none text-center"
                >
                  {monthsFull.map((m, i) => (
                    <option key={i} value={i}>
                      {m}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={10}
                  className="text-orange-300 pointer-events-none absolute right-1"
                />
              </div>

              {/* ช่องพิมพ์ปี พ.ศ. */}
<div className="relative flex items-center bg-white px-1 py-1 rounded-lg shadow-sm border border-orange-100 w-1/2">                <input
                  type="number"
                  value={yearInput}
                  onChange={handleYearChange}
                  className="w-full bg-transparent border-none focus:outline-none text-[#f3a638] font-black text-xs text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  placeholder="พ.ศ."
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                setViewDate(
                  new Date(viewDate.getFullYear(), viewDate.getMonth() + 1),
                )
              }
              className="p-1.5 hover:bg-white rounded-xl text-[#f3a638] active:scale-90 transition-all"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="grid grid-cols-7 mb-2 text-center text-[10px] font-bold text-gray-400">
            {["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array(firstDay(viewDate.getFullYear(), viewDate.getMonth()))
              .fill(null)
              .map((_, i) => (
                <div key={i} />
              ))}
            {Array.from(
              {
                length: daysInMonth(
                  viewDate.getFullYear(),
                  viewDate.getMonth(),
                ),
              },
              (_, i) => i + 1,
            ).map((day) => (
              <button
                key={day}
                type="button"
                onClick={() => handleDateClick(day)}
                className={`py-2 text-xs font-bold rounded-xl transition-all ${value && new Date(value).getDate() === day && new Date(value).getMonth() === viewDate.getMonth() && new Date(value).getFullYear() === viewDate.getFullYear() ? "bg-[#f3a638] text-white" : "hover:bg-orange-50 text-gray-600"}`}
              >
                {day}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// --- 3. CustomMonthPicker: สำหรับเลือกเดือนรอบบิล (Dropdown) ---
export const CustomMonthPicker = ({ value, onChange, className = "" }) => {
  const [show, setShow] = useState(false);
  const containerRef = useRef(null);

  const months = [
    "ม.ค.",
    "ก.พ.",
    "มี.ค.",
    "เม.ย.",
    "พ.ค.",
    "มิ.ย.",
    "ก.ค.",
    "ส.ค.",
    "ก.ย.",
    "ต.ค.",
    "พ.ย.",
    "ธ.ค.",
  ];
  const monthsFull = [
    "มกราคม",
    "กุมภาพันธ์",
    "มีนาคม",
    "เมษายน",
    "พฤษภาคม",
    "มิถุนายน",
    "กรกฎาคม",
    "สิงหาคม",
    "กันยายน",
    "ตุลาคม",
    "พฤศจิกายน",
    "ธันวาคม",
  ];
  const currentYear = new Date().getFullYear();

  // แยกค่า Year และ Month จาก value (ค.ศ.)
  const [vYear, vMonth] = value
    ? value.split("-").map(Number)
    : [currentYear, new Date().getMonth() + 1];

  // ให้หน้าจอเริ่มต้นที่ปีของ value ที่ส่งมา
  const [viewYear, setViewYear] = useState(vYear);

  // Sync viewYear เมื่อ value ภายนอกมีการเปลี่ยนแปลง
  useEffect(() => {
    if (value) {
      const [y] = value.split("-").map(Number);
      setViewYear(y);
    }
  }, [value]);

  useEffect(() => {
    const clickOut = (e) =>
      containerRef.current &&
      !containerRef.current.contains(e.target) &&
      setShow(false);
    document.addEventListener("mousedown", clickOut);
    return () => document.removeEventListener("mousedown", clickOut);
  }, []);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <div
        onClick={() => setShow(!show)}
className="w-full p-3 bg-gray-50 border border-gray-200 rounded-2xl flex items-center justify-between font-bold text-gray-700 cursor-pointer hover:border-[#f3a638] transition-all h-12"      >
        <Calendar size={18} className="absolute right-8 text-[#f3a638]" />
        <span className="truncate">
          {value ? `${monthsFull[vMonth - 1]} ${vYear + 543}` : "เลือกรอบบิล"}
        </span>
        <ChevronDown
          size={16}
          className={`text-gray-400 transition-transform ${show ? "rotate-180" : ""}`}
        />
      </div>

      {show && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-100 shadow-2xl rounded-[30px] p-5 z-[100] animate-in fade-in zoom-in duration-200">
          <div className="flex items-center justify-between mb-4 bg-orange-50/50 p-2 rounded-2xl">
            <span className="text-[10px] font-black text-[#f3a638] ml-2 uppercase">
              ปี พ.ศ.
            </span>
            <select
              value={viewYear}
              onChange={(e) => setViewYear(Number(e.target.value))}
              className="bg-transparent border-none font-black text-gray-700 text-sm focus:outline-none cursor-pointer"
            >
              {/* ปรับตรงนี้: ย้อนหลัง 20 ปี ถึง ล่วงหน้า 10 ปี */}
              {Array.from({ length: 10 }, (_, i) => currentYear - 5 + i).map(
                (y) => (
                  <option key={y} value={y}>
                    {y + 543}
                  </option>
                ),
              )}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {months.map((m, i) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  onChange(`${viewYear}-${String(i + 1).padStart(2, "0")}`);
                  setShow(false);
                }}
                className={`py-3 text-[11px] font-black rounded-xl transition-all ${
                  vMonth === i + 1 && vYear === viewYear
                    ? "bg-[#f3a638] text-white shadow-md shadow-orange-100 scale-105"
                    : "hover:bg-orange-50 text-gray-600"
                }`}
              >
                {m.substring(0, 5)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
