import React, { useState, useRef, useEffect, useCallback, memo } from "react";
import { useNavigate } from "react-router-dom";
import ReactQuill, { Quill } from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { ExitButton, ConfirmModal } from "../components/ActionButtons";
import {
  CheckCircle2, Download, Plus, Pencil, Trash2, Loader2,
  FileText, X, AlertCircle, LayoutGrid, Save, Scissors,
  Eye, EyeOff, Search, ChevronLeft, ChevronRight, Check,
  Undo, Redo, Printer, Image as ImageIcon, Rows, Columns, Lock
} from "lucide-react";
import { documentService } from "../api/DocumentApi";
import { adminService } from "../api/AdminApi";
import logoImg from "../assets/logo.png";

// ✨ นำเข้า Template บิลทั้ง 2 ตัว
import BillMonthlyPrintTemplate from "../components/BillMonthlyPrintTemplate";
import BillSummaryPrintTemplate from "../components/BillSummaryPrintTemplate";

// ─── 🌟 1. ตั้งค่า Quill Formats แบบ Native ─────────────────────────

const Parchment = Quill.import('parchment');

// ✅ บังคับให้ขนาดเป็น px ตรงๆ
const SizeStyle = Quill.import('attributors/style/size');
SizeStyle.whitelist = ["10px", "12px", "14px", "16px", "18px", "20px", "24px", "28px", "32px"];
Quill.register(SizeStyle, true);

if (Parchment) {
  const StyleAttributor = Parchment.StyleAttributor || Parchment.Attributor?.Style;
  if (StyleAttributor) {
    Quill.register({'formats/align': new StyleAttributor('align', 'text-align', { scope: Parchment.Scope.BLOCK, whitelist: ['center', 'right', 'justify'] })}, true);
    Quill.register({'formats/width': new StyleAttributor('width', 'width', { scope: Parchment.Scope.ANY })}, true);
    Quill.register({'formats/min-width': new StyleAttributor('min-width', 'min-width', { scope: Parchment.Scope.ANY })}, true);
    Quill.register({'formats/max-width': new StyleAttributor('max-width', 'max-width', { scope: Parchment.Scope.ANY })}, true);
  }
}

const toggleInlineFormat = (quill, format) => {
  const range = quill.getSelection(true); 
  if (!range) return;
  const current = quill.getFormat(range);
  quill.format(format, !current[format], 'user');
};

const QUILL_MODULES = { 
  toolbar: { 
    container: "#ql-toolbar-fixed",
    handlers: {
      bold: function() { toggleInlineFormat(this.quill, "bold"); },
      italic: function() { toggleInlineFormat(this.quill, "italic"); },
      underline: function() { toggleInlineFormat(this.quill, "underline"); },
      strike: function() { toggleInlineFormat(this.quill, "strike"); },
      indent: function(value) {
        const range = this.quill.getSelection();
        if (range) this.quill.format('indent', value, 'user');
      },
      undo: function() { this.quill.history.undo(); },
      redo: function() { this.quill.history.redo(); }
    }
  },
  table: true, 
  history: { delay: 500, maxStack: 100, userOnly: true },
  clipboard: { matchVisual: false }, 
  keyboard: {
    bindings: {
      tab: {
        key: 9, 
        handler: function(range, context) { 
          this.quill.insertText(range.index, '\u00A0\u00A0\u00A0\u00A0', 'user'); 
          this.quill.setSelection(range.index + 4, 'user');
          return false; 
        },
      }
    },
  },
};

const QUILL_FORMATS = [
  "size", "bold", "italic", "underline", "strike",
  "color", "background", "list", "align", "indent",
  "table", "width", "min-width", "max-width", "image"
];

// ─── Variables & Mock Data ───────────────────────────────────────────────────
const getAdminId = () => { const v = localStorage.getItem("adminId"); return v ? Number(v) : null; };

const VAR_CATS = [
  { label: "🏢 หอพัก & ผู้ดูแล", vars: [["{โลโก้หอพัก}", "รูปโลโก้"], ["{ชื่อหอพัก}", "ชื่อหอพัก"], ["{ที่อยู่หอพัก}", "ที่อยู่หอพัก"], ["{ชื่อผู้ดูแลระบบ}", "ชื่อผู้ดูแล"], ["{ลายเซ็นผู้ดูแลระบบ}", "รูปลายเซ็น"], ["{วันที่ทำสัญญาแบบเต็ม}", "เช่น 1 มกราคม 2569"]] },
  { label: "👤 ผู้เช่า", vars: [["{ชื่อผู้เช่า}", "ชื่อ-นามสกุล"], ["{ที่อยู่ผู้เช่า}", "ที่อยู่ตามบัตร"], ["{หมายเลขบัตรประชาชนผู้เช่า}", "เลขบัตร ปชช."], ["{เบอร์โทรผู้เช่า}", "เบอร์โทร"], ["{ลายเซ็นผู้เช่า}", "บรรทัดลายเซ็น"]] },
  { label: "🚪 ห้องพัก & สัญญา", vars: [["{หมายเลขห้องพัก}", "เลขห้อง"], ["{หมายเลขชั้นของห้องพัก}", "ชั้น"], ["{ระยะเวลาสัญญา}", "ระยะเวลา"], ["{วันที่เริ่มสัญญา}", "วันเริ่ม"], ["{วันที่สิ้นสุดสัญญา}", "วันสิ้นสุด"]] },
  { label: "💰 การเงิน & มิเตอร์", vars: [["{เงินประกันห้อง}", "มัดจำ"], ["{ค่าเช่าห้อง}", "ค่าเช่า/เดือน"], ["{เลขมิเตอร์ไฟเข้าพัก}", "ยูนิตไฟ"], ["{เลขมิเตอร์น้ำเข้าพัก}", "ยูนิตน้ำ"]] }
];

const MONTHS = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];

// ✨ เอกสารพิเศษ (อ่านได้อย่างเดียว)
const SPECIAL_DOCS = [
  { id: 'bill_monthly', name: 'ใบแจ้งหนี้ / ใบเสร็จรับเงิน (บิลรายเดือน)' },
  { id: 'bill_summary', name: 'ใบสรุปยอดเรียกเก็บประจำเดือน' }
];

// ข้อมูลจำลองสำหรับแสดงตัวอย่างบิลให้สวยงาม
const mockBillItems = [
  { id: 1, type: 'rent', label: 'ค่าเช่าห้อง', amount: 4500, detail: '' },
  { id: 2, type: 'electric', label: 'ค่าไฟฟ้า', amount: 350, detail: '1200 - 1250 = 50 * 7' },
  { id: 3, type: 'water', label: 'ค่าน้ำประปา', amount: 150, detail: '' },
];

