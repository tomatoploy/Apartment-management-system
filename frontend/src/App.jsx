import { Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import AdminRegister from "./pages/AdminRegister";
import Rooms from "./pages/Rooms";
import BuildingRegister from "./pages/BuildingRegister";
import Settings from "./pages/Setting";

function App() {
  const userData = {
    name: "XXX",
    profileImage:
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200",
  };

  return (
    <Routes>
      {/* หน้า public (ไม่มี Layout) */}
      <Route path="/login" element={<Login />} />
      <Route path="/adminregister" element={<AdminRegister />} />
      <Route path="/buildingregister" element={<BuildingRegister />} />

      {/* หน้า private (มี Layout) */}
      <Route
        path="/dashboard"
        element={
          <Layout userProfileImage={userData.profileImage}>
            <Dashboard />
          </Layout>
        }
      />

      <Route
        path="/rooms"
        element={
          <Layout userProfileImage={userData.profileImage}>
            <Rooms />
          </Layout>
        }
      />

      <Route
        path="/settings"
        element={
          <Layout userProfileImage={userData.profileImage}>
            <Settings />
          </Layout>
        }
      />
      <Route
        path="/settings/building-edit"
        element={
          <Layout userProfileImage={userData.profileImage}>
            <BuildingRegister isEditMode={true} />
          </Layout>
        }
      />

      {/* case กันคนพิมพ์ URL แปลก ๆ */}
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}

export default App;
