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
  replace, 
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

  const isFormValid =
    formData.firstName &&
    formData.lastName &&
    formData.phone &&
    formData.password &&
    formData.confirmPassword &&
    formData.password === formData.confirmPassword;

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "phone") {
      // กรองเอาเฉพาะตัวเลขเท่านั้น และจำกัดความยาวไม่เกิน 10 ตัว
      const onlyNums = value.replace(/\D/g, "");
      if (onlyNums.length <= 10) {
        setFormData({ ...formData, [name]: onlyNums });
      }
      return;
    }
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    // 1. เช็คว่ากรอกข้อมูลครบตามเงื่อนไขที่ตั้งไว้ใน isFormValid หรือไม่
    if (!isFormValid) {
      alert("กรุณากรอกข้อมูลให้ถูกต้องครบถ้วน");
      return;
    }
    // 2. เช็ครหัสผ่าน
    if (formData.password !== formData.confirmPassword) {
      alert("รหัสผ่านไม่ตรงกัน กรุณาตรวจสอบอีกครั้ง");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        title: formData.prefix,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone.replace(/\D/g, ""),
        email: formData.email.trim() === "" ? null : formData.email,
        password: formData.password,
      };

      await adminService.createAdmin(payload);
      alert("ลงทะเบียนสำเร็จ!");
      navigate("/login");
    } catch (err) {
      const msg = err.response?.data?.message || "ลงทะเบียนไม่สำเร็จ";
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
              required
            />
          </div>
          <div>
            <FieldLabel>อีเมล์</FieldLabel>
            <InputField
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          {/* ส่วนรหัสผ่าน */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <FieldLabel required>รหัสผ่าน</FieldLabel>
              <InputField
                required
                name="password"
                type={showPassword ? "text" : "password"} // สลับ type ตาม state                required
                value={formData.password}
                onChange={handleChange}
                icon={showPassword ? EyeOff : Eye} // สลับไอคอน
                onIconClick={() => setShowPassword(!showPassword)}
              />
            </div>

            {/* เพิ่มช่อง Confirm Password */}
            <div>
              <FieldLabel required>ยืนยันรหัสผ่าน</FieldLabel>
              <InputField
                replace
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={handleChange}
                error={
                  formData.password !== formData.confirmPassword
                }
                icon={showConfirmPassword ? EyeOff : Eye}
                onIconClick={() => setShowConfirmPassword(!showConfirmPassword)}
              />
            </div>
          </div>

          {/* แสดงข้อความเตือนถ้ารหัสผ่านไม่ตรงกัน */}
          {formData.confirmPassword &&
            formData.password !== formData.confirmPassword && (
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
