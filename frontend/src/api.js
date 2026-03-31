const API_BASE_URL = window.location.hostname === "localhost" 
  ? "http://localhost:5252" 
  : "https://your-backend-on-render.onrender.com"; // บน Render

export async function getRooms() {
  const res = await fetch(`${API_BASE_URL}/rooms`);
  if (!res.ok) {
    throw new Error(`HTTP error! status: ${res.status}`);
  }
  return res.json();
}