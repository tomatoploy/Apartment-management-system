import axios from "axios";

const API_BASE_URL = 'https://apartment-management-system-zllm.onrender.com';

const permissionApi = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

export const permissionService = {
    // ดึงรายการสิทธิ์ทั้งหมด
    getAllPermissions: async () => {
        const response = await permissionApi.get('/Permissions');
        return response.data;
    },

    // ดึงสิทธิ์ตาม ID
    getPermission: async (id) => {
        const response = await permissionApi.get(`/Permissions/${id}`);
        return response.data;
    },

    // เช็คสิทธิ์ของ Admin คนนั้นๆ (ใช้ตอน Login)
    getPermissionsByAdmin: async (adminId) => {
        const response = await permissionApi.get(`/Permissions/admin/${adminId}`);
        return response.data;
    },

    // ให้สิทธิ์ Admin เข้าถึงหอพัก (สร้าง Record ใหม่)
    createPermission: async (permissionData) => {
        const response = await permissionApi.post('/Permissions', permissionData);
        return response.data;
    },

    // แก้ไขสิทธิ์
    updatePermission: async (id, permissionData) => {
        const response = await permissionApi.put(`/Permissions/${id}`, permissionData);
        return response.data;
    },

    // ถอนสิทธิ์ Admin (ลบ Record)
    deletePermission: async (id) => {
        const response = await permissionApi.delete(`/Permissions/${id}`);
        return response.data;
    }
};