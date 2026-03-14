import { useState } from "react";
import Clientes from "./screens/Clientes";
import Productos from "./screens/Productos";
import ActionButton from "./Component/ActionButton";

const buttons = [
  {
    id: 1,
    label: "CLIENTES",
    icon: "👥",
    color: "#eb56d7",
    screen: "clientes",
  },
  { id: 2, label: "INSUMOS", icon: "📦", color: "#60efff", screen: "insumos" },
  {
    id: 3,
    label: "PRODUCTOS",
    icon: "🛒",
    color: "#ff6b6b",
    screen: "productos",
  },
  { id: 4, label: "GUARDAR", icon: "💾", color: "#ffd93d", screen: null },
  { id: 5, label: "EDITAR", icon: "✏️", color: "#c77dff", screen: null },
  { id: 6, label: "ELIMINAR", icon: "🗑", color: "#ff9a3c", screen: null },
];

export default function App() {
  const [screen, setScreen] = useState(null);
  const [active, setActive] = useState(null);
  const [log, setLog] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleClick = (btn) => {
    setActive(btn.id);
    setLog((prev) => [
      `${btn.icon} ${btn.label} ejecutado`,
      ...prev.slice(0, 4),
    ]);
    setTimeout(() => setActive(null), 300);
    if (btn.screen) setScreen(btn.screen);
  };

  // ── PANTALLAS ──────────────────────────────────────────
  if (screen) {
    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@700;800&display=swap');
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            background: #cce7f9;
            min-height: 100vh;
            font-family: 'Space Mono', monospace;
          }
          .screen-wrapper {
            min-height: 100vh;
            padding: 40px;
          }
          .back-btn {
            background: none;
            border: 1px solid #a0cce8;
            border-radius: 3px;
            padding: 8px 16px;
            cursor: pointer;
            font-family: 'Space Mono', monospace;
            font-size: 12px;
            color: #0a3a5c;
            margin-bottom: 32px;
            display: inline-block;
            transition: all 0.2s;
          }
          .back-btn:hover { background: #0a3a5c; color: white; }
        `}</style>
        <div className="screen-wrapper">
          <button className="back-btn" onClick={() => setScreen(null)}>
            ← Volver al Panel
          </button>
          {screen === "clientes" && <Clientes />}
          {screen === "productos" && <Productos />}
          {screen === "insumos" && (
            <div>
              <h2>Insumos</h2>
            </div>
          )}
        </div>
      </>
    );
  }

  // ── PANEL PRINCIPAL ────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          background: #cce7f9;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Space Mono', monospace;
        }
        .overlay { display: none; position: fixed; inset: 0; background: #00000055; z-index: 99; }
        .overlay.open { display: block; }
        .sidebar {
          position: fixed; top: 0; left: 0;
          height: 100vh; width: 220px;
          background: #0a3a5c; color: white;
          padding: 40px 20px;
          transform: translateX(-100%);
          transition: transform 0.3s ease;
          z-index: 100;
        }
        .sidebar.open { transform: translateX(0); }
        .sidebar h3 { font-size: 11px; letter-spacing: 3px; color: #60efff; text-transform: uppercase; margin-bottom: 24px; }
        .sidebar p { padding: 10px 0; cursor: pointer; color: #a0cce8; font-size: 13px; border-bottom: 1px solid #1a4a6c; transition: color 0.2s; }
        .sidebar p:hover { color: white; }
        .wrapper {
          width: 480px; padding: 48px 40px;
          background: #e8f5fd; border: 1px solid #a0cce8;
          border-radius: 4px; position: relative; overflow: hidden;
        }
        .wrapper::before {
          content: ''; position: absolute; top: -120px; right: -120px;
          width: 300px; height: 300px;
          background: radial-gradient(circle, #4ab0e820 0%, transparent 70%);
          pointer-events: none;
        }
        .top-bar { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
        .title { font-family: 'Syne', sans-serif; font-size: 28px; font-weight: 800; color: #0a3a5c; letter-spacing: -0.5px; }
        .subtitle { font-size: 11px; color: #6699bb; letter-spacing: 3px; text-transform: uppercase; margin-top: 6px; }
        .menu-btn { background: none; border: 1px solid #a0cce8; border-radius: 3px; padding: 6px 12px; cursor: pointer; font-size: 18px; color: #0a3a5c; transition: all 0.2s; }
        .menu-btn:hover { background: #0a3a5c; color: white; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 32px; }
        .btn {
          display: flex; align-items: center; gap: 10px;
          padding: 16px 20px; background: #ffffff;
          border: 1px solid #a0cce8; border-radius: 3px;
          color: #2255aa; font-family: 'Space Mono', monospace;
          font-size: 13px; cursor: pointer; transition: all 0.15s ease;
          position: relative; overflow: hidden;
        }
        .btn::after { content: ''; position: absolute; bottom: 0; left: 0; width: 0; height: 2px; background: var(--accent); transition: width 0.2s ease; }
        .btn:hover { border-color: var(--accent); background: var(--accent); color: #ffffff; transform: translateY(-1px); box-shadow: 0 4px 20px var(--accent)44; }
        .btn:hover::after { width: 100%; }
        .btn:active, .btn.active { transform: scale(0.97); background: var(--accent)22; }
        .icon { font-size: 16px; }
        .log { border-top: 1px solid #a0cce8; padding-top: 20px; }
        .log-title { font-size: 10px; color: #88aacc; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 12px; }
        .log-item { font-size: 12px; color: #99bbcc; padding: 4px 0; animation: fadeIn 0.3s ease; }
        .log-item:first-child { color: #2277bb; }
        @keyframes fadeIn { from { opacity: 0; transform: translateX(-8px); } to { opacity: 1; transform: translateX(0); } }
      `}</style>

      <div
        className={`overlay ${sidebarOpen ? "open" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />
      <div className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <h3>Menú</h3>
        <p>⚙️ Configuración</p>
        <p>📊 Reportes</p>
        <p>👤 Mi perfil</p>
        <p>🚪 Salir</p>
      </div>

      <div className="wrapper">
        <div className="top-bar">
          <div>
            <h1 className="title">Panel de Control</h1>
            <p className="subtitle">Acciones disponibles</p>
          </div>
          <button className="menu-btn" onClick={() => setSidebarOpen(true)}>
            ☰
          </button>
        </div>

        <div className="grid">
          {buttons.map((btn) => (
            <ActionButton
              key={btn.id}
              label={btn.label}
              icon={btn.icon}
              color={btn.color}
              isActive={active === btn.id}
              onClick={() => handleClick(btn)}
            />
          ))}
        </div>

        <div className="log">
          <p className="log-title">Registro</p>
          {log.length === 0 ? (
            <p className="log-item">— sin actividad —</p>
          ) : (
            log.map((entry, i) => (
              <p key={i} className="log-item">
                {entry}
              </p>
            ))
          )}
        </div>
      </div>
    </>
  );
}
