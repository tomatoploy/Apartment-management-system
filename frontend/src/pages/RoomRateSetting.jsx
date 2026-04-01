import { useNavigate } from "react-router-dom";
import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import {
  Loader2,
  Home,
  Plus,
  X,
  CheckCircle2,
  AlertCircle,
  Users,
  Tag,
  Percent,
  Lock,
  Calendar,
  Building2,
  Info,
  Pencil,
  Trash2,
  FileText,
} from "lucide-react";
import { ExitButton, RefreshButton } from "../components/ActionButtons";
import SearchBar from "../components/SearchBar";

import { roomService } from "../api/RoomApi";
import { contractService } from "../api/ContractApi";
import { paymentService } from "../api/PaymentApi";
import { constantService } from "../api/ConstantApi";

/* ── helpers ──────────────────────────────────────────────────── */
const extractArray = (res) => {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (res.$values) return res.$values;
  if (res.data && Array.isArray(res.data)) return res.data;
  if (res.data?.$values) return res.data.$values;
  return [];
};

const THAI_MONTHS = [
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
const thaiMonth = (y, m) => `${THAI_MONTHS[m - 1]} ${y + 543}`;

const STATUS_META = {
  occupied: {
    label: "มีผู้เช่า",
    border: "border-emerald-400",
    dot: "bg-emerald-400",
    badge: "bg-emerald-50 text-emerald-700",
  },
  overdue: {
    label: "ค้างชำระ",
    border: "border-rose-400",
    dot: "bg-rose-400",
    badge: "bg-rose-50 text-rose-700",
  },
  reserved: {
    label: "ติดจอง",
    border: "border-amber-400",
    dot: "bg-amber-400",
    badge: "bg-amber-50 text-amber-700",
  },
  available: {
    label: "ว่าง",
    border: "border-gray-200",
    dot: "bg-gray-300",
    badge: "bg-gray-50 text-gray-500",
  },
  maintenance: {
    label: "ปิดปรับปรุง",
    border: "border-gray-300",
    dot: "bg-gray-400",
    badge: "bg-gray-100 text-gray-500",
  },
};

/* ── helpers: parse note ─────────────────────────────────────── */
const parseRentFromRoomNote = (note) => {
  if (!note) return null;
  const m = note.match(/\{ค่าเช่า:\s*([\d,]+)฿?\}/);
  if (!m) return null;
  const n = Number(m[1].replace(/,/g, ""));
  return isNaN(n) ? null : n;
};

const parseServiceFromRoomNote = (note) => {
  if (!note) return null;
  const m = note.match(/\{ค่าบริการ:([^}]+)\}/);
  return m ? m[1].trim() : null;
};

const parseDiscountFromRoomNote = (note) => {
  if (!note) return null;
  const m = note.match(/\{ส่วนลด:([^}]+)\}/);
  return m ? m[1].trim() : null;
};

const sumFromNoteStr = (str) => {
  if (!str) return 0;
  const nums = [...str.matchAll(/([\d,]+)\s*฿/g)];
  return nums.reduce((s, m) => s + Number(m[1].replace(/,/g, "")), 0);
};

/* ══════════════════════════════════════════════════════════════ */
/* Sub-components                                                */
/* ══════════════════════════════════════════════════════════════ */

/* ── Toast ────────────────────────────────────────────────────── */
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div
      className={`fixed bottom-28 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl font-bold text-sm whitespace-nowrap
      ${type === "success" ? "bg-emerald-500 text-white" : "bg-red-500 text-white"}`}
    >
      {type === "success" ? (
        <CheckCircle2 size={18} />
      ) : (
        <AlertCircle size={18} />
      )}
      {message}
    </div>
  );
};