const mockSummaryRooms = [
  { roomNumber: '101', tenantFirstName: 'สมชาย ใจดี', rent: 4500, water: 150, electric: 350, other: 0, discount: 0, total: 5000, hasBill: true },
  { roomNumber: '102', tenantFirstName: 'สมหญิง รักดี', rent: 5000, water: 100, electric: 400, other: 0, discount: 0, total: 5500, hasBill: true },
  { roomNumber: '103', tenantFirstName: 'มานะ อดทน', rent: 4500, water: 150, electric: 200, other: 100, discount: 0, total: 4950, hasBill: true },
];

const renderPreview = (html, adminName, adminId) => {
  if (!html) return "";
  const d = new Date();
  const map = {
    "{ชื่อหอพัก}": "หอพักสุขสันต์", "{ที่อยู่หอพัก}": "123 ถ.สุขุมวิท กรุงเทพฯ 10110", "{ชื่อผู้ดูแลระบบ}": adminName,
    "{วันที่ทำสัญญาแบบเต็ม}": `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear() + 543}`,
    "{ชื่อผู้เช่า}": "นาย สมชาย ใจดี", "{ที่อยู่ผู้เช่า}": "456 ถ.พหลโยธิน เชียงใหม่ 50000", "{หมายเลขบัตรประชาชนผู้เช่า}": "1-2345-67890-12-3",
    "{เบอร์โทรผู้เช่า}": "081-234-5678", "{ลายเซ็นผู้เช่า}": "ลงชื่อ......................................................\n(นาย สมชาย ใจดี)",
    "{หมายเลขห้องพัก}": "101", "{หมายเลขชั้นของห้องพัก}": "1", "{ระยะเวลาสัญญา}": "1 ปี",
    "{วันที่เริ่มสัญญา}": "1 เมษายน 2569", "{วันที่สิ้นสุดสัญญา}": "31 มีนาคม 2570",
    "{เงินประกันห้อง}": "5,000", "{ค่าเช่าห้อง}": "4,500", "{เลขมิเตอร์ไฟเข้าพัก}": "1,250", "{เลขมิเตอร์น้ำเข้าพัก}": "320",
  };
  let finalHtml = html;
  Object.keys(map).forEach(key => {
      const regex = new RegExp(key, 'g');
      finalHtml = finalHtml.replace(regex, `<span style="color:#000000; font-weight:normal;">${map[key]}</span>`);
  });
  finalHtml = finalHtml.replace(
    /{โลโก้หอพัก}/g, 
    `<img src="${logoImg}" alt="Logo" style="width: 40px; max-width: 60px; height: auto; display: inline-block;" />`
  );
  const signatureHtml = adminId 
    ? `<img src="/signatures/Admin${adminId}.png" alt="Signature" style="max-width: 150px; height: auto; display: inline-block;" onerror="this.style.display='none'" />`
    : `......................................................`;
    
  finalHtml = finalHtml.replace(/{ลายเซ็นผู้ดูแลระบบ}/g, signatureHtml);

  return finalHtml.replace(/<mark[^>]*>/gi, "").replace(/<\/mark>/gi, "");
};

/* ─── Components ─────────────────────────────────────────────────────────────── */

