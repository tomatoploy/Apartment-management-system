import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  FileText, Download, Loader2, ChevronLeft, CheckCircle2,
  Calendar, CreditCard
} from "lucide-react";
import ReactQuill, { Quill } from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

import RoomHeader from "../components/RoomHeader";
import { toThaiDate } from "../components/DateController";

import { roomService } from "../api/RoomApi";
import { contractService } from "../api/ContractApi";
import { tenantService } from "../api/TenantApi";
import { documentService } from "../api/DocumentApi";
import { apartmentService } from "../api/ApartmentApi";
import { adminService } from "../api/AdminApi";
import logoImg from "../assets/logo.png";

// ─── Quill setup ────────────────────────────────────────────
const Parchment = Quill.import("parchment");
const SizeStyle = Quill.import("attributors/style/size");
SizeStyle.whitelist = ["10px","12px","14px","16px","18px","20px","24px","28px","32px"];
Quill.register(SizeStyle, true);

if (Parchment) {
  const StyleAttributor = Parchment.StyleAttributor || Parchment.Attributor?.Style;
  if (StyleAttributor) {
    Quill.register({ "formats/align": new StyleAttributor("align","text-align",{ scope: Parchment.Scope.BLOCK, whitelist: ["center","right","justify"] }) }, true);
    Quill.register({ "formats/width": new StyleAttributor("width","width",{ scope: Parchment.Scope.ANY }) }, true);
  }
}

const QUILL_MODULES = {
  toolbar: { container: "#ql-history-toolbar" },
  history: { delay: 500, maxStack: 100, userOnly: true },
  clipboard: { matchVisual: false },
};

