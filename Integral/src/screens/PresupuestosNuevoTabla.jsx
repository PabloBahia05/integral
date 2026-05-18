import { useState, useEffect } from "react";
import DataTable from "../Component/DataTable";
import Modal from "../Component/Modal";
import ActionBar from "../Component/ActionBar";
import ScreenHeader from "../Component/ScreenHeader";
import StatCards from "../Component/StatCards";
import ConfirmDelete from "../Component/ConfirmDelete";

const API = "http://localhost:3001";

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatPeso = (n) =>
  n != null && Number(n) !== 0
    ? "$" + Number(n).toLocaleString("es-AR").replace(/,/g, ".")
    : "—";

const formatFecha = (f) => {
  if (!f) return "—";
  const d = new Date(f);
  if (isNaN(d)) return f;
  const dd   = String(d.getDate()).padStart(2, "0");
  const mm   = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh   = String(d.getHours()).padStart(2, "0");
  const min  = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
};

// ── Columnas encabezados ──────────────────────────────────────────────────────

const COLS_ENCABEZADO = [
  {
    key: "numeropres",
    label: "N°",
    render: (v) => (v ? String(v).padStart(4, "0") : "—"),
  },
  {
    key: "revision",
    label: "Rev.",
    render: (v) => (
      <span style={{
        display: "inline-block",
        background:   Number(v) === 0 ? "#eaf3fb" : "#fff3cd",
        color:        Number(v) === 0 ? "#2d7fc1" : "#856404",
        border:       `1px solid ${Number(v) === 0 ? "#b8d6ef" : "#ffc107"}`,
        borderRadius: "4px",
        padding:      "1px 8px",
        fontSize:     "11px",
        fontWeight:   700,
        fontFamily:   "'Space Mono', monospace",
      }}>
        Rev. {v ?? 0}
      </span>
    ),
  },
  { key: "nombre", label: "Cliente" },
  { key: "fecha",  label: "Fecha",  render: (v) => formatFecha(v) },
  { key: "linea1", label: "Lista"   },
  { key: "total1", label: "Total",  render: (v) => formatPeso(v) },
];

// ── Columnas ítems ────────────────────────────────────────────────────────────

const COLS_ITEMS = [
  { key: "tipo",      label: "Sección"     },
  { key: "articulo",  label: "Artículo"    },
  { key: "nombreart", label: "Descripción" },
  { key: "cantidad",  label: "Cant.",      render: (v) => v ?? 1 },
  { key: "ancho",     label: "Ancho",      render: (v) => v ? `${v} cm` : "—" },
  { key: "alto",      label: "Alto",       render: (v) => v ? `${v} cm` : "—" },
  { key: "valor1",    label: "Precio u.",  render: (v) => formatPeso(v) },
  {
    key: "_subtotal",
    label: "Subtotal",
    render: (_, row) => formatPeso(Number(row.valor1 ?? 0) * (Number(row.cantidad) || 1)),
  },
];

// ── Columnas historial ────────────────────────────────────────────────────────

const COLS_HISTORIAL = [
  {
    key: "revision",
    label: "Rev.",
    render: (v) => (
      <span className={`rev-badge ${Number(v) === 0 ? "rev-badge-0" : "rev-badge-n"}`}>
        Rev. {String(v ?? 0).padStart(2, "0")}
      </span>
    ),
  },
  { key: "fecha",  label: "Fecha",  render: (v) => formatFecha(v) },
  { key: "nombre", label: "Cliente" },
  { key: "linea1", label: "Lista"   },
  { key: "total1", label: "Total",  render: (v) => formatPeso(v) },
];

// ── Componente ────────────────────────────────────────────────────────────────

