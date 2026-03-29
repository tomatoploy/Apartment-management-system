import axios from "axios";

const API_BASE_URL = 'https://apartment-management-system-zllm.onrender.com';

const documentApi = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

export const documentService = {
    // ดึงเอกสารทั้งหมด
    getAllDocuments: async () => {
        const response = await documentApi.get('/Documents');
        return response.data;
    },

    // ดึงเอกสารตาม ID
    getDocument: async (id) => {
        const response = await documentApi.get(`/Documents/${id}`);
        return response.data;
    },

    // สร้างเอกสารใหม่
    createDocument: async (documentData) => {
        const response = await documentApi.post('/Documents', documentData);
        return response.data;
    },

    // แก้ไขเนื้อหาในเอกสาร
    updateDocument: async (id, documentData) => {
        const response = await documentApi.put(`/Documents/${id}`, documentData);
        return response.data;
    },

    // ลบเอกสาร
    deleteDocument: async (id) => {
        const response = await documentApi.delete(`/Documents/${id}`);
        return response.data;
    }
};