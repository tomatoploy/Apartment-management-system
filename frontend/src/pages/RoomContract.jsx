import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom"; 
import { Calendar, CreditCard, Edit3, Save, Zap, XCircle, FileText, UserX, FileSignature, Upload, Download, History, CheckCircle2, Clock } from "lucide-react";
import axios from "axios"; 

import RoomHeader from "../components/RoomHeader";
import { OrangeButton } from "../components/ActionButtons";
import { toThaiDate } from "../components/DateController"; 

// API Services
import { roomService } from "../api/RoomApi";
import { contractService } from "../api/ContractApi";
import { tenantService } from "../api/TenantApi";

const RoomContract = () => {
  const { roomNumber } = useParams();
  const navigate = useNavigate();
  const location = useLocation(); 
  
  const [contract, setContract] = useState(null);
  const [historyContracts, setHistoryContracts] = useState([]); 
  const [roomId, setRoomId] = useState(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [isRenewing, setIsRenewing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [formData, setFormData] = useState({
    startDate: "",
    endDate: "",
    monthlyRent: 0,
    deposit: 0,
    initialElectricUnit: 0,
    initialWaterUnit: 0,
    attachedFile: "", 
  });

  const [selectedFile, setSelectedFile] = useState(null); 

  // --- ดึงข้อมูลสัญญา ---
  const fetchContract = async () => {
    setIsLoading(true);
    try {
      const allRooms = await roomService.getRoomOverview();
      const targetRoom = allRooms.find(r => String(r.roomNumber) === String(roomNumber));
      if (!targetRoom) return setIsLoading(false);
      
      const rId = targetRoom.roomId || targetRoom.id;
      setRoomId(rId);

      const allContracts = await contractService.getAllContracts();
      const roomContracts = allContracts.filter(c => c.roomId === rId);

      // 1. หาสัญญาปัจจุบัน (Active หรือ Reserved)
      const activeContract = roomContracts.find(c => c.status === "Active") || 
                             roomContracts.find(c => c.status === "Reserved");

      // 2. หาประวัติสัญญาเก่า (Expired, Cancle, Terminated) แล้วเรียงจากใหม่ไปเก่า
      let history = roomContracts
        .filter(c => c.status !== "Active" && c.status !== "Reserved")
        .sort((a, b) => new Date(b.startDate || 0) - new Date(a.startDate || 0));
      
      if (activeContract) {
        // ✨ กรองเอาเฉพาะประวัติสัญญาเก่าที่เป็นของ "ผู้เช่าคนปัจจุบัน" เท่านั้น
        history = history.filter(c => c.tenantId === activeContract.tenantId);

        setContract(activeContract);
        setFormData({
          startDate: activeContract.startDate ? activeContract.startDate.split('T')[0] : "",
          endDate: activeContract.endDate ? activeContract.endDate.split('T')[0] : "",
          monthlyRent: activeContract.monthlyRent || 0,
          deposit: activeContract.deposit || 0,
          initialElectricUnit: activeContract.initialElectricUnit || 0,
          initialWaterUnit: activeContract.initialWaterUnit || 0,
          attachedFile: activeContract.attachedFile || "",
        });

        if (location.state?.autoEdit || activeContract.status === "Reserved") {
          setIsEditing(true);
        }
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setFormData(prev => ({ ...prev, attachedFile: file.name }));
    }
  };

  const handleRenewClick = async () => {
    setIsRenewing(true);
    setIsEditing(true);

    try {
      const { data: meters } = await axios.get("http://localhost:5252/UtilityMeters");
      const roomMeters = meters
        .filter(m => m.roomId === roomId)
        .sort((a, b) => new Date(b.recordDate) - new Date(a.recordDate));
      
      const latestMeter = roomMeters[0]; 
      
      const today = new Date().toISOString().split('T')[0];
      setFormData({
        startDate: today, 
        endDate: "", 
        monthlyRent: contract.monthlyRent, 
        deposit: contract.deposit, 
        initialElectricUnit: latestMeter ? latestMeter.electricityUnit : (contract.initialElectricUnit || 0),
        initialWaterUnit: latestMeter ? latestMeter.waterUnit : (contract.initialWaterUnit || 0),
        attachedFile: "", 
      });
      setSelectedFile(null);

    } catch (error) {
      console.error("Error fetching latest meters:", error);
      alert("ไม่สามารถดึงข้อมูลมิเตอร์ล่าสุดได้ ระบบจะใช้ข้อมูลจากสัญญาเดิม");
      setFormData({
        ...formData,
        startDate: new Date().toISOString().split('T')[0],
        endDate: "",
        attachedFile: "",
      });
    }
  };

  // --- บันทึกการแก้ไข / ต่อสัญญา ---
  const handleSave = async () => {
    try {
      if (isRenewing) {
        // --- 🟢 กรณีต่อสัญญา ---
        await contractService.putContract(contract.id, { ...contract, status: "Expired" });

        const newContractPayload = {
          RoomId: roomId,
          TenantId: contract.tenantId, 
          Status: "Active", 
          StartDate: formData.startDate || null,
          EndDate: formData.endDate || null,
          MonthlyRent: Number(formData.monthlyRent),
          Deposit: Number(formData.deposit),
          InitialElectricUnit: Number(formData.initialElectricUnit) || null,
          InitialWaterUnit: Number(formData.initialWaterUnit) || null,
          AttachedFile: formData.attachedFile || null, 
        };
        await contractService.postContract(newContractPayload);

        const today = new Date().toISOString().split('T')[0];
        const meterPayload = [{
          RoomId: roomId,
          RecordDate: today,
          ElectricityUnit: Number(formData.initialElectricUnit),
          WaterUnit: Number(formData.initialWaterUnit),
          Note: "* เริ่มสัญญาใหม่ (ต่อสัญญา)" 
        }];
        await axios.post("http://localhost:5252/UtilityMeters/bulk-upsert", meterPayload, {
          headers: { "Content-Type": "application/json" }
        });

        alert("ต่อสัญญาและบันทึกข้อมูลเรียบร้อยแล้ว!");

      } else {
        // --- 🔵 กรณีแก้ไขสัญญาเดิม หรือ ทำสัญญาใหม่จากหน้าจอง ---
        const isFirstTimeMeter = 
          (!contract.initialElectricUnit && formData.initialElectricUnit > 0) || 
          (!contract.initialWaterUnit && formData.initialWaterUnit > 0);

        const updatedContract = {
          ...contract,
          status: contract.status === "Reserved" ? "Active" : contract.status, 
          startDate: formData.startDate || null,
          endDate: formData.endDate || null,
          monthlyRent: Number(formData.monthlyRent),
          deposit: Number(formData.deposit),
          initialElectricUnit: Number(formData.initialElectricUnit) || null,
          initialWaterUnit: Number(formData.initialWaterUnit) || null,
          attachedFile: formData.attachedFile || null, 
        };
        
        await contractService.putContract(contract.id, updatedContract);

        if (isFirstTimeMeter) {
          const today = new Date().toISOString().split('T')[0];
          const meterPayload = [{
            RoomId: roomId,
            RecordDate: today,
            ElectricityUnit: Number(formData.initialElectricUnit),
            WaterUnit: Number(formData.initialWaterUnit),
            Note: "* เริ่มสัญญาใหม่" 
          }];
          await axios.post("http://localhost:5252/UtilityMeters/bulk-upsert", meterPayload, {
            headers: { "Content-Type": "application/json" }
          });
        }
        alert("บันทึกข้อมูลสัญญาสำเร็จ!");
      }

      setIsEditing(false);
      setIsRenewing(false);
      setSelectedFile(null);
      if (location.state?.autoEdit) {
        window.history.replaceState({}, document.title) 
      }
      fetchContract(); 

    } catch (error) {
      console.error("Error saving contract:", error);
      alert("เกิดข้อผิดพลาดในการบันทึก");
    }
  };

  if (isLoading) return <div className="text-center py-20 text-gray-500 font-bold">กำลังโหลดข้อมูล...</div>;

  return (
    <RoomHeader roomNumber={roomNumber}>
      <div className="max-w-5xl mx-auto mt-6 pb-12">
        {!contract ? (
          <div className="py-24 flex flex-col items-center justify-center text-center bg-gray-50 rounded-3xl border border-gray-200 mt-4 max-w-4xl mx-auto animate-in fade-in zoom-in duration-300">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-gray-400 mb-6 border border-dashed border-gray-300 shadow-inner">
              <FileText size={48} strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-black text-gray-500 mb-2">ไม่มีข้อมูลสัญญา</h3>
            <p className="text-sm text-gray-400 font-bold max-w-xs">
              ไม่พบข้อมูลสัญญาเช่าที่เปิดใช้งานอยู่สำหรับห้องพักนี้ในขณะนี้ค่ะ
            </p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden mb-8">
              <div className="p-5 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50/50">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm ${isRenewing ? "bg-green-500" : "bg-[#f3a638]"}`}>
                    {isRenewing ? <FileSignature size={20} /> : <FileText size={20} />}
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-gray-800">
                      {isRenewing ? "ทำสัญญาใหม่ (ต่อสัญญา)" : "ข้อมูลสัญญาปัจจุบัน"}
                    </h2>
                    <p className="text-xs font-bold text-gray-400 mt-0.5 flex items-center gap-1">
                      <CheckCircle2 size={12} className={contract.status === "Active" ? "text-green-500" : "text-orange-400"}/> 
                      สถานะ: {contract.status === "Reserved" ? "รอทำสัญญา" : contract.status}
                    </p>
                  </div>
                </div>
                
                {!isEditing ? (
                  <div className="flex gap-2">
                    <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 p-2 px-4 bg-orange-100 text-[#f3a638] rounded-xl font-bold hover:bg-orange-200 transition-all text-sm">
                      <Edit3 size={16} /> แก้ไข
                    </button>
                    <button onClick={handleRenewClick} className="flex items-center gap-2 p-2 px-4 bg-green-100 text-green-700 rounded-xl font-bold hover:bg-green-200 transition-all text-sm">
                      <FileSignature size={16} /> ต่อสัญญา
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={handleSave} className="flex items-center gap-2 p-2 px-5 bg-[#D5F5E3] text-[#1D8348] rounded-xl font-bold hover:brightness-95 transition-all text-sm">
                      <Save size={16} /> บันทึก
                    </button>
                    <button onClick={() => { 
                        if (location.state?.autoEdit) {
                           navigate(-1); 
                        } else {
                           setIsEditing(false); 
                           setIsRenewing(false); 
                           setFormData({...contract, startDate: contract.startDate?.split('T')[0] || "", endDate: contract.endDate?.split('T')[0] || "", attachedFile: contract.attachedFile || ""}); 
                           setSelectedFile(null); 
                        }
                      }} 
                      className="flex items-center gap-2 p-2 px-5 bg-gray-100 text-gray-500 rounded-xl font-bold hover:bg-gray-200 transition-all text-sm">
                      <XCircle size={16} /> ยกเลิก
                    </button>
                  </div>
                )}
              </div>

              <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <h3 className="text-md font-bold text-[#f3a638] flex items-center gap-2 border-b pb-2">
                    <Calendar size={18} /> ระยะเวลาเช่า
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <InputGroup label="วันเริ่มต้นสัญญา" name="startDate" type="date" value={formData.startDate} onChange={handleChange} disabled={!isEditing} />
                    <InputGroup label="วันสิ้นสุดสัญญา" name="endDate" type="date" value={formData.endDate} onChange={handleChange} disabled={!isEditing} />
                  </div>

                  <h3 className="text-md font-bold text-[#f3a638] flex items-center gap-2 border-b pb-2 mt-8">
                    <CreditCard size={18} /> ค่าใช้จ่าย
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <InputGroup label="ค่าเช่า (บาท/เดือน)" name="monthlyRent" type="number" value={formData.monthlyRent} onChange={handleChange} disabled={!isEditing} />
                    <InputGroup label="เงินมัดจำ (บาท)" name="deposit" type="number" value={formData.deposit} onChange={handleChange} disabled={!isEditing} />
                  </div>

                  <h3 className="text-md font-bold text-[#f3a638] flex items-center gap-2 border-b pb-2 mt-8">
                    <FileText size={18} /> ไฟล์เอกสารสัญญา
                  </h3>
                  <div className="flex flex-col gap-3">
                    {isEditing ? (
                      <div className="flex flex-col gap-2">
                        <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:bg-gray-50 transition-colors cursor-pointer group">
                          <input type="file" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept=".pdf,image/*" />
                          <div className="flex flex-col items-center gap-1 text-gray-500 group-hover:text-[#f3a638]">
                            <Upload size={24} />
                            <span className="text-sm font-bold">{selectedFile ? selectedFile.name : "คลิกเพื่อเลือกไฟล์แนบ"}</span>
                          </div>
                        </div>
                        <div className="text-center text-xs font-bold text-gray-400">หรือระบุ Path/URL ของไฟล์:</div>
                        <input type="text" name="attachedFile" value={formData.attachedFile} onChange={handleChange} placeholder="/path/to/contract.pdf" className="w-full p-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#f3a638]" />
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-3.5 bg-gray-50 border border-gray-200 rounded-xl">
                        <span className="text-sm font-bold text-gray-700 truncate w-3/4">
                          {formData.attachedFile ? formData.attachedFile : "ไม่มีเอกสารแนบ"}
                        </span>
                        {formData.attachedFile && (
                          <button className="p-1.5 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors" title="ดาวน์โหลด/ดูไฟล์">
                            <Download size={16} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-md font-bold text-[#f3a638] flex items-center gap-2 border-b pb-2">
                    <Zap size={18} /> มิเตอร์น้ำ-ไฟ เริ่มต้น
                  </h3>
                  <div className={`p-5 rounded-2xl border space-y-4 ${isRenewing ? "bg-green-50/50 border-green-100" : "bg-orange-50/50 border-orange-100"}`}>
                    <p className={`text-xs font-bold mb-4 ${isRenewing ? "text-green-600" : "text-orange-600"}`}>
                      {isRenewing 
                        ? "* ระบบดึงเลขมิเตอร์ล่าสุดมาให้อัตโนมัติ สามารถแก้ไขได้หากไม่ถูกต้อง" 
                        : "* หากกรอกเลขมิเตอร์เป็นครั้งแรก ระบบจะบันทึกเป็นประวัติการใช้สาธารณูปโภคเดือนปัจจุบันให้อัตโนมัติ"
                      }
                    </p>
                    <InputGroup label="มิเตอร์ไฟฟ้าเริ่มต้น (หน่วย)" name="initialElectricUnit" type="number" value={formData.initialElectricUnit} onChange={handleChange} disabled={!isEditing} />
                    <InputGroup label="มิเตอร์น้ำประปาเริ่มต้น (หน่วย)" name="initialWaterUnit" type="number" value={formData.initialWaterUnit} onChange={handleChange} disabled={!isEditing} />
                  </div>
                </div>
              </div>
            </div>

            {historyContracts.length > 0 && (
              <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-200 bg-gray-50/50">
                  <h3 className="text-lg font-black text-gray-700 flex items-center gap-2">
                    <History size={18} className="text-gray-500"/> ประวัติสัญญาเก่า
                  </h3>
                </div>
                <div className="overflow-x-auto p-4">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100 text-gray-400 text-xs uppercase tracking-wider">
                        <th className="p-3 font-black">สถานะ</th>
                        <th className="p-3 font-black">ระยะเวลา</th>
                        <th className="p-3 font-black text-right">ค่าเช่า</th>
                        <th className="p-3 font-black text-center">เอกสาร</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm font-medium text-gray-700">
                      {historyContracts.map(hc => (
                        <tr key={hc.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                          <td className="p-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold ${
                              hc.status === "Expired" ? "bg-red-100 text-red-600" : 
                              hc.status === "Cancle" ? "bg-gray-200 text-gray-600" : "bg-blue-100 text-blue-600"
                            }`}>
                              {hc.status}
                            </span>
                          </td>
                          <td className="p-3">
                            {toThaiDate(hc.startDate?.split('T')[0])} - {toThaiDate(hc.endDate?.split('T')[0])}
                          </td>
                          <td className="p-3 text-right">
                            {hc.monthlyRent?.toLocaleString() || "0"} ฿
                          </td>
                          <td className="p-3 text-center">
                            {hc.attachedFile ? (
                              <button className="text-blue-500 hover:text-blue-700 mx-auto" title={hc.attachedFile}>
                                <FileText size={16} />
                              </button>
                            ) : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </RoomHeader>
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
      className={`w-full p-3 border rounded-xl font-medium focus:outline-none transition-all
        ${disabled ? "bg-gray-50 border-gray-100 text-gray-500 cursor-not-allowed" : "bg-white border-gray-300 text-gray-800 focus:border-[#f3a638] focus:ring-1 focus:ring-[#f3a638]"}`}
    />
  </div>
);

export default RoomContract;