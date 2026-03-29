import axios from "axios";

const API_BASE_URL = 'https://apartment-management-system-zllm.onrender.com';

const tenantApi = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

export const tenantService = {
    // GET: ดึงข้อมูลผู้เช่าคนเดียวด้วย ID
    getTenant: async (id) => {
        const response = await tenantApi.get(`/Tenants/${id}`);
        return response.data;
    },

    // GET: ดึงข้อมูลผู้เช่าทั้งหมด
    getAllTenants: async () => {
        const response = await tenantApi.get(`/Tenants`);
        return response.data;
    },

    // GET: ค้นหาผู้เช่าตามชื่อ-นามสกุล (เพิ่มมาตามที่คุณทำไว้ใน Controller)
    searchTenants: async (name) => {
        const response = await tenantApi.get(`/Tenants/search`, { params: { name } });
        return response.data;
    },

    // POST: สร้างข้อมูลผู้เช่าใหม่
    postTenant: async (tenantData) => {
        const response = await tenantApi.post(`/Tenants`, tenantData);
        return response.data;
    },

    // PUT: แก้ไขข้อมูลผู้เช่า
    putTenant: async (id, tenantData) => {
        const response = await tenantApi.put(`/Tenants/${id}`, tenantData);
        return response.data;
    },

    // DELETE: ลบข้อมูลผู้เช่า
    deleteTenant: async (id) => {
        const response = await tenantApi.delete(`/Tenants/${id}`);
        return response.data;
    }
};