const EditorToolbar = memo(({ currentSize, onSizeChange, onInsertImage, onShowTablePicker, onAddRow, onAddCol, onDeleteTable, onInsertPageBreak }) => {
  const SIZES = ["10px", "12px", "14px", "16px", "18px", "20px", "24px", "28px", "32px"];

  return (
    <div id="ql-toolbar-fixed" className="flex flex-wrap items-center gap-1.5 px-4 py-2 bg-white border-b border-gray-200 justify-center shrink-0 shadow-sm relative z-40">
      <button className="ql-undo tbtn" title="ย้อนกลับ"><Undo size={14}/></button>
      <button className="ql-redo tbtn" title="ทำซ้ำ"><Redo size={14}/></button>
      <span className="w-px h-6 bg-gray-300 mx-1"/>

      <div className="relative group flex items-center h-8 z-50">
        <div className="flex items-center justify-between w-20 px-2 h-full rounded border border-gray-300 bg-white cursor-pointer group-hover:border-orange-400 transition-colors">
          <span className="text-xs font-bold text-gray-700">{currentSize || '16px'}</span>
          <span className="text-[8px] text-gray-400">▼</span>
        </div>
        <div className="absolute top-full left-0 w-full h-3 bg-transparent"></div>
        <div className="absolute top-[calc(100%+4px)] left-0 w-20 bg-white border border-gray-200 shadow-xl rounded-lg py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
          {SIZES.map(s => (
            <div key={s} onMouseDown={(e) => { e.preventDefault(); onSizeChange(s); }} className="px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-orange-50 hover:text-orange-600 cursor-pointer transition-colors">
              {s}
            </div>
          ))}
        </div>
      </div>

      <span className="w-px h-6 bg-gray-300 mx-1"/>
      <button className="ql-bold tbtn font-black text-sm">B</button>
      <button className="ql-italic tbtn italic text-sm">I</button>
      <button className="ql-underline tbtn underline text-sm">U</button>
      <span className="w-px h-6 bg-gray-300 mx-1"/>
      
      <button className="ql-align tbtn" value="" title="ชิดซ้าย"><svg viewBox="0 0 18 18" width="14" height="14"><line x1="3" y1="4" x2="15" y2="4" stroke="currentColor" strokeWidth="2"/><line x1="3" y1="8" x2="11" y2="8" stroke="currentColor" strokeWidth="2"/><line x1="3" y1="12" x2="15" y2="12" stroke="currentColor" strokeWidth="2"/></svg></button>
      <button className="ql-align tbtn" value="center" title="กึ่งกลาง"><svg viewBox="0 0 18 18" width="14" height="14"><line x1="3" y1="4" x2="15" y2="4" stroke="currentColor" strokeWidth="2"/><line x1="5" y1="8" x2="13" y2="8" stroke="currentColor" strokeWidth="2"/><line x1="3" y1="12" x2="15" y2="12" stroke="currentColor" strokeWidth="2"/></svg></button>
      <button className="ql-align tbtn" value="right" title="ชิดขวา"><svg viewBox="0 0 18 18" width="14" height="14"><line x1="3" y1="4" x2="15" y2="4" stroke="currentColor" strokeWidth="2"/><line x1="7" y1="8" x2="15" y2="8" stroke="currentColor" strokeWidth="2"/><line x1="3" y1="12" x2="15" y2="12" stroke="currentColor" strokeWidth="2"/></svg></button>
      <button className="ql-align tbtn" value="justify" title="กระจายเท่ากัน"><svg viewBox="0 0 18 18" width="14" height="14"><line x1="3" y1="4" x2="15" y2="4" stroke="currentColor" strokeWidth="2"/><line x1="3" y1="8" x2="15" y2="8" stroke="currentColor" strokeWidth="2"/><line x1="3" y1="12" x2="15" y2="12" stroke="currentColor" strokeWidth="2"/></svg></button>
      <span className="w-px h-6 bg-gray-300 mx-1"/>
      
      <button className="ql-indent tbtn" value="+1" title="เพิ่ม indent"><svg viewBox="0 0 18 18" width="14" height="14"><polyline points="3,6 7,9 3,12" stroke="currentColor" strokeWidth="1.5" fill="none"/><line x1="7" y1="4" x2="15" y2="4" stroke="currentColor" strokeWidth="1.5"/><line x1="7" y1="9" x2="15" y2="9" stroke="currentColor" strokeWidth="1.5"/><line x1="7" y1="14" x2="15" y2="14" stroke="currentColor" strokeWidth="1.5"/></svg></button>
      <button className="ql-indent tbtn" value="-1" title="ลด indent"><svg viewBox="0 0 18 18" width="14" height="14"><polyline points="7,6 3,9 7,12" stroke="currentColor" strokeWidth="1.5" fill="none"/><line x1="3" y1="4" x2="15" y2="4" stroke="currentColor" strokeWidth="1.5"/><line x1="3" y1="9" x2="15" y2="9" stroke="currentColor" strokeWidth="1.5"/><line x1="3" y1="14" x2="15" y2="14" stroke="currentColor" strokeWidth="1.5"/></svg></button>
      <span className="w-px h-6 bg-gray-300 mx-1"/>
      
      <button onMouseDown={e => { e.preventDefault(); onInsertImage(); }} className="flex items-center gap-1 px-2 h-8 rounded text-xs font-bold border border-gray-300 bg-white hover:bg-gray-100 transition-all text-gray-700" title="แทรกรูปภาพ"><ImageIcon size={14}/></button>
      
      <button onMouseDown={e => { e.preventDefault(); onShowTablePicker(); }} className="flex items-center gap-1 px-2 h-8 rounded text-xs font-bold border border-gray-300 bg-white hover:bg-gray-100 transition-all text-gray-700" title="สร้างตารางแบบลากเมาส์"><LayoutGrid size={14}/></button>
      
      <span className="w-px h-6 bg-gray-300 mx-1"/>
      
      <button onMouseDown={e => { e.preventDefault(); onAddRow(); }} className="flex items-center gap-1 px-2 h-8 rounded text-xs font-bold border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all" title="แทรกแถวลงด้านล่าง"><Rows size={14}/></button>
      <button onMouseDown={e => { e.preventDefault(); onAddCol(); }} className="flex items-center gap-1 px-2 h-8 rounded text-xs font-bold border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all" title="แทรกคอลัมน์ไปทางขวา"><Columns size={14}/></button>
      <button onMouseDown={e => { e.preventDefault(); onDeleteTable(); }} className="flex items-center gap-1 px-2 h-8 rounded text-xs font-bold border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-all" title="ลบตาราง"><Trash2 size={14}/></button>

      <span className="w-px h-6 bg-gray-300 mx-1"/>
      <button onMouseDown={e => { e.preventDefault(); onInsertPageBreak(); }} className="flex items-center gap-1 px-3 h-8 rounded text-xs font-bold border border-gray-300 bg-gray-50 hover:bg-gray-200 transition-all" title="ตัดหน้า"><Scissors size={14}/></button>
    </div>
  );
}, (prev, next) => prev.currentSize === next.currentSize);

