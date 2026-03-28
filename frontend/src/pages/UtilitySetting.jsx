import { useNavigate } from "react-router-dom";
import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Loader2, X, CheckCircle2, AlertCircle,
  Zap, Droplets, Lock, Pencil, Trash2, Settings, Info,
  Users, ArrowUpDown
} from "lucide-react";
import { ExitButton } from "../components/ActionButtons";
import SearchBar from "../components/SearchBar";

import { roomService }     from "../api/RoomApi";
import { contractService } from "../api/ContractApi";
import { constantService } from "../api/ConstantApi";

/* ─────────────────────────────────────────────────────────── */
/* Helpers                                                    */
/* ─────────────────────────────────────────────────────────── */
const extractArray = (res) => {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (res.$values) return res.$values;
  if (res.data && Array.isArray(res.data)) return res.data;
  if (res.data?.$values) return res.data.$values;
  return [];
};

const CONTRACT_OK = ["active", "reserved", "expired"];

const STATUS_META = {
  occupied:    { label: "มีผู้เช่า",   border: "border-emerald-400", dot: "bg-emerald-400", badge: "bg-emerald-50 text-emerald-700" },
  overdue:     { label: "ค้างชำระ",    border: "border-rose-400",    dot: "bg-rose-400",    badge: "bg-rose-50 text-rose-700"      },
  reserved:    { label: "ติดจอง",      border: "border-amber-400",   dot: "bg-amber-400",   badge: "bg-amber-50 text-amber-700"    },
  available:   { label: "ว่าง",        border: "border-gray-200",    dot: "bg-gray-300",    badge: "bg-gray-50 text-gray-500"      },
  maintenance: { label: "ปิดปรับปรุง", border: "border-gray-300",    dot: "bg-gray-400",    badge: "bg-gray-100 text-gray-500"     },
};

const parseElecTag  = (note) => note?.match(/\{ใช้ไฟ:\s*([^}]+)\}/)?.[1]?.trim()  ?? null;
const parseWaterTag = (note) => note?.match(/\{ใช้น้ำ:\s*([^}]+)\}/)?.[1]?.trim() ?? null;

