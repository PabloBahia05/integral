import { useState } from "react";
import ActionButton from "./Component/ActionButton";
import Clientes from "./Clientes";

const buttons = [
  { id: 1, label: "CLIENTES", icon: "▶", color: "#eb56d7" },
  { id: 2, label: "Pausar", icon: "⏸", color: "#60efff" },
  { id: 3, label: "Detener", icon: "⏹", color: "#ff6b6b" },
  { id: 4, label: "Guardar", icon: "💾", color: "#ffd93d" },
  { id: 5, label: "Editar", icon: "✏️", color: "#c77dff" },
  { id: 6, label: "Eliminar", icon: "🗑", color: "#ff9a3c" },
];

export default function App() {
  const [active, setActive] = useState(null);
  const [log, setLog] = useState([]);
  const [screen, setScreen] = useState("home");

  if (screen === "clientes")
    return <Clientes onBack={() => setScreen("home")} />;

  const handleClick = (btn) => {
    if (btn.id === 1) return setScreen("clientes");
    setActive(btn.id);
    setLog((prev) => [
      `${btn.icon} ${btn.label} ejecutado`,
      ...prev.slice(0, 4),
    ]);
    setTimeout(() => setActive(null), 300);
  };

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

        .wrapper {
          width: 480px;
          padding: 48px 40px;
          background: #e8f5fd;
          border: 1px solid #a0cce8;
          border-radius: 4px;
          position: relative;
          overflow: hidden;
        }

        .wrapper::before {
          content: '';
          position: absolute;
          top: -120px; right: -120px;
          width: 300px; height: 300px;
          background: radial-gradient(circle, #4ab0e820 0%, transparent 70%);
          pointer-events: none;
        }

        .title {
          font-family: 'Syne', sans-serif;
          font-size: 28px;
          font-weight: 800;
          color: #0a3a5c;
          letter-spacing: -0.5px;
          margin-bottom: 6px;
        }

        .subtitle {
          font-size: 11px;
          color: #6699bb;
          letter-spacing: 3px;
          text-transform: uppercase;
          margin-bottom: 40px;
        }

        .grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 32px;
        }

        .btn {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 16px 20px;
          background: #ffffff;
          border: 1px solid #a0cce8;
          border-radius: 3px;
          color: #2255aa;
          font-family: 'Space Mono', monospace;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.15s ease;
          position: relative;
          overflow: hidden;
        }

        .btn::after {
          content: '';
          position: absolute;
          bottom: 0; left: 0;
          width: 0; height: 2px;
          background: var(--accent);
          transition: width 0.2s ease;
        }

        .btn:hover {
          border-color: var(--accent);
          color: #ffffff;
          transform: translateY(-1px);
          box-shadow: 0 4px 20px var(--accent)22;
        }

        .btn:hover::after { width: 100%; }

        .btn:active, .btn.active {
          transform: scale(0.97);
          background: var(--accent)11;
        }

        .icon {
          font-size: 16px;
          filter: grayscale(0.4);
        }

        .log {
          border-top: 1px solid #a0cce8;
          padding-top: 20px;
        }

        .log-title {
          font-size: 10px;
          color: #88aacc;
          letter-spacing: 3px;
          text-transform: uppercase;
          margin-bottom: 12px;
        }

        .log-item {
          font-size: 12px;
          color: #99bbcc;
          padding: 4px 0;
          animation: fadeIn 0.3s ease;
        }

        .log-item:first-child { color: #2277bb; }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateX(-8px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>

      <div className="wrapper">
        <h1 className="title">Panel de Control</h1>
        <p className="subtitle">Acciones disponibles</p>

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