export default function PresupuestosNuevoTabla({ onAbrirPresupuesto }) {
  // Encabezados (un registro por numeropres, última revisión)
  const [encabezados, setEncabezados] = useState([]);
  const [loadingEnc, setLoadingEnc]   = useState(true);

  // Ítems del presupuesto seleccionado
  const [itemsDetalle, setItemsDetalle] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);

  // Revisiones del numeropres seleccionado
  const [revisiones, setRevisiones]       = useState([]);
  const [loadingRev, setLoadingRev]       = useState(false);
  const [modalHistorial, setModalHistorial] = useState(false);

  const [selected, setSelected] = useState(null);
  const [search, setSearch]     = useState("");
  const [modal, setModal]       = useState(null);

  // ── Fetch encabezados ─────────────────────────────────────────────────────

  const fetchEncabezados = () => {
    setLoadingEnc(true);
    fetch(`${API}/tabla-presupuestos/encabezados`)
      .then((r) => r.json())
      .then((data) => setEncabezados(Array.isArray(data) ? data.map((e, i) => ({
        ...e,
        id: `${e.numeropres}-${e.revision}`,   // id único para DataTable
      })) : []))
      .catch(console.error)
      .finally(() => setLoadingEnc(false));
  };

  useEffect(() => { fetchEncabezados(); }, []);

  // ── Fetch ítems al seleccionar ────────────────────────────────────────────

  useEffect(() => {
    if (!selected) { setItemsDetalle([]); return; }
    setLoadingItems(true);
    fetch(`${API}/tabla-presupuestos?numeropres=${selected.numeropres}&revision=${selected.revision}`)
      .then((r) => r.json())
      .then((data) => setItemsDetalle(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoadingItems(false));
  }, [selected]);

  // ── Fetch revisiones al abrir historial ───────────────────────────────────

  const abrirHistorial = () => {
    if (!selected) return;
    setLoadingRev(true);
    setModalHistorial(true);
    fetch(`${API}/tabla-presupuestos/revisiones/${selected.numeropres}`)
      .then((r) => r.json())
      .then((data) => setRevisiones(Array.isArray(data) ? data.map((r) => ({
        ...r,
        id: `${r.numeropres}-${r.revision}`,
      })) : []))
      .catch(console.error)
      .finally(() => setLoadingRev(false));
  };

  // ── Selección ─────────────────────────────────────────────────────────────

  const handleSelect = (row) => {
    setSelected(row?.id === selected?.id ? null : row);
  };

  // ── Filtro ────────────────────────────────────────────────────────────────

  const q = search.toLowerCase();
  const filtered = encabezados.filter((e) =>
    (e.nombre  ?? "").toLowerCase().includes(q) ||
    String(e.numeropres ?? "").includes(q)      ||
    (e.fecha   ?? "").includes(q)               ||
    (e.linea1  ?? "").toLowerCase().includes(q)
  );

  const totalGeneral = encabezados.reduce((s, e) => s + Number(e.total1 ?? 0), 0);

  // ── DELETE: borra todos los ítems de la revisión seleccionada ─────────────

  const handleDelete = async () => {
    if (!selected) return;
    try {
      await Promise.all(
        itemsDetalle.map((it) =>
          fetch(`${API}/tabla-presupuestos/${it.id}`, { method: "DELETE" })
        )
      );
      fetchEncabezados();
      setSelected(null);
      setItemsDetalle([]);
      setModal(null);
    } catch (e) {
      console.error(e);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <style>{`
        .rev-badge {
          display: inline-block; border-radius: 4px;
          padding: 1px 8px; font-size: 11px; font-weight: 700;
        }
        .rev-badge-0 { background: #eaf3fb; color: #2d7fc1; border: 1px solid #b8d6ef; }
        .rev-badge-n { background: #fff3cd; color: #856404; border: 1px solid #ffc107; }

        .items-panel {
          margin-top: 16px;
          border: 1px solid #d0e4f0;
          border-radius: 6px;
          overflow: hidden;
        }
        .items-panel-header {
          background: #0f2944; color: #fff;
          padding: 10px 16px;
          font-size: 12px; font-weight: 700;
          letter-spacing: 0.1em; text-transform: uppercase;
          font-family: 'Space Mono', monospace;
          display: flex; align-items: center; justify-content: space-between;
        }
        .items-panel-total { font-size: 13px; color: #7ecbf7; font-weight: 700; }
        .items-empty {
          padding: 20px; color: #8aabb8;
          font-size: 13px; text-align: center;
          font-family: 'Space Mono', monospace;
        }
        .btn-historial {
          padding: 7px 14px; border-radius: 5px;
          border: 1.5px solid #b8d6ef; background: #eaf3fb; color: #2d7fc1;
          font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.15s;
          display: flex; align-items: center; gap: 5px;
        }
        .btn-historial:hover    { background: #d0e8f7; border-color: #2d7fc1; }
        .btn-historial:disabled { opacity: 0.4; cursor: default; }
        .btn-abrir {
          padding: 7px 14px; border-radius: 5px;
          border: 1.5px solid #4caf50; background: #e8f5e9; color: #1b5e20;
          font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.15s;
          display: flex; align-items: center; gap: 5px;
        }
        .btn-abrir:hover    { background: #c8e6c9; border-color: #2e7d32; }
        .btn-abrir:disabled { opacity: 0.4; cursor: default; }
        .btn-abrir-sm {
          padding: 3px 10px; font-size: 11px; border-radius: 4px;
          border: 1.5px solid #4caf50; background: #e8f5e9; color: #1b5e20;
          font-weight: 700; cursor: pointer; transition: all 0.15s;
        }
        .btn-abrir-sm:hover { background: #c8e6c9; }
      `}</style>

      <ScreenHeader
        icon="📋"
        title="Presupuestos"
        subtitle="Registro de presupuestos"
      />

      <StatCards stats={[
        { label: "Total presupuestos", value: encabezados.length },
        { label: "Filtrados",          value: filtered.length    },
        { label: "Total general",      value: formatPeso(totalGeneral) },
      ]} />

      {/* ── Barra de acciones ─────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <ActionBar
          selected={selected}
          onNew={null}
          onEdit={null}
          onDelete={() => selected && setModal("eliminar")}
          search={search}
          onSearch={setSearch}
        />
        <button
          className="btn-historial"
          disabled={!selected}
          onClick={abrirHistorial}
          title="Ver historial de revisiones"
        >
          🕓 Revisiones
        </button>
        {onAbrirPresupuesto && (
          <button
            className="btn-abrir"
            disabled={!selected}
            onClick={() => selected && onAbrirPresupuesto(selected)}
            title="Abrir este presupuesto en el editor"
          >
            📝 Abrir
          </button>
        )}
      </div>

      {/* ── Tabla encabezados ─────────────────────────────────────────── */}
      {loadingEnc ? (
        <p style={{ padding: "24px", color: "#4a8ab5", fontFamily: "'Space Mono',monospace" }}>
          ⏳ Cargando presupuestos...
        </p>
      ) : (
        <DataTable
          columns={COLS_ENCABEZADO}
          rows={filtered}
          selectedId={selected?.id}
          onSelect={handleSelect}
        />
      )}

      {/* ── Panel de ítems ────────────────────────────────────────────── */}
      {selected && (
        <div className="items-panel">
          <div className="items-panel-header">
            <span>
              📄 Ítems — N° {String(selected.numeropres).padStart(4, "0")} · {selected.nombre} · Rev. {selected.revision}
            </span>
            <span className="items-panel-total">
              Total: {formatPeso(selected.total1)}
            </span>
          </div>
          {loadingItems ? (
            <p className="items-empty">⏳ Cargando ítems...</p>
          ) : itemsDetalle.length === 0 ? (
            <p className="items-empty">Sin ítems registrados.</p>
          ) : (
            <DataTable
              columns={COLS_ITEMS}
              rows={itemsDetalle}
              selectedId={null}
              onSelect={null}
            />
          )}
        </div>
      )}

      {/* ── Modal historial ───────────────────────────────────────────── */}
      {modalHistorial && selected && (
        <Modal
          title={`Revisiones — N° ${String(selected.numeropres).padStart(4, "0")} · ${selected.nombre ?? ""}`}
          onClose={() => setModalHistorial(false)}
        >
          {loadingRev ? (
            <p style={{ textAlign: "center", padding: "24px", color: "#4a8ab5" }}>⏳ Cargando...</p>
          ) : revisiones.length === 0 ? (
            <p style={{ textAlign: "center", padding: "24px", color: "#8aabb8" }}>
              No hay revisiones registradas.
            </p>
          ) : (
            <DataTable
              columns={[
                ...COLS_HISTORIAL,
                ...(onAbrirPresupuesto
                  ? [{
                      key: "_abrir",
                      label: "",
                      render: (_, row) => (
                        <button
                          className="btn-abrir-sm"
                          onClick={() => {
                            setModalHistorial(false);
                            onAbrirPresupuesto(row);
                          }}
                        >
                          📝 Abrir
                        </button>
                      ),
                    }]
                  : []),
              ]}
              rows={revisiones}
              selectedId={null}
              onSelect={null}
            />
          )}
          <div className="form-actions" style={{ marginTop: "16px" }}>
            <button className="btn-cancel" onClick={() => setModalHistorial(false)}>Cerrar</button>
          </div>
        </Modal>
      )}

      {/* ── Modal eliminar ────────────────────────────────────────────── */}
      {modal === "eliminar" && (
        <ConfirmDelete
          item={selected}
          onConfirm={handleDelete}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}
