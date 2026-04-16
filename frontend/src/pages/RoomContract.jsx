import React, { useState, useEffect, useCallback, memo, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Calendar,
  CreditCard,
  Edit3,
  Save,
  Zap,
  Droplets,
  XCircle,
  FileText,
  FileSignature,
  Download,
  History,
  CheckCircle2,
  Clock,
  Printer,
  Eye,
  X,
  Loader2,
  Scissors,
  Undo,
  Redo,
} from "lucide-react";
import axios from "axios";
import ReactQuill, { Quill } from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

import RoomHeader from "../components/RoomHeader";
import { toThaiDate, DateInput } from "../components/DateController";
import { ExitButton, ConfirmModal } from "../components/ActionButtons";

// API Services
import { roomService } from "../api/RoomApi";
import { contractService } from "../api/ContractApi";
import { tenantService } from "../api/TenantApi";
import { constantService } from "../api/ConstantApi";
import { documentService } from "../api/DocumentApi";
import { apartmentService } from "../api/ApartmentApi";
import { adminService } from "../api/AdminApi";
import logoImg from "../assets/logo.png";

// ─── 🌟 ลงทะเบียน Quill Formats แบบ Native ─────────────────────────

const Parchment = Quill.import("parchment");

const SizeStyle = Quill.import("attributors/style/size");
SizeStyle.whitelist = [
  "10px",
  "12px",
  "14px",
  "16px",
  "18px",
  "20px",
  "24px",
  "28px",
  "32px",
];
Quill.register(SizeStyle, true);

if (Parchment) {
  const StyleAttributor =
    Parchment.StyleAttributor || Parchment.Attributor?.Style;
  if (StyleAttributor) {
    Quill.register(
      {
        "formats/align": new StyleAttributor("align", "text-align", {
          scope: Parchment.Scope.BLOCK,
          whitelist: ["center", "right", "justify"],
        }),
      },
      true,
    );
    Quill.register(
      {
        "formats/width": new StyleAttributor("width", "width", {
          scope: Parchment.Scope.ANY,
        }),
      },
      true,
    );
    Quill.register(
      {
        "formats/min-width": new StyleAttributor("min-width", "min-width", {
          scope: Parchment.Scope.ANY,
        }),
      },
      true,
    );
    Quill.register(
      {
        "formats/max-width": new StyleAttributor("max-width", "max-width", {
          scope: Parchment.Scope.ANY,
        }),
      },
      true,
    );
  }
}

const toggleInlineFormat = (quill, format) => {
  const range = quill.getSelection(true);
  if (!range) return;
  const current = quill.getFormat(range);
  quill.format(format, !current[format], "user");
};

const QUILL_MODULES = {
  toolbar: {
    container: "#ql-toolbar-fixed",
    handlers: {
      bold: function () {
        toggleInlineFormat(this.quill, "bold");
      },
      italic: function () {
        toggleInlineFormat(this.quill, "italic");
      },
      underline: function () {
        toggleInlineFormat(this.quill, "underline");
      },
      strike: function () {
        toggleInlineFormat(this.quill, "strike");
      },
      indent: function (value) {
        const range = this.quill.getSelection();
        if (range) this.quill.format("indent", value, "user");
      },
      undo: function () {
        this.quill.history.undo();
      },
      redo: function () {
        this.quill.history.redo();
      },
    },
  },
  history: { delay: 500, maxStack: 100, userOnly: true },
  clipboard: { matchVisual: false },
  keyboard: {
    bindings: {
      tab: {
        key: 9,
        handler: function (range) {
          this.quill.insertText(
            range.index,
            "\u00A0\u00A0\u00A0\u00A0",
            "user",
          );
          this.quill.setSelection(range.index + 4, "user");
          return false;
        },
      },
    },
  },
};

const QUILL_FORMATS = [
  "size",
  "bold",
  "italic",
  "underline",
  "strike",
  "color",
  "background",
  "list",
  "align",
  "indent",
  "table",
  "width",
  "min-width",
  "max-width",
  "image",
];

/* ── Helpers ────────────────────────────────────────────────────────── */
const parseDefaultRentFromNote = (note) => {
  if (!note) return null;
  const match = note.match(/\{ค่าเช่า:\s*([\d,]+)฿?\}/);
  return match ? Number(match[1].replace(/,/g, "")) : null;
};

const parseElecTag = (note) =>
  note?.match(/\{ใช้ไฟ:\s*([^}]+)\}/)?.[1]?.trim() ?? null;
const parseWaterTag = (note) =>
  note?.match(/\{ใช้น้ำ:\s*([^}]+)\}/)?.[1]?.trim() ?? null;
const parseContractElecRate = (note) =>
  note?.match(/\{ค่าไฟ:\s*([\d.]+)\s*฿/)?.[1] ?? null;
const parseContractWaterRate = (note) =>
  note?.match(/\{ค่าน้ำ:\s*([\d.]+)\s*฿/)?.[1] ?? null;

const cleanNoteForDisplay = (note) => {
  if (!note) return "";
  return note
    .replace(/\{ใช้ไฟ:[^}]+\}/g, "")
    .replace(/\{ใช้น้ำ:[^}]+\}/g, "")
    .replace(/\{ค่าไฟ:[^}]+\}/g, "")
    .replace(/\{ค่าน้ำ:[^}]+\}/g, "")
    .trim();
};