const parseContractElecRate  = (note) => note?.match(/\{ค่าไฟ:\s*([\d.]+)\s*฿/)?.[1]  ?? null;
const parseContractWaterRate = (note) => note?.match(/\{ค่าน้ำ:\s*([\d.]+)\s*฿/)?.[1] ?? null;

const replaceTag = (raw, tagKey, newValue) => {
  const re      = new RegExp(`\\{${tagKey}:[^}]*\\}`, "g");
  const cleaned = (raw || "").replace(re, "").replace(/\s{2,}/g, " ").trim();
  return newValue !== null ? (cleaned ? `${cleaned} {${tagKey}: ${newValue}}` : `{${tagKey}: ${newValue}}`) : cleaned;
};

/* ─────────────────────────────────────────────────────────── */
/* Toast                                                      */
/* ─────────────────────────────────────────────────────────── */
const Toast = ({ message, type, onClose }) => {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={`fixed bottom-28 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl font-bold text-sm whitespace-nowrap
      ${type === "success" ? "bg-emerald-500 text-white" : "bg-red-500 text-white"}`}>
      {type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
      {message}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────── */
/* ConstantPanel — แก้ไขค่า ElectricityBill / WaterBill       */
/* ─────────────────────────────────────────────────────────── */
const ConstantPanel = ({ constants, onClose, onSaved }) => {
  const [items,  setItems]  = useState(constants.map(c => ({ ...c, _val: String(c.cost ?? ""), _editing: false })));
  const [saving, setSaving] = useState(null);

  const handleEdit = (id) => setItems(p => p.map(c => c.id === id ? { ...c, _editing: true } : c));
  const handleChange = (id, v) => setItems(p => p.map(c => c.id === id ? { ...c, _val: v } : c));

  const handleSave = async (item) => {
    if (!item._val || Number(item._val) <= 0) return;
    setSaving(item.id);
    try {
      await constantService.updateConstant(item.id, { ...item, cost: Number(item._val) });
      setItems(p => p.map(c => c.id === item.id ? { ...c, cost: Number(item._val), _editing: false } : c));
      onSaved?.();
    } catch (e) {
      console.error(e);
      alert("บันทึกไม่สำเร็จ");
    } finally {
      setSaving(null);
    }
  };

  const isElecItem = (item) =>
    item.subject?.toLowerCase().includes("electricity") || item.subject?.includes("ไฟ");

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-[40px] w-full max-w-sm shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}>

        <div className="flex justify-between items-center px-7 py-5 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-black text-gray-800">ค่า Constant น้ำ-ไฟ</h3>
            <p className="text-xs font-bold text-gray-400 mt-0.5">แก้ไขได้ ลบไม่ได้</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X size={20} strokeWidth={3} />
          </button>
        </div>

        <div className="px-7 py-5 space-y-3 max-h-[55vh] overflow-y-auto">
          {items.filter(item => item.subject !== 'priorityMeter').length === 0 && (
            <p className="text-center text-sm text-gray-400 font-bold py-6">
              ไม่พบ Constant<br />
              <span className="text-xs">(category="utility", subject มี ElectricityBill/WaterBill)</span>
            </p>
          )}
          {items.filter(item => item.subject !== 'priorityMeter').map(item => {
            const isElec = isElecItem(item);
            const bg  = isElec ? "bg-orange-50 border-orange-200" : "bg-blue-50 border-blue-200";
            const txt = isElec ? "text-orange-700" : "text-blue-700";
            return (
              <div key={item.id} className={`rounded-2xl border px-4 py-3 ${bg}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {isElec
                      ? <Zap size={13} className="text-orange-500" fill="currentColor" />
                      : <Droplets size={13} className="text-blue-500" fill="currentColor" />}
                    <span className={`text-xs font-black ${txt}`}>{item.subject}</span>
                  </div>
                  <button
                    onClick={() => item._editing ? handleSave(item) : handleEdit(item.id)}
                    disabled={saving === item.id}
                    className="p-1.5 rounded-lg bg-white/70 hover:bg-white transition-colors">
                    {saving === item.id
                      ? <Loader2 size={13} className="animate-spin" />
                      : item._editing
                        ? <CheckCircle2 size={14} strokeWidth={3} className={txt} />
                        : <Pencil size={12} strokeWidth={2.5} />}
                  </button>
                </div>
                {item._editing ? (
                  <div className="relative">
                    <input autoFocus type="number" min={0} step="0.5"
                      value={item._val}
                      onChange={e => handleChange(item.id, e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleSave(item)}
                      className={`w-full text-xl font-black text-center border-2 border-current/20 rounded-xl py-2 px-3 outline-none ${txt} bg-white
                                 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">฿/หน่วย</span>
                  </div>
                ) : (
                  <p className={`text-2xl font-black ${txt}`}>
                    {Number(item.cost).toLocaleString()}
                    <span className="text-xs font-bold ml-1 opacity-60">฿/หน่วย</span>
                  </p>
                )}
                {item.note && <p className="text-[10px] font-bold text-gray-400 mt-1">{item.note}</p>}
              </div>
            );
          })}
        </div>

        <div className="px-7 pb-6">
          <button onClick={onClose}
            className="w-full py-3 rounded-2xl border-2 border-gray-200 font-bold text-gray-500 hover:bg-gray-50 transition-all text-sm">
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────── */
/* ConfirmModal — กรอกอัตรา/เลือก constant แล้วยืนยัน         */
/* ─────────────────────────────────────────────────────────── */
const ConfirmModal = ({ applyMode, selectedRooms, utilityConsts, onClose, onConfirm, isSaving }) => {
  const noContract  = selectedRooms.filter(r => !r._hasActiveContract);

  const [elecRate,  setElecRate]  = useState("");
  const [waterRate, setWaterRate] = useState("");
  const [linkElec,  setLinkElec]  = useState(true);
  const [linkWater, setLinkWater] = useState(true);

  const PRESETS_E = [3, 4, 5, 6, 7, 8];
  const PRESETS_W = [10, 15, 18, 20, 25, 30];

  const elecConst  = utilityConsts.find(c => c.subject?.toLowerCase().includes("electricity") || c.subject?.includes("ไฟ"));
  const waterConst = utilityConsts.find(c => c.subject?.toLowerCase().includes("water")        || c.subject?.includes("น้ำ"));

  const canConfirm = applyMode === "contract"
    ? (Number(elecRate) > 0 || Number(waterRate) > 0)
    : (linkElec || linkWater);

  const RateInput = ({ label, icon: Icon, color, value, onChange, presets }) => (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Icon size={13} className={color === "orange" ? "text-orange-500" : "text-blue-500"} fill="currentColor" />
        <span className="text-sm font-black text-gray-700">{label}</span>
      </div>
      <div className="relative mb-2">
        <input type="number" min={0} step="0.5" value={value} onChange={e => onChange(e.target.value)}
          placeholder="ไม่เปลี่ยน"
          className={`w-full border-2 border-gray-200 ${color === "orange" ? "focus:border-orange-400" : "focus:border-blue-400"} rounded-2xl px-4 py-3 text-xl font-black text-gray-800 pr-20 outline-none transition-colors
                      [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`} />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-gray-400">฿/หน่วย</span>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {presets.map(v => (
          <button key={v} onClick={() => onChange(String(v))}
            className={`py-2 rounded-xl text-xs font-black border-2 transition-all
              ${String(v) === value
                ? color === "orange" ? "border-orange-400 bg-orange-50 text-orange-700" : "border-blue-400 bg-blue-50 text-blue-700"
                : "border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200"}`}>
            {v} ฿
          </button>
        ))}
      </div>
    </div>
  );

  const ConstToggle = ({ label, icon: Icon, color, linked, onToggle, constItem }) => (
    <button onClick={onToggle}
      className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left
        ${linked ? color === "orange" ? "border-orange-400 bg-orange-50" : "border-blue-400 bg-blue-50" : "border-gray-200 bg-gray-50"}`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0
        ${linked ? color === "orange" ? "bg-orange-200 text-orange-700" : "bg-blue-200 text-blue-700" : "bg-gray-200 text-gray-400"}`}>
        <Icon size={18} fill="currentColor" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`font-black text-sm ${linked ? color === "orange" ? "text-orange-800" : "text-blue-800" : "text-gray-600"}`}>{label}</p>
        {constItem && (
          <p className="text-xs font-bold text-gray-400 mt-0.5 truncate">
            {constItem.subject}: {Number(constItem.cost).toLocaleString()} ฿/หน่วย
          </p>
        )}
      </div>
      {linked && <CheckCircle2 size={18} className={color === "orange" ? "text-orange-500" : "text-blue-500"} strokeWidth={3} />}
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={e => e.target === e.currentTarget && !isSaving && onClose()}>
      <div className="bg-white rounded-[40px] w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={e => e.stopPropagation()}>

        {/* header */}
        <div className={`px-7 py-5 ${applyMode === "contract" ? "bg-orange-50" : "bg-purple-50"}`}>
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-black text-gray-800">
              {applyMode === "contract" ? "ตั้งอัตราค่าน้ำ-ไฟ" : "ผูกค่า Constant น้ำ-ไฟ"}
            </h3>
            {!isSaving && (
              <button onClick={onClose} className="p-1.5 hover:bg-black/10 rounded-full">
                <X size={18} strokeWidth={3} />
              </button>
            )}
          </div>
          <p className="text-xs font-bold text-gray-500 mt-1">
            {selectedRooms.length} ห้องที่เลือก
            {applyMode === "contract" && noContract.length > 0 && (
              <span className="text-orange-500 ml-1">· {noContract.length} ห้องไม่มีสัญญา → บันทึก Note ห้องแทน</span>
            )}
          </p>
        </div>

        <div className="overflow-y-auto flex-1 px-7 py-5 space-y-5">

          {applyMode === "contract" && (
            <>
              <RateInput label="ราคาค่าไฟ (฿/หน่วย)" icon={Zap} color="orange"
                value={elecRate} onChange={setElecRate} presets={PRESETS_E} />
              <div className="border-t border-dashed border-gray-200" />
              <RateInput label="ราคาค่าน้ำ (฿/หน่วย)" icon={Droplets} color="blue"
                value={waterRate} onChange={setWaterRate} presets={PRESETS_W} />
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
                <Info size={12} className="text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[11px] font-bold text-amber-700 leading-relaxed">
                  อัตราจะบันทึกใน <strong>Note ของสัญญา</strong> เช่น{" "}
                  <code className="bg-amber-100 rounded px-1">{"{ค่าไฟ: 5฿/หน่วย}"}</code> เพื่อใช้อ้างอิงออกบิล
                </p>
              </div>
            </>
          )}

          {applyMode === "constant" && (
            <>
              <p className="text-sm font-bold text-gray-600">เลือกว่าจะผูกอะไรกับ Constant:</p>
              <ConstToggle label="ใช้ค่าไฟจาก Constant" icon={Zap} color="orange"
                linked={linkElec} onToggle={() => setLinkElec(p => !p)} constItem={elecConst} />
              <ConstToggle label="ใช้ค่าน้ำจาก Constant" icon={Droplets} color="blue"
                linked={linkWater} onToggle={() => setLinkWater(p => !p)} constItem={waterConst} />
              <div className="flex items-start gap-2 bg-purple-50 border border-purple-200 rounded-2xl px-4 py-3">
                <Info size={12} className="text-purple-500 shrink-0 mt-0.5" />
                <p className="text-[11px] font-bold text-purple-700 leading-relaxed">
                  บันทึก tagใน <strong>Note ห้อง</strong> เช่น{" "}
                  <code className="bg-purple-100 rounded px-1">{"{ใช้ไฟ: constant}"}</code> แก้ไข/ลบได้ภายหลัง
                </p>
              </div>

              {/* preview rooms */}
              <div className="flex flex-wrap gap-1.5">
                {selectedRooms.slice(0, 20).map(r => (
                  <span key={r.roomId} className="px-2.5 py-1 bg-gray-100 rounded-lg text-xs font-black text-gray-600">
                    {r.roomNumber}
                  </span>
                ))}
                {selectedRooms.length > 20 && (
                  <span className="px-2.5 py-1 bg-gray-100 rounded-lg text-xs font-bold text-gray-400">
                    +{selectedRooms.length - 20} ห้อง
                  </span>
                )}
              </div>
            </>
          )}
        </div>

        <div className="flex gap-3 px-7 py-5 border-t border-gray-100">
          <button onClick={onClose} disabled={isSaving}
            className="flex-1 py-3 rounded-2xl border-2 border-gray-200 font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-all text-sm">
            ← ยกเลิก
          </button>
          <button
            onClick={() => canConfirm && onConfirm({ elecRate: Number(elecRate) || null, waterRate: Number(waterRate) || null, linkElec, linkWater })}
            disabled={isSaving || !canConfirm}
            className="flex-1 py-3 rounded-2xl bg-[#f3a638] hover:bg-orange-500 text-white font-black text-sm disabled:opacity-50 transition-all flex items-center justify-center gap-2">
            {isSaving ? <><Loader2 size={15} className="animate-spin" />กำลังบันทึก...</> : <><CheckCircle2 size={15} />ยืนยัน</>}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────── */
