// 
import { useEffect } from "react";
import { getRooms } from "../api";

function App() {
  useEffect(() => {
    getRooms()
      .then(data => {
        console.log("data from backend:", data);
      })
      .catch(err => console.error(err));
  }, []);

  return (
    <h1>Frontend is working 🎉</h1>
  );
}

export default App;