const getThaiMonthName = (date) => {
  if (!date) return "";
  const months = [
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
  return months[date.getMonth()];
};

/* ── Components ─────────────────────────────────────────────────────────────── */

// ✅ Toolbar เบื้องต้น (ไม่เอาเมนูรูป/สร้างตารางใหม่)
const EditorToolbar = memo(
  ({ currentSize, onSizeChange, onInsertPageBreak }) => {
    const SIZES = [
      "10px",
      "12px",
      "14px",
      "16px",
      "18px",
      "20px",
      "24px",
      "28px",
      "32px",
    ];

    return (
      <div
        id="ql-toolbar-fixed"
        className="flex flex-wrap items-center gap-1.5 px-4 py-2 bg-white border-b border-gray-200 justify-center shrink-0 shadow-sm relative z-40"
      >
        <button className="ql-undo tbtn" title="ย้อนกลับ">
          <Undo size={14} />
        </button>
        <button className="ql-redo tbtn" title="ทำซ้ำ">
          <Redo size={14} />
        </button>
        <span className="w-px h-6 bg-gray-300 mx-1" />

        {/* Custom Size Dropdown */}
        <div className="relative group flex items-center h-8 z-50">
          <div className="flex items-center justify-between w-20 px-2 h-full rounded border border-gray-300 bg-white cursor-pointer group-hover:border-orange-400 transition-colors">
            <span className="text-xs font-bold text-gray-700">
              {currentSize || "16px"}
            </span>
            <span className="text-[8px] text-gray-400">▼</span>
          </div>

          <div className="absolute top-full left-0 w-full h-3 bg-transparent"></div>

          <div className="absolute top-[calc(100%+4px)] left-0 w-20 bg-white border border-gray-200 shadow-xl rounded-lg py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
            {SIZES.map((s) => (
              <div
                key={s}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onSizeChange(s);
                }}
                className="px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-orange-50 hover:text-orange-600 cursor-pointer transition-colors"
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
          <svg viewBox="0 0 18 18" width="14" height="14">
            <line
              x1="3"
              y1="4"
              x2="15"
              y2="4"
              stroke="currentColor"
              strokeWidth="2"
            />
            <line
              x1="3"
              y1="8"
              x2="11"
              y2="8"
              stroke="currentColor"
              strokeWidth="2"
            />
            <line
              x1="3"
              y1="12"
              x2="15"
              y2="12"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
        </button>
        <button className="ql-align tbtn" value="center" title="กึ่งกลาง">
          <svg viewBox="0 0 18 18" width="14" height="14">
            <line
              x1="3"
              y1="4"
              x2="15"
              y2="4"
              stroke="currentColor"
              strokeWidth="2"
            />
            <line
              x1="5"
              y1="8"
              x2="13"
              y2="8"
              stroke="currentColor"
              strokeWidth="2"
            />
            <line
              x1="3"
              y1="12"
              x2="15"
              y2="12"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
        </button>
        <button className="ql-align tbtn" value="right" title="ชิดขวา">
          <svg viewBox="0 0 18 18" width="14" height="14">
            <line
              x1="3"
              y1="4"
              x2="15"
              y2="4"
              stroke="currentColor"
              strokeWidth="2"
            />
            <line
              x1="7"
              y1="8"
              x2="15"
              y2="8"
              stroke="currentColor"
              strokeWidth="2"
            />
            <line
              x1="3"
              y1="12"
              x2="15"
              y2="12"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
        </button>
        <button className="ql-align tbtn" value="justify" title="กระจายเท่ากัน">
          <svg viewBox="0 0 18 18" width="14" height="14">
            <line
              x1="3"
              y1="4"
              x2="15"
              y2="4"
              stroke="currentColor"
              strokeWidth="2"
            />
            <line
              x1="3"
              y1="8"
              x2="15"
              y2="8"
              stroke="currentColor"
              strokeWidth="2"
            />
            <line
              x1="3"
              y1="12"
              x2="15"
              y2="12"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
        </button>
        <span className="w-px h-6 bg-gray-300 mx-1" />

        <button className="ql-indent tbtn" value="+1" title="เพิ่ม indent">
          <svg viewBox="0 0 18 18" width="14" height="14">
            <polyline
              points="3,6 7,9 3,12"
              stroke="currentColor"
              strokeWidth="1.5"
              fill="none"
            />
            <line
              x1="7"
              y1="4"
              x2="15"
              y2="4"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <line
              x1="7"
              y1="9"
              x2="15"
              y2="9"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <line
              x1="7"
              y1="14"
              x2="15"
              y2="14"
              stroke="currentColor"
              strokeWidth="1.5"
            />
          </svg>
        </button>
        <button className="ql-indent tbtn" value="-1" title="ลด indent">
          <svg viewBox="0 0 18 18" width="14" height="14">
            <polyline
              points="7,6 3,9 7,12"
              stroke="currentColor"
              strokeWidth="1.5"
              fill="none"
            />
            <line
              x1="3"
              y1="4"
              x2="15"
              y2="4"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <line
              x1="3"
              y1="9"
              x2="15"
              y2="9"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <line
              x1="3"
              y1="14"
              x2="15"
              y2="14"
              stroke="currentColor"
              strokeWidth="1.5"
            />
          </svg>
        </button>
        <span className="w-px h-6 bg-gray-300 mx-1" />

        <button
          onMouseDown={(e) => {
            e.preventDefault();
            onInsertPageBreak();
          }}
          className="flex items-center gap-1 px-3 h-8 rounded text-xs font-bold border border-gray-300 bg-gray-50 hover:bg-gray-200 transition-all"
          title="ตัดหน้า"
        >
          <Scissors size={14} />
        </button>
      </div>
    );
  },
  (prev, next) => prev.currentSize === next.currentSize,
);

const Toast = memo(({ message, type = "success", onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div
      className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[300] flex items-center gap-2.5 px-5 py-3 rounded-2xl shadow-xl font-bold text-sm whitespace-nowrap transition-all animate-slide-up ${type === "success" ? "bg-gray-900 text-white" : "bg-red-500 text-white"}`}
    >
      {type === "success" ? (
        <CheckCircle2 size={16} className="text-green-400 shrink-0" />
      ) : (
        <span size={16} className="shrink-0">
          ⚠
        </span>
      )}{" "}
      {message}
    </div>
  );
});

/* ── Main Component ─────────────────────────────────────────────────────────── */
const RoomContract = () => {
  const { roomNumber } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const quillRef = useRef(null);

  const lastSelection = useRef(null);
  const [currentSize, setCurrentSize] = useState("16px");

  const [contract, setContract] = useState(null);
  const [historyContracts, setHistoryContracts] = useState([]);
  const [roomId, setRoomId] = useState(null);
  const [fullRoom, setFullRoom] = useState(null);
  const [rawRoomNote, setRawRoomNote] = useState("");
  const [defaultRentFromRoom, setDefaultRentFromRoom] = useState(null);

  const [isEditing, setIsEditing] = useState(false);
  const [isRenewing, setIsRenewing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [elecConst, setElecConst] = useState(null);
  const [waterConst, setWaterConst] = useState(null);
  const [elecMode, setElecMode] = useState("constant");
  const [waterMode, setWaterMode] = useState("constant");
  const [elecRate, setElecRate] = useState("");
  const [waterRate, setWaterRate] = useState("");

  const todayStr = new Date().toISOString().split("T")[0];

  const [formData, setFormData] = useState({
    startDate: todayStr,
    endDate: todayStr,
    monthlyRent: 0,
    deposit: 0,
    initialElectricUnit: 0,
    initialWaterUnit: 0,
    Note: "",
  });

  const [templateHtml, setTemplateHtml] = useState("");
  const [previewHtml, setPreviewHtml] = useState("");
  const [editableHtml, setEditableHtml] = useState("");
  const [apartmentData, setApartmentData] = useState(null);
  const [tenantData, setTenantData] = useState(null);
  const [adminName, setAdminName] = useState("ผู้ดูแลระบบ");

  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = useCallback(
    (message, type = "success") => setToast({ message, type }),
    [],
  );

  const fetchContract = async () => {
    setIsLoading(true);
    try {
      const adminId = localStorage.getItem("adminId");
      if (adminId) {
        adminService
          .getAdmin(adminId)
          .then((a) => {
            setAdminName(
              `${a.title ?? ""}${a.firstName ?? ""} ${a.lastName ?? ""}`.trim() ||
                "ผู้ดูแลระบบ",
            );
          })
          .catch(() => {});
      }

      const [constRes, aptRes, docsRes] = await Promise.all([
        constantService.getConstants().catch(() => []),
        apartmentService.getApartment(1).catch(() => null),
        documentService.getAllDocuments().catch(() => null),
      ]);

      const allConst = Array.isArray(constRes)
        ? constRes
        : constRes.$values || constRes.data || [];
      setElecConst(
        allConst.find(
          (c) =>
            c.subject?.toLowerCase().includes("electricity") ||
            c.subject?.includes("ไฟ"),
        ),
      );
      setWaterConst(
        allConst.find(
          (c) =>
            c.subject?.toLowerCase().includes("water") ||
            c.subject?.includes("น้ำ"),
        ),
      );

      if (aptRes) setApartmentData(aptRes.data || aptRes);

      const docsList = Array.isArray(docsRes)
        ? docsRes
        : docsRes?.$values || [];
      if (docsList.length > 0) {
        setTemplateHtml(docsList[0].content || "");
      }

      const allRooms = await roomService.getRoomOverview();
      const targetRoom = allRooms.find(
        (r) => String(r.roomNumber) === String(roomNumber),
      );
      if (!targetRoom) return setIsLoading(false);

      setFullRoom(targetRoom);
      const rId = targetRoom.roomId || targetRoom.id;
      setRoomId(rId);

      const note =
        targetRoom.note ?? targetRoom.Note ?? targetRoom.roomNote ?? "";
      setRawRoomNote(note);
      const defaultRent = parseDefaultRentFromNote(note);
      setDefaultRentFromRoom(defaultRent);

      const rElec = parseElecTag(note);
      const rWater = parseWaterTag(note);

      const allContracts = await contractService.getAllContracts();
      const roomContracts = allContracts.filter((c) => c.roomId === rId);

      const activeContract =
        roomContracts.find((c) => c.status === "Active") ||
        roomContracts.find((c) => c.status === "Reserved") ||
        roomContracts.find((c) => c.status === "Expired");

      let history = roomContracts
        .filter((c) => c.status !== "Active" && c.status !== "Reserved" && c.status !== "Expired") // ✨ เพิ่ม && c.status !== "Expired" ไม่ให้ไปซ้ำในประวัติ
        .sort(
          (a, b) => new Date(b.startDate || 0) - new Date(a.startDate || 0),
        );

      if (activeContract) {
        history = history.filter((c) => c.tenantId === activeContract.tenantId);
        setContract(activeContract);

        try {
          let tData = null;
          if (typeof tenantService.getTenant === "function") {
            tData = await tenantService.getTenant(activeContract.tenantId);
          } else {
            const res = await axios.get(
              `https://apartment-management-system-zllm.onrender.com/Tenants/${activeContract.tenantId}`,
            );
            tData = res;
          }
          setTenantData(tData.data || tData);
        } catch (e) {
          console.error("⚠️ ไม่สามารถดึงข้อมูลลูกค้าได้", e);
        }

        const rentValue = activeContract.monthlyRent || defaultRent || 0;
        const cNote =
          activeContract.Note ||
          activeContract.note ||
          activeContract.attachedFile ||
          "";

        setFormData({
          startDate: activeContract.startDate
            ? activeContract.startDate.split("T")[0]
            : "",
          endDate: activeContract.endDate
            ? activeContract.endDate.split("T")[0]
            : "",
          monthlyRent: rentValue,
          deposit: activeContract.deposit || 0,
          initialElectricUnit: activeContract.initialElectricUnit || 0,
          initialWaterUnit: activeContract.initialWaterUnit || 0,
          Note: cleanNoteForDisplay(cNote),
        });

        const cElec = parseContractElecRate(cNote);
        const cWater = parseContractWaterRate(cNote);

        if (cElec) {
          setElecMode("custom");
          setElecRate(cElec);
        } else {
          setElecMode("constant");
          setElecRate("");
        }

        if (cWater) {
          setWaterMode("custom");
          setWaterRate(cWater);
        } else {
          setWaterMode("constant");
          setWaterRate("");
        }

        if (location.state?.autoEdit || activeContract.status === "Reserved") {
          setIsEditing(true);
        }
      } else {
        const todayStr = new Date().toISOString().split("T")[0];
        setFormData((prev) => ({
          ...prev,
          monthlyRent: defaultRent || 0,
          startDate: todayStr,
          endDate: todayStr,
        }));
        setElecMode(rElec === "constant" ? "constant" : "custom");
        setWaterMode(rWater === "constant" ? "constant" : "custom");
      }

      setHistoryContracts(history);
    } catch (error) {
      console.error("Error fetching contract:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContract();
  }, [roomNumber]);

  useEffect(() => {
    if (!templateHtml) return;

    let html = templateHtml;
    const today = new Date();

    const insertBlackText = (text) =>
      `<span style="color:#000000; font-weight:normal;">${text}</span>`;

    html = html.replace(
      /\{ชื่อหอพัก\}/g,
      insertBlackText(apartmentData?.name || "..........................."),
    );
    html = html.replace(
      /\{โลโก้หอพัก\}/g,
      `<img src="${logoImg}" alt="Logo" style="width: 40px !important; max-width: 40px !important; height: auto; display: inline-block;" />`,
    );

    const currentAdminId = localStorage.getItem("adminId");
    const signatureHtml = currentAdminId
      ? `<img src="/signatures/Admin${currentAdminId}.png" alt="Signature" style="max-width: 150px; height: auto; display: inline-block;" onerror="this.style.display='none'" />`
      : `......................................................`;

    html = html.replace(/\{ลายเซ็นผู้ดูแลระบบ\}/g, signatureHtml);
    html = html.replace(
      /\{ที่อยู่หอพัก\}/g,
      insertBlackText(apartmentData?.address || "..........................."),
    );
    html = html.replace(/\{ชื่อผู้ดูแลระบบ\}/g, insertBlackText(adminName));
    html = html.replace(/\{\{admin_name\}\}/g, insertBlackText(adminName));

    html = html.replace(
      /\{วันที่ทำสัญญาแบบเต็ม\}/g,
      insertBlackText(
        `${today.getDate()} ${getThaiMonthName(today)} ${today.getFullYear() + 543}`,
      ),
    );
    html = html.replace(/\{วันทำสัญญา\}/g, insertBlackText(today.getDate()));
    html = html.replace(
      /\{เดือนทำสัญญา\}/g,
      insertBlackText(getThaiMonthName(today)),
    );
    html = html.replace(
      /\{ปีทำสัญญา\}/g,
      insertBlackText(today.getFullYear() + 543),
    );

    const tName = tenantData
      ? `${tenantData.title || tenantData.Title || ""}${tenantData.firstName || tenantData.FirstName || tenantData.name || ""} ${tenantData.lastName || tenantData.LastName || ""}`.trim()
      : "...........................";
    const tAddress =
      tenantData?.address ||
      tenantData?.Address ||
      "...........................";
    const tPhone =
      tenantData?.phone || tenantData?.Phone || "...........................";
    const tNin =
      tenantData?.nin || tenantData?.Nin || "...........................";

    html = html.replace(/\{ชื่อผู้เช่า\}/g, insertBlackText(tName));
    html = html.replace(/\{ที่อยู่ผู้เช่า\}/g, insertBlackText(tAddress));
    html = html.replace(
      /\{หมายเลขบัตรประชาชนผู้เช่า\}/g,
      insertBlackText(tNin),
    );
    html = html.replace(/\{เบอร์โทรผู้เช่า\}/g, insertBlackText(tPhone));
    html = html.replace(
      /\{ลายเซ็นผู้เช่า\}/g,
      `ลงชื่อ......................................................\n(${insertBlackText(tName)})`,
    );

    const rm = fullRoom?.roomNumber || roomNumber || "......";
    html = html.replace(/\{หมายเลขห้องพัก\}/g, insertBlackText(rm));
    html = html.replace(/\{\{room_number\}\}/g, insertBlackText(rm));
    html = html.replace(
      /\{หมายเลขชั้นของห้องพัก\}/g,
      insertBlackText(fullRoom?.roomFloor || "......"),
    );

    const sDate = formData.startDate
      ? toThaiDate(formData.startDate)
      : "...........................";
    const eDate = formData.endDate
      ? toThaiDate(formData.endDate)
      : "...........................";
    html = html.replace(/\{วันที่เริ่มสัญญา\}/g, insertBlackText(sDate));
    html = html.replace(/\{\{contract_startDate\}\}/g, insertBlackText(sDate));
    html = html.replace(/\{วันที่สิ้นสุดสัญญา\}/g, insertBlackText(eDate));
    html = html.replace(/\{\{contract_endDate\}\}/g, insertBlackText(eDate));

    const rent = Number(formData.monthlyRent || 0).toLocaleString();
    const deposit = Number(formData.deposit || 0).toLocaleString();
    html = html.replace(/\{ค่าเช่าห้อง\}/g, insertBlackText(rent));
    html = html.replace(/\{\{room_rent_amount\}\}/g, insertBlackText(rent));
    html = html.replace(/\{เงินประกันห้อง\}/g, insertBlackText(deposit));
    html = html.replace(/\{\{contract_deposit\}\}/g, insertBlackText(deposit));

    html = html.replace(
      /\{เลขมิเตอร์ไฟเข้าพัก\}/g,
      insertBlackText(formData.initialElectricUnit || "0"),
    );
    html = html.replace(
      /\{เลขมิเตอร์น้ำเข้าพัก\}/g,
      insertBlackText(formData.initialWaterUnit || "0"),
    );

    html = html.replace(/<mark[^>]*>/gi, "");
    html = html.replace(/<\/mark>/gi, "");

    setPreviewHtml(html);
  }, [
    templateHtml,
    formData,
    apartmentData,
    tenantData,
    fullRoom,
    adminName,
    roomNumber,
  ]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRenewClick = async () => {
    setIsRenewing(true);
    setIsEditing(true);
    try {
      const { data: meters } = await axios.get(
        "https://apartment-management-system-zllm.onrender.com/UtilityMeters",
      );
      const roomMeters = meters
        .filter((m) => m.roomId === roomId)
        .sort((a, b) => new Date(b.recordDate) - new Date(a.recordDate));

      const latestMeter = roomMeters[0];
      const renewRent = contract?.monthlyRent || defaultRentFromRoom || 0;
      const today = new Date().toISOString().split("T")[0];

      setFormData({
        startDate: today,
        endDate: today, // ✨ เปลี่ยนจาก "" เป็น today
        monthlyRent: renewRent,
        deposit: contract?.deposit || 0,
        initialElectricUnit: latestMeter
          ? latestMeter.electricityUnit
          : contract?.initialElectricUnit || 0,
        initialWaterUnit: latestMeter
          ? latestMeter.waterUnit
          : contract?.initialWaterUnit || 0,
        Note: cleanNoteForDisplay(contract?.Note || ""),
      });
    } catch (error) {
      console.error("Error fetching latest meters:", error);
      showToast("ไม่สามารถดึงข้อมูลมิเตอร์ล่าสุดได้", "error");
      const renewRent = contract?.monthlyRent || defaultRentFromRoom || 0;
      const todayFallback = new Date().toISOString().split("T")[0]; // ✨ เพิ่มบรรทัดนี้

      setFormData((prev) => ({
        ...prev,
        startDate: todayFallback, // ✨ เปลี่ยนเป็น todayFallback
        endDate: todayFallback, // ✨ เปลี่ยนจาก "" เป็น todayFallback
        monthlyRent: renewRent,
        Note: cleanNoteForDisplay(contract?.Note || ""),
      }));
    }
  };

  const handleSave = async () => {
    try {
      let finalContractNote = formData.Note || "";
      finalContractNote = finalContractNote
        .replace(/\{ค่าไฟ:[^}]+\}/g, "")
        .replace(/\{ค่าน้ำ:[^}]+\}/g, "")
        .trim();

      if (elecMode === "custom" && elecRate)
        finalContractNote += ` {ค่าไฟ: ${elecRate}฿/หน่วย}`;
      if (waterMode === "custom" && waterRate)
        finalContractNote += ` {ค่าน้ำ: ${waterRate}฿/หน่วย}`;
      finalContractNote = finalContractNote.trim();

      let finalRoomNote = rawRoomNote || "";
      finalRoomNote = finalRoomNote
        .replace(/\{ใช้ไฟ:[^}]+\}/g, "")
        .replace(/\{ใช้น้ำ:[^}]+\}/g, "")
        .trim();

      if (elecMode === "constant") finalRoomNote += ` {ใช้ไฟ: constant}`;
      if (waterMode === "constant") finalRoomNote += ` {ใช้น้ำ: constant}`;
      finalRoomNote = finalRoomNote.trim();

      if (fullRoom && finalRoomNote !== rawRoomNote) {
        await roomService.updateRoom(fullRoom.roomId || fullRoom.id, {
          id: fullRoom.roomId || fullRoom.id,
          number: String(fullRoom.roomNumber),
          building: fullRoom.roomBuilding || "",
          floor: String(fullRoom.roomFloor || "1"),
          status: fullRoom.roomStatus || "available",
          note: finalRoomNote.substring(0, 500),
        });
      }

      // 🌟 แก้ไข: บังคับให้เป็นตัวเลขเสมอ ถ้าเป็นค่าว่างหรือ null ให้เป็น 0
      const elecUnitVal = formData.initialElectricUnit ? Number(formData.initialElectricUnit) : 0;
      const waterUnitVal = formData.initialWaterUnit ? Number(formData.initialWaterUnit) : 0;

      if (isRenewing) {
        if (contract) {
          await contractService.putContract(contract.id, {
            ...contract,
            status: "Expired",
            finalElectricUnit: elecUnitVal,
            finalWaterUnit: waterUnitVal,
          });
        }
        const newContractPayload = {
          RoomId: roomId,
          TenantId: contract?.tenantId,
          Status: "Active",
          StartDate: formData.startDate || null,
          EndDate: formData.endDate || null,
          MonthlyRent: Number(formData.monthlyRent),
          Deposit: Number(formData.deposit),
          InitialElectricUnit: elecUnitVal, // ส่งเป็นตัวเลข
          InitialWaterUnit: waterUnitVal,   // ส่งเป็นตัวเลข
          Note: finalContractNote || null,
        };
        await contractService.postContract(newContractPayload);
        
        const today = new Date().toISOString().split("T")[0];
        const meterPayload = [
          {
            RoomId: roomId,
            RecordDate: today,
            ElectricityUnit: elecUnitVal,
            WaterUnit: waterUnitVal,
            Note: "* เริ่มสัญญาใหม่ (ต่อสัญญา)",
          },
        ];
        await axios.post(
          "https://apartment-management-system-zllm.onrender.com/UtilityMeters/bulk-upsert",
          meterPayload,
          {
            headers: { "Content-Type": "application/json" },
          }
        );
        showToast("ต่อสัญญาและบันทึกข้อมูลเรียบร้อยแล้ว!");
      } else {
        
        // สำหรับการสร้างมิเตอร์ครั้งแรก
        const isFirstTimeMeter =
          (contract?.initialElectricUnit == null && elecUnitVal !== null) ||
          (contract?.initialWaterUnit == null && waterUnitVal !== null);

        if (contract) {
          const updatedContract = {
            ...contract,
            status: contract.status === "Reserved" ? "Active" : contract.status,
            startDate: formData.startDate || null,
            endDate: formData.endDate || null,
            monthlyRent: Number(formData.monthlyRent),
            deposit: Number(formData.deposit),
            initialElectricUnit: elecUnitVal, // ส่งเป็นตัวเลข
            initialWaterUnit: waterUnitVal,   // ส่งเป็นตัวเลข
            Note: finalContractNote || null,
          };
          await contractService.putContract(contract.id, updatedContract);
        }

        if (isFirstTimeMeter) {
          const today = new Date().toISOString().split("T")[0];
          const meterPayload = [
            {
              RoomId: roomId,
              RecordDate: today,
              ElectricityUnit: elecUnitVal,
              WaterUnit: waterUnitVal,
              Note: "* เริ่มสัญญาใหม่",
            },
          ];
          await axios.post(
            "https://apartment-management-system-zllm.onrender.com/UtilityMeters/bulk-upsert",
            meterPayload,
            {
              headers: { "Content-Type": "application/json" },
            }
          );
        }
        showToast("บันทึกข้อมูลสัญญาสำเร็จ!");
      }

      setIsEditing(false);
      setIsRenewing(false);
      if (location.state?.autoEdit) {
        window.history.replaceState({}, document.title);
      }
      fetchContract();
    } catch (error) {
      console.error("Error saving contract:", error);
      showToast("เกิดข้อผิดพลาดในการบันทึก", "error");
    }
  };

  const handlePrintAndSavePDF = () => {
    const editorEl = quillRef.current?.getEditor()?.root;
    const finalHtml = editorEl ? editorEl.innerHTML : editableHtml;

    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>สัญญาเช่า_ห้อง_${roomNumber}</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700&display=swap" rel="stylesheet">
          <style>
            *, *::before, *::after { box-sizing: border-box; }
            html, body {
              font-family: 'Sarabun', sans-serif;
              font-size: 16px;
              line-height: 1.5;
              color: #000000;
              margin: 0;
              padding: 0;
              background: #ffffff !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            img[alt="Logo"] {
              width: 40px !important; 
              height: auto !important;
              display: inline-block !important;
              margin: 5px 0 !important;
            }
            div, p, span { background: transparent !important; box-shadow: none !important; }
            @page { size: A4; margin: 15mm 20mm; }
            table {
              border-collapse: collapse !important;
              width: 100% !important;
              table-layout: fixed !important;
              margin: 10px 0 !important;
            }
            td, th {
              border: 1px solid #000000 !important;
              padding: 6px 8px !important;
              vertical-align: top;
              word-wrap: break-word;
            }
            [style*="text-align: center"], .ql-align-center { text-align: center !important; }
            [style*="text-align: right"], .ql-align-right { text-align: right !important; }
            [style*="text-align: justify"], .ql-align-justify { text-align: justify !important; }
            
            p { margin: 0 !important; white-space: pre-wrap; }

            .ql-indent-1 { padding-left: 3em !important; }
            .ql-indent-2 { padding-left: 6em !important; }
            .ql-indent-3 { padding-left: 9em !important; }
            .ql-indent-4 { padding-left: 12em !important; }
            .ql-indent-5 { padding-left: 15em !important; }
            .ql-indent-6 { padding-left: 18em !important; }
            .ql-indent-7 { padding-left: 21em !important; }
            .ql-indent-8 { padding-left: 24em !important; }

            .ct-pagebreak {
              page-break-after: always !important;
              display: block;
              height: 0 !important;
              margin: 0 !important;
              padding: 0 !important;
              border: none !important;
              color: transparent !important;
              background: none !important;
            }
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

    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 800);
  };

  // ✅ ฟังก์ชันฝั่งแก้ไข (สำหรับส่งเข้า Toolbar)
  const handleSelectionChange = useCallback((range, source, editor) => {
    if (range) {
      lastSelection.current = range;
      const format = editor.getFormat(range);
      if (format.size) setCurrentSize(format.size);
      else setCurrentSize("16px");
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
          q.formatText(range.index, range.length, "size", newSize, "user");
        } else {
          q.format("size", newSize, "user");
        }
      }
    }
  }, []);

  const insertPageBreak = useCallback(() => {
    const q = quillRef.current?.getEditor();
    if (!q) return;
    if (lastSelection.current) q.setSelection(lastSelection.current);
    const range = q.getSelection(true);
    const idx = range ? range.index : q.getLength() - 1;
    const html = `<div class="ct-pagebreak">✂ ตัดขึ้นหน้าใหม่ ✂</div><p><br></p>`;
    q.clipboard.dangerouslyPasteHTML(idx, html, "user");
  }, []);

  if (isLoading)
    return (
      <div className="text-center py-20 text-gray-500 font-bold">
        กำลังโหลดข้อมูล...
      </div>
    );

  return (
    <>
      <div className="print:hidden">
        <RoomHeader roomNumber={roomNumber}>
          <div className="max-w-5xl mx-auto mt-6 pb-12">
            {!contract ? (
              <div className="py-24 flex flex-col items-center justify-center text-center bg-gray-50 rounded-3xl border border-gray-200 mt-4 max-w-4xl mx-auto">
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-gray-400 mb-6 border border-dashed border-gray-300 shadow-inner">
                  <FileText size={48} strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-black text-gray-500 mb-2">
                  ไม่มีข้อมูลสัญญา
                </h3>
                <p className="text-sm text-gray-400 font-bold max-w-xs">
                  ไม่พบข้อมูลสัญญาเช่าที่เปิดใช้งานอยู่สำหรับห้องพักนี้ในขณะนี้
                </p>
              </div>
            ) : (
              <>
                <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden mb-8">
                  <div className="p-5 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50/50">
                    <div className="flex items-center gap-3">
                      <div
                        className={
                          "w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm " +
                          (isRenewing ? "bg-green-500" : "bg-[#f3a638]")
                        }
                      >
                        {isRenewing ? (
                          <FileSignature size={20} />
                        ) : (
                          <FileText size={20} />
                        )}
                      </div>
                      <div>
                        <h2 className="text-xl font-black text-gray-800">
                          {isRenewing
                            ? "ทำสัญญาใหม่ (ต่อสัญญา)"
                            : "ข้อมูลสัญญาปัจจุบัน"}
                        </h2>
                        <p className="text-xs font-bold text-gray-400 mt-0.5 flex items-center gap-1">
                          <CheckCircle2
                            size={12}
                            className={
                              contract.status === "Active"
                                ? "text-green-500"
                                : contract.status === "Expired"
                                ? "text-red-500"  // ✨ ถ้าหมดอายุให้เป็นสีแดง
                                : "text-orange-400"
                            }
                          />
                          สถานะ:{" "}
                          {contract.status === "Reserved"
                            ? "รอทำสัญญา"
                            : contract.status === "Expired"
                            ? "หมดอายุแล้ว" // ✨ แปลเป็นข้อความภาษาไทย
                            : contract.status}
                        </p>
                      </div>
                    </div>

                    {!isEditing ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => setIsEditing(true)}
                          className="flex items-center gap-2 p-2 px-4 bg-orange-100 text-[#f3a638] rounded-xl font-bold hover:bg-orange-200 transition-all text-sm"
                        >
                          <Edit3 size={16} /> แก้ไข
                        </button>
                        <button
                          onClick={handleRenewClick}
                          className="flex items-center gap-2 p-2 px-4 bg-green-100 text-green-700 rounded-xl font-bold hover:bg-green-200 transition-all text-sm"
                        >
                          <FileSignature size={16} /> ต่อสัญญา
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={handleSave}
                          className="flex items-center gap-2 p-2 px-5 bg-[#D5F5E3] text-[#1D8348] rounded-xl font-bold hover:brightness-95 transition-all text-sm"
                        >
                          <Save size={16} /> บันทึก
                        </button>
                        <button
                          onClick={() => {
                            if (location.state?.autoEdit) {
                              navigate(-1);
                            } else {
                              setIsEditing(false);
                              setIsRenewing(false);
                              fetchContract();
                            }
                          }}
                          className="flex items-center gap-2 p-2 px-5 bg-gray-100 text-gray-500 rounded-xl font-bold hover:bg-gray-200 transition-all text-sm"
                        >
                          <XCircle size={16} /> ยกเลิก
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="p-6 md:p-8 flex flex-col md:grid md:grid-cols-2 gap-x-8 gap-y-6">
                    <div className="space-y-6 order-1">
                      <h3 className="text-md font-bold text-[#f3a638] flex items-center gap-2 border-b pb-2">
                        <Calendar size={18} /> ระยะเวลาเช่า
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <DateInput
                          label="วันเริ่มสัญญา"
                          name="startDate"
                          value={formData.startDate}
                          onChange={handleChange}
                          className={
                            !isEditing
                              ? "pointer-events-none opacity-80 cursor-not-allowed"
                              : ""
                          }
                          required
                        />
                        <DateInput
                          label="วันสิ้นสุดสัญญา"
                          name="endDate"
                          value={formData.endDate}
                          onChange={handleChange}
                          className={
                            !isEditing
                              ? "pointer-events-none cursor-not-allowed opacity-80"
                              : ""
                          }
                        />
                      </div>

                      <h3 className="text-md font-bold text-[#f3a638] flex items-center gap-2 border-b pb-2 mt-8">
                        <CreditCard size={18} /> ค่าใช้จ่าย
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                          <label className="text-[13px] font-bold text-gray-500 ml-1 flex items-center gap-1.5">
                            ค่าเช่า (บาท/เดือน)
                            {defaultRentFromRoom && (
                              <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-600">
                                default จากห้อง
                              </span>
                            )}
                          </label>
                          <input
                            type="number"
                            name="monthlyRent"
                            value={formData.monthlyRent}
                            onChange={handleChange}
                            disabled={!isEditing}
                            placeholder={
                              defaultRentFromRoom
                                ? `${defaultRentFromRoom.toLocaleString()} (default)`
                                : ""
                            }
                            className={
                              "w-full p-3 border rounded-xl font-medium focus:outline-none transition-all " +
                              (!isEditing
                                ? "bg-gray-50 border-gray-100 text-gray-500 cursor-not-allowed"
                                : "bg-white border-gray-300 text-gray-800 focus:border-[#f3a638]  focus:ring-[#f3a638]") +
                              (isEditing && defaultRentFromRoom
                                ? " border-amber-200"
                                : "")
                            }
                          />
                        </div>
                        <InputGroup
                          label="เงินมัดจำ (บาท)"
                          name="deposit"
                          type="number"
                          value={formData.deposit}
                          onChange={handleChange}
                          disabled={!isEditing}
                        />
                      </div>
                    </div>

                    <div className="space-y-6 order-2">
                      <h3 className="text-md font-bold text-[#f3a638] flex items-center gap-2 border-b pb-2">
                        <Zap size={18} /> อัตราค่าน้ำ-ไฟ (สำหรับห้องนี้)
                      </h3>
                      <div className="grid grid-cols-1 gap-4">
                        <div
                          className={`p-4 rounded-2xl border transition-colors ${elecMode === "custom" ? "bg-orange-50/50 border-orange-200" : "bg-gray-50/50 border-gray-200"}`}
                        >
                          <div className="flex justify-between items-center mb-3">
                            <span className="text-sm font-black text-orange-600 flex items-center gap-1.5">
                              <Zap size={14} fill="currentColor" />{" "}
                              อัตราค่าไฟฟ้า
                            </span>
                          </div>
                          <div className="flex bg-white rounded-xl p-1 border border-gray-200 mb-3 shadow-sm">
                            <button
                              type="button"
                              disabled={!isEditing}
                              onClick={() => setElecMode("constant")}
                              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${elecMode === "constant" ? "bg-orange-100 text-orange-700" : "text-gray-400"}`}
                            >
                              เรทส่วนกลาง
                            </button>
                            <button
                              type="button"
                              disabled={!isEditing}
                              onClick={() => setElecMode("custom")}
                              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${elecMode === "custom" ? "bg-orange-100 text-orange-700" : "text-gray-400"}`}
                            >
                              กำหนดเอง
                            </button>
                          </div>
                          {elecMode === "custom" ? (
                            <div className="relative">
                              <input
                                disabled={!isEditing}
                                type="number"
                                min="0"
                                step="0.5"
                                value={elecRate}
                                onChange={(e) => setElecRate(e.target.value)}
                                placeholder="ระบุเรทราคาใหม่"
                                className="w-full border border-gray-300 focus:border-orange-400 rounded-xl p-2.5 text-sm font-bold pr-16 outline-none disabled:bg-gray-100"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                                ฿/หน่วย
                              </span>
                            </div>
                          ) : (
                            <p className="text-xs font-bold text-gray-500 text-center py-2.5 bg-white rounded-xl border border-gray-100">
                              ใช้เรทส่วนกลางของหอพัก: {elecConst?.cost || "-"}{" "}
                              ฿/หน่วย
                            </p>
                          )}
                        </div>

                        <div
                          className={`p-4 rounded-2xl border transition-colors ${waterMode === "custom" ? "bg-blue-50/50 border-blue-200" : "bg-gray-50/50 border-gray-200"}`}
                        >
                          <div className="flex justify-between items-center mb-3">
                            <span className="text-sm font-black text-blue-600 flex items-center gap-1.5">
                              <Droplets size={14} fill="currentColor" />{" "}
                              อัตราค่าน้ำประปา
                            </span>
                          </div>
                          <div className="flex bg-white rounded-xl p-1 border border-gray-200 mb-3 shadow-sm">
                            <button
                              type="button"
                              disabled={!isEditing}
                              onClick={() => setWaterMode("constant")}
                              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${waterMode === "constant" ? "bg-blue-100 text-blue-700" : "text-gray-400"}`}
                            >
                              เรทส่วนกลาง
                            </button>
                            <button
                              type="button"
                              disabled={!isEditing}
                              onClick={() => setWaterMode("custom")}
                              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${waterMode === "custom" ? "bg-blue-100 text-blue-700" : "text-gray-400"}`}
                            >
                              กำหนดเอง
                            </button>
                          </div>
                          {waterMode === "custom" ? (
                            <div className="relative">
                              <input
                                disabled={!isEditing}
                                type="number"
                                min="0"
                                step="0.5"
                                value={waterRate}
                                onChange={(e) => setWaterRate(e.target.value)}
                                placeholder="ระบุเรทราคาใหม่"
                                className="w-full border border-gray-300 focus:border-blue-400 rounded-xl p-2.5 text-sm font-bold pr-16 outline-none disabled:bg-gray-100"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                                ฿/หน่วย
                              </span>
                            </div>
                          ) : (
                            <p className="text-xs font-bold text-gray-500 text-center py-2.5 bg-white rounded-xl border border-gray-100">
                              ใช้เรทส่วนกลางของหอพัก: {waterConst?.cost || "-"}{" "}
                              ฿/หน่วย
                            </p>
                          )}
                        </div>
                      </div>

                      <h3 className="text-md font-bold text-[#f3a638] flex items-center gap-2 border-b pb-2 mt-8">
                        <Clock size={18} /> มิเตอร์น้ำ-ไฟ เริ่มต้น
                      </h3>
                      <div
                        className={`p-5 rounded-2xl border space-y-4 ${isRenewing ? "bg-green-50/50 border-green-100" : "bg-orange-50/50 border-orange-100"}`}
                      >
                        <p
                          className={`text-xs font-bold mb-4 ${isRenewing ? "text-green-600" : "text-orange-600"}`}
                        >
                          {isRenewing
                            ? "* ระบบดึงเลขมิเตอร์ล่าสุดมาให้อัตโนมัติ"
                            : "* หากกรอกเลขมิเตอร์เป็นครั้งแรก ระบบจะบันทึกให้อัตโนมัติ"}
                        </p>
                        <InputGroup
                          label="ไฟเริ่มต้น (หน่วย)"
                          name="initialElectricUnit"
                          type="number"
                          value={formData.initialElectricUnit}
                          onChange={handleChange}
                          disabled={!isEditing}
                        />
                        <InputGroup
                          label="น้ำเริ่มต้น (หน่วย)"
                          name="initialWaterUnit"
                          type="number"
                          value={formData.initialWaterUnit}
                          onChange={handleChange}
                          disabled={!isEditing}
                        />
                      </div>
                    </div>

                    <div className="order-3 md:col-span-2 border-t border-gray-100 pt-6 space-y-6">
                      <h3 className="text-md font-bold text-[#f3a638] flex items-center gap-2 border-b pb-2">
                        <FileSignature size={18} /> เอกสารสัญญาเช่า
                      </h3>

                      <div className="flex flex-col gap-4">
                        <div className="p-4 md:p-5 bg-blue-50 border border-blue-100 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between shadow-sm gap-4">
                          <div className="flex items-center gap-3">
                            <div className="p-3 bg-blue-100 text-blue-600 rounded-xl shrink-0">
                              <FileText size={24} />
                            </div>
                            <div>
                              <p className="text-base font-bold text-gray-800">
                                ตรวจสอบและพิมพ์เอกสาร
                              </p>
                              <p className="text-[11px] md:text-xs font-bold text-gray-500 mt-0.5">
                                กดที่ปุ่มเพื่อตรวจสอบแก้ไขข้อความ
                                ก่อนสั่งเซฟเป็นไฟล์ PDF
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2 shrink-0 w-full md:w-auto">
                            <button
                              type="button"
                              onClick={() => {
                                setEditableHtml(previewHtml);
                                setShowPreviewModal(true);
                              }}
                              className="flex-1 md:flex-none flex justify-center items-center gap-1.5 px-6 py-3 bg-blue-600 text-white hover:bg-blue-700 rounded-xl shadow-md shadow-blue-200 transition-all font-black text-sm"
                            >
                              <Eye size={18} strokeWidth={2.5} />{" "}
                              ดูตัวอย่างและพิมพ์
                            </button>
                          </div>
                        </div>

                        <div className="flex flex-col gap-1 mt-2">
                          <label className="text-[13px] font-bold text-gray-500 ml-1">
                            หมายเหตุในระบบ (เฉพาะผู้ดูแลเห็น)
                          </label>
                          <textarea
                            name="Note"
                            value={formData.Note}
                            onChange={handleChange}
                            disabled={!isEditing}
                            rows={3}
                            placeholder="ระบุหมายเหตุเพิ่มเติมสำหรับสัญญานี้ (ถ้ามี)..."
                            className={
                              "w-full p-4 border rounded-2xl font-medium focus:outline-none transition-all " +
                              (!isEditing
                                ? "bg-gray-50 border-gray-100 text-gray-500 cursor-not-allowed"
                                : "bg-white border-gray-300 text-gray-800 focus:border-[#f3a638] focus:ring-1 focus:ring-[#f3a638]")
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </RoomHeader>
      </div>

      {/* 🌟 Modal: Preview เอกสารแบบแก้ไขได้ */}
      {showPreviewModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 print:hidden"
          onClick={() => setShowPreviewModal(false)}
        >
          <div
            className="bg-gray-200 rounded-[32px] w-full max-w-5xl shadow-2xl flex flex-col h-[95vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 bg-white border-b border-gray-200 shrink-0">
              <div>
                <h3 className="text-lg font-black text-gray-800 flex items-center gap-2">
                  <FileText size={20} className="text-blue-500" />{" "}
                  ตรวจสอบและแก้ไขสัญญาก่อนพิมพ์
                </h3>
                <p className="text-xs font-bold text-gray-500 mt-0.5">
                  ห้อง {roomNumber}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintAndSavePDF}
                  className="flex items-center gap-2 px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-black shadow-md shadow-blue-100 transition-all active:scale-95"
                >
                  <Download size={16} /> บันทึกเป็น PDF (พิมพ์)
                </button>
                <ExitButton onClick={() => setShowPreviewModal(false)} />
              </div>
            </div>

            {/* ✅ Toolbar ฉบับย่อ สำหรับแก้คำผิด */}
            <EditorToolbar
              currentSize={currentSize}
              onSizeChange={handleSizeChange}
              onInsertPageBreak={insertPageBreak}
            />

            {/* ✅ Editor Area */}
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
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <style>{`
        /* ✅ Import Sarabun font */
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:ital,wght@0,400;0,700;1,400;1,700&display=swap');

        /* ✅ FIX: Alignment — ใช้ inline style จาก AlignStyle attributor */
        .ql-editor [style*="text-align: center"] { text-align: center !important; }
        .ql-editor [style*="text-align: right"] { text-align: right !important; }
        .ql-editor [style*="text-align: justify"] { text-align: justify !important; }
        .ql-align-center, .ql-editor .ql-align-center { text-align: center !important; }
        .ql-align-right, .ql-editor .ql-align-right { text-align: right !important; }
        .ql-align-justify, .ql-editor .ql-align-justify { text-align: justify !important; }

        /* ✅ CSS บังคับฟอนต์ให้ออกมาเป็นขนาดจริงๆ */
        .ql-editor [style*="font-size: 10px"] { font-size: 10px !important; }
        .ql-editor [style*="font-size: 12px"] { font-size: 12px !important; }
        .ql-editor [style*="font-size: 14px"] { font-size: 14px !important; }
        .ql-editor [style*="font-size: 16px"] { font-size: 16px !important; }
        .ql-editor [style*="font-size: 18px"] { font-size: 18px !important; }
        .ql-editor [style*="font-size: 20px"] { font-size: 20px !important; }
        .ql-editor [style*="font-size: 24px"] { font-size: 24px !important; }
        .ql-editor [style*="font-size: 28px"] { font-size: 28px !important; }
        .ql-editor [style*="font-size: 32px"] { font-size: 32px !important; }

        /* เพิ่มเข้าไปในส่วน <style> ของไฟล์ RoomContract */
        .ql-editor img {
          display: inline-block;
          vertical-align: middle;
        }

        /* บังคับขนาดรูปโลโก้ให้คงที่ตามที่เราเซตไว้ */
        .ql-editor img[alt="Logo"] {
          width: 40px !important;
          height: auto !important;
        }

        /* ✅ ตารางบังคับ border ดำ */
        .ql-editor table, .contract-editor table {
          border: 1px solid #000000 !important;
          border-collapse: collapse !important;
          width: 100% !important;
          table-layout: fixed !important;
        }
        .ql-editor table tr, .ql-editor table td, .ql-editor table th,
        .contract-editor table tr, .contract-editor table td, .contract-editor table th {
          border: 1px solid #000000 !important;
        }
        .ql-editor td[style*="width"], .ql-editor th[style*="width"] {
          overflow: hidden;
          word-wrap: break-word;
        }

        .ql-editor p, .ql-editor li { white-space: pre-wrap !important; }
        .ql-editor { tab-size: 4; -moz-tab-size: 4; }

        /* ✅ FIX: เพิ่ม Indent Classes ให้หน้าจอแสดงผลถูกต้อง */
        .ql-indent-1 { padding-left: 3em !important; }
        .ql-indent-2 { padding-left: 6em !important; }
        .ql-indent-3 { padding-left: 9em !important; }
        .ql-indent-4 { padding-left: 12em !important; }
        .ql-indent-5 { padding-left: 15em !important; }
        .ql-indent-6 { padding-left: 18em !important; }
        .ql-indent-7 { padding-left: 21em !important; }
        .ql-indent-8 { padding-left: 24em !important; }

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
          font-size: 16px;
          line-height: 1.5;
          color: #000000;
          caret-color: #000000 !important;
          min-height: 297mm;
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
        #ql-toolbar-fixed .ql-active { color: #ea580c !important; background: #fff7ed !important; border-color: #ffedd5 !important; }
        .ql-editor ul, .ql-editor ol { padding-left: 1.5em; }
        .ql-editor td { resize: none; }
      `}</style>
    </>
  );
};

const InputGroup = ({ label, name, type, value, onChange, disabled }) => (
  <div className="flex flex-col gap-1">
    <label className="text-[13px] font-bold text-gray-500 ml-1">{label}</label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={
        "w-full p-3 border rounded-xl font-medium focus:outline-none transition-all " +
        (disabled
          ? "bg-gray-50 border-gray-100 text-gray-500 cursor-not-allowed"
          : "bg-white border-gray-300 text-gray-800 focus:border-[#f3a638]  focus:ring-[#f3a638]")
      }
    />
  </div>
);

export default RoomContract;