/* NoteTagDrawer — แก้ไข {ใช้ไฟ} {ใช้น้ำ} ใน room note        */
/* ─────────────────────────────────────────────────────────── */
const NoteTagDrawer = ({ room, onClose, onSaved }) => {
  const rawNote  = room.roomNote ?? room.note ?? room.Note ?? "";
  const [elec,   setElec]   = useState(parseElecTag(rawNote));
  const [water,  setWater]  = useState(parseWaterTag(rawNote));
  const [editE,  setEditE]  = useState(false);
  const [editW,  setEditW]  = useState(false);
  const [saving, setSaving] = useState(false);

  const doSave = async () => {
    setSaving(true);
    try {
      let n = rawNote;
      n = replaceTag(n, "ใช้ไฟ",  elec);
      n = replaceTag(n, "ใช้น้ำ", water);
      await roomService.updateRoom(room.roomId, {
        id: room.roomId, number: String(room.roomNumber),
        building: room.roomBuilding || "", floor: String(room.roomFloor || "1"),
        status: room.roomStatus || "available", note: n.substring(0, 500),
      });
      onSaved();
    } catch (e) {
      console.error(e); alert("บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  const TagRow = ({ label, icon: Icon, color, val, setVal, editing, setEditing, onDelete }) => (
    <div className={`rounded-2xl border px-4 py-3 transition-colors
      ${val !== null ? color === "orange" ? "bg-orange-50 border-orange-200" : "bg-blue-50 border-blue-200" : "bg-gray-50 border-gray-200"}`}>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <Icon size={13} className={val !== null ? color === "orange" ? "text-orange-500" : "text-blue-500" : "text-gray-400"} fill="currentColor" />
          <span className={`text-xs font-black ${val !== null ? color === "orange" ? "text-orange-600" : "text-blue-600" : "text-gray-400"}`}>{label}</span>
        </div>
        {val !== null && (
          <div className="flex gap-1">
            <button onClick={() => setEditing(p => !p)} className="p-1.5 rounded-lg bg-white/70 hover:bg-white transition-colors">
              {editing
                ? <CheckCircle2 size={13} strokeWidth={3} className={color === "orange" ? "text-orange-500" : "text-blue-500"} />
                : <Pencil size={12} strokeWidth={2.5} />}
            </button>
            <button onClick={onDelete} className="p-1.5 rounded-lg bg-white/70 hover:bg-red-100 hover:text-red-500 transition-colors">
              <Trash2 size={12} strokeWidth={2.5} />
            </button>
          </div>
        )}
      </div>
      {val === null
        ? <p className="text-xs font-bold text-gray-400 italic">ไม่ได้ผูก Constant</p>
        : editing
          ? <input autoFocus value={val} onChange={e => setVal(e.target.value)}
              onKeyDown={e => e.key === "Enter" && setEditing(false)}
              className="w-full text-sm font-bold bg-white rounded-xl px-3 py-1.5 border border-current/20 outline-none" />
          : <p className={`text-sm font-bold ${color === "orange" ? "text-orange-700" : "text-blue-700"}`}>{val}</p>}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-[40px] w-full max-w-md shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center px-7 py-5 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-black text-gray-800">Note ห้อง {room.roomNumber}</h3>
            <p className="text-xs font-bold text-gray-400 mt-0.5">แก้ไข/ลบการผูก Constant น้ำ-ไฟ</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} strokeWidth={3} /></button>
        </div>
        <div className="px-7 py-5 space-y-3">
          <TagRow label="ใช้ไฟ" icon={Zap} color="orange"
            val={elec} setVal={setElec} editing={editE} setEditing={setEditE}
            onDelete={() => { setElec(null); setEditE(false); }} />
          <TagRow label="ใช้น้ำ" icon={Droplets} color="blue"
            val={water} setVal={setWater} editing={editW} setEditing={setEditW}
            onDelete={() => { setWater(null); setEditW(false); }} />
        </div>
        <div className="flex gap-3 px-7 pb-6">
          <button onClick={onClose} disabled={saving}
            className="flex-1 py-3 rounded-2xl border-2 border-gray-200 font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-50 text-sm">
            ยกเลิก
          </button>
          <button onClick={doSave} disabled={saving}
            className="flex-1 py-3 rounded-2xl bg-[#f3a638] hover:bg-orange-500 text-white font-black text-sm disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <><Loader2 size={15} className="animate-spin" />บันทึก...</> : <><CheckCircle2 size={15} />บันทึก</>}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────── */
/* LazyFloor                                                  */
/* ─────────────────────────────────────────────────────────── */
const LazyFloor = React.memo(({ floor, rooms, selectedIds, applyMode, onToggle, onSelectFloor, onOpenNoteDrawer }) => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { rootMargin: "200px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} className="bg-gray-50 p-4 sm:p-6 rounded-3xl border border-gray-100">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl font-bold text-gray-700 flex items-center gap-2">
          <span className="bg-gray-200 text-gray-600 w-8 h-8 rounded-full flex items-center justify-center text-sm font-black shrink-0">{floor}</span>
          ชั้น {floor}
        </h2>
        <button onClick={() => onSelectFloor(floor)}
          className="text-xs font-black text-[#f3a638] px-3 py-1.5 rounded-xl hover:bg-orange-100 transition-all">
          เลือกทั้งชั้น
        </button>
      </div>

      {!visible ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {rooms.map(r => <div key={r.roomId} className="h-32 rounded-2xl bg-gray-200 animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {rooms.map(room => {
            const status   = (room.roomStatus || "available").toLowerCase();
            const meta     = STATUS_META[status] || STATUS_META.available;
            const isSel    = selectedIds.has(room.roomId);
            const disabled = applyMode === "contract" && !room._hasActiveContract;

            return (
              /* แก้ DOM Nesting Error: เปลี่ยน <button> เป็น <div role="button"> */
              <div key={room.roomId}
                role="button"
                tabIndex={0}
                onClick={() => !disabled && onToggle(room.roomId)}
                title={disabled ? "ห้องนี้ไม่มีสัญญา Active/Reserved/Expired" : undefined}
                className={`relative flex flex-col items-start p-3 sm:p-4 rounded-2xl border-2 transition-all duration-200 text-left w-full cursor-pointer
                  ${disabled
                    ? "border-gray-200 bg-gray-100 opacity-40 cursor-not-allowed"
                    : isSel
                      ? "border-[#f3a638] bg-orange-50 shadow-md scale-[1.03]"
                      : `${meta.border} bg-white hover:scale-[1.01] shadow-sm`}`}>

                {/* top: status badge + check/lock */}
                <div className="flex items-center justify-between w-full mb-2">
                  <span className={`flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full ${meta.badge}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                    {meta.label}
                  </span>
                  <div className="flex items-center gap-1">
                    {isSel && <div className="bg-[#f3a638] text-white rounded-full p-0.5 shadow-sm"><CheckCircle2 size={13} strokeWidth={3} /></div>}
                    {disabled && <Lock size={11} className="text-gray-300" />}
                  </div>
                </div>

                {/* room number */}
                <p className="text-xl font-black text-gray-800 leading-none mb-2">{room.roomNumber}</p>

                {/* อัตราจาก contract note */}
                <div className="w-full space-y-1">
                  <div className={`w-full text-[10px] font-black px-2 py-1 rounded-xl text-center flex items-center justify-center gap-1
                    ${room._contractElecRate ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-400"}`}>
                    <Zap size={8} fill="currentColor" />
                    {room._contractElecRate ? `${room._contractElecRate} ฿/หน่วย` : "ไฟ ยังไม่กำหนด"}
                  </div>
                  <div className={`w-full text-[10px] font-black px-2 py-1 rounded-xl text-center flex items-center justify-center gap-1
                    ${room._contractWaterRate ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-400"}`}>
                    <Droplets size={8} fill="currentColor" />
                    {room._contractWaterRate ? `${room._contractWaterRate} ฿/หน่วย` : "น้ำ ยังไม่กำหนด"}
                  </div>
                </div>

                {/* constant tag badge — คลิกเพื่อแก้ไข */}
                {(room._elecTag || room._waterTag) && (
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={e => { e.stopPropagation(); onOpenNoteDrawer(room); }}
                    className="w-full mt-1.5 text-[10px] font-bold px-2 py-1 rounded-xl text-center bg-purple-50 text-purple-600 border border-purple-200 hover:bg-purple-100 transition-colors truncate cursor-pointer"
                    title="คลิกเพื่อแก้ไข">
                    📌 {[room._elecTag && "⚡Const", room._waterTag && "💧Const"].filter(Boolean).join(" · ")}
                    <Pencil size={8} className="inline ml-1 opacity-50" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});

/* ─────────────────────────────────────────────────────────── */
/* Main                                                       */
/* ─────────────────────────────────────────────────────────── */
const UtilityRateSetting = () => {
  const navigate = useNavigate();

  const [roomsData,      setRoomsData]      = useState([]);
  const [isLoading,      setIsLoading]      = useState(true);
  const [isSaving,       setIsSaving]       = useState(false);
  const [searchTerm,     setSearchTerm]     = useState("");
  const [selectedIds,    setSelectedIds]    = useState(new Set());
  const [buildingFilter, setBuildingFilter] = useState("all");
  const [applyMode,      setApplyMode]      = useState("contract");
  const [toast,          setToast]          = useState(null);
  const [utilityConsts,  setUtilityConsts]  = useState([]);

  // State Priority
  const [priorityMeter,  setPriorityMeter]  = useState(null);
  const [isTogglingPriority, setIsTogglingPriority] = useState(false);

  const [showConfirm,    setShowConfirm]    = useState(false);
  const [showConstPanel, setShowConstPanel] = useState(false);
  const [noteDrawerRoom, setNoteDrawerRoom] = useState(null);

  const showToast = useCallback((msg, type = "success") => setToast({ message: msg, type }), []);

  /* fetch */
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [roomRes, contractRes, constRes] = await Promise.all([
        roomService.getRoomOverview(),
        contractService.getAllContracts().catch(() => []),
        constantService.getConstants().catch(() => []),
      ]);

      const allConst     = extractArray(constRes);
      const allContracts = extractArray(contractRes);
      const rawRooms     = extractArray(roomRes);

      setUtilityConsts(allConst.filter(c => c.category?.toLowerCase() === "utility"));

      // ดึง priorityMeter
      const pMeter = allConst.find(c => c.subject === "priorityMeter");
      if (pMeter) setPriorityMeter(pMeter);

      const contractByRoomId = {};
      allContracts.forEach(c => {
        if (CONTRACT_OK.includes((c.status || c.Status || "").toLowerCase())) {
          const rId = Number(c.roomId || c.RoomId);
          if (rId) contractByRoomId[rId] = c;
        }
      });

      const enriched = rawRooms.map(room => {
        const rId      = Number(room.roomId || room.id);
        const contract = contractByRoomId[rId];
        const cId      = contract ? Number(contract.id || contract.Id) : null;

        const rawNote      = room.roomNote ?? room.note ?? room.Note ?? "";
        const contractNote = contract
          ? (contract.note || contract.Note || contract.attachedFile || contract.AttachedFile || "")
          : "";

        return {
          ...room,
          roomId:              rId,
          _contractId:         cId,
          _contract:           contract ?? null,
          _hasActiveContract:  !!contract,
          _contractStatus:     contract ? (contract.status || contract.Status || "") : "",
          _elecTag:            parseElecTag(rawNote),
          _waterTag:           parseWaterTag(rawNote),
          _contractElecRate:   parseContractElecRate(contractNote),
          _contractWaterRate:  parseContractWaterRate(contractNote),
          _rawNote:            rawNote,
        };
      });

      setRoomsData(enriched);
    } catch (e) {
      console.error(e);
      showToast("โหลดข้อมูลไม่สำเร็จ", "error");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* derived */
  const buildings = useMemo(() => {
    const s = new Set();
    roomsData.forEach(r => { if (r.roomBuilding) s.add(r.roomBuilding); });
    return [...s].sort();
  }, [roomsData]);

  const filteredRooms = useMemo(() =>
    roomsData.filter(r => {
      const ms = String(r.roomNumber).includes(searchTerm);
      const mb = buildingFilter === "all" || r.roomBuilding === buildingFilter;
      return ms && mb;
    }), [roomsData, searchTerm, buildingFilter]);

  const roomsByFloor = useMemo(() => {
    const g = {};
    filteredRooms.forEach(r => {
      const f = String(r.roomFloor || "1");
      if (!g[f]) g[f] = [];
      g[f].push(r);
    });
    Object.keys(g).forEach(f =>
      g[f].sort((a, b) => String(a.roomNumber).localeCompare(String(b.roomNumber), undefined, { numeric: true }))
    );
    return g;
  }, [filteredRooms]);

  const floors = Object.keys(roomsByFloor).sort((a, b) => Number(a) - Number(b));

  /* selection */
  const isRoomSelectable = useCallback((room) =>
    applyMode === "constant" || room._hasActiveContract, [applyMode]);

  const toggleRoom = useCallback((id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const selectFloor = useCallback((floor) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      (roomsByFloor[floor] || []).forEach(r => { if (isRoomSelectable(r)) next.add(r.roomId); });
      return next;
    });
  }, [roomsByFloor, isRoomSelectable]);

  const selectAllVisible = useCallback(() =>
    setSelectedIds(new Set(filteredRooms.filter(isRoomSelectable).map(r => r.roomId))),
    [filteredRooms, isRoomSelectable]);

  const selectOccupied = useCallback(() =>
    setSelectedIds(new Set(
      filteredRooms.filter(r => (r.roomStatus || "").toLowerCase() === "occupied" && isRoomSelectable(r)).map(r => r.roomId)
    )), [filteredRooms, isRoomSelectable]);

  const clearAll = useCallback(() => setSelectedIds(new Set()), []);

  const selectedCount    = selectedIds.size;
  const selectedRoomObjs = useMemo(() => roomsData.filter(r => selectedIds.has(r.roomId)), [roomsData, selectedIds]);

  /* Priority Toggle API */
  const handleTogglePriority = async () => {
    if (!priorityMeter) return;
    setIsTogglingPriority(true);
    try {
      const newNote = priorityMeter.note === 'constant' ? 'contract' : 'constant';
      await constantService.updateConstant(priorityMeter.id, {
        ...priorityMeter,
        note: newNote
      });
      setPriorityMeter({ ...priorityMeter, note: newNote });
      showToast(`เปลี่ยนลำดับการคำนวณเป็นแบบ ${newNote === 'constant' ? 'Constant' : 'สัญญา'} แล้ว`, "success");
    } catch (e) {
      console.error(e);
      showToast("ปรับ Priority ไม่สำเร็จ", "error");
    } finally {
      setIsTogglingPriority(false);
    }
  };

  /* save */
  const handleConfirm = async ({ elecRate, waterRate, linkElec, linkWater }) => {
    setIsSaving(true);
    let ok = 0, fail = 0;
    try {
      for (const room of selectedRoomObjs) {
        try {
          if (applyMode === "contract") {
            if (room._contract) {
              const c = room._contract;
              let cNote = c.note || c.Note || c.attachedFile || c.AttachedFile || "";
              if (elecRate)  cNote = replaceTag(cNote, "ค่าไฟ",  `${elecRate}฿/หน่วย`);
              if (waterRate) cNote = replaceTag(cNote, "ค่าน้ำ", `${waterRate}฿/หน่วย`);
              await contractService.putContract(room._contractId, {
                Id:          Number(room._contractId),
                RoomId:      Number(room.roomId),
                TenantId:    Number(c.tenantId    || c.TenantId),
                Status:      c.status     || c.Status     || "Active",
                StartDate:   c.startDate  || c.StartDate,
                EndDate:     c.endDate    || c.EndDate,
                MonthlyRent: Number(c.monthlyRent || c.MonthlyRent || 0),
                Deposit:     Number(c.deposit     || c.Deposit     || 0),
                InitialElectricUnit: c.initialElectricUnit || c.InitialElectricUnit || 0,
                InitialWaterUnit:    c.initialWaterUnit    || c.InitialWaterUnit    || 0,
                Note: cNote.substring(0, 500),
              });
            } else {
              // fallback: ห้องไม่มีสัญญา บันทึก room note แทน
              let rNote = room._rawNote || "";
              if (elecRate)  rNote = replaceTag(rNote, "ค่าไฟ",  `${elecRate}฿/หน่วย`);
              if (waterRate) rNote = replaceTag(rNote, "ค่าน้ำ", `${waterRate}฿/หน่วย`);
              await roomService.updateRoom(room.roomId, {
                id: room.roomId, number: String(room.roomNumber),
                building: room.roomBuilding || "", floor: String(room.roomFloor || "1"),
                status: room.roomStatus || "available", note: rNote.substring(0, 500),
              });
            }
          } else {
            // constant mode: บันทึก {ใช้ไฟ} {ใช้น้ำ} ใน room note
            let rNote = room._rawNote || "";
            if (linkElec)  rNote = replaceTag(rNote, "ใช้ไฟ",  "constant");
            if (linkWater) rNote = replaceTag(rNote, "ใช้น้ำ", "constant");
            await roomService.updateRoom(room.roomId, {
              id: room.roomId, number: String(room.roomNumber),
              building: room.roomBuilding || "", floor: String(room.roomFloor || "1"),
              status: room.roomStatus || "available", note: rNote.substring(0, 500),
            });
          }
          ok++;
        } catch (e) {
          console.error("Save fail room", room.roomNumber, e?.response?.data ?? e.message);
          fail++;
        }
      }
      showToast(fail === 0 ? `บันทึก ${ok} ห้อง เรียบร้อย` : `สำเร็จ ${ok} / ล้มเหลว ${fail} ห้อง`, fail === 0 ? "success" : "error");
      setSelectedIds(new Set());
      setShowConfirm(false);
      await fetchData();
    } finally {
      setIsSaving(false);
    }
  };

  /* loading */
  if (isLoading && roomsData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-80 gap-4">
        <Loader2 className="animate-spin text-orange-400" size={40} />
        <p className="font-bold text-gray-500 animate-pulse">กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  /* Render Current Constant Info */
  const elecConstValue  = utilityConsts.find(c => c.subject?.toLowerCase().includes("electricity") || c.subject?.includes("ไฟ"))?.cost || 0;
  const waterConstValue = utilityConsts.find(c => c.subject?.toLowerCase().includes("water") || c.subject?.includes("น้ำ"))?.cost || 0;

  /* render */
  return (
    <div className="min-h-screen flex flex-col pb-36">

      {/* Header */}
      <div className="relative text-center mb-6 px-4">
        <ExitButton onClick={() => navigate("/settings")} className="absolute right-0 top-0" />
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">ตั้งค่าอัตรา น้ำ-ไฟ</h1>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col items-center gap-4 mb-6 px-4">
        
        {/* แสดง Constant ปัจจุบัน */}
        <div className="flex gap-4 w-full max-w-3xl justify-center">
          <div className="flex items-center gap-2 px-4 py-2 bg-orange-50 border border-orange-100 rounded-2xl shadow-sm">
            <Zap size={14} className="text-orange-500" fill="currentColor" />
            <span className="text-sm font-black text-orange-700">ค่าไฟกลาง: {elecConstValue} ฿</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-100 rounded-2xl shadow-sm">
            <Droplets size={14} className="text-blue-500" fill="currentColor" />
            <span className="text-sm font-black text-blue-700">ค่าน้ำกลาง: {waterConstValue} ฿</span>
          </div>
        </div>

        {/* Search + Priority Button + Constant button */}
        <div className="flex w-full max-w-3xl gap-3">
          <div className="flex-1">
            <SearchBar value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          
          {priorityMeter && (
            <button 
              onClick={handleTogglePriority} 
              disabled={isTogglingPriority}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2.5 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 font-bold text-sm hover:bg-indigo-100 transition-all shrink-0 shadow-sm">
              {isTogglingPriority ? <Loader2 size={15} className="animate-spin" /> : <ArrowUpDown size={15} />}
              <span className="hidden sm:inline">Priority: {priorityMeter.note === 'constant' ? 'Constant' : 'สัญญา'}</span>
            </button>
          )}

          <button onClick={() => setShowConstPanel(true)}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2.5 rounded-2xl bg-gray-100 text-gray-600 font-bold text-sm hover:bg-gray-200 transition-all shrink-0">
            <Settings size={15} />
            <span className="hidden sm:inline">Constant</span>
          </button>
        </div>

        {/* Mode toggle */}
        <div className="flex justify-center w-full max-w-3xl">
          <div className="flex bg-gray-100 rounded-2xl p-1 w-full">
            {[
              { key: "contract", label: "📋 ผูกกับสัญญา" },
              { key: "constant", label: "📌 ผูกกับ Constant" },
            ].map(({ key, label }) => (
              <button key={key} onClick={() => { setApplyMode(key); setSelectedIds(new Set()); }}
                className={`flex-1 py-2.5 rounded-xl font-black text-sm transition-all
                  ${applyMode === key ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Info hint */}
        {/* <div className={`w-full max-w-3xl text-xs font-bold px-4 py-2.5 rounded-2xl flex items-start gap-2
          ${applyMode === "contract" ? "bg-orange-50 text-orange-700 border border-orange-200" : "bg-purple-50 text-purple-700 border border-purple-200"}`}>
          <Info size={12} className="shrink-0 mt-0.5" />
          {applyMode === "contract"
            ? "บันทึกอัตราใน Note สัญญา เช่น {ค่าไฟ: 5฿/หน่วย} · ห้องที่ไม่มีสัญญาจะถูก disabled"
            : "บันทึก {ใช้ไฟ: constant} {ใช้น้ำ: constant} ใน Note ห้อง · ทุกห้องกดได้"}
        </div> */}

        {/* Building filter (Centered) */}
        {buildings.length > 1 && (
          <div className="flex justify-center gap-2 w-full max-w-3xl overflow-x-auto pb-1 no-scrollbar mx-auto">
            {["all", ...buildings].map(b => (
              <button key={b} onClick={() => setBuildingFilter(b)}
                className={`px-4 py-2 rounded-2xl font-black text-sm whitespace-nowrap transition-all shrink-0
                  ${buildingFilter === b ? "bg-[#f3a638] text-white shadow-md" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
                {b === "all" ? "ทุกอาคาร" : `อาคาร ${b}`}
              </button>
            ))}
          </div>
        )}

        {/* Quick select (Pattern แบบที่ให้มา) */}
        <div className="flex gap-2 max-w-3xl w-full mx-auto mb-2">
          <button onClick={selectAllVisible}
            className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-600 font-bold text-xs hover:bg-gray-200 transition-all">
            เลือกทั้งหมด
          </button>
          <button onClick={selectOccupied}
            className="flex-1 py-2.5 rounded-xl bg-emerald-50 text-emerald-600 font-bold text-xs hover:bg-emerald-100 transition-all flex items-center justify-center gap-1.5">
            <Users size={13} /> มีผู้เช่า
          </button>
          {selectedIds.size > 0 && (
            <button onClick={clearAll}
              className="px-4 py-2.5 rounded-xl bg-gray-100 text-gray-400 font-bold text-xs hover:bg-red-50 hover:text-red-400 transition-all flex items-center justify-center gap-1">
              <X size={13} /> ล้าง ({selectedIds.size})
            </button>
          )}
        </div>
      </div>

      {/* Room grid */}
      <div className="space-y-6 px-4">
        {floors.length === 0
          ? <div className="text-center py-20 text-gray-400 font-bold">ไม่พบห้องที่ตรงกับเงื่อนไข</div>
          : floors.map(floor => (
            <LazyFloor key={floor} floor={floor} rooms={roomsByFloor[floor]}
              selectedIds={selectedIds} applyMode={applyMode}
              onToggle={toggleRoom} onSelectFloor={selectFloor}
              onOpenNoteDrawer={setNoteDrawerRoom} />
          ))}
      </div>

      {/* Saving overlay */}
      {isSaving && (
        <div className="fixed inset-0 z-[55] flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="bg-white rounded-3xl px-8 py-6 shadow-2xl flex items-center gap-4">
            <Loader2 className="animate-spin text-orange-400" size={28} />
            <p className="font-black text-gray-700">กำลังบันทึก...</p>
          </div>
        </div>
      )}

      {/* Sticky footer */}
      <div className="fixed bottom-0 left-0 md:left-64 right-0 bg-white/90 backdrop-blur-md border-t border-gray-200 px-4 py-4 z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        {selectedCount === 0 ? (
          <p className="text-center text-sm font-bold text-gray-400">เลือกห้องที่ต้องการตั้งค่าก่อน</p>
        ) : (
          <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
            <div>
              <p className="font-black text-[#f3a638] text-sm">เลือกแล้ว {selectedCount} ห้อง</p>
              <p className="text-[10px] font-bold text-gray-400">
                {applyMode === "contract" ? "โหมด: ผูกกับสัญญา" : "โหมด: ผูกกับ Constant"}
              </p>
            </div>
            <button onClick={() => setShowConfirm(true)}
              className="px-6 py-3 rounded-2xl bg-[#f3a638] hover:bg-orange-500 text-white font-black text-sm shadow-lg transition-all flex items-center gap-2 shrink-0">
              <CheckCircle2 size={16} />
              {applyMode === "contract" ? "ตั้งค่าอัตรา" : "ผูก Constant"}
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      {showConfirm && (
        <ConfirmModal applyMode={applyMode} selectedRooms={selectedRoomObjs}
          utilityConsts={utilityConsts} isSaving={isSaving}
          onClose={() => !isSaving && setShowConfirm(false)}
          onConfirm={handleConfirm} />
      )}

      {showConstPanel && (
        <ConstantPanel constants={utilityConsts}
          onClose={() => setShowConstPanel(false)}
          onSaved={fetchData} />
      )}

      {noteDrawerRoom && (
        <NoteTagDrawer room={noteDrawerRoom}
          onClose={() => setNoteDrawerRoom(null)}
          onSaved={() => { setNoteDrawerRoom(null); fetchData(); }} />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default UtilityRateSetting;