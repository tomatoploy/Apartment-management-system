import { useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import Rooms from './pages/Rooms';
import { Routes, Route, Navigate } from "react-router-dom";

// function App() {
//   const [isLoggedIn, setIsLoggedIn] = useState(false);

//   // ฟังก์ชันจำลองการ Login
//   const handleLogin = () => setIsLoggedIn(true);

//   // 1. ถ้ายังไม่ได้ Login ให้โชว์หน้า Login เปล่าๆ (ไม่มี Layout)
//   if (!isLoggedIn) {
//     return <Login onLogin={handleLogin} />;
//   }

//   // 2. ถ้า Login แล้ว ให้โชว์หน้าที่มี Navbar/Sidebar ปกติ
//   return (
//     <Layout>
//       <Dashboard />
//     </Layout>
//   );
// }

// export default App;

//2nd version
// function App() {
//   const [isLoggedIn, setIsLoggedIn] = useState(true); // ลองตั้งเป็น true เพื่อดูหน้าจอ

  // // ใส่ URL รูปภาพตัวอย่างที่นี่ (ใช้รูปจาก Unsplash หรือรูปภาพในเครื่องก็ได้)
  // const userData = {
  //   name: "คุณ XXX",
  //   profileImage:
  // "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200"
  // };

//   if (!isLoggedIn) {
//     return <Login onLogin={() => setIsLoggedIn(true)} />;
//   }

//   return (
//     <Layout userProfileImage={userData.profileImage}>
//       <Dashboard userName={userData.name} />
//     </Layout>
//   );
// }

// export default App;

// import { useState } from 'react';
// import Layout from './components/Layout';
// import Dashboard from './pages/Dashboard';
// import Login from './pages/Login';
// import Register from './pages/Register'; 
// import Rooms from './pages/Rooms';


//versionนี้สลับหน้าได้

// function App() {
//   // return (
//   //   <Layout>
//   //     <Rooms />
//   //   </Layout>
    
//   // )}

  
//     // ใส่ URL รูปภาพตัวอย่างที่นี่ (ใช้รูปจาก Unsplash หรือรูปภาพในเครื่องก็ได้)
//   const userData = {
//     name: "XXX",
//     profileImage:
//   "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200"
//   };

//   const [view, setView] = useState('login'); // 'login' | 'register' | 'dashboard'

//   // ฟังก์ชันสลับหน้า
//   const goToRegister = () => setView('register');
//   const goToLogin = () => setView('login');
//   const handleLoginSuccess = () => setView('dashboard');
//   const handleLogout = () => setView('login');

//   if (view === 'login') {
//     return <Login onLogin={handleLoginSuccess} onNavigateRegister={goToRegister} />;
//   }

//   if (view === 'register') {
//     return <Register onNavigateLogin={goToLogin} />;
//   }

//   return (

//     <Layout onLogout={handleLogout}
//     userProfileImage={userData.profileImage}>
//       {/* <Dashboard userName={userData.name}  /> */}
//       <Rooms />
      
//     </Layout>
//   );
// }
// export default App;

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
      <Route path="/register" element={<Register />} />

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

      {/* กันคนพิมพ์ URL แปลก ๆ */}
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}

export default App;