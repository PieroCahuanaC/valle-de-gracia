import { useState } from "react";
import "../styles/global.css";

export default function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div className="bolder text-center mt-4">
      <p>Has hecho clic {count} veces</p>
      <button onClick={() => setCount(count + 1)}>Haz clic aquí</button>
    </div>
  );
}