const Toast = memo(({ message, type = "success", onClose }) => {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[300] flex items-center gap-2.5 px-5 py-3 rounded-2xl shadow-xl font-bold text-sm whitespace-nowrap transition-all animate-slide-up ${type === "success" ? "bg-gray-900 text-white" : "bg-red-500 text-white"}`}>
      {type === "success" ? <CheckCircle2 size={16} className="text-green-400 shrink-0" /> : <AlertCircle size={16} className="shrink-0" />} {message}
    </div>
  );
});

const NameModal = memo(({ title, initial = "", onClose, onConfirm, loading }) => {
  const [name, setName] = useState(initial);
  const ok = () => name.trim() && onConfirm(name.trim());
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/30 backdrop-blur-sm p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden scale-in" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center px-6 py-4 bg-gray-50 border-b border-gray-100">
          <h3 className="text-base font-black text-gray-800">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full text-gray-500"><X size={16} strokeWidth={3} /></button>
        </div>
        <div className="p-6">
          <input autoFocus value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === "Enter" && ok()} placeholder="ชื่อเอกสาร..." className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#f3a638] outline-none font-bold text-gray-700 transition-all text-sm" />
        </div>
        <div className="px-6 pb-6 flex gap-2">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border-2 border-gray-100 font-bold text-gray-500 text-sm hover:bg-gray-50 transition-all">ยกเลิก</button>
          <button onClick={ok} disabled={!name.trim() || loading} className="flex-1 py-3 rounded-xl bg-[#f3a638] text-white font-black text-sm disabled:opacity-40 flex items-center justify-center gap-2 hover:bg-orange-500 transition-all shadow-md shadow-orange-100">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} บันทึก
          </button>
        </div>
      </div>
    </div>
  );
});

const TablePicker = memo(({ onClose, onInsert }) => {
  const MAX = 8;
  const [h, setH] = useState({ r: 0, c: 0 });
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/10 backdrop-blur-sm p-4 animate-fade-in" onMouseDown={onClose}>
      <div className="bg-white rounded-2xl shadow-xl p-4 border border-gray-100 scale-in" onMouseDown={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="font-black text-gray-800 text-sm">สร้างตาราง</p>
            <p className="text-[10px] font-bold text-blue-500 mt-0.5">{h.r > 0 && h.c > 0 ? `${h.r} แถว × ${h.c} คอลัมน์` : "ลากเมาส์เพื่อเลือกขนาด"}</p>
          </div>
        </div>
        <div className="grid gap-1 select-none bg-gray-50 p-2 rounded-xl" style={{ gridTemplateColumns: `repeat(${MAX},24px)` }} onMouseLeave={() => setH({ r: 0, c: 0 })}>
          {Array.from({ length: MAX * MAX }).map((_, i) => {
            const r = Math.floor(i / MAX) + 1, c = (i % MAX) + 1;
            const active = r <= h.r && c <= h.c;
            return <div key={i} onMouseEnter={() => setH({ r, c })} onMouseDown={() => h.r > 0 && h.c > 0 && onInsert(h.r, h.c)} className={`rounded cursor-pointer transition-all ${active ? "bg-blue-500" : "bg-white border border-gray-200"}`} style={{ width: 24, height: 24 }} />
          })}
        </div>
      </div>
    </div>
  );
});

const getActiveCell = () => {
  const selection = window.getSelection();
  if (selection.rangeCount > 0) {
    let node = selection.getRangeAt(0).startContainer;
    if (node.nodeType === 3) node = node.parentNode;
    return node.closest('td, th');
  }
  return null;
};

/* ─── Main Component ─────────────────────────────────────────────────────────── */

const ContractTemplate = () => {
  const navigate = useNavigate();
  const quillRef = useRef(null);
  const varsScrollRef = useRef(null);
  
  const lastSelection = useRef(null);
  const [currentSize, setCurrentSize] = useState("16px");

  const adminId = getAdminId();
  const [docs, setDocs] = useState([]);
  const [selId, setSelId] = useState(null);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [content, setContent] = useState("");
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(false);

  const [showTable, setShowTable] = useState(false);
  const [nameModal, setNameModal] = useState(null);
  const [nameLoading, setNameLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, setToast] = useState(null);
  const [adminName, setAdminName] = useState("ผู้ดูแลระบบ");
  const [sideSearch, setSideSearch] = useState("");
  const [activeVarCat, setActiveVarCat] = useState(0);

  // ✨ ตรวจสอบว่าเป็นเอกสารพิเศษหรือไม่
  const isSpecialDoc = selId === 'bill_monthly' || selId === 'bill_summary';
  const selDoc = docs.find(d => d.id === selId) ?? SPECIAL_DOCS.find(d => d.id === selId) ?? null;

  // Auto-save (ข้ามถ้าเป็นเอกสารพิเศษ)
  useEffect(() => {
    if (!autoSaveEnabled || !isDirty || !selDoc || isPreview || isSpecialDoc) return;
    const timer = setTimeout(() => {
      handleSave();
    }, 3000);
    return () => clearTimeout(timer);
  }, [content, isDirty, selDoc, isPreview, autoSaveEnabled, isSpecialDoc]);

  useEffect(() => {
    if (!selId || isPreview || isSpecialDoc) return;
    const timer = setTimeout(() => {
      const editor = quillRef.current?.getEditor();
      if (!editor) return;

      const qlContainer = editor.container;
      let activeImg = null;
      let resizerNode = null;

      const removeResizer = () => {
        if (resizerNode) { resizerNode.remove(); resizerNode = null; activeImg = null; }
      };

      const updateResizerPos = () => {
        if (!activeImg || !resizerNode) return;
        const cRect = qlContainer.getBoundingClientRect();
        const iRect = activeImg.getBoundingClientRect();
        resizerNode.style.left = (iRect.right - cRect.left - 6 + qlContainer.scrollLeft) + 'px';
        resizerNode.style.top = (iRect.bottom - cRect.top - 6 + qlContainer.scrollTop) + 'px';
      };

      const onMouseDownEditor = (e) => {
        if (e.target.tagName === 'IMG') {
          removeResizer();
          activeImg = e.target;
          
          resizerNode = document.createElement('div');
          resizerNode.className = 'custom-img-resizer';
          resizerNode.style.position = 'absolute';
          resizerNode.style.width = '14px';
          resizerNode.style.height = '14px';
          resizerNode.style.backgroundColor = '#ea580c';
          resizerNode.style.border = '2px solid white';
          resizerNode.style.borderRadius = '50%';
          resizerNode.style.cursor = 'se-resize';
          resizerNode.style.zIndex = '100';
          resizerNode.title = "ลากปรับขนาด";
          qlContainer.appendChild(resizerNode);
          updateResizerPos();

          let startX, startWidth;
          const onDrag = (ev) => {
            const newWidth = Math.max(50, startWidth + (ev.clientX - startX));
            activeImg.style.width = newWidth + 'px';
            activeImg.style.height = 'auto';
            updateResizerPos();
          };
          const onStopDrag = () => {
            document.removeEventListener('mousemove', onDrag);
            document.removeEventListener('mouseup', onStopDrag);
            setIsDirty(true);
            editor.update('user'); 
          };

          resizerNode.addEventListener('mousedown', (ev) => {
            ev.preventDefault(); ev.stopPropagation();
            startX = ev.clientX; startWidth = activeImg.offsetWidth;
            document.addEventListener('mousemove', onDrag);
            document.addEventListener('mouseup', onStopDrag);
          });
        } else if (resizerNode && !e.target.classList.contains('custom-img-resizer')) {
          removeResizer();
        }

        const td = e.target.closest("td, th");
        if (td) {
          const nearRight = Math.abs(e.clientX - td.getBoundingClientRect().right) <= 10;
          if (nearRight) {
            e.preventDefault();
            let startX = e.clientX;
            let startWidth = td.offsetWidth;
            document.body.style.cursor = "col-resize";
            
            const onTdDrag = (ev) => {
              const newW = Math.max(36, startWidth + ev.clientX - startX);
              td.style.width = `${newW}px`;
              td.style.minWidth = `${newW}px`;
              td.style.maxWidth = `${newW}px`;
            };
            const onTdStop = () => {
              document.body.style.cursor = "";
              document.removeEventListener('mousemove', onTdDrag);
              document.removeEventListener('mouseup', onTdStop);
              const cellBlot = Quill.find(td);
              if (cellBlot) {
                cellBlot.format('width', td.style.width);
                cellBlot.format('min-width', td.style.minWidth);
                cellBlot.format('max-width', td.style.maxWidth);
              }
              setIsDirty(true);
              editor.update('user');
            };
            document.addEventListener('mousemove', onTdDrag);
            document.addEventListener('mouseup', onTdStop);
          }
        }
      };

      const root = editor.root;
      root.addEventListener("mousedown", onMouseDownEditor);
      qlContainer.addEventListener("scroll", updateResizerPos);

      return () => {
        root.removeEventListener("mousedown", onMouseDownEditor);
        qlContainer.removeEventListener("scroll", updateResizerPos);
        removeResizer();
      };
    }, 500);
    return () => clearTimeout(timer);
  }, [selId, isPreview, isSpecialDoc]);

  const fetchAll = useCallback(async () => {
    setLoadingDocs(true);
    try {
      if (adminId) {
        const a = await adminService.getAdmin(adminId).catch(() => null);
        if (a) setAdminName(`${a.title ?? ""}${a.firstName ?? ""} ${a.lastName ?? ""}`.trim() || "ผู้ดูแลระบบ");
      }
      const raw = await documentService.getAllDocuments();
      const list = Array.isArray(raw) ? raw : (raw?.$values ?? []);
      setDocs(list);
      if (list.length > 0 && !selId) {
        setSelId(list[0].id);
        setContent(list[0].content ?? "");
        setIsDirty(false);
      }
    } catch { showToast("โหลดเอกสารไม่สำเร็จ", "error"); } 
    finally { setLoadingDocs(false); }
  }, [adminId, selId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const showToast = (msg, type = "success") => setToast({ message: msg, type });

  const selectDoc = useCallback((doc) => {
    setSelId(doc.id); 
    setContent(doc.content ?? ""); 
    setIsDirty(false); 
    setIsPreview(false);
  }, []);

  const handleSelectionChange = useCallback((range) => {
    if (range) {
      lastSelection.current = range;
      const q = quillRef.current?.getEditor();
      if(q) {
        const format = q.getFormat(range);
        if (format && format.size) setCurrentSize(format.size);
        else setCurrentSize("16px"); 
      }
    }
  }, []);

  const handleSizeChange = useCallback((newSize) => {
    setCurrentSize(newSize);
    const q = quillRef.current?.getEditor();
    if (q) {
      q.focus(); 
      if (lastSelection.current) {
        const range = lastSelection.current;
        if (range.length > 0) {
          q.formatText(range.index, range.length, 'size', newSize, 'user');
        } else {
          q.format('size', newSize, 'user');
        }
        setIsDirty(true);
      }
    }
  }, []);

  const insertVar = useCallback((key) => {
    const q = quillRef.current?.getEditor();
    if (!q) return;
    const range = lastSelection.current || q.getSelection(true);
    const i = range ? range.index : q.getLength() - 1;
    q.insertText(i, key, { color: "#ea580c", bold: false }, 'user');
    q.setSelection(i + key.length);
    setIsDirty(true);
  }, []);

  const handleInsertImage = useCallback(() => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();
    input.onchange = () => {
      const file = input.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const q = quillRef.current?.getEditor();
          if (!q) return;
          if (lastSelection.current) q.setSelection(lastSelection.current);
          const range = q.getSelection(true);
          const index = range ? range.index : 0;
          q.insertEmbed(index, 'image', e.target.result, 'user');
          q.setSelection(index + 1);
          setIsDirty(true);
        };
        reader.readAsDataURL(file);
      }
    };
  }, []);

  const insertTable = useCallback((rows, cols) => {
    setShowTable(false);
    const q = quillRef.current?.getEditor();
    if (!q) return;
    if (lastSelection.current) q.setSelection(lastSelection.current);
    const tableModule = q.getModule('table');
    tableModule.insertTable(rows, cols);
    setIsDirty(true);
  }, []);

  const handleAddRow = useCallback(() => {
    const q = quillRef.current?.getEditor();
    if (q) { q.getModule('table').insertRowBelow(); setIsDirty(true); }
  }, []);

  const handleAddCol = useCallback(() => {
    const q = quillRef.current?.getEditor();
    if (q) { q.getModule('table').insertColumnRight(); setIsDirty(true); }
  }, []);

  const handleDeleteTable = useCallback(() => {
    const q = quillRef.current?.getEditor();
    if (q) { q.getModule('table').deleteTable(); setIsDirty(true); }
  }, []);

  const insertPageBreak = useCallback(() => {
    const q = quillRef.current?.getEditor();
    if (!q) return;
    if (lastSelection.current) q.setSelection(lastSelection.current);
    const range = q.getSelection(true);
    const idx = range ? range.index : q.getLength() - 1;
    const html = `<div class="ct-pagebreak">✂ ตัดขึ้นหน้าใหม่ ✂</div><p><br></p>`;
    q.clipboard.dangerouslyPasteHTML(idx, html, 'user');
    setIsDirty(true);
  }, []);

  const handleCreate = async (name) => {
    if (!adminId) return showToast("ไม่พบ adminId กรุณา login ใหม่", "error");
    setNameLoading(true);
    try {
      const doc = await documentService.createDocument({ adminId, name, content: "<p><br></p>" });
      setNameModal(null); await fetchAll(); setSelId(doc.id); setContent(doc.content ?? ""); showToast(`สร้าง "${name}" แล้ว`);
    } catch { showToast("สร้างไม่สำเร็จ", "error"); } finally { setNameLoading(false); }
  };

  const handleRename = async (name) => {
    setNameLoading(true);
    try {
      await documentService.updateDocument(selDoc.id, { ...selDoc, name });
      setDocs(prev => prev.map(d => d.id === selDoc.id ? { ...d, name } : d));
      setNameModal(null); showToast("เปลี่ยนชื่อเรียบร้อย");
    } catch { showToast("เปลี่ยนชื่อไม่สำเร็จ", "error"); } finally { setNameLoading(false); }
  };

  const handleSave = async () => {
    const q = quillRef.current?.getEditor();
    if (!q || !selDoc || !isDirty || isSpecialDoc) return;

    setIsSaving(true);
    try {
      const html = q.root.innerHTML;
      await documentService.updateDocument(selDoc.id, { ...selDoc, content: html });
      setDocs(prev => prev.map(d => d.id === selDoc.id ? { ...d, content: html } : d));
      setContent(html);
      setIsDirty(false);
      showToast("บันทึกเรียบร้อย ✓");
    } catch { showToast("บันทึกไม่สำเร็จ", "error"); } finally { setIsSaving(false); }
  };

  const handleDelete = async () => {
    try {
      await documentService.deleteDocument(deleteTarget.id);
      const rest = docs.filter(d => d.id !== deleteTarget.id);
      setDocs(rest);
      if (selId === deleteTarget.id) {
        const next = rest[0] ?? null; setSelId(next?.id ?? null); setContent(next?.content ?? ""); setIsDirty(false);
      }
      setDeleteTarget(null); showToast("ลบเอกสารแล้ว");
    } catch { showToast("ลบไม่สำเร็จ", "error"); }
  };

  const scrollVars = (dir) => {
    if (varsScrollRef.current) {
      varsScrollRef.current.scrollBy({ left: dir === 'left' ? -200 : 200, behavior: 'smooth' });
    }
  };

  const handlePrintAndSavePDF = () => {
    const finalHtml = renderPreview(content, adminName, adminId);
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>${selDoc?.name || "Contract_Template"}</title>
          <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700&display=swap" rel="stylesheet">
          <style>
            *, *::before, *::after { box-sizing: border-box; }
            html, body {
              font-family: 'Sarabun', sans-serif; font-size: 16px; line-height: 1.5; color: #000;
              margin: 0; padding: 0; background: #fff !important;
            }
            @page { size: A4; margin: 15mm 20mm; }
            table { border-collapse: collapse !important; width: 100% !important; margin: 10px 0 !important; }
            td, th { border: 1px solid #000 !important; padding: 6px 8px !important; vertical-align: top; word-wrap: break-word; }
            img { max-width: 100%; height: auto; display: block; margin: 5px auto; }
            [style*="text-align: center"] { text-align: center !important; }
            [style*="text-align: right"] { text-align: right !important; }
            [style*="text-align: justify"] { text-align: justify !important; }
            p { margin: 0 !important; white-space: pre-wrap; }
            .ct-pagebreak { page-break-after: always !important; display: block; height: 0 !important; margin: 0 !important; padding: 0 !important; border: none !important; color: transparent !important; }
          </style>
        </head>
        <body>${finalHtml.replace(/<div class="ct-pagebreak"[^>]*>.*?<\/div>/gs, '<div class="ct-pagebreak"></div>')}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 800);
  };

  const filteredDocs = sideSearch ? docs.filter(d => d.name.toLowerCase().includes(sideSearch.toLowerCase())) : docs;
  const filteredSpecialDocs = sideSearch ? SPECIAL_DOCS.filter(d => d.name.toLowerCase().includes(sideSearch.toLowerCase())) : SPECIAL_DOCS;

  return (
    <>
      <div className="flex h-screen overflow-hidden bg-gray-100 font-sarabun">
  
<aside className="hidden md:flex w-[280px] shrink-0 flex-col bg-white border-r border-gray-200 z-20 shadow-sm">          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <div className="text-right">
              <h1 className="font-black text-gray-800 text-sm">เทมเพลตเอกสาร</h1>
              <p className="text-[10px] font-bold text-gray-400 mt-0.5">{docs.length + SPECIAL_DOCS.length} รายการ</p>
            </div>
          </div>
          
          <div className="px-4 py-4 space-y-3 border-b border-gray-50">
            <button onClick={() => setNameModal("create")} className="w-full py-2.5 rounded-xl bg-[#fff7ed] border border-[#ffedd5] text-[#ea580c] font-black text-sm hover:bg-orange-100 shadow-sm flex items-center justify-center gap-1.5 transition-all active:scale-95">
              <Plus size={16} strokeWidth={3} /> เพิ่ม Template ใหม่
            </button>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={sideSearch} onChange={e => setSideSearch(e.target.value)} placeholder="ค้นหาเอกสาร..." className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-gray-200 focus:border-gray-800 outline-none font-bold text-gray-700 bg-white transition-all" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
            {loadingDocs ? (
              <div className="flex flex-col items-center py-10 gap-2 text-gray-400"><Loader2 size={24} className="animate-spin text-gray-300" /></div>
            ) : (
              <>
                {/* ✨ รายการแบบฟอร์มพิเศษ (ดูได้อย่างเดียว) */}
                {filteredSpecialDocs.map(doc => {
                  const active = doc.id === selId;
                  return (
                    <div key={doc.id} onClick={() => selectDoc(doc)} className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all relative border-l-4 ${active ? "bg-blue-50 border-blue-400 shadow-sm" : "bg-transparent border-transparent hover:bg-gray-50"}`}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${active ? "bg-blue-100 text-blue-500" : "bg-gray-100 text-gray-400 group-hover:bg-white group-hover:text-gray-600"}`}>
                        <Lock size={14} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-xs font-black truncate ${active ? "text-blue-900" : "text-gray-600"}`}>{doc.name}</p>
                      </div>
                    </div>
                  );
                })}

                {filteredSpecialDocs.length > 0 && <div className="my-3 mx-2 border-b border-gray-100"></div>}

                {/* รายการเอกสารสัญญาปกติ */}
                {filteredDocs.map(doc => {
                  const active = doc.id === selId;
                  return (
                    <div key={doc.id} onClick={() => selectDoc(doc)} className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all relative border-l-4 ${active ? "bg-orange-50 border-orange-400 shadow-sm" : "bg-transparent border-transparent hover:bg-gray-50"}`}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${active ? "bg-orange-100 text-orange-500" : "bg-gray-100 text-gray-400 group-hover:bg-white group-hover:text-gray-600"}`}>
                        <FileText size={16} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-black truncate ${active ? "text-orange-900" : "text-gray-700"}`}>{doc.name}</p>
                      </div>
                      <div className={`flex gap-0.5 transition-opacity ${active ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                        <button onClick={e => { e.stopPropagation(); setSelId(doc.id); setNameModal("rename"); }} className={`p-1.5 rounded-lg transition-colors ${active ? "text-orange-500 hover:text-orange-600 hover:bg-orange-100" : "text-gray-400 hover:bg-gray-200"}`}><Pencil size={14} /></button>
                        <button onClick={e => { e.stopPropagation(); setDeleteTarget(doc); }} className={`p-1.5 rounded-lg transition-colors ${active ? "text-red-400 hover:text-red-600 hover:bg-red-50" : "text-gray-400 hover:bg-red-100 hover:text-red-500"}`}><Trash2 size={14} /></button>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </aside>

        <main className="flex-1 flex flex-col h-screen overflow-hidden relative z-10 bg-gray-100">
          {!selDoc ? (
            <>
            <ExitButton 
            onClick={() => navigate("/settings")} 
            className="absolute top-4 right-4 z-50" 
            />
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-gray-400">
              <FileText size={64} className="text-gray-300" />
              <p className="font-black text-xl text-gray-500">เลือก Template จากเมนูซ้ายมือ</p>
            </div>
              </>
          ) : (
            <>           
              <div className="bg-white px-6 py-4 flex items-center justify-between border-b border-gray-200 shrink-0 z-30 shadow-sm">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-black text-gray-800">{selDoc.name}</h2>
                  {!isSpecialDoc && isDirty && !isSaving && <span className="px-2 py-1 bg-amber-50 text-amber-600 text-[10px] font-bold rounded-md border border-amber-200">ยังไม่บันทึก</span>}
                </div>
                <div className="flex items-center gap-4">
                  {/* ✨ แถบเมนูด้านบน (ถ้าเป็นเอกสารพิเศษ ให้แสดงป้ายแจ้งเตือนแทนปุ่มแก้ไข) */}
                  {isSpecialDoc ? (
                    <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl border border-gray-200">
                       <Lock size={14} className="text-gray-500" />
                       <span className="text-xs font-bold text-gray-600">แบบฟอร์มระบบ (ดูตัวอย่างเท่านั้น)</span>
                    </div>
                  ) : (
                    <>                 
                      {!isPreview && (
                        <label className="flex items-center gap-2 cursor-pointer mr-2">
                          <span className="text-xs font-bold text-gray-500">Auto save</span>
                          <div className="relative">
                            <input type="checkbox" className="sr-only" checked={autoSaveEnabled} onChange={() => setAutoSaveEnabled(!autoSaveEnabled)} />
                            <div className={`block w-9 h-5 rounded-full transition-colors ${autoSaveEnabled ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                            <div className={`dot absolute left-1 top-1 bg-white w-3 h-3 rounded-full transition-transform ${autoSaveEnabled ? 'translate-x-4' : ''}`}></div>
                          </div>
                        </label>
                      )}

                      <button onClick={() => setIsPreview(!isPreview)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 font-bold text-sm transition-all ${isPreview ? "bg-blue-50 text-blue-600 border-blue-200 shadow-sm" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}`}>
                        {isPreview ? <EyeOff size={16} /> : <Eye size={16} />} {isPreview ? "กลับไปแก้ไข" : "ดูตัวอย่าง"}
                      </button>

                      {!isPreview && (
                        <button onClick={handleSave} disabled={!isDirty || isSaving} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#5cb85c] text-white font-black text-sm disabled:opacity-50 hover:bg-green-600 transition-all shadow-md shadow-green-100 active:scale-95">
                          {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} บันทึก
                        </button>
                      )}
                      
                      {isPreview && (
                        <button onClick={handlePrintAndSavePDF} className=" flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 text-white font-black text-sm hover:bg-blue-700 transition-all shadow-md active:scale-95">
                          <Printer size={16} /> พิมพ์ / ดาวน์โหลด PDF
                        </button>
                      )}
                    </>
                  )}
                  <ExitButton onClick={() => navigate("/settings")} className="shrink-0" />
                </div>
              </div>

              {/* Toolbar สำหรับเอกสารปกติ */}
              {!isPreview && !isSpecialDoc && (
                <div className="bg-white shrink-0 z-20 shadow-sm border-b border-gray-200 flex flex-col relative z-40">
                  <div className="flex items-center gap-3 px-4 py-2 bg-orange-50/30">
                    <select 
                      value={activeVarCat} onChange={e => setActiveVarCat(Number(e.target.value))} 
                      className="h-9 px-3 text-sm font-bold text-gray-700 bg-white border border-gray-300 rounded-lg outline-none cursor-pointer hover:border-orange-400 min-w-[150px] shrink-0"
                    >
                      {VAR_CATS.map((cat, i) => <option key={i} value={i}>{cat.label}</option>)}
                    </select>

                    <div className="flex-1 flex items-center relative overflow-hidden group">
                      <button onClick={() => scrollVars('left')} className="absolute left-0 z-10 p-1.5 bg-white shadow-md border border-gray-100 rounded-full text-gray-500 hover:text-orange-500 opacity-0 group-hover:opacity-100 transition-all"><ChevronLeft size={16}/></button>
                      <div ref={varsScrollRef} className="flex-1 flex overflow-x-auto gap-2 no-scrollbar px-6 scroll-smooth scroll-px-6 py-1">
                        {VAR_CATS[activeVarCat].vars.map(([k, desc]) => (
                          <button key={k} onMouseDown={e => { e.preventDefault(); insertVar(k); }} title={desc} className="px-3 py-1.5 shrink-0 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-600 hover:border-orange-400 hover:text-orange-600 shadow-sm transition-all active:scale-95">{k}</button>
                        ))}
                      </div>
                      <button onClick={() => scrollVars('right')} className="absolute right-0 z-10 p-1.5 bg-white shadow-md border border-gray-100 rounded-full text-gray-500 hover:text-orange-500 opacity-0 group-hover:opacity-100 transition-all"><ChevronRight size={16}/></button>
                    </div>
                  </div>

                  <EditorToolbar 
                    currentSize={currentSize} onSizeChange={handleSizeChange}
                    onInsertImage={handleInsertImage} onShowTablePicker={() => setShowTable(true)} 
                    onAddRow={handleAddRow} onAddCol={handleAddCol}
                    onDeleteTable={handleDeleteTable} onInsertPageBreak={insertPageBreak} 
                  />
                </div>
              )}

              {/* ✨ ส่วนแสดงผลหลัก (รวมเอกสารพิเศษ และ เอกสารปกติ) */}
              <div className={`flex-1 overflow-y-auto bg-gray-200 py-10 px-4 custom-scrollbar relative z-10 preview-special-doc ${isSpecialDoc ? "flex flex-col items-center" : ""}`}>
                
                {isSpecialDoc ? (
                  // ✅ แสดงเอกสารพิเศษ (นำ Template มาเรียกใช้ตรงๆ พร้อม Mock Data)
                  <>
                    {selId === 'bill_monthly' && (
                      <div className="shadow-2xl bg-white w-[210mm] h-[297mm] shrink-0 border border-gray-300">
                        <BillMonthlyPrintTemplate items={mockBillItems} roomNumber="101" total={5000} adminName={adminName} />
                      </div>
                    )}
                    {selId === 'bill_summary' && (
                      <div className="shadow-2xl bg-white w-[210mm] min-h-[297mm] shrink-0 border border-gray-300">
                        <BillSummaryPrintTemplate rooms={mockSummaryRooms} selectedDate={new Date().toISOString().slice(0, 7)} />
                      </div>
                    )}
                  </>
                ) : (
                  // ✅ แสดงเอกสารสัญญาแบบปกติ (แก้ไขได้ หรือดูพรีวิว)
                  <div id="pdf-print-area" className="bg-white shadow-2xl border border-gray-300 w-[210mm] min-h-[297mm] transition-all relative mx-auto">
                    {!isPreview ? (
                      <ReactQuill 
                        ref={quillRef} 
                        theme="snow" 
                        value={content} 
                        onChange={(v, d, s) => { if (s === 'user') { setContent(v); setIsDirty(true); } }} 
                        onChangeSelection={handleSelectionChange}
                        modules={QUILL_MODULES} 
                        formats={QUILL_FORMATS} 
                        placeholder="เริ่มพิมพ์เนื้อหาสัญญา หรือเลือกตัวแปรด้านบนมาวางได้เลย..."
                        className="contract-editor h-full" 
                      />
                    ) : (
                      <div className="contract-preview ql-editor" dangerouslySetInnerHTML={{ __html: renderPreview(content, adminName, adminId) }} />
                    )}
                  </div>
                )}
                
              </div>
            </>
          )}
        </main>
      </div>

      {nameModal && <NameModal title={nameModal === "rename" ? "เปลี่ยนชื่อ Template" : "เพิ่ม Template ใหม่"} initial={nameModal === "rename" ? selDoc?.name : ""} onClose={() => setNameModal(null)} onConfirm={nameModal === "rename" ? handleRename : handleCreate} loading={nameLoading} />}
      {showTable && <TablePicker onClose={() => setShowTable(false)} onInsert={insertTable} />}
      {deleteTarget && <ConfirmModal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="ยืนยันการลบ" description={`ต้องการลบ "${deleteTarget?.name}" ใช่หรือไม่?`} confirmText="ลบเอกสาร" cancelText="ยกเลิก" variant="danger" />}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)}/>}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:ital,wght@0,400;0,700;1,400;1,700&display=swap');
        .font-sarabun { font-family: 'Sarabun', sans-serif; }
        
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

        @keyframes slideUp { from { opacity: 0; transform: translate(-50%, 20px); } to { opacity: 1; transform: translate(-50%, 0); } }
        .animate-slide-up { animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .scale-in { animation: scaleIn 0.2s ease-out forwards; }

        /* บังคับ Override คลาสที่ซ่อนไว้ในตอนพริ้นต์ให้แสดงผลบนจอ */
        .preview-special-doc .hidden { display: block !important; }

        .ql-editor [style*="font-size: 10px"] { font-size: 10px !important; }
        .ql-editor [style*="font-size: 12px"] { font-size: 12px !important; }
        .ql-editor [style*="font-size: 14px"] { font-size: 14px !important; }
        .ql-editor [style*="font-size: 16px"] { font-size: 16px !important; }
        .ql-editor [style*="font-size: 18px"] { font-size: 18px !important; }
        .ql-editor [style*="font-size: 20px"] { font-size: 20px !important; }
        .ql-editor [style*="font-size: 24px"] { font-size: 24px !important; }
        .ql-editor [style*="font-size: 28px"] { font-size: 28px !important; }
        .ql-editor [style*="font-size: 32px"] { font-size: 32px !important; }

        .ql-editor [style*="text-align: center"] { text-align: center !important; }
        .ql-editor [style*="text-align: right"] { text-align: right !important; }
        .ql-editor [style*="text-align: justify"] { text-align: justify !important; }
        .ql-align-center, .ql-editor .ql-align-center { text-align: center !important; }
        .ql-align-right, .ql-editor .ql-align-right { text-align: right !important; }
        .ql-align-justify, .ql-editor .ql-align-justify { text-align: justify !important; }

        .tbtn { width:32px; height:32px; display:flex; align-items:center; justify-content:center; border-radius:6px; cursor:pointer; color: #4b5563; border: 1px solid transparent; transition: all 0.2s; background: transparent; }
        .tbtn:hover { background:#f3f4f6; border-color: #d1d5db;}
        #ql-toolbar-fixed .ql-active { color:#ea580c !important; background:#fff7ed !important; border-color: #ffedd5 !important; }

        .contract-editor .ql-toolbar.ql-snow { display:none !important; }
        .contract-editor .ql-container.ql-snow { border:none !important; }

        .contract-editor .ql-editor {
          padding: 15mm 20mm !important;
          font-family: 'Sarabun', sans-serif !important;
          font-size: 16px;
          line-height: 1.5;
          color: #000000;
          min-height: 297mm;
          caret-color: #000000 !important; 
          background-image: linear-gradient(to bottom, transparent 267mm, #e2e8f0 267mm, #e2e8f0 268mm, transparent 268mm);
          background-size: 100% 297mm;
        }

        .contract-editor .ql-editor p,
        .contract-editor .ql-editor h1,
        .contract-editor .ql-editor h2,
        .contract-editor .ql-editor h3 {
           margin-bottom: 0 !important;
           padding-bottom: 0 !important;
        }

        .ql-editor img { max-width: 100%; height: auto; display: inline-block; margin: 5px; }

        .ql-editor table, .contract-preview table {
          border: 1px solid #000000 !important;
          border-collapse: collapse !important;
          width: 100% !important;
          table-layout: fixed !important;
          margin: 15px 0 !important;
        }
        .ql-editor table tr, .ql-editor table td, .ql-editor table th,
        .contract-preview table tr, .contract-preview table td, .contract-preview table th {
          border: 1px solid #000000 !important;
        }
        .ql-editor td, .contract-preview td {
          word-wrap: break-word;
          overflow: hidden;
          padding: 8px !important;
        }

        .ql-editor p, .ql-editor li { white-space: pre-wrap !important; }
        .ql-editor { tab-size: 4; -moz-tab-size: 4; }

        .contract-preview { 
          padding: 15mm 20mm !important; font-family: 'Sarabun', sans-serif !important; 
          font-size: 16px; line-height: 1.5; color: #000000; width: 100%; height: 100%;
          overflow-wrap: break-word; word-wrap: break-word;
        }
        
        .ct-pagebreak {
          page-break-after: always; border-bottom: 2px dashed #94a3b8 !important;
          margin: 30px 0; padding: 5px 0; text-align: center; font-size: 11px; color: #64748b; font-weight: bold;
        }
        .contract-preview .ct-pagebreak { color: transparent; border-bottom: 2px dashed #e2e8f0 !important; }
      `}</style>
    </>
  );
};

export default ContractTemplate;