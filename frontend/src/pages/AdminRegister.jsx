import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminService } from "../api/AdminApi";
import { WhiteButton } from "../components/ActionButtons";
import { Eye, EyeOff } from "lucide-react";

const FieldLabel = ({ children, required }) => (
  <label className="block text-[14px] font-bold text-gray-700 mb-1">
    {children} {required && <span className="text-red-500">*</span>}
  </label>
);

const InputField = ({
  type = "text",
  error,
  className = "",
  icon: Icon,
  onIconClick,
  ...props
}) => (
  <div className="relative w-full">
    <input
      type={type}
      {...props}
      className={`w-full p-2.5 bg-white border rounded-xl outline-none transition-all text-sm
    focus:ring focus:ring-orange-400/30 
    ${error ? "border-red-500 bg-red-50" : "border-gray-400 focus:border-[#f3a638] hover:border-gray-500"} 
    ${className}`}
    />
    {Icon && (
      <button
        type="button"
        onClick={onIconClick}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <Icon size={18} />
      </button>
    )}
  </div>
);

const SelectField = ({ children, error, ...props }) => (
  <select
    {...props}
    className={`w-full p-2.5 bg-white border rounded-xl outline-none transition-all text-sm cursor-pointer
    focus:ring focus:ring-orange-400/30 
    ${error ? "border-red-500 bg-red-50" : "border-gray-400 focus:border-[#f3a638] hover:border-gray-500"}`}
  >
    {children}
  </select>
);

const Register = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    prefix: "นาย",
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // ฟังก์ชันเสริม: จัดการเบอร์โทร
    if (name === "phone") {
      const onlyNums = value.replace(/\D/g, "");
      if (onlyNums.length <= 10) {
        setFormData({ ...formData, [name]: onlyNums });
      }
      return;
    }
    
    // ฟังก์ชันเสริม: ป้องกันการเคาะช่องว่างในฟิลด์รหัสผ่านและอีเมล
    if (name === "email" || name === "password" || name === "confirmPassword") {
      setFormData({ ...formData, [name]: value.trim() });
      return;
    }
    
    setFormData({ ...formData, [name]: value });
  };

  const validateForm = () => {
    // 1. เช็คกรอกครบ
    if (!formData.firstName || !formData.lastName || !formData.phone || !formData.password || !formData.confirmPassword) {
      alert("กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน");
      return false;
    }
    // 2. เช็คเบอร์โทร (ต้องมี 10 หลัก และขึ้นต้นด้วย 0)
    if (formData.phone.length !== 10 || !formData.phone.startsWith("0")) {
      alert("กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง (10 หลัก และขึ้นต้นด้วย 0)");
      return false;
    }
    // 3. เช็ครูปแบบอีเมล (ถ้ามีการกรอก)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      alert("รูปแบบอีเมลไม่ถูกต้อง");
      return false;
    }
    // 4. เช็คความปลอดภัยรหัสผ่าน
    if (formData.password.length < 8) {
      alert("รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร");
      return false;
    }
    // 5. เช็ครหัสผ่านตรงกัน
    if (formData.password !== formData.confirmPassword) {
      alert("รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    if (!validateForm()) return;

    setLoading(true);
    try {
      const payload = {
        title: formData.prefix,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        email: formData.email === "" ? null : formData.email,
        password: formData.password,
      };

      await adminService.createAdmin(payload);
      alert("ลงทะเบียนผู้ดูแลระบบสำเร็จ!");
      navigate("/login");
    } catch (err) {
      const msg = err.response?.data?.message || "ลงทะเบียนไม่สำเร็จ กรุณาลองใหม่อีกครั้ง";
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-linear-to-br from-[#57a3de] via-[#e5b54f] to-[#d65d2c] p-4 font-kanit">
      <div className="bg-white/90 backdrop-blur-sm w-full max-w-125 rounded-[40px] p-10 shadow-2xl">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
          ลงทะเบียน
        </h1>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <FieldLabel required>คำนำหน้า</FieldLabel>
              <SelectField
                name="prefix"
                value={formData.prefix}
                onChange={handleChange}
                required
              >
                <option value="นาย">นาย</option>
                <option value="นาง">นาง</option>
                <option value="นางสาว">นางสาว</option>
              </SelectField>
            </div>

            <div>
              <FieldLabel required>ชื่อจริง</FieldLabel>
              <InputField
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div>
            <FieldLabel required>นามสกุล</FieldLabel>
            <InputField
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <FieldLabel required>หมายเลขโทรศัพท์</FieldLabel>
            <InputField
              name="phone"
              type="tel"
              inputMode="numeric"
              value={formData.phone}
              onChange={handleChange}
              placeholder="08xxxxxxxx"
              required
            />
          </div>
          <div>
            <FieldLabel>อีเมล</FieldLabel>
            <InputField
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="example@email.com"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <FieldLabel required>รหัสผ่าน</FieldLabel>
              <InputField
                required
                name="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleChange}
                placeholder="อย่างน้อย 8 ตัวอักษร"
                icon={showPassword ? EyeOff : Eye}
                onIconClick={() => setShowPassword(!showPassword)}
              />
            </div>

            <div>
              <FieldLabel required>ยืนยันรหัสผ่าน</FieldLabel>
              <InputField
                required
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={handleChange}
                error={
                  formData.confirmPassword &&
                  formData.password !== formData.confirmPassword
                }
                icon={showConfirmPassword ? EyeOff : Eye}
                onIconClick={() => setShowConfirmPassword(!showConfirmPassword)}
              />
            </div>
          </div>

          {formData.confirmPassword && formData.password !== formData.confirmPassword && (
            <p className="text-red-500 text-xs mt-1 ml-1">
              * รหัสผ่านไม่ตรงกัน
            </p>
          )}

          <div className="pt-3 space-y-3">
            <button
              type="submit"
              disabled={loading}
              className={`mx-auto block w-full font-bold py-3 rounded-xl shadow-md transition-all text-md
                ${
                  loading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-[#f3a638] hover:bg-[#e29528] text-white"
                }
              `}
            >
              {loading ? "กำลังบันทึก..." : "ลงทะเบียน"}
            </button>
            <WhiteButton
              label="กลับ"
              onClick={() => navigate("/login")}
              className="mx-auto block w-full font-bold py-3 rounded-xl transition-all text-md"
            />
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;