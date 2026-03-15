import Clientes from "./screens/Clientes";
import Productos from "./screens/Productos";
import ActionButton from "./Component/ActionButton";
import { useEffect, useState } from "react";

const API = "http://localhost:3001";

const SCREENS = {
  clientes: { label: "CLIENTES", icon: "👥" },
  productos: { label: "PRODUCTOS", icon: "🛒" },
};

const buttons = [
  { id: 1, label: "CLIENTES",  icon: "👥", color: "#eb56d7", screen: "clientes" },
  { id: 2, label: "PRODUCTOS", icon: "🛒", color: "#ff6b6b", screen: "productos" },
  { id: 4, label: "GUARDAR",   icon: "💾", color: "#ffd93d", action: "guardar" },
  { id: 5, label: "EDITAR",    icon: "✏️", color: "#c77dff", action: "editar" },
  { id: 6, label: "ELIMINAR",  icon: "🗑",  color: "#ff9a3c", action: "eliminar" },
];

export default function App() {
  const [screen, setScreen] = useState(null);
  const [active, setActive] = useState(null);
  const [log, setLog] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);

  const [selectedCliente, setSelectedCliente] = useState(null);
  const [selectedProducto, setSelectedProducto] = useState(null);
  const [modal, setModal] = useState(null);

  const addLog = (msg) => setLog((prev) => [msg, ...prev.slice(0, 4)]);

  // ── Cargar datos ─────────────────────────────────────────
  const fetchClientes = () =>
    fetch(`${API}/clientes`).then(r => r.json()).then(setClientes).catch(console.error);

  const fetchProductos = () =>
    fetch(`${API}/productos`).then(r => r.json()).then(setProductos).catch(console.error);

  useEffect(() => {
    fetchClientes();
    fetchProductos();
  }, []);

  // ── Selección activa ─────────────────────────────────────
  const currentSelected =
    screen === "clientes" ? selectedCliente :
    screen === "productos" ? selectedProducto :
    null;

  // ── CRUD con fetch al servidor ───────────────────────────
  const makeCRUD = (endpoint, get, set, selectFn, fetchFn, name) => ({

    onSave: async (item) => {
      const exists = item.id && get.find((r) => r.id === item.id);
      try {
        if (exists) {
          // Editar — quitar el id del body
          const { id, ...body } = item;
          const res = await fetch(`${API}/${endpoint}/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
          if (!res.ok) throw new Error(await res.text());
          addLog(`✏️ ${name} actualizado: ${item.nombre ?? item.articulo}`);
        } else {
          // Crear — quitar id para que MySQL lo autogenere
          const { id, ...body } = item;
          const res = await fetch(`${API}/${endpoint}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
          if (!res.ok) throw new Error(await res.text());
          addLog(`💾 ${name} guardado: ${item.nombre ?? item.articulo}`);
        }
        await fetchFn();   // refrescar tabla desde MySQL
        setModal(null);
        selectFn(null);
      } catch (err) {
        console.error(`Error guardando ${name}:`, err);
      }
    },

    onDelete: async (id) => {
      try {
        const item = get.find((r) => r.id === id);
        const res = await fetch(`${API}/${endpoint}/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error(await res.text());
        addLog(`🗑 ${name} eliminado: ${item?.nombre ?? item?.articulo}`);
        await fetchFn();
        selectFn(null);
        setModal(null);
      } catch (err) {
        console.error(`Error eliminando ${name}:`, err);
      }
    },

    onSelect: (row) => selectFn(row?.id === currentSelected?.id ? null : row),
    onOpenModal: setModal,
    onCloseModal: () => setModal(null),
  });

  const clientesCRUD  = makeCRUD("clientes",  clientes,  setClientes,  setSelectedCliente,  fetchClientes,  "Cliente");
  const productosCRUD = makeCRUD("productos", productos, setProductos, setSelectedProducto, fetchProductos, "Producto");

  // ── Botones del panel ────────────────────────────────────
  const handlePanelButton = (btn) => {
    setActive(btn.id);
    setTimeout(() => setActive(null), 300);

    if (btn.screen) {
      setScreen(btn.screen);
      addLog(`${btn.icon} Abriendo ${btn.label}`);
      return;
    }

    if (!screen) { addLog("⚠️ Primero seleccioná una pantalla"); return; }

    if (btn.action === "guardar") {
      setModal("nuevo");
      addLog(`${btn.icon} ${btn.label} — ${SCREENS[screen]?.label}`);
    }
    if (btn.action === "editar") {
      currentSelected ? setModal("editar") : addLog("⚠️ Seleccioná un registro primero");
    }
    if (btn.action === "eliminar") {
      currentSelected ? setModal("eliminar") : addLog("⚠️ Seleccioná un registro primero");
    }
  };

  const GLOBAL_STYLE = `
    @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@700;800&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #cce7f9; min-height: 100vh; font-family: 'Space Mono', monospace; }
  `;

  // ── PANTALLAS ────────────────────────────────────────────
  if (screen) {
    const crud = screen === "clientes" ? clientesCRUD : productosCRUD;
    const sel  = screen === "clientes" ? selectedCliente : selectedProducto;

    return (
      <>
        <style>{GLOBAL_STYLE}{`
          .screen-layout { display: flex; min-height: 100vh; }
          .screen-sidebar { width: 240px; background: #0a3a5c; color: white; padding: 32px 20px; flex-shrink: 0; display: flex; flex-direction: column; gap: 8px; }
          .screen-sidebar h3 { font-size: 10px; letter-spacing: 3px; color: #60efff; text-transform: uppercase; margin-bottom: 16px; }
          .side-btn { display: flex; align-items: center; gap: 10px; padding: 12px 14px; border-radius: 3px; background: none; border: 1px solid transparent; color: #a0cce8; font-family: 'Space Mono', monospace; font-size: 12px; cursor: pointer; transition: all 0.2s; text-align: left; width: 100%; }
          .side-btn:hover { background: #ffffff15; border-color: #ffffff22; color: white; }
          .side-btn.active { background: #ffffff20; border-color: #60efff44; color: white; }
          .side-divider { height: 1px; background: #1a4a6c; margin: 8px 0; }
          .side-back { margin-top: auto; color: #6699bb; font-size: 11px; }
          .screen-main { flex: 1; padding: 48px 40px; max-width: 1100px; }
          .log-mini { padding: 12px 16px; background: #fff; border: 1px solid #a0cce8; border-radius: 4px; margin-bottom: 24px; }
          .log-mini-title { font-size: 9px; letter-spacing: 2px; text-transform: uppercase; color: #88aacc; margin-bottom: 6px; }
          .log-mini-item { font-size: 11px; color: #99bbcc; }
          .log-mini-item:first-of-type { color: #2277bb; }
        `}</style>

        <div className="screen-layout">
          <div className="screen-sidebar">
            <h3>Navegación</h3>
            {["clientes", "productos"].map((s) => (
              <button key={s} className={`side-btn ${screen === s ? "active" : ""}`} onClick={() => setScreen(s)}>
                {SCREENS[s].icon} {SCREENS[s].label}
              </button>
            ))}
            <div className="side-divider" />
            <h3 style={{ marginTop: 8 }}>Acciones rápidas</h3>
            <button className="side-btn" onClick={() => setModal("nuevo")}>＋ Nuevo registro</button>
            <button className="side-btn" style={{ opacity: sel ? 1 : 0.4 }} onClick={() => sel && setModal("editar")}>✏️ Editar seleccionado</button>
            <button className="side-btn" style={{ opacity: sel ? 1 : 0.4, color: sel ? "#ff9999" : undefined }} onClick={() => sel && setModal("eliminar")}>🗑 Eliminar seleccionado</button>
            <div className="side-divider" />
            <button className="side-btn side-back" onClick={() => setScreen(null)}>← Volver al panel</button>
          </div>

          <div className="screen-main">
            {log.length > 0 && (
              <div className="log-mini">
                <div className="log-mini-title">Última actividad</div>
                {log.slice(0, 2).map((e, i) => <div key={i} className="log-mini-item">{e}</div>)}
              </div>
            )}
            {screen === "clientes" && (
              <Clientes clientes={clientes} selected={sel} modal={modal} {...crud} />
            )}
            {screen === "productos" && (
              <Productos productos={productos} selected={sel} modal={modal} {...crud} />
            )}
          </div>
        </div>
      </>
    );
  }

  // ── PANEL PRINCIPAL ──────────────────────────────────────
  return (
    <>
      <style>{GLOBAL_STYLE}{`
        body { display: flex; align-items: center; justify-content: center; }
        .overlay { display: none; position: fixed; inset: 0; background: #00000055; z-index: 99; }
        .overlay.open { display: block; }
        .sidebar { position: fixed; top: 0; left: 0; height: 100vh; width: 220px; background: #0a3a5c; color: white; padding: 40px 20px; transform: translateX(-100%); transition: transform 0.3s ease; z-index: 100; }
        .sidebar.open { transform: translateX(0); }
        .sidebar h3 { font-size: 11px; letter-spacing: 3px; color: #60efff; text-transform: uppercase; margin-bottom: 24px; }
        .sidebar p { padding: 10px 0; cursor: pointer; color: #a0cce8; font-size: 13px; border-bottom: 1px solid #1a4a6c; transition: color 0.2s; }
        .sidebar p:hover { color: white; }
        .wrapper { width: 480px; padding: 48px 40px; background: #e8f5fd; border: 1px solid #a0cce8; border-radius: 4px; position: relative; overflow: hidden; }
        .wrapper::before { content: ''; position: absolute; top: -120px; right: -120px; width: 300px; height: 300px; background: radial-gradient(circle, #4ab0e820 0%, transparent 70%); pointer-events: none; }
        .top-bar { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
        .title { font-family: 'Syne', sans-serif; font-size: 28px; font-weight: 800; color: #0a3a5c; letter-spacing: -0.5px; }
        .subtitle { font-size: 11px; color: #6699bb; letter-spacing: 3px; text-transform: uppercase; margin-top: 6px; }
        .menu-btn { background: none; border: 1px solid #a0cce8; border-radius: 3px; padding: 6px 12px; cursor: pointer; font-size: 18px; color: #0a3a5c; transition: all 0.2s; }
        .menu-btn:hover { background: #0a3a5c; color: white; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 32px; }
        .btn { display: flex; align-items: center; gap: 10px; padding: 16px 20px; background: #ffffff; border: 1px solid #a0cce8; border-radius: 3px; color: #2255aa; font-family: 'Space Mono', monospace; font-size: 13px; cursor: pointer; transition: all 0.15s ease; position: relative; overflow: hidden; }
        .btn::after { content: ''; position: absolute; bottom: 0; left: 0; width: 0; height: 2px; background: var(--accent); transition: width 0.2s ease; }
        .btn:hover { border-color: var(--accent); background: var(--accent); color: #ffffff; transform: translateY(-1px); box-shadow: 0 4px 20px var(--accent)44; }
        .btn:hover::after { width: 100%; }
        .btn:active, .btn.active { transform: scale(0.97); background: var(--accent)22; }
        .log { border-top: 1px solid #a0cce8; padding-top: 20px; }
        .log-title { font-size: 10px; color: #88aacc; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 12px; }
        .log-item { font-size: 12px; color: #99bbcc; padding: 4px 0; animation: fadeIn 0.3s ease; }
        .log-item:first-child { color: #2277bb; }
        .data-summary { display: flex; gap: 8px; margin-bottom: 24px; }
        .sum-chip { background: #fff; border: 1px solid #a0cce8; border-radius: 20px; padding: 4px 12px; font-size: 11px; color: #4a6a8c; }
        .sum-chip strong { color: #0a3a5c; }
        @keyframes fadeIn { from { opacity: 0; transform: translateX(-8px); } to { opacity: 1; transform: translateX(0); } }
      `}</style>

      <div className={`overlay ${sidebarOpen ? "open" : ""}`} onClick={() => setSidebarOpen(false)} />
      <div className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <h3>Menú</h3>
        <p onClick={() => setScreen("clientes")}>👥 Clientes</p>
        <p onClick={() => setScreen("productos")}>🛒 Productos</p>
        <p>⚙️ Configuración</p>
        <p>📊 Reportes</p>
      </div>

      <div className="wrapper">
        <div className="top-bar">
          <div>
            <h1 className="title">Panel de Control</h1>
            <p className="subtitle">Sistema integral</p>
          </div>
          <button className="menu-btn" onClick={() => setSidebarOpen(true)}>☰</button>
        </div>

        <div className="data-summary">
          <span className="sum-chip">👥 <strong>{clientes.length}</strong> clientes</span>
          <span className="sum-chip">🛒 <strong>{productos.length}</strong> productos</span>
        </div>

        <div className="grid">
          {buttons.map((btn) => (
            <ActionButton
              key={btn.id}
              label={btn.label}
              icon={btn.icon}
              color={btn.color}
              isActive={active === btn.id}
              onClick={() => handlePanelButton(btn)}
            />
          ))}
        </div>

        <div className="log">
          <p className="log-title">Registro de actividad</p>
          {log.length === 0 ? (
            <p className="log-item">— sin actividad —</p>
          ) : (
            log.map((entry, i) => <p key={i} className="log-item">{entry}</p>)
          )}
        </div>
      </div>
    </>
  );
}
