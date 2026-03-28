import axios from "axios";

const API_BASE_URL = 'http://localhost:5252';

const adminApi = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// 🌟 เพิ่ม Interceptor ตรงนี้!
// มันจะทำหน้าที่ดึง Token มาแนบใส่ Header "Authorization" ให้ทุกครั้งก่อนยิง API
adminApi.interceptors.request.use(
    (config) => {
        // ดึง token จากที่ที่คุณเก็บไว้ตอน Login (ส่วนใหญ่จะชื่อ "token" หรือดูตามที่คุณเขียนไว้)
        const token = localStorage.getItem("token"); 
        
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export const adminService = {
    getAll: async () => {
        const response = await adminApi.get("/Admins");
        return response.data;
    },

    getAdmin: async (id) => {
        const response = await adminApi.get(`/Admins/${id}`);
        return response.data;
    },

    loginAdmin: async (adminData) => {
        const response = await adminApi.post("/Admins/login", adminData);
        return response.data;
    },

    createAdmin: async (adminData) => {
        const response = await adminApi.post('/Admins', adminData);
        return response.data;
    },

    updateAdmin: async (id, adminData) => {
        const response = await adminApi.put(`/Admins/${id}?requesterId=${id}`, adminData);
        return response.data;
    },

    deleteData: async (id) => {
        const response = await adminApi.delete(`/Admins/${id}`);
        return response.data;
    }
}