const API_BASE_URL = "http://localhost:5252";

export async function getRooms() {
  const res = await fetch(`${API_BASE_URL}/rooms`);
  return res.json();
}