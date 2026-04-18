import Clientes from "./screens/Clientes";
import Productos from "./screens/Productos";
import PresupuestoMuebles from "./screens/PresupuestoMuebles";
import PresupuestoMamparas from "./screens/PresupuestoMamparas";
import VerTablas from "./screens/VerTablas";
import Margen from "./screens/Margen";
import Lista from "./screens/Lista";
import PresupuestosMamparasTabla from "./screens/PresupuestosMamparasTabla";
import TiposVanitory from "./screens/TiposVanitory";
import ArmarVanitory from "./screens/ArmarVanitory";
import BreakdownFormulasVanitory from "./screens/BreakdownFormulasVanitory";
import PresupuestosVanitoryTabla from "./screens/PresupuestosVanitoryTabla";
import PresupuestoAmoblamiento from "./screens/PresupuestoAmoblamiento";
import PresupuestoNuevo from "./screens/PresupuestoNuevo";
import PresupuestosNuevoTabla from "./screens/PresupuestosNuevoTabla";
import ActionButton from "./Component/ActionButton";
import { useEffect, useState } from "react";

const API = "http://localhost:3001";

const SCREENS = {
  clientes: { label: "CLIENTES", icon: "👥" },
  productos: { label: "PRODUCTOS", icon: "🛒" },
  "presupuesto-muebles": { label: "PRESUPUESTO MUEBLES", icon: "🪵" },
  "presupuesto-mamparas": { label: "PRESUPUESTO MAMPARAS", icon: "🪟" },
  "ver-tablas": { label: "VER TABLAS", icon: "🗃️" },
  "presupuestos-tabla": { label: "PRESUPUESTOS MAMPARAS", icon: "📋" },
  "presupuesto-vanitory": { label: "PRESUPUESTO VANITORY", icon: "🚿" },
  "presupuestos-vanitory-tabla": { label: "PRESUPUESTOS VANITORY", icon: "🛁" },
  "presupuesto-amoblamiento": { label: "PRESUPUESTO AMOBLAMIENTO", icon: "🪑" },
  "presupuesto-nuevo": { label: "PRESUPUESTO NUEVO", icon: "📝" },
  "lista-margenes":       { label: "LISTA DE MÁRGENES", icon: "📊" },
  "presupuestos-nuevo-tabla": { label: "PRESUPUESTOS", icon: "📋" },
};

const buttons = [
  { id: 1, label: "CLIENTES", icon: "👥", color: "#eb56d7", screen: "clientes" },
  { id: 2, label: "PRODUCTOS", icon: "🛒", color: "#ff6b6b", screen: "productos" },
  { id: 4, label: "PRESUPUESTO MUEBLES", icon: "🪵", color: "#ffd93d", screen: "presupuesto-muebles" },
  { id: 5, label: "PRESUPUESTO MAMPARAS", icon: "🪟", color: "#c77dff", screen: "presupuesto-mamparas" },
  { id: 6, label: "PRESUP. NUEVO", icon: "📝", color: "#ff9a3c", screen: "presupuesto-nuevo" },
  { id: 7, label: "VER TABLAS", icon: "🗃️", color: "#00c9a7", screen: "ver-tablas" },
  { id: 8, label: "PRESUP. MAMPARAS", icon: "📋", color: "#4361ee", screen: "presupuestos-tabla" },
  { id: 9, label: "PRESUP. VANITORY", icon: "🚿", color: "#06d6a0", screen: "presupuesto-vanitory" },
  { id: 10, label: "REGISTRO VANITORY", icon: "🛁", color: "#f4845f", screen: "presupuestos-vanitory-tabla" },
  { id: 11, label: "PRESUP. AMOBLAMIENTO", icon: "🪑", color: "#7b61ff", screen: "presupuesto-amoblamiento" },
  { id: 12, label: "LISTA MÁRGENES", icon: "📊", color: "#20b2aa", screen: "lista-margenes" },
];