/* ── ItemListModal ───────────────────────────────────────────── */
const ItemListModal = ({ type, onClose, onNext, recentItems }) => {
  const isDiscount = type === "discount";
  const accentClass = isDiscount
    ? {
        border: "focus:border-emerald-400",
        btn: "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-100",
        badge: "bg-emerald-100 text-emerald-600",
        presetHover: "hover:border-emerald-300 hover:bg-emerald-50",
        totalBg: "bg-emerald-50 border-emerald-100 text-emerald-700",
      }
    : {
        border: "focus:border-[#f3a638]",
        btn: "bg-[#f3a638] hover:bg-orange-500 shadow-orange-100",
        badge: "bg-orange-100 text-orange-600",
        presetHover: "hover:border-[#f3a638] hover:bg-orange-50",
        totalBg: "bg-orange-50 border-orange-100 text-[#f3a638]",
      };

  const [items, setItems] = useState([]);
  const addBlank = () =>
    setItems((p) => [...p, { id: Date.now(), name: "", amount: "" }]);
  const removeItem = (id) => setItems((p) => p.filter((i) => i.id !== id));
  const updateItem = (id, f, v) =>
    setItems((p) => p.map((i) => (i.id === id ? { ...i, [f]: v } : i)));
  const applyPreset = (preset) => {
    if (!items.some((i) => i.name === preset.name))
      setItems((p) => [
        ...p,
        { id: Date.now(), name: preset.name, amount: String(preset.amount) },
      ]);
  };

  const total = items.reduce((s, i) => s + (Number(i.amount) || 0), 0);
  const validItems = items.filter((i) => i.name.trim() && Number(i.amount) > 0);
  const isValid = validItems.length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white rounded-[40px] w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center px-8 py-6 border-b border-gray-100 shrink-0">
          <div>
            <h3 className="text-xl font-black text-gray-800">
              {isDiscount ? "กำหนดส่วนลด" : "กำหนดค่าบริการ"}
            </h3>
            <p className="text-xs font-bold text-gray-400 mt-0.5">
              ระบุรายการและยอดเงินที่ต้องการ
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={22} strokeWidth={3} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-8 py-6 space-y-6">
          {recentItems.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3 px-1">
                <span
                  className={`text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${accentClass.badge}`}
                >
                  เลือกด่วน
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {recentItems.map((r, idx) => {
                  const alreadyAdded = items.some((i) => i.name === r.name);
                  return (
                    <button
                      key={idx}
                      onClick={() => applyPreset(r)}
                      disabled={alreadyAdded}
                      className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all text-left group
                        ${alreadyAdded ? "opacity-50 cursor-not-allowed border-gray-100 bg-gray-50" : `border-transparent bg-gray-50 ${accentClass.presetHover}`}`}
                    >
                      <p className="font-bold text-sm text-gray-700 truncate mr-2">
                        {r.name}
                      </p>
                      <div className="shrink-0 flex items-center gap-1">
                        <span className="text-sm font-black text-gray-700">
                          {Number(r.amount).toLocaleString()}
                        </span>
                        <span className="text-xs text-gray-400">฿</span>
                        {alreadyAdded ? (
                          <CheckCircle2
                            size={14}
                            className="ml-1 text-gray-400"
                          />
                        ) : (
                          <Plus
                            size={14}
                            className="ml-1 text-gray-300 group-hover:text-current transition-colors"
                          />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <p className="text-xs font-black text-gray-400 uppercase tracking-wider mb-3 px-1">
              รายการ
            </p>
            {items.length === 0 ? (
              <p className="text-sm text-gray-400 font-bold text-center py-4">
                ยังไม่มีรายการ — เลือกด่วนหรือเพิ่มเองด้านล่าง
              </p>
            ) : (
              <div className="space-y-2">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-2 items-center">
                    <input
                      value={item.name}
                      onChange={(e) =>
                        updateItem(item.id, "name", e.target.value)
                      }
                      placeholder="ชื่อรายการ"
                      className={`flex-1 px-4 py-2.5 rounded-2xl border-2 border-gray-200 ${accentClass.border} outline-none text-sm font-bold text-gray-700 transition-colors`}
                    />
                    <input
                      value={item.amount}
                      onChange={(e) =>
                        updateItem(item.id, "amount", e.target.value)
                      }
                      type="number"
                      min={0}
                      placeholder="ยอด"
                      className={`w-28 px-4 py-2.5 rounded-2xl border-2 border-gray-200 ${accentClass.border} outline-none text-sm font-bold text-gray-700 transition-colors
                                  [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                    />
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-gray-300 hover:text-red-400 p-1 transition-colors shrink-0"
                    >
                      <X size={18} strokeWidth={3} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={addBlank}
              className={`mt-3 w-full py-3 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 ${accentClass.presetHover} font-bold text-sm transition-all flex items-center justify-center gap-2`}
            >
              <Plus size={16} /> เพิ่มรายการ
            </button>
          </div>

          {total > 0 && (
            <div
              className={`flex justify-between items-center rounded-2xl px-5 py-4 border ${accentClass.totalBg}`}
            >
              <span className="font-bold text-gray-600">
                {isDiscount ? "ส่วนลดรวม" : "ยอดรวม"}
              </span>
              <span className="text-xl font-black">
                {isDiscount ? "-" : "+"}
                {total.toLocaleString()}{" "}
                <span className="text-sm font-bold text-gray-400">บาท</span>
              </span>
            </div>
          )}

          {isDiscount && (
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <Info size={14} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[11px] font-bold text-amber-700 leading-relaxed">
                ส่วนลดแต่ละรายการจะ <strong>เขียนทับ</strong> ค่าเดิม ไม่สะสม
              </p>
            </div>
          )}
        </div>

        <div className="px-8 pb-8 pt-4 shrink-0 border-t border-gray-100">
          <button
            onClick={() => isValid && onNext(validItems)}
            disabled={!isValid}
            className={`w-full py-3.5 rounded-2xl text-white font-black text-base disabled:opacity-40 transition-all shadow-lg ${accentClass.btn}`}
          >
            ถัดไป →
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── RentModal ────────────────────────────────────────────────── */
const RentModal = ({ onClose, onNext }) => {
  const [value, setValue] = useState("");
  const PRESETS = [3000, 4000, 5000, 6000, 7000, 8000];
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white rounded-[40px] w-full max-w-sm shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center px-8 py-6 border-b border-gray-100">
          <h3 className="text-xl font-black text-gray-800">กำหนดค่าเช่าห้อง</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={22} strokeWidth={3} />
          </button>
        </div>
        <div className="px-8 py-6 space-y-5">
          <div className="relative">
            <input
              type="number"
              min={0}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              autoFocus
              placeholder="0"
              className="w-full text-3xl font-black text-center text-gray-800 border-2 border-gray-200 focus:border-[#f3a638] rounded-2xl py-5 px-4 outline-none transition-colors
                         [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span className="absolute right-5 top-1/2 -translate-y-1/2 text-sm font-black text-gray-400">
              ฿/เดือน
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {PRESETS.map((v) => (
              <button
                key={v}
                onClick={() => setValue(String(v))}
                className={`py-2.5 rounded-2xl text-sm font-black border-2 transition-all
                  ${String(v) === value ? "border-[#f3a638] bg-orange-50 text-[#f3a638]" : "border-gray-100 bg-gray-50 text-gray-600 hover:border-orange-200"}`}
              >
                {v.toLocaleString()}
              </button>
            ))}
          </div>
        </div>
        <div className="px-8 pb-8">
          <button
            onClick={() => value && Number(value) > 0 && onNext(value)}
            disabled={!value || Number(value) <= 0}
            className="w-full py-3.5 rounded-2xl bg-[#f3a638] hover:bg-orange-500 text-white font-black text-base disabled:opacity-40 transition-all shadow-lg shadow-orange-100"
          >
            ถัดไป →
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── ConfirmModal ─────────────────────────────────────────────── */
const ConfirmModal = ({
  mode,
  applyMode,
  selectedCount,
  previewRoomNumbers,
  rentValue,
  serviceItems,
  discountItems,
  onBack,
  onConfirm,
  isSaving,
  currentMonthLabel,
}) => {
  const isRent = mode === "rent";
  const isDiscount = mode === "discount";
  const isMonthly = applyMode === "monthly";
  const isContract = applyMode === "contract";

  const headerBg = isRent
    ? "bg-[#f3a638]"
    : isDiscount
      ? "bg-emerald-500"
      : "bg-blue-500";
  const confirmBg = isRent
    ? "bg-[#f3a638] hover:bg-orange-500"
    : isDiscount
      ? "bg-emerald-500 hover:bg-emerald-600"
      : "bg-blue-500 hover:bg-blue-600";
  const title = isRent
    ? "ยืนยันปรับค่าเช่า"
    : isDiscount
      ? "ยืนยันกำหนดส่วนลด"
      : "ยืนยันเพิ่มค่าบริการ";
  const items = isDiscount ? discountItems : serviceItems;
  const total = items.reduce((s, i) => s + Number(i.amount), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[40px] w-full max-w-md shadow-2xl overflow-hidden">
        <div className={`px-8 py-6 ${headerBg}`}>
          <h3 className="text-xl font-black text-white">{title}</h3>
          <p className="text-white/80 text-sm font-bold mt-0.5">
            {selectedCount} ห้องที่เลือก
          </p>
        </div>
        <div className="px-8 py-6 space-y-4 max-h-80 overflow-y-auto">
          {isRent ? (
            <div className="flex items-center justify-between bg-orange-50 rounded-2xl px-5 py-4 border border-orange-100">
              <span className="font-bold text-gray-600">ค่าเช่าใหม่</span>
              <span className="text-xl font-black text-[#f3a638]">
                {Number(rentValue).toLocaleString()}{" "}
                <span className="text-sm font-bold text-gray-400">
                  บาท/เดือน
                </span>
              </span>
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((item, i) => (
                <div
                  key={i}
                  className={`flex justify-between items-center rounded-xl px-4 py-3 border
                  ${isDiscount ? "bg-emerald-50 border-emerald-100" : "bg-blue-50 border-blue-100"}`}
                >
                  <span className="text-sm font-bold text-gray-700 truncate mr-3">
                    {item.name}
                  </span>
                  <span
                    className={`font-black shrink-0 ${isDiscount ? "text-emerald-600" : "text-blue-600"}`}
                  >
                    {isDiscount ? "-" : "+"}
                    {Number(item.amount).toLocaleString()} ฿
                  </span>
                </div>
              ))}
              <div className="flex justify-between font-black text-base pt-2 border-t border-dashed border-gray-200">
                <span className="text-gray-600">รวม</span>
                <span
                  className={isDiscount ? "text-emerald-600" : "text-blue-600"}
                >
                  {isDiscount ? "-" : "+"}
                  {total.toLocaleString()} ฿
                </span>
              </div>
            </div>
          )}
          <div className="flex flex-wrap gap-1.5">
            {previewRoomNumbers.slice(0, 15).map((r) => (
              <span
                key={r}
                className="px-2.5 py-1 bg-gray-100 rounded-lg text-xs font-black text-gray-600"
              >
                {r}
              </span>
            ))}
            {previewRoomNumbers.length > 15 && (
              <span className="px-2.5 py-1 bg-gray-100 rounded-lg text-xs font-bold text-gray-400">
                +{previewRoomNumbers.length - 15} ห้อง
              </span>
            )}
          </div>
          <div
            className={`flex items-start gap-2 rounded-xl px-4 py-3 border
            ${isMonthly ? "bg-blue-50 border-blue-200" : isContract ? "bg-purple-50 border-purple-200" : "bg-orange-50 border-orange-200"}`}
          >
            {isMonthly ? (
              <Calendar size={14} className="text-blue-500 shrink-0 mt-0.5" />
            ) : isContract ? (
              <FileText size={14} className="text-purple-500 shrink-0 mt-0.5" />
            ) : (
              <Building2
                size={14}
                className="text-orange-500 shrink-0 mt-0.5"
              />
            )}
            <p
              className={`text-[11px] font-bold leading-relaxed ${isMonthly ? "text-blue-700" : isContract ? "text-purple-700" : "text-orange-700"}`}
            >
              {isRent
                ? "ค่าเช่าใหม่จะมีผลกับสัญญาห้องที่เลือกทันที"
                : isMonthly
                  ? `ผูกกับบิลเดือน ${currentMonthLabel} เท่านั้น`
                  : isContract
                    ? "บันทึกใน Note สัญญา เรียกใช้ทุกเดือนจนกว่าจะย้ายออก"
                    : "บันทึกใน Note ห้อง เรียกใช้ทุกเดือน ทุกสัญญา"}
            </p>
          </div>
        </div>
        <div className="flex gap-3 px-8 py-6 border-t border-gray-100">
          <button
            onClick={onBack}
            disabled={isSaving}
            className="flex-1 py-3 rounded-2xl border-2 border-gray-200 font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-all"
          >
            ← ย้อนกลับ
          </button>
          <button
            onClick={onConfirm}
            disabled={isSaving}
            className={`flex-1 py-3 rounded-2xl font-black text-white disabled:opacity-50 transition-all flex items-center justify-center gap-2 ${confirmBg}`}
          >
            {isSaving ? (
              <>
                <Loader2 size={16} className="animate-spin" /> กำลังบันทึก...
              </>
            ) : (
              <>
                <CheckCircle2 size={16} /> ยืนยัน
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── RoomNoteDrawer ────────────────────────────────────────────── */
const RoomNoteDrawer = ({ target, onClose, onSaved }) => {
  const isContract = target.type === "contract";
  const room = target.room;

  const parseNote = (raw) => {
    if (!raw) return [];
    const parts = [];
    const regex = /\{([^:}]+):\s*([^}]+)\}/g;
    let last = 0,
      m;
    while ((m = regex.exec(raw)) !== null) {
      if (m.index > last)
        parts.push({ type: "text", value: raw.slice(last, m.index).trim() });
      parts.push({
        type: "tag",
        key: m[1].trim(),
        value: m[2].trim(),
        full: m[0],
      });
      last = m.index + m[0].length;
    }
    if (last < raw.length && raw.slice(last).trim())
      parts.push({ type: "text", value: raw.slice(last).trim() });
    return parts;
  };

  const rawNote = isContract
    ? (room._contract?.note ?? room._contract?.Note ?? "")
    : (room.roomNote ?? room.note ?? room.Note ?? "");

  const [parts, setParts] = useState(() => parseNote(rawNote));
  const [isSaving, setIsSaving] = useState(false);
  const [editIdx, setEditIdx] = useState(null);
  const [editVal, setEditVal] = useState("");

  const rebuildNote = (ps) =>
    ps
      .map((p) => (p.type === "tag" ? `{${p.key}: ${p.value}}` : p.value))
      .filter(Boolean)
      .join(" ")
      .trim();

  const handleDeleteTag = (idx) =>
    setParts((prev) => prev.filter((_, i) => i !== idx));
  const handleStartEdit = (idx) => {
    setEditIdx(idx);
    setEditVal(parts[idx].value);
  };
  const handleSaveEdit = (idx) => {
    setParts((prev) =>
      prev.map((p, i) => (i === idx ? { ...p, value: editVal } : p)),
    );
    setEditIdx(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const newNote = rebuildNote(parts).substring(0, 300);
      if (isContract) {
        const cId = room._contractId;
        const c = room._contract;
        if (!cId || !c) throw new Error("Contract not found");
        await contractService.putContract(cId, {
          ...c,
          Id: Number(cId),
          Note: newNote,
        });
      } else {
        await roomService.updateRoom(room.roomId, {
          id: room.roomId,
          number: String(room.roomNumber),
          building: room.roomBuilding || "",
          floor: String(room.roomFloor || "1"),
          status: room.roomStatus || "available",
          note: newNote,
        });
      }
      onSaved();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const tags = parts.filter((p) => p.type === "tag");
  const text = parts
    .filter((p) => p.type === "text")
    .map((p) => p.value)
    .join(" ")
    .trim();

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white rounded-[40px] w-full max-w-md shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center px-8 py-6 border-b border-gray-100">
          <div>
            <h3 className="text-xl font-black text-gray-800">
              Note {isContract ? "สัญญา" : "ถาวร"} ห้อง {room.roomNumber}
            </h3>
            <p className="text-xs font-bold text-gray-400 mt-0.5">
              แก้ไขหรือลบรายการที่ผูกกับ{isContract ? "สัญญานี้" : "ห้อง"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={22} strokeWidth={3} />
          </button>
        </div>

        <div className="px-8 py-6 space-y-3 max-h-[60vh] overflow-y-auto">
          {text && (
            <div className="bg-gray-50 rounded-2xl px-4 py-3 border border-gray-200">
              <p className="text-xs font-black text-gray-400 mb-1">
                หมายเหตุทั่วไป
              </p>
              <p className="text-sm font-bold text-gray-700">{text}</p>
            </div>
          )}
          {tags.length === 0 && !text && (
            <p className="text-center text-sm text-gray-400 font-bold py-6">
              ไม่มี Note ใน{isContract ? "สัญญา" : "ห้อง"}นี้
            </p>
          )}
          {tags.map((tag, rawIdx) => {
            const partsIdx = parts.findIndex((p, i) => p === tag);
            const isEditing = editIdx === partsIdx;
            const tagColor =
              tag.key === "ค่าเช่า"
                ? "bg-orange-50 border-orange-200 text-orange-700"
                : tag.key === "ค่าบริการ"
                  ? "bg-blue-50 border-blue-200 text-blue-700"
                  : tag.key === "ส่วนลด"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                    : "bg-gray-50 border-gray-200 text-gray-700";

            return (
              <div
                key={rawIdx}
                className={`rounded-2xl border px-4 py-3 ${tagColor}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-black uppercase tracking-wider opacity-70">
                    {tag.key}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() =>
                        isEditing
                          ? handleSaveEdit(partsIdx)
                          : handleStartEdit(partsIdx)
                      }
                      className="p-1.5 rounded-lg bg-white/60 hover:bg-white transition-colors"
                    >
                      {isEditing ? (
                        <CheckCircle2 size={14} strokeWidth={3} />
                      ) : (
                        <Pencil size={13} strokeWidth={2.5} />
                      )}
                    </button>
                    <button
                      onClick={() => handleDeleteTag(partsIdx)}
                      className="p-1.5 rounded-lg bg-white/60 hover:bg-red-100 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={13} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
                {isEditing ? (
                  <input
                    autoFocus
                    value={editVal}
                    onChange={(e) => setEditVal(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleSaveEdit(partsIdx)
                    }
                    className="w-full text-sm font-bold bg-white rounded-xl px-3 py-1.5 border border-current/20 outline-none"
                  />
                ) : (
                  <p className="text-sm font-bold">{tag.value}</p>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex gap-3 px-8 py-6 border-t border-gray-100">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="flex-1 py-3 rounded-2xl border-2 border-gray-200 font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-all text-sm"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 py-3 rounded-2xl bg-[#f3a638] hover:bg-orange-500 text-white font-black text-sm disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                บันทึก...
              </>
            ) : (
              <>
                <CheckCircle2 size={15} />
                บันทึก
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── LazyFloor ────────────────────────────────────────────────── */
const LazyFloor = React.memo(
  ({
    floor,
    rooms,
    selectedIds,
    onToggle,
    onSelectFloor,
    applyMode,
    onOpenNoteDrawer,
  }) => {
    const ref = useRef(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
      const el = ref.current;
      if (!el) return;
      const obs = new IntersectionObserver(
        ([e]) => {
          if (e.isIntersecting) setVisible(true);
        },
        { rootMargin: "200px" },
      );
      obs.observe(el);
      return () => obs.disconnect();
    }, []);

    return (
      <div
        ref={ref}
        className="bg-gray-50 p-6 rounded-3xl border border-gray-100"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-700 flex items-center gap-2">
            <span className="bg-gray-200 text-gray-600 w-8 h-8 rounded-full flex items-center justify-center text-sm font-black">
              {floor}
            </span>
            ชั้น {floor}
          </h2>
          <button
            onClick={() => onSelectFloor(floor)}
            className="text-xs font-black text-[#f3a638] px-3 py-1.5 rounded-xl hover:bg-orange-100 transition-all"
          >
            เลือกทั้งชั้น
          </button>
        </div>

        {!visible ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {rooms.map((r) => (
              <div
                key={r.roomId}
                className="h-28 rounded-2xl bg-gray-200 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {rooms.map((room) => {
              const status = (room.roomStatus || "available").toLowerCase();
              const meta = STATUS_META[status] || STATUS_META.available;
              const hasContract = !!room._contractId;
              const isSel = selectedIds.has(room.roomId);
              const isDisabledByMode =
                (applyMode === "monthly" || applyMode === "contract") &&
                !hasContract;

              // กรองการแสดงผล Note Tags ตามโหมดที่เลือก
              const showRoomNote =
                room._roomNoteTags && applyMode !== "contract";
              const showContractNote =
                room._contractNoteTags && applyMode !== "room";

              // คำนวณยอดที่แสดงบนป้าย (+ NNN฿) ให้ตรงกับโหมดที่เลือกเท่านั้น
              const billService = room._additionalCost ?? 0;
              const noteService =
                (showRoomNote ? room._rNoteServiceAmt || 0 : 0) +
                (showContractNote ? room._cNoteServiceAmt || 0 : 0);
              const showService = billService > 0 || noteService > 0;

              const billDiscount = room._discountCost ?? 0;
              const noteDiscount =
                (showRoomNote ? room._rNoteDiscountAmt || 0 : 0) +
                (showContractNote ? room._cNoteDiscountAmt || 0 : 0);
              const showDiscount = billDiscount > 0 || noteDiscount > 0;

              return (
                <button
                  key={room.roomId}
                  onClick={() => !isDisabledByMode && onToggle(room.roomId)}
                  disabled={isDisabledByMode}
                  title={
                    isDisabledByMode
                      ? "ห้องว่าง — ไม่มีสัญญา"
                      : !hasContract
                        ? "ห้องนี้ไม่มีสัญญา (จะบันทึกใน Note ห้อง)"
                        : undefined
                  }
                  className={`relative flex flex-col items-start p-4 rounded-2xl border-2 transition-all duration-200 text-left w-full
                  ${
                    isDisabledByMode
                      ? "border-gray-200 bg-gray-100 opacity-50 cursor-not-allowed"
                      : isSel
                        ? "border-[#f3a638] bg-orange-50 shadow-md scale-[1.03]"
                        : `${meta.border} bg-white hover:scale-[1.01] shadow-sm`
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-2">
                    <span
                      className={`flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full ${meta.badge}`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${meta.dot}`}
                      />
                      {meta.label}
                    </span>
                    <div className="flex items-center gap-1">
                      {applyMode === "room" && !hasContract && (
                        <Building2 size={11} className="text-orange-400" />
                      )}
                      {isSel && (
                        <div className="bg-[#f3a638] text-white rounded-full p-0.5 shadow-sm">
                          <CheckCircle2 size={13} strokeWidth={3} />
                        </div>
                      )}
                      {!isSel && hasContract && applyMode === "monthly" && (
                        <Lock size={11} className="text-gray-300" />
                      )}
                      {!isSel && hasContract && applyMode === "contract" && (
                        <FileText size={11} className="text-gray-300" />
                      )}
                    </div>
                  </div>

                  <p className="text-xl font-black text-gray-800 leading-none mb-2">
                    {room.roomNumber}
                  </p>

                  <div
                    className={`w-full text-[11px] font-black px-2 py-1 rounded-xl text-center mb-1
                  ${room.monthlyRent ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-400"}`}
                  >
                    {room.monthlyRent
                      ? `${Number(room.monthlyRent).toLocaleString()} ฿/เดือน`
                      : !hasContract
                        ? "ไม่มีสัญญา"
                        : "ยังไม่กำหนด"}
                  </div>

                  {(showService || showDiscount) && (
                    <div className="w-full flex gap-1 mt-auto">
                      {showService && (
                        <div className="flex-1 text-[10px] font-black px-1.5 py-1 rounded-lg text-center bg-blue-100 text-blue-700">
                          +{(billService + noteService).toLocaleString()}฿
                          {noteService > 0 && billService === 0 && (
                            <span className="opacity-60"> 📌</span>
                          )}
                        </div>
                      )}
                      {showDiscount && (
                        <div className="flex-1 text-[10px] font-black px-1.5 py-1 rounded-lg text-center bg-emerald-100 text-emerald-700">
                          -{(billDiscount + noteDiscount).toLocaleString()}฿
                          {noteDiscount > 0 && billDiscount === 0 && (
                            <span className="opacity-60"> 📌</span>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="w-full mt-1 space-y-1">
                    {showRoomNote && (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenNoteDrawer({ room, type: "room" });
                        }}
                        className="w-full text-[10px] font-bold px-2 py-1 rounded-xl text-center bg-amber-50 text-amber-600 border border-amber-200 truncate hover:bg-amber-100 transition-colors"
                        title="แก้ไข Note ห้อง"
                      >
                        🏢 {room._roomNoteTags}{" "}
                        <Pencil size={9} className="inline ml-0.5 opacity-50" />
                      </div>
                    )}
                    {showContractNote && (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenNoteDrawer({ room, type: "contract" });
                        }}
                        className="w-full text-[10px] font-bold px-2 py-1 rounded-xl text-center bg-purple-50 text-purple-600 border border-purple-200 truncate hover:bg-purple-100 transition-colors"
                        title="แก้ไข Note สัญญา"
                      >
                        📝 {room._contractNoteTags}{" "}
                        <Pencil size={9} className="inline ml-0.5 opacity-50" />
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  },
);

/* ══════════════════════════════════════════════════════════════ */
/* Main Component                                                */
/* ══════════════════════════════════════════════════════════════ */
const UtilitySetting = () => {
  const navigate = useNavigate();

  const [roomsData, setRoomsData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [buildingFilter, setBuildingFilter] = useState("all");
  const [toast, setToast] = useState(null);
  const [recentConstants, setRecentConstants] = useState([]);
  const [applyMode, setApplyMode] = useState("monthly"); // monthly, contract, room

  const [modal, setModal] = useState(null);
  const [noteDrawerTarget, setNoteDrawerTarget] = useState(null); // { room, type: 'room' | 'contract' }
  const [rentValue, setRentValue] = useState("");
  const [serviceItems, setServiceItems] = useState([]);
  const [discountItems, setDiscountItems] = useState([]);
  const [usedServiceItems, setUsedServiceItems] = useState([]);
  const [usedDiscountItems, setUsedDiscountItems] = useState([]);

  const now = new Date();
  const curYear = now.getFullYear();
  const curMonth = now.getMonth() + 1;
  const currentMonthLabel = thaiMonth(curYear, curMonth);

  /* ── fetch ────────────────────────────────────────────────── */
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [roomRes, contractRes, constRes] = await Promise.all([
        roomService.getRoomOverview(),
        contractService.getAllContracts().catch(() => []),
        constantService.getConstants().catch(() => []),
      ]);

      const allConst = extractArray(constRes);
      const allContracts = extractArray(contractRes);
      const rawRooms = extractArray(roomRes);

      const contractByRoomId = {};
      allContracts.forEach((c) => {
        const cStatus = (c.status || c.Status || "").toLowerCase();
        if (["active", "reserved"].includes(cStatus)) {
          const rId = Number(c.roomId || c.RoomId);
          if (rId) contractByRoomId[rId] = c;
        }
      });

      let addByContract = {},
        discByContract = {};
      try {
        const monthPay = extractArray(
          await paymentService
            .getPaymentsByMonth(curYear, curMonth)
            .catch(() => []),
        );
        monthPay.forEach((p) => {
          const cId = Number(p.contractId || p.ContractId);
          if (!cId) return;
          if (Number(p.additionalCost) > 0)
            addByContract[cId] = { amount: Number(p.additionalCost) };
          if (Number(p.discountCost) > 0)
            discByContract[cId] = { amount: Number(p.discountCost) };
        });
      } catch (_) {}

      const enriched = rawRooms.map((room) => {
        const rId = Number(room.roomId || room.id);
        const contract = contractByRoomId[rId];
        const cId = contract ? Number(contract.id || contract.Id) : null;

        const rawRoomNote = room.roomNote ?? room.note ?? room.Note ?? "";
        const rawContractNote = contract
          ? (contract.note ?? contract.Note ?? "")
          : "";

        const rentFromNote =
          parseRentFromRoomNote(rawRoomNote) ||
          parseRentFromRoomNote(rawContractNote);
        const rServiceStr = parseServiceFromRoomNote(rawRoomNote);
        const cServiceStr = parseServiceFromRoomNote(rawContractNote);
        const rDiscountStr = parseDiscountFromRoomNote(rawRoomNote);
        const cDiscountStr = parseDiscountFromRoomNote(rawContractNote);

        const roomTagsMatch = rawRoomNote.match(/\{[^}]+\}/g) || [];
        const contractTagsMatch = rawContractNote.match(/\{[^}]+\}/g) || [];

        return {
          ...room,
          roomId: rId,
          _contractId: cId,
          _contract: contract ?? null,
          monthlyRent: contract
            ? Number(contract.monthlyRent || contract.MonthlyRent) ||
              rentFromNote ||
              null
            : rentFromNote || null,
          _additionalCost: cId ? (addByContract[cId]?.amount ?? 0) : 0,
          _discountCost: cId ? (discByContract[cId]?.amount ?? 0) : 0,

          // แยกตัวแปรคำนวณยอดเงินของ Room และ Contract ออกจากกัน
          _rNoteServiceAmt: sumFromNoteStr(rServiceStr),
          _cNoteServiceAmt: sumFromNoteStr(cServiceStr),
          _rNoteDiscountAmt: sumFromNoteStr(rDiscountStr),
          _cNoteDiscountAmt: sumFromNoteStr(cDiscountStr),

          _roomNoteTags:
            roomTagsMatch.length > 0 ? roomTagsMatch.join(" ") : null,
          _contractNoteTags:
            contractTagsMatch.length > 0 ? contractTagsMatch.join(" ") : null,
        };
      });

      setRoomsData(enriched);

      const filtered = allConst
        .filter(
          (c) => !["utility", "penalty"].includes(c.category?.toLowerCase()),
        )
        .sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0))
        .slice(0, 4)
        .map((c) => ({ name: c.subject, amount: Number(c.cost) }));
      setRecentConstants(filtered);
    } catch (e) {
      console.error(e);
      showToast("โหลดข้อมูลไม่สำเร็จ", "error");
    } finally {
      setIsLoading(false);
    }
  }, [curYear, curMonth]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const showToast = (msg, type = "success") => setToast({ message: msg, type });

  const buildings = useMemo(() => {
    const s = new Set();
    roomsData.forEach((r) => {
      if (r.roomBuilding) s.add(r.roomBuilding);
    });
    return [...s].sort();
  }, [roomsData]);

  const filteredRooms = useMemo(
    () =>
      roomsData.filter((r) => {
        const ms = String(r.roomNumber).includes(searchTerm);
        const mb =
          buildingFilter === "all" || r.roomBuilding === buildingFilter;
        return ms && mb;
      }),
    [roomsData, searchTerm, buildingFilter],
  );

  const roomsByFloor = useMemo(() => {
    const g = {};
    filteredRooms.forEach((r) => {
      const f = String(r.roomFloor || "1");
      if (!g[f]) g[f] = [];
      g[f].push(r);
    });
    Object.keys(g).forEach((f) =>
      g[f].sort((a, b) =>
        String(a.roomNumber).localeCompare(String(b.roomNumber), undefined, {
          numeric: true,
        }),
      ),
    );
    return g;
  }, [filteredRooms]);

  const floors = Object.keys(roomsByFloor).sort(
    (a, b) => Number(a) - Number(b),
  );

  const toggleRoom = useCallback((roomId) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(roomId) ? next.delete(roomId) : next.add(roomId);
      return next;
    });
  }, []);

  const selectFloor = useCallback(
    (floor) => {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        (roomsByFloor[floor] || []).forEach((r) => {
          if (applyMode === "room" || !!r._contractId) next.add(r.roomId);
        });
        return next;
      });
    },
    [roomsByFloor, applyMode],
  );

  const clearAll = () => setSelectedIds(new Set());

  const selectOccupied = () =>
    setSelectedIds(
      new Set(
        filteredRooms
          .filter(
            (r) =>
              (applyMode === "room" || !!r._contractId) &&
              (r.roomStatus || "").toLowerCase() === "occupied",
          )
          .map((r) => r.roomId),
      ),
    );
  const selectAllVisible = () =>
    setSelectedIds(
      new Set(
        filteredRooms
          .filter((r) => applyMode === "room" || !!r._contractId)
          .map((r) => r.roomId),
      ),
    );

  const selectedRoomObjects = useMemo(
    () => roomsData.filter((r) => selectedIds.has(r.roomId)),
    [roomsData, selectedIds],
  );
  const servicePresets = useMemo(
    () =>
      [
        ...usedServiceItems.slice(-4).reverse(),
        ...recentConstants.filter(
          (c) => !usedServiceItems.some((u) => u.name === c.name),
        ),
      ].slice(0, 4),
    [usedServiceItems, recentConstants],
  );
  const discountPresets = useMemo(
    () => usedDiscountItems.slice(-4).reverse(),
    [usedDiscountItems],
  );

  const handleSaveRent = async () => {
    setIsSaving(true);
    let ok = 0,
      fail = 0;
    try {
      for (const room of selectedRoomObjects) {
        try {
          if (applyMode === "room") {
            const rawNote = room.roomNote ?? room.note ?? room.Note ?? "";
            const cleaned = rawNote.replace(/\{ค่าเช่า:[^}]*\}/g, "").trim();
            const newNote =
              `${cleaned} {ค่าเช่า: ${Number(rentValue).toLocaleString()}฿}`
                .trim()
                .substring(0, 300);
            await roomService.updateRoom(room.roomId, {
              id: room.roomId,
              number: String(room.roomNumber),
              building: room.roomBuilding || "",
              floor: String(room.roomFloor || "1"),
              status: room.roomStatus || "available",
              note: newNote,
            });
            if (room._contractId && room._contract) {
              const c = room._contract;
              await contractService.putContract(room._contractId, {
                ...c,
                Id: Number(room._contractId),
                RoomId: Number(room.roomId),
                TenantId: Number(c.tenantId || c.TenantId),
                Status: c.status || c.Status || "Active",
                StartDate: c.startDate || c.StartDate,
                EndDate: c.endDate || c.EndDate,
                MonthlyRent: Number(rentValue),
              });
            }
          } else {
            const cId = room._contractId;
            const c = room._contract;
            if (!cId || !c) {
              fail++;
              continue;
            }
            await contractService.putContract(cId, {
              ...c,
              Id: Number(cId),
              RoomId: Number(room.roomId),
              TenantId: Number(c.tenantId || c.TenantId),
              Status: c.status || c.Status || "Active",
              StartDate: c.startDate || c.StartDate,
              EndDate: c.endDate || c.EndDate,
              MonthlyRent: Number(rentValue),
            });
          }
          ok++;
        } catch (e) {
          console.error(e?.response?.data ?? e.message);
          fail++;
        }
      }
      showToast(
        fail === 0
          ? `อัปเดตค่าเช่า ${ok} ห้อง`
          : `สำเร็จ ${ok} / ล้มเหลว ${fail}`,
        fail === 0 ? "success" : "error",
      );
      setModal(null);
      setSelectedIds(new Set());
      await fetchData();
    } finally {
      setIsSaving(false);
    }
  };

  const upsertBillOrRoomNote = async (room, payload) => {
    if (applyMode === "monthly") {
      const cId = room._contractId;
      if (!cId) throw new Error("no contract");
      const today = new Date().toISOString().split("T")[0];
      const payments = extractArray(
        await paymentService.getPaymentsByContract(cId),
      );
      const curBill = payments.find((p) => {
        const d = p.recordDate ? new Date(p.recordDate) : null;
        return (
          d && d.getFullYear() === curYear && d.getMonth() + 1 === curMonth
        );
      });
      if (curBill) {
        if ((curBill.status || "").toLowerCase() === "paid")
          throw new Error("paid");
        const billId = curBill.id || curBill.Id;
        const merged = {};
        if ("additionalCost" in payload) {
          merged.additionalCost =
            (Number(curBill.additionalCost) || 0) + payload.additionalCost;
          merged.additionalDetail = (
            (curBill.additionalDetail ? `${curBill.additionalDetail}, ` : "") +
            payload.additionalDetail
          ).substring(0, 200);
        }
        if ("discountCost" in payload) {
          merged.discountCost = payload.discountCost;
          merged.discountDetail = payload.discountDetail;
        }
        await paymentService.updatePayment(billId, merged);
      } else {
        await paymentService.createPayment({
          contractId: cId,
          adminId: 2,
          recordDate: today,
          ...payload,
        });
      }
    } else if (applyMode === "contract") {
      const cId = room._contractId;
      const c = room._contract;
      if (!cId || !c) throw new Error("no contract");
      const rawNote = c.note ?? c.Note ?? "";
      const tagType = "discountCost" in payload ? "ส่วนลด" : "ค่าบริการ";
      const tagVal =
        "discountCost" in payload
          ? payload.discountDetail
          : payload.additionalDetail;
      const tag = `{${tagType}: ${tagVal}}`;
      const cleaned = rawNote
        .replace(new RegExp(`\\{${tagType}:[^}]*\\}`, "g"), "")
        .trim();
      const newNote = `${cleaned} ${tag}`.trim().substring(0, 300);

      await contractService.putContract(cId, {
        ...c,
        Id: Number(cId),
        RoomId: Number(room.roomId),
        TenantId: Number(c.tenantId || c.TenantId),
        Status: c.status || c.Status || "Active",
        StartDate: c.startDate || c.StartDate,
        EndDate: c.endDate || c.EndDate,
        MonthlyRent: Number(c.monthlyRent || c.MonthlyRent || 0),
        Note: newNote,
      });
    } else {
      const rawNote = room.roomNote ?? room.note ?? room.Note ?? "";
      const tagType = "discountCost" in payload ? "ส่วนลด" : "ค่าบริการ";
      const tagVal =
        "discountCost" in payload
          ? payload.discountDetail
          : payload.additionalDetail;
      const tag = `{${tagType}: ${tagVal}}`;
      const cleaned = rawNote
        .replace(new RegExp(`\\{${tagType}:[^}]*\\}`, "g"), "")
        .trim();
      const newNote = `${cleaned} ${tag}`.trim().substring(0, 300);
      await roomService.updateRoom(room.roomId, {
        id: room.roomId,
        number: String(room.roomNumber),
        building: room.roomBuilding || "",
        floor: String(room.roomFloor || "1"),
        status: room.roomStatus || "available",
        note: newNote,
      });
    }
  };

  const handleSaveService = async () => {
    setIsSaving(true);
    let ok = 0,
      fail = 0,
      skipped = 0;
    const totalAmount = serviceItems.reduce((s, i) => s + Number(i.amount), 0);
    const detailStr = serviceItems
      .map((i) => `${i.name} (${Number(i.amount).toLocaleString()}฿)`)
      .join(", ");
    try {
      for (const room of selectedRoomObjects) {
        try {
          await upsertBillOrRoomNote(room, {
            additionalCost: totalAmount,
            additionalDetail: detailStr,
          });
          ok++;
        } catch (e) {
          if (e.message === "paid") skipped++;
          else fail++;
        }
      }
      setUsedServiceItems((prev) => {
        const m = [
          ...serviceItems.filter((s) => !prev.some((p) => p.name === s.name)),
          ...prev,
        ];
        return m.slice(0, 8);
      });
      showToast(
        [
          ok > 0 && `สำเร็จ ${ok} ห้อง`,
          skipped > 0 && `ข้าม ${skipped}`,
          fail > 0 && `ล้มเหลว ${fail}`,
        ]
          .filter(Boolean)
          .join(" / "),
        fail === 0 ? "success" : "error",
      );
      setModal(null);
      setSelectedIds(new Set());
      await fetchData();
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveDiscount = async () => {
    setIsSaving(true);
    let ok = 0,
      fail = 0,
      skipped = 0;
    const totalAmount = discountItems.reduce((s, i) => s + Number(i.amount), 0);
    const detailStr = discountItems
      .map((i) => `${i.name} (${Number(i.amount).toLocaleString()}฿)`)
      .join(", ");
    try {
      for (const room of selectedRoomObjects) {
        try {
          await upsertBillOrRoomNote(room, {
            discountCost: totalAmount,
            discountDetail: detailStr,
          });
          ok++;
        } catch (e) {
          if (e.message === "paid") skipped++;
          else fail++;
        }
      }
      setUsedDiscountItems((prev) => {
        const m = [
          ...discountItems.filter((d) => !prev.some((p) => p.name === d.name)),
          ...prev,
        ];
        return m.slice(0, 8);
      });
      showToast(
        [
          ok > 0 && `ส่วนลด ${ok} ห้อง`,
          skipped > 0 && `ข้าม ${skipped}`,
          fail > 0 && `ล้มเหลว ${fail}`,
        ]
          .filter(Boolean)
          .join(" / "),
        fail === 0 ? "success" : "error",
      );
      setModal(null);
      setSelectedIds(new Set());
      await fetchData();
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading && roomsData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-80 gap-4">
        <Loader2 className="animate-spin text-orange-400" size={40} />
        <p className="font-bold text-gray-500 animate-pulse">
          กำลังโหลดข้อมูล...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-36">
      <div className="relative text-center mb-8 px-4">
        <ExitButton
          onClick={() => navigate("/settings")}
          className="absolute right-0 top-0"
        />
        <h1 className="text-3xl font-bold text-center text-gray-800">
          กำหนดค่าเช่าห้องพักและบริการ
        </h1>
        <p className="text-sm text-gray-400 font-bold mt-1">
          {currentMonthLabel}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 mb-4 px-4">
        <div className="flex justify-center gap-3 w-full sm:w-auto flex-1">
          <div className="flex-1 sm:flex-none sm:w-100">
            <SearchBar
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <RefreshButton />
        </div>

        {buildings.length > 0 &&
          buildings.map((b) => (
            <button
              key={b}
              onClick={() =>
                setBuildingFilter(buildingFilter === b ? "all" : b)
              }
              className={`px-4 py-2 rounded-xl font-bold transition-all shadow-sm text-sm ${buildingFilter === b ? "bg-[#F5A623] text-white shadow-md" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
            >
              อาคาร {b}
            </button>
          ))}
        {buildings.length > 0 && (
          <button
            onClick={() => setBuildingFilter("all")}
            className={`px-4 py-2 rounded-xl font-bold transition-all shadow-sm text-sm ${buildingFilter === "all" ? "bg-[#F5A623] text-white shadow-md" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            ทุกอาคาร
          </button>
        )}
      </div>

      <div className="flex bg-gray-100 rounded-2xl p-1 mb-4 max-w-md mx-auto">
        {[
          {
            key: "monthly",
            label: "บิลเดือนนี้",
            icon: <Calendar size={14} />,
          },
          {
            key: "contract",
            label: "ผูกกับสัญญา",
            icon: <FileText size={14} />,
          },
          { key: "room", label: "ผูกกับห้อง", icon: <Building2 size={14} /> },
        ].map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => {
              setApplyMode(key);
              setSelectedIds(new Set());
            }}
            className={`flex-1 py-2.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5
              ${applyMode === key ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
          >
            {icon}
            {label}
          </button>
        ))}
      </div>

      <div className="flex gap-2 max-w-3xl mx-auto mb-6 px-4">
        <button
          onClick={selectAllVisible}
          className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-600 font-bold text-xs hover:bg-gray-200 transition-all"
        >
          เลือกทั้งหมด
        </button>
        <button
          onClick={selectOccupied}
          className="flex-1 py-2.5 rounded-xl bg-emerald-50 text-emerald-600 font-bold text-xs hover:bg-emerald-100 transition-all flex items-center justify-center gap-1.5"
        >
          <Users size={13} /> มีผู้เช่า
        </button>
        {selectedIds.size > 0 && (
          <button
            onClick={clearAll}
            className="px-4 py-2.5 rounded-xl bg-gray-100 text-gray-400 font-bold text-xs hover:bg-red-50 hover:text-red-400 transition-all flex items-center gap-1"
          >
            <X size={13} /> ล้าง ({selectedIds.size})
          </button>
        )}
      </div>

      <div className="space-y-8 px-4">
        {floors.length === 0 ? (
          <div className="text-center py-20 text-gray-400 font-bold">
            ไม่พบห้องที่ตรงกับเงื่อนไข
          </div>
        ) : (
          floors.map((floor) => (
            <LazyFloor
              key={floor}
              floor={floor}
              rooms={roomsByFloor[floor]}
              selectedIds={selectedIds}
              onToggle={toggleRoom}
              onSelectFloor={selectFloor}
              applyMode={applyMode}
              onOpenNoteDrawer={setNoteDrawerTarget}
            />
          ))
        )}
      </div>
        {/* footer */}
      <div
        className="
    fixed bottom-0 right-0 z-40 
    bg-white/90 backdrop-blur-md border-t border-gray-200 
    px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] 
    shadow-[0_-4px_24px_rgba(0,0,0,0.06)] 
    transition-all duration-300 
    left-0 lg:left-64
  "
      >
        {selectedIds.size === 0 ? (
          <p className="w-full text-center text-sm font-bold text-gray-400 py-1">
            เลือกห้องที่ต้องการแก้ไขก่อน
          </p>
        ) : (
          <div className="max-w-2xl mx-auto space-y-2">
            <p className="text-center text-xs font-black text-[#f3a638]">
              เลือกแล้ว {selectedIds.size} ห้อง ·{" "}
              {applyMode === "monthly"
                ? `บิลเดือน ${currentMonthLabel}`
                : applyMode === "contract"
                  ? "Note สัญญา (ตามสัญญาเช่า)"
                  : "Note ห้อง (ถาวร)"}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setModal("rent")}
                className="flex-1 py-3 rounded-2xl bg-[#f3a638] hover:bg-orange-500 text-white font-black text-xs shadow-lg shadow-orange-100 transition-all flex items-center justify-center gap-1.5"
              >
                <Home size={14} /> ค่าเช่า
              </button>
              <button
                onClick={() => setModal("service")}
                className="flex-1 py-3 rounded-2xl bg-blue-500 hover:bg-blue-600 text-white font-black text-xs shadow-lg shadow-blue-100 transition-all flex items-center justify-center gap-1.5"
              >
                <Tag size={14} /> ค่าบริการ
              </button>
              <button
                onClick={() => setModal("discount")}
                className="flex-1 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs shadow-lg shadow-emerald-100 transition-all flex items-center justify-center gap-1.5"
              >
                <Percent size={14} /> ส่วนลด
              </button>
              <button
                onClick={clearAll}
                className="px-3 py-3 rounded-2xl border-2 border-gray-200 text-gray-400 hover:bg-red-50 hover:border-red-200 hover:text-red-400 transition-all"
              >
                <X size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      {modal === "rent" && (
        <RentModal
          onClose={() => setModal(null)}
          onNext={(val) => {
            setRentValue(val);
            setModal("confirm-rent");
          }}
        />
      )}
      {modal === "service" && (
        <ItemListModal
          type="service"
          onClose={() => setModal(null)}
          recentItems={servicePresets}
          onNext={(items) => {
            setServiceItems(items);
            setModal("confirm-service");
          }}
        />
      )}
      {modal === "discount" && (
        <ItemListModal
          type="discount"
          onClose={() => setModal(null)}
          recentItems={discountPresets}
          onNext={(items) => {
            setDiscountItems(items);
            setModal("confirm-discount");
          }}
        />
      )}

      {modal === "confirm-rent" && (
        <ConfirmModal
          mode="rent"
          applyMode={applyMode}
          selectedCount={selectedIds.size}
          previewRoomNumbers={selectedRoomObjects.map((r) => r.roomNumber)}
          rentValue={rentValue}
          serviceItems={[]}
          discountItems={[]}
          currentMonthLabel={currentMonthLabel}
          onBack={() => setModal("rent")}
          onConfirm={handleSaveRent}
          isSaving={isSaving}
        />
      )}
      {modal === "confirm-service" && (
        <ConfirmModal
          mode="service"
          applyMode={applyMode}
          selectedCount={selectedIds.size}
          previewRoomNumbers={selectedRoomObjects.map((r) => r.roomNumber)}
          rentValue={0}
          serviceItems={serviceItems}
          discountItems={[]}
          currentMonthLabel={currentMonthLabel}
          onBack={() => setModal("service")}
          onConfirm={handleSaveService}
          isSaving={isSaving}
        />
      )}
      {modal === "confirm-discount" && (
        <ConfirmModal
          mode="discount"
          applyMode={applyMode}
          selectedCount={selectedIds.size}
          previewRoomNumbers={selectedRoomObjects.map((r) => r.roomNumber)}
          rentValue={0}
          serviceItems={[]}
          discountItems={discountItems}
          currentMonthLabel={currentMonthLabel}
          onBack={() => setModal("discount")}
          onConfirm={handleSaveDiscount}
          isSaving={isSaving}
        />
      )}

      {noteDrawerTarget && (
        <RoomNoteDrawer
          target={noteDrawerTarget}
          onClose={() => setNoteDrawerTarget(null)}
          onSaved={() => {
            setNoteDrawerTarget(null);
            fetchData();
          }}
        />
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default UtilitySetting;
