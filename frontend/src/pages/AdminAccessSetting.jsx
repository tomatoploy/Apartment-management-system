import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Loader2, X, CheckCircle2, AlertCircle, Plus,
  ShieldCheck, UserCog, Mail, Phone, Search, UserMinus, Lock
} from "lucide-react";
import { ExitButton } from "../components/ActionButtons";
import SearchBar from "../components/SearchBar";

import { adminService } from "../api/AdminApi";
import { permissionService } from "../api/PermissionApi";

/* ── Helpers ──────────────────────────────────────────────────── */
const extractArray = (res) => {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (res.$values) return res.$values;
  if (res.data && Array.isArray(res.data)) return res.data;
  if (res.data?.$values) return res.data.$values;
  return [];
};

/* ── Sub-components ───────────────────────────────────────────── */
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

/* ── Modal: เพิ่มแอดมินด้วยเบอร์โทร ─────────────────────────────── */
const AddPermissionModal = ({ onClose, onSaved }) => {
  const [phone, setPhone] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState("");

  const handleSearchAndAdd = async (e) => {
    e.preventDefault();
    if (phone.length < 10) return setError("กรุณากรอกเบอร์โทรศัพท์ให้ครบ 10 หลัก");

    setIsSearching(true);
    setError("");
    try {
      const allAdmins = extractArray(await adminService.getAll());
      const targetAdmin = allAdmins.find(a => a.phone === phone);

      if (!targetAdmin) {
        throw new Error("ไม่พบข้อมูลผู้ใช้จากเบอร์โทรศัพท์นี้ในระบบ");
      }

      const currentPermissions = extractArray(await permissionService.getAllPermissions());
      const alreadyHas = currentPermissions.some(p => p.adminId === targetAdmin.id && p.apartmentId === 1);

      if (alreadyHas) {
        throw new Error("ผู้ใช้นี้มีสิทธิ์เข้าถึงหอพักนี้อยู่แล้ว");
      }

      await permissionService.createPermission({
        adminId: targetAdmin.id,
        apartmentId: 1
      });

      onSaved(`เพิ่มสิทธิ์ให้คุณ ${targetAdmin.firstName} เรียบร้อยแล้ว`);
    } catch (err) {
      setError(err.message || "เกิดข้อผิดพลาด");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-[40px] w-full max-w-sm shadow-2xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center px-8 py-6 border-b border-gray-100 shrink-0">
          <div>
            <h3 className="text-xl font-black text-gray-800">ให้สิทธิ์เข้าถึง</h3>
            <p className="text-xs font-bold text-gray-400 mt-0.5">ค้นหาด้วยเบอร์โทรศัพท์</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={22} strokeWidth={3} /></button>
        </div>

        <div className="px-8 py-8 space-y-4">
          <div className="relative">
            <label className="text-xs font-black text-gray-400 mb-2 block px-1">เบอร์โทรศัพท์แอดมิน</label>
            <div className="relative">
              <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                autoFocus
                type="text" 
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                placeholder="08XXXXXXXX"
                className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-gray-100 focus:border-[#f3a638] outline-none text-lg font-black text-gray-700 transition-all"
              />
            </div>
          </div>
          {error && (
            <div className="flex items-center gap-2 text-red-500 bg-red-50 p-3 rounded-xl">
              <AlertCircle size={16} />
              <p className="text-xs font-bold">{error}</p>
            </div>
          )}
        </div>

        {/* ── ปุ่มอยู่ตรงกลาง primary ก่อน secondary ──────────────── */}
        <div className="px-8 pb-8 flex flex-col items-center gap-3">
          <button 
            onClick={handleSearchAndAdd}
            disabled={isSearching || phone.length < 10}
            className="w-full py-4 rounded-2xl bg-[#f3a638] text-white font-black text-sm disabled:opacity-40 flex items-center justify-center gap-2 shadow-lg shadow-orange-100 hover:bg-orange-500 transition-all active:scale-95"
          >
            {isSearching ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} strokeWidth={3} />}
            {isSearching ? "กำลังค้นหา..." : "ค้นหาและเพิ่มสิทธิ์"}
          </button>
          <button 
            onClick={onClose}
            className="w-full py-3.5 rounded-2xl border-2 border-gray-100 font-bold text-gray-400 text-sm hover:bg-gray-50 transition-all"
          >
            ยกเลิก
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Modal: ยืนยันการถอนสิทธิ์ ────────────────────────────────── */
const ConfirmRevokeModal = ({ admin, onClose, onConfirm }) => {
  const [isSaving, setIsSaving] = useState(false);

  const handleConfirm = async () => {
    setIsSaving(true);
    await onConfirm(admin);
    // ไม่ต้อง setIsSaving(false) ตรงนี้เพราะถ้าสำเร็จ modal จะถูกปิดไปเลยจาก component แม่
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={!isSaving ? onClose : undefined}>
      <div className="bg-white rounded-[40px] w-full max-w-sm shadow-2xl overflow-hidden flex flex-col text-center" onClick={e => e.stopPropagation()}>
        <div className="pt-8 pb-6 px-8">
          <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserMinus size={40} strokeWidth={2} />
          </div>
          <h3 className="text-2xl font-black text-gray-800 mb-2">ยืนยันการถอนสิทธิ์?</h3>
          <p className="text-sm font-bold text-gray-500 leading-relaxed">
            ต้องการถอนสิทธิ์การเข้าถึงหอพักนี้ของ<br/>
            <span className="text-gray-800 font-black">คุณ{admin.firstName} {admin.lastName}</span>
          </p>
          <p className="text-[11px] font-bold text-red-400 mt-4 bg-red-50 p-2.5 rounded-xl border border-red-100">
            * บัญชีผู้ใช้จะยังอยู่ในระบบ แต่จะไม่สามารถเข้าใช้งานหรือจัดการข้อมูลใดๆ ในหอพักนี้ได้อีก
          </p>
        </div>
        <div className="px-8 pb-8 flex gap-3">
          <button onClick={onClose} disabled={isSaving}
            className="flex-1 py-3.5 rounded-2xl border-2 border-gray-100 font-bold text-gray-500 text-sm hover:bg-gray-50 transition-all">
            ยกเลิก
          </button>
          <button onClick={handleConfirm} disabled={isSaving}
            className="flex-1 py-3.5 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-black text-sm disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-red-100 transition-all active:scale-95">
            {isSaving ? <Loader2 size={18} className="animate-spin" /> : "ยืนยันถอนสิทธิ์"}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Main Component ───────────────────────────────────────────── */
const AdminAccessSetting = () => {
  const navigate = useNavigate();
  const [permittedAdmins, setPermittedAdmins] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [toast, setToast] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState(null); // เก็บข้อมูล Admin ที่ต้องการถอนสิทธิ์

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [permRes, adminRes] = await Promise.all([
        permissionService.getAllPermissions(),
        adminService.getAll()
      ]);

      const permissions = extractArray(permRes).filter(p => p.apartmentId === 1);
      const admins = extractArray(adminRes);

      const allowed = permissions.map(p => {
        const info = admins.find(a => a.id === p.adminId);
        return info ? { ...info, _permissionId: p.id } : null;
      }).filter(Boolean);

      setPermittedAdmins(allowed);
    } catch (e) {
      console.error(e);
      setToast({ message: "ไม่สามารถโหลดข้อมูลสิทธิ์ได้", type: "error" });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const showToast = (msg, type = "success") => setToast({ message: msg, type });

  const filteredList = useMemo(() => 
    permittedAdmins.filter(a => 
      `${a.firstName} ${a.lastName} ${a.phone}`.toLowerCase().includes(searchTerm.toLowerCase())
    ), [permittedAdmins, searchTerm]);

  // ฟังก์ชันที่ถูกเรียกจาก Confirm Modal
  const executeRevokePermission = async (admin) => {
    try {
      await permissionService.deletePermission(admin._permissionId);
      setToast({ message: "ถอนสิทธิ์การเข้าถึงเรียบร้อยแล้ว", type: "success" });
      fetchData();
      setRevokeTarget(null); // ปิด Modal
    } catch (err) {
      setToast({ message: "เกิดข้อผิดพลาด ไม่สามารถถอนสิทธิ์ได้", type: "error" });
      setRevokeTarget(null); // ปิด Modal ถึงแม้จะพัง
    }
  };

  return (
    <div className="min-h-screen pb-24">
      <div className="relative text-center mb-8 px-4">
        <ExitButton onClick={() => navigate("/settings")} className="absolute right-0 top-0" />
        <h1 className="text-3xl font-bold text-gray-800">สิทธิ์การเข้าถึงระบบ</h1>
        <p className="text-sm text-gray-400 font-bold mt-1">ผู้ดูแลระบบที่มีสิทธิ์เข้าใช้งานหอพักนี้</p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 mb-8 px-4">
        <div className="w-full sm:w-80">
          <SearchBar value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="ค้นชื่อ หรือ เบอร์โทร..." />
        </div>
        <button onClick={() => setShowAddModal(true)}
          className="px-6 py-2.5 rounded-2xl bg-[#f3a638] text-white font-black transition-all shadow-lg shadow-orange-100 hover:bg-orange-500 flex items-center gap-2 active:scale-95">
          <Plus size={18} strokeWidth={3} /> เพิ่มสิทธิ์ด้วยเบอร์โทร
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <Loader2 className="animate-spin text-orange-400" size={40} />
            <p className="font-bold text-gray-500">กำลังตรวจสอบสิทธิ์...</p>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="bg-gray-50 rounded-[40px] border-2 border-dashed border-gray-200 py-20 text-center">
             <UserCog size={48} className="mx-auto text-gray-300 mb-4" />
             <p className="text-gray-400 font-black">ไม่พบบัญชีที่มีสิทธิ์ในหอพักนี้</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredList.map(admin => (
              <div key={admin.id} className="bg-white p-6 rounded-[32px] border-2 border-gray-100 shadow-sm flex flex-col relative group">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center font-black text-xl shrink-0">
                    {admin.firstName.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-lg font-black text-gray-800 truncate">{admin.title}{admin.firstName} {admin.lastName}</h2>
                    <span className="flex items-center gap-1.5 text-[11px] font-black px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 w-fit mt-1">
                      <ShieldCheck size={12} /> มีสิทธิ์เข้าใช้งาน
                    </span>
                  </div>
                </div>

                <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-2 text-sm text-gray-500 font-bold bg-gray-50 px-3 py-2 rounded-xl border border-gray-100">
                    <Phone size={14} className="text-gray-400 shrink-0" /> {admin.phone}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 font-bold bg-gray-50 px-3 py-2 rounded-xl border border-gray-100">
                    <Mail size={14} className="text-gray-400 shrink-0" /> <span className="truncate">{admin.email}</span>
                  </div>
                </div>

                <button 
                  onClick={() => setRevokeTarget(admin)} // เปลี่ยนเป็นการเก็บ state เพื่อโชว์ Modal แทน window.confirm
                  className="w-full py-3 rounded-2xl bg-red-50 text-red-500 font-black text-xs hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2 border border-transparent hover:shadow-lg hover:shadow-red-100"
                >
                  <UserMinus size={16} /> ถอนสิทธิ์การเข้าถึง
                </button>

                <div className="absolute top-4 right-4 text-gray-200" title="ข้อมูลถูกล็อค (อ่านได้อย่างเดียว)">
                  <Lock size={18} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAddModal && (
        <AddPermissionModal 
          onClose={() => setShowAddModal(false)} 
          onSaved={(msg) => { setShowAddModal(false); fetchData(); showToast(msg); }} 
        />
      )}

      {/* เรียกใช้งาน Confirm Modal */}
      {revokeTarget && (
        <ConfirmRevokeModal
          admin={revokeTarget}
          onClose={() => setRevokeTarget(null)}
          onConfirm={executeRevokePermission}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default AdminAccessSetting;