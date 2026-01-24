import axios from 'axios';

// ตั้งค่า URL พื้นฐานของ Backend (ปรับ port ให้ตรงกับที่รันใน VS code)
const API_BASE_URL = 'http://localhost:5252'; 

const roomApi = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const roomService = {
    // GET: ดึงข้อมูลห้องทั้งหมด
    getAllRooms: async () => {
        const response = await roomApi.get('/Rooms');
        return response.data;
    },

    // GET: ค้นหาห้อง (keyword, building, floor, status, note)
    searchRooms: async (params) => {
        // params เช่น { keyword: '101', status: 'available' }
        const response = await roomApi.get('/Rooms/search', { params });
        return response.data;
    },

    getRoomOverview: async () => {
        const response = await roomApi.get('/Rooms/overview');
        return response.data;
    },

    // POST: สร้างห้องใหม่ (PostRoom DTO)
    createRoom: async (roomData) => {
        const response = await roomApi.post('/Rooms', roomData);
        return response.data;
    },

    // PUT: แก้ไขข้อมูลห้อง (PutRoom DTO)
    updateRoom: async (id, roomData) => {
        const response = await roomApi.put(`/Rooms/${id}`, roomData);
        return response.data;
    },

    // DELETE: ลบห้อง (เปลี่ยนสถานะเป็น delete > ลบจริงใน database แทน)
    deleteRoom: async (id) => {
        const response = await roomApi.delete(`/Rooms/${id}`);
        return response.data;
    }
};