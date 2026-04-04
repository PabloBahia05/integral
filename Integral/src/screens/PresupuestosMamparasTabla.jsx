import { useState, useEffect, useRef } from "react";
import DataTable from "../Component/DataTable";
import Modal from "../Component/Modal";
import ActionBar from "../Component/ActionBar";
import ScreenHeader from "../Component/ScreenHeader";
import StatCards from "../Component/StatCards";
import ConfirmDelete from "../Component/ConfirmDelete";

const API = "http://localhost:3001";

// COLUMNS se construye dinámicamente según los datos — ver buildColumns() dentro del componente
const COLUMNS_BASE = [
  { key: "NUMERO",     label: "N°"        },
  { key: "REVISION",   label: "Rev."      },
  { key: "NOMBRE",     label: "Cliente"   },
  { key: "FECHA",      label: "Fecha"     },
  { key: "MODELO",     label: "Modelo"    },
  { key: "CANTIDAD",   label: "Cant."     },
  { key: "ANCHO",      label: "Ancho"     },
  { key: "ALTO",       label: "Alto"      },
  { key: "VIDRIO",     label: "Vidrio"    },
  { key: "COLOCACION", label: "Colocación"},
  { key: "PRECIO",     label: "Total"     },
];

const EMPTY = {
  NOMBRE: "", FECHA: "", CANTIDAD: 1, MODELO: "",
  ANCHO: "", ALTO: "", VIDRIO: "incoloro",
  COLOCACION: 0, margen1: 0, margen2: 0, PRECIO: 0,
};

const formatPeso = (n) =>
  n != null ? "$" + Number(n).toLocaleString("es-AR").replace(/,/g, ".") : "—";

const formatFecha = (f) => {
  if (!f) return "—";
  // Forzar parseo como UTC para evitar desfase de un día en UTC-3
  const iso = String(f).slice(0, 10); // "YYYY-MM-DD"
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return f;
  return `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`;
};

const applyRender = (col) => {
  if (col.key === "PRECIO" || col.key === "COLOCACION") {
    return { ...col, render: (v) => formatPeso(v) };
  }
  if (col.key === "FECHA") {
    return { ...col, render: (v) => formatFecha(v) };
  }
  if (col.key.startsWith("margen")) {
    return { ...col, render: (v) => (v != null && v !== "" ? `${v}%` : "—") };
  }
  if (col.key.startsWith("valor")) {
    return { ...col, render: (v) => (v != null && v !== "" ? formatPeso(v) : "—") };
  }
  if (col.key === "REVISION") {
    return { ...col, render: (v) => (
      <span style={{
        display: "inline-block",
        background: Number(v) === 0 ? "#eaf3fb" : "#fff3cd",
        color: Number(v) === 0 ? "#2d7fc1" : "#856404",
        border: `1px solid ${Number(v) === 0 ? "#b8d6ef" : "#ffc107"}`,
        borderRadius: "4px",
        padding: "1px 8px",
        fontSize: "11px",
        fontWeight: 700,
        fontFamily: "'Space Mono', monospace",
      }}>
        Rev. {v ?? 0}
      </span>
    )};
  }
  if (col.key === "NUMERO") {
    return { ...col, render: (v) => v ? String(v).padStart(4, "0") : "—" };
  }
  return col;
};

