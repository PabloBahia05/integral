export default function Sidebar({ setScreen }) {
  return (
    <div
      style={{
        width: "220px",
        background: "#111",
        color: "white",
        padding: "20px",
        minHeight: "100vh",
      }}
    >
      <h2>Panel</h2>

      <p onClick={() => setScreen("panel")}>Dashboard</p>
      <p onClick={() => setScreen("clientes")}>Clientes</p>
      <p onClick={() => setScreen("productos")}>Productos</p>
    </div>
  );
}
