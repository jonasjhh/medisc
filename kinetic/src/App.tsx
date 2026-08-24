import { useEffect, useState } from "react";

export function App() {
  const [health, setHealth] = useState("checking...");

  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then((data: { status: string }) => setHealth(data.status))
      .catch(() => setHealth("unreachable"));
  }, []);

  return (
    <main style={{ fontFamily: "sans-serif", padding: "2rem" }}>
      <h1>Kinetic</h1>
      <p>
        Placeholder skeleton — phone sensor and camera integrations go here.
      </p>
      <p>Worker health: {health}</p>
    </main>
  );
}