export default function PresupuestosMamparasTabla({
  presupuestos, onSave, onDelete, selected, onSelect, modal, onOpenModal, onCloseModal,
}) {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  // Recálculo de precio en modal edición
  const [precioCalc, setPrecioCalc] = useState(null);   // precio calculado reactivo
  // Modal historial de revisiones
  const [modalHistorial, setModalHistorial] = useState(false);
  const [revisiones, setRevisiones] = useState([]);
  const [loadingRev, setLoadingRev] = useState(false);

  const normalize = (p) => {
    const artVals = {};
    for (let n = 1; n <= 10; n++) {
      artVals[`art${n}`]    = p[`art${n}`]    ?? null;
      artVals[`valor${n}`]  = p[`valor${n}`]  ?? null;
      artVals[`margen${n}`] = p[`margen${n}`] ?? null;
    }
    return {
      ...p,
      NOMBRE:     p.NOMBRE     ?? p.nombre     ?? "",
      FECHA:      p.FECHA      ?? p.fecha      ?? "",
      CANTIDAD:   p.CANTIDAD   ?? p.cantidad   ?? "",
      MODELO:     p.MODELO     ?? p.modelo     ?? "",
      ANCHO:      p.ANCHO      ?? p.ancho      ?? "",
      ALTO:       p.ALTO       ?? p.alto       ?? "",
      VIDRIO:     p.VIDRIO     ?? p.vidrio     ?? "",
      COLOCACION: p.COLOCACION ?? p.colocacion ?? 0,
      REVISION:   p.REVISION   ?? p.revision   ?? 0,
      PRECIO:     p.PRECIO     ?? p.precio     ?? 0,
      ...artVals,
    };
  };

  const rows = (Array.isArray(presupuestos) ? presupuestos : []).map(normalize);

  const filtered = rows.filter((p) => {
    const q = search.toLowerCase();
    return (
      (p.NOMBRE  ?? "").toLowerCase().includes(q) ||
      (p.MODELO  ?? "").toLowerCase().includes(q) ||
      String(p.NUMERO ?? p.id ?? "").includes(q)
    );
  });

  // Recalcular precio en tiempo real cuando cambian valores o márgenes de artículos asociados
  useEffect(() => {
    if (modal !== "editar" && modal !== "nuevo") return;

    // Sumar cada artículo: valor * margen
    let subtotalArts = 0;
    for (let n = 1; n <= 10; n++) {
      const valor  = Number(form[`valor${n}`]  || 0);
      const margen = Number(form[`margen${n}`] || 1);
      if (valor > 0) {
        subtotalArts += Math.round(valor * margen);
      }
    }
    const colocacion = Number(form.COLOCACION || 0);
    const total = subtotalArts + colocacion;
    setPrecioCalc(total > 0 ? Math.round(total) : null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    modal,
    ...Array.from({ length: 10 }, (_, i) => form[`valor${i+1}`]),
    ...Array.from({ length: 10 }, (_, i) => form[`margen${i+1}`]),
    form.COLOCACION,
  ]);

  const openNew = () => { setForm(EMPTY); setError(""); setPrecioCalc(null); onOpenModal("nuevo"); };

  const openEdit = () => {
    if (!selected) return;
    const artVals = {};
    for (let n = 1; n <= 10; n++) {
      artVals[`art${n}`]    = selected[`art${n}`]    ?? "";
      artVals[`valor${n}`]  = selected[`valor${n}`]  ?? "";
      artVals[`margen${n}`] = selected[`margen${n}`] ?? "";
    }
    setForm({
      NOMBRE:     selected.NOMBRE     ?? "",
      FECHA:      (selected.FECHA ?? "").slice(0, 10),
      CANTIDAD:   selected.CANTIDAD   ?? 1,
      MODELO:     selected.MODELO     ?? "",
      ANCHO:      selected.ANCHO      ?? "",
      ALTO:       selected.ALTO       ?? "",
      VIDRIO:     selected.VIDRIO     ?? "incoloro",
      COLOCACION: selected.COLOCACION ?? 0,
      PRECIO:     selected.PRECIO     ?? 0,
      ...artVals,
    });
    setPrecioCalc(null);
    setError("");
    onOpenModal("editar");
  };

  // Abrir historial de revisiones del presupuesto seleccionado
  const openHistorial = async () => {
    if (!selected) return;
    setLoadingRev(true);
    setModalHistorial(true);
    try {
      const numeroParam = selected.NUMERO ?? selected.id;
      const res = await fetch(`${API}/presupuestos-mamparas/${numeroParam}/revisiones`);
      const data = await res.json();
      setRevisiones(Array.isArray(data) ? data : []);
    } catch {
      setRevisiones([]);
    } finally {
      setLoadingRev(false);
    }
  };

  const handleSubmit = () => {
    if (!form.NOMBRE.trim()) { setError("El nombre del cliente es obligatorio."); return; }
    if (!form.MODELO.trim()) { setError("El modelo es obligatorio."); return; }
    const artVals = {};
    for (let n = 1; n <= 10; n++) {
      artVals[`art${n}`]    = form[`art${n}`]    ?? null;
      artVals[`valor${n}`]  = form[`valor${n}`]  !== "" && form[`valor${n}`]  != null ? Number(form[`valor${n}`])  : null;
      artVals[`margen${n}`] = form[`margen${n}`] !== "" && form[`margen${n}`] != null ? Number(form[`margen${n}`]) : null;
    }
    const payload = {
      NOMBRE:     form.NOMBRE,
      FECHA:      form.FECHA || new Date().toISOString().slice(0, 10),
      CANTIDAD:   Number(form.CANTIDAD),
      MODELO:     form.MODELO,
      ANCHO:      Number(form.ANCHO),
      ALTO:       Number(form.ALTO),
      VIDRIO:     form.VIDRIO,
      COLOCACION: Number(form.COLOCACION),
      PRECIO:     precioCalc !== null ? precioCalc : Number(form.PRECIO),
      ...artVals,
    };
    // En edición se pasa NUMERO para que el servidor cree una nueva revisión (POST).
    // En nuevo no se pasa NUMERO y el servidor lo asigna automáticamente.
    onSave(modal === "nuevo" ? payload : { ...payload, NUMERO: selected.NUMERO ?? selected.id });
    onCloseModal();
    setForm(EMPTY);
    setPrecioCalc(null);
  };

  const inp = (field, type = "text", extra = {}) => (
    <input
      className="form-input"
      type={type}
      value={form[field] ?? ""}
      onChange={(e) => {
        const val = type === "number" ? (e.target.value === "" ? "" : Number(e.target.value)) : e.target.value;
        setForm((p) => ({ ...p, [field]: val }));
      }}
      {...extra}
    />
  );

  // Construir columnas dinámicamente: agrega art/valor/margen solo si alguna fila tiene dato

  // Construir columnas dinámicamente: para cada slot con artículo agrega valor + margen juntos
  const buildColumns = (dataRows) => {
    const cols = [...COLUMNS_BASE];
    const artCols = [];
    for (let n = 1; n <= 10; n++) {
      const hasArt = dataRows.some(r => r["art" + n] != null && r["art" + n] !== "");
      if (!hasArt) continue;
      // Label = nombre del artículo (tomado de la primera fila que lo tenga)
      const artLabel = (dataRows.find(r => r["art" + n]) || {})["art" + n] || ("Art. " + n);
      // Columna valor con el nombre del artículo como header
      artCols.push({ key: "valor" + n, label: artLabel });
      // Columna margen solo si alguna fila tiene dato distinto de 0/vacío
      const hasMargen = dataRows.some(r => r["margen" + n] != null && r["margen" + n] !== "" && Number(r["margen" + n]) !== 0);
      if (hasMargen) {
        artCols.push({ key: "margen" + n, label: artLabel + " — margen %" });
      }
    }
    const precioIdx = cols.findIndex(c => c.key === "PRECIO");
    cols.splice(precioIdx, 0, ...artCols);
    return cols.map(applyRender);
  };

  const columnsDisplay = buildColumns(filtered);

  const totalPresupuestado = rows.reduce((s, p) => s + Number(p.PRECIO ?? 0), 0);

  return (
    <>
      <style>{`
        .pmtabla-badge {
          display: inline-block;
          background: #eaf3fb;
          border: 1px solid #b8d6ef;
          border-radius: 4px;
          padding: 2px 10px;
          font-size: 11px;
          color: #2d7fc1;
          font-weight: 700;
          font-family: 'Space Mono', monospace;
          letter-spacing: 0.04em;
        }
        .pmtabla-total-chip {
          display: inline-block;
          background: #0f2944;
          color: #fff;
          border-radius: 4px;
          padding: 3px 14px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.04em;
        }
        .pm-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 24px; }
        .pm-form-group { margin-bottom: 14px; }
        .pm-form-group label { display: block; font-size: 11px; font-weight: 700; letter-spacing: 0.12em; color: #4a8ab5; text-transform: uppercase; margin-bottom: 5px; }
        .pm-vidrio-row { display: flex; gap: 8px; }
        .pm-vidrio-btn { flex: 1; padding: 9px; border-radius: 5px; border: 1.5px solid #d0dde8; background: #fff; cursor: pointer; font-size: 13px; font-weight: 600; color: #4a6a80; transition: all 0.15s; }
        .pm-vidrio-btn.active { background: #0f2944; border-color: #0f2944; color: #fff; }
        /* Historial revisiones */
        .rev-table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 13px; }
        .rev-table th { background: #0f2944; color: #fff; padding: 8px 12px; text-align: left; font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; }
        .rev-table td { padding: 9px 12px; border-bottom: 1px solid #e8f0f7; color: #2a3a4a; }
        .rev-table tr:nth-child(even) td { background: #f7fafd; }
        .rev-table tr:last-child td { border-bottom: none; }
        .rev-badge { display: inline-block; border-radius: 4px; padding: 1px 8px; font-size: 11px; font-weight: 700; }
        .rev-badge-0 { background: #eaf3fb; color: #2d7fc1; border: 1px solid #b8d6ef; }
        .rev-badge-n { background: #fff3cd; color: #856404; border: 1px solid #ffc107; }
        .rev-empty { text-align: center; padding: 24px; color: #8aabb8; font-size: 13px; }
        .btn-historial {
          padding: 7px 14px;
          border-radius: 5px;
          border: 1.5px solid #b8d6ef;
          background: #eaf3fb;
          color: #2d7fc1;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s;
          display: flex; align-items: center; gap: 5px;
        }
        .btn-historial:hover { background: #d0e8f7; border-color: #2d7fc1; }
        .btn-historial:disabled { opacity: 0.4; cursor: default; }
      `}</style>

      <ScreenHeader icon="🪟" title="Presupuestos Mamparas" subtitle="Historial y gestión de presupuestos" />

      <StatCards stats={[
        { label: "Total presupuestos", value: rows.length },
        { label: "Filtrados",          value: filtered.length },
        { label: "Total presupuestado", value: formatPeso(totalPresupuestado) },
      ]} />

      {/* ActionBar + botón historial */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <ActionBar
          selected={selected}
          onNew={openNew}
          onEdit={openEdit}
          onDelete={() => selected && onOpenModal("eliminar")}
          search={search}
          onSearch={setSearch}
        />
        <button
          className="btn-historial"
          disabled={!selected}
          onClick={openHistorial}
          title="Ver historial de revisiones"
        >
          🕓 Revisiones
        </button>
      </div>

      <DataTable
        columns={columnsDisplay}
        rows={filtered}
        selectedId={selected?.id}
        onSelect={onSelect}
      />

      {/* MODAL NUEVO / EDITAR */}
      {(modal === "nuevo" || modal === "editar") && (
        <Modal
          title={modal === "nuevo"
            ? "Nuevo presupuesto"
            : `Editar presupuesto N° ${String(selected?.NUMERO ?? selected?.id ?? "").padStart(4, "0")} — guardará nueva revisión`}
          onClose={onCloseModal}
        >
          {error && <p className="form-error">{error}</p>}
          <div className="pm-form-grid">
            {/* Columna izquierda */}
            <div>
              <div className="pm-form-group">
                <label>Cliente *</label>
                {inp("NOMBRE")}
              </div>
              <div className="pm-form-group">
                <label>Fecha</label>
                {inp("FECHA", "date")}
              </div>
              <div className="pm-form-group">
                <label>Modelo *</label>
                {inp("MODELO")}
              </div>
              <div className="pm-form-group">
                <label>Cantidad</label>
                {inp("CANTIDAD", "number", { min: 1 })}
              </div>
              <div className="pm-form-group">
                <label>Tipo de vidrio</label>
                <div className="pm-vidrio-row">
                  {["incoloro", "esmerilado"].map((v) => (
                    <button
                      key={v}
                      className={`pm-vidrio-btn${form.VIDRIO === v ? " active" : ""}`}
                      onClick={() => setForm((p) => ({ ...p, VIDRIO: v }))}
                      type="button"
                    >
                      {v === "incoloro" ? "⬜ Incoloro" : "🔲 Esmerilado"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Columna derecha */}
            <div>
              <div className="pm-form-group">
                <label>Ancho (cm)</label>
                {inp("ANCHO", "number", { min: 0 })}
              </div>
              <div className="pm-form-group">
                <label>Alto (cm)</label>
                {inp("ALTO", "number", { min: 0 })}
              </div>
              <div className="pm-form-group">
                <label>Colocación ($)</label>
                {inp("COLOCACION", "number", { min: 0 })}
              </div>

              <div className="pm-form-group">
                <label style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
                  <span>Precio total ($)</span>

                </label>
                <div style={{
                  padding: "9px 12px",
                  background: precioCalc !== null ? "#f0fdf4" : "#f7fafd",
                  border: `1.5px solid ${precioCalc !== null ? "#86efac" : "#d0dde8"}`,
                  borderRadius: "6px",
                  fontSize: "16px",
                  fontWeight: 700,
                  color: precioCalc !== null ? "#15803d" : "#6a8aa0",
                  fontFamily: "'Rajdhani', sans-serif",
                  letterSpacing: "0.04em",
                  minHeight: "40px",
                  display: "flex",
                  alignItems: "center",
                }}>
                  {precioCalc !== null
                    ? `$${Number(precioCalc).toLocaleString("es-AR").replace(/,/g, ".")}`
                    : formatPeso(form.PRECIO)}
                </div>
                {precioCalc !== null && Number(precioCalc) !== Number(form.PRECIO) && (
                  <div style={{fontSize:"10px", color:"#856404", marginTop:"3px"}}>
                    ⚠️ Precio original: {formatPeso(form.PRECIO)}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Artículos asociados — editables, solo los no-null */}
          {Array.from({ length: 10 }, (_, i) => i + 1)
            .filter(n => form[`art${n}`] != null && form[`art${n}`] !== "")
            .length > 0 && (
            <div style={{ marginBottom: "14px" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.12em", color: "#4a8ab5", textTransform: "uppercase", marginBottom: "8px" }}>
                🔩 Artículos asociados
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr>
                    <th style={{ background: "#0f2944", color: "#fff", padding: "6px 10px", textAlign: "left", fontSize: "11px", fontWeight: 700 }}>Artículo</th>
                    <th style={{ background: "#0f2944", color: "#fff", padding: "6px 10px", textAlign: "left", fontSize: "11px", fontWeight: 700, width: "160px" }}>Valor ($)</th>
                    <th style={{ background: "#0f2944", color: "#fff", padding: "6px 10px", textAlign: "left", fontSize: "11px", fontWeight: 700, width: "100px" }}>Margen (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 10 }, (_, i) => i + 1)
                    .filter(n => form[`art${n}`] != null && form[`art${n}`] !== "")
                    .map(n => (
                      <tr key={n}>
                        <td style={{ padding: "5px 8px", borderBottom: "1px solid #e8f0f7" }}>
                          <input
                            className="form-input"
                            style={{ margin: 0, width: "100%" }}
                            type="text"
                            value={form[`art${n}`] ?? ""}
                            onChange={e => setForm(p => ({ ...p, [`art${n}`]: e.target.value }))}
                          />
                        </td>
                        <td style={{ padding: "5px 8px", borderBottom: "1px solid #e8f0f7" }}>
                          <input
                            className="form-input"
                            style={{ margin: 0, width: "100%" }}
                            type="number"
                            min="0"
                            value={form[`valor${n}`] ?? ""}
                            onChange={e => setForm(p => ({ ...p, [`valor${n}`]: e.target.value === "" ? "" : Number(e.target.value) }))}
                          />
                        </td>
                        <td style={{ padding: "5px 8px", borderBottom: "1px solid #e8f0f7" }}>
                          <input
                            className="form-input"
                            style={{ margin: 0, width: "100%" }}
                            type="number"
                            min="0"
                            max="100"
                            placeholder="0"
                            value={form[`margen${n}`] ?? ""}
                            onChange={e => setForm(p => ({ ...p, [`margen${n}`]: e.target.value === "" ? "" : Number(e.target.value) }))}
                          />
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}

          {modal === "editar" && (
            <p style={{
              fontSize: "12px", color: "#856404", background: "#fff3cd",
              border: "1px solid #ffc107", borderRadius: "5px",
              padding: "8px 12px", marginBottom: "12px",
            }}>
              ⚠️ Al actualizar se guardará una nueva revisión incremental. Las revisiones anteriores se conservan.
            </p>
          )}

          <div className="form-actions">
            <button className="btn-cancel" onClick={onCloseModal}>Cancelar</button>
            <button className="btn-save" onClick={handleSubmit}>
              {modal === "nuevo" ? "Guardar" : "Actualizar (nueva revisión)"}
            </button>
          </div>
        </Modal>
      )}

      {/* MODAL HISTORIAL DE REVISIONES */}
      {modalHistorial && (() => {
        // Calcular slots de artículos presentes en las revisiones
        const revArtSlots = [];
        for (let n = 1; n <= 10; n++) {
          const hasArt = revisiones.some(r => r[`art${n}`] != null && r[`art${n}`] !== "");
          if (!hasArt) continue;
          const label = (revisiones.find(r => r[`art${n}`]) || {})[`art${n}`] || `Art. ${n}`;
          const hasMargen = revisiones.some(r => r[`margen${n}`] != null && r[`margen${n}`] !== "" && Number(r[`margen${n}`]) !== 0);
          revArtSlots.push({ n, label, hasMargen });
        }
        return (
          <Modal
            title={`Historial de revisiones — N° ${String(selected?.NUMERO ?? selected?.id ?? "").padStart(4, "0")} · ${selected?.NOMBRE ?? ""}`}
            onClose={() => setModalHistorial(false)}
          >
            {loadingRev ? (
              <p style={{ textAlign: "center", padding: "24px", color: "#4a8ab5" }}>⏳ Cargando revisiones...</p>
            ) : revisiones.length === 0 ? (
              <p className="rev-empty">No hay revisiones registradas para este presupuesto.</p>
            ) : (
              <table className="rev-table">
                <thead>
                  <tr>
                    <th>Rev.</th>
                    <th>Fecha edición</th>
                    <th>Modelo</th>
                    <th>Vidrio</th>
                    <th>Ancho</th>
                    <th>Alto</th>
                    {revArtSlots.map(({ n, label, hasMargen }) => (
                      <>
                        <th key={`val${n}`}>{label}</th>
                        {hasMargen && <th key={`mar${n}`}>{label} — margen %</th>}
                      </>
                    ))}
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {revisiones.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <span className={`rev-badge ${Number(r.REVISION) === 0 ? "rev-badge-0" : "rev-badge-n"}`}>
                          Rev. {r.REVISION}
                        </span>
                      </td>
                      <td>{formatFecha(r.FECHA_REVISION ?? r.FECHA)}</td>
                      <td>{r.MODELO ?? "—"}</td>
                      <td style={{ textTransform: "capitalize" }}>{r.VIDRIO ?? "—"}</td>
                      <td>{r.ANCHO ? `${r.ANCHO} cm` : "—"}</td>
                      <td>{r.ALTO  ? `${r.ALTO} cm`  : "—"}</td>
                      {revArtSlots.map(({ n, hasMargen }) => (
                        <>
                          <td key={`val${n}`}>{r[`valor${n}`] != null && r[`valor${n}`] !== "" ? formatPeso(r[`valor${n}`]) : "—"}</td>
                          {hasMargen && <td key={`mar${n}`}>{r[`margen${n}`] != null ? `${r[`margen${n}`]}%` : "—"}</td>}
                        </>
                      ))}
                      <td style={{ fontWeight: 700, color: "#0f2944" }}>{formatPeso(r.PRECIO)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <div className="form-actions" style={{ marginTop: "16px" }}>
              <button className="btn-cancel" onClick={() => setModalHistorial(false)}>Cerrar</button>
            </div>
          </Modal>
        );
      })()}

      {modal === "eliminar" && (
        <ConfirmDelete
          item={selected}
          onConfirm={onDelete}
          onClose={onCloseModal}
        />
      )}
    </>
  );
}
