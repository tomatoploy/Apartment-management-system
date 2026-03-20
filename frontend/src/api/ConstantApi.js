import axios from "axios";

const API_BASE_URL = "http://localhost:5252";

const constantApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const constantService = {
  // ดึงข้อมูลค่าคงที่ทั้งหมด
  getConstants: async () => {
    const response = await constantApi.get("/Constants");
    return response.data;
  },

  // ดึงข้อมูลค่าคงที่ตาม ID
  getConstantById: async (id) => {
    const response = await constantApi.get(`/Constants/${id}`);
    return response.data;
  },

  // ค้นหาค่าคงที่ด้วย keyword (ค้นจาก Category หรือ Subject)
  searchConstants: async (keyword) => {
    const response = await constantApi.get(`/Constants/search`, {
      params: { keyword }
    });
    return response.data;
  },

  // สร้างค่าคงที่ใหม่
  createConstant: async (constantData) => {
    const response = await constantApi.post("/Constants", constantData);
    return response.data;
  },

  // แก้ไขข้อมูลค่าคงที่
  updateConstant: async (id, constantData) => {
    const response = await constantApi.put(`/Constants/${id}`, constantData);
    return response.data;
  },

  // ลบค่าคงที่
  deleteConstant: async (id) => {
    const response = await constantApi.delete(`/Constants/${id}`);
    return response.data;
  },
};