const QUILL_FORMATS = [
  "size","bold","italic","underline","strike",
  "color","background","list","align","indent",
  "table","width","min-width","max-width","image",
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
const getThaiMonthName = (date) => {
  if (!date) return "";
  const months = ["มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน",
    "กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"];
  return months[date.getMonth()];
};

const insertBlackText = (text) =>
  `<span style="color:#000000; font-weight:normal;">${text}</span>`;

// ─── Toolbar สำหรับดูและพิมพ์ ──────────────────────────────────────────────
const HistoryToolbar = ({ currentSize, onSizeChange }) => {
  const SIZES = ["10px","12px","14px","16px","18px","20px","24px","28px","32px"];
  return (
    <div
      id="ql-history-toolbar"
      className="flex flex-wrap items-center gap-1.5 px-4 py-2 bg-white border-b border-gray-200 justify-center shrink-0 shadow-sm relative z-40"
    >
      <div className="relative group flex items-center h-8 z-50">
        <div className="flex items-center justify-between w-20 px-2 h-full rounded border border-gray-300 bg-white cursor-pointer group-hover:border-orange-400 transition-colors">
          <span className="text-xs font-bold text-gray-700">{currentSize || "16px"}</span>
          <span className="text-[8px] text-gray-400">▼</span>
        </div>
        <div className="absolute top-full left-0 w-full h-3 bg-transparent" />
        <div className="absolute top-[calc(100%+4px)] left-0 w-20 bg-white border border-gray-200 shadow-xl rounded-lg py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
          {SIZES.map((s) => (
            <div
              key={s}
              onMouseDown={(e) => { e.preventDefault(); onSizeChange(s); }}
              className="px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-orange-50 hover:text-orange-600 cursor-pointer"
            >
              {s}
            </div>
          ))}
        </div>
      </div>

      <span className="w-px h-6 bg-gray-300 mx-1" />
      <button className="ql-bold tbtn font-black text-sm">B</button>
      <button className="ql-italic tbtn italic text-sm">I</button>
      <button className="ql-underline tbtn underline text-sm">U</button>
      <span className="w-px h-6 bg-gray-300 mx-1" />
      <button className="ql-align tbtn" value="" title="ชิดซ้าย">
        <svg viewBox="0 0 18 18" width="14" height="14"><line x1="3" y1="4" x2="15" y2="4" stroke="currentColor" strokeWidth="2"/><line x1="3" y1="8" x2="11" y2="8" stroke="currentColor" strokeWidth="2"/><line x1="3" y1="12" x2="15" y2="12" stroke="currentColor" strokeWidth="2"/></svg>
      </button>
      <button className="ql-align tbtn" value="center" title="กึ่งกลาง">
        <svg viewBox="0 0 18 18" width="14" height="14"><line x1="3" y1="4" x2="15" y2="4" stroke="currentColor" strokeWidth="2"/><line x1="5" y1="8" x2="13" y2="8" stroke="currentColor" strokeWidth="2"/><line x1="3" y1="12" x2="15" y2="12" stroke="currentColor" strokeWidth="2"/></svg>
      </button>
      <button className="ql-align tbtn" value="right" title="ชิดขวา">
        <svg viewBox="0 0 18 18" width="14" height="14"><line x1="3" y1="4" x2="15" y2="4" stroke="currentColor" strokeWidth="2"/><line x1="7" y1="8" x2="15" y2="8" stroke="currentColor" strokeWidth="2"/><line x1="3" y1="12" x2="15" y2="12" stroke="currentColor" strokeWidth="2"/></svg>
      </button>
      <button className="ql-align tbtn" value="justify" title="กระจายเท่ากัน">
        <svg viewBox="0 0 18 18" width="14" height="14"><line x1="3" y1="4" x2="15" y2="4" stroke="currentColor" strokeWidth="2"/><line x1="3" y1="8" x2="15" y2="8" stroke="currentColor" strokeWidth="2"/><line x1="3" y1="12" x2="15" y2="12" stroke="currentColor" strokeWidth="2"/></svg>
      </button>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const RoomContractHistory = () => {
  const { roomNumber } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const contractId = searchParams.get("contractId");

  const quillRef = useRef(null);
  const lastSelection = useRef(null);
  const [currentSize, setCurrentSize] = useState("16px");

  const [isLoading, setIsLoading] = useState(true);
  const [contract, setContract] = useState(null);
  const [allContracts, setAllContracts] = useState([]); 
  const [selectedContractId, setSelectedContractId] = useState(contractId ? Number(contractId) : null);

  const [tenantData, setTenantData] = useState(null);
  const [apartmentData, setApartmentData] = useState(null);
  const [adminName, setAdminName] = useState("ผู้ดูแลระบบ");
  const [templateHtml, setTemplateHtml] = useState("");
  const [editableHtml, setEditableHtml] = useState("");

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const adminId = localStorage.getItem("adminId");
        if (adminId) {
          adminService.getAdmin(adminId).then((a) => {
            setAdminName(`${a.title ?? ""}${a.firstName ?? ""} ${a.lastName ?? ""}`.trim() || "ผู้ดูแลระบบ");
          }).catch(() => {});
        }

        const [aptRes, docsRes, allRoomsRes, allContractsRes] = await Promise.all([
          apartmentService.getApartment(1).catch(() => null),
          documentService.getAllDocuments().catch(() => null),
          roomService.getRoomOverview(),
          contractService.getAllContracts(),
        ]);

        if (aptRes) setApartmentData(aptRes.data || aptRes);

        const docsList = Array.isArray(docsRes) ? docsRes : (docsRes?.$values || []);
        if (docsList.length > 0) setTemplateHtml(docsList[0].content || "");

        const allRooms = Array.isArray(allRoomsRes) ? allRoomsRes : (allRoomsRes?.$values || []);
        const targetRoom = allRooms.find((r) => String(r.roomNumber) === String(roomNumber));
        if (!targetRoom) { setIsLoading(false); return; }
        const rId = targetRoom.roomId || targetRoom.id;

        const contracts = Array.isArray(allContractsRes) ? allContractsRes : (allContractsRes?.$values || []);
        const roomContracts = contracts.filter((c) => c.roomId === rId);

        if (roomContracts.length === 0) { setIsLoading(false); return; }

        const refContract = contractId
          ? roomContracts.find((c) => (c.id || c.Id) === Number(contractId))
          : roomContracts.sort((a, b) => new Date(b.startDate || 0) - new Date(a.startDate || 0))[0];

        if (!refContract) { setIsLoading(false); return; }

        const tid = refContract.tenantId;

        const tenantContracts = roomContracts
          .filter((c) => c.tenantId === tid)
          .sort((a, b) => new Date(b.startDate || 0) - new Date(a.startDate || 0));

        setAllContracts(tenantContracts);

        const t = await tenantService.getTenant(tid);
        setTenantData(t.data || t);

        const activeContract = contractId
          ? tenantContracts.find((c) => (c.id || c.Id) === Number(contractId))
          : tenantContracts[0];

        setContract(activeContract || tenantContracts[0]);
        setSelectedContractId((activeContract || tenantContracts[0])?.id || (activeContract || tenantContracts[0])?.Id);
      } catch (err) {
        console.error("Error loading contract history:", err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [roomNumber, contractId]);

  const handleSelectContract = (c) => {
    setContract(c);
    setSelectedContractId(c.id || c.Id);
  };

  useEffect(() => {
    if (!templateHtml || !contract) return;

    let html = templateHtml;
    const contractDate = contract.startDate ? new Date(contract.startDate) : new Date();

    html = html.replace(/\{ชื่อหอพัก\}/g, insertBlackText(apartmentData?.name || "..........................."));
    html = html.replace(
      /\{โลโก้หอพัก\}/g,
      `<img src="${logoImg}" alt="Logo" style="width:40px !important;max-width:40px !important;height:auto;display:inline-block;" />`
    );

    const adminId = localStorage.getItem("adminId");
    const signatureHtml = adminId
      ? `<img src="/signatures/Admin${adminId}.png" alt="Signature" style="max-width:150px;height:auto;display:inline-block;" onerror="this.style.display='none'" />`
      : `......................................................`;

    html = html.replace(/\{ลายเซ็นผู้ดูแลระบบ\}/g, signatureHtml);
    html = html.replace(/\{ที่อยู่หอพัก\}/g, insertBlackText(apartmentData?.address || "..........................."));
    html = html.replace(/\{ชื่อผู้ดูแลระบบ\}/g, insertBlackText(adminName));
    html = html.replace(/\{\{admin_name\}\}/g, insertBlackText(adminName));

    html = html.replace(/\{วันที่ทำสัญญาแบบเต็ม\}/g,
      insertBlackText(`${contractDate.getDate()} ${getThaiMonthName(contractDate)} ${contractDate.getFullYear() + 543}`));
    html = html.replace(/\{วันทำสัญญา\}/g, insertBlackText(contractDate.getDate()));
    html = html.replace(/\{เดือนทำสัญญา\}/g, insertBlackText(getThaiMonthName(contractDate)));
    html = html.replace(/\{ปีทำสัญญา\}/g, insertBlackText(contractDate.getFullYear() + 543));

    const tName = tenantData
      ? `${tenantData.title || ""}${tenantData.firstName || tenantData.name || ""} ${tenantData.lastName || ""}`.trim()
      : "...........................";
    const tAddress = tenantData?.address || "...........................";
    const tPhone = tenantData?.phone || "...........................";
    const tNin = tenantData?.nin || "...........................";

    html = html.replace(/\{ชื่อผู้เช่า\}/g, insertBlackText(tName));
    html = html.replace(/\{ที่อยู่ผู้เช่า\}/g, insertBlackText(tAddress));
    html = html.replace(/\{หมายเลขบัตรประชาชนผู้เช่า\}/g, insertBlackText(tNin));
    html = html.replace(/\{เบอร์โทรผู้เช่า\}/g, insertBlackText(tPhone));
    html = html.replace(/\{ลายเซ็นผู้เช่า\}/g,
      `ลงชื่อ......................................................\n(${insertBlackText(tName)})`);

    html = html.replace(/\{หมายเลขห้องพัก\}/g, insertBlackText(roomNumber));
    html = html.replace(/\{\{room_number\}\}/g, insertBlackText(roomNumber));

    const sDate = contract.startDate ? toThaiDate(contract.startDate.split("T")[0]) : "...........................";
    const eDate = contract.endDate ? toThaiDate(contract.endDate.split("T")[0]) : "...........................";
    html = html.replace(/\{วันที่เริ่มสัญญา\}/g, insertBlackText(sDate));
    html = html.replace(/\{\{contract_startDate\}\}/g, insertBlackText(sDate));
    html = html.replace(/\{วันที่สิ้นสุดสัญญา\}/g, insertBlackText(eDate));
    html = html.replace(/\{\{contract_endDate\}\}/g, insertBlackText(eDate));

    const rent = Number(contract.monthlyRent || 0).toLocaleString();
    const deposit = Number(contract.deposit || 0).toLocaleString();
    html = html.replace(/\{ค่าเช่าห้อง\}/g, insertBlackText(rent));
    html = html.replace(/\{\{room_rent_amount\}\}/g, insertBlackText(rent));
    html = html.replace(/\{เงินประกันห้อง\}/g, insertBlackText(deposit));
    html = html.replace(/\{\{contract_deposit\}\}/g, insertBlackText(deposit));

    html = html.replace(/\{เลขมิเตอร์ไฟเข้าพัก\}/g, insertBlackText(contract.initialElectricUnit || "0"));
    html = html.replace(/\{เลขมิเตอร์น้ำเข้าพัก\}/g, insertBlackText(contract.initialWaterUnit || "0"));

    html = html.replace(/<mark[^>]*>/gi, "").replace(/<\/mark>/gi, "");

    setEditableHtml(html);
  }, [templateHtml, contract, tenantData, apartmentData, adminName, roomNumber]);

  const handlePrint = () => {
    const editorEl = quillRef.current?.getEditor()?.root;
    const finalHtml = editorEl ? editorEl.innerHTML : editableHtml;

    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>สัญญาเช่า_ห้อง_${roomNumber}</title>
          <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700&display=swap" rel="stylesheet">
          <style>
            *, *::before, *::after { box-sizing: border-box; }
            html, body {
              font-family: 'Sarabun', sans-serif;
              font-size: 16px; line-height: 1.5;
              color: #000; margin: 0; padding: 0;
              background: #fff !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            img[alt="Logo"] { width: 40px !important; height: auto !important; display: inline-block !important; }
            div, p, span { background: transparent !important; box-shadow: none !important; }
            @page { size: A4; margin: 15mm 20mm; }
            table { border-collapse: collapse !important; width: 100% !important; table-layout: fixed !important; margin: 10px 0 !important; }
            td, th { border: 1px solid #000 !important; padding: 6px 8px !important; vertical-align: top; word-wrap: break-word; }
            [style*="text-align: center"] { text-align: center !important; }
            [style*="text-align: right"] { text-align: right !important; }
            [style*="text-align: justify"] { text-align: justify !important; }
            p { margin: 0 !important; white-space: pre-wrap; }
            .ql-indent-1 { padding-left: 3em !important; }
            .ql-indent-2 { padding-left: 6em !important; }
            .ql-indent-3 { padding-left: 9em !important; }
            .ct-pagebreak { page-break-after: always !important; display: block; height: 0 !important; margin: 0 !important; }
            span[style*="color:#000000"] { font-weight: normal !important; }
          </style>
        </head>
        <body>
          ${finalHtml.replace(/<div class="ct-pagebreak"[^>]*>.*?<\/div>/gs, '<div class="ct-pagebreak"></div>')}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 800);
  };

  const handleSelectionChange = useCallback((range, source, editor) => {
    if (range) {
      lastSelection.current = range;
      const fmt = editor.getFormat(range);
      setCurrentSize(fmt.size || "16px");
    }
  }, []);

  const handleSizeChange = useCallback((newSize) => {
    setCurrentSize(newSize);
    const q = quillRef.current?.getEditor();
    if (!q) return;
    q.focus();
    const range = lastSelection.current;
    if (range) {
      if (range.length > 0) q.formatText(range.index, range.length, "size", newSize, "user");
      else q.format("size", newSize, "user");
    }
  }, []);

  const getStatusLabel = (status) => {
    const map = { Active: "ใช้งานอยู่", Expired: "สิ้นสุดแล้ว", Terminated: "ยกเลิกแล้ว", Reserved: "รอทำสัญญา", cancle: "ยกเลิก" };
    return map[status] || status;
  };
  const getStatusColor = (status) => {
    const map = { Active: "bg-green-100 text-green-700", Expired: "bg-gray-100 text-gray-500", Terminated: "bg-red-100 text-red-600", Reserved: "bg-orange-100 text-orange-600", cancle: "bg-red-100 text-red-500" };
    return map[status] || "bg-gray-100 text-gray-500";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-500 font-bold gap-2">
        <Loader2 size={20} className="animate-spin" /> กำลังโหลดข้อมูลสัญญา...
      </div>
    );
  }

  if (!contract) {
    return (
      <RoomHeader roomNumber={roomNumber}>
        <div className="py-24 flex flex-col items-center justify-center text-center bg-gray-50 rounded-3xl border border-gray-200 mt-4 max-w-4xl mx-auto">
          <FileText size={48} className="text-gray-300 mb-4" />
          <h3 className="text-xl font-black text-gray-500 mb-2">ไม่พบข้อมูลสัญญา</h3>
          <button onClick={() => navigate(-1)} className="mt-4 flex items-center gap-2 text-sm font-bold text-orange-500 hover:text-orange-600">
            <ChevronLeft size={16} /> กลับ
          </button>
        </div>
      </RoomHeader>
    );
  }

  const selectedId = selectedContractId || contract?.id || contract?.Id;
  
  // ✨ เช็คว่าสถานะไม่ใช่ Active หรือไม่ ถ้าใช่ให้ตั้งสถานะให้อ่านและพิมพ์ได้อย่างเดียว
  const isReadOnly = contract?.status !== "Active";

  return (
    <RoomHeader roomNumber={roomNumber}>
      <div className="max-w-5xl mx-auto mt-6 pb-12">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm font-bold text-gray-500 hover:text-gray-800 transition-colors"
          >
            <ChevronLeft size={18} /> กลับ
          </button>
          <h2 className="text-lg font-black text-gray-700 flex items-center gap-2">
            <FileText size={20} className="text-orange-400" />
            ประวัติสัญญาเช่า — ห้อง {roomNumber}
          </h2>
          <div className="w-16" />
        </div>

        {allContracts.length > 1 && (
          <div className="bg-white border border-gray-200 rounded-3xl shadow-sm p-5 mb-6">
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">เลือกฉบับสัญญา</p>
            <div className="flex flex-col gap-2">
              {allContracts.map((c, idx) => {
                const cId = c.id || c.Id;
                const isSelected = cId === selectedId;
                const label = idx === 0
                  ? "สัญญาฉบับปัจจุบัน"
                  : `สัญญาเก่า — เริ่ม ${c.startDate ? toThaiDate(c.startDate.split("T")[0]) : "-"}`;
                return (
                  <button
                    key={cId}
                    onClick={() => handleSelectContract(c)}
                    className={`flex items-center justify-between px-4 py-3 rounded-2xl border text-left transition-all font-bold text-sm ${
                      isSelected
                        ? "bg-orange-50 border-orange-300 text-orange-700"
                        : "bg-gray-50 border-gray-200 text-gray-600 hover:border-orange-200 hover:bg-orange-50/50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {isSelected && <CheckCircle2 size={16} className="text-orange-500 shrink-0" />}
                      <span>{label}</span>
                    </div>
                    <span className={`text-xs font-black px-2.5 py-1 rounded-full ${getStatusColor(c.status)}`}>
                      {getStatusLabel(c.status)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-3xl shadow-sm p-5 md:p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-black text-gray-700 flex items-center gap-2">
              <span className={`text-xs font-black px-2.5 py-1 rounded-full ${getStatusColor(contract.status)}`}>
                {getStatusLabel(contract.status)}
              </span>
              ข้อมูลสัญญา
            </h3>
            {/* 🛠️ ลบปุ่มพิมพ์ออกจากส่วนข้อมูลสรุปสัญญาตรงนี้ */}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <SummaryItem icon={<Calendar size={15}/>} label="วันเริ่มสัญญา" value={contract.startDate ? toThaiDate(contract.startDate.split("T")[0]) : "-"} />
            <SummaryItem icon={<Calendar size={15}/>} label="วันสิ้นสุด" value={contract.endDate ? toThaiDate(contract.endDate.split("T")[0]) : "-"} />
            <SummaryItem icon={<CreditCard size={15}/>} label="ค่าเช่า/เดือน" value={`${Number(contract.monthlyRent || 0).toLocaleString()} ฿`} />
            <SummaryItem icon={<CreditCard size={15}/>} label="เงินมัดจำ" value={`${Number(contract.deposit || 0).toLocaleString()} ฿`} />
          </div>
        </div>

        <div className="bg-gray-200 rounded-[32px] shadow-xl flex flex-col overflow-hidden" style={{ height: "85vh" }}>
          <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shrink-0">
            <p className="text-sm font-black text-gray-600 flex items-center gap-2">
              <FileText size={16} className="text-blue-500" />
              ดูตัวอย่างเอกสารสัญญา
              {/* ✨ เปลี่ยนป้ายกำกับตามสถานะการอ่านได้ของสัญญา */}
              {!isReadOnly ? (
                <span className="text-xs font-bold text-gray-400">(สามารถปรับแก้ก่อนพิมพ์ได้)</span>
              ) : (
                <span className="text-xs font-bold text-red-400">(หมดอายุแล้ว - อ่านและพิมพ์ได้อย่างเดียว)</span>
              )}
            </p>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-5 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-black shadow-md shadow-blue-100 transition-all active:scale-95"
            >
              <Download size={15} /> บันทึกเป็น PDF (พิมพ์)
            </button>
          </div>

          {/* ✨ ซ่อน Toolbar ถ้าเป็น ReadOnly */}
          {!isReadOnly && <HistoryToolbar currentSize={currentSize} onSizeChange={handleSizeChange} />}

          <div className="overflow-y-auto pt-4 pb-10 px-4 md:px-6 custom-scrollbar flex flex-col items-center flex-1">
            <div className="bg-white shadow-xl border border-gray-300 w-[210mm] min-h-[297mm] relative shrink-0">
              <ReactQuill
                ref={quillRef}
                theme="snow"
                value={editableHtml}
                onChange={setEditableHtml}
                onChangeSelection={handleSelectionChange}
                modules={QUILL_MODULES}
                formats={QUILL_FORMATS}
                className="contract-editor h-full"
                readOnly={isReadOnly} // ✨ บล็อคไม่ให้พิมพ์แก้ไขได้ถ้าหมดอายุ
              />
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:ital,wght@0,400;0,700;1,400;1,700&display=swap');
        .ql-editor [style*="text-align: center"] { text-align: center !important; }
        .ql-editor [style*="text-align: right"]  { text-align: right !important; }
        .ql-editor [style*="text-align: justify"]{ text-align: justify !important; }
        .ql-editor [style*="font-size: 10px"] { font-size: 10px !important; }
        .ql-editor [style*="font-size: 12px"] { font-size: 12px !important; }
        .ql-editor [style*="font-size: 14px"] { font-size: 14px !important; }
        .ql-editor [style*="font-size: 16px"] { font-size: 16px !important; }
        .ql-editor [style*="font-size: 18px"] { font-size: 18px !important; }
        .ql-editor [style*="font-size: 20px"] { font-size: 20px !important; }
        .ql-editor [style*="font-size: 24px"] { font-size: 24px !important; }
        .ql-editor [style*="font-size: 28px"] { font-size: 28px !important; }
        .ql-editor [style*="font-size: 32px"] { font-size: 32px !important; }
        .ql-editor img { display: inline-block; vertical-align: middle; }
        .ql-editor img[alt="Logo"] { width: 40px !important; height: auto !important; }
        .ql-editor table, .contract-editor table { border: 1px solid #000 !important; border-collapse: collapse !important; width: 100% !important; table-layout: fixed !important; }
        .ql-editor table td, .ql-editor table th, .contract-editor table td, .contract-editor table th { border: 1px solid #000 !important; }
        .ql-editor p, .ql-editor li { white-space: pre-wrap !important; }
        .ql-indent-1 { padding-left: 3em !important; }
        .ql-indent-2 { padding-left: 6em !important; }
        .ql-indent-3 { padding-left: 9em !important; }
        .contract-editor .ql-editor, .contract-editor .ql-editor * { font-family: 'Sarabun', sans-serif !important; }
        .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        .contract-editor .ql-toolbar.ql-snow { display: none !important; }
        .contract-editor .ql-container.ql-snow { border: none !important; }
        .contract-editor .ql-editor {
          padding: 15mm 20mm !important;
          font-family: 'Sarabun', sans-serif !important;
          font-size: 16px; line-height: 1.5; color: #000;
          caret-color: #000 !important; min-height: 297mm;
          background-image: linear-gradient(to bottom, transparent 267mm, #e2e8f0 267mm, #e2e8f0 268mm, transparent 268mm);
          background-size: 100% 297mm;
        }
        .contract-editor .ql-editor p { margin-bottom: 0 !important; padding-bottom: 0 !important; }
        .contract-editor .ct-pagebreak { color: transparent; border-bottom: 2px dashed #cbd5e1; margin: 20px 0; padding: 4px 0; display: block; }
        .ql-editor span[style*="color:#000000"] { font-weight: normal !important; }
        .tbtn {
          width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;
          border-radius: 6px; cursor: pointer; color: #4b5563; border: 1px solid transparent;
          transition: all 0.2s; background: transparent;
        }
        .tbtn:hover { background: #f3f4f6; border-color: #d1d5db; }
        #ql-history-toolbar .ql-active { color: #ea580c !important; background: #fff7ed !important; border-color: #ffedd5 !important; }
      `}</style>
    </RoomHeader>
  );
};

const SummaryItem = ({ icon, label, value }) => (
  <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-2xl border border-gray-100">
    <div className="text-orange-400 mt-0.5 shrink-0">{icon}</div>
    <div>
      <p className="text-[11px] font-bold text-gray-400">{label}</p>
      <p className="text-sm font-black text-gray-800 mt-0.5">{value}</p>
    </div>
  </div>
);

export default RoomContractHistory;