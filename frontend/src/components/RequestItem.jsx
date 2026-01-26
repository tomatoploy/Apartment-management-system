import { Wrench, Sparkles, LogOut, FileText, Clock, CheckCircle2, XCircle } from "lucide-react";

const RequestItem = ({ req, onClick }) => {
  // ย้าย Config มาไว้ที่นี่เพื่อให้ Item จัดการการแสดงผลด้วยตัวเอง
  const subjectConfig = {
    fix: { label: "แจ้งซ่อม", icon: <Wrench size={32} />, color: "bg-[#D8B4FE] text-[#6B21A8]" },
    clean: { label: "ทำความสะอาด", icon: <Sparkles size={32} />, color: "bg-[#BAE6FD] text-[#0369A1]" },
    leave: { label: "ย้ายออก", icon: <LogOut size={32} />, color: "bg-[#E5E7EB] text-[#374151]" },
    other: { label: "อื่นๆ", icon: <FileText size={32} />, color: "bg-[#FED7AA] text-[#9A3412]" },
  };

  const statusConfig = {
    pending: { label: "รอดำเนินการ", color: "bg-[#FEF9C3] text-[#854D0E]", icon: <Clock size={16} /> },
    finish: { label: "สำเร็จ", color: "bg-[#DCFCE7] text-[#166534]", icon: <CheckCircle2 size={16} /> },
    cancel: { label: "ยกเลิก", color: "bg-[#FEE2E2] text-[#991B1B]", icon: <XCircle size={16} /> },
  };

  const subject = subjectConfig[req.subject] || subjectConfig.other;
  const status = statusConfig[req.status] || statusConfig.pending;

  // ฟังก์ชันแปลงวันที่เป็นรูปแบบไทย
  const formatThaiDate = (dateString) => {
    if (!dateString) return "-";
    // ถ้าข้อมูลเดิมเป็นภาษาไทยอยู่แล้ว (จาก Mock Data เก่า) ให้คืนค่าเดิมกลับไปเลย
    if (dateString.includes("พ.ศ.") || dateString.includes("พฤศจิกายน")) return dateString;

    const [year, month, day] = dateString.split("-");
    const thaiMonths = [
      "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
      "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
    ];
    const thaiYear = parseInt(year) + 543;
    return `${parseInt(day)} ${thaiMonths[parseInt(month) - 1]} ${thaiYear}`;
  };

  return (
    <div
      onClick={onClick}
      className="flex overflow-hidden max-w-3xl mx-auto items-center gap-6 bg-gray-50 border border-gray-300 p-5 rounded-[25px] hover:shadow-md transition-all cursor-pointer group w-full"
    >
      {/* ไอคอนตามประเภทเรื่อง */}
      <div className={`p-4 rounded-2xl ${subject.color} shrink-0 transition-transform group-hover:scale-110`}>
        {subject.icon}
      </div>

      {/* ข้อมูลเนื้อหา */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-2xl font-bold text-gray-800">{req.roomId}</span>
        </div>
        <p className="font-bold text-gray-700">{subject.label}</p>
        <p className="text-sm text-gray-500 truncate">{req.body}</p>
      </div>

      {/* ส่วนสถานะและวันที่ (ฝั่งขวาสุด) */}
      <div className="flex flex-col justify-between items-end self-stretch min-w-30 sm:min-w-35">
        <span
          className={`w-28 py-1.5 rounded-full text-[11px] font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all group-hover:scale-105 ${status.color}`}
        >
          {status.icon}
          {status.label}
        </span>

        <div className="text-right">
          <p className="text-[10px] sm:text-[11px] text-gray-400 font-semibold tracking-wide uppercase">
            แจ้งเมื่อ : {formatThaiDate(req.requestDate)}
          </p>
          <p className="text-[10px] sm:text-[11px] text-gray-400 font-semibold tracking-wide uppercase">
            นัดหมาย : {formatThaiDate(req.appointmentDate)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default RequestItem;