export default function App() {
  const [screen, setScreen] = useState(null);
  const [active, setActive] = useState(null);
  const [log, setLog] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [mamparasTipos, setMamparasTipos] = useState([]);
  const [tiposVanitory, setTiposVanitory] = useState([]);
  const [tiposEscritorio, setTiposEscritorio] = useState([]);
  const [tiposDespensero, setTiposDespensero] = useState([]);
  const [formulas, setFormulas] = useState([]);
  const [margen, setMargen] = useState([]);
  const [listas, setListas] = useState([]);
  const [presupuestosMamparas, setPresupuestosMamparas] = useState([]);
  const [selectedPresupuestoMampara, setSelectedPresupuestoMampara] = useState(null);
  const [presupuestosVanitory, setPresupuestosVanitory] = useState([]);
  const [selectedPresupuestoVanitory, setSelectedPresupuestoVanitory] = useState(null);
  const [asociaciones, setAsociaciones] = useState([]);
  const [selectedAsociacion, setSelectedAsociacion] = useState(null);
  const [asociacionesForm, setAsociacionesForm] = useState([]);
  const [selectedAsociacionForm, setSelectedAsociacionForm] = useState(null);
  const [colocaciones, setColocaciones] = useState([]);
  const [selectedColocacion, setSelectedColocacion] = useState(null);
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [selectedProducto, setSelectedProducto] = useState(null);
  const [selectedMamparaTipo, setSelectedMamparaTipo] = useState(null);
  const [selectedTipoVanitory, setSelectedTipoVanitory] = useState(null);
  const [selectedTipoEscritorio, setSelectedTipoEscritorio] = useState(null);
  const [selectedTipoDespensero, setSelectedTipoDespensero] = useState(null);
  const [selectedFormula, setSelectedFormula] = useState(null);
  const [selectedMargen, setSelectedMargen] = useState(null);
  const [selectedLista, setSelectedLista] = useState(null);
  const [modal, setModal] = useState(null);

  // ── Proveedores ──────────────────────────────────────────
  const [proveedores, setProveedores] = useState([]);
  const [selectedProveedor, setSelectedProveedor] = useState(null);

  // ── Navegación interna Vanitory ──────────────────────────
  const [vanitoryVista, setVanitoryVista] = useState("tipos");
  const [vanitoryModelo, setVanitoryModelo] = useState(null);
  // ── Navegación interna Amoblamiento ─────────────────────
  const [amoblamientoVista, setAmoblamientoVista] = useState("selector");

  const addLog = (msg) => setLog((prev) => [msg, ...prev.slice(0, 4)]);

  // ── Cargar datos ─────────────────────────────────────────
  const fetchClientes = () =>
    fetch(`${API}/clientes`).then((r) => r.json()).then(setClientes).catch(console.error);

  const fetchProductos = () =>
    fetch(`${API}/productos`).then((r) => r.json()).then(setProductos).catch(console.error);

  const fetchMamparasTipos = () =>
    fetch(`${API}/mamparas-tipos`).then((r) => r.json()).then(setMamparasTipos).catch(console.error);

  const fetchTiposVanitory = () =>
    fetch(`${API}/vanitory-tipos`).then((r) => r.json()).then(setTiposVanitory).catch(console.error);

  const fetchTiposEscritorio = () =>
    fetch(`${API}/escritorio-tipos`).then((r) => r.json()).then(setTiposEscritorio).catch(console.error);

  const fetchColocaciones = () =>
    fetch(`${API}/colocacion`).then((r) => r.json()).then(setColocaciones).catch(console.error);

  const fetchTiposDespensero = () =>
    fetch(`${API}/despensero-tipos`).then((r) => r.json()).then(setTiposDespensero).catch(console.error);

  const fetchPresupuestosMamparas = () =>
    fetch(`${API}/presupuestos-mamparas`).then((r) => r.json()).then(setPresupuestosMamparas).catch(console.error);

  const fetchPresupuestosVanitory = () =>
    fetch(`${API}/presupuestos-vanitory`).then((r) => r.json()).then(setPresupuestosVanitory).catch(console.error);

  const fetchMargen = () =>
    fetch(`${API}/margen`).then((r) => r.json()).then(setMargen).catch(console.error);

  const fetchFormulas = () =>
    fetch(`${API}/formulas`).then((r) => r.json()).then(setFormulas).catch(console.error);

  const fetchAsociaciones = () =>
    fetch(`${API}/asociaciones`).then((r) => r.json()).then(setAsociaciones).catch(console.error);

  const fetchAsociacionesForm = () =>
    fetch(`${API}/asociaciones-form`).then((r) => r.json()).then(setAsociacionesForm).catch(console.error);

  const fetchListas = () =>
    fetch(`${API}/lista`).then((r) => r.json()).then(setListas).catch(console.error);

  // ── NUEVO: fetch proveedores ─────────────────────────────
  const fetchProveedores = () =>
    fetch(`${API}/proveedores`).then((r) => r.json()).then(setProveedores).catch(console.error);

  useEffect(() => {
    fetchClientes();
    fetchProductos();
    fetchColocaciones();
    fetchMamparasTipos();
    fetchTiposVanitory();
    fetchTiposEscritorio();
    fetchTiposDespensero();
    fetchFormulas();
    fetchMargen();
    fetchPresupuestosMamparas();
    fetchPresupuestosVanitory();
    fetchAsociaciones();
    fetchAsociacionesForm();
    fetchListas();
    fetchProveedores(); // ← NUEVO
  }, []);

  // ── Selección activa ─────────────────────────────────────
  const currentSelected =
    screen === "clientes" ? selectedCliente
    : screen === "productos" ? selectedProducto
    : null;

  // ── CRUD con fetch al servidor ───────────────────────────
  const makeCRUD = (endpoint, get, set, selectFn, fetchFn, name) => ({
    onSave: async (item) => {
      const exists = !!item.id;
      if (item._skipPost) {
        await fetchFn();
        setModal(null);
        selectFn(null);
        return;
      }
      try {
        if (exists) {
          const { id, ...body } = item;
          const res = await fetch(`${API}/${endpoint}/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
          if (!res.ok) {
            const t = await res.text();
            console.error(`PUT error ${endpoint}:`, t);
            throw new Error(t);
          }
          addLog(`✏️ ${name} actualizado: ${item.nombre ?? item.lista ?? item.articulo ?? item.provnombre}`);
        } else {
          const { id, ...body } = item;
          const res = await fetch(`${API}/${endpoint}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
          if (!res.ok) throw new Error(await res.text());
          addLog(`💾 ${name} guardado: ${item.nombre ?? item.lista ?? item.articulo ?? item.provnombre}`);
        }
        await fetchFn();
        setModal(null);
        selectFn(null);
      } catch (err) {
        console.error(`Error guardando ${name}:`, err);
        alert(`Error al guardar: ${err.message}`);
      }
    },

    onDelete: async (id) => {
      try {
        const item = get.find((r) => r.id === id);
        const res = await fetch(`${API}/${endpoint}/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error(await res.text());
        addLog(`🗑 ${name} eliminado: ${item?.nombre ?? item?.lista ?? item?.articulo ?? item?.provnombre}`);
        await fetchFn();
        selectFn(null);
        setModal(null);
      } catch (err) {
        console.error(`Error eliminando ${name}:`, err);
      }
    },

    onAdd: async (item) => {
      try {
        const { id, ...body } = item;
        const res = await fetch(`${API}/${endpoint}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error(await res.text());
        addLog(`💾 ${name} creado: ${item.provnombre ?? item.nombre ?? item.articulo}`);
        await fetchFn();
        setModal(null);
        selectFn(null);
      } catch (err) {
        console.error(`Error creando ${name}:`, err);
        alert(`Error al crear: ${err.message}`);
      }
    },

    onEdit: async (item) => {
      try {
        const { id, ...body } = item;
        const res = await fetch(`${API}/${endpoint}/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error(await res.text());
        addLog(`✏️ ${name} actualizado: ${item.provnombre ?? item.nombre ?? item.articulo}`);
        await fetchFn();
        setModal(null);
        selectFn(null);
      } catch (err) {
        console.error(`Error editando ${name}:`, err);
        alert(`Error al editar: ${err.message}`);
      }
    },

    onSelect: (row) => selectFn(row?.id === currentSelected?.id ? null : row),
    onOpenModal: setModal,
    onCloseModal: () => setModal(null),
  });

  const clientesCRUD = makeCRUD("clientes", clientes, setClientes, setSelectedCliente, fetchClientes, "Cliente");
  const colocacionesCRUD = makeCRUD("colocacion", colocaciones, setColocaciones, setSelectedColocacion, fetchColocaciones, "Colocación");
  const productosCRUD = makeCRUD("productos", productos, setProductos, setSelectedProducto, fetchProductos, "Producto");
  const mamparasTiposCRUD = makeCRUD("mamparas-tipos", mamparasTipos, setMamparasTipos, setSelectedMamparaTipo, fetchMamparasTipos, "Tipo de mampara");
  const tiposVanitoryRUD = makeCRUD("vanitory-tipos", tiposVanitory, setTiposVanitory, setSelectedTipoVanitory, fetchTiposVanitory, "Tipo de vanitory");
  const tiposEscritorioRUD = makeCRUD("escritorio-tipos", tiposEscritorio, setTiposEscritorio, setSelectedTipoEscritorio, fetchTiposEscritorio, "Tipo de escritorio");
  const tiposDespenseroRUD = makeCRUD("despensero-tipos", tiposDespensero, setTiposDespensero, setSelectedTipoDespensero, fetchTiposDespensero, "Tipo de despensero");
  const formulasCRUD = makeCRUD("formulas", formulas, setFormulas, setSelectedFormula, fetchFormulas, "Fórmula");
  const presupuestosMamparasCRUD = makeCRUD("presupuestos-mamparas", presupuestosMamparas, setPresupuestosMamparas, setSelectedPresupuestoMampara, fetchPresupuestosMamparas, "Presupuesto Mampara");
  const presupuestosVanitoryCRUD = makeCRUD("presupuestos-vanitory", presupuestosVanitory, setPresupuestosVanitory, setSelectedPresupuestoVanitory, fetchPresupuestosVanitory, "Presupuesto Vanitory");
  const margenCRUD = makeCRUD("margen", margen, setMargen, setSelectedMargen, fetchMargen, "Margen");
  const asociacionesCRUD = makeCRUD("asociaciones", asociaciones, setAsociaciones, setSelectedAsociacion, fetchAsociaciones, "Asociación");
  const asociacionesFormCRUD = makeCRUD("asociaciones-form", asociacionesForm, setAsociacionesForm, setSelectedAsociacionForm, fetchAsociacionesForm, "Asociación de Fórmula");

  // ── NUEVO: CRUD Proveedores ──────────────────────────────
  const proveedoresCRUD = makeCRUD("proveedores", proveedores, setProveedores, setSelectedProveedor, fetchProveedores, "Proveedor");

  // ── CRUD Lista de Márgenes (definido explícitamente) ─────
  const handleSaveLista = async (item) => {
    const exists = !!item.id;
    try {
      if (exists) {
        const { id, ...body } = item;
        const res = await fetch(`${API}/lista/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error(await res.text());
        addLog(`✏️ Lista actualizada: ${item.lista}`);
      } else {
        const { id, ...body } = item;
        const res = await fetch(`${API}/lista`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error(await res.text());
        addLog(`💾 Lista guardada: ${item.lista}`);
      }
      await fetchListas();
      setModal(null);
      setSelectedLista(null);
    } catch (err) {
      console.error("Error guardando lista:", err);
      alert(`Error al guardar: ${err.message}`);
    }
  };

  const handleDeleteLista = async (id) => {
    try {
      const item = listas.find((r) => r.id === id);
      const res = await fetch(`${API}/lista/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      addLog(`🗑 Lista eliminada: ${item?.lista}`);
      await fetchListas();
      setSelectedLista(null);
      setModal(null);
    } catch (err) {
      console.error("Error eliminando lista:", err);
    }
  };

  // ── Botones del panel ────────────────────────────────────
  const handlePanelButton = (btn) => {
    setActive(btn.id);
    setTimeout(() => setActive(null), 300);

    if (btn.screen) {
      setScreen(btn.screen);
      addLog(`${btn.icon} Abriendo ${btn.label}`);
      if (btn.screen === "presupuestos-tabla") fetchPresupuestosMamparas();
      if (btn.screen === "lista-margenes") fetchListas();
      if (btn.screen === "presupuesto-vanitory") {
        setVanitoryVista("tipos");
        setVanitoryModelo(null);
      }
      return;
    }

    if (!screen) {
      addLog("⚠️ Primero seleccioná una pantalla");
      return;
    }

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
    const sel = screen === "clientes" ? selectedCliente : selectedProducto;

    return (
      <>
        <style>
          {GLOBAL_STYLE}
          {`
          .screen-layout { display: flex; min-height: 100vh; }
          .screen-sidebar { width: 220px; background: #0a3a5c; color: white; padding: 24px 14px; flex-shrink: 0; display: flex; flex-direction: column; gap: 6px; transition: width 0.25s ease, padding 0.25s ease; overflow: hidden; }
          .screen-sidebar.collapsed { width: 50px; padding: 24px 7px; }
          .screen-sidebar h3 { font-size: 10px; letter-spacing: 3px; color: #60efff; text-transform: uppercase; margin-bottom: 10px; white-space: nowrap; overflow: hidden; transition: opacity 0.2s; }
          .screen-sidebar.collapsed h3 { opacity: 0; height: 0; margin: 0; }
          .side-btn { display: flex; align-items: center; gap: 10px; padding: 10px 11px; border-radius: 3px; background: none; border: 1px solid transparent; color: #a0cce8; font-family: 'Space Mono', monospace; font-size: 12px; cursor: pointer; transition: all 0.2s; text-align: left; width: 100%; white-space: nowrap; overflow: hidden; }
          .side-btn:hover { background: #ffffff15; border-color: #ffffff22; color: white; }
          .side-btn.active { background: #ffffff20; border-color: #60efff44; color: white; }
          .btn-label { transition: opacity 0.15s; overflow: hidden; }
          .screen-sidebar.collapsed .btn-label { opacity: 0; max-width: 0; }
          .side-divider { height: 1px; background: #1a4a6c; margin: 6px 0; flex-shrink: 0; }
          .side-back { margin-top: auto; color: #6699bb; font-size: 11px; }
          .collapse-btn { display: flex; align-items: center; justify-content: center; padding: 7px; border-radius: 3px; background: none; border: 1px solid #1a4a6c; color: #60efff; cursor: pointer; font-size: 13px; margin-bottom: 6px; width: 100%; transition: all 0.2s; }
          .collapse-btn:hover { background: #ffffff15; }
          .screen-main { flex: 1; padding: 40px 36px; overflow: auto; }
          .log-mini { padding: 12px 16px; background: #fff; border: 1px solid #a0cce8; border-radius: 4px; margin-bottom: 24px; }
          .log-mini-title { font-size: 9px; letter-spacing: 2px; text-transform: uppercase; color: #88aacc; margin-bottom: 6px; }
          .log-mini-item { font-size: 11px; color: #99bbcc; }
          .log-mini-item:first-of-type { color: #2277bb; }
        `}
        </style>

        <div className="screen-layout">
          <div className={`screen-sidebar${sidebarCollapsed ? " collapsed" : ""}`}>
            <button
              className="collapse-btn"
              onClick={() => setSidebarCollapsed((c) => !c)}
              title={sidebarCollapsed ? "Expandir" : "Colapsar"}
            >
              {sidebarCollapsed ? "▶" : "◀"}
            </button>
            <button
              className="side-btn"
              onClick={() => setScreen(null)}
              title="Inicio"
              style={{ background: "#ffffff18", borderColor: "#60efff44", color: "#60efff", marginBottom: 4 }}
            >
              <span>🏠</span>
              <span className="btn-label">&nbsp;Inicio</span>
            </button>
            <div className="side-divider" />
            <h3>Navegación</h3>
            {[
              "clientes",
              "productos",
              "presupuesto-mamparas",
              "presupuesto-muebles",
              "presupuesto-vanitory",
              "presupuestos-tabla",
              "presupuestos-vanitory-tabla",
              "presupuesto-amoblamiento",
              "presupuesto-nuevo",
              "presupuestos-nuevo-tabla",
              "ver-tablas",
              "lista-margenes",
            ].map((s) => (
              <button
                key={s}
                className={`side-btn ${screen === s ? "active" : ""}`}
                onClick={() => {
                  setScreen(s);
                  if (s === "presupuestos-tabla") fetchPresupuestosMamparas();
                  if (s === "lista-margenes") fetchListas();
                }}
                title={SCREENS[s].label}
              >
                <span>{SCREENS[s].icon}</span>
                <span className="btn-label">&nbsp;{SCREENS[s].label}</span>
              </button>
            ))}
            <div className="side-divider" />
            <h3 style={{ marginTop: 8 }}>Acciones rápidas</h3>
            <button className="side-btn" onClick={() => setModal("nuevo")}>
              <span>＋</span>
              <span className="btn-label">&nbsp;Nuevo registro</span>
            </button>
            <button
              className="side-btn"
              style={{ opacity: sel ? 1 : 0.4 }}
              onClick={() => sel && setModal("editar")}
            >
              <span>✏️</span>
              <span className="btn-label">&nbsp;Editar seleccionado</span>
            </button>
            <button
              className="side-btn"
              style={{ opacity: sel ? 1 : 0.4, color: sel ? "#ff9999" : undefined }}
              onClick={() => sel && setModal("eliminar")}
            >
              <span>🗑</span>
              <span className="btn-label">&nbsp;Eliminar seleccionado</span>
            </button>
            <div className="side-divider" />
          </div>

          <div className="screen-main">
            {screen === "clientes" && (
              <Clientes clientes={clientes} selected={sel} modal={modal} {...crud} />
            )}
            {screen === "productos" && (
              <Productos selected={sel} modal={modal} {...crud} />
            )}
            {screen === "presupuesto-muebles" && (
              <PresupuestoMuebles onSelectItem={(item) => console.log("Mueble:", item)} />
            )}
            {screen === "presupuesto-vanitory" && vanitoryVista === "tipos" && (
              <TiposVanitory
                tiposVanitory={tiposVanitory}
                selected={selectedTipoVanitory}
                modal={modal}
                {...tiposVanitoryRUD}
                onArmar={(modelo) => { setVanitoryModelo(modelo); setVanitoryVista("armar"); }}
                onPrueba={() => setVanitoryVista("breakdown")}
              />
            )}
            {screen === "presupuesto-vanitory" && vanitoryVista === "armar" && (
              <ArmarVanitory
                modelo={vanitoryModelo}
                onVolver={() => { setVanitoryVista("tipos"); setVanitoryModelo(null); }}
              />
            )}
            {screen === "presupuesto-vanitory" && vanitoryVista === "breakdown" && (
              <BreakdownFormulasVanitory onVolver={() => setVanitoryVista("tipos")} />
            )}
            {screen === "presupuesto-mamparas" && (
              <PresupuestoMamparas
                onSelectItem={(item) => console.log("Mampara:", item)}
                onGuardado={fetchPresupuestosMamparas}
              />
            )}
            {screen === "presupuestos-tabla" && (
              <PresupuestosMamparasTabla
                presupuestos={presupuestosMamparas}
                selected={selectedPresupuestoMampara}
                modal={modal}
                {...presupuestosMamparasCRUD}
                onSelect={(row) =>
                  setSelectedPresupuestoMampara(row?.id === selectedPresupuestoMampara?.id ? null : row)
                }
              />
            )}
            {screen === "presupuesto-nuevo" && (
              <PresupuestoNuevo
                onVolver={() => setScreen(null)}
                onGuardado={() => {}}
                onVerTabla={() => setScreen("presupuestos-nuevo-tabla")}
                tiposVanitory={tiposVanitory}
                tiposVanitoryRUD={tiposVanitoryRUD}
              />
            )}
            {screen === "presupuestos-nuevo-tabla" && (
              <PresupuestosNuevoTabla
                onAbrirPresupuesto={(row) => {
                  setScreen("presupuesto-nuevo");
                }}
              />
            )}
            {screen === "presupuesto-amoblamiento" && amoblamientoVista === "selector" && (
              <PresupuestoAmoblamiento
                onBuscar={() => setAmoblamientoVista("buscar")}
                onNuevo={() => setAmoblamientoVista("nuevo")}
                onVolver={() => setScreen(null)}
              />
            )}
            {screen === "presupuesto-amoblamiento" && amoblamientoVista === "buscar" && (
              <div style={{ padding: "40px", color: "#0a3a5c", fontFamily: "'Space Mono',monospace" }}>
                🔍 Pantalla de búsqueda de amoblamiento — próximamente
                <br />
                <button style={{ marginTop: 16, cursor: "pointer" }} onClick={() => setAmoblamientoVista("selector")}>
                  ← Volver
                </button>
              </div>
            )}
            {screen === "presupuesto-amoblamiento" && amoblamientoVista === "nuevo" && (
              <div style={{ padding: "40px", color: "#0a3a5c", fontFamily: "'Space Mono',monospace" }}>
                ✏️ Formulario nuevo presupuesto amoblamiento — próximamente
                <br />
                <button style={{ marginTop: 16, cursor: "pointer" }} onClick={() => setAmoblamientoVista("selector")}>
                  ← Volver
                </button>
              </div>
            )}
            {screen === "presupuestos-vanitory-tabla" && (
              <PresupuestosVanitoryTabla
                presupuestos={presupuestosVanitory}
                selected={selectedPresupuestoVanitory}
                modal={modal}
                {...presupuestosVanitoryCRUD}
                onSelect={(row) =>
                  setSelectedPresupuestoVanitory(row?.id === selectedPresupuestoVanitory?.id ? null : row)
                }
              />
            )}
            {screen === "ver-tablas" && (
              <VerTablas
                clientes={clientes}
                clientesCRUD={clientesCRUD}
                selectedCliente={selectedCliente}
                productos={productos}
                productosCRUD={productosCRUD}
                selectedProducto={selectedProducto}
                mamparasTipos={mamparasTipos}
                mamparasTiposCRUD={mamparasTiposCRUD}
                selectedMamparaTipo={selectedMamparaTipo}
                tiposVanitory={tiposVanitory}
                tiposVanitoryRUD={tiposVanitoryRUD}
                selectedTipoVanitory={selectedTipoVanitory}
                colocaciones={colocaciones ?? []}
                colocacionesCRUD={colocacionesCRUD}
                selectedColocacion={selectedColocacion}
                tiposEscritorio={tiposEscritorio}
                tiposEscritorioRUD={tiposEscritorioRUD}
                selectedTipoEscritorio={selectedTipoEscritorio}
                tiposDespensero={tiposDespensero}
                tiposDespenseroRUD={tiposDespenseroRUD}
                selectedTipoDespensero={selectedTipoDespensero}
                formulas={formulas}
                formulasCRUD={formulasCRUD}
                selectedFormula={selectedFormula}
                margen={margen}
                margenCRUD={margenCRUD}
                selectedMargen={selectedMargen}
                presupuestosMamparas={presupuestosMamparas}
                presupuestosMamparasCRUD={presupuestosMamparasCRUD}
                selectedPresupuestoMampara={selectedPresupuestoMampara}
                asociaciones={asociaciones}
                asociacionesCRUD={asociacionesCRUD}
                selectedAsociacion={selectedAsociacion}
                asociacionesForm={asociacionesForm}
                asociacionesFormCRUD={asociacionesFormCRUD}
                selectedAsociacionForm={selectedAsociacionForm}
                listas={listas}
                onSaveLista={handleSaveLista}
                onDeleteLista={handleDeleteLista}
                // ── proveedores ──
                proveedores={proveedores}
                proveedoresCRUD={proveedoresCRUD}
                selectedProveedor={selectedProveedor}
              />
            )}

            {/* ── Lista de Márgenes ── */}
            {screen === "lista-margenes" && (
              <Lista
                listas={listas}
                selected={selectedLista}
                modal={modal}
                onSave={handleSaveLista}
                onDelete={handleDeleteLista}
                onOpenModal={setModal}
                onCloseModal={() => setModal(null)}
                onSelect={(row) =>
                  setSelectedLista(row?.id === selectedLista?.id ? null : row)
                }
              />
            )}
          </div>
        </div>
      </>
    );
  }

  // ── PANEL PRINCIPAL ──────────────────────────────────────
  return (
    <>
      <style>
        {GLOBAL_STYLE}
        {`
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
        .data-summary { display: flex; gap: 8px; margin-bottom: 24px; flex-wrap: wrap; }
        .sum-chip { background: #fff; border: 1px solid #a0cce8; border-radius: 20px; padding: 4px 12px; font-size: 11px; color: #4a6a8c; }
        .sum-chip strong { color: #0a3a5c; }
        @keyframes fadeIn { from { opacity: 0; transform: translateX(-8px); } to { opacity: 1; transform: translateX(0); } }
      `}
      </style>

      <div className={`overlay ${sidebarOpen ? "open" : ""}`} onClick={() => setSidebarOpen(false)} />
      <div className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <h3>Menú</h3>
        <p onClick={() => setScreen("clientes")}>👥 Clientes</p>
        <p onClick={() => setScreen("presupuestos-tabla")}>📋 Presupuestos Mamparas</p>
        <p onClick={() => setScreen("presupuesto-vanitory")}>🚿 Presupuesto Vanitory</p>
        <p onClick={() => setScreen("productos")}>🛒 Productos</p>
        <p onClick={() => { setScreen("lista-margenes"); fetchListas(); }}>📊 Lista de Márgenes</p>
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
          <span className="sum-chip">📊 <strong>{listas.length}</strong> listas</span>
          <span className="sum-chip">🏭 <strong>{proveedores.length}</strong> proveedores</span>
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
