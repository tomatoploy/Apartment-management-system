import { Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import AdminRegister from "./pages/AdminRegister";
import Rooms from "./pages/Rooms";
import BuildingRegister from "./pages/BuildingRegister";
import Settings from "./pages/Setting";
import UtilitySetting from "./pages/UtilitySetting";
import RoomRateSetting from "./pages/RoomRateSetting";
import Request from "./pages/Request";
import Parcel from "./pages/Parcel";
import Meter from "./pages/Meter";
import Billing from "./pages/Billing";
import BillDetail from "./pages/BillDetail";

// import RoomsFilter from "./pages/Rooms-filterModal";

function App() {
  const userData = {
    name: "XXX",
    // profileImage:
    //   "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200",
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
          <Layout>
            <Dashboard />
          </Layout>
        }
      />

      <Route
        path="/rooms"
        element={
          <Layout>
            <Rooms />
          </Layout>
        }
      />

      {/* <Route
        path="/rooms-nodata"
        element={
          <Layout>
            <Rooms-filterModal />
          </Layout>
        }
      /> */}

      <Route
        path="/settings"
        element={
          <Layout>
            <Settings />
          </Layout>
        }
      />
      <Route
        path="/settings/building-edit"
        element={
          <Layout>
            <BuildingRegister isEditMode={true} />
          </Layout>
        }
      />
      <Route
        path="/settings/utility"
        element={
          <Layout>
            <UtilitySetting />
          </Layout>
        }
      />
      <Route
        path="/settings/roomrate"
        element={
          <Layout>
            <RoomRateSetting />
          </Layout>
        }
      />
      <Route
        path="/request"
        element={
          <Layout>
            <Request />
          </Layout>
        }
      />
      <Route
        path="/parcels"
        element={
          <Layout>
            <Parcel />
          </Layout>
        }
      />
      <Route
        path="/meters"
        element={
          <Layout>
            <Meter />
          </Layout>
        }
      />
      
        <Route
        path="/billings"
        element={
          <Layout>
            <Billing />
          </Layout>
        }
      />
     
        <Route
  path="/billings/:roomNumber"
  element={
    <Layout>
      <BillDetail />
    </Layout>
  }
/>

      {/* case กันคนพิมพ์ URL แปลก ๆ */}
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}

